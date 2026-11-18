const FRONT_COURT = {
  crossX: 19.6,   // 前院转角廊中心 |x|：随一进配殿外移 +1.5，内端 16.2
  laneX: 20.1,    // 抄手廊纵廊中心 |x|：外缘 21.5，恰在配殿出檐 22.3 之内
  laneW: 2.8,     // 廊宽
  z0: -10.7,      // 纵廊前端：接前院转角廊后缘，距山门后墙 3.5
  z1: -33.0,      // 纵廊后端：殿距由 28 拉到 44，随释迦前移 16，仍不接殿门
  turn: 2.6,      // 后端向内折的横廊长度，内端止于 |x| = 14.6
  linkZ: -41.1    // 第一进外移与第二进的错台处，加一段横向连廊接回
};

const CORRIDOR_LAYOUT = {
  outer: { x: 26.6, width: 5.2, length: 19.0, frontZ: 3.4,
    floorY: .60, columnHeight: 7.40, eaveY: 8.05 },
  gallery: { x: 15.8, z: PAVILION_LAYOUT.z, length: 10.6, depth: 4.8,
    doorWidth: 2.55, doorHeight: 3.60,
    floorY: TIANWANG_LAYOUT.floorY,
    upperFloorY: TIANWANG_LAYOUT.upperFloorY,
    eaveRise: PAVILION_LAYOUT.eaveRise },
};

/* ---------- 10. 连接廊 + 两侧长廊庑 ---------- */
function makeCorridor(side) {
  const c = new T.Group();
  const CW = CORRIDOR_LAYOUT.outer.width;                                  // 廊宽
  const CH = CORRIDOR_LAYOUT.outer.columnHeight;                                 // 柱高（约主殿一层）
  const CE = CORRIDOR_LAYOUT.outer.eaveY;                                 // 檐口
  const LEN = CORRIDOR_LAYOUT.outer.length;
  const X = side * CORRIDOR_LAYOUT.outer.x, Zc = CORRIDOR_LAYOUT.outer.frontZ + LEN / 2;
  c.position.set(X, 0, Zc);
  const CY = CORRIDOR_LAYOUT.outer.floorY;                                 // 廊内地面

  c.add(box(CW + 0.6, 0.50, LEN, M.stoneDark, 0, 0.25, 0));
  c.add(box(CW + 0.8, 0.10, LEN + 0.2, M.stoneWhite, 0, 0.55, 0));
  // 朝院内的通长石踏步，衔接院落与廊内地坪。
  for (let k = 0; k < 3; k++) {
    c.add(box(.40, .20 * (3 - k), LEN - .6, M.stone,
      -side * (CW / 2 + .20 + k * .40), .10 * (3 - k), 0));
  }

  // 前后两列柱（朝院内一侧开敞）
  for (let k = 0; k <= 8; k++) {
    const z = -LEN / 2 + k * (LEN / 8);
    c.add(cyl(0.19, 0.21, CH, M.wood, 10, -side * (CW / 2 - 0.38), CY + CH / 2, z));
    c.add(cyl(0.19, 0.21, CH, M.wood, 10, side * (CW / 2 - 0.38), CY + CH / 2, z));
    c.add(cyl(0.26, 0.26, 0.14, M.stoneDark, 10, -side * (CW / 2 - 0.38), CY + 0.07, z));
  }
  c.add(box(0.28, 0.34, LEN, M.woodMid, -side * (CW / 2 - 0.38), CY + CH - 0.10, 0));
  c.add(box(0.28, 0.34, LEN, M.woodMid, side * (CW / 2 - 0.38), CY + CH - 0.10, 0));

  // 外侧白墙（依托配殿墙体）+ 连续格窗
  c.add(box(0.26, CH, LEN, M.wall, side * (CW / 2 - 0.06), CY + CH / 2, 0));
  for (let k = 0; k <= 7; k++) {
    const z = -LEN / 2 + 1.3 + k * ((LEN - 2.6) / 7);
    c.add(box(2.05, 2.60, 0.10, M.woodDark, side * (CW / 2 - 0.17), CY + 4.05, z));
    c.add(panel(1.88, 2.44, M.lattice, side * (CW / 2 - 0.23), CY + 4.05, z, Math.PI / 2));
  }
  // 檐下斗拱（朝院内一排）
  for (let k = 0; k <= 8; k++) {
    const z = -LEN / 2 + k * (LEN / 8);
    pushDougong(X - side * (CW / 2 - 0.38), CE - 0.98, Zc + z, 0.70);
  }
  // 南端山墙收头：廊庑屋顶前端不再悬空
  c.add(box(CW - 0.2, CH + 0.9, 0.30, M.wall, 0, CY + (CH + 0.9) / 2 - 0.4, LEN / 2 - 0.15));
  // 屋顶：长正脊两坡，端部起翘（与主殿飞檐同风格）
  const r = makeRoof(LEN + 1.0, CW + 0.55, CE, 1.32,
    { corner: 0.34, ridgeHalf: (LEN + 1.0 - CW - 0.55) / 2 - 0.4, curve: 1.42, seg: 30, beasts: false });
  r.rotation.y = Math.PI / 2;
  c.add(r);
  return c;
}
modelRoot.add(makeCorridor(-1));
modelRoot.add(makeCorridor(1));

/* ---------- 10. 钟鼓楼 ↔ 主殿的连廊（上层开敞，下层门洞） ---------- */
/* 实景：主殿两侧各接一段二层廊——下层是白石墙体，正中开方形门洞（由前院穿至后院）；
 * 上层挑出木构开敞廊，两侧设木栏杆，上覆长条歇山瓦顶，两端分别衔接平坐与主殿侧檐。 */
function makeSideGallery(side) {
  const g = new T.Group();
  const CX = side * CORRIDOR_LAYOUT.gallery.x;
  const GZ = CORRIDOR_LAYOUT.gallery.z;                  // 与钟楼同轴
  const LEN0 = CORRIDOR_LAYOUT.gallery.length;
  const LEN = LEN0 - .40;
  const GD = CORRIDOR_LAYOUT.gallery.depth;                   // 进深
  const F = CORRIDOR_LAYOUT.gallery.floorY;
  const FL = CORRIDOR_LAYOUT.gallery.upperFloorY;
  const WT = FL - .33;
  // 与亭子檐口同高，主殿上檐仅高 0.15，屋面两端搭入相邻出檐。
  const EY = FL + CORRIDOR_LAYOUT.gallery.eaveRise;
  g.position.set(CX, 0, GZ);

  /* 台基 */
  g.add(box(LEN0 + 0.80, 0.30, GD + 1.00, M.stoneDark, 0, 0.15, 0));
  g.add(box(LEN0 + 1.05, 0.34, GD + 1.25, M.stoneWhite, 0, 0.47, 0));
  g.add(box(LEN0 + 1.05, F - .64, GD + 1.25, M.stoneWhite, 0, (.64 + F) / 2, 0));

  /* 下层墙身：前后墙开方形门洞，两侧山墙封闭 */
  const DW = CORRIDOR_LAYOUT.gallery.doorWidth, DH = CORRIDOR_LAYOUT.gallery.doorHeight;
  const wallShape = () => {
    const sh = new T.Shape();
    sh.moveTo(-LEN0 / 2, 0); sh.lineTo(LEN0 / 2, 0);
    sh.lineTo(LEN0 / 2, WT - F); sh.lineTo(-LEN0 / 2, WT - F); sh.lineTo(-LEN0 / 2, 0);
    const h = new T.Path();
    h.moveTo(-DW / 2, 0); h.lineTo(-DW / 2, DH);
    h.lineTo(DW / 2, DH); h.lineTo(DW / 2, 0); h.closePath();
    sh.holes.push(h);
    return sh;
  };
  [-1, 1].forEach(sz => {
    const zf = sz * GD / 2 - (sz > 0 ? 0.46 : 0);
    g.add(makeMesh(new T.ExtrudeGeometry(wallShape(), { depth: 0.46, bevelEnabled: false }),
      M.wall, 0, F, zf));
  });
  [-1, 1].forEach(sx =>
    g.add(box(0.46, WT - F, GD, M.wall, sx * (LEN0 / 2 - 0.23), F + (WT - F) / 2, 0)));
  g.add(box(LEN0 + 0.20, 0.16, GD + 0.20, M.stoneWhite, 0, WT - 0.08, 0));   // 上腰石线

  /* 门洞内部：石地面 + 暗色壁身，读得出是穿透的门洞而非贴面 */
  g.add(box(DW + 0.30, 0.10, GD + 0.20, M.stoneWhite, 0, F + 0.05, 0));
  [-1, 1].forEach(sx =>
    g.add(box(0.10, DH, GD - 0.94, M.ink, sx * (DW / 2 + 0.04), F + DH / 2, 0)));
  g.add(box(DW + 0.26, 0.10, GD - 0.94, M.ink, 0, F + DH - 0.05, 0));

  /* 门框：石劵边（前后两面） + 门额 */
  [-1, 1].forEach(sz => {
    const zf = sz * (GD / 2 + 0.02);
    [-1, 1].forEach(sx =>
      g.add(box(0.22, DH + 0.30, 0.20, M.stoneWhite, sx * (DW / 2 + 0.11), F + (DH + 0.30) / 2, zf)));
    g.add(box(DW + 0.68, 0.26, 0.22, M.stoneWhite, 0, F + DH + 0.32, zf));
  });
  // 门前三级踏跺
  [-1, 1].forEach(sz => {
    for (let k = 0; k < 5; k++)
      g.add(box(DW + 1.30, F * (5 - k) / 5, .40, M.stone, 0,
        F * (5 - k) / 10, sz * (GD / 2 + .20 + k * .40)));
  });

  /* 楼板：斗拱出挑承托 */
  for (let i = 0; i < 6; i++) {
    const o = -LEN0 / 2 + 1.00 + i * ((LEN0 - 2.00) / 5);
    pushDougong(CX + o, WT - 0.56, GZ + GD / 2 + 0.22, 0.60);
    pushDougong(CX + o, WT - 0.56, GZ - GD / 2 - 0.22, 0.60);
  }
  g.add(box(LEN0 + 0.36, 0.16, GD + 0.36, M.woodMid, 0, WT + 0.08, 0));      // 普拍枋
  g.add(box(LEN + 2.30, 0.26, GD + 0.50, M.wood, 0, FL - 0.13, 0));          // 楼板（东端搭上平坐）
  g.add(box(LEN + 2.50, 0.10, GD + 0.66, M.woodDark, 0, FL - 0.31, 0));      // 楼板压边

  /* 上层：两列廊柱 + 额枋 + 横梁 */
  const nBay = 3, step = LEN / nBay, edgeZ = GD / 2 - 0.40;
  for (let i = 0; i <= nBay; i++) {
    const px = -LEN / 2 + i * step;
    [-1, 1].forEach(sz => {
      const columnH = EY - FL - .23;
      g.add(cyl(0.17, 0.19, columnH, M.wood, 10, px, FL + columnH / 2, sz * edgeZ));
      g.add(box(0.18, 0.10, 0.18, M.woodDark, px, FL + 0.06, sz * edgeZ));
    });
    g.add(box(0.18, 0.24, GD - 0.72, M.woodMid, px, EY - 0.46, 0));          // 横梁
  }
  [-1, 1].forEach(sz => {
    g.add(box(LEN + 0.44, 0.26, 0.26, M.woodMid, 0, EY - 0.30, sz * edgeZ));   // 檐额
    g.add(box(LEN + 0.34, 0.12, 0.16, M.woodDark, 0, EY - 0.52, sz * edgeZ));  // 挂落
    railLine(g, -LEN / 2 + 0.24, sz * edgeZ, LEN / 2 - 0.24, sz * edgeZ, FL + 0.02, { h: 1.02 });
  });

  // 两端开敞，楼面直接衔接主殿二层侧门与亭子平坐。

  /* 长条歇山瓦顶（正脊沿 x，两端收山） */
  const roofLength = LEN + 2.60;
  const rf = makeRoof(roofLength, GD + 1.90, EY, 0.92,
    { ridgeHalf: (roofLength - (GD + 1.90)) / 2, corner: 0.18, curve: 1.35, seg: 30, beasts: false });
  g.add(rf);

  return g;
}
modelRoot.add(makeSideGallery(-1));
modelRoot.add(makeSideGallery(1));


// Compatibility view for the player runtime. All dimensions originate above
// or in the neighbouring building module.
function registerFrontCourtLayout() {
  const g = CORRIDOR_LAYOUT.gallery, c = CORRIDOR_LAYOUT.outer, t = PAVILION_LAYOUT;
  const x0 = g.x - g.length / 2, x1 = g.x + g.length / 2;
  const z0 = g.z - g.depth / 2, z1 = g.z + g.depth / 2;
  const halfBase = t.baseWidth / 2;
  window.__FRONT_COURT__ = {
    galleryX: g.x, galleryZ: g.z, galleryDepth: g.depth,
    doorWidth: g.doorWidth, floorY: g.floorY, upperFloorY: g.upperFloorY,
    corridorX: c.x, corridorWidth: c.width, corridorFloorY: c.floorY,
    corridorFrontZ: c.frontZ, corridorBackZ: c.frontZ + c.length,
    blockers: [
      { x0, x1: g.x - g.doorWidth / 2, z0, z1 },
      { x0: g.x + g.doorWidth / 2, x1, z0, z1 },
      { x0: t.x - halfBase, x1: t.x + halfBase, z0: t.z - halfBase, z1: t.z + halfBase },
      { x0: c.x + c.width / 2 - .26, x1: c.x + c.width / 2,
        z0: c.frontZ, z1: c.frontZ + c.length },
      { x0: c.x - c.width / 2 + .10, x1: c.x + c.width / 2,
        z0: c.frontZ + c.length - .30, z1: c.frontZ + c.length },
    ],
  };
}
