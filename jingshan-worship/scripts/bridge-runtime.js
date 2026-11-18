/* =========================================================================
 * 3D 运行时桥：组织人物、动画、移动与镜头模块
 * 由 scripts/sync-temple.mjs 注入到 three.js 单文件场景的 bootstrap() 作用域末尾。
 * 可直接访问 T / scene / camera / controls / modelRoot / natureRoot /
 * views / goView / tween / dusk 等场景内部变量，不必改动原场景源码。
 *
 * 分层约定：3D 层只负责渲染、相机、人物、碰撞与投影数学；
 *          所有业务 UI、状态、路由都由宿主 Vue 应用承担。
 * 每帧由场景 animate() 中的 window.__AVATAR_UPDATE__(now) 钩子驱动。
 * ========================================================================= */
;(function templeBridge() {
  const CHANNEL = 'JINGSHAN_TEMPLE';
  const VERSION = 2;
  /** 由 sync 脚本从 src/domain/hall.ts 提取，保证几何数据单一真源 */
  const HALLS = /*__HALLS__*/ [];
  const q = new URLSearchParams(location.search);
  const embed = q.has('embed');

  if (embed) {
    const css = document.createElement('style');
    css.textContent =
      '.ui,h1,.desc,#labels,#loading{display:none !important}' +
      'html,body{margin:0;overflow:hidden;background:#cfe3f0}';
    document.head.appendChild(css);
  }

  const send = (payload) => {
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage(
      { __channel: CHANNEL, version: VERSION, kind: 'evt', payload },
      '*',
    );
  };
  const stats = () => window.__MODEL_STATS__ || { meshes: 0, tris: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /** 由 3D 几何产出的室内注册表：碰撞 / 踏地 / 剖视 / 预留锚点 */
  const REG = window.__INTERIOR__ || { boxes: [], roofs: {}, anchors: [] };
  /** 由 3D 布局表下发的世界尺度：殿距 / 池 / 台地 / 相机中心，避免两份坐标 */
  const L = window.__LAYOUT__ || {
    centerZ: -88, pondFront: -141.5, pondBack: -154.5,
    terraceFront: -156, terracePlateZ: -159, stairEndZ: -165,
    minZ: -204, maxZ: 27,
  };
  /* 前院两侧的静态碰撞盒（3D 侧是纯几何，未注册进 REG）。按 |x| 镜像使用。
   * 连廊墙身正中留门洞，钟楼台基与外部石阶按实体阻挡。 */
  const FRONT_COURT = window.__FRONT_COURT__;
  const FRONT_WING = FRONT_COURT ? FRONT_COURT.blockers : [];

  let mode = q.get('mode') === 'orbit' ? 'orbit' : 'thirdPerson';

  /*__CAMERA__*/

  /*__AVATAR__*/
  /*__ANIMATION__*/

  /** 检视钩子：供验收 / 换装工具读取人物根节点与跪拜进度（无 UI 入口） */
  window.__AVATAR__ = avatar;
  window.__CAM__ = camera;   // 验收：读取实际机位，核对殿内视角是否落在室内盒内
  // 验收：软件渲染时 rAF 会掉帧，截图前手动驱动一帧渲染
  window.__RENDER_ONCE__ = function () { renderer.render(scene, camera); };
  window.__KNEEL_P__ = 1;

  /* 当前交互殿宇的地面光圈 */
  const marker = new T.Group();
  const ring = new T.Mesh(
    new T.RingGeometry(1.15, 1.52, 48),
    new T.MeshBasicMaterial({
      color: 0xd9b45f, transparent: true, opacity: 0.82,
      side: T.DoubleSide, depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  marker.add(ring);
  marker.visible = false;
  scene.add(marker);

  /* ---------------------------------------------------------------------
   * B. 人物状态、地形与碰撞
   * ------------------------------------------------------------------- */
  const A = { x: 0, y: 0, z: 18, yaw: 0, moving: false };
  let kneelStart = 0;
  const KNEEL_MS = 3200;
  let lastFrame = 0;
  let nearHallId = null;
  const keys = Object.create(null);
  let remote = { forward: 0, turn: 0, strafe: 0, run: false };

  /*__MOVEMENT__*/

  function nearestHall() {
    let best = null, bd = Infinity;
    for (let i = 0; i < HALLS.length; i++) {
      const h = HALLS[i];
      const dx = Math.max(0, Math.abs(A.x - h.x) - h.width / 2);
      const dz = Math.max(0, Math.abs(A.z - h.z) - h.depth / 2);
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bd) { bd = d; best = h; }
    }
    return { hall: best, distance: bd };
  }

  function avatarState() {
    const near = nearestHall();
    return {
      x: +A.x.toFixed(2), y: +A.y.toFixed(2), z: +A.z.toFixed(2),
      yaw: +A.yaw.toFixed(3), moving: A.moving,
      nearHallId: near.distance < 10 ? near.hall.id : null,
      distance: +near.distance.toFixed(2),
      onTerrace: A.y > 3, mode,
      insideHallId: (insideHall(A.x, A.z) || {}).id || null,
      zoom: +camDist.toFixed(1),
    };
  }

  function setMarker(hallId) {
    const h = HALLS.find((x) => x.id === hallId);
    if (!h) return;
    // 光圈落在人物脚下（殿前地面会在俯视时与头部重叠成像“光环”）
    marker.position.set(A.x, A.y + 0.05, A.z);
    marker.visible = true;
  }

  function teleport(hallId) {
    const h = HALLS.find((x) => x.id === hallId);
    if (!h) return;
    A.x = h.x;
    A.z = h.z + h.depth / 2 + 8;
    A.y = groundY(A.x, A.z);
    A.yaw = 0; camYaw = 0;
    setMarker(hallId);
    send({ evt: 'avatar', ...avatarState() });
    send({ evt: 'teleported', hallId });
  }

  function interact(hallId) {
    const id = hallId || avatarState().nearHallId;
    if (!id) return;
    // 参考山寺法堂：人在殿内时吸附到最近蒲团并面朝主尊，再开始跪拜
    const here = insideHall(A.x, A.z);
    if (here) {
      let best = null, bd = Infinity;
      for (let i = 0; i < REG.anchors.length; i++) {
        const a = REG.anchors[i];
        if (a.kind !== 'cushion' || a.hallId !== here.id) continue;
        const d = (a.x - A.x) * (a.x - A.x) + (a.z - A.z) * (a.z - A.z);
        if (d < bd) { bd = d; best = a; }
      }
      if (best && bd < 64) {
        A.x = best.x; A.z = best.z; A.y = groundY(A.x, A.z);
        if (typeof best.yaw === 'number') { A.yaw = best.yaw; camYaw = best.yaw; }
        window.__SEAT__ = { hallId: here.id, seat: best.seat || 0 };
      }
    }
    kneelStart = performance.now();
    setMarker(id);
    send({ evt: 'interaction', hallId: id, kind: 'kneel' });
  }

  /* ---------------------------------------------------------------------
   * C. 输入：iframe 内键盘 + 宿主下发的持续移动指令
   * ------------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); interact(); }
    if (e.code === 'KeyR') teleport('tianwang');
  });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });

  let dragging = false, lastX = 0, lastY = 0, dragDist = 0;
  const canvas = renderer.domElement;
  /* 移动端：关闭浏览器默认的手势缩放/滚动，改由这里接管双指捏合 */
  canvas.style.touchAction = 'none';
  /* 追踪在屏指针：单指转向、双指捏合缩放（与地图应用手感一致） */
  const pointers = new Map();
  let pinchSpan = 0;
  const spanOf = () => {
    const pts = [...pointers.values()];
    return pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
  };
  /* 双指比例缩放：捏合(间距变小)→ 拉远俯瞰；张开(变大)→ 拉近 */
  function applyPinch(ratio) {
    autoZoom = false;
    camDistTarget = clamp(camDistTarget * ratio, DIST_MIN, DIST_MAX);
    lastNativeWheel = performance.now();
  }
  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* 忽略捕获失败 */ }
    if (pointers.size === 1) {
      dragging = true; lastX = e.clientX; lastY = e.clientY; dragDist = 0;
    } else if (pointers.size === 2) {
      dragging = false;                 // 双指时停用单指转向
      pinchSpan = spanOf();
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) {
      const span = spanOf();
      if (span > 4 && pinchSpan > 4) applyPinch(pinchSpan / span);
      pinchSpan = span;
      dragDist = 99;                     // 抬指后不触发射线拾取
      return;
    }
    if (!dragging || mode !== 'thirdPerson') return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    dragDist += Math.abs(dx) + Math.abs(dy);
    // 镜头环绕式拖拽：右拖 → 镜头绕人物向右环绕（camYaw 增大）。
    // 人物朝向 A.yaw 不受影响，因此拖动时人物保持面向原方向，可绕其 360° 看正脸/侧脸/背脸。
    camYaw += dx * 0.0045;
    // 用户主动拖拽是即时意图：当前值与目标值同步改，避免被平滑拉回
    pitch = pitchTarget = clamp(pitchTarget + dy * 0.0025, 0.06, 0.72);
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchSpan = 0;
    if (pointers.size === 1) {
      const p = [...pointers.values()][0];
      dragging = true; lastX = p.x; lastY = p.y;   // 剩一指时恢复转向
    } else if (pointers.size === 0) {
      dragging = false;
    }
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);

  /* 滚轮缩放：向下滚拉远（直到全寺俯瞰），向上滚拉近 */
  window.addEventListener('wheel', (e) => {
    if (mode !== 'thirdPerson') return;
    e.preventDefault();
    lastNativeWheel = performance.now();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    applyWheel(e.deltaY * unit);
  }, { passive: false });

  /* 点击（非拖拽）射线拾取殿宇 */
  const raycaster = new T.Raycaster();
  const ndc = new T.Vector2();
  canvas.addEventListener('click', (e) => {
    if (dragDist > 6) return;
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(modelRoot, true)[0];
    if (!hit) return;
    const p = hit.point;
    let picked = null, best = Infinity;
    HALLS.forEach((h) => {
      const dx = Math.max(0, Math.abs(p.x - h.x) - h.width / 2 - 2);
      const dz = Math.max(0, Math.abs(p.z - h.z) - h.depth / 2 - 3);
      const score = dx * dx + dz * dz;
      if (score < best) { best = score; picked = h; }
    });
    if (picked && best < 900) send({ evt: 'hallPicked', hallId: picked.id });
  });

  /* ---------------------------------------------------------------------
   * D. 每帧更新：移动 / 动画 / 第三人称相机（在 controls.update 之后执行）
   * ------------------------------------------------------------------- */
  window.__AVATAR_UPDATE__ = function updateAvatar() {
    if (mode !== 'thirdPerson') return;
    // 统一用 performance.now()：iframe 的 rAF timestamp 与自身 timeOrigin 可能相差数秒，
    // 用它计算跪拜进度会导致动作刚触发就被判定为结束。
    const stamp = performance.now();
    const dt = lastFrame ? Math.min(0.25, Math.max(0.001, (stamp - lastFrame) / 1000)) : 0.016;
    lastFrame = stamp;

    // 跪拜期间锁定移动与转向，动作结束后自动恢复
    const kneelP = kneelStart ? clamp((stamp - kneelStart) / KNEEL_MS, 0, 1) : 1;
    window.__KNEEL_P__ = kneelP;
    const kneeling = kneelP < 1;
    const hallNow = updateMovement(dt, kneeling);

    const k = updateAnimation(stamp, kneelP, kneeling);

    updateCamera(dt, hallNow, k);
    if (!kneeling && kneelStart && marker.visible) marker.visible = false;

    // 附近殿宇变化时才发事件，避免每帧噪声
    const state = avatarState();
    if (state.nearHallId !== nearHallId) {
      nearHallId = state.nearHallId;
      send({ evt: 'hallNear', hallId: nearHallId, distance: state.distance });
    }
  };

  /* ---------------------------------------------------------------------
   * E. 定时回传：殿名归一化投影 + 人物状态 + 光圈脉动
   * ------------------------------------------------------------------- */
  const projected = new T.Vector3();
  /** 航拍攻略图标注的导览点：只在全寺俯瞰时由宿主叠加显示 */
  const GUIDE = (window.__SITE_PLAN__ || []).filter((g) => g.guide);
  const projectAt = (x, y, z) => {
    projected.set(x, y, z).project(camera);
    return {
      x: projected.x * 0.5 + 0.5,
      y: -projected.y * 0.5 + 0.5,
      visible:
        projected.z > -1 && projected.z < 1 &&
        Math.abs(projected.x) < 1.02 && Math.abs(projected.y) < 0.96,
    };
  };
  setInterval(() => {
    /* 这里原先会再调一次 __AVATAR_UPDATE__ 作"rAF 停摆兜底"。但它会顺手改写
     * lastFrame，使紧随其后的真实 rAF 拿到近乎为 0 的 dt：人物的步进、相机的
     * lerp、hallBlend 的收敛系数于是忽大忽小，运动中出现一顿一顿的高频顿挫。
     * 而 rAF 真停摆时（后台页）setInterval 同样被节流，兜底本身也无意义，故移除。 */
    const items = HALLS.map((h) => ({
      id: h.id, ...projectAt(h.x, h.baseY + h.height * 0.5 + 0.4, h.z),
    })).concat(GUIDE.map((g) => ({
      id: g.id, name: g.name, no: g.no, guide: true, ...projectAt(g.x, g.y, g.z),
    })));
    send({ evt: 'anchors', items });
    send({ evt: 'avatar', ...avatarState() });
    const zd = Math.round(camDist);
    if (zd !== lastZoomSent) {
      lastZoomSent = zd;
      send({ evt: 'zoom', distance: +camDist.toFixed(1), overview: camDist > 150 });
    }
    if (marker.visible) {
      const t = performance.now() * 0.002;
      ring.scale.setScalar(1 + Math.sin(t) * 0.07);
      ring.material.opacity = 0.7 + Math.sin(t * 1.4) * 0.16;
    }
  }, 120);

  /* ---------------------------------------------------------------------
   * F. 宿主命令
   * ------------------------------------------------------------------- */
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.__channel !== CHANNEL || d.version !== VERSION || d.kind !== 'cmd') return;
    const p = d.payload || {};
    try {
      switch (p.cmd) {
        case 'setMode': {
          mode = p.mode === 'orbit' ? 'orbit' : 'thirdPerson';
          controls.enabled = mode === 'orbit';
          useOrbitLimits(mode === 'orbit');
          if (mode === 'thirdPerson') {
            controls.autoRotate = false;
            lastFrame = 0;
          } else {
            avatar.visible = true;
            const CEIL0 = REG.ceilings || {}, FRONT0 = REG.fronts || {};
            Object.keys(REG.roofs).forEach((id) => {
              REG.roofs[id].visible = true;
              if (CEIL0[id]) CEIL0[id].visible = true;
              if (FRONT0[id]) FRONT0[id].visible = true;
            });
            // orbit 俯瞰：连廊屋顶一并恢复显示
            (REG.corridorRoofs || []).forEach(r => { r.visible = true; });
            hideCorridorPrev = false;
            hallBlend = 0;
            goView('axis');
          }
          send({ evt: 'modeChanged', mode });
          break;
        }
        case 'setMove':
          remote = {
            forward: clamp(Number(p.forward) || 0, -1, 1),
            turn: clamp(Number(p.turn) || 0, -1, 1),
            strafe: clamp(Number(p.strafe) || 0, -1, 1),
            run: !!p.run,
          };
          break;
        case 'wheel':
          // 宿主把 HUD 上的滚轮转交进来；iframe 原生滚轮后 80ms 内忽略，避免重复缩放
          if (performance.now() - lastNativeWheel > 80) applyWheel(Number(p.delta) || 0);
          break;
        case 'setZoom':
          if (p.distance === 'overview') camDistTarget = DIST_MAX;
          else if (p.distance === 'close') camDistTarget = DIST_HOME;
          else camDistTarget = clamp(Number(p.distance) || DIST_HOME, DIST_MIN, DIST_MAX);
          break;
        case 'teleport':
          teleport(p.hallId);
          break;
        case 'snapCam':
          snapFrames = 4;   // 连续 4 帧直贴目标，避开首帧判定抖动
          break;
        case 'placeAt':
          // 验收 / 导览用：直接把人放到世界坐标（殿内取景、锚点核对）
          A.x = Number(p.x) || 0;
          A.z = Number(p.z) || 0;
          A.y = groundY(A.x, A.z);
          if (typeof p.yaw === 'number') { A.yaw = p.yaw; camYaw = p.yaw; }
          lastFrame = 0;
          send({ evt: 'avatar', ...avatarState() });
          break;
        case 'interact':
          interact(p.hallId);
          break;
        case 'resetAvatar':
          A.x = 0; A.z = 18; A.y = 0; A.yaw = 0; camYaw = 0; kneelStart = 0;
          marker.visible = false;
          remote = { forward: 0, turn: 0, strafe: 0, run: false };
          send({ evt: 'avatar', ...avatarState() });
          break;
        case 'previewAvatar': {
          // 检视用：无 UI 入口，仅在开发/验收时把机位切到人物正面观察造型
          mode = 'orbit';
          controls.enabled = false;
          controls.autoRotate = false;
          useOrbitLimits(true);
          kneelStart = 0;
          body.position.set(0, 1.38, 0);
          body.rotation.set(0, Math.PI, 0);
          lower.position.set(0, 1.38, 0);
          lower.rotation.set(0, Math.PI, 0);
          head.rotation.set(0, 0, 0);
          [...legs, ...arms, ...knees, ...elbows].forEach((joint) => joint.rotation.copy(joint.userData.restRotation));
          avatar.position.set(0, 0, 18);
          avatar.rotation.y = 0;
          camera.position.set(0, 2.1, 23.4);
          controls.target.set(0, 1.45, 18);
          camera.lookAt(controls.target);
          send({ evt: 'avatarPreview' });
          break;
        }
        case 'setView':
          if (views[p.view]) {
            mode = 'orbit';
            controls.enabled = true;
            useOrbitLimits(true);
            goView(p.view);
            send({ evt: 'viewChanged', view: p.view });
            send({ evt: 'modeChanged', mode });
          }
          break;
        case 'focusHall':
          teleport(p.hallId);
          break;
        case 'setTrees':
          natureRoot.visible = !!p.on;
          break;
        case 'setRotate':
          controls.autoRotate = !!p.on && mode === 'orbit';
          break;
        case 'setDusk':
          if (dusk !== !!p.on) document.getElementById('tg-light').click();
          break;
        case 'setWireframe': {
          const on = !!p.on;
          const seen = new Set();
          modelRoot.traverse((o) => {
            if (!o.material) return;
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
              if (!seen.has(m.uuid)) {
                seen.add(m.uuid);
                if ('wireframe' in m) m.wireframe = on;
              }
            });
          });
          break;
        }
        case 'reset':
          A.x = 0; A.z = 18; A.y = 0; A.yaw = 0; camYaw = 0; kneelStart = 0;
          marker.visible = false;
          goView('front');
          send({ evt: 'viewChanged', view: 'front' });
          break;
        case 'exportGlb':
          document.getElementById('btn-export').click();
          break;
        case 'getStats':
          send({ evt: 'stats', stats: stats() });
          break;
      }
    } catch (err) {
      send({ evt: 'error', message: String(err) });
    }
  });

  /* WebGL 上下文丢失/恢复：手机切后台、内存回收或 GPU 复位时会触发。
   * 丢失时阻止默认行为以便浏览器尝试自动恢复，并通知宿主切到静态兜底图；
   * 恢复后重新同步尺寸并通知宿主回到 3D，避免永久白屏/卡死。 */
  const glCanvas = renderer.domElement;
  glCanvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    send({ evt: 'webgl', state: 'lost' });
  }, false);
  glCanvas.addEventListener('webglcontextrestored', () => {
    /* 复用场景里的尺寸同步：它会同时对齐 pixelRatio 与 container 实测尺寸，
     * 且不会把 canvas 的 CSS 尺寸写成 px（写 px 后与容器差 1px 就会重采样闪）。 */
    if (window.__SYNC_SIZE__) window.__SYNC_SIZE__();
    send({ evt: 'webgl', state: 'restored' });
  }, false);

  if (mode === 'thirdPerson') controls.enabled = false;
  useOrbitLimits(mode === 'orbit');
  window.__TEMPLE_BRIDGE_READY__ = true;
  send({ evt: 'avatar', ...avatarState() });
  setTimeout(() => {
    send({ evt: 'ready', stats: stats(), view: 'axis', mode, avatar: avatarState() });
    send({ evt: 'modeChanged', mode });
    // 室内锚点与各殿蒲团席位一次下发：后续挂佛像 / 蒲团 / 香炉直接消费
    send({ evt: 'interior', anchors: REG.anchors, seats: REG.seats || {} });
    send({ evt: 'zoom', distance: DIST_HOME, overview: false });
  }, 0);
})();
