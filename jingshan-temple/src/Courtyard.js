const COURTYARD_LAYOUT = {
  ground: { width: 900, depth: 900, z: -88 },
  road: { width: 4.9, length: 42, z: 27 },
  court: { width: 46, depth: 15, z: 8.5 },
  rearPaving: { z: -21.5, length: 31.2, width: 42.4 },
  lions: { x: 6.05, z: 11.65, scale: 1.40 },
  cedars: [[-4.85, 10.55, 15.4, .84], [4.90, 10.20, 16.2, .88]],
};

function buildCourtyardGround() {
  /* ---------- 6. 庭院地面 ---------- */
  const ground = new T.Group();
  {
    const base = makeMesh(new T.PlaneGeometry(COURTYARD_LAYOUT.ground.width, COURTYARD_LAYOUT.ground.depth),
      new T.MeshStandardMaterial({ map: paveSquare, color: 0xffffff, roughness: 1 }), 0, -0.03, COURTYARD_LAYOUT.ground.z, false);
    base.rotation.x = -Math.PI / 2; base.receiveShadow = true;
    ground.add(base);
    // 中央御道
    const road = makeMesh(new T.PlaneGeometry(COURTYARD_LAYOUT.road.width, COURTYARD_LAYOUT.road.length),
      new T.MeshStandardMaterial({ map: paveRoad, color: 0xffffff, roughness: 1 }), 0, 0.012, COURTYARD_LAYOUT.road.z, false);
    road.rotation.x = -Math.PI / 2; road.receiveShadow = true; ground.add(road);
    // 两侧碎石镶边
    [-1, 1].forEach(s => {
      const e = makeMesh(new T.PlaneGeometry(1.55, COURTYARD_LAYOUT.road.length),
        new T.MeshStandardMaterial({ map: paveEdge, color: 0xffffff, roughness: 1 }), s * 3.25, 0.014, COURTYARD_LAYOUT.road.z, false);
      e.rotation.x = -Math.PI / 2; e.receiveShadow = true; ground.add(e);
      // 浅色条石分隔
      ground.add(box(0.26, 0.07, COURTYARD_LAYOUT.road.length, M.stoneWhite, s * 2.55, 0.035, COURTYARD_LAYOUT.road.z, false));
      ground.add(box(0.26, 0.07, COURTYARD_LAYOUT.road.length, M.stoneWhite, s * 4.06, 0.035, COURTYARD_LAYOUT.road.z, false));
    });
    // 殿前月台铺地
    const court = makeMesh(new T.PlaneGeometry(COURTYARD_LAYOUT.court.width, COURTYARD_LAYOUT.court.depth),
      new T.MeshStandardMaterial({ map: paveCourt, color: 0xffffff, roughness: 1 }), 0, 0.008, COURTYARD_LAYOUT.court.z, false);
    court.rotation.x = -Math.PI / 2; court.receiveShadow = true; ground.add(court);
  }
  modelRoot.add(ground);

  /* ---------- 7. 台基 / 台阶 / 栏板 ---------- */
  const podium = new T.Group();
  {
    podium.add(box(21.6, 0.9, 10.0, M.stoneDark, 0, 0.45, 0));
    podium.add(box(21.9, 0.16, 10.3, M.stoneWhite, 0, 0.94, 0));
    podium.add(box(21.7, 0.12, 10.1, M.stone, 0, 0.04, 0));
    // 中央踏道
    for (let k = 0; k < 5; k++) {
      podium.add(box(6.2, 0.18, 0.52, M.stone, 0, 0.80 - k * 0.18, 5.15 + k * 0.52));
    }
    // 两侧踏道
    [-1, 1].forEach(s => {
      for (let k = 0; k < 5; k++) {
        podium.add(box(2.5, 0.18, 0.52, M.stone, s * 7.0, 0.80 - k * 0.18, 5.15 + k * 0.52));
      }
    });
    // 中央御路石雕
    const yudao = makeMesh(new T.BoxGeometry(2.3, 0.10, 2.7),
      new T.MeshStandardMaterial({ map: paving('#ded3b8', '#b5a788', 3, 6, 1, 1, 3), color: 0xffffff, roughness: 1 }),
      0, 0.92, 6.0);
    yudao.rotation.x = -0.32; podium.add(yudao);
    // 望柱 / 栏板
    [-1, 1].forEach(s => {
      for (let k = 0; k < 4; k++) {
        const z = 5.2 + k * 0.7;
        const y = 0.75 - k * 0.18;
        podium.add(box(0.20, 0.68, 0.20, M.stoneWhite, s * 3.35, y + 0.30, z));
        podium.add(box(0.14, 0.30, 0.62, M.stone, s * 3.35, y + 0.14, z + 0.33));
        podium.add(box(0.20, 0.68, 0.20, M.stoneWhite, s * 5.85, y + 0.30, z));
        podium.add(box(0.14, 0.30, 0.62, M.stone, s * 5.85, y + 0.14, z + 0.33));
      }
    });
  }
  modelRoot.add(podium);


  return { ground, podium };
}

function buildCourtyardDecorations() {
  /* ---------- 12. 石狮 ---------- */
  function makeLion(ballSide) {
    const g = new T.Group();
    const S = M.stoneWhite, D = M.stone;
    // 须弥座
    g.add(box(2.05, 0.22, 1.85, D, 0, 0.11, 0));
    g.add(box(1.80, 0.52, 1.62, S, 0, 0.47, 0));
    g.add(box(1.72, 0.10, 1.54, D, 0, 0.78, 0));
    g.add(box(1.96, 0.16, 1.76, S, 0, 0.90, 0));
    // 身躯
    const body = makeMesh(new T.SphereGeometry(0.60, 14, 12), S, 0, 1.62, -0.12);
    body.scale.set(0.92, 1.05, 1.18); g.add(body);
    // 腿
    [-0.36, 0.36].forEach(x => {
      g.add(cyl(0.17, 0.20, 0.72, S, 10, x, 1.28, 0.48));
      g.add(makeMesh(new T.SphereGeometry(0.22, 10, 8), S, x, 1.00, 0.58));
      const back = makeMesh(new T.SphereGeometry(0.30, 10, 8), S, x * 1.05, 1.20, -0.55);
      back.scale.set(1, 0.9, 1.1); g.add(back);
    });
    // 头
    const head = makeMesh(new T.SphereGeometry(0.42, 14, 12), S, 0, 2.16, 0.34);
    head.scale.set(1.04, 0.98, 0.96); g.add(head);
    // 卷毛（螺髻）
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const yy = 2.18 + Math.sin(a) * 0.42;
      const xx = Math.cos(a) * 0.46;
      const zz = 0.36 + Math.sin(i * 2.1) * 0.12 + 0.10;
      g.add(makeMesh(new T.IcosahedronGeometry(0.15 + rnd() * 0.04, 0), S, xx, yy, zz));
    }
    for (let i = 0; i < 6; i++) {
      g.add(makeMesh(new T.IcosahedronGeometry(0.13, 0), S, -0.3 + i * 0.12, 2.52, 0.20 + Math.sin(i) * 0.1));
    }
    // 五官
    g.add(box(0.62, 0.34, 0.28, S, 0, 1.98, 0.72));                       // 吻部
    [-0.19, 0.19].forEach(x => g.add(makeMesh(new T.SphereGeometry(0.042, 8, 6), M.ink, x, 2.32, 0.79)));
    g.add(makeMesh(new T.SphereGeometry(0.055, 8, 6), M.ink, 0, 2.08, 0.90));
    g.add(box(0.26, 0.04, 0.05, M.ink, 0, 1.93, 0.89));
    [-0.30, 0.30].forEach(x => { const e = makeMesh(new T.ConeGeometry(0.13, 0.24, 5), S, x, 2.58, 0.18); g.add(e); });
    // 绣球（一侧踩球）
    if (ballSide) {
      const b = makeMesh(new T.SphereGeometry(0.27, 12, 10), S, 0.40, 1.02, 0.72);
      g.add(b);
      g.add(cyl(0.17, 0.20, 0.55, S, 10, 0.40, 1.22, 0.58));
    }
    // 尾
    for (let i = 0; i < 4; i++) {
      g.add(makeMesh(new T.SphereGeometry(0.16 - i * 0.02, 8, 6), S, 0, 1.5 + i * 0.17, -0.78 - i * 0.05));
    }
    return g;
  }
  const lionL = makeLion(true); lionL.position.set(-COURTYARD_LAYOUT.lions.x, 0, COURTYARD_LAYOUT.lions.z); lionL.scale.setScalar(COURTYARD_LAYOUT.lions.scale);
  const lionR = makeLion(false); lionR.position.set(COURTYARD_LAYOUT.lions.x, 0, COURTYARD_LAYOUT.lions.z); lionR.scale.set(-COURTYARD_LAYOUT.lions.scale, COURTYARD_LAYOUT.lions.scale, COURTYARD_LAYOUT.lions.scale);
  modelRoot.add(lionL, lionR);

  /* ---------- 13. 石经幢 ---------- */
  function makeChuang() {
    const g = new T.Group();
    const S = M.stoneWhite, D = M.stone;
    // 须弥座（照片中经幢基座宽厚）
    g.add(box(1.95, 0.32, 1.95, D, 0, 0.16, 0));
    g.add(box(1.72, 0.24, 1.72, S, 0, 0.44, 0));
    g.add(cyl(0.74, 0.86, 0.34, S, 8, 0, 0.73, 0));
    g.add(cyl(0.58, 0.66, 0.26, D, 8, 0, 1.03, 0));
    let y = 1.20;
    for (let layer = 0; layer < 6; layer++) {
      const h = 0.86 - layer * 0.045;
      const r = 0.31 - layer * 0.014;
      g.add(cyl(r, r + 0.03, h, S, 8, 0, y + h / 2, 0));          // 幢身（八角）
      g.add(cyl(r + 0.04, r + 0.04, 0.05, D, 8, 0, y + 0.09, 0));
      g.add(cyl(r + 0.04, r + 0.04, 0.05, D, 8, 0, y + h - 0.09, 0));
      y += h;
      g.add(cyl(r + 0.06, r + 0.30, 0.20, D, 8, 0, y + 0.10, 0));  // 宝盖出檐
      y += 0.22;
    }
    g.add(makeMesh(new T.SphereGeometry(0.26, 10, 8), S, 0, y + 0.16, 0));
    g.add(cyl(0.10, 0.10, 0.30, S, 8, 0, y + 0.46, 0));
    g.add(makeMesh(new T.ConeGeometry(0.16, 0.42, 8), S, 0, y + 0.78, 0));
    return g;
  }
  [-1, 1].forEach(s => {
    const c = makeChuang(); c.position.set(s * 8.40, 0, 8.70); modelRoot.add(c);
  });

  /* ---------- 14. 盆景松 ---------- */
  function makeBonsai() {
    const g = new T.Group();
    g.add(box(1.5, 0.42, 0.85, M.pot, 0, 0.68, 0));
    g.add(box(1.6, 0.10, 0.95, M.stoneDark, 0, 0.91, 0));
    [-0.6, 0.6].forEach(x => g.add(box(0.16, 0.48, 0.16, M.pot, x, 0.26, 0)));
    const trunkPts = [new T.Vector3(0, 0.95, 0), new T.Vector3(0.12, 1.45, 0), new T.Vector3(-0.22, 1.85, 0.05), new T.Vector3(0.18, 2.20, 0)];
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(trunkPts), 16, 0.085, 6, false), M.trunk));
    const leaf = std(0x3c6240, 1);
    [[-0.42, 1.62, 0], [0.46, 1.95, 0.05], [-0.10, 2.28, 0], [0.55, 1.55, -0.12]].forEach((p, i) => {
      const m = makeMesh(new T.IcosahedronGeometry(0.42 + (i % 2) * 0.09, 1), leaf, p[0], p[1], p[2]);
      m.scale.set(1.25, 0.52, 0.9); g.add(m);
    });
    return g;
  }
  [-1, 1].forEach(s => {
    const b = makeBonsai(); b.position.set(s * 6.6, 0, 6.8); b.rotation.y = s * 0.4;
    natureRoot.add(b);
  });

  /* ---------- 15. 古杉（照片中两株高树） ---------- */
  const leafGeo = new T.IcosahedronGeometry(1, 1);
  function makeCedar(x, z, height, scale) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.add(cyl(0.14, 0.30, height, M.trunk, 9, 0, height / 2, 0));
    const crownBase = height * 0.22, crownH = height * 0.74;

    // 连续塔形树冠内核（顶点扰动，避免规则圆锥感）
    const coreGeo = new T.CylinderGeometry(0.14, 1.08 * scale, crownH, 10, 14);
    const pa = coreGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const n = (rnd() - 0.5) * 0.34;
      pa.setX(i, pa.getX(i) * (1 + n));
      pa.setZ(i, pa.getZ(i) * (1 + n));
      pa.setY(i, pa.getY(i) + (rnd() - 0.5) * 0.22);
    }
    coreGeo.computeVertexNormals();
    g.add(makeMesh(coreGeo, std(0x315136, 1), 0, crownBase + crownH / 2, 0));

    // 表面枝叶团簇：小而密，贴着锥面分布（柏树的细碎针叶感）
    const clusters = [];
    for (let i = 0; i < 980; i++) {
      const t = Math.pow(rnd(), 0.92);
      const yy = crownBase + crownH * t;
      const taper = (1 - t) * 1.02 * scale + 0.12;
      const a = rnd() * Math.PI * 2;
      const r = taper * (0.52 + 0.52 * rnd());
      const s = (0.085 + rnd() * 0.115) * scale;
      clusters.push([Math.cos(a) * r, yy, Math.sin(a) * r, s]);
    }
    const im = new T.InstancedMesh(leafGeo, std(0xffffff, 1), clusters.length);
    const mat4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3();
    const col = new T.Color();
    clusters.forEach((c, i) => {
      q.setFromEuler(new T.Euler(rnd(), rnd() * 6.28, rnd()));
      sc.set(c[3], c[3] * (0.82 + rnd() * 0.45), c[3]);
      mat4.compose(v.set(c[0], c[1], c[2]), q, sc);
      im.setMatrixAt(i, mat4);
      col.setHSL(0.28 + rnd() * 0.05, 0.32 + rnd() * 0.16, 0.14 + rnd() * 0.09);
      im.setColorAt(i, col);
    });
    im.castShadow = true; im.receiveShadow = true;
    g.add(im);
    return g;
  }
  COURTYARD_LAYOUT.cedars.forEach(args => natureRoot.add(makeCedar(...args)));

  // 照片背景以天空与远山为主，此处不添加远景球体，保持天际线干净


}


function buildFrontCourtPaving() {
  const { z: cz, length: len, width } = COURTYARD_LAYOUT.rearPaving;
  const tex = paveCourt.clone(); tex.repeat.set(10, 8); tex.needsUpdate = true;
  const p = makeMesh(new T.PlaneGeometry(width, len),
    new T.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1 }),
    0, 0.010, cz, false);
  p.rotation.x = -Math.PI / 2; p.receiveShadow = true; ground.add(p);
  [-width / 2, width / 2].forEach(x =>
    ground.add(box(0.30, 0.09, len + 0.4, M.stoneWhite, x, 0.045, cz, false)));
  [cz + len / 2, cz - len / 2].forEach(z =>
    ground.add(box(width, 0.09, 0.30, M.stoneWhite, 0, 0.045, z, false)));
}
