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
  // 照片中的三座门洞为直立门 jamb 与上部如意形券口。
  const s = new T.Shape();
  const r = w / 2;
  s.moveTo(cx - r, 0);
  s.lineTo(cx - r, h * .77);
  s.quadraticCurveTo(cx - r * 1.02, h * .85, cx - r * .78, h * .86);
  s.quadraticCurveTo(cx - r * .78, h * .94, cx - r * .38, h * .94);
  s.quadraticCurveTo(cx - r * .25, h, cx, h);
  s.quadraticCurveTo(cx + r * .25, h, cx + r * .38, h * .94);
  s.quadraticCurveTo(cx + r * .78, h * .94, cx + r * .78, h * .86);
  s.quadraticCurveTo(cx + r * 1.02, h * .85, cx + r, h * .77);
  s.lineTo(cx + r, 0);
  s.lineTo(cx - r, 0);
  return s;
}
function archOutline(cx, w, h) {
  return archShape(cx, w, h).getPoints(12).slice(0, -1).map(p => [p.x, p.y]);
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

/*__COURTYARD__*/
const { ground, podium } = buildCourtyardGround();

/* ---------- 8. 主殿 ---------- */
/*__TIANWANG_HALL__*/



/*__PAVILIONS__*/

/*__CORRIDORS__*/
registerFrontCourtLayout();

/* ---------- 11. 斗拱统一实例化 ---------- */
{
  const dg = new T.InstancedMesh(unitBox, M.woodDark, dougongMatrices.length);
  dougongMatrices.forEach((m, i) => dg.setMatrixAt(i, m));
  dg.castShadow = true; dg.receiveShadow = true;
  modelRoot.add(dg);
}

buildCourtyardDecorations();

/* ---------- 16. 构件标注 ---------- */
const hotspots = [
  { n: '重檐上层屋顶 · 正脊鸱吻', p: new T.Vector3(0, 13.4, -1) },
  { n: '飞檐翘角（起翘）',        p: new T.Vector3(-10.2, 8.0, 4.1) },
  { n: '斗拱层',                  p: new T.Vector3(-6.6, 6.5, 3.2) },
  { n: '三券门 · 格栅门扇',       p: new T.Vector3(0, 3.2, -0.9) },
  { n: '“万年正续”横匾',        p: new T.Vector3(0, 5.75, 3.3) },
  { n: '石狮 · 须弥座',           p: new T.Vector3(6.05, 2.6, 11.65) },
  { n: '石经幢',                  p: new T.Vector3(-8.40, 5.2, 8.70) },
  { n: '钟楼 / 鼓楼（平坐重楼 · 宝顶）', p: new T.Vector3(-PAVILION_LAYOUT.x, 12.9, -1.6) },
  { n: '连廊 · 下层门洞',            p: new T.Vector3(-CORRIDOR_LAYOUT.gallery.x, 2.6, 0.9) },
  { n: '廊庑 · 钟楼同列',          p: new T.Vector3(CORRIDOR_LAYOUT.outer.x, 7.6, 12) },
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

