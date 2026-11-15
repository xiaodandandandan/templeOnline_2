/* =========================================================================
 * 3D 运行时桥 + 我的世界（Minecraft）方块风格中性人物第三人称漫游（模板）
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

  let mode = q.get('mode') === 'orbit' ? 'orbit' : 'thirdPerson';

  /* 滚轮缩放：从贴身第三人称一路拉远到全寺俯瞰 */
  const DIST_MIN = 3.6, DIST_HOME = 9.4, DIST_MAX = 340;
  let camDist = DIST_HOME, camDistTarget = DIST_HOME, lastNativeWheel = 0;
  let lastZoomSent = -1;
  function applyWheel(deltaY) {
    const dy = Math.abs(deltaY) > 400 ? Math.sign(deltaY) * 400 : deltaY;
    camDistTarget = clamp(camDistTarget * Math.exp(dy * 0.00145), DIST_MIN, DIST_MAX);
  }

  /* ---------------------------------------------------------------------
   * A. 我的世界（Minecraft）风格方块人物
   *    头 / 躯干 / 双臂 / 双腿一律直角立方体，沿用 Steve 的 8:12:12 像素骨架
   *    （总高 32 px）；每个面贴 16×16 像素皮肤，NearestFilter 保留硬边像素，
   *    无球体、无圆角、无写实五官。中性青色上衣 + 蓝紫长裤，无第二性征。
   *    人物正面朝 -Z，与 yaw=0 的前进方向一致。
   * ------------------------------------------------------------------- */
  const PX = 0.085;                        // 1 像素 = 0.085 世界单位，总高 2.72
  const HEAD = 8 * PX, BODY_W = 8 * PX, BODY_D = 4 * PX, LIMB = 4 * PX;
  const SPAN = 12 * PX;                    // 躯干 / 四肢长度

  /** 16×16 像素皮肤贴图：最近邻采样、无 mipmap，保证放大后仍是硬方块像素 */
  function skinTex(paint) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 16;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    paint((x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); });
    const tex = new T.CanvasTexture(cv);
    tex.magFilter = T.NearestFilter;
    tex.minFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    if ('colorSpace' in tex && T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    else if ('encoding' in tex && T.sRGBEncoding) tex.encoding = T.sRGBEncoding;
    return tex;
  }
  const pxMat = (tex) => new T.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  const flat = (c) => skinTex((r) => r(0, 0, 16, 16, c));

  const SKIN = '#e8b98d', SKIN_D = '#c9976e', HAIR = '#5c3a22', HAIR_D = '#402718';
  const SHIRT = '#24a6a2', SHIRT_D = '#177d7c', PANTS = '#39429c', PANTS_D = '#2a3176';
  const SHOE = '#303038';

  /* 头部六面：-Z 为脸（BoxGeometry 材质序 +X,-X,+Y,-Y,+Z,-Z） */
  const FACE = skinTex((r) => {
    r(0, 0, 16, 16, SKIN);
    r(0, 0, 16, 6, HAIR);                                   // 齐刘海
    r(0, 6, 3, 2, HAIR_D); r(13, 6, 3, 2, HAIR_D);
    r(1, 1, 2, 2, HAIR_D); r(9, 2, 2, 2, HAIR_D);
    r(3, 6, 3, 1, HAIR_D); r(10, 6, 3, 1, HAIR_D);         // 眉
    r(3, 7, 4, 3, '#f6f0e2'); r(9, 7, 4, 3, '#f6f0e2');   // 眼白
    r(4, 8, 2, 2, '#3b3f8f'); r(10, 8, 2, 2, '#3b3f8f');  // 瞳
    r(4, 8, 1, 1, '#1b1c33'); r(10, 8, 1, 1, '#1b1c33');
    r(7, 9, 2, 3, SKIN_D);                                  // 鼻
    r(6, 12, 4, 1, '#7a4a3c'); r(7, 13, 2, 1, '#a86b52');  // 嘴
    r(0, 14, 2, 2, SKIN_D); r(14, 14, 2, 2, SKIN_D);
  });
  const HAIR_SIDE = skinTex((r) => {
    r(0, 0, 16, 16, SKIN);
    r(0, 0, 16, 6, HAIR); r(0, 6, 16, 2, HAIR_D);
    r(2, 2, 2, 2, HAIR_D); r(11, 3, 3, 2, HAIR_D);
    r(0, 12, 16, 4, SKIN_D);
  });
  const HAIR_TOP = skinTex((r) => {
    r(0, 0, 16, 16, HAIR);
    [[1, 2], [5, 1], [9, 4], [13, 7], [3, 11], [8, 13], [14, 12]]
      .forEach(p => r(p[0], p[1], 2, 2, HAIR_D));
    r(0, 14, 16, 2, HAIR_D);
  });
  const M_HEAD = [HAIR_SIDE, HAIR_SIDE, HAIR_TOP, SKIN, HAIR_SIDE, FACE].map((t) =>
    pxMat(typeof t === 'string' ? flat(t) : t));

  /* 躯干：正面衣襟 / 背面 / 侧面 / 顶底 */
  const TORSO_F = skinTex((r) => {
    r(0, 0, 16, 16, SHIRT);
    r(0, 0, 16, 2, SHIRT_D); r(5, 0, 6, 2, SKIN);          // 领口
    r(0, 2, 2, 14, SHIRT_D); r(14, 2, 2, 14, SHIRT_D);
    r(0, 14, 16, 2, SHIRT_D);
    r(7, 4, 2, 8, '#2fbcb4');                               // 衣襟
  });
  const TORSO_B = skinTex((r) => {
    r(0, 0, 16, 16, SHIRT);
    r(0, 0, 16, 2, SHIRT_D); r(0, 14, 16, 2, SHIRT_D);
    r(0, 0, 2, 16, SHIRT_D); r(14, 0, 2, 16, SHIRT_D);
    r(7, 5, 2, 6, '#2fbcb4');
  });
  const M_TORSO = [flat(SHIRT_D), flat(SHIRT_D), flat(SHIRT), flat(SHIRT_D), TORSO_B, TORSO_F]
    .map(pxMat);

  /* 手臂：上半短袖、下半肤色；腿：蓝紫裤 + 深色鞋 */
  const ARM = skinTex((r) => {
    r(0, 0, 16, 16, SKIN);
    r(0, 0, 16, 5, SHIRT); r(0, 5, 16, 1, SHIRT_D);
    r(0, 0, 2, 5, SHIRT_D); r(14, 0, 2, 5, SHIRT_D);
    r(0, 14, 16, 2, SKIN_D);
  });
  const LEG = skinTex((r) => {
    r(0, 0, 16, 16, PANTS);
    r(0, 12, 16, 4, SHOE); r(0, 11, 16, 1, PANTS_D);
    r(0, 0, 2, 16, PANTS_D); r(14, 0, 2, 16, PANTS_D);
  });
  const M_ARM = [ARM, ARM, flat(SHIRT), flat(SKIN_D), ARM, ARM].map(pxMat);
  const M_LEG = [LEG, LEG, flat(PANTS), flat(SHOE), LEG, LEG].map(pxMat);

  /** 立方体部件：六面像素材质，直角硬边、可投影 */
  function cube(w, h, d, materials, x, y, z) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), materials);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  const avatar = new T.Group();
  const body = new T.Group();  // 上身：跪拜时下压 + 前俯
  const lower = new T.Group(); // 下身：只屈膝下蹲，不随上身前扑
  avatar.add(body);
  avatar.add(lower);

  // 躯干 8×12×4 px：y 1.02 → 2.04
  body.add(cube(BODY_W, SPAN, BODY_D, M_TORSO, 0, SPAN + SPAN / 2, 0));

  // 头 8³ px：y 2.04 → 2.72，绕自身中心转动
  const head = new T.Group();
  head.position.set(0, SPAN * 2 + HEAD / 2, 0);
  body.add(head);
  head.add(cube(HEAD, HEAD, HEAD, M_HEAD, 0, 0, 0));

  // 双臂 4×12×4 px：肩 pivot，可摆动 / 前伸撑地
  const arms = [];
  [-1, 1].forEach((s) => {
    const pivot = new T.Group();
    pivot.position.set(s * (BODY_W / 2 + LIMB / 2), SPAN * 2, 0);
    pivot.add(cube(LIMB, SPAN, LIMB, M_ARM, 0, -SPAN / 2, 0));
    body.add(pivot);
    arms.push(pivot);
  });

  // 双腿 4×12×4 px：髋 pivot
  const legs = [];
  [-1, 1].forEach((s) => {
    const pivot = new T.Group();
    pivot.position.set(s * LIMB / 2, SPAN, 0);
    pivot.add(cube(LIMB, SPAN, LIMB, M_LEG, 0, -SPAN / 2, 0));
    lower.add(pivot);
    legs.push(pivot);
  });

  // 方形脚影（不投影，避免俯瞰出现细长阴影）
  const shadow = new T.Mesh(
    new T.PlaneGeometry(1.2, 1.2),
    new T.MeshBasicMaterial({ color: 0x2b211c, transparent: true, opacity: 0.17, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  avatar.add(shadow);

  scene.add(avatar);

  /** 检视钩子：供验收 / 换装工具读取人物根节点与跪拜进度（无 UI 入口） */
  window.__AVATAR__ = avatar;
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
  let pitch = 0.30;
  let kneelStart = 0;
  const KNEEL_MS = 3200;
  let lastFrame = 0;
  let nearHallId = null;
  const keys = Object.create(null);
  let remote = { forward: 0, turn: 0, run: false };

  function groundY(x, z) {
    // 殿宇台基 / 室内地坪：高度直接来自几何注册表
    for (let i = 0; i < REG.boxes.length; i++) {
      const b = REG.boxes[i];
      if (Math.abs(x - b.x) < b.width / 2 && Math.abs(z - b.z) < b.depth / 2)
        return b.floorY;
    }
    // 跨锦鲤池石桥（池前后缘由布局表下发）
    if (z > L.pondBack && z < L.pondFront && Math.abs(x) <= 2.35) return 0.55;
    // 高台正面十二级踏道（台地前沿 → 台面，中央 x ±4.6）
    if (z < L.terraceFront && z > L.stairEndZ && Math.abs(x) <= 4.6) {
      return clamp(6 * (L.terraceFront - z) / (L.terraceFront - L.stairEndZ), 0, 6);
    }
    // 抬高台面
    if (z <= L.terracePlateZ && Math.abs(x) <= 23) return 6.06;
    return 0;
  }

  /** 所在殿宇（用于室内剖视与 HUD 提示），side_* 为四合院配殿 */
  function insideHall(x, z) {
    for (let i = 0; i < REG.boxes.length; i++) {
      const b = REG.boxes[i], r = b.inner;
      if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return b;
    }
    return null;
  }

  function blocked(x, z) {
    if (Math.abs(x) > 29 || z > L.maxZ || z < L.minZ) return true;
    // 锦鲤池水面：只留中央石桥
    if (z > L.pondBack && z < L.pondFront && Math.abs(x) > 2.35 && Math.abs(x) < 12.6) return true;
    // 台地侧壁不可攀爬
    if (z < L.terraceFront && z > L.terracePlateZ && Math.abs(x) > 4.6 && Math.abs(x) < 26) return true;
    // 殿宇墙体：由几何生成的矩形，前后中央券门留通道，室内完全可走
    const pad = 0.38;
    for (let i = 0; i < REG.boxes.length; i++) {
      const walls = REG.boxes[i].walls;
      for (let j = 0; j < walls.length; j++) {
        const w = walls[j];
        if (x > w.x0 - pad && x < w.x1 + pad && z > w.z0 - pad && z < w.z1 + pad)
          return true;
      }
    }
    return false;
  }

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
    // 光圈落在人物脚下（殿前地面会在俯视时与头部重叠成像「光环」）
    marker.position.set(A.x, A.y + 0.05, A.z);
    marker.visible = true;
  }

  function teleport(hallId) {
    const h = HALLS.find((x) => x.id === hallId);
    if (!h) return;
    A.x = h.x;
    A.z = h.z + h.depth / 2 + 8;
    A.y = groundY(A.x, A.z);
    A.yaw = 0;
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
        if (typeof best.yaw === 'number') A.yaw = best.yaw;
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
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; dragDist = 0;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging || mode !== 'thirdPerson') return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    dragDist += Math.abs(dx) + Math.abs(dy);
    // 视角转向式拖拽：右拖 → yaw 增大 → 人物/镜头向右转（与键盘 D、→ 一致）
    // 若要改成「场景随手动」的地图式拖拽，把这里换回 -dx 即可
    A.yaw += dx * 0.0045;
    pitch = clamp(pitch + dy * 0.0025, 0.06, 0.72);
  });
  window.addEventListener('pointerup', () => { dragging = false; });

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
  const camTarget = new T.Vector3();
  const lookTarget = new T.Vector3();
  const forwardVec = new T.Vector3();
  const TEMPLE_CENTER = new T.Vector3(0, 2, L.centerZ);

  window.__AVATAR_UPDATE__ = function updateAvatar() {
    if (mode !== 'thirdPerson') return;
    // 统一用 performance.now()：iframe 的 rAF timestamp 与自身 timeOrigin 可能相差数秒，
    // 用它计算跪拜进度会导致动作刚触发就被判定为结束。
    const stamp = performance.now();
    const dt = lastFrame ? Math.min(0.25, Math.max(0.001, (stamp - lastFrame) / 1000)) : 0.016;
    lastFrame = stamp;

    const kf = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const kt = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    // 跪拜期间锁定移动与转向，动作结束后自动恢复
    const kneelP = kneelStart ? clamp((stamp - kneelStart) / KNEEL_MS, 0, 1) : 1;
    window.__KNEEL_P__ = kneelP;
    const kneeling = kneelP < 1;
    const forward = kneeling ? 0 : clamp(kf + (remote.forward || 0), -1, 1);
    const turn = kneeling ? 0 : clamp(kt + (remote.turn || 0), -1, 1);
    const run = !!(keys.ShiftLeft || keys.ShiftRight || remote.run);

    A.yaw += turn * 1.9 * dt;
    A.moving = !kneeling && Math.abs(forward) > 0.02;
    if (A.moving) {
      const speed = (run ? 10.5 : 5.8) * forward;
      const nx = A.x + Math.sin(A.yaw) * speed * dt;
      const nz = A.z - Math.cos(A.yaw) * speed * dt;
      if (!blocked(nx, nz)) { A.x = nx; A.z = nz; }
      else A.moving = false;
    }

    // 地面高度平滑跟随（台基 / 石桥 / 踏道 / 高台）
    const gy = groundY(A.x, A.z);
    A.y += (gy - A.y) * Math.min(1, dt * 9);
    avatar.position.set(A.x, A.y, A.z);
    avatar.rotation.y = A.yaw;
    shadow.material.opacity = A.y > 3 ? 0.12 : 0.17;

    // 行走 / 跪拜动画：屈膝 → 俯身叩首 → 保持 → 起身复位（全程 3.2s）
    const t = stamp / 1000;
    const ease = (v) => v * v * (3 - 2 * v);
    const k = kneelP < 0.22 ? ease(kneelP / 0.22)
      : kneelP < 0.70 ? 1
      : 1 - ease((kneelP - 0.70) / 0.30);
    const b = ease(clamp((kneelP - 0.22) / 0.26, 0, 1))
      - ease(clamp((kneelP - 0.70) / 0.30, 0, 1));
    const swing = A.moving ? Math.sin(t * 9) : 0;

    body.position.y = (A.moving ? Math.abs(swing) * 0.05 : 0) - k * 0.34;
    lower.position.y = -k * 0.20;
    body.rotation.x = -b * 0.88;   // 方块人前俯过大会整块穿地，取深鞠躬角
    body.rotation.z = A.moving ? swing * 0.035 : 0;
    head.rotation.x = -b * 0.22;
    legs.forEach((leg, i) => {
      leg.rotation.x = kneeling ? -k * 1.15 : swing * (i ? -0.55 : 0.55);
    });
    arms.forEach((arm, i) => {
      arm.rotation.x = kneeling ? 0.35 * k + 1.15 * b : swing * (i ? -0.45 : 0.45);
      arm.rotation.z = kneeling ? (i ? 0.26 : -0.26) * k : (i ? -0.04 : 0.04);
    });

    // 第三人称相机：滚轮拉远时抬高俯角并把注视点移向全寺中心，形成完整鸟瞰
    camDist += (camDistTarget - camDist) * Math.min(1, dt * 6.5);
    const zp = clamp((camDist - DIST_HOME) / (DIST_MAX - DIST_HOME), 0, 1);
    const effPitch = clamp(pitch + zp * 0.95, 0.06, 1.35);
    forwardVec.set(Math.sin(A.yaw), 0, -Math.cos(A.yaw));
    camTarget.set(A.x, A.y, A.z)
      .addScaledVector(forwardVec, -camDist * Math.cos(effPitch))
      .add(new T.Vector3(0, 2.1 + camDist * Math.sin(effPitch), 0));
    camera.position.lerp(camTarget, 0.20);
    lookTarget.set(A.x, A.y + 1.55 - k * 0.22, A.z).addScaledVector(forwardVec, 5.0);
    lookTarget.lerp(TEMPLE_CENTER, zp * 0.92);
    camera.lookAt(lookTarget);
    controls.autoRotate = false;
    window.__ZOOM_DIST__ = +camDist.toFixed(1);
    if (!kneeling && kneelStart && marker.visible) marker.visible = false;

    // 室内剖视：人物入殿且镜头贴近时，隐藏该殿屋顶 / 天花 / 前墙
    const cutId = camDist < 46 ? (insideHall(A.x, A.z) || {}).id : null;
    window.__CUTAWAY_ID__ = cutId || null;
    Object.keys(REG.roofs).forEach((id) => { REG.roofs[id].visible = id !== cutId; });

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
    // 低频兜底：iframe 被浏览器节流 / rAF 停摆时人物仍可持续行走
    if (mode === 'thirdPerson' && window.__AVATAR_UPDATE__) {
      window.__AVATAR_UPDATE__(performance.now());
    }
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
          if (mode === 'thirdPerson') {
            controls.autoRotate = false;
            lastFrame = 0;
          } else {
            avatar.visible = true;
            Object.keys(REG.roofs).forEach((id) => { REG.roofs[id].visible = true; });
            goView('axis');
          }
          send({ evt: 'modeChanged', mode });
          break;
        }
        case 'setMove':
          remote = {
            forward: clamp(Number(p.forward) || 0, -1, 1),
            turn: clamp(Number(p.turn) || 0, -1, 1),
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
        case 'interact':
          interact(p.hallId);
          break;
        case 'resetAvatar':
          A.x = 0; A.z = 18; A.y = 0; A.yaw = 0; kneelStart = 0;
          marker.visible = false;
          remote = { forward: 0, turn: 0, run: false };
          send({ evt: 'avatar', ...avatarState() });
          break;
        case 'previewAvatar': {
          // 检视用：无 UI 入口，仅在开发/验收时把机位切到人物正面观察造型
          mode = 'orbit';
          controls.enabled = false;
          controls.autoRotate = false;
          kneelStart = 0;
          body.position.set(0, 0, 0);
          body.rotation.set(0, 0, 0);
          lower.position.set(0, 0, 0);
          head.rotation.set(0, 0, 0);
          legs.forEach((l) => l.rotation.set(0, 0, 0));
          arms.forEach((a) => a.rotation.set(0, 0, 0));
          avatar.position.set(0, 0, 18);
          avatar.rotation.y = Math.PI;
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
          A.x = 0; A.z = 18; A.y = 0; A.yaw = 0; kneelStart = 0;
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

  if (mode === 'thirdPerson') controls.enabled = false;
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
