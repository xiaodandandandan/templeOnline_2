/* 场景代码 */
/* =========================================================================
 * 径山万寿禅寺 · 山门殿  ——  Three.js 程序化复原
 * 依据照片拆解：重檐庑殿/歇山顶、夸张飞檐、白墙栗色木构、三券门、
 * 左右钟鼓楼、石狮、石经幢、古杉、廊庑、石板御道
 * 全部几何由代码生成，无任何外部模型 / 贴图依赖
 * ========================================================================= */
function bootstrap() {
'use strict';
const T = THREE;

/* ---------- 0. 工具 ---------- */
let _seed = 20240501;
const rnd = () => { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; };
const smooth = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function makeMesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}
function box(w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) {
  return makeMesh(new T.BoxGeometry(w, h, d), mat, x, y, z, shadow);
}
function cyl(rt, rb, h, mat, seg = 12, x = 0, y = 0, z = 0) {
  return makeMesh(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
}
const std = (c, r = 0.85, m = 0) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

/* ---------- 1. 程序化贴图 ---------- */
function canvasTex(w, h, draw, repX = 1, repY = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(repX, repY);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// 青灰筒瓦：竖向瓦垄 + 横向瓦缝
const tileTex = canvasTex(256, 256, (g) => {
  g.fillStyle = '#3a484e'; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    const gr = g.createLinearGradient(x, 0, x + 16, 0);
    gr.addColorStop(0, '#222e33'); gr.addColorStop(0.28, '#4d5c62');
    gr.addColorStop(0.55, '#3f4e55'); gr.addColorStop(1, '#202b30');
    g.fillStyle = gr; g.fillRect(x, 0, 16, 256);
  }
  for (let y = 0; y < 256; y += 32) {
    g.fillStyle = 'rgba(18,26,30,.55)'; g.fillRect(0, y, 256, 3);
    g.fillStyle = 'rgba(150,168,172,.10)'; g.fillRect(0, y + 3, 256, 2);
    for (let x = 0; x < 256; x += 16) {
      g.fillStyle = 'rgba(10,16,20,.28)'; g.fillRect(x + 6, y + 4, 5, 27);
    }
  }
  g.fillStyle = 'rgba(255,255,255,.035)';
  for (let i = 0; i < 900; i++) g.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
});

// 石板铺地
function paving(base, grout, cols, rows, repX, repY, warm = 0) {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = grout; g.fillRect(0, 0, 512, 512);
    const cw = 512 / cols, ch = 512 / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (rnd() - 0.5) * 16 + warm;
      g.fillStyle = shade(base, k);
      g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
      g.fillStyle = 'rgba(255,255,255,.05)';
      g.fillRect(i * cw + 3, j * ch + 3, cw - 6, 2);
      g.fillStyle = 'rgba(0,0,0,.05)';
      for (let n = 0; n < 16; n++) g.fillRect(i * cw + 4 + rnd() * (cw - 8), j * ch + 4 + rnd() * (ch - 8), 2, 2);
    }
  }, repX, repY);
}
function shade(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + delta, 0, 255) | 0;
  const g = clamp(((n >> 8) & 255) + delta, 0, 255) | 0;
  const b = clamp((n & 255) + delta, 0, 255) | 0;
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 26, 26);
const paveRoad   = paving('#e3ddcd', '#bfb8a4', 2, 4, 1, 10, 4);
const paveEdge   = paving('#c4b28f', '#948365', 4, 8, 1, 12, 10);
const paveCourt  = paving('#d5cfc0', '#b0aa9b', 8, 8, 1, 1);

// 木格栅（门窗）
const latticeTex = canvasTex(256, 256, (g) => {
  g.fillStyle = '#2a201a'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#7a5539';
  for (let x = 0; x < 256; x += 22) g.fillRect(x, 0, 6, 256);
  for (let y = 0; y < 256; y += 44) g.fillRect(0, y, 256, 5);
  g.fillStyle = 'rgba(222,182,128,.28)';
  for (let x = 0; x < 256; x += 22) g.fillRect(x, 0, 2, 256);
}, 1, 1);

// 匾额 / 经板文字
function textPlate(lines, opt) {
  const o = Object.assign({ w: 512, h: 128, bg: '#241a14', fg: '#e2bb63', border: '#8c6a2f', vertical: false, size: 76, sub: '' }, opt);
  return canvasTex(o.w, o.h, (g) => {
    g.fillStyle = o.bg; g.fillRect(0, 0, o.w, o.h);
    g.strokeStyle = o.border; g.lineWidth = 6; g.strokeRect(9, 9, o.w - 18, o.h - 18);
    g.strokeStyle = 'rgba(226,187,99,.35)'; g.lineWidth = 2; g.strokeRect(17, 17, o.w - 34, o.h - 34);
    g.fillStyle = o.fg;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold ' + o.size + 'px "Noto Serif CJK SC","KaiTi","STKaiti","SimSun",serif';
    if (!o.vertical) {
      // 传统横匾：从右往左排列，故反转字符
      const chars = lines[0].split('').reverse().join('');
      g.fillText(chars, o.w / 2, o.h / 2 + 2);
    } else {
      const chars = lines[0].split('');
      const step = (o.h - 40) / chars.length;
      chars.forEach((ch, i) => g.fillText(ch, o.w / 2, 24 + step * (i + 0.5)));
    }
    if (o.sub) {
      g.font = '20px "Noto Serif CJK SC",serif'; g.fillStyle = 'rgba(226,187,99,.7)';
      g.fillText(o.sub, o.w / 2, o.h - 22);
    }
  });
}
const plaqueMain = textPlate(['萬年正續'], { w: 640, h: 150, size: 92 });
const plaqueVert = textPlate(['徑山萬壽禪寺'], { w: 180, h: 420, size: 52, vertical: true });
const sutraTex = canvasTex(160, 512, (g) => {
  g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 160, 512);
  g.strokeStyle = '#7d6242'; g.lineWidth = 5; g.strokeRect(8, 8, 144, 496);
  g.fillStyle = '#4a3a28'; g.font = '30px "Noto Serif CJK SC",serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const s = '般若波羅蜜多心經觀自在菩薩行深般若波羅蜜多時照見五蘊皆空度一切苦厄舍利子色不異空空不異色';
  for (let i = 0; i < 15; i++) for (let j = 0; j < 2; j++) {
    g.fillText(s[(i * 2 + j) % s.length], 45 + j * 70, 32 + i * 33);
  }
});

/* ---------- 2. 材质 ---------- */
const M = {
  wall:      std(0xefe9dd, 1),
  wallShade: std(0xe3ddcf, 1),
  wood:      std(0x593226, 0.82),
  woodDark:  std(0x35201a, 0.88),
  woodMid:   std(0x70422f, 0.85),
  woodLight: std(0x8d5c42, 0.85),
  stone:     std(0xd7d1c2, 0.95),
  stoneDark: std(0xb6af9e, 0.95),
  stoneWhite:std(0xe9e4d8, 0.92),
  tileUnder: std(0x241a17, 0.95),
  ink:       std(0x1d1712, 0.9),
  gold:      std(0xcba552, 0.5, 0.35),
  trunk:     std(0x5a4534, 1),
  pot:       std(0xa3937c, 0.95),
  greenShed: std(0x2f6b52, 0.9),
  tileBase:  new T.MeshStandardMaterial({ color: 0xffffff, map: tileTex, roughness: 0.86, side: T.DoubleSide }),
  ridge:     std(0x3e4c52, 0.8),
  ridgeTop:  std(0x71848a, 0.75),
  eaveEdge:  std(0x17181a, 0.9),
  lattice:   new T.MeshStandardMaterial({ color: 0xffffff, map: latticeTex, roughness: 0.9, side: T.DoubleSide }),
  sutra:     new T.MeshStandardMaterial({ color: 0xffffff, map: sutraTex, roughness: 0.95 }),
};

/* ---------- 3. 渲染器 / 场景 / 光照 ---------- */
const container = document.getElementById('scene');
/* 移动端适配：用较低的像素比上限，避免高分屏手机 GPU 填充率过载掉帧；
 * 桌面端维持 2，视觉与原来一致。以 UA + 触控粗指针双重判定，覆盖平板。 */
const isMobileDevice =
  /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const dprCap = isMobileDevice ? 1.5 : 2;
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: isMobileDevice ? 'default' : 'high-performance',
});
/* 画布尺寸统一取“容器实测整数尺寸”，不用 window.innerWidth/innerHeight：
 * 单文件 App 里场景跑在 iframe 中，宿主布局高度带小数时 innerWidth/Height 与容器
 * 可能差 1px，导致缓冲尺寸与 CSS 尺寸错位、末行采样抖动。 */
const viewportSize = () => ({
  w: Math.max(1, Math.round(container.clientWidth || window.innerWidth)),
  h: Math.max(1, Math.round(container.clientHeight || window.innerHeight)),
});
const S0 = viewportSize();
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
renderer.setSize(S0.w, S0.h, false); // false：CSS 尺寸由 #scene canvas{width:100%} 负责
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
/* 移动端降一档阴影：PCFSoft 2048 在手机上填充率吃紧，阴影边界也更容易闪；
 * 降到 PCF 1024 后帧率更稳，近景观感差异很小。 */
renderer.shadowMap.type = isMobileDevice ? T.PCFShadowMap : T.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new T.Scene();
scene.fog = new T.Fog(0xcfe3f0, 78, 230);

const skyUniforms = {
  topColor:    { value: new T.Color(0x4d97d4) },
  bottomColor: { value: new T.Color(0xdcecf5) },
  offset:      { value: 12 },
  exponent:    { value: 0.75 }
};
const sky = new T.Mesh(
  new T.SphereGeometry(300, 32, 16),
  new T.ShaderMaterial({
    uniforms: skyUniforms, side: T.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vP; void main(){ float h = normalize(vP + vec3(0.0,offset,0.0)).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0), exponent),0.0)), 1.0); }'
  })
);
sky.frustumCulled = false;
scene.add(sky);

const hemi = new T.HemisphereLight(0xbcd9f2, 0xb9ac94, 1.15);
scene.add(hemi);
const sun = new T.DirectionalLight(0xfff2da, 2.9);
sun.position.set(-26, 36, 28);
sun.castShadow = true;
sun.shadow.mapSize.set(isMobileDevice ? 1024 : 2048, isMobileDevice ? 1024 : 2048);
sun.shadow.camera.left = -42; sun.shadow.camera.right = 42;
sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -30;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 130;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
scene.add(sun);
scene.add(new T.AmbientLight(0xffffff, 0.22));
// 北侧补光：主光在东南，背面实景同样受日光；加一盏无阴影弱补光避免后立面发黑
const northFill = new T.DirectionalLight(0xfff2da, 0.85);
northFill.position.set(0, 24, -40);
scene.add(northFill);

const camera = new T.PerspectiveCamera(40, S0.w / S0.h, 0.1, 600);
camera.position.set(0, 8.8, 36);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 6.0, 0);
/* 阻尼在“自由观景”下需要，但第三人称漫游里每帧都会由运行时写死机位，
 * 残留的 damping 会与自定义相机构位互相拉扯，静止时表现为高频微抖。
 * 运行时切到第三人称时会置 false（见 bridge-runtime）。 */
controls.enableDamping = true; controls.dampingFactor = 0.06;
controls.minDistance = 12; controls.maxDistance = 110;
controls.maxPolarAngle = Math.PI * 0.495;
controls.autoRotateSpeed = 0.55;
controls.autoRotate = true;
if (new URLSearchParams(location.search).has('static')) {
  controls.autoRotate = false;
  document.getElementById('tg-rotate').classList.remove('active');
}

const modelRoot = new T.Group();   // 导出 GLB 的根
scene.add(modelRoot);
const natureRoot = new T.Group();  // 树木（可隐藏）
modelRoot.add(natureRoot);

/* ---------- 4. 中式曲面瓦顶生成器 ---------- */
/* 曲面：举折反宇 + 四角起翘；含正脊、戗脊、脊兽、檐口、椽子、宝顶 */
const unitBox = new T.BoxGeometry(1, 1, 1);
const dougongMatrices = [];
function dougongPush(x, y, z, s, sx, sy, sz) {
  const m = new T.Matrix4().compose(
    new T.Vector3(x, y, z), new T.Quaternion(), new T.Vector3(sx * s, sy * s, sz * s)
  );
  dougongMatrices.push(m);
}
function pushDougong(x, y, z, s = 1) {
  dougongPush(x, y + 0.10 * s, z, s, 0.62, 0.20, 0.62);           // 坐斗
  dougongPush(x, y + 0.30 * s, z, s, 1.16, 0.16, 0.26);           // 泥道栱
  dougongPush(x - 0.40 * s, y + 0.44 * s, z, s, 0.20, 0.14, 0.20);
  dougongPush(x + 0.40 * s, y + 0.44 * s, z, s, 0.20, 0.14, 0.20);
  dougongPush(x, y + 0.52 * s, z + 0.30 * s, s, 0.24, 0.14, 0.78); // 华栱出跳
  dougongPush(x, y + 0.64 * s, z, s, 1.52, 0.14, 0.30);           // 令栱
  dougongPush(x - 0.58 * s, y + 0.78 * s, z, s, 0.18, 0.14, 0.18);
  dougongPush(x + 0.58 * s, y + 0.78 * s, z, s, 0.18, 0.14, 0.18);
  dougongPush(x, y + 0.82 * s, z, s, 0.46, 0.16, 0.46);
}

function makeRoof(w, d, eaveY, rise, o = {}) {
  const {
    curve = 1.5, corner = 0.62, seg = 26, ridgeHalf = null,
    thickness = 0.22, finial = false, beasts = true, tileRepeat = 2.8
  } = o;
  const hw = w / 2, hd = d / 2;
  const rh = ridgeHalf === null ? Math.max(0.02, (w - d) / 2) : ridgeHalf;
  const dxMax = Math.max(0.02, hw - rh);
  const g = new T.Group();

  function H(x, z) {
    const dx = Math.max(0, Math.abs(x) - rh);
    const t = Math.min(1, Math.max(dx / dxMax, Math.abs(z) / hd));
    let y = eaveY + rise * Math.pow(1 - t, curve);
    const u = Math.abs(x) / hw, v = Math.abs(z) / hd;
    const c = smooth(0.48, 1, u) * smooth(0.48, 1, v);
    y += corner * rise * Math.pow(c, 1.3) * (0.18 + 0.82 * t);   // 飞檐翘角
    y += 0.035 * rise * smooth(0.82, 1, Math.max(u, v));          // 檐口反宇
    return y;
  }

  // 屋面网格
  const N = seg, pos = [], uvs = [], idx = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const x = -hw + w * i / N, z = -hd + d * j / N;
    pos.push(x, H(x, z), z); uvs.push(i / N, j / N);
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx); geo.computeVertexNormals();

  const tm = M.tileBase.clone();
  tm.map = tileTex.clone();
  tm.map.repeat.set(w / tileRepeat, d / tileRepeat);
  tm.map.needsUpdate = true;
  const top = new T.Mesh(geo, tm); top.castShadow = true; top.receiveShadow = true; g.add(top);
  const under = new T.Mesh(geo.clone().translate(0, -thickness, 0), M.tileUnder);
  under.receiveShadow = true; g.add(under);

  // 四周檐口边（厚度）与轮廓线
  const edgePts = [], skirtPos = [], skirtIdx = [];
  const edges = [
    (k) => [-hw + w * k / N, -hd], (k) => [hw, -hd + d * k / N],
    (k) => [hw - w * k / N, hd], (k) => [-hw, hd - d * k / N]
  ];
  edges.forEach((fn, ei) => {
    const base = skirtPos.length / 3;
    for (let k = 0; k <= N; k++) {
      const [x, z] = fn(k);
      const y = H(x, z);
      skirtPos.push(x, y, z, x, y - thickness, z);
      if (k < N) { const a = base + k * 2; skirtIdx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      if (ei === 0 || k > 0) edgePts.push(new T.Vector3(x, y - thickness * 0.45, z));
    }
  });
  const sg = new T.BufferGeometry();
  sg.setAttribute('position', new T.Float32BufferAttribute(skirtPos, 3));
  sg.setIndex(skirtIdx); sg.computeVertexNormals();
  g.add(new T.Mesh(sg, M.eaveEdge));

  const rim = new T.Mesh(
    new T.TubeGeometry(new T.CatmullRomCurve3(edgePts, true, 'centripetal'), edgePts.length, 0.085, 6, true),
    M.ridge
  );
  rim.castShadow = true; g.add(rim);

  // 椽子（InstancedMesh）
  const rafters = [];
  edges.forEach((fn) => {
    for (let k = 0; k < N; k++) {
      const [x, z] = fn(k + 0.5);
      const y = H(x, z) - thickness - 0.055;
      const nx = -x / (Math.abs(x) + 0.001), nz = -z / (Math.abs(z) + 0.001);
      let ix, iz, rot;
      if (Math.abs(z) > Math.abs(x) * (hd / hw)) { ix = x; iz = z - Math.sign(z) * 0.32; rot = 0; }
      else { ix = x - Math.sign(x) * 0.32; iz = z; rot = Math.PI / 2; }
      rafters.push([ix, y, iz, rot]);
    }
  });
  const rf = new T.InstancedMesh(unitBox, M.woodDark, rafters.length);
  const mm = new T.Matrix4(), qq = new T.Quaternion(), vv = new T.Vector3(), ss = new T.Vector3(0.075, 0.09, 0.7);
  rafters.forEach((r, i) => {
    qq.setFromAxisAngle(new T.Vector3(0, 1, 0), r[3]);
    mm.compose(vv.set(r[0], r[1], r[2]), qq, ss);
    rf.setMatrixAt(i, mm);
  });
  rf.castShadow = true; g.add(rf);

  // 正脊 + 鸱吻
  if (rh > 0.45) {
    const yr = H(0, 0);
    g.add(box(rh * 2 + 0.5, 0.34, 0.46, M.ridge, 0, yr + 0.12, 0));
    g.add(box(rh * 2 + 0.6, 0.10, 0.56, M.ridgeTop, 0, yr + 0.32, 0));
    [-1, 1].forEach((s) => {
      const bx = s * (rh + 0.12);
      g.add(box(0.42, 0.72, 0.5, M.ridge, bx, yr + 0.45, 0));
      const horn = makeMesh(new T.ConeGeometry(0.24, 0.95, 6), M.ridge, bx + s * 0.16, yr + 1.05, 0);
      horn.rotation.z = -s * 0.38; g.add(horn);
      g.add(makeMesh(new T.SphereGeometry(0.15, 8, 6), M.ridgeTop, bx + s * 0.34, yr + 1.5, 0));
    });
  } else if (finial) {
    // 宝顶（葫芦）
    const yr = H(0, 0);
    const lathePts = [];
    [[0.0, 0.0], [0.42, 0.0], [0.46, 0.12], [0.30, 0.22], [0.22, 0.38], [0.34, 0.52], [0.36, 0.72], [0.24, 0.88], [0.12, 1.0], [0.20, 1.12], [0.16, 1.28], [0.0, 1.45]]
      .forEach(p => lathePts.push(new T.Vector2(p[0], p[1])));
    const fin = makeMesh(new T.LatheGeometry(lathePts, 12), M.ridgeTop, 0, yr - 0.05, 0);
    g.add(fin);
    g.add(cyl(0.5, 0.62, 0.18, M.ridge, 8, 0, yr + 0.02, 0));
  }

  // 四条戗脊 + 脊兽 + 角尖
  const corners = [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]];
  corners.forEach(([cx, cz]) => {
    const sx = Math.sign(cx) * rh, sz = 0;
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const x = sx + (cx - sx) * t, z = sz + (cz - sz) * t;
      pts.push(new T.Vector3(x, H(x, z) + 0.10, z));
    }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 26, 0.115, 6, false), M.ridge));
    if (beasts) {
      for (let k = 1; k <= 4; k++) {
        const t = 0.30 + k * 0.14;
        const x = sx + (cx - sx) * t, z = sz + (cz - sz) * t;
        const y = H(x, z) + 0.20;
        g.add(makeMesh(new T.ConeGeometry(0.10 + k * 0.012, 0.22, 5), M.ridgeTop, x, y + 0.10, z));
        g.add(makeMesh(new T.SphereGeometry(0.075, 6, 5), M.ridgeTop, x, y + 0.24, z));
      }
    }
    // 檐角套兽（上翘尖）
    const tip = makeMesh(new T.ConeGeometry(0.13, 0.6, 5), M.ridge,
      cx + Math.sign(cx) * 0.10, H(cx, cz) + 0.26, cz + Math.sign(cz) * 0.10);
    tip.rotation.z = -Math.sign(cx) * 0.5; tip.rotation.x = Math.sign(cz) * 0.5;
    g.add(tip);
  });

  g.userData.heightAt = H;
  return g;
}

/* ---------- 4b. 人字形双坡屋顶（悬山）：脊沿 z，三角山面朝 ±z ---------- */
function makeGableRoof(w, d, eaveY, rise, o = {}) {
  const {
    curve = 1.35, corner = 0.52, seg = 22, thickness = 0.20,
    tileRepeat = 2.6, gableMat = null, gableW = 0.24, overhang = 0.52
  } = o;
  const hw = w / 2, hd = d / 2;
  const g = new T.Group();

  // 高度场：x=0 为脊，向两坡下泄；z 两端为山面，檐角起翘
  function H(x, z) {
    const t = Math.min(1, Math.abs(x) / hw);
    let y = eaveY + rise * Math.pow(1 - t, curve);
    const u = Math.abs(x) / hw, v = Math.abs(z) / hd;
    const c = smooth(0.48, 1, u) * smooth(0.52, 1, v);
    y += corner * rise * Math.pow(c, 1.25);
    y += 0.045 * rise * smooth(0.84, 1, v);
    return y;
  }

  const N = seg, pos = [], uvs = [], idx = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const x = -hw + w * i / N, z = -hd + d * j / N;
    pos.push(x, H(x, z), z); uvs.push(i / N, j / N);
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx); geo.computeVertexNormals();

  const tm = M.tileBase.clone();
  tm.map = tileTex.clone();
  tm.map.repeat.set(w / tileRepeat, d / tileRepeat);
  tm.map.needsUpdate = true;
  const top = new T.Mesh(geo, tm); top.castShadow = true; top.receiveShadow = true; g.add(top);
  const under = new T.Mesh(geo.clone().translate(0, -thickness, 0), M.tileUnder);
  under.receiveShadow = true; g.add(under);

  // 两侧檐口（沿 z 的两条长边）：封边 + 檐口线
  [-1, 1].forEach(sx => {
    const sp = [], si = [];
    for (let j = 0; j <= N; j++) {
      const z = -hd + d * j / N, x = sx * hw, y = H(x, z);
      sp.push(x, y, z, x, y - thickness, z);
      if (j < N) { const a = j * 2; si.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    }
    const sg = new T.BufferGeometry();
    sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    sg.setIndex(si); sg.computeVertexNormals();
    g.add(new T.Mesh(sg, M.eaveEdge));
    // 檐口圆线
    const pts = [];
    for (let j = 0; j <= N; j++) {
      const z = -hd + d * j / N;
      pts.push(new T.Vector3(sx * hw, H(sx * hw, z) - thickness * 0.45, z));
    }
    g.add(new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(pts), 30, 0.075, 6, false), M.ridge));
    // 椽子
    const rf = new T.InstancedMesh(unitBox, M.woodDark, N);
    const mm = new T.Matrix4(), qq = new T.Quaternion(), vv = new T.Vector3(), ss = new T.Vector3(0.075, 0.085, 0.62);
    for (let j = 0; j < N; j++) {
      const z = -hd + d * (j + 0.5) / N;
      mm.compose(vv.set(sx * (hw - 0.30), H(sx * (hw - 0.30), z) - thickness - 0.05, z), qq, ss);
      rf.setMatrixAt(j, mm);
    }
    rf.castShadow = true; g.add(rf);
  });

  // 山面三角墙（悬山山花）：两端内缩 overhang，瓦檐悬出山墙之外
  const gm = gableMat || M.wall;
  [-1, 1].forEach(sz => {
    const zw = sz * (hd - overhang);
    const sh = new T.Shape();
    sh.moveTo(-hw, eaveY - 0.05);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x = -hw + w * t;
      sh.lineTo(x, eaveY + rise * Math.pow(1 - Math.abs(x) / hw, curve) - 0.05);
    }
    sh.lineTo(hw, eaveY - 0.05);
    sh.lineTo(-hw, eaveY - 0.05);
    g.add(makeMesh(new T.ExtrudeGeometry(sh, { depth: gableW, bevelEnabled: false }),
      M.wallShade, 0, 0, zw - (sz > 0 ? 0 : gableW)));
    // 博风板：粗壮的深色边框压在瓦檐与山墙之间（悬山做法）
    const bf = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, x = -hw + w * t;
      bf.push(new T.Vector3(x, eaveY + rise * Math.pow(1 - Math.abs(x) / hw, curve) + 0.20,
        sz * (zw + 0.10)));
    }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(bf), 32, 0.17, 6, false), M.ridge));
    // 山花内的悬鱼（垂脊中央的木饰）
    const tipY = eaveY + rise - 0.05;
    g.add(box(0.30, 0.72, 0.10, M.woodDark, 0, tipY - 0.42, sz * (zw + 0.14)));
    g.add(box(0.16, 0.34, 0.08, M.ridgeTop, 0, tipY - 0.30, sz * (zw + 0.20)));
    // 山花内的博缝板（两根斜向细木，分隔山花）
    [-0.45, 0.45].forEach(k => {
      const bx = k * hw;
      const by = eaveY + rise * Math.pow(1 - Math.abs(bx) / hw, curve);
      g.add(box(0.09, by - eaveY + 0.1, 0.07, M.woodDark, bx, (eaveY + by) / 2, sz * (zw + 0.08)));
    });
    // 山花内两道横向木枋 + 中央竖枋
    [0.34, 0.66].forEach(k => {
      const by = eaveY + (rise - 0.10) * k;
      const halfW = hw * (1 - k) * 0.96;
      g.add(box(halfW * 2, 0.10, 0.07, M.woodDark, 0, by, sz * (zw + 0.08)));
    });
    g.add(box(0.10, rise * 0.62, 0.07, M.woodDark, 0, eaveY + rise * 0.30, sz * (zw + 0.08)));
  });

  // 正脊 + 鸱吻（沿 z 方向，长度 d 略收）
  const yr = H(0, 0);
  g.add(box(0.44, 0.30, d - 0.5, M.ridge, 0, yr + 0.16, 0));
  g.add(box(0.54, 0.09, d - 0.4, M.ridgeTop, 0, yr + 0.34, 0));
  [-1, 1].forEach(sz => {
    const bz = sz * (hd - 0.25);
    g.add(box(0.40, 0.66, 0.44, M.ridge, 0, yr + 0.44, bz));
    const horn = makeMesh(new T.ConeGeometry(0.22, 0.88, 6), M.ridge, 0, yr + 1.00, bz + sz * 0.14);
    horn.rotation.x = sz * 0.36; g.add(horn);
  });

  g.userData.heightAt = H;
  return g;
}

/* ---------- 5. 拱门 / 门窗构件 ---------- */
function archShape(cx, w, h) {
  // 天王殿实景为方形开间（上部为平直横枋，非券洞），按矩形洞口构造
  const s = new T.Shape();
  const r = w / 2;
  s.moveTo(cx - r, 0);
  s.lineTo(cx - r, h);
  s.lineTo(cx + r, h);
  s.lineTo(cx + r, 0);
  s.lineTo(cx - r, 0);
  return s;
}
function archOutline(cx, w, h) {
  const r = w / 2, pts = [], n = 5;
  for (let k = 0; k <= n; k++) pts.push([cx - r, h * k / n]);
  for (let k = 1; k <= n; k++) pts.push([cx - r + w * k / n, h]);
  for (let k = 1; k <= n; k++) pts.push([cx + r, h - h * k / n]);
  for (let k = 1; k < n; k++) pts.push([cx + r - w * k / n, 0]);
  return pts;
}
function remapShapeUV(geo, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h);
  uv.needsUpdate = true;
}
function panel(w, h, mat, x, y, z, rotY = 0) {
  const m = makeMesh(new T.PlaneGeometry(w, h), mat, x, y, z, false);
  m.rotation.y = rotY; return m;
}

/* ---------- 6. 庭院地面 ---------- */
const ground = new T.Group();
{
  const base = makeMesh(new T.PlaneGeometry(260, 260),
    new T.MeshStandardMaterial({ map: paveSquare, color: 0xffffff, roughness: 1 }), 0, -0.03, 0, false);
  base.rotation.x = -Math.PI / 2; base.receiveShadow = true;
  ground.add(base);
  // 中央御道
  const road = makeMesh(new T.PlaneGeometry(4.9, 42),
    new T.MeshStandardMaterial({ map: paveRoad, color: 0xffffff, roughness: 1 }), 0, 0.012, 27, false);
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true; ground.add(road);
  // 两侧碎石镶边
  [-1, 1].forEach(s => {
    const e = makeMesh(new T.PlaneGeometry(1.55, 42),
      new T.MeshStandardMaterial({ map: paveEdge, color: 0xffffff, roughness: 1 }), s * 3.25, 0.014, 27, false);
    e.rotation.x = -Math.PI / 2; e.receiveShadow = true; ground.add(e);
    // 浅色条石分隔
    ground.add(box(0.26, 0.07, 42, M.stoneWhite, s * 2.55, 0.035, 27, false));
    ground.add(box(0.26, 0.07, 42, M.stoneWhite, s * 4.06, 0.035, 27, false));
  });
  // 殿前月台铺地
  const court = makeMesh(new T.PlaneGeometry(46, 15),
    new T.MeshStandardMaterial({ map: paveCourt, color: 0xffffff, roughness: 1 }), 0, 0.008, 8.5, false);
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

/* ---------- 8. 主殿 ---------- */
const hall = new T.Group();
{
  const W = 18.4, H = 5.5, wallZ = -1.45, frontZ = 3.05;

  // 白墙 + 三券门（ExtrudeGeometry 挖洞）
  const shape = new T.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const doors = [{ x: 0, w: 3.15, h: 3.9 }, { x: -4.75, w: 2.35, h: 3.25 }, { x: 4.75, w: 2.35, h: 3.25 }];
  doors.forEach(d => shape.holes.push(archShape(d.x, d.w, d.h)));
  const wallGeo = new T.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 20 });
  const wall = makeMesh(wallGeo, M.wall, 0, 1.02, wallZ);
  hall.add(wall);

  // 门洞内：深色 + 格栅 + 券框
  doors.forEach(d => {
    const s = archShape(d.x, d.w - 0.06, d.h - 0.03);
    const dark = new T.ShapeGeometry(s, 20);
    remapShapeUV(dark, d.w, d.h);
    const dk = makeMesh(dark, M.ink, 0, 1.02, wallZ + 0.47, false);
    hall.add(dk);
    const lat = new T.ShapeGeometry(s, 20);
    remapShapeUV(lat, d.w, d.h);
    const lm = M.lattice.clone(); lm.map = latticeTex.clone(); lm.map.repeat.set(2.2, 2.6); lm.map.needsUpdate = true;
    hall.add(makeMesh(lat, lm, 0, 1.02, wallZ + 0.485, false));
    // 券边（深色木框）
    const pts = archOutline(d.x, d.w + 0.06, d.h + 0.03).map(p => new T.Vector3(p[0], p[1] + 1.02, wallZ + 0.53));
    hall.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 56, 0.085, 6, true), M.woodDark));
    // 门簪 / 门楣
    hall.add(box(d.w + 0.4, 0.16, 0.14, M.woodMid, d.x, 1.02 + d.h + 0.28, wallZ + 0.54));
  });

  // 侧墙 / 后墙（补出体量）
  hall.add(box(0.5, H, 8.6, M.wallShade, -W / 2 - 0.2, 1.02 + H / 2, -1.4));
  hall.add(box(0.5, H, 8.6, M.wallShade, W / 2 + 0.2, 1.02 + H / 2, -1.4));
  hall.add(box(W, H, 0.5, M.wallShade, 0, 1.02 + H / 2, -5.6));

  // 前廊柱列 + 额枋 + 斗拱
  const colX = [-8.55, -6.85, -2.45, 2.45, 6.85, 8.55];
  colX.forEach(x => {
    const c = cyl(0.24, 0.27, 5.35, M.wood, 12, x, 1.02 + 5.35 / 2, frontZ);
    hall.add(c);
    hall.add(cyl(0.34, 0.34, 0.16, M.stoneDark, 12, x, 1.06, frontZ));
    pushDougong(x, 6.30, frontZ, 0.95);
  });
  hall.add(box(18.3, 0.34, 0.36, M.woodMid, 0, 6.30, frontZ));
  hall.add(box(18.3, 0.18, 0.30, M.woodDark, 0, 5.98, frontZ));
  // 后柱列（斗拱）
  [-8.55, -2.45, 2.45, 8.55].forEach(x => pushDougong(x, 6.30, -1.2, 0.8));
  // 前廊两侧墙上的格栅窗
  [-8.0, 8.0].forEach(x => {
    const p = panel(1.5, 2.4, M.lattice, x, 3.5, wallZ + 0.53);
    hall.add(p);
    hall.add(box(1.72, 0.12, 0.10, M.woodMid, x, 4.76, wallZ + 0.56));
    hall.add(box(1.72, 0.12, 0.10, M.woodMid, x, 2.24, wallZ + 0.56));
  });

  // 经板（门两侧米黄竖匾）
  [-7.35, -2.95, 2.95, 7.35].forEach((x, i) => {
    hall.add(panel(0.78, 3.3, M.sutra, x, 3.65, wallZ + 0.55));
    hall.add(box(0.92, 0.10, 0.10, M.woodMid, x, 5.36, wallZ + 0.58));
    hall.add(box(0.92, 0.10, 0.10, M.woodMid, x, 1.94, wallZ + 0.58));
  });

  // 横匾“万年正续”
  const pm = new T.MeshStandardMaterial({ map: plaqueMain, color: 0xffffff, roughness: 0.7 });
  hall.add(panel(4.5, 1.05, pm, 0, 5.72, frontZ + 0.22));
  hall.add(box(4.75, 1.22, 0.14, M.woodDark, 0, 5.72, frontZ + 0.13));

  // 下檐（腰檐）：宽而扁、四角大翘
  hall.add(makeRoof(21.4, 8.6, 6.72, 1.85, { corner: 0.70, ridgeHalf: 6.1, curve: 1.45, seg: 28, finial: false, beasts: false }));

  // 上层墙体 + 格栅窗 + 竖匾
  hall.add(box(14.6, 2.95, 6.4, M.wall, 0, 8.35, -0.9));
  hall.add(box(14.9, 0.30, 6.7, M.woodMid, 0, 9.85, -0.9));
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    hall.add(panel(1.5, 1.75, M.lattice, i * 1.95, 8.35, 2.32));
    hall.add(box(1.7, 0.10, 0.10, M.woodDark, i * 1.95, 9.28, 2.36));
  }
  const pvm = new T.MeshStandardMaterial({ map: plaqueVert, color: 0xffffff, roughness: 0.7 });
  hall.add(panel(1.22, 2.6, pvm, 0, 8.4, 2.38));
  hall.add(box(1.42, 2.8, 0.12, M.woodDark, 0, 8.4, 2.31));
  // 上层柱与斗拱
  [-7.1, -4.7, -2.3, 2.3, 4.7, 7.1].forEach(x => {
    hall.add(cyl(0.19, 0.21, 2.9, M.wood, 10, x, 8.35, 2.35));
    pushDougong(x, 9.85, 2.35, 0.72);
  });

  // 上檐（主屋顶）：重檐庑殿 / 歇山，正脊 + 鸱吻
  hall.add(makeRoof(19.6, 11.4, 10.05, 3.05, { corner: 0.60, ridgeHalf: 3.9, curve: 1.55, seg: 30 }));
}
modelRoot.add(hall);

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
  const X = side * 28.1, Z = -1.6;   // 外缘仍与两侧配殿、廊庑成一条直线
  t.position.set(X, 0, Z);

  const F = 0.76;                    // 台基顶
  const BW = 8.30;                   // 台身平面（白墙）
  const WT = 5.94;                   // 台身墙顶
  const PZ = 6.55;                   // 平坐楼面（与连廊楼面同高）
  const SW = 7.40;                   // 亭身平面
  const ST = 9.80;                   // 亭身额枋顶
  const EY = 10.40;                  // 歇山檐口

  /* 台基：三层石线脚 */
  t.add(box(9.90, 0.34, 9.90, M.stoneDark, 0, 0.17, 0));
  t.add(box(9.46, 0.38, 9.46, M.stoneWhite, 0, 0.53, 0));
  t.add(box(9.06, 0.12, 9.06, M.stoneDark, 0, 0.70, 0));

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
  // 门前踏跺（台基高 0.76，三级）
  for (let k = 0; k < 3; k++)
    t.add(box(3.10, 0.19, 0.34, M.stone, 0, 0.57 - k * 0.19, BW / 2 + 0.97 + k * 0.34));

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

  /* 亭身：四面同一做法，按 90° 旋转复制 */
  const y0 = PZ;
  const mkFace = () => {
    const f = new T.Group();
    const zf = SW / 2;
    f.add(box(SW, 0.78, 0.30, M.wall, 0, y0 + 0.39, zf - 0.16));              // 坎墙
    f.add(box(SW + 0.10, 0.14, 0.46, M.woodMid, 0, y0 + 0.85, zf - 0.15));     // 槛框
    [-1, 0, 1].forEach(i => {                                                   // 隔扇三间
      const bx = i * 2.36;
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

/* ---------- 10. 连接廊 + 两侧长廊庑 ---------- */
function makeCorridor(side) {
  const c = new T.Group();
  const CW = 5.2;                                  // 廊宽
  const CH = 7.40;                                 // 柱高（约主殿一层）
  const CE = 8.05;                                 // 檐口
  const LEN = 19.0;
  const X = side * 31.2, Zc = 3.4 + LEN / 2;       // 外移到钟楼同列：外缘 33.8，北端接钟楼台基南沿
  c.position.set(X, 0, Zc);
  const CY = 0.60;                                 // 廊内地面

  c.add(box(CW + 0.6, 0.50, LEN, M.stoneDark, 0, 0.25, 0));
  c.add(box(CW + 0.8, 0.10, LEN + 0.2, M.stoneWhite, 0, 0.55, 0));

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
  const CX = side * 16.60;           // 连廊中心（x）
  const GZ = -1.60;                  // 与钟楼同轴
  const LEN0 = 13.40;                // 下层墙身长度（西接主殿侧墙，东抵钟楼台基）
  const LEN = 10.90;                 // 上层廊身长度（东端收在钟楼下檐之内）
  const GD = 4.80;                   // 进深
  const F = 0.62;                    // 台基顶
  const WT = 6.22;                   // 下层墙顶
  const FL = 6.55;                   // 上层楼面（与平坐同高）
  const EY = 9.30;                   // 檐口（低于钟楼下檐）
  g.position.set(CX, 0, GZ);

  /* 台基 */
  g.add(box(LEN0 + 0.80, 0.30, GD + 1.00, M.stoneDark, 0, 0.15, 0));
  g.add(box(LEN0 + 1.05, 0.34, GD + 1.25, M.stoneWhite, 0, 0.47, 0));

  /* 下层墙身：前后墙开方形门洞，两侧山墙封闭 */
  const DW = 2.55, DH = 3.60;
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
  for (let k = 0; k < 3; k++)
    g.add(box(DW + 1.30, 0.20, 0.40, M.stone, 0, 0.52 - k * 0.20, GD / 2 + 0.80 + k * 0.40));

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
  const nBay = 5, step = LEN / nBay, edgeZ = GD / 2 - 0.40;
  for (let i = 0; i <= nBay; i++) {
    const px = -LEN / 2 + i * step;
    [-1, 1].forEach(sz => {
      g.add(cyl(0.17, 0.19, 2.52, M.wood, 10, px, FL + 1.26, sz * edgeZ));
      g.add(box(0.18, 0.10, 0.18, M.woodDark, px, FL + 0.06, sz * edgeZ));
    });
    g.add(box(0.18, 0.24, GD - 0.72, M.woodMid, px, EY - 0.46, 0));          // 横梁
  }
  [-1, 1].forEach(sz => {
    g.add(box(LEN + 0.44, 0.26, 0.26, M.woodMid, 0, EY - 0.30, sz * edgeZ));   // 檐额
    g.add(box(LEN + 0.34, 0.12, 0.16, M.woodDark, 0, EY - 0.52, sz * edgeZ));  // 挂落
    railLine(g, -LEN / 2 + 0.24, sz * edgeZ, LEN / 2 - 0.24, sz * edgeZ, FL + 0.02, { h: 1.02 });
  });

  /* 靠主殿一端封山墙（避免廊身悬空断头） */
  g.add(box(0.30, EY - FL + 0.10, GD + 0.30, M.wall, -side * (LEN / 2 - 0.16), FL + (EY - FL) / 2 - 0.05, 0));

  /* 长条歇山瓦顶（正脊沿 x，两端收山） */
  const rf = makeRoof(LEN + 1.90, GD + 1.90, EY, 0.92,
    { ridgeHalf: (LEN + 1.90 - (GD + 1.90)) / 2, corner: 0.30, curve: 1.35, seg: 30, beasts: false });
  g.add(rf);

  return g;
}
modelRoot.add(makeSideGallery(-1));
modelRoot.add(makeSideGallery(1));

/* ---------- 11. 斗拱统一实例化 ---------- */
{
  const dg = new T.InstancedMesh(unitBox, M.woodDark, dougongMatrices.length);
  dougongMatrices.forEach((m, i) => dg.setMatrixAt(i, m));
  dg.castShadow = true; dg.receiveShadow = true;
  modelRoot.add(dg);
}

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
const lionL = makeLion(true); lionL.position.set(-6.05, 0, 11.65); lionL.scale.setScalar(1.40);
const lionR = makeLion(false); lionR.position.set(6.05, 0, 11.65); lionR.scale.set(-1.40, 1.40, 1.40);
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
natureRoot.add(makeCedar(-4.85, 10.55, 15.4, 0.84));
natureRoot.add(makeCedar(4.90, 10.20, 16.2, 0.88));

// 照片背景以天空与远山为主，此处不添加远景球体，保持天际线干净

/* ---------- 16. 构件标注 ---------- */
const hotspots = [
  { n: '重檐上层屋顶 · 正脊鸱吻', p: new T.Vector3(0, 13.4, -1) },
  { n: '飞檐翘角（起翘）',        p: new T.Vector3(-10.2, 8.0, 4.1) },
  { n: '斗拱层',                  p: new T.Vector3(-6.6, 6.5, 3.2) },
  { n: '三券门 · 格栅门扇',       p: new T.Vector3(0, 3.2, -0.9) },
  { n: '“万年正续”横匾',        p: new T.Vector3(0, 5.75, 3.3) },
  { n: '石狮 · 须弥座',           p: new T.Vector3(6.05, 2.6, 11.65) },
  { n: '石经幢',                  p: new T.Vector3(-8.40, 5.2, 8.70) },
  { n: '钟楼 / 鼓楼（平坐重楼 · 宝顶）', p: new T.Vector3(-28.1, 12.9, -1.6) },
  { n: '连廊 · 下层门洞',            p: new T.Vector3(-16.6, 2.6, 0.9) },
  { n: '廊庑 · 钟楼同列',          p: new T.Vector3(31.2, 7.6, 12) },
  { n: '古杉',                    p: new T.Vector3(4.90, 11.0, 10.2) },
  { n: '石板御道',                p: new T.Vector3(0, 0.1, 22) },
];
const labelLayer = document.getElementById('labels');
const labelEls = hotspots.map(h => {
  const el = document.createElement('div');
  el.className = 'hotspot';
  el.innerHTML = '<span class="dot"></span><span class="txt">' + h.n + '</span>';
  labelLayer.appendChild(el);
  return el;
});
let labelsOn = false;
function updateLabels() {
  if (!labelsOn) return;
  const w = window.innerWidth, h = window.innerHeight;
  hotspots.forEach((hp, i) => {
    const v = hp.p.clone().project(camera);
    const vis = v.z < 1 && v.z > -1;
    const el = labelEls[i];
    el.style.display = vis ? 'flex' : 'none';
    el.style.left = ((v.x * 0.5 + 0.5) * w) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * h) + 'px';
  });
}

/* ---------- 17. 交互 UI ---------- */
const views = {
  front:  { p: new T.Vector3(0, 8.8, 36),   t: new T.Vector3(0, 6.0, 0) },
  angle:  { p: new T.Vector3(-25, 12.5, 29),t: new T.Vector3(0, 5.6, 0) },
  top:    { p: new T.Vector3(2, 38, 30),    t: new T.Vector3(0, 2.0, 0) },
  close:  { p: new T.Vector3(0, 5.4, 18),   t: new T.Vector3(0, 5.0, 0) },
};
let tween = null;
function goView(key) {
  const v = views[key];
  tween = {
    start: performance.now(), dur: 900,
    p0: camera.position.clone(), p1: v.p.clone(),
    t0: controls.target.clone(), t1: v.t.clone()
  };
  controls.autoRotate = false;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === key));
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => goView(b.dataset.view)));

function toggle(id, fn) {
  const el = document.getElementById(id);
  el.addEventListener('click', () => {
    el.classList.toggle('active');
    fn(el.classList.contains('active'));
  });
}
toggle('tg-rotate', on => { controls.autoRotate = on; });
toggle('tg-label', on => {
  labelsOn = on;
  labelLayer.style.display = on ? 'block' : 'none';
  if (on) updateLabels();
});
toggle('tg-tree', on => { natureRoot.visible = on; });
toggle('tg-wire', on => {
  const seen = new Set();
  modelRoot.traverse(o => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (!seen.has(m.uuid)) { seen.add(m.uuid); if ('wireframe' in m) m.wireframe = on; }
    });
  });
});
let dusk = false;
document.getElementById('tg-light').addEventListener('click', (e) => {
  dusk = !dusk;
  e.currentTarget.classList.toggle('active', dusk);
  e.currentTarget.textContent = dusk ? '☀ 晴日' : '☾ 黄昏';
  if (dusk) {
    skyUniforms.topColor.value.set(0x2c4a72);
    skyUniforms.bottomColor.value.set(0xf0bc86);
    sun.color.set(0xffc98c); sun.intensity = 2.3;
    sun.position.set(30, 16, 18);
    hemi.intensity = 0.72; hemi.color.set(0x9fb6d8);
    scene.fog.color.set(0xe4c6a6);
    renderer.toneMappingExposure = 0.92;
  } else {
    skyUniforms.topColor.value.set(0x4d97d4);
    skyUniforms.bottomColor.value.set(0xdcecf5);
    sun.color.set(0xfff2da); sun.intensity = 2.9;
    sun.position.set(-26, 36, 28);
    hemi.intensity = 1.15; hemi.color.set(0xbcd9f2);
    scene.fog.color.set(0xcfe3f0);
    renderer.toneMappingExposure = 1.0;
  }
});
document.getElementById('btn-reset').addEventListener('click', () => goView('front'));

// 导出 GLB
document.getElementById('btn-export').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const old = btn.textContent;
  btn.textContent = '⏳ 正在生成…'; btn.disabled = true;
  try {
    ground.children[0].visible = false;   // 仅去掉无限大地面，保留御道与月台
    const exporter = new GLTFExporter();
    const buf = await exporter.parseAsync(modelRoot, { binary: true, onlyVisible: true, trs: true });
    ground.children[0].visible = true;
    const blob = new Blob([buf], { type: 'model/gltf-binary' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '径山万寿禅寺_山门殿.glb';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    btn.textContent = '✓ 已导出';
  } catch (err) {
    ground.children[0].visible = true;
    console.error(err);
    btn.textContent = '✗ 导出失败';
  }
  setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 2200);
});

/* 视口同步：合并到一帧内执行，且 1px 以内的变化直接忽略。
 * 手机上地址栏伸缩 / 软键盘 / 容器 0.5px 抖动会连发 resize 事件，
 * 每来一次就 setSize 会把 drawing buffer 反复重建，屏幕整片刷白 —— 这就是"频闪"。
 * 现在只有真正改变 ≥1px 才重建，且同一帧多次 resize 只算一次。 */
const _sizeTmp = new T.Vector2();
function syncViewport() {
  const { w, h } = viewportSize();
  const pr = Math.min(window.devicePixelRatio || 1, dprCap);
  const cur = renderer.getSize(_sizeTmp);
  const same = Math.abs(cur.x - w) < 1 && Math.abs(cur.y - h) < 1;
  if (same && renderer.getPixelRatio() === pr) return;
  if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.__SYNC_SIZE__ = syncViewport;   // 上下文恢复后由运行时复用同一套尺寸逻辑
let _sizeRaf = 0;
let _sizeTimer = 0;
/* 分两档处理：
 *   宽度变了（横竖屏旋转、桌面改窗）→ 立即重建，否则画面比例会错一帧；
 *   只有高度在变（手机地址栏伸缩动画）→ 等 160ms 稳定后再重建一次。
 * 地址栏动画期间 canvas 的 CSS 尺寸仍由 100% 跟随，画面只是被轻微纵向拉伸，
 * 比"每帧重建缓冲、整屏刷白"好得多。 */
const queueViewport = () => {
  if (_sizeRaf) return;
  _sizeRaf = requestAnimationFrame(() => {
    _sizeRaf = 0;
    const { w } = viewportSize();
    const cur = renderer.getSize(_sizeTmp);
    if (Math.abs(cur.x - w) > 4) {
      window.clearTimeout(_sizeTimer); _sizeTimer = 0;
      syncViewport();
      return;
    }
    window.clearTimeout(_sizeTimer);
    _sizeTimer = window.setTimeout(() => { _sizeTimer = 0; syncViewport(); }, 160);
  });
};
window.addEventListener('resize', queueViewport);
window.addEventListener('orientationchange', queueViewport);
controls.addEventListener('start', () => { tween = null; document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active')); });

/* ---------- 18. 渲染循环 ---------- */
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function animate(now) {
  requestAnimationFrame(animate);
  if (tween) {
    const elapsed = now - tween.start;
    const k = ease(Math.min(1, elapsed / tween.dur));
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (elapsed >= tween.dur) tween = null;
  }
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
document.getElementById('loading').classList.add('hide');
window.__TEMPLE_READY__ = true;
window.__MODEL_STATS__ = (() => {
  let meshes = 0, tris = 0;
  modelRoot.traverse(o => {
    if (o.isMesh || o.isInstancedMesh) {
      meshes++;
      const g = o.geometry;
      if (g && g.index) tris += g.index.count / 3;
      else if (g && g.attributes.position) tris += g.attributes.position.count / 3;
    }
  });
  return { meshes, tris: Math.round(tris) };
})();
}
bootstrap();

