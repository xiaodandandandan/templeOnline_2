# -*- coding: utf-8 -*-
"""在既有「山門殿」页面基线上扩展为全寺中轴场景，生成单文件 index.html。
   只替换与需求相关的片段；three.js / OrbitControls / GLTFExporter 内联库原样保留。"""
import io, os, re, glob, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASE = glob.glob(os.path.join(ROOT, '_baseline', '*.html'))[0]
OUT = os.path.join(HERE, 'index.html')

s = io.open(BASE, encoding='utf-8').read()
ext = io.open(os.path.join(HERE, 'extension.js'), encoding='utf-8').read()

# 资料库页面注入脚本在本地单文件场景里无对应路径，直接移除以免 404 噪声
s = re.sub(r'<script[^>]*src="/page/page_comm/inject\.js"[^>]*></script>\s*', '', s, count=1)


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit('MISS: ' + label)
    if s.count(old) != 1:
        raise SystemExit('NOT UNIQUE: ' + label + ' (%d)' % s.count(old))
    s = s.replace(old, new, 1)
    print('OK  ', label)


def rep_re(pattern, new, label, flags=re.S):
    global s
    s2, n = re.subn(pattern, new, s, count=1, flags=flags)
    if n != 1:
        raise SystemExit('MISS REGEX: ' + label)
    s = s2
    print('OK  ', label)


# ---- 1. 标题 / 说明 ----
rep('<title data-page-node-id="Al8fWxrLrSiDBwuu38pCoh" data-pnid-children="Q05kxXqiFCRsrEzGjNzu36">'
    '徑山萬壽禪寺 · 山門殿 | Three.js 程序化 3D 复原</title>',
    '<title data-page-node-id="Al8fWxrLrSiDBwuu38pCoh" data-pnid-children="Q05kxXqiFCRsrEzGjNzu36">'
    '徑山萬壽禪寺 · 依遊覽圖全寺布局 | Three.js 程序化 3D 复原</title>', 'title')

rep('<h1 data-page-node-id="PUgT0FoGDt8lhP8bErILlB"><!--pnid:WZowZEwoMa2KsjxeiWdRKA-->徑山萬壽禪寺 · 山門殿\n'
    '    <small data-page-node-id="C43ODg4nmAt0Zq31z1qJkm"><!--pnid:1vyLSRe7vSq0s0hEHRUbrO-->基于照片的程序化三维复原</small>\n'
    '  </h1>',
    '<h1 data-page-node-id="PUgT0FoGDt8lhP8bErILlB"><!--pnid:WZowZEwoMa2KsjxeiWdRKA-->徑山萬壽禪寺 · 遊覽圖布局\n'
    '    <small data-page-node-id="C43ODg4nmAt0Zq31z1qJkm"><!--pnid:1vyLSRe7vSq0s0hEHRUbrO-->依《徑山寺遊覽全攻略》航拍標注重排</small>\n'
    '  </h1>', 'h1')

rep_re(r'(<div data-page-node-id="Z2MZwSo29N0w6y7zppoE9O" class="desc">).*?(</div>)',
       r'\1\n'
       '    依航拍圖由南向北：請香處 → 進口 → 五鳳山門(1)<br>\n'
       '    山門內供彌勒、韋陀，兼天王殿之制<br>\n'
       '    <b>中軸五殿等距 44</b>，殿距全部拉齊<br>\n'
       '    0 / -44 / -88 / -132 / -176，進深 176<br>\n'
       '    兩側<b>深栗木兩層樓閣</b>：密直棂窗 · 無紅欄<br>\n'
       '    金匾楹聯 · 瓦當腰檐，一層<b>齊平</b><br>\n'
       '    廊兩端折入院內，<b>不直抵殿門</b><br>\n'
       '    朱牆院門 · 錦鯉池 · 踏道登 +6 高台<br>\n'
       '    室內：金色主尊、壁畫背屏、成排蒲團<br>\n'
       '    <b>方塊人物</b>漫游：WASD 拖曳 滾輪 跪拜\n'
       r'\2', 'desc')

# ---- 1b. 山门匾额依航拍图改题「五鳳山門」 ----
rep("const plaqueMain = textPlate(['萬年正續'], { w: 640, h: 150, size: 92 });",
    "const plaqueMain = textPlate(['五鳳山門'], { w: 640, h: 150, size: 86 });", 'plaque-main')

# ---- 2. 视角按钮 ----
rep('<button data-page-node-id="oS09ud3m9WO97bbrMRvV3L" data-view="top"><!--pnid:YRFjnKI5b65akXyeWcfR4y-->俯瞰</button>',
    '<button data-page-node-id="oS09ud3m9WO97bbrMRvV3L" data-view="top"><!--pnid:YRFjnKI5b65akXyeWcfR4y-->全寺俯瞰</button>', 'view-top-label')

rep('<button data-page-node-id="HNlH7n7GaHiAJKabeU1mbu" data-view="close"><!--pnid:dqEvB2bxwQ4m2BFXBHWQGz-->近景</button>',
    '<button data-page-node-id="HNlH7n7GaHiAJKabeU1mbu" data-view="close"><!--pnid:dqEvB2bxwQ4m2BFXBHWQGz-->近景</button>\n'
    '  <button data-view="axis">中軸全景</button>', 'view-axis-button')

# ---- 3. 雾 / 阴影 / 相机（等距重排后全寺纵深约 208 单位，拉远可览全貌） ----
rep('scene.fog = new T.Fog(0xcfe3f0, 78, 230);', 'scene.fog = new T.Fog(0xcfe3f0, 620, 1500);', 'fog')
rep('sun.shadow.camera.left = -42; sun.shadow.camera.right = 42;',
    'sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;', 'shadow-x')
rep('sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -30;',
    'sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -150;', 'shadow-y')
rep('sun.shadow.camera.near = 1; sun.shadow.camera.far = 130;',
    'sun.shadow.camera.near = 1; sun.shadow.camera.far = 480;', 'shadow-far')
rep('const camera = new T.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 600);',
    'const camera = new T.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 2000);', 'camera-far')
rep('camera.position.set(0, 8.8, 36);', 'camera.position.set(52, 150, 122);', 'camera-default')
rep('controls.target.set(0, 6.0, 0);', 'controls.target.set(0, 3.0, -88);', 'target-default')
rep('controls.minDistance = 12; controls.maxDistance = 110;',
    'controls.minDistance = 12; controls.maxDistance = 900;', 'controls-distance')

# ---- 3a. 两株古杉移到山门两侧，避免正对横匾与中央券门 ----
rep("natureRoot.add(makeCedar(-2.75, 6.6, 15.0, 0.86));\nnatureRoot.add(makeCedar(2.80, 6.3, 15.6, 0.90));",
    "natureRoot.add(makeCedar(-8.60, 7.2, 15.0, 0.86));\nnatureRoot.add(makeCedar(8.60, 7.0, 15.6, 0.90));", 'cedar-offset')

# ---- 3b. 地面覆盖全寺（原 260×260 会露边） ----
rep("const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 26, 26);",
    "const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 90, 90);", 'pave-repeat')
rep('const base = makeMesh(new T.PlaneGeometry(260, 260),',
    'const base = makeMesh(new T.PlaneGeometry(900, 900),', 'ground-size')
rep("new T.MeshStandardMaterial({ map: paveSquare, color: 0xffffff, roughness: 1 }), 0, -0.03, 0, false);",
    "new T.MeshStandardMaterial({ map: paveSquare, color: 0xffffff, roughness: 1 }), 0, -0.03, -88, false);", 'ground-center')

# ---- 4. 视角表 ----
rep("""const views = {
  front:  { p: new T.Vector3(0, 8.8, 36),   t: new T.Vector3(0, 6.0, 0) },
  angle:  { p: new T.Vector3(-25, 12.5, 29),t: new T.Vector3(0, 5.6, 0) },
  top:    { p: new T.Vector3(2, 38, 30),    t: new T.Vector3(0, 2.0, 0) },
  close:  { p: new T.Vector3(0, 5.4, 18),   t: new T.Vector3(0, 5.0, 0) },
};""",
    """const views = {
  front:  { p: new T.Vector3(0, 8.0, 22),    t: new T.Vector3(0, 6.2, 0) },
  angle:  { p: new T.Vector3(-25, 12.5, 29), t: new T.Vector3(0, 5.6, 0) },
  top:    { p: new T.Vector3(0, 420, 14),    t: new T.Vector3(0, 0, -88) },
  axis:   { p: new T.Vector3(52, 150, 122),  t: new T.Vector3(0, 3.0, -88) },
  pond:   { p: new T.Vector3(18, 26, -126),  t: new T.Vector3(0, 1.5, -155) },
  hall:   { p: new T.Vector3(6, 9, -38.5),   t: new T.Vector3(0, 1.4, -46) },
  shrine: { p: new T.Vector3(0, 3.6, -35),   t: new T.Vector3(0, 2.2, -48) },
  hall_tw:{ p: new T.Vector3(3, 14, 0),      t: new T.Vector3(0, 1.3, -4.5) },
  gate:   { p: new T.Vector3(26, 27, 64),    t: new T.Vector3(0, 4.0, 12) },
  site:   { p: new T.Vector3(108, 205, 132), t: new T.Vector3(0, 2.0, -88) },
  court:  { p: new T.Vector3(38, 66, 20),    t: new T.Vector3(0, 1.0, -22) },
  courtTop:{p: new T.Vector3(0, 110, -12),   t: new T.Vector3(0, 0, -22) },
  cloister:{p: new T.Vector3(0, 7.5, -11), t: new T.Vector3(-18.6, 5.0, -24) },
  song:   { p: new T.Vector3(0, 8.0, -14),  t: new T.Vector3(-22, 9.5, -24) },
  facade: { p: new T.Vector3(-1.5, 8.2, -57.8), t: new T.Vector3(-20.5, 8.8, -57.8) },
  close:  { p: new T.Vector3(0, 5.4, 18),    t: new T.Vector3(0, 5.0, 0) },
};""", 'views')

# ---- 5. 构件标注：补殿名（按抬高后的檐口高度调整） ----
rep("  { n: '石板御道',                p: new T.Vector3(0, 0.1, 22) },\n];",
    """  { n: '石板御道',                p: new T.Vector3(0, 0.1, 22) },
  { n: '請香處 · 香亭',            p: new T.Vector3(0, 4.4, 32) },
  { n: '進口 · 牌坊',              p: new T.Vector3(-9, 5.6, 24) },
  { n: '五鳳山門(1) · 彌勒韋陀',   p: new T.Vector3(0, 17.0, 0) },
  { n: '祖堂 · 深栗兩層',          p: new T.Vector3(-25.5, 13.4, -24.4) },
  { n: '栗木抄手廊 · 一層齊平',    p: new T.Vector3(-18.6, 9.8, -20) },
  { n: '錯台連廊 · 加高',          p: new T.Vector3(23.4, 9.8, -41.1) },
  { n: '釋迦寶殿(2) · 等距重排',   p: new T.Vector3(0, 18.8, -44) },
  { n: '五觀堂 · 深栗兩層',        p: new T.Vector3(-20.5, 13.4, -57.8) },
  { n: '出口 · 牌坊',              p: new T.Vector3(-30, 5.6, -59) },
  { n: '潮音堂(3) · 文化展覽',     p: new T.Vector3(0, 12.0, -88) },
  { n: '藥師殿(4) · 深栗兩層',     p: new T.Vector3(-20.5, 13.4, -91.2) },
  { n: '龍王殿·財神殿(7)',         p: new T.Vector3(20.5, 13.4, -91.2) },
  { n: '觀音堂(5) · 姻緣求子',     p: new T.Vector3(0, 12.6, -132) },
  { n: '朱牆院門',                 p: new T.Vector3(0, 3.0, -110) },
  { n: '錦鯉池 · 跨池石橋',        p: new T.Vector3(0, 0.6, -148) },
  { n: '四合院 · 兩側樓閣連續',    p: new T.Vector3(-20.5, 13.4, -124.6) },
  { n: '抬高台地 · 十二級踏道',    p: new T.Vector3(0, 3.0, -158) },
  { n: '凌霄閣(6) · 二層平坐',     p: new T.Vector3(0, 25.0, -176) },
  { n: '室內 · 主尊與成排蒲團',    p: new T.Vector3(0, 2.0, -44) },
];""", 'hotspots')

rep("  { n: '「萬年正續」横匾',        p: new T.Vector3(0, 5.75, 3.3) },",
    "  { n: '「五鳳山門」横匾',        p: new T.Vector3(0, 9.62, 3.3) },", 'hotspot-plaque')

# ---- 5b. 主殿（五鳳山門，兼天王殿）整体抬高 + 室内 + 前后券门贯通 ----
# 基线代码写死了高度与坐标，这里整段重写为参数化版本，与 extension.js 的
# buildInterior / makeDoorWall 协同；函数声明在同一 bootstrap 作用域内提升，可直接调用。
HALL_BLOCK = """/* ---------- 8. 主殿（五鳳山門 · 兼天王殿）：抬高檐口 + 可进入室内 ---------- */
const hall = new T.Group();
{
  const W = 21.0, H = 9.4, TOP = 1.02, wallZ = 0.20, frontZ = 3.05;
  const E1 = TOP + H + 0.20;      // 下檐出檐高度
  const UB = E1 + 1.55;           // 上层墙体底
  const UW = 2.95;                // 上层墙高
  const E2 = UB + UW + 0.20;      // 上檐出檐高度
  const backZ = -7.20, doorHalf = 1.75;
  const F = 1.025;                // 室内地坪（台基顶 1.02）

  const IT = buildInterior(hall, {
    W, H, top: TOP, floorY: F, ceilingY: TOP + H - 0.75,
    frontWallZ: wallZ, backWallZ: backZ, doorHalf,
    backDoor: true, bodyFront: 5.05, bodyBack: backZ - 0.35,
  }, 'tianwang', 0);

  // 白墙 + 三券门：中央门敞开供人物穿行；两侧门保留深色格栅
  const shape = new T.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const doors = [
    { x: 0, w: 3.50, h: 6.20, open: true },
    { x: -5.40, w: 2.50, h: 5.20, open: false },
    { x: 5.40, w: 2.50, h: 5.20, open: false }
  ];
  doors.forEach(d => shape.holes.push(archShape(d.x, d.w, d.h)));
  const wallGeo = new T.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 20 });
  IT.cut.add(makeMesh(wallGeo, M.wall, 0, TOP, wallZ));
  doors.forEach(d => {
    if (!d.open) {
      const s = archShape(d.x, d.w - 0.06, d.h - 0.03);
      const dark = new T.ShapeGeometry(s, 20); remapShapeUV(dark, d.w, d.h);
      IT.cut.add(makeMesh(dark, M.ink, 0, TOP, wallZ + 0.47, false));
      const lat = new T.ShapeGeometry(s, 20); remapShapeUV(lat, d.w, d.h);
      const lm = M.lattice.clone(); lm.map = latticeTex.clone(); lm.map.repeat.set(2.2, 2.6); lm.map.needsUpdate = true;
      IT.cut.add(makeMesh(lat, lm, 0, TOP, wallZ + 0.485, false));
    }
    const pts = archOutline(d.x, d.w + 0.06, d.h + 0.03)
      .map(p => new T.Vector3(p[0], p[1] + TOP, wallZ + 0.53));
    hall.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 56, 0.085, 6, true), M.woodDark));
    hall.add(box(d.w + 0.4, 0.16, 0.14, M.woodMid, d.x, TOP + d.h + 0.28, wallZ + 0.54));
  });

  // 侧墙 / 后墙（后墙开中央券门，与御道贯通）
  hall.add(box(0.5, H, 10.4, M.wallShade, -W / 2 - 0.2, TOP + H / 2, -2.1));
  hall.add(box(0.5, H, 10.4, M.wallShade, W / 2 + 0.2, TOP + H / 2, -2.1));
  hall.add(makeDoorWall(W, H, 3.50, 6.20, TOP, backZ, M.wallShade, 0.5));

  // 前廊柱列 + 额枋 + 斗拱
  const C = H + 0.10;
  const colX = [-9.60, -7.40, -2.60, 2.60, 7.40, 9.60];
  colX.forEach(x => {
    hall.add(cyl(0.24, 0.27, C, M.wood, 12, x, TOP + C / 2, frontZ));
    hall.add(cyl(0.34, 0.34, 0.16, M.stoneDark, 12, x, TOP + 0.04, frontZ));
    pushDougong(x, TOP + H - 0.22, frontZ, 0.95);
  });
  hall.add(box(20.9, 0.34, 0.36, M.woodMid, 0, TOP + H - 0.22, frontZ));
  hall.add(box(20.9, 0.18, 0.30, M.woodDark, 0, TOP + H - 0.54, frontZ));
  [-9.60, -2.60, 2.60, 9.60].forEach(x => pushDougong(x, TOP + H - 0.22, 0.40, 0.8));

  // 前廊格栅窗 / 经板
  [-9.2, 9.2].forEach(x => {
    hall.add(panel(1.5, 2.4, M.lattice, x, TOP + H * 0.45, wallZ + 0.53));
    hall.add(box(1.72, 0.12, 0.10, M.woodMid, x, TOP + H * 0.45 + 1.26, wallZ + 0.56));
    hall.add(box(1.72, 0.12, 0.10, M.woodMid, x, TOP + H * 0.45 - 1.26, wallZ + 0.56));
  });
  [-8.30, -3.10, 3.10, 8.30].forEach(x => {
    hall.add(panel(0.78, 3.3, M.sutra, x, TOP + H * 0.48, wallZ + 0.55));
    hall.add(box(0.92, 0.10, 0.10, M.woodMid, x, TOP + H * 0.48 + 1.71, wallZ + 0.58));
    hall.add(box(0.92, 0.10, 0.10, M.woodMid, x, TOP + H * 0.48 - 1.71, wallZ + 0.58));
  });

  // 横匾「五鳳山門」（依航拍图题字，内供彌勒、韋陀）
  const pm = new T.MeshStandardMaterial({ map: plaqueMain, color: 0xffffff, roughness: 0.7 });
  hall.add(panel(4.5, 1.05, pm, 0, TOP + H - 0.80, frontZ + 0.22));
  hall.add(box(4.75, 1.22, 0.14, M.woodDark, 0, TOP + H - 0.80, frontZ + 0.13));

  // 下檐 + 上层墙体 + 上檐：屋顶归入剖视组，入殿自动隐藏
  IT.cut.add(makeRoof(24.0, 13.0, E1, 2.50,
    { corner: 0.70, ridgeHalf: 5.2, curve: 1.45, seg: 28, finial: false, beasts: false }));
  hall.add(box(16.4, UW, 8.2, M.wall, 0, UB + UW / 2, -1.7));
  hall.add(box(16.7, 0.30, 8.5, M.woodMid, 0, UB + UW + 0.15, -1.7));
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    hall.add(panel(1.5, 1.75, M.lattice, i * 1.95, UB + UW / 2, 2.32));
    hall.add(box(1.7, 0.10, 0.10, M.woodDark, i * 1.95, UB + UW - 0.07, 2.36));
  }
  const pvm = new T.MeshStandardMaterial({ map: plaqueVert, color: 0xffffff, roughness: 0.7 });
  hall.add(panel(1.22, 2.6, pvm, 0, UB + UW / 2, 2.38));
  hall.add(box(1.42, 2.8, 0.12, M.woodDark, 0, UB + UW / 2, 2.31));
  [-7.1, -4.7, -2.3, 2.3, 4.7, 7.1].forEach(x => {
    hall.add(cyl(0.19, 0.21, UW, M.wood, 10, x, UB + UW / 2, 2.35));
    pushDougong(x, E2 - 0.20, 2.35, 0.72);
  });
  IT.cut.add(makeRoof(22.0, 13.4, E2, 3.75,
    { corner: 0.60, ridgeHalf: 3.9, curve: 1.55, seg: 30 }));
}
modelRoot.add(hall);"""

rep_re(r'const hall = new T\.Group\(\);.*?modelRoot\.add\(hall\);',
       HALL_BLOCK, 'hall-block')

# ---- 6. 导出：走通用兼容的 __EXPORT_GLB__ ----
rep("""// 导出 GLB
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
    a.download = '徑山萬壽禪寺_全寺中軸.glb';
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
rep("document.getElementById('loading').classList.add('hide');\nwindow.__TEMPLE_READY__ = true;",
    """const qv = new URLSearchParams(location.search).get('view');
if (qv && views[qv]) goView(qv);
if (new URLSearchParams(location.search).has('clean')) {
  document.querySelectorAll('.ui').forEach(el => el.style.display = 'none');
  document.getElementById('labels').style.display = 'none';
}
document.getElementById('loading').classList.add('hide');
window.__TEMPLE_READY__ = true;""", 'url-view')

# ---- 7b. 每帧人物 / 第三人称相机更新钩子（实现在桥运行时里） ----
rep("  controls.update();\n  updateLabels();\n  renderer.render(scene, camera);",
    "  controls.update();\n  if (window.__AVATAR_UPDATE__) window.__AVATAR_UPDATE__(now);\n"
    "  updateLabels();\n  renderer.render(scene, camera);", 'avatar-hook')

# ---- 8. 插入扩展场景代码（必须在斗拱统一实例化之前） ----
anchor = '/* ---------- 11. 斗拱统一实例化 ---------- */'
rep(anchor, ext + '\n' + anchor, 'extension insert')

io.open(OUT, 'w', encoding='utf-8', newline='').write(s)
print('\nWROTE', OUT, len(s), 'chars')
