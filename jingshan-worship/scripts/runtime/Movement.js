  function groundY(x, z) {
    if (FRONT_COURT) {
      const ax = Math.abs(x);
      const doorOffset = Math.abs(ax - FRONT_COURT.galleryX);
      const dz = Math.abs(z - FRONT_COURT.galleryZ);
      const halfDepth = FRONT_COURT.galleryDepth / 2;
      if (doorOffset < FRONT_COURT.doorWidth / 2 && dz < halfDepth + 2) {
        return dz <= halfDepth ? FRONT_COURT.floorY : FRONT_COURT.floorY * (halfDepth + 2 - dz) / 2;
      }
      if (z > FRONT_COURT.corridorFrontZ && z < FRONT_COURT.corridorBackZ - .30) {
        const edge = FRONT_COURT.corridorX - FRONT_COURT.corridorWidth / 2;
        const floor = FRONT_COURT.corridorFloorY;
        if (ax >= edge && ax < FRONT_COURT.corridorX + FRONT_COURT.corridorWidth / 2 - .30) return floor;
        if (ax > edge - 1.2 && ax < edge) return floor * (ax - edge + 1.2) / 1.2;
      }
    }
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
    // 前院两侧：钟鼓楼台基 + 连廊下层墙身，门洞位置来自场景布局。
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


  function updateMovement(dt, kneeling) {
    const kf = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const kt = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
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

    return hallNow;
  }
