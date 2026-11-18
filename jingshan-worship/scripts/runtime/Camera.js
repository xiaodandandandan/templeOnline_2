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


  /* 镜头环绕角：与人物朝向 A.yaw 解耦。拖拽水平移动改变它 → 镜头绕人物 360°
   * 环视（可看正脸/侧脸/背脸/全身）；方向键左右只改 A.yaw → 人物原地转身。
   * 两者分离后，镜头不再被人物朝向锁死在正后方。 */
  let camYaw = 0;
  /* 俯仰角分“当前值 / 目标值”两态：进出殿只改目标值，由每帧平滑收敛。
   * 原先直接对 pitch 赋值会在过门槛那一帧把机位瞬间抬高/压低，出现视角跳变。 */
  let pitch = 0.30, pitchTarget = 0.30;

  let inHallId = null;          // 当前所在殿（殿内视角判定）
  let lastHall = null;          // 最近所在殿的几何数据：出殿后仍用于把机位平滑收回
  let hallBlend = 0;            // 殿内视角混合 0(院落)→1(殿内)，连续量，杜绝布尔跳变
  let hideCorridorPrev = false; // 连廊屋顶隐藏状态（滞回，防阈值闪烁）
  let cutOn = false;            // 剖视开关（24.8 / 23.2 双阈值迟滞，防屋顶闪现）
  let snapFrames = 0;           // 传送 / 取景后连续数帧让机位直接到位（不靠 lerp 收敛）

  /** 殿内机位距离：由室内净宽/净深反推，保证相机落在室内盒内不穿墙 */
  function hallInteriorDist(b) {
    const iw = b.innerW || (b.inner.x1 - b.inner.x0);
    const id = b.innerD || (b.inner.z1 - b.inner.z0);
    // 净深不足 8 米（山门殿 / 配殿 / 廊庑）：纵深放不下长机位，改取短距 + 大偏角，
    // 向殿宽借空间（见 __AVATAR_UPDATE__ 里的 shallowHall 分支）
    if (id < 8) return clamp(id * 0.62, 3.6, 4.6);
    return clamp(Math.min(iw * 0.26, id * 0.62), 3.0, 7.4);
  }


  const camTarget = new T.Vector3();
  const lookTarget = new T.Vector3();
  const forwardVec = new T.Vector3();
  const TEMPLE_CENTER = new T.Vector3(0, 2, L.centerZ);


  function updateCamera(dt, hallNow, k) {
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

  }
