# -*- coding: utf-8 -*-
"""组装单文件 index.html（离线、双击即开）。

源码按职责分离，产物才合并：
    vendor/      three.js r160 与官方 addons（OrbitControls / GLTFExporter）原样存放
    src/         页面模板 page.template.html + 自研代码 scene.js / extension.js
    index.html   构建产物（内联全部依赖），已 gitignore

用法:
    python build.py
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

VENDOR_PARTS = [
    'vendor/three.module.js',    # r160 引擎本体
    'vendor/three-namespace.js',  # THREE 命名空间映射
    'vendor/OrbitControls.js',    # 官方 addons
    'vendor/GLTFExporter.js',     # 官方 addons
    'vendor/three-shim.js',       # addons 的 IIFE 结果取出
]
TPL = os.path.join(HERE, 'src/page.template.html')
SCENE = os.path.join(HERE, 'src/scene.js')
EXT = os.path.join(HERE, 'src/extension.js')
OUT = os.path.join(HERE, 'index.html')

PLACEHOLDER = '/*__VENDOR__*//*__APP__*/'


def read(path):
    return io.open(path, encoding='utf-8').read()


HTML = read(TPL)
SCEN = read(SCENE)
EXTJS = read(EXT)


def _rep(doc, old, new, label):
    if old not in doc:
        raise SystemExit('MISS: ' + label)
    if doc.count(old) != 1:
        raise SystemExit('NOT UNIQUE: %s (%d)' % (label, doc.count(old)))
    print('OK  ', label)
    return doc.replace(old, new, 1)


def _re(doc, pattern, new, label, flags=re.S):
    d2, n = re.subn(pattern, new, doc, count=1, flags=flags)
    if n != 1:
        raise SystemExit('MISS REGEX: ' + label)
    print('OK  ', label)
    return d2


def H(old, new, label):
    """替换页面模板中的片段"""
    global HTML
    HTML = _rep(HTML, old, new, label)


def Sc(old, new, label):
    """替换场景代码中的片段"""
    global SCEN
    SCEN = _rep(SCEN, old, new, label)


def Hre(pattern, new, label):
    global HTML
    HTML = _re(HTML, pattern, new, label)


def Scre(pattern, new, label):
    global SCEN
    SCEN = _re(SCEN, pattern, new, label)


# ---- 0. 资料库注入脚本在本地单文件里无对应路径，移除以免 404 噪声 ----
Hre(r'<script[^>]*src="/page/page_comm/inject\.js"[^>]*></script>\s*', '', 'strip-inject')

# ---- 1. 标题 / 说明 ----
H('<title data-page-node-id="Al8fWxrLrSiDBwuu38pCoh" data-pnid-children="Q05kxXqiFCRsrEzGjNzu36">'
  '径山万寿禅寺 · 山门殿 | Three.js 程序化 3D 复原</title>',
  '<title data-page-node-id="Al8fWxrLrSiDBwuu38pCoh" data-pnid-children="Q05kxXqiFCRsrEzGjNzu36">'
  '径山万寿禅寺 · 依游览图全寺布局 | Three.js 程序化 3D 复原</title>', 'title')

H('<h1 data-page-node-id="PUgT0FoGDt8lhP8bErILlB"><!--pnid:WZowZEwoMa2KsjxeiWdRKA-->径山万寿禅寺 · 山门殿\n'
  '    <small data-page-node-id="C43ODg4nmAt0Zq31z1qJkm"><!--pnid:1vyLSRe7vSq0s0hEHRUbrO-->基于照片的程序化三维复原</small>\n'
  '  </h1>',
  '<h1 data-page-node-id="PUgT0FoGDt8lhP8bErILlB"><!--pnid:WZowZEwoMa2KsjxeiWdRKA-->径山万寿禅寺 · 游览图布局\n'
  '    <small data-page-node-id="C43ODg4nmAt0Zq31z1qJkm"><!--pnid:1vyLSRe7vSq0s0hEHRUbrO-->依《径山寺游览全攻略》航拍标注重排</small>\n'
  '  </h1>', 'h1')

Hre(r'(<div data-page-node-id="Z2MZwSo29N0w6y7zppoE9O" class="desc">).*?(</div>)',
    r'\1\n'
    '    依航拍图由南向北：请香处 → 进口 → 五凤山门(1)<br>\n'
    '    山门内供弥勒、韦陀，兼天王殿之制<br>\n'
    '    <b>中轴五殿等距 44</b>，殿距全部拉齐<br>\n'
    '    0 / -44 / -88 / -132 / -176，进深 176<br>\n'
    '    两侧<b>深栗木两层楼阁</b>：密直棂窗 · 无红栏<br>\n'
    '    金匾楹联 · 瓦当腰檐，一层<b>齐平</b><br>\n'
    '    廊两端折入院内，<b>不直抵殿门</b><br>\n'
    '    朱墙院门 · 锦鲤池 · 踏道登 +6 高台<br>\n'
    '    室内：金色主尊、壁画背屏、成排蒲团<br>\n'
    '    <b>方块人物</b>漫游：WASD 拖曳 滚轮 跪拜\n'
    r'\2', 'desc')

# ---- 1b. 山门匾额依航拍图改题“五凤山门” ----
Sc("const plaqueMain = textPlate(['萬年正續'], { w: 640, h: 150, size: 92 });",
   "const plaqueMain = textPlate(['五鳳山門'], { w: 720, h: 165, size: 92,\n"
   "  bg: '#c9a24f', fg: '#1d1712', border: '#7a5527' });", 'plaque-main')

# ---- 2. 视角按钮 ----
H('<button data-page-node-id="oS09ud3m9WO97bbrMRvV3L" data-view="top"><!--pnid:YRFjnKI5b65akXyeWcfR4y-->俯瞰</button>',
  '<button data-page-node-id="oS09ud3m9WO97bbrMRvV3L" data-view="top"><!--pnid:YRFjnKI5b65akXyeWcfR4y-->全寺俯瞰</button>', 'view-top-label')

H('<button data-page-node-id="HNlH7n7GaHiAJKabeU1mbu" data-view="close"><!--pnid:dqEvB2bxwQ4m2BFXBHWQGz-->近景</button>',
  '<button data-page-node-id="HNlH7n7GaHiAJKabeU1mbu" data-view="close"><!--pnid:dqEvB2bxwQ4m2BFXBHWQGz-->近景</button>\n'
  '  <button data-view="axis">中轴全景</button>', 'view-axis-button')

# ---- 3. 雾 / 阴影 / 相机（等距重排后全寺纵深约 208 单位，拉远可览全貌） ----
Sc('scene.fog = new T.Fog(0xcfe3f0, 78, 230);', 'scene.fog = new T.Fog(0xcfe3f0, 620, 1500);', 'fog')
Sc('sun.shadow.camera.left = -42; sun.shadow.camera.right = 42;',
   'sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;', 'shadow-x')
Sc('sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -30;',
   'sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -150;', 'shadow-y')
Sc('sun.shadow.camera.near = 1; sun.shadow.camera.far = 130;',
   'sun.shadow.camera.near = 1; sun.shadow.camera.far = 480;', 'shadow-far')
Sc('const camera = new T.PerspectiveCamera(40, S0.w / S0.h, 0.1, 600);',
   'const camera = new T.PerspectiveCamera(40, S0.w / S0.h, 0.1, 2000);', 'camera-far')
Sc('camera.position.set(0, 8.8, 36);', 'camera.position.set(52, 150, 122);', 'camera-default')
Sc('controls.target.set(0, 6.0, 0);', 'controls.target.set(0, 3.0, -88);', 'target-default')
Sc('controls.minDistance = 12; controls.maxDistance = 110;',
   'controls.minDistance = 12; controls.maxDistance = 900;', 'controls-distance')

# ---- 3a. 两株古杉移到山门两侧，避免正对横匾与中央券门 ----
Sc("natureRoot.add(makeCedar(-4.85, 10.55, 15.4, 0.84));\nnatureRoot.add(makeCedar(4.90, 10.20, 16.2, 0.88));",
   "natureRoot.add(makeCedar(-4.85, 10.55, 15.4, 0.84));\nnatureRoot.add(makeCedar(4.90, 10.20, 16.2, 0.88));", 'cedar-offset')

# ---- 3b. 地面覆盖全寺（原 260×260 会露边） ----
Sc("const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 26, 26);",
   "const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 90, 90);", 'pave-repeat')
Sc('const base = makeMesh(new T.PlaneGeometry(260, 260),',
   'const base = makeMesh(new T.PlaneGeometry(900, 900),', 'ground-size')
Sc("new T.MeshStandardMaterial({ map: paveSquare, color: 0xffffff, roughness: 1 }), 0, -0.03, 0, false);",
   "new T.MeshStandardMaterial({ map: paveSquare, color: 0xffffff, roughness: 1 }), 0, -0.03, -88, false);", 'ground-center')

# ---- 4. 视角表 ----
Sc("""const views = {
  front:  { p: new T.Vector3(0, 8.8, 36),   t: new T.Vector3(0, 6.0, 0) },
  angle:  { p: new T.Vector3(-25, 12.5, 29),t: new T.Vector3(0, 5.6, 0) },
  top:    { p: new T.Vector3(2, 38, 30),    t: new T.Vector3(0, 2.0, 0) },
  close:  { p: new T.Vector3(0, 5.4, 18),   t: new T.Vector3(0, 5.0, 0) },
};""",
   """const views = {
  front:  { p: new T.Vector3(0, 15.0, 36),   t: new T.Vector3(0, 10.0, -2) },
  angle:  { p: new T.Vector3(-25, 12.5, 29), t: new T.Vector3(0, 5.6, 0) },
  top:    { p: new T.Vector3(0, 420, 14),    t: new T.Vector3(0, 0, -88) },
  axis:   { p: new T.Vector3(52, 150, 122),  t: new T.Vector3(0, 3.0, -88) },
  pond:   { p: new T.Vector3(18, 26, -126),  t: new T.Vector3(0, 1.5, -155) },
  hall:   { p: new T.Vector3(6, 9, -38.5),   t: new T.Vector3(0, 1.4, -46) },
  shrine: { p: new T.Vector3(0, 3.6, -35),   t: new T.Vector3(0, 2.2, -48) },
  hall_tw:{ p: new T.Vector3(3, 14, 0),      t: new T.Vector3(0, 1.3, -4.5) },
  gate:   { p: new T.Vector3(26, 27, 64),    t: new T.Vector3(0, 4.0, 12) },
  back:   { p: new T.Vector3(0, 13.0, -26),  t: new T.Vector3(0, 9.0, -5) },
  backWide:{p: new T.Vector3(0, 28.0, -30),  t: new T.Vector3(0, 13.0, -4) },
  backClose:{p: new T.Vector3(0, 9.0, -17),  t: new T.Vector3(0, 6.0, -8) },
  site:   { p: new T.Vector3(108, 205, 132), t: new T.Vector3(0, 2.0, -88) },
  court:  { p: new T.Vector3(38, 66, 20),    t: new T.Vector3(0, 1.0, -22) },
  courtTop:{p: new T.Vector3(0, 110, -12),   t: new T.Vector3(0, 0, -22) },
  cloister:{p: new T.Vector3(0, 7.5, -11), t: new T.Vector3(-18.6, 5.0, -24) },
  song:   { p: new T.Vector3(0, 8.0, -14),  t: new T.Vector3(-22, 9.5, -24) },
  facade: { p: new T.Vector3(-1.5, 8.2, -57.8), t: new T.Vector3(-20.5, 8.8, -57.8) },
  close:  { p: new T.Vector3(0, 5.4, 18),    t: new T.Vector3(0, 5.0, 0) },
};""", 'views')

# ---- 5. 构件标注：补殿名（按抬高后的檐口高度调整） ----
Sc("  { n: '石板御道',                p: new T.Vector3(0, 0.1, 22) },\n];",
   """  { n: '石板御道',                p: new T.Vector3(0, 0.1, 22) },
  { n: '五凤山门(1) · 弥勒韦陀',   p: new T.Vector3(0, 15.4, 0) },
  { n: '祖堂 · 深栗两层',          p: new T.Vector3(-25.5, 13.4, -24.4) },
  { n: '栗木抄手廊 · 一层齐平',    p: new T.Vector3(-18.6, 9.8, -20) },
  { n: '错台连廊 · 加高',          p: new T.Vector3(23.4, 9.8, -41.1) },
  { n: '释迦宝殿(2) · 等距重排',   p: new T.Vector3(0, 18.8, -44) },
  { n: '五观堂 · 深栗两层',        p: new T.Vector3(-20.5, 13.4, -57.8) },
  { n: '潮音堂(3) · 文化展览',     p: new T.Vector3(0, 12.0, -88) },
  { n: '药师殿(4) · 深栗两层',     p: new T.Vector3(-20.5, 13.4, -91.2) },
  { n: '龙王殿·财神殿(7)',         p: new T.Vector3(20.5, 13.4, -91.2) },
  { n: '观音堂(5) · 姻缘求子',     p: new T.Vector3(0, 12.6, -132) },
  { n: '朱墙院门',                 p: new T.Vector3(0, 3.0, -110) },
  { n: '锦鲤池 · 跨池石桥',        p: new T.Vector3(0, 0.6, -148) },
  { n: '四合院 · 两侧楼阁连续',    p: new T.Vector3(-20.5, 13.4, -124.6) },
  { n: '抬高台地 · 十二级踏道',    p: new T.Vector3(0, 3.0, -158) },
  { n: '凌霄阁(6) · 二层平坐',     p: new T.Vector3(0, 25.0, -176) },
  { n: '室内 · 主尊与成排蒲团',    p: new T.Vector3(0, 2.0, -44) },
];""", 'hotspots')

Sc("  { n: '“万年正续”横匾',        p: new T.Vector3(0, 5.75, 3.3) },",
   "  { n: '“万年正续”横匾',        p: new T.Vector3(0, 6.20, 4.20) },", 'hotspot-plaque')

# ---- 5b. 主殿（五凤山门，兼天王殿）整体抬高 + 室内 + 前后券门贯通 ----
HALL_BLOCK = """/* ---------- 8. 主殿（五凤山门 · 兼天王殿）：抬高檐口 + 可进入室内 ---------- */
const hall = new T.Group();
{
  // 按实景照片重定比例：一层 8.50（腰檐 9.72）与两侧钟鼓楼一层檐口齐平；
  // 二层上檐 13.97，高于钟鼓楼屋顶（约 12.6）——“一层等高、二层略高”。
  // 室内净高 = ceilingY - F ≈ 7.4（仍为人物 2.72 的 2.7 倍，漫游不压抑）。
  const W = 26.0, H = 7.00, TOP = 1.02, wallZ = 0.20, frontZ = 3.90;
  const E1 = TOP + H + 1.30;      // 下檐（腰檐）：墙顶之上留整层斗拱铺作 = 9.32
  const UB = E1 + 0.30;           // 上层墙体底 = 9.62
  const UW = 3.80;                // 上层墙高（照中二层明显高于一层）
  const E2 = UB + UW + 0.20;      // 上檐出檐高度 = 13.62
  const backZ = -9.60, doorHalf = 1.75;   // 进深
  const F = 1.025;                // 室内地坪（台基顶 1.02）

  /* ---- 依正背实景重建用的局部构件工厂 ---------------------------------- */
  // 金框墨字 / 墨底金字竖匾：正面经板与背面楹联分开做，避免两张贴图互相污染
  const hallCouplet = (text, dark) => new T.MeshStandardMaterial({
    map: canvasTex(128, 640, (g, w, h) => {
      g.fillStyle = dark ? '#2a1d14' : '#d9b667'; g.fillRect(0, 0, w, h);
      g.strokeStyle = dark ? '#c9a24f' : '#7a5324'; g.lineWidth = 6;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.strokeStyle = 'rgba(226,188,107,.45)'; g.lineWidth = 2;
      g.strokeRect(16, 16, w - 32, h - 32);
      g.fillStyle = dark ? '#e7c576' : '#1d1712';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold 48px "Noto Serif CJK SC","KaiTi","STKaiti","SimSun",serif';
      const ch = text.split(''), step = (h - 64) / ch.length;
      ch.forEach((c, i) => g.fillText(c, w / 2, 32 + step * (i + 0.5)));
    }),
    color: 0xffffff, roughness: 0.82, side: T.DoubleSide,
  });
  const CF = [hallCouplet('徑山古剎千年續', false), hallCouplet('萬壽禪門一味真', false)];
  const CB = [hallCouplet('南海觀音普渡眾生登彼岸', false), hallCouplet('西方釋迦弘開覺路引迷津', false)];
  const BACK_PLAQUE = new T.MeshStandardMaterial({
    map: textPlate(['度一切苦厄'], { w: 760, h: 170, size: 88,
      bg: '#c9a24f', fg: '#1d1712', border: '#7a5527' }),
    color: 0xffffff, roughness: 0.68,
  });

  // 檐口圆瓦当：正背两排，跟着剖视组一起隐藏
  const hallEaveTiles = (parent, width, y, z) => {
    const n = Math.max(18, Math.round(width / 0.42));
    const im = new T.InstancedMesh(
      new T.CylinderGeometry(0.093, 0.093, 0.08, 10), std(0xd2ccbc, 0.92), n);
    const q = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0));
    const m = new T.Matrix4();
    for (let i = 0; i < n; i++) im.setMatrixAt(i, m.compose(
      new T.Vector3(-width / 2 + (i + 0.5) * width / n, y, z), q, new T.Vector3(1, 1, 1)));
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = true; parent.add(im);
  };

  // 双扇黑漆板门：sx=+1 为右侧合页，sx=-1 为左侧合页；swing=0 闭合，>0 向外开启。
  // faceZ: 门外朝向（背面用 -1）。带金色铺首门环 + 门钉行，按实景正门处理。
  const doorBossTex = (() => {
    // 铺首兽面：金底圆形，配环；用贴图省建模
    return canvasTex(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#b98f3e'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#6d4d1c'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#8a6526';
      g.beginPath(); g.arc(64, 52, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5c3f14';
      g.beginPath(); g.arc(56, 50, 5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(72, 50, 5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#d8b45c'; g.lineWidth = 7;
      g.beginPath(); g.arc(64, 92, 20, 0, Math.PI * 2); g.stroke();
    });
  })();
  const doorBossMat = new T.MeshStandardMaterial({ map: doorBossTex, transparent: true, roughness: 0.45, metalness: 0.3, side: T.DoubleSide });
  const hallLeaf = (parent, hingeX, h, z, sx, leafW, swing, faceZ = 1, boss = false) => {
    const leaf = new T.Group();
    leaf.position.set(hingeX, TOP, z); parent.add(leaf);
    const dir = -sx;
    leaf.add(box(leafW, h, 0.16, M.ink, dir * leafW / 2, h / 2, 0));
    leaf.add(box(leafW - 0.14, h - 0.24, 0.06, M.woodDark, dir * leafW / 2, h / 2, 0.11 * faceZ));
    for (let i = 1; i < 4; i++)
      leaf.add(box(0.07, h - 0.34, 0.08, M.wood, dir * (leafW * i / 4), h / 2, 0.15 * faceZ));
    for (let j = 1; j < 5; j++)
      leaf.add(box(leafW - 0.20, 0.055, 0.08, M.wood, dir * leafW / 2, h * j / 5, 0.15 * faceZ));
    if (boss) {
      const bx = dir * leafW / 2, by = h * 0.48;
      leaf.add(panel(0.62, 0.78, doorBossMat, bx, by, 0.16 * faceZ, faceZ < 0 ? Math.PI : 0));
      // 门钉：每扇 3 列 5 行鎏金圆钉
      for (let c = 0; c < 3; c++) for (let j = 0; j < 5; j++) {
        const nx = bx + (c - 1) * leafW * 0.24;
        const ny = 0.55 + j * (h - 1.5) / 4;
        const stud = makeMesh(new T.SphereGeometry(0.055, 8, 6), M.gold, nx, ny, 0.16 * faceZ);
        leaf.add(stud);
      }
    }
    leaf.rotation.y = -sx * swing;
    return leaf;
  };

  // 二层平坐栏杆：照片中下层屋面上的一圈深栗木钩栏
  const hallRailing = (parent, z, width, y) => {
    parent.add(box(width, 0.14, 0.20, M.woodDark, 0, y, z));
    const n = Math.max(12, Math.round(width / 0.82));
    for (let i = 0; i <= n; i++)
      parent.add(box(0.085, 0.70, 0.10, M.woodMid, -width / 2 + i * width / n, y + 0.42, z));
    parent.add(box(width, 0.10, 0.16, M.woodMid, 0, y + 0.84, z));
  };

  // 实景级精密斗拱：双跳华栱 + 三重令栱 + 两侧散斗，密铺成一圈层叠铺作带。
  // dir: +1 出跳朝 +z（正面）/ -1 出跳朝 -z（背面）；全部进全局实例网格，零额外 drawcall。
  const fineDG = (x, y, z, s, dir) => {
    const P = (dx, dy, dz, sx, sy, sz) =>
      dougongPush(x + dx * s, y + dy * s, z + dz * s * dir, s, sx, sy, sz);
    P(0, 0.06, 0, 0.56, 0.16, 0.56);       // 坐斗
    P(0, 0.20, 0, 1.10, 0.12, 0.20);       // 泥道栱
    P(0, 0.30, 0.30, 0.20, 0.12, 0.72);    // 华栱一跳
    P(0, 0.42, 0, 1.35, 0.11, 0.22);       // 令栱一
    P(0, 0.52, 0.58, 0.20, 0.12, 0.66);    // 华栱二跳
    P(0, 0.64, 0, 1.55, 0.11, 0.24);       // 令栱二
    P(0, 0.74, 0.86, 0.20, 0.12, 0.58);    // 华栱三跳
    P(0, 0.86, 0, 1.75, 0.11, 0.26);       // 令栱三（最外一跳）
    [-0.55, 0.55].forEach(dx => {
      P(dx, 0.48, 0, 0.16, 0.10, 0.16);
      P(dx * 1.16, 0.70, 0, 0.16, 0.10, 0.16);
      P(dx * 1.28, 0.92, 0, 0.16, 0.10, 0.16);
    });
    P(0, 0.40, 0.52, 0.16, 0.10, 0.16);    // 华栱头散斗
    P(0, 0.62, 0.80, 0.16, 0.10, 0.16);
  };

  const IT = buildInterior(hall, {
    W, H, top: TOP, floorY: F, ceilingY: TOP + H - 0.75,
    frontWallZ: wallZ, backWallZ: backZ, doorHalf,
    backDoor: true, bodyFront: 5.05, bodyBack: backZ - 0.35,
    sideDoor: true,   // 左侧开可通行侧门
    // 山门兼天王殿：进门见弥勒，弥勒身后是面朝内院（ry 转 180°）的韦陀，
    // 四大天王分列两侧。原先韦陀放在 dz +1.55，正好杵在中央拜道上挡住人物。
    pantheon: [
      { kind: 'maitreya', h: 3.05, x: 0,     dz: 0.55, main: true },
      { kind: 'weiTuo',   h: 2.50, x: 0,     dz: -1.20, ry: Math.PI },
      { kind: 'guardian', h: 2.35, x: -6.30, dz: 0.10 },
      { kind: 'guardian', h: 2.35, x: 6.30,  dz: 0.10 },
      { kind: 'guardian', h: 2.35, x: -3.95, dz: -0.95 },
      { kind: 'guardian', h: 2.35, x: 3.95,  dz: -0.95 }
    ],
  }, 'tianwang', 0);

  // 正面：白墙三券门（中门通行，左右为闭合板门）+ 经板楹联，按实景重做
  const shape = new T.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const doors = [
    { x: 0, w: 3.50, h: 4.55, open: true },
    { x: -5.60, w: 2.30, h: 3.85, open: false },
    { x: 5.60, w: 2.30, h: 3.85, open: false }
  ];
  doors.forEach(d => shape.holes.push(archShape(d.x, d.w, d.h)));
  const wallGeo = new T.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 20 });
  IT.front.add(makeMesh(wallGeo, M.wall, 0, TOP, wallZ));
  doors.forEach((d, di) => {
    if (!d.open) {
      const s = archShape(d.x, d.w - 0.06, d.h - 0.03);
      const dark = new T.ShapeGeometry(s, 20); remapShapeUV(dark, d.w, d.h);
      IT.front.add(makeMesh(dark, M.ink, 0, TOP, wallZ + 0.47, false));
      const lw = (d.w - 0.12) / 2;
      hallLeaf(IT.front, d.x - d.w / 2 + 0.06, d.h - 0.10, wallZ + 0.52, -1, lw, 0, 1, true);
      hallLeaf(IT.front, d.x + d.w / 2 - 0.06, d.h - 0.10, wallZ + 0.52, +1, lw, 0, 1, true);
    }
    const pts = archOutline(d.x, d.w + 0.10, d.h + 0.05)
      .map(p => new T.Vector3(p[0], p[1] + TOP, wallZ + 0.55));
    IT.front.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 64, 0.12, 8, true), M.woodDark));
    IT.front.add(box(d.w + 0.55, 0.20, 0.18, M.woodMid, d.x, TOP + d.h + 0.32, wallZ + 0.57));
    IT.front.add(box(d.w + 0.30, 0.08, 0.14, M.woodDark, d.x, TOP + d.h + 0.16, wallZ + 0.58));
  });
  // 墙身竖向木柱，把白墙分格成实景中的三开间
  [-W / 2 + 0.30, -3.35, 3.35, W / 2 - 0.30].forEach(x =>
    IT.front.add(box(0.26, H, 0.24, M.woodDark, x, TOP + H / 2, wallZ + 0.30)));
  // 经板 / 楹联：中央与左右券门之间各一对，深色木底金字
  [-10.10, -2.95, 2.95, 10.10].forEach((x, i) => {
    IT.front.add(box(0.80, 3.15, 0.12, M.woodDark, x, TOP + 2.60, wallZ + 0.50));
    IT.front.add(panel(0.68, 3.00, CF[i % 2], x, TOP + 2.60, wallZ + 0.58));
  });

  // 左侧墙开侧门：沿 z 展开的带券洞墙，洞心 z=-2.64（对齐 buildInterior sdZ=innerCZ）
  const sdZ = -2.64, sdW = 2.4, sdH = Math.min(5.4, H * 0.5);
  const lw = makeDoorWall(14.4, H, sdW, sdH, TOP, 0, M.wallShade, 0.5);
  lw.rotation.y = Math.PI / 2;
  lw.position.set(-W / 2 - 0.45, TOP, sdZ);
  hall.add(lw);
  [-1, 1].forEach(ss => hall.add(box(0.30, sdH, 0.26, M.woodDark,
    -W / 2 - 0.10, TOP + sdH / 2, sdZ + ss * (sdW / 2 + 0.13))));
  hall.add(box(0.30, 0.24, sdW + 0.50, M.woodDark, -W / 2 - 0.10, TOP + sdH + 0.10, sdZ));
  hall.add(box(0.5, H, 14.4, M.wallShade, W / 2 + 0.2, TOP + H / 2, -3.1));

  // 背面：白墙 + 中央 rectangular 双扇门（照片为方门，不是券门）
  const bw = 3.10, bh = 4.20;
  const bShape = new T.Shape();
  bShape.moveTo(-W / 2, 0); bShape.lineTo(W / 2, 0); bShape.lineTo(W / 2, H);
  bShape.lineTo(-W / 2, H); bShape.lineTo(-W / 2, 0);
  const bHole = new T.Path();
  bHole.moveTo(-bw / 2, 0); bHole.lineTo(-bw / 2, bh);
  bHole.lineTo(bw / 2, bh); bHole.lineTo(bw / 2, 0); bHole.closePath();
  bShape.holes.push(bHole);
  hall.add(makeMesh(new T.ExtrudeGeometry(bShape,
    { depth: 0.5, bevelEnabled: false, curveSegments: 12 }), M.wallShade, 0, TOP, backZ));
  // 门洞内壁深色，外挂两扇黑漆大门（带铺首门环+门钉），微掩保留通行缺口
  hall.add(box(bw - 0.08, bh - 0.08, 0.05, M.ink, 0, TOP + bh / 2, backZ + 0.06));
  hallLeaf(hall, -bw / 2 + 0.05, bh - 0.10, backZ - 0.12, -1, (bw - 0.10) / 2, 0.30, -1, true);
  hallLeaf(hall, +bw / 2 - 0.05, bh - 0.10, backZ - 0.12, +1, (bw - 0.10) / 2, 0.30, -1, true);
  hall.add(box(bw + 0.70, 0.22, 0.30, M.woodDark, 0, TOP + bh + 0.18, backZ - 0.16));
  // 背门横匾“度一切苦厄”+ 两侧黄底墨字楹联
  hall.add(box(4.70, 1.16, 0.14, M.woodDark, 0, TOP + 4.72, backZ - 0.10));
  hall.add(panel(4.45, 1.00, BACK_PLAQUE, 0, TOP + 4.72, backZ - 0.19, Math.PI));
  [-2.75, 2.75].forEach((x, i) => {
    hall.add(box(0.72, 3.25, 0.12, M.woodMid, x, TOP + 2.35, backZ - 0.10));
    hall.add(panel(0.60, 3.10, CB[i], x, TOP + 2.35, backZ - 0.18, Math.PI));
  });
  // 楹联外侧的木格窗：实景背面门两侧各一大扇（土黄木格）
  [-6.90, 6.90].forEach(x => {
    hall.add(box(3.30, 3.05, 0.10, M.woodDark, x, TOP + 2.55, backZ - 0.12));
    hall.add(panel(3.08, 2.85, M.lattice, x, TOP + 2.55, backZ - 0.19, Math.PI));
  });
  [-9.9, -4.40, 4.40, 9.9].forEach(x =>
    hall.add(box(0.24, H, 0.26, M.woodDark, x, TOP + H / 2, backZ - 0.12)));
  hall.add(box(W - 0.4, 0.22, 0.26, M.woodMid, 0, TOP + H - 0.55, backZ - 0.14));
  // 背面月台：带石栏的抬高平台，中央阶梯下院（实景门前月台 + 台阶）
  hall.add(box(W + 0.4, 0.30, 3.30, M.stone, 0, TOP - 0.15, backZ - 1.95));
  for (let k = 0; k < 9; k++)
    hall.add(box(9.2, 0.15, 0.38, M.stone, 0, 0.96 - k * 0.107, backZ - 3.60 - k * 0.38));
  // 月台三面石栏（后侧留出阶梯口）
  const baluster = (x0, z0, x1, z1) => {
    const n = Math.max(3, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.9));
    for (let k = 0; k <= n; k++) {
      const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n;
      hall.add(box(0.22, 0.62, 0.22, M.stoneWhite, x, TOP + 0.31, z));
    }
    hall.add(box(Math.abs(x1 - x0) + 0.24, 0.14, Math.abs(z1 - z0) + 0.24, M.stoneDark,
      (x0 + x1) / 2, TOP + 0.68, (z0 + z1) / 2));
  };
  baluster(-W / 2 - 0.1, backZ - 0.55, -4.6, backZ - 0.55);
  baluster(4.6, backZ - 0.55, W / 2 + 0.1, backZ - 0.55);
  baluster(-W / 2 - 0.1, backZ - 0.55, -W / 2 - 0.1, backZ - 3.45);
  baluster(W / 2 + 0.1, backZ - 0.55, W / 2 + 0.1, backZ - 3.45);

  // 正面月台：抬高平台 + 三面石栏 + 中央阶梯，与背面月台对称（实景殿前月台）
  hall.add(box(W + 0.4, 0.30, 3.50, M.stone, 0, TOP - 0.15, frontZ + 1.40));
  for (let k = 0; k < 9; k++)
    hall.add(box(9.2, 0.15, 0.38, M.stone, 0, 0.96 - k * 0.107, frontZ + 3.15 + k * 0.38));
  baluster(-W / 2 - 0.1, frontZ + 3.05, -4.6, frontZ + 3.05);
  baluster(4.6, frontZ + 3.05, W / 2 + 0.1, frontZ + 3.05);
  baluster(-W / 2 - 0.1, frontZ - 0.35, -W / 2 - 0.1, frontZ + 3.05);
  baluster(W / 2 + 0.1, frontZ - 0.35, W / 2 + 0.1, frontZ + 3.05);

  // 前廊柱列 + 额枋：柱位按三开间布置，屋檐下铺作成排
  const C = H + 0.10;
  const colX = [-12.0, -9.20, -3.25, 3.25, 9.20, 12.0];
  colX.forEach(x => {
    hall.add(cyl(0.26, 0.29, C, M.wood, 12, x, TOP + C / 2, frontZ));
    hall.add(cyl(0.36, 0.36, 0.18, M.stoneDark, 12, x, TOP + 0.05, frontZ));
  });
  hall.add(box(26.2, 0.36, 0.40, M.woodMid, 0, TOP + H - 0.18, frontZ));
  hall.add(box(26.2, 0.18, 0.32, M.woodDark, 0, TOP + H - 0.52, frontZ));
  // 下檐斗拱铺作带：实景为密集层叠铺作，正背各密铺一整列于檐下、墙外侧
  const dgY = E1 - 1.05;
  const dgN = 17;
  for (let i = 0; i < dgN; i++) {
    const x = -12.0 + i * 24.0 / (dgN - 1);
    fineDG(x, dgY, frontZ + 1.10, 0.85, +1);   // 前檐下（柱外、檐内）
    fineDG(x, dgY, backZ - 0.40, 0.85, -1);    // 后檐下（墙外、檐内）
  }
  [-12.35, 12.35].forEach(x =>
    [-8.5, -5.7, -2.9, -0.1, 2.7, 5.5].forEach(z =>
      pushDougong(x, dgY, z, 0.80)));
  hall.add(box(W + 1.0, 0.30, 0.34, M.woodMid, 0, E1 - 0.50, backZ + 0.20));

  // 横匾“万年正续”：依实景落在中央券门之上、前廊斗拱之下
  const pm = new T.MeshStandardMaterial({ map: plaqueMain, color: 0xffffff, roughness: 0.7 });
  hall.add(box(5.10, 1.16, 0.16, M.woodDark, 0, TOP + 5.18, frontZ + 0.16));
  hall.add(panel(4.86, 0.96, pm, 0, TOP + 5.18, frontZ + 0.26));
  [-2.85, 2.85].forEach(x => hall.add(box(0.18, 1.30, 0.20, M.woodMid, x, TOP + 5.18, frontZ + 0.20)));

  // 下檐：按实景做成围绕上层楼身的一圈重檐，正背出檐都带圆瓦当
  const lowerRoof = makeRoof(27.4, 17.0, E1, 2.30,
    { corner: 0.52, ridgeHalf: 6.1, curve: 1.38, seg: 30, finial: false, beasts: true });
  lowerRoof.position.z = -2.40;
  IT.cut.add(lowerRoof);
  hallEaveTiles(IT.cut, 27.4, E1 - 0.03, 6.10);     // 前檐
  hallEaveTiles(IT.cut, 27.4, E1 - 0.03, -10.90);   // 后檐

  // 二层：白色壁带 + 深栗木构 + 平坐钩栏（正面竖匾 / 背面连续直棂）
  const UZ = -2.10, UW2 = 21.0, UD2 = 10.6;
  hall.add(box(UW2, UW, UD2, M.wall, 0, UB + UW / 2, UZ));
  // 上下横枋与分间立柱
  [UB + 0.12, UB + UW - 0.12].forEach(y => {
    hall.add(box(UW2 + 0.30, 0.26, 0.32, M.woodDark, 0, y, UZ + UD2 / 2 + 0.10));
    hall.add(box(UW2 + 0.30, 0.26, 0.32, M.woodDark, 0, y, UZ - UD2 / 2 - 0.10));
  });
  for (let i = -3; i <= 3; i++) {
    const x = i * 3.0;
    hall.add(box(0.22, UW - 0.20, 0.26, M.woodMid, x, UB + UW / 2, UZ + UD2 / 2 + 0.12));
    hall.add(box(0.22, UW - 0.20, 0.26, M.woodMid, x, UB + UW / 2, UZ - UD2 / 2 - 0.12));
  }
  // 正面：中央竖匾 + 两侧窗；背面：连续直棂窗带（第二张照片）
  [-8.4, -4.8, 4.8, 8.4].forEach(x => {
    hall.add(box(2.55, 1.55, 0.10, M.woodDark, x, UB + 1.02, UZ + UD2 / 2 + 0.16));
    hall.add(panel(2.34, 1.38, M.lattice, x, UB + 1.02, UZ + UD2 / 2 + 0.23));
  });
  for (let i = -4; i <= 4; i++) {
    const x = i * 2.25;
    hall.add(box(1.98, 1.50, 0.10, M.woodDark, x, UB + 1.02, UZ - UD2 / 2 - 0.16));
    hall.add(panel(1.80, 1.34, M.lattice, x, UB + 1.02, UZ - UD2 / 2 - 0.23, Math.PI));
  }
  const pvm = new T.MeshStandardMaterial({ map: plaqueVert, color: 0xffffff, roughness: 0.7 });
  hall.add(box(1.40, 2.36, 0.14, M.woodDark, 0, UB + 1.05, UZ + UD2 / 2 + 0.20));
  hall.add(panel(1.22, 2.16, pvm, 0, UB + 1.05, UZ + UD2 / 2 + 0.30));
  // 白色小横披：暗色枋上间隔露白，正背都做
  [-1, 1].forEach(s => {
    const z = UZ + s * (UD2 / 2 + 0.20);
    for (let i = -4; i <= 4; i++)
      hall.add(box(0.86, 0.18, 0.08, M.wall, i * 2.25, UB + UW - 0.48, z));
  });
  // 平坐钩栏
  hallRailing(hall, UZ + UD2 / 2 + 0.55, UW2 - 0.4, E1 - 0.18);
  hallRailing(hall, UZ - UD2 / 2 - 0.55, UW2 - 0.4, E1 - 0.18);
  // 二层柱头铺作：上檐下同样密铺一整圈精密斗拱（实景中白壁带下方那排）
  const dgN2 = 11;
  for (let i = 0; i < dgN2; i++) {
    const x = -9.5 + i * 19.0 / (dgN2 - 1);
    fineDG(x, E2 - 1.02, UZ + UD2 / 2 + 0.95, 0.78, +1);   // 前檐下、墙外
    fineDG(x, E2 - 1.02, UZ - UD2 / 2 - 0.95, 0.78, -1);   // 后檐下、墙外
  }
  // 上檐：主屋顶，正脊鸱吻、四角轻翘，随剖视组隐藏
  const upperRoof = makeRoof(25.8, 16.4, E2, 4.10,
    { corner: 0.55, ridgeHalf: 4.6, curve: 1.42, seg: 32, beasts: true });
  upperRoof.position.z = UZ;
  IT.cut.add(upperRoof);
  hallEaveTiles(IT.cut, 25.8, E2 - 0.03, UZ + 8.20);
  hallEaveTiles(IT.cut, 25.8, E2 - 0.03, UZ - 8.20);
}
modelRoot.add(hall);"""

Scre(r'const hall = new T\.Group\(\);.*?modelRoot\.add\(hall\);', HALL_BLOCK, 'hall-block')

# ---- 6. 导出：走通用兼容的 __EXPORT_GLB__ ----
Sc("""// 导出 GLB
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
});""",
   """// 导出 GLB：展开实例化构件、只导出建筑，通用查看器可直接打开
document.getElementById('btn-export').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const old = btn.textContent;
  btn.textContent = '⏳ 正在生成…'; btn.disabled = true;
  try {
    const u8 = await window.__EXPORT_GLB__();
    const blob = new Blob([u8], { type: 'model/gltf-binary' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '径山万寿禅寺_全寺中轴.glb';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    btn.textContent = '✓ 已导出';
  } catch (err) {
    console.error(err);
    btn.textContent = '✗ 导出失败';
  }
  setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 2200);
});""", 'export handler')

# ---- 7. URL 参数直接切视角，便于静态截图 ----
Sc("document.getElementById('loading').classList.add('hide');\nwindow.__TEMPLE_READY__ = true;",
   """const qv = new URLSearchParams(location.search).get('view');
if (qv && views[qv]) goView(qv);
if (new URLSearchParams(location.search).has('clean')) {
  document.querySelectorAll('.ui').forEach(el => el.style.display = 'none');
  document.getElementById('labels').style.display = 'none';
}
document.getElementById('loading').classList.add('hide');
window.__TEMPLE_READY__ = true;""", 'url-view')

# ---- 7b. 每帧人物 / 第三人称相机更新钩子（实现在桥运行时里） ----
Sc("  controls.update();\n  updateLabels();\n  renderer.render(scene, camera);",
   "  controls.update();\n  if (window.__AVATAR_UPDATE__) window.__AVATAR_UPDATE__(now);\n"
   "  updateLabels();\n  renderer.render(scene, camera);", 'avatar-hook')

# ---- 8. 插入扩展场景代码（必须在斗拱统一实例化之前） ----
Sc('/* ---------- 11. 斗拱统一实例化 ---------- */',
   EXTJS + '\n/* ---------- 11. 斗拱统一实例化 ---------- */', 'extension insert')

# ---- 9. 合成：vendor 全部内联 + 场景代码，写单文件产物 ----
if PLACEHOLDER not in HTML:
    raise SystemExit('MISS: placeholder in page.template.html')

vendor = ''.join(read(os.path.join(HERE, p)) for p in VENDOR_PARTS)
out = HTML.replace(PLACEHOLDER, vendor + SCEN, 1)

io.open(OUT, 'w', encoding='utf-8', newline='').write(out)

total = len(out.encode('utf-8'))
app = len(SCEN.encode('utf-8'))
print('\n--- 体积 ---')
print('  vendor/   %10s B' % format(len(vendor.encode('utf-8')), ','))
print('  src/      %10s B' % format(app, ','))
print('  产物      %10s B' % format(total, ','))
print('WROTE', OUT)
