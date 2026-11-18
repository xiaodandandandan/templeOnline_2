# -*- coding: utf-8 -*-
"""组装单文件 index.html（离线、双击即开）。

源码按职责分离，产物才合并：
    vendor/      从 npm three 与官方 addons 生成的统一运行时
    src/         页面模板 + scene.js / TianwangHall.js / extension.js
    index.html   构建产物（内联全部依赖），已 gitignore

用法:
    在 jingshan-worship 中运行 npm run build:temple
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

VENDOR_PARTS = [
    'vendor/three-runtime.js',  # npm three 及同版本 addons，build-three.mjs 生成
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


# Assemble regional sources at explicit markers before applying legacy page settings.
for marker, filename in [
    ('COURTYARD', 'Courtyard.js'),
    ('TIANWANG_HALL', 'TianwangHall.js'),
    ('PAVILIONS', 'Pavilions.js'),
    ('CORRIDORS', 'Corridors.js'),
]:
    Sc('/*__' + marker + '__*/', read(os.path.join(HERE, 'src', filename)).rstrip('\n'), 'include-' + filename)

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

# ---- 3b. 地面覆盖全寺（原 260×260 会露边） ----
Sc("const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 26, 26);",
   "const paveSquare = paving('#cfc9bb', '#a9a394', 6, 6, 90, 90);", 'pave-repeat')

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
