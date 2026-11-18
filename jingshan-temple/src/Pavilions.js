const PAVILION_LAYOUT = {
  x: 23.5, z: -1.6, baseWidth: 9.90, wallWidth: 8.30,
  floorY: TIANWANG_LAYOUT.floorY,
  upperFloorY: TIANWANG_LAYOUT.upperFloorY,
  roomWidth: 7.40, eaveRise: 3.85,
};

/* ---------- 9. 左右钟鼓楼（台身 · 平坐 · 亭身 · 宝顶） ---------- */
/* 依据实景航拍：白石台身之上，斗拱出挑承平坐，平坐立木构亭身——坎墙 + 隔扇窗 +
 * 横披窗 + 额枋，顶覆单檐歇山、正中宝顶；台上以开敞连廊接主殿（见 §10）。
 * 原“左侧底层开券门”的做法取消：门洞移到连廊下层。 */

/* 木栏杆：望柱 + 寻杖 + 盆唇 + 地栿 + 蜀柱 */
function railLine(g, ax, az, bx, bz, y, o = {}) {
  const { h = 1.02, post = 0.13, step = 1.35, bars = 3 } = o;
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz) || 0.001;
  const n = Math.max(1, Math.round(len / step));
  const ux = dx / len, uz = dz / len;
  for (let i = 0; i <= n; i++) {
    const px = ax + ux * len * i / n, pz = az + uz * len * i / n;
    g.add(box(post, h, post, M.wood, px, y + h / 2, pz));
    g.add(box(post * 1.42, 0.09, post * 1.42, M.woodDark, px, y + h + 0.045, pz));
    for (let k = 1; k <= bars; k++) {
      if (i === n) break;
      const t = (i + k / (bars + 1)) / n;
      g.add(box(0.05, h * 0.66, 0.05, M.wood, ax + dx * t, y + h * 0.36, az + dz * t));
    }
  }
  const rot = Math.atan2(-dz, dx);
  const bar = (yy, hh, ww, mat) => {
    const b = box(len, hh, ww, mat, ax + dx / 2, y + yy, az + dz / 2);
    b.rotation.y = rot; g.add(b);
  };
  bar(h - 0.05, 0.10, 0.14, M.woodDark);   // 寻杖
  bar(h * 0.58, 0.07, 0.09, M.wood);       // 盆唇
  bar(0.09, 0.14, 0.16, M.wood);           // 地栿
}

function makeTower(side) {
  const t = new T.Group();
  const X = side * PAVILION_LAYOUT.x, Z = PAVILION_LAYOUT.z;
  t.position.set(X, 0, Z);

  const F = PAVILION_LAYOUT.floorY;
  const BW = PAVILION_LAYOUT.wallWidth;                   // 台身平面（白墙）
  const WT = PAVILION_LAYOUT.upperFloorY - .61;
  const PZ = PAVILION_LAYOUT.upperFloorY;
  const SW = PAVILION_LAYOUT.roomWidth;                   // 亭身平面
  const ST = PZ + 3.25;
  const EY = PZ + PAVILION_LAYOUT.eaveRise;

  /* 台基：三层石线脚 */
  t.add(box(9.90, 0.34, 9.90, M.stoneDark, 0, 0.17, 0));
  t.add(box(9.46, 0.38, 9.46, M.stoneWhite, 0, 0.53, 0));
  t.add(box(9.06, 0.12, 9.06, M.stoneDark, 0, 0.70, 0));
  t.add(box(9.46, F - .76, 9.46, M.stoneWhite, 0, (.76 + F) / 2, 0));

  /* 台身：四面白石抹灰墙 */
  const BH = WT - F;
  [-1, 1].forEach(sz =>
    t.add(box(BW, BH, 0.44, M.wall, 0, F + BH / 2, sz * (BW / 2 - 0.22))));
  [-1, 1].forEach(sx =>
    t.add(box(0.44, BH, BW - 0.88, M.wall, sx * (BW / 2 - 0.22), F + BH / 2, 0)));
  t.add(box(BW + 0.20, 0.16, BW + 0.20, M.stoneWhite, 0, WT - 0.08, 0));   // 上腰石线

  /* 正面黑漆板门（朝院内） */
  const DW = 2.30, DH = 3.30;
  [-1, 1].forEach(sx =>
    t.add(box(0.22, DH + 0.34, 0.16, M.stoneWhite, sx * (DW / 2 + 0.12), F + (DH + 0.34) / 2, BW / 2 + 0.02)));
  t.add(box(DW + 0.70, 0.26, 0.18, M.stoneWhite, 0, F + DH + 0.33, BW / 2 + 0.02));
  t.add(box(DW + 0.18, DH + 0.12, 0.10, M.woodDark, 0, F + DH / 2, BW / 2 + 0.03));
  t.add(box(DW - 0.02, DH - 0.02, 0.07, M.ink, 0, F + DH / 2, BW / 2 + 0.09));
  [-0.26, 0.26].forEach(dx =>
    t.add(makeMesh(new T.SphereGeometry(0.055, 8, 6), M.gold, dx, F + 2.05, BW / 2 + 0.13)));
  // 门前五级踏跺衔接统一的一层台基。
  for (let k = 0; k < 5; k++) {
    const h = F * (5 - k) / 5;
    t.add(box(3.10, h, .34, M.stone, 0, h / 2, BW / 2 + .17 + k * .34));
  }

  /* 台身上部一圈直棂窗（实景白墙上的窄窗带） */
  [-1, 1].forEach(sz => [-1.55, 1.55].forEach(dx => {
    t.add(box(1.72, 1.12, 0.09, M.woodDark, dx, WT - 1.42, sz * (BW / 2 + 0.01)));
    t.add(panel(1.56, 0.96, M.lattice, dx, WT - 1.42, sz * (BW / 2 + 0.07)));
  }));
  [-1, 1].forEach(sx => [-1.55, 1.55].forEach(dz => {
    const f = box(1.72, 1.12, 0.09, M.woodDark, sx * (BW / 2 + 0.01), WT - 1.42, dz);
    f.rotation.y = Math.PI / 2; t.add(f);
    t.add(panel(1.56, 0.96, M.lattice, sx * (BW / 2 + 0.07), WT - 1.42, dz, Math.PI / 2));
  }));

  /* 斗拱两跳出挑，承平坐 */
  for (let i = 0; i < 5; i++) {
    const o = -3.30 + i * 1.65;
    pushDougong(X + o, WT - 0.50, Z + BW / 2 + 0.24, 0.80);
    pushDougong(X + o, WT - 0.50, Z - BW / 2 - 0.24, 0.80);
    pushDougong(X + BW / 2 + 0.24, WT - 0.50, Z + o, 0.80);
    pushDougong(X - BW / 2 - 0.24, WT - 0.50, Z + o, 0.80);
  }
  t.add(box(BW + 0.56, 0.24, BW + 0.56, M.woodMid, 0, WT - 0.10, 0));       // 普拍枋
  t.add(box(BW + 1.68, 0.26, BW + 1.68, M.wood, 0, PZ - 0.13, 0));          // 平坐楼板
  t.add(box(BW + 1.84, 0.12, BW + 1.84, M.woodDark, 0, PZ - 0.32, 0));      // 楼板压边

  /* 平坐栏杆：靠主殿一侧留出连廊接口，其余三面通长 */
  const R = 5.06;
  const inner = -side;                 // 朝主殿方向（局部坐标）
  const sIn = inner * R, sOut = -inner * R;
  railLine(t, sIn, -R, sOut, -R, PZ);                          // 后檐
  railLine(t, sIn, R, sOut, R, PZ);                            // 前檐
  railLine(t, sOut, -R, sOut, R, PZ);                          // 外侧
  railLine(t, sIn, 2.42, sIn, R - 0.14, PZ);                    // 内侧：连廊接口两侧
  railLine(t, sIn, -R, sIn, -2.42, PZ);

  // 实景平坐外侧的斜撑与栏板压边。
  [-1, 1].forEach(sz => {
    [-3.4, -1.7, 0, 1.7, 3.4].forEach(x => {
      const brace = box(.20, 1.36, .22, M.woodDark, x, WT - .50, sz * 4.25);
      brace.rotation.x = sz * .65;
      t.add(brace);
    });
  });

  /* 亭身：四面同一做法，按 90° 旋转复制 */
  const y0 = PZ;
  const mkFace = () => {
    const f = new T.Group();
    const zf = SW / 2;
    f.add(box(SW, 0.78, 0.30, M.wall, 0, y0 + 0.39, zf - 0.16));              // 坎墙
    f.add(box(SW + 0.10, 0.14, 0.46, M.woodMid, 0, y0 + 0.85, zf - 0.15));     // 槛框
    [-1, 0, 1].forEach(i => {                                                   // 隔扇三间
      const bx = i * 2.36;
      if (i === 0) {
        // 中间开敞，能从院落看见钟鼓和后方廊柱。
        f.add(box(2.14, .12, .18, M.woodDark, bx, y0 + .93, zf - .12));
        return;
      }
      f.add(box(2.14, 1.56, 0.12, M.wood, bx, y0 + 1.66, zf - 0.14));
      f.add(panel(1.96, 1.40, M.lattice, bx, y0 + 1.66, zf - 0.07));
      f.add(box(2.10, 0.09, 0.16, M.woodDark, bx, y0 + 2.40, zf - 0.12));
      f.add(box(2.10, 0.09, 0.16, M.woodDark, bx, y0 + 0.93, zf - 0.12));
    });
    // 横披窗：连续小格 + 竖棂
    f.add(box(SW + 0.04, 0.50, 0.14, M.woodDark, 0, y0 + 2.72, zf - 0.14));
    f.add(panel(SW - 0.14, 0.40, M.lattice, 0, y0 + 2.72, zf - 0.07));
    for (let k = -4; k <= 4; k++)
      f.add(box(0.06, 0.44, 0.08, M.wood, k * 0.82, y0 + 2.72, zf - 0.05));
    // 额枋
    f.add(box(SW + 0.30, 0.26, 0.44, M.woodMid, 0, y0 + 3.00, zf - 0.16));
    return f;
  };
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(rot => {
    const f = mkFace();
    f.rotation.y = rot;
    t.add(f);
  });
  // 四角柱 + 每面中柱
  [-1, 1].forEach(sx => [-1, 1].forEach(sz =>
    t.add(cyl(0.22, 0.24, 3.24, M.wood, 10, sx * (SW / 2 - 0.02), y0 + 1.62, sz * (SW / 2 - 0.02)))));
  [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz]) =>
    t.add(cyl(0.15, 0.17, 3.24, M.wood, 8, sx * (SW / 2 - 0.02), y0 + 1.62, sz * (SW / 2 - 0.02))));

  // 亭内保持空置，作为二层开敞空间。

  /* 檐下斗拱一圈 */
  for (let i = 0; i < 4; i++) {
    const o = -2.55 + i * 1.70;
    pushDougong(X + o, ST - 0.20, Z + SW / 2 + 0.22, 0.74);
    pushDougong(X + o, ST - 0.20, Z - SW / 2 - 0.22, 0.74);
    pushDougong(X + SW / 2 + 0.22, ST - 0.20, Z + o, 0.74);
    pushDougong(X - SW / 2 - 0.22, ST - 0.20, Z + o, 0.74);
  }

  /* 单檐歇山 + 正中宝顶（短正脊） */
  t.add(makeRoof(11.10, 11.10, EY, 2.92,
    { ridgeHalf: 0.30, corner: 0.54, curve: 1.58, seg: 32, finial: true, beasts: true }));

  return t;
}
modelRoot.add(makeTower(-1));
modelRoot.add(makeTower(1));

