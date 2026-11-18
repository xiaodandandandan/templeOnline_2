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
  /* 前院两侧的静态碰撞盒（3D 侧是纯几何，未注册进 REG）。按 |x| 镜像使用。
   * 连廊墙身正中留门洞，钟楼台基与外部石阶按实体阻挡。 */
  const FRONT_WING = [
    { x0: 9.90, x1: 15.33, z0: -4.00, z1: 0.80 },   // 连廊下层墙身（靠主殿段）
    { x0: 17.87, x1: 23.30, z0: -4.00, z1: 0.80 },  // 连廊下层墙身（靠钟楼段）
    { x0: 23.15, x1: 29.00, z0: -6.55, z1: 3.35 },  // 钟鼓楼台基
  ];

  let mode = q.get('mode') === 'orbit' ? 'orbit' : 'thirdPerson';

  /* 滚轮缩放：从贴身第三人称一路拉远到全寺俯瞰 */
  const DIST_MIN = 3.6, DIST_HOME = 9.4, DIST_MAX = 340;
  /* 场景 OrbitControls 设了 minDistance = 12：每帧 update() 都会把球面半径钳回去。
   * 第三人称贴身机位（离注视点仅 3~5 m）会被它整帧弹回殿外，所以先记下原值，
   * 漫游时放开钳位，切回 orbit 观景再还原。 */
  const ORBIT_MIN_D = controls.minDistance, ORBIT_MAX_D = controls.maxDistance;
  function useOrbitLimits(on) {
    controls.minDistance = on ? ORBIT_MIN_D : 0;
    controls.maxDistance = on ? ORBIT_MAX_D : Infinity;
    /* 第三人称的机位完全由本运行时逐帧计算，OrbitControls.update() 仍会被
     * animate() 调用；若保留 damping，它每帧残留的球面增量会与 custom 机位
     * 互相拉扯，静止时表现为高频微抖（观感就是画面在"闪"）。 */
    controls.enableDamping = on;
  }
  let camDist = DIST_HOME, camDistTarget = DIST_HOME, lastNativeWheel = 0;
  let lastZoomSent = -1;
  /* 入殿自动贴身 / 出殿自动回位：只有“尚未手动缩放”时才接管 */
  let autoZoom = false;
  function applyWheel(deltaY) {
    const dy = Math.abs(deltaY) > 400 ? Math.sign(deltaY) * 400 : deltaY;
    autoZoom = false;
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
  /* 镜头环绕角：与人物朝向 A.yaw 解耦。拖拽水平移动改变它 → 镜头绕人物 360°
   * 环视（可看正脸/侧脸/背脸/全身）；方向键左右只改 A.yaw → 人物原地转身。
   * 两者分离后，镜头不再被人物朝向锁死在正后方。 */
  let camYaw = 0;
  /* 俯仰角分“当前值 / 目标值”两态：进出殿只改目标值，由每帧平滑收敛。
   * 原先直接对 pitch 赋值会在过门槛那一帧把机位瞬间抬高/压低，出现视角跳变。 */
  let pitch = 0.30, pitchTarget = 0.30;
  let kneelStart = 0;
  const KNEEL_MS = 3200;
  let lastFrame = 0;
  let nearHallId = null;
  let inHallId = null;          // 当前所在殿（殿内视角判定）
  let lastHall = null;          // 最近所在殿的几何数据：出殿后仍用于把机位平滑收回
  let hallBlend = 0;            // 殿内视角混合 0(院落)→1(殿内)，连续量，杜绝布尔跳变
  let hideCorridorPrev = false; // 连廊屋顶隐藏状态（滞回，防阈值闪烁）
  let cutOn = false;            // 剖视开关（24.8 / 23.2 双阈值迟滞，防屋顶闪现）
  let snapFrames = 0;           // 传送 / 取景后连续数帧让机位直接到位（不靠 lerp 收敛）
  const keys = Object.create(null);
  let remote = { forward: 0, turn: 0, strafe: 0, run: false };

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

  /** 殿内机位距离：由室内净宽/净深反推，保证相机落在室内盒内不穿墙 */
  function hallInteriorDist(b) {
    const iw = b.innerW || (b.inner.x1 - b.inner.x0);
    const id = b.innerD || (b.inner.z1 - b.inner.z0);
    // 净深不足 8 米（山门殿 / 配殿 / 廊庑）：纵深放不下长机位，改取短距 + 大偏角，
    // 向殿宽借空间（见 __AVATAR_UPDATE__ 里的 shallowHall 分支）
    if (id < 8) return clamp(id * 0.62, 3.6, 4.6);
    return clamp(Math.min(iw * 0.26, id * 0.62), 3.0, 7.4);
  }

  /** 所在殿宇（用于室内剖视与 HUD 提示），side_* 为四合院配殿。
   *  带迟滞：已在殿内时改用“外扩 0.55m”的盒判定离开。否则站在门槛 / 门洞
   *  正中的人只要前后挪 1cm，hallNow 就会逐帧 true/false 翻转 —— hallBlend 在
   *  0/1 之间反复摆动、剖视屋顶一帧隐藏一帧显示，整栋殿看起来就在频闪。 */
  let insideId = null;
  function insideHall(x, z) {
    const pad = insideId ? 0.55 : 0;
    for (let i = 0; i < REG.boxes.length; i++) {
      const b = REG.boxes[i], r = b.inner;
      if (x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad) {
        insideId = b.id;
        return b;
      }
    }
    insideId = null;
    return null;
  }

  function blocked(x, z) {
    if (Math.abs(x) > 29 || z > L.maxZ || z < L.minZ) return true;
    // 前院两侧：钟鼓楼台基 + 连廊下层墙身。墙身正中留出门洞（|x|=16.6±1.3），
    // 进后院只能从门洞穿过，与 3D 侧的洞口尺寸一致。
    {
      const ax = Math.abs(x);
      for (let i = 0; i < FRONT_WING.length; i++) {
        const w = FRONT_WING[i];
        if (ax > w.x0 && ax < w.x1 && z > w.z0 && z < w.z1) return true;
      }
    }
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
      // 殿内实体（佛坛 / 供案 / 经柜）：不可穿行，只能绕到两侧拜道
      const blocks = REG.boxes[i].blocks || [];
      for (let j = 0; j < blocks.length; j++) {
        const w = blocks[j];
        if (x > w.x0 - 0.30 && x < w.x1 + 0.30 && z > w.z0 - 0.30 && z < w.z1 + 0.30)
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
    /* 两套输入并存：
     *   · 键盘 WASD / 方向键：前后推进 + 左右原地转身（桌面习惯）
     *   · 虚拟摇杆：strafe/forward 是 -1~1 的屏幕向量，按镜头朝向换算成世界位移，
     *     前后左右都能平移，人物自动转向行进方向；推杆幅度即速度，松手即停。
     * 摇杆有效时让出左右转身，避免两种输入争朝向。 */
    const jx = kneeling ? 0 : clamp(remote.strafe || 0, -1, 1);
    const jy = kneeling ? 0 : clamp(remote.forward || 0, -1, 1);
    const jmag = Math.min(1, Math.hypot(jx, jy));
    const joyOn = jmag > 0.08;
    const forward = kneeling || joyOn ? 0 : clamp(kf, -1, 1);
    const turn = kneeling ? 0 : clamp(kt + (joyOn ? 0 : (remote.turn || 0)), -1, 1);
    const run = !!(keys.ShiftLeft || keys.ShiftRight || remote.run);

    // 入殿判定放在移动之前：殿内减速 + 机位贴身都依赖它
    const hallNow = insideHall(A.x, A.z);
    A.yaw += turn * (hallNow ? 1.5 : 1.9) * dt;
    A.moving = false;
    if (joyOn) {
      // 镜头前方为“上”：forwardVec = (sin camYaw, 0, -cos camYaw)，右向为其绕 Y 轴 -90°
      const dx = Math.sin(camYaw) * jy + Math.cos(camYaw) * jx;
      const dz = -Math.cos(camYaw) * jy + Math.sin(camYaw) * jx;
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len, uz = dz / len;
      // 人物转向行进方向（指数平滑，帧率无关）；yaw = 0 时面朝 -Z
      const want = Math.atan2(ux, -uz);
      const diff = Math.atan2(Math.sin(want - A.yaw), Math.cos(want - A.yaw));
      A.yaw += diff * Math.min(1, dt * 12);
      const base = run ? (hallNow ? 6.2 : 10.5) : (hallNow ? 3.4 : 5.8);
      const step = base * jmag * dt;
      const nx = A.x + ux * step;
      const nz = A.z + uz * step;
      if (!blocked(nx, nz)) { A.x = nx; A.z = nz; A.moving = true; }
      else if (!blocked(nx, A.z)) { A.x = nx; A.moving = true; }   // 斜向撞墙时沿墙滑，不掉速
      else if (!blocked(A.x, nz)) { A.z = nz; A.moving = true; }
    } else if (!kneeling && Math.abs(forward) > 0.02) {
      A.moving = true;
      // 殿内步速降到 3.4：原速在 11 米进深的殿里一步跨过整排蒲团
      const speed = (run ? (hallNow ? 6.2 : 10.5) : (hallNow ? 3.4 : 5.8)) * forward;
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

    /* 入殿判定：进门只更新“目标机位”，不再瞬移。
     * 原先 snapFrames=6 让 position.lerp 系数=1，在过门槛那一帧把相机直接
     * 拽到殿内 → 视角突然跳一下。现在 camDist / pitch / fov 全部逐帧平滑
     * 收敛到目标，进出殿是连贯推拉镜头；室内净空钳制保证过渡期不穿墙。 */
    if (hallNow && hallNow.id !== inHallId) {
      inHallId = hallNow.id;
      lastHall = hallNow;                          // 缓存几何：出殿过渡期仍需它的净空盒
      autoZoom = true;
      camDistTarget = hallInteriorDist(hallNow);   // 每殿按自身尺度取景，不继承上一殿
      pitchTarget = Math.min(pitchTarget, 0.16);   // 殿内近水平：佛头完整入画、梁下留空间
    } else if (!hallNow && inHallId) {
      inHallId = null;
      if (autoZoom) { camDistTarget = DIST_HOME; autoZoom = false; }
      pitchTarget = Math.max(pitchTarget, 0.30);   // 出殿回到俯视游园视角
      // lastHall 不清空：hallBlend 归零过程中还要借它的净空盒约束相机
    }
    // 殿内视角连续混合：目标由 hallNow 决定，实际值逐帧平滑，进出殿无跳变
    hallBlend += ((hallNow ? 1 : 0) - hallBlend) * Math.min(1, dt * 3.2);
    if (hallBlend < 0.001) hallBlend = 0;
    window.__HALL_BLEND__ = +hallBlend.toFixed(3);   // 验收钩子：诊断进出殿过渡

    // 第三人称相机：滚轮拉远时抬高俯角并把注视点移向全寺中心，形成完整鸟瞰
    camDist += (camDistTarget - camDist) * Math.min(1, dt * 6.5);
    // 俯仰向目标平滑（用户拖拽时两者已同步，此收敛对拖拽无副作用）
    pitch += (pitchTarget - pitch) * Math.min(1, dt * 4.5);
    const zp = clamp((camDist - DIST_HOME) / (DIST_MAX - DIST_HOME), 0, 1);
    const effPitch = clamp(pitch + zp * 0.95, 0.06, 1.35);
    // 相机环绕用 camYaw（镜头绕人物转），与人物朝向 A.yaw 解耦；
    // 上面行走方向仍用 A.yaw：人朝自己面向的方向走，与镜头环绕互不干扰。
    forwardVec.set(Math.sin(camYaw), 0, -Math.cos(camYaw));
    /* 两套机位连续混合，进出殿不再跳变：
     *   院落机位 = 人物正后方，视线随俯角抬高（俯瞰游园）；
     *   殿内机位 = 略高于头顶 + 侧后偏角，视线近水平（看佛坛）。
     * hallBlend 0→1 在两者间插值；浅殿判定沿用 lastHall，出殿过渡期数据不丢。 */
    const shallowHall = !!lastHall && (lastHall.innerD || 99) < 8;
    const back = camDist * Math.cos(effPitch);
    // A. 院落第三人称机位
    const outX = A.x + forwardVec.x * -back;
    const outZ = A.z + forwardVec.z * -back;
    const outY = A.y + 2.10 + camDist * Math.sin(effPitch);
    // B. 殿内过肩机位：人物偏左、主尊居中；浅殿走更大偏角向殿宽借空间
    const yawC = camYaw + (shallowHall ? 0.45 : 0.50);
    const inX = A.x - Math.sin(yawC) * back;
    const inZ = A.z + Math.cos(yawC) * back;
    const inY = A.y + 2.10 + camDist * Math.sin(effPitch) * 0.50;
    camTarget.set(
      outX + (inX - outX) * hallBlend,
      outY + (inY - outY) * hallBlend,
      outZ + (inZ - outZ) * hallBlend,
    );
    // 室内净空钳制：强度随 hallBlend，过渡期逐步生效、出殿逐步解除，杜绝穿墙也不瞬移
    if (lastHall && hallBlend > 0.001) {
      const ir = lastHall.inner;
      const pad = shallowHall ? 0.90 : 0.55;
      const topY = (lastHall.ceilY !== undefined ? lastHall.ceilY : lastHall.floorY + 8) - 0.30;
      // 后边界退到前墙内皮以内 1.0 m：避免相机贴在墙板厚度里被素白墙占满屏
      const zBack = ir.z1 - Math.max(pad, 1.0);
      const cx = clamp(camTarget.x, ir.x0 + pad, ir.x1 - pad);
      const cz = clamp(camTarget.z, ir.z0 + pad, zBack);
      const cy = clamp(camTarget.y, lastHall.floorY + 1.00, Math.max(lastHall.floorY + 1.60, topY));
      camTarget.set(
        camTarget.x + (cx - camTarget.x) * hallBlend,
        camTarget.y + (cy - camTarget.y) * hallBlend,
        camTarget.z + (cz - camTarget.z) * hallBlend,
      );
      window.__CAM_TGT__ = { x: +camTarget.x.toFixed(2), z: +camTarget.z.toFixed(2), hall: lastHall.id };
    } else {
      window.__CAM_TGT__ = null;
    }
    // 跟随系数按 dt 归一：低帧率（软件渲染 ~6fps）时不会掉在人物身后十几米
    camera.position.lerp(camTarget, snapFrames > 0 ? 1 : 1 - Math.exp(-dt * 14));
    if (snapFrames > 0) snapFrames--;
    // 注视点高度 / 前推量随 hallBlend 插值：殿内抬到主尊胸口并前推，人物落画面下部、佛坛完整入画
    // 浅殿进深不足，前推量收到 3.2；院落维持 1.55 / 5.0。连续过渡，无跳变。
    const lookUp = 1.55 + ((shallowHall ? 2.25 : 2.45) - 1.55) * hallBlend;
    const lookAhead = 5.0 + ((shallowHall ? 3.2 : 5.5) - 5.0) * hallBlend;
    lookTarget.set(A.x, A.y + lookUp - k * 0.22, A.z)
      .addScaledVector(forwardVec, lookAhead);
    lookTarget.lerp(TEMPLE_CENTER, zp * 0.92);
    camera.lookAt(lookTarget);
    /* OrbitControls.update() 在 __AVATAR_UPDATE__ 之前执行，且 `enabled = false`
     * 也照样跑：它会把相机拉回 minDistance 球面并把视线拽向旧 target。
     * 漫游时放开钳位、把 target 同步到当前注视点，让 update() 退化成恒等变换。 */
    useOrbitLimits(false);
    controls.target.copy(lookTarget);
    /* 殿内换广角：40° 长焦在 11 米进深的殿里只框得下壁画局部，
     * 拉到 70° 才能同时看到佛坛、侧墙柱列与梁下空间。
     * 目标 FOV 由 hallBlend 连续插值（而非布尔切换），进出殿透视平滑变化。 */
    const fovTarget = 40 + ((shallowHall ? 68 : 70) - 40) * hallBlend;
    if (Math.abs(camera.fov - fovTarget) > 0.05) {
      camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-dt * 4));
      camera.updateProjectionMatrix();
    }
    controls.autoRotate = false;
    window.__ZOOM_DIST__ = +camDist.toFixed(1);
    if (!kneeling && kneelStart && marker.visible) marker.visible = false;

    /* 剖视分级：
     *   镜头贴身站在殿内 → 只留天花与前墙（真实室内，抬头见梁、回头见板壁）
     *   拉远越过 24 → 屋顶 / 天花 / 前墙一起掀开，俯瞰直接看进殿内
     * 阈值带 1.6m 迟滞：滚轮停在 24 附近微调时不会一帧掀盖、一帧盖回，
     * 否则整片屋顶会在眼前高频闪现。 */
    if (camDist > 24.8) cutOn = true;
    else if (camDist < 23.2) cutOn = false;
    const cutId = hallNow && cutOn ? hallNow.id : null;
    window.__CUTAWAY_ID__ = cutId || null;
    window.__IN_HALL__ = hallNow ? hallNow.id : null;
    const CEIL = REG.ceilings || {}, FRONT = REG.fronts || {};
    Object.keys(REG.roofs).forEach((id) => {
      const hide = id === cutId;
      REG.roofs[id].visible = !hide;
      if (CEIL[id]) CEIL[id].visible = !hide;
      if (FRONT[id]) FRONT[id].visible = !hide;
    });
    /* 连廊屋顶不属于任何殿的剖视组：人一旦进殿（贴身视角），相邻抄手廊 /
     * 转角廊的瓦顶就会从室内墙面穿模进来。这里紧跟 hallNow（区域布尔判定，
     * 不依赖帧率）——进殿即隐藏、出殿即恢复；俯瞰掀盖时照常显示。 */
    const CR = REG.corridorRoofs || [];
    const hideCorridor = !!hallNow && !cutOn;
    if (CR.length && hideCorridor !== hideCorridorPrev) {
      CR.forEach(r => { r.visible = !hideCorridor; });
      hideCorridorPrev = hideCorridor;
    }

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
