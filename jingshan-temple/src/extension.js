/* =========================================================================
 * 10.6 依《径山寺游览全攻略》航拍标注图重新布局 + 殿宇内部空间
 *   中轴（由南向北）：请香处 → 进口 → 五凤山门(1) → 释迦宝殿(2) → 潮音堂(3)
 *                    → 观音堂(5) → 锦鲤池 → 十二级踏道 → 凌霄阁(6，抬高 +6)
 *   左侧：祖堂（抄经）→ 五观堂（素面）→ 药师殿(4，健康延寿) → 西院 → 出口
 *   右侧：东庑 → 客堂 → 龙王殿·财神殿(7，顺风顺水顺财神) → 东院
 *   最前方山门题“五凤山门”，内供弥勒、韦陀，兼天王殿之制；不再另设天王殿。
 *   每进院落由前后殿 + 左右配殿 + 四角转角廊向内围合成四合院，观音堂前设红墙院门。
 *   本次：中轴五殿改为“等距 44”—— 0 / -44 / -88 / -132 / -176，相邻殿距全部拉齐；
 *   池、台地、凌霄阁整段后移 47，四进配殿同步拉长，沿纵深首尾相接、只留屋檐缝，
 *   两侧不留空地；御道 / 铺地 / 抄手廊 / 导览立牌 / 松柏 / 朱墙院门一并跟随。
 *   前院（五凤山门 ↔ 释迦宝殿）：第一进左右配殿外移拓宽中庭，两侧各增一条
 *   “抄手廊”，廊两端折入院内即止，内端止于 |x|≈14.6，绝不沿廊直抵殿门。
 *   两侧配殿依“龙王殿”照片重做两层楼阁，配色沿用天王殿：深栗木构、米白墙、青灰瓦；
 *   一层金框墨底匾与黄色楹联、密直棂格门、层层出跳铺作，腰檐带一排圆瓦当；
 *   二层整面密直棂格窗 + 方格横披、窗下直接坐瓦檐，不设红色平坐栏杆，上檐悬墨底金字匾。
 *   天王殿两侧连廊（抄手廊 / 转角廊 / 错台连廊）同步加高，柱顶 8.40、阑额、
 *   普拍方、铺作与一层腰檐檐口 9.50 全部取同一标高 SONG，与配殿一层严格对齐。
 *   中轴主殿形制沿用山门殿：曲面瓦顶 / 举折反宇 / 飞檐翘角 / 白墙栗色木构 / 斗拱。
 *
 *   室内（参考韩国线上山寺 SANSA 木造法堂）：木地板 + 中央拜道 + 贴边柱网 + 藻井 +
 *   壁画背屏 + 金色主尊 + 供桌香炉莲花灯 + 木鱼念珠 + 成排灰色蒲团，行列按面积自适应。
 *   屋顶 / 天花 / 前墙归入“剖视组”，人物入殿时自动隐藏；锚点、碰撞盒、踏地高度
 *   均由几何产出并注册到 window.__INTERIOR__。
 *   window.__SITE_PLAN__ 为图上全部标注点（编号 / 名称 / 红字说明 / 世界坐标），
 *   运行时据此投影俯瞰导览标注，3D 侧据此生成红底金字导览立牌。
 * ========================================================================= */

/* ---------- A. 布局表（只改这里即可调整轴线与院落） ---------- */
const AXIS = {
  // 中轴五殿等距：五凤山门(0) → 释迦(-44) → 潮音(-88) → 观音(-132) → 凌霄(-176)，
  // 相邻殿距一律 44（原有 28/40/17/44 全部拉齐、整体进深由 129 扩到 176）。
  // 后段（池 / 台地 / 凌霄）保持原相对关系整体后移 47：池 = 观音 -16、凌霄 = 池 -28、
  // 台地中心 = 凌霄 + 2，池后缘与台地前沿仍留 1.5 过渡。
  step: 44,
  // 尺寸整体放大（宽×1.15/深×1.25/高×1.12）：外框与室内陈设同源放大，殿距 44 不变。
  // 释迦 D 15.8 < 44，潮音/观音更小，相邻殿之间仍留充足院落，不与配殿(x=±20.5)相撞。
  // 室内净高 = H - 0.375，取 H=12.4 → 净高 12.0（人物 2.72 的 4.4 倍，留余量）。
  // D 增大约 3：中轴殿距 44、相邻殿前后仍余 25+，室内纵深明显放大而不互撞。
  halls: [
    { id: 'shijia',  name: '釋迦寶殿', z: -44,  W: 29.6, D: 18.0, H: 12.4, two: true,  rise: 3.40, pw: 4.8 },
    { id: 'chaoyin', name: '潮音堂',   z: -88,  W: 22.0, D: 15.0, H: 12.4, two: false, rise: 2.30, pw: 3.4 },
    { id: 'guanyin', name: '觀音堂',   z: -132, W: 24.0, D: 16.0, H: 12.4, two: false, rise: 2.60, pw: 3.7 }
  ],
  pondZ: -148,     // 观音 -16；池后缘 -154.5 与台地前沿 -156 留 1.5
  terraceZ: -174,  // 凌霄 -176 + 2
  terraceY: 6,
  lingxiaoZ: -176,
  // 配殿随中轴殿同步外扩：中轴殿放大到半宽 14.8、下檐 16.5 后，
  // 配殿中心须 ≥ 25.5（腰檐内边 25.5-7.3=18.2 > 16.5），否则屋檐穿插 2.4。
  // 四进一律外移到 26.0，中庭净宽由 ±20.3 再扩到 ±26，殿廊之间留出采光缝。
  sideX: 26.0,
  // 四进配殿随殿距拉长：每进 32.8、段距 33.4，相邻仅 0.6 屋檐缝，
  // 从山门后 -8 一直绵延到池前缘 -141.5，两侧不留空地。
  courts: [
    // 四进配殿外缘一律 33.8：与天王殿两侧钟鼓楼下檐外沿、前院廊庑外沿成一条直线，
    // 不再随纵深内收（俯视图里两侧建筑带的外轮廓是笔直的）。
    { mid: -24.4,  len: 32.8, x: 27.2, left: '祖堂',   right: '东庑' },
    { mid: -57.8,  len: 32.8, x: 27.2, left: '五观堂', right: '客堂' },
    { mid: -91.2,  len: 32.8, x: 27.2, left: '药师殿', right: '龙王殿·财神殿' },
    { mid: -124.6, len: 32.8, x: 27.2, left: '西院',   right: '东院' }
  ]
};

/* 布局量下发到运行时：碰撞 / 踏地 / 相机中心不再手写第二份坐标 */
window.__LAYOUT__ = {
  step: AXIS.step,
  centerZ: AXIS.lingxiaoZ / 2,                  // -88
  pondFront: AXIS.pondZ + 6.5,                 // -141.5
  pondBack: AXIS.pondZ - 6.5,                  // -154.5
  terraceFront: AXIS.terraceZ + 18,            // -156（十二级踏道起点）
  terracePlateZ: AXIS.terraceZ + 15,           // -159（台面起算）
  stairEndZ: AXIS.terraceZ + 9,                // -165
  minZ: AXIS.lingxiaoZ - 28,                   // -204
  maxZ: 27,
};

/* 各殿内部造像配置：h 为连座总高，dz 为相对佛坛中心的进深偏移（负值靠后）。
 * 中轴大殿 2.6~3.0（殿高 8.8~10.4）；配殿内部仅 6.9 深，缩到 1.8 左右才不逼视。 */
const PANTHEON = {
  shijia: [
    { kind: 'buddha',      h: 5.00, x: 0,     main: true },
    { kind: 'disciple',    h: 3.30, x: -2.35, dz: -1.00 },
    { kind: 'disciple',    h: 3.30, x: 2.35,  dz: -1.00 },
    { kind: 'bodhisattva', h: 3.55, x: -4.65, dz: -0.95 },
    { kind: 'bodhisattva', h: 3.55, x: 4.65,  dz: -0.95 },
  ],
  chaoyin: [
    { kind: 'bodhisattva', h: 4.20, x: 0,     main: true },
    { kind: 'disciple',    h: 2.80, x: -2.15, dz: -0.95 },
    { kind: 'disciple',    h: 2.80, x: 2.15,  dz: -0.95 },
  ],
  guanyin: [
    { kind: 'waterMoon',   h: 4.40, x: 0,     main: true },
    { kind: 'attendant',   h: 2.45, x: -2.45, dz: -0.92 },
    { kind: 'attendant',   h: 2.45, x: 2.45,  dz: -0.92 },
  ],
  lingxiao: [
    { kind: 'buddha',      h: 4.55, x: -3.80, main: true },
    { kind: 'buddha',      h: 4.90, x: 0,     main: true },
    { kind: 'buddha',      h: 4.55, x: 3.80,  main: true },
    { kind: 'bodhisattva', h: 3.60, x: -6.60, dz: -0.95 },
    { kind: 'bodhisattva', h: 3.60, x: 6.60,  dz: -0.95 },
  ],
  tianwang: [
    { kind: 'maitreya',    h: 2.55, x: 0, dz: -0.95, main: true },
    { kind: 'weiTuo',      h: 2.45, x: 0, dz: 1.70 },
  ],
};
/* 配殿按匾名配置：佛殿有像，功能房（祖堂 / 五观堂 / 客堂 / 院落）暂不设佛像 */
const SIDE_PANTHEON = {
  '药师殿':       [{ kind: 'medicine', h: 3.00, x: 0, main: true },
                   { kind: 'attendant', h: 2.05, x: -1.95, dz: -0.85 },
                   { kind: 'attendant', h: 2.05, x: 1.95, dz: -0.85 }],
  // 两尊并坐：间距收到 ±2.0，原先 ±2.6 时侧后方机位会把其中一尊顶到画框外
  '龙王殿·财神殿': [{ kind: 'dragonKing', h: 2.90, x: -2.0, main: true },
                   { kind: 'wealth', h: 2.90, x: 2.0, main: true }],
  '西配院':       [{ kind: 'bodhisattva', h: 2.85, x: 0, main: true }],
  '东配院':       [{ kind: 'bodhisattva', h: 2.85, x: 0, main: true }],
};
/* 功能房：不供像，改陈设（祖堂抄经、五观堂斋堂、客堂接待、廊庑经柜、院落储物） */
const SIDE_FURNISH = {
  '祖堂': 'scriptorium',
  '五观堂': 'dining',
  '客堂': 'lounge',
  '东庑': 'cabinet',
  '西院': 'store',
  '东院': 'store',
};
Object.keys(SIDE_FURNISH).forEach((k) => { SIDE_PANTHEON[k] = []; });

/* 前院（五凤山门 ↔ 释迦宝殿）抄手廊：外移配殿 + 廊庑一并加大中庭。
 * 全部廊段都在 |x| ≥ 14.6，中央御道（|x| < 4.1）是唯一通往殿门的直路；
 * 廊两端与山门后墙、释迦月台踏道均留空隙，不接门。 */
// 抄手廊布局由 Corridors.js 定义。

/* ---------- A3. 两侧两层楼阁：沿用天王殿配色（深栗木 / 米白墙 / 青灰瓦） ---
 * 依实景照片“龙王殿”重做立面，不再用丹粉朱饰：
 *   下层层高加高、上层仅四成且收分；一层密直棂格门、层层出跳的深栗铺作、
 *   金框墨底匾与黄色楹联；腰檐青灰筒瓦带一排圆瓦当；
 *   二层整面密直棂格窗 + 上部方格横披，窗直接坐在腰檐瓦上，不设平坐栏杆；
 *   上檐悬墨底金字匾。所有木构取天王殿 M.wood / M.woodDark / M.woodMid 色系。
 * 侧殿一层与两侧廊庑共用同一组柱顶 / 阑额 / 普拍方 / 铺作 / 檐口标高 SONG。 */
const SONG = {
  podium:   0.82,   // 配殿台基顶
  laneBase: 0.30,   // 廊庑台基顶
  colTop:   8.40,   // 一层柱顶 / 阑额下皮（配殿与连廊共用）
  lintel:   0.34,   // 阑额
  pupai:    0.14,   // 普拍方
  eave1:    9.50,   // 一层腰檐 / 连廊檐口 = 8.40 + 0.34 + 0.14 + 0.62 铺作
  bracketScale: 0.756,  // (eave1 - colTop - lintel - pupai) / 0.82，铺作顶正好托住檐口
  waistRise:1.00,   // 腰檐举高（平缓）
  pingzuo: 10.60,   // 二层楼面（腰檐脊 10.50 之上）
  colH2:    3.00,   // 二层柱高（一层墙高 7.60 的四成）
  eave2:   14.70,   // 二层上檐檐口
  roofRise: 1.55,   // 上檐举高
};

/* 天王殿主色调：栗色木构 / 米白墙 / 青灰瓦。全场不再出现朱红栏杆或青绿枋。 */
const SM = {
  wall:      M.wall,
  wallShade: M.wallShade,
  column:    std(0x4a2b1e, 0.88),   // 照片中偏深的栗柱
  columnDim: M.woodDark,
  lintel:    M.woodMid,
  pupai:     M.woodDark,
  bracket:   std(0x4e3021, 0.90),
  rail:      M.woodMid,             // 残留的坐槛 / 寻杖一律深栗木
  railDark:  M.woodDark,
  lattice:   M.woodLight,
  window:    std(0x1a1712, 0.94),
  tile:      0x7b8588,              // 青灰瓦（乘在瓦纹贴图上）
  tileCap:   std(0x9aa3a3, 0.92),  // 圆瓦当
};

/** 照片中的密直棂格窗：上部方格横披 + 下部二十道竖棂 + 两道腰串 */
const SM_LATTICE = new T.MeshStandardMaterial({
  map: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#171310'; g.fillRect(0, 0, w, h);          // 窗内暗，透出深栗棂条
    const band = h * 0.26;
    g.fillStyle = '#6b452e';                                  // 上部方格横披
    for (let i = 1; i < 14; i++) { const x = i * w / 14; g.fillRect(x - 2, 0, 4, band); }
    for (let j = 1; j < 3; j++) g.fillRect(0, j * band / 3 - 2, w, 4);
    g.fillStyle = '#3a2519'; g.fillRect(0, band - 6, w, 14);  // 横披与直棂间的横枋
    for (let i = 1; i < 20; i++) {                             // 密直棂
      const x = i * w / 20;
      g.fillStyle = '#6b452e'; g.fillRect(x - 3, band + 8, 6, h - band - 26);
      g.fillStyle = 'rgba(226,186,132,.20)'; g.fillRect(x - 3, band + 8, 2, h - band - 26);
    }
    [0.58, 0.80].forEach(t => { g.fillStyle = '#3f291b'; g.fillRect(0, h * t, w, 8); });
    g.fillStyle = '#3a2519'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 12, w, 12);
  }),
  color: 0xffffff, roughness: 0.90, side: T.DoubleSide,
});

/** 金框墨底金字横匾：照片中一层“龙王殿”匾，从右往左题字 */
function goldPlaque(text, opt) {
  const o = Object.assign({ w: 768, h: 240, size: 128 }, opt || {});
  return new T.MeshStandardMaterial({
    map: canvasTex(o.w, o.h, (g, w, h) => {
      g.fillStyle = '#c9a24f'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(84,53,20,.42)'; g.lineWidth = 2;
      for (let x = -h; x < w; x += 26) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke();
      }
      g.fillStyle = '#191410'; g.fillRect(22, 22, w - 44, h - 44);
      g.strokeStyle = '#e2bc6b'; g.lineWidth = 6; g.strokeRect(32, 32, w - 64, h - 64);
      g.strokeStyle = 'rgba(226,188,107,.45)'; g.lineWidth = 2; g.strokeRect(42, 42, w - 84, h - 84);
      g.fillStyle = '#d8b05c';
      [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]].forEach(p => {
        g.beginPath(); g.arc(p[0], p[1], 13, 0, Math.PI * 2); g.fill();
      });
      g.fillStyle = '#f0cd78'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold ' + o.size + 'px "Noto Serif CJK SC","KaiTi","STKaiti","SimSun",serif';
      g.fillText(text.split('').reverse().join(''), w / 2, h / 2 + 4);
    }),
    color: 0xffffff, roughness: 0.62, side: T.DoubleSide,
  });
}

/** 黄底墨字楹联：挂在一层中央门两侧；两句全寺复用同一张贴图 */
const COUPLET_CACHE = new Map();
function coupletMat(text) {
  if (COUPLET_CACHE.has(text)) return COUPLET_CACHE.get(text);
  const out = new T.MeshStandardMaterial({
    map: canvasTex(120, 640, (g, w, h) => {
      g.fillStyle = '#d8b25a'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#5a3a18'; g.lineWidth = 5; g.strokeRect(9, 9, w - 18, h - 18);
      g.fillStyle = '#241a10'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold 54px "Noto Serif CJK SC","KaiTi","SimSun",serif';
      const ch = text.split(''), step = (h - 56) / ch.length;
      ch.forEach((c, i) => g.fillText(c, w / 2, 28 + step * (i + 0.5)));
    }),
    color: 0xffffff, roughness: 0.82, side: T.DoubleSide,
  });
  COUPLET_CACHE.set(text, out);
  return out;
}

/** 檐口一排圆瓦当（青灰筒瓦端面）：整排实例化，避免上百个 mesh */
function eaveTileRow(parent, w, y, z) {
  const n = Math.max(10, Math.round(w / 0.44));
  const im = new T.InstancedMesh(
    new T.CylinderGeometry(0.115, 0.115, 0.085, 10), SM.tileCap, n);
  const q = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0));
  const m = new T.Matrix4();
  for (let i = 0; i < n; i++)
    im.setMatrixAt(i, m.compose(
      new T.Vector3(-w / 2 + (i + 0.5) * w / n, y, z), q, new T.Vector3(1, 1, 1)));
  im.instanceMatrix.needsUpdate = true;
  im.receiveShadow = true; im.frustumCulled = false;
  parent.add(im);
  return im;
}

/** 青灰瓦屋顶：举折平缓、檐角轻起、不用走兽；顶面染青灰（天王殿同色） */
function songRoof(w, d, eaveY, rise, opt) {
  const g = makeRoof(w, d, eaveY, rise, Object.assign({
    corner: 0.30, curve: 1.26, seg: 16, beasts: false, finial: false,
    tileRepeat: 2.4, ridgeHalf: Math.max(0.02, (w - d) / 2 - 0.30)
  }, opt || {}));
  g.traverse(o => {
    const m = o.isMesh && o.material;
    if (m && m.map && m.color && m.color.getHex() === 0xffffff) {
      const c = m.clone(); c.color.setHex(SM.tile); o.material = c;
    }
  });
  return g;
}

/** 深栗铺作（栌斗 / 泥道栱 / 华栱与瓜子栱两跳 / 耍头 / 令栱 / 齐心斗）——
 *  整组实例化，层层出跳如照片；spots: [{x, z}]；铺作顶自动对齐 eaveY。 */
function songBracketSet(parent, spots, eaveY, scale) {
  const s = scale || SONG.bracketScale;
  const y = eaveY - 0.82 * s;
  const mats = [];
  const put = (x, yy, z, sx, sy, sz) => mats.push(new T.Matrix4().compose(
    new T.Vector3(x, yy, z), new T.Quaternion(),
    new T.Vector3(sx * s, sy * s, sz * s)));
  spots.forEach(p => {
    const { x, z } = p;
    put(x, y + 0.10 * s, z, 0.62, 0.20, 0.62);              // 栌斗
    put(x, y + 0.30 * s, z, 1.16, 0.16, 0.26);              // 泥道栱
    put(x - 0.40 * s, y + 0.44 * s, z, 0.20, 0.14, 0.20);  // 散斗
    put(x + 0.40 * s, y + 0.44 * s, z, 0.20, 0.14, 0.20);
    put(x, y + 0.52 * s, z + 0.30 * s, 0.24, 0.14, 0.78);  // 华栱第一跳
    put(x, y + 0.40 * s, z - 0.26 * s, 0.94, 0.12, 0.22);  // 瓜子栱
    put(x, y + 0.72 * s, z + 0.44 * s, 0.22, 0.12, 0.62);  // 耍头第二跳
    put(x, y + 0.64 * s, z, 1.52, 0.14, 0.30);              // 令栱
    put(x, y + 0.82 * s, z, 0.46, 0.16, 0.46);              // 齐心斗
  });
  const im = new T.InstancedMesh(unitBox, SM.bracket, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
  parent.add(im);
  return im;
}

/* 航拍图标注点：no = 红色打卡编号；guide = 由运行时投影到俯瞰导览层；
 * sign = [x, z, baseY, rotY] 红底金字说明立牌的世界位置与朝向。 */
const SITE_PLAN = [
  { id: 'wufeng', name: '五凤山门', note: '韦陀 · 出行平安|弥勒 · 平安喜乐',
    no: 1, x: 0, y: 11.0, z: 0, sign: [9.8, 5.6, 0, 0] },
  { id: 'zutang', name: '祖堂', note: '抄经', x: -25.5, y: 13.0, z: -24.4, guide: true,
    sign: [-11.8, -24.4, 0, Math.PI / 2] },
  { id: 'shijia', name: '释迦宝殿', note: '释迦摩尼 · 万事可求|普贤 · 事业|文殊 · 学业',
    no: 2, x: 0, y: 12.4, z: -44, sign: [10.8, -37.2, 0, 0] },
  { id: 'wuguantang', name: '五观堂', note: '素面', x: -20.5, y: 13.0, z: -57.8, guide: true,
    sign: [-14.2, -57.8, 0, Math.PI / 2] },
  { id: 'chaoyin', name: '潮音堂', note: '文化传播 · 展览', no: 3,
    x: 0, y: 9.4, z: -88, sign: [9.2, -82.6, 0, 0] },
  { id: 'yaoshi', name: '药师殿', note: '健康延寿', no: 4, x: -20.5, y: 13.0, z: -91.2, guide: true,
    sign: [-14.2, -91.2, 0, Math.PI / 2] },
  { id: 'longwang', name: '龙王殿·财神殿', note: '顺风顺水顺财神', no: 7,
    x: 20.5, y: 13.0, z: -91.2, guide: true, sign: [14.2, -91.2, 0, -Math.PI / 2] },
  { id: 'guanyin', name: '观音堂', note: '姻缘求子', no: 5,
    x: 0, y: 9.8, z: -132, sign: [9.6, -126.4, 0, 0] },
  { id: 'koi', name: '锦鲤池', note: '观音堂与凌霄阁之间',
    x: 0, y: 1.6, z: -148, guide: true },
  { id: 'lingxiao', name: '凌霄阁', note: '诸事顺遂', no: 6,
    x: 0, y: 20.0, z: -176, sign: [10.8, -169.4, 6, 0] },
];
window.__SITE_PLAN__ = SITE_PLAN;

const M2 = {
  water:      new T.MeshStandardMaterial({ color: 0x2d6c78, roughness: 0.16, metalness: 0.12, transparent: true, opacity: 0.88, side: T.DoubleSide }),
  pondFloor:  std(0x263b3c, 1),
  koi:        [std(0xc9542b, 0.72), std(0xe9e2d2, 0.8), std(0xe0902c, 0.72)],
  lotus:      std(0x3c6740, 1),
  rock:       std(0x8e8b80, 1),
  terrace:    std(0xbeb7a5, 0.96),
  terraceDim: std(0x9c9583, 0.96),
  pine:       std(0x314d36, 1),
  cinnabar:   std(0x9c3b2e, 0.94),
  cinnabarDim:std(0x742c23, 0.96),
  bronze:     std(0x8a6b3f, 0.62, 0.35),
  incense:    std(0x6d5a46, 0.96),
  lampWarm:   new T.MeshStandardMaterial({ color: 0xffd9a0, roughness: 0.5, emissive: 0xffb347, emissiveIntensity: 0.85 })
};

function plaqueMaterial(text, opt) {
  const o = Object.assign({ w: 512, h: 130, size: 82, vertical: false }, opt || {});
  if (o.vertical) { o.w = 180; o.h = 420; o.size = 52; }
  const tex = textPlate([text], o);
  return new T.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.68 });
}

/* ---------- A2. 航拍图导览构件：红底金字立牌 / 牌坊 / 香亭 / 红墙院门 ---------- */
/** 攻略图上的红色说明文字做成殿前立牌，不进 UI，只作为场景内实体 */
function guidePlate(name, note, no) {
  return canvasTex(384, 256, (g, w, h) => {
    g.fillStyle = '#9c3b2e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e6c484'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.strokeStyle = 'rgba(255,236,196,.35)'; g.lineWidth = 2; g.strokeRect(20, 20, w - 40, h - 40);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff4d8';
    g.font = 'bold 54px "Noto Serif CJK SC","KaiTi",serif';
    g.fillText(name, w / 2, 68);
    g.fillStyle = '#ffe3a8';
    g.font = '30px "Noto Serif CJK SC","KaiTi",serif';
    (note || '').split('|').slice(0, 3).forEach((t, i) => g.fillText(t, w / 2, 138 + i * 46));
    // 攻略图上的红色打卡编号
    if (no) {
      g.beginPath(); g.arc(w - 52, 52, 27, 0, Math.PI * 2);
      g.fillStyle = '#f0cf84'; g.fill();
      g.fillStyle = '#7a241c';
      g.font = 'bold 36px "Noto Serif CJK SC",serif';
      g.fillText(String(no), w - 52, 54);
    }
  });
}

function makeGuideSign(item) {
  const g = new T.Group();
  g.position.set(item.sign[0], item.sign[2] || 0, item.sign[1]);
  g.rotation.y = item.sign[3] || 0;
  g.add(box(2.0, 0.26, 0.72, M.stoneDark, 0, 0.13, 0));
  [-0.82, 0.82].forEach(x => g.add(box(0.13, 1.92, 0.13, M.woodMid, x, 1.22, 0)));
  g.add(box(1.88, 1.34, 0.10, M.woodDark, 0, 1.58, 0.02));
  const pm = new T.MeshStandardMaterial({ map: guidePlate(item.name, item.note, item.no), roughness: 0.9, side: T.DoubleSide });
  g.add(panel(1.72, 1.18, pm, 0, 1.58, 0.09));
  g.add(box(2.24, 0.13, 0.58, M.woodDark, 0, 2.34, 0));
  g.add(box(2.04, 0.10, 0.46, M.ridge, 0, 2.45, 0));
  return g;
}

/** 观音堂前红墙院门：两段朱墙夹出中央通道，不设横屋以免遮挡第三人称相机 */
function makeRedWallGate(z) {
  const g = new T.Group();
  g.position.set(0, 0, z);
  [-1, 1].forEach(s => {
    g.add(box(6.4, 2.35, 0.58, M2.cinnabar, s * 6.2, 1.20, 0));
    g.add(box(6.7, 0.18, 0.78, M.woodDark, s * 6.2, 2.45, 0));
    g.add(box(6.7, 0.12, 0.86, M.ridge, s * 6.2, 2.59, 0));
    g.add(box(0.56, 2.85, 0.72, M2.cinnabarDim, s * 3.02, 1.43, 0));
    g.add(box(0.72, 0.18, 0.86, M.stoneWhite, s * 3.02, 2.92, 0));
  });
  return g;
}

/* ---------- B0. 殿宇内部空间 -------------------------------------------------
 * 本函数也会在“基线山门殿”代码块中被调用（此时本扩展的 const 尚未初始化），
 * 因此只依赖基线已定义的 T / box / cyl / makeMesh 与 window 注册表。
 *
 * 产出（window.__INTERIOR__）：
 *   boxes   —— 建筑世界包围盒、墙体矩形、室内区域；运行时的碰撞 / 踏地 / 剖视唯一真源
 *   roofs   —— hallId → 剖视组（屋顶 + 天花 + 前墙），人物入殿时隐藏
 *   anchors —— 预留锚点 statue / altar / incense / cushion，供后续佛像蒲团交互挂载
 * ------------------------------------------------------------------------- */
function buildInterior(group, spec, id, baseY) {
  const REG = window.__INTERIOR__ ||
    (window.__INTERIOR__ = { boxes: [], roofs: {}, anchors: [], corridorRoofs: [] });
  // 连廊屋顶不在任何殿的剖视组内，殿内贴身视角会从室内看到瓦顶穿模。
  // 统一登记到 corridorRoofs，由运行时在 hallBlend 高时隐藏、院落/俯瞰时显示。
  if (!REG.corridorRoofs) REG.corridorRoofs = [];
  const IM = window.__INTERIOR_MAT__ || (window.__INTERIOR_MAT__ = (() => {
    const mk = (c, e, r, m) => new T.MeshStandardMaterial({
      color: c, roughness: r === undefined ? 0.92 : r, metalness: m || 0,
      emissive: e || 0x000000, emissiveIntensity: 0.38,
    });
    // 法堂背屏：枣红底 + 淡金祥云，整幅作“静的背景”——
    // 反复的同心圆会与佛像背光抢焦点，改为中心一团柔光晕 + 四角云气
    const muralTex = canvasTex(512, 384, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#8a4a30'); bg.addColorStop(0.55, '#79402a'); bg.addColorStop(1, '#5e2f1e');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      // 中心柔光：把视线收在佛身上，不画实体圆环
      const glow = g.createRadialGradient(w / 2, h * 0.42, 20, w / 2, h * 0.42, w * 0.46);
      glow.addColorStop(0, 'rgba(255,214,150,.40)');
      glow.addColorStop(0.55, 'rgba(226,170,104,.14)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      // 云气：四层横卷，越靠上越淡
      for (let k = 0; k < 5; k++) {
        const yy = 44 + k * 74;
        g.globalAlpha = 0.16 - k * 0.018;
        g.strokeStyle = '#f2d69a'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(-10, yy);
        g.bezierCurveTo(w * 0.22, yy - 26, w * 0.34, yy + 30, w * 0.5, yy + 2);
        g.bezierCurveTo(w * 0.66, yy - 24, w * 0.8, yy + 28, w + 10, yy);
        g.stroke();
      }
      g.globalAlpha = 1;
      // 底缘莲瓣一排，交代背屏的“台”感
      for (let i = 0; i < 16; i++) {
        const bx = 18 + i * (w - 36) / 15;
        g.beginPath();
        g.moveTo(bx, h - 16); g.quadraticCurveTo(bx + 15, h - 54, bx + 30, h - 16);
        g.closePath();
        g.fillStyle = 'rgba(232,188,114,.22)'; g.fill();
        g.strokeStyle = 'rgba(247,224,168,.34)'; g.lineWidth = 1.6; g.stroke();
      }
      g.strokeStyle = '#b18a45'; g.lineWidth = 9; g.strokeRect(9, 9, w - 18, h - 18);
      g.strokeStyle = 'rgba(247,214,140,.42)'; g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44);
    });
    return {
      floor:    mk(0xb99a70, 0x3a2410), joint:  mk(0x7d6144, 0x20160b),
      aisle:    mk(0xd9c9a8, 0x3a2a16), wood:   mk(0x6d3a29, 0x281208),
      column:   mk(0x8c4a34, 0x2a1008), base:   mk(0xd8cfba, 0x2c2418),
      beam:     mk(0x6d3a29, 0x281208), altar:  mk(0xa8895f, 0x2c1d0e),
      altarTop: mk(0xd9c39c, 0x30220f), screen: mk(0x5a3526, 0x2a180b),
      trim:     mk(0xc9a45f, 0x3a2a12, 0.7, 0.15),
      gold:     new T.MeshStandardMaterial({ color: 0xe8bc62, roughness: 0.33, metalness: 0.58, emissive: 0x4d3310, emissiveIntensity: 0.3 }),
      goldLight:new T.MeshStandardMaterial({ color: 0xf5d489, roughness: 0.42, metalness: 0.30, emissive: 0x7a5518, emissiveIntensity: 0.45 }),
      bronze:   new T.MeshStandardMaterial({ color: 0x8b6a3e, roughness: 0.50, metalness: 0.50, emissive: 0x2a1e0c, emissiveIntensity: 0.3 }),
      cushion:  mk(0x9c7d55, 0x2a1d10), cushionEdge: mk(0x6f5334, 0x180f07),
      mat:      mk(0xb6a184, 0x2d2213), bead: mk(0x6a3a24, 0x1a0d08),
      lamp:     new T.MeshStandardMaterial({ color: 0xffd9a0, roughness: 0.5, metalness: 0, emissive: 0xffb347, emissiveIntensity: 0.85 }),
      mural:    new T.MeshStandardMaterial({ map: muralTex, color: 0xffffff, roughness: 0.88, emissive: 0x3a1e0e, emissiveIntensity: 0.3 }),
      /* —— 殿内视角专用：天花望板 / 椽 / 彩画 / 幡幔 / 供果 ——
       * 镜头贴身后这些才是画面主体，剖视俯瞰时看不到，但必须有实体否则顶部漏空。 */
      ceil:     mk(0x6b4a33, 0x2a1a10, 0.95),
      rafter:   mk(0x9a6446, 0x2e1a12, 0.92),
      paintC:   mk(0x2f6a61, 0x0e2b27, 0.80),
      paintB:   mk(0x2f4f7a, 0x0d1c30, 0.80),
      panel:    mk(0xc9ab84, 0x372a18, 0.95),
      cloth:    mk(0xbcaa86, 0x2f2818, 0.95),
      clothR:   mk(0x9c3f31, 0x2c0f0a, 0.95),
      fruit:    mk(0xc0603c, 0x2c1109, 0.85),
      leaf:     mk(0x4f7a4a, 0x14210f, 0.90),
    };
  })());

  const W = spec.W, H = spec.H, top = spec.top, F = spec.floorY;
  const frontZ = spec.frontWallZ, backZ = spec.backWallZ, doorHalf = spec.doorHalf;
  const zF = frontZ - 0.12, zB = backZ + 0.55;
  const innerD = Math.max(2.2, zF - zB), innerCZ = (zF + zB) / 2;
  const innerW = W - 1.0;
  const grand = innerW >= 14 && innerD >= 4.4;   // 中轴大殿 / 四合院配殿两档容量

  group.updateMatrixWorld(true);
  const inner = new T.Group(); group.add(inner);
  const cut = new T.Group();   group.add(cut);   // 剖视组：屋顶 / 腰檐 / 上檐（俯瞰掀盖时隐藏）
  cut.userData.cutaway = id;
  REG.roofs[id] = cut;
  /* 天花与前墙从剖视组里拆出来单列：
   * 俯瞰掀盖（镜头拉远）时三者一起隐藏；殿内视角（镜头贴身）只隐藏屋顶，
   * 天花与前墙必须留着 —— 否则从室内朝门口看会直接穿透到天空与邻殿瓦顶。 */
  const ceilG = new T.Group(); group.add(ceilG);
  const frontG = new T.Group(); group.add(frontG);
  (REG.ceilings || (REG.ceilings = {}))[id] = ceilG;
  (REG.fronts || (REG.fronts = {}))[id] = frontG;

  const world = (lx, ly, lz) => {
    const v = group.localToWorld(new T.Vector3(lx, ly, lz));
    return { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) };
  };
  // 室内陈设统一不投影：避免俯瞰时在大殿屋顶投下碎影
  const add = (geo, mat, x, y, z, parent) => {
    const m = makeMesh(geo, mat, x, y, z, false);
    (parent || inner).add(m); return m;
  };
  const addBox = (w, h, d, mat, x, y, z, parent) =>
    add(new T.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const addCyl = (rt, rb, h, mat, seg, x, y, z, parent) =>
    add(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent);
  const addRing = (r, t, mat, x, y, z, parent) => {
    const m = add(new T.TorusGeometry(r, t, 8, 28), mat, x, y, z, parent);
    m.rotation.x = -Math.PI / 2; return m;
  };
  // 蒲团朝向：局部 -Z（佛台方向）经殿宇旋转后换算为人物 yaw
  const o = world(0, 0, 0), b = world(0, 0, -1);
  const faceYaw = +Math.atan2(b.x - o.x, -(b.z - o.z)).toFixed(3);

  const toAABB = (lx, lz, w, d) => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    [[lx - w / 2, lz - d / 2], [lx + w / 2, lz + d / 2],
     [lx - w / 2, lz + d / 2], [lx + w / 2, lz - d / 2]].forEach(p => {
      const v = group.localToWorld(new T.Vector3(p[0], 0, p[1]));
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
      z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z);
    });
    return { x0: +x0.toFixed(2), x1: +x1.toFixed(2), z0: +z0.toFixed(2), z1: +z1.toFixed(2) };
  };

  // 1) 木地板 + 板缝 + 中央拜道（前后券门贯通，拜道留出穿行通道）
  addBox(innerW, 0.06, innerD, IM.floor, 0, F - 0.03, innerCZ);
  const planks = Math.max(6, Math.min(24, Math.round(innerW / 1.1)));
  for (let i = 1; i < planks; i++)
    addBox(0.032, 0.012, innerD, IM.joint, -innerW / 2 + i * innerW / planks, F + 0.008, innerCZ);
  const joints = Math.max(3, Math.min(8, Math.round(innerD / 2.0)));
  for (let i = 1; i < joints; i++)
    addBox(innerW, 0.012, 0.032, IM.joint, 0, F + 0.008, zB + i * innerD / joints);
  addBox(Math.min(1.9, innerW * 0.15), 0.016, innerD, IM.aisle, 0, F + 0.014, innerCZ);

  // 2) 侧壁内装修：木质格窗，入殿后不再面对空荡白墙
  // 左侧门洞（spec.sideDoor）：左侧（s=-1）格窗若压在门洞上就跳过，免得薄板挡住通行。
  const sdHalf = 1.35, sdZ = innerCZ;
  const winN = 2;
  [-1, 1].forEach(s => {
    const wx = s * (innerW / 2 - 0.16);
    for (let i = 0; i < winN; i++) {
      const wz = zB + (i + 0.5) * innerD / winN;
      const ww = Math.min(1.75, innerD / winN * 0.74);
      if (s < 0 && spec.sideDoor && Math.abs(wz - sdZ) < sdHalf + ww / 2) continue;
      addBox(0.05, 1.85, ww, IM.screen, wx, F + 1.62, wz);
      addBox(0.07, 0.055, ww, IM.trim, wx - s * 0.04, F + 1.62, wz);
    }
  });

  // 2b) 前墙内侧收口：板壁 + 门额挂落 + 门内槛石
  //     殿内视角里这一面正对镜头背后，原先是一整片素白挤出体侧壁。
  const bWallH = Math.max(2.2, H - 1.0);
  const sideW = Math.max(0.8, innerW / 2 - doorHalf - 0.25);
  [-1, 1].forEach(s => {
    const bx = s * (doorHalf + 0.30 + sideW / 2);
    addBox(sideW, bWallH, 0.09, IM.wood, bx, F + bWallH / 2, frontZ - 0.62);
    addBox(sideW, 0.10, 0.13, IM.beam, bx, F + bWallH - 0.05, frontZ - 0.62);
    addBox(sideW, 0.08, 0.11, IM.trim, bx, F + 0.12, frontZ - 0.62);
    // 殿内回望门口时，这一面整片暗红太闷：腰线 + 彩带 + 跨间立柱分格
    addBox(sideW, 0.26, 0.115, IM.paintC, bx, F + 2.98, frontZ - 0.655);
    addBox(sideW, 0.10, 0.115, IM.trim, bx, F + 1.24, frontZ - 0.655);
    addBox(sideW, 1.10, 0.105, IM.panel, bx, F + 0.62, frontZ - 0.655);
    const nS = Math.max(2, Math.round(sideW / 2.3));
    // 柱高按天花反推；ceilY 在下一节才 const 声明，这里直接读 spec，避免 TDZ
    const studH = Math.min(bWallH * 0.985,
      (spec.ceilingY !== undefined ? spec.ceilingY : top + H - 0.30) - F);
    for (let i = 0; i <= nS; i++) {
      addBox(0.15, studH, 0.13, IM.column,
        bx - sideW / 2 + i * sideW / nS, F + studH / 2, frontZ - 0.665);
    }
  });
  addBox(doorHalf * 2 + 1.5, 0.24, 0.18, IM.beam, 0, F + H * 0.72 + 0.32, frontZ - 0.66);
  [-1, 1].forEach(s =>
    addBox(0.16, 0.42, 0.22, IM.goldLight, s * (doorHalf * 0.55), F + H * 0.72 + 0.14, frontZ - 0.68));
  addBox(Math.min(3.6, doorHalf * 2 + 0.6), 0.09, 0.58, IM.base, 0, F + 0.045, frontZ - 0.32);

  /* 2c) 墙面装修：基线墙体是素色 shade 墙，殿内近看是一整片灰面。
   *     贴一层“裙板 + 壁板 + 彩带 + 跨间立柱”，侧墙与后墙两侧都覆盖到。 */
  const DR = 0.07;
  const wallTop = (spec.ceilingY !== undefined ? spec.ceilingY : top + H - 0.30) - 0.12;
  const wallH = Math.max(3.0, wallTop - F);
  [-1, 1].forEach(s => {
    const wx = s * (innerW / 2 - 0.02);
    const wz = innerD - 0.12;
    addBox(DR, 1.22, wz, IM.wood,  wx, F + 0.66, innerCZ);               // 裙板
    addBox(DR, wallH - 1.22, wz, IM.panel, wx, F + 1.22 + (wallH - 1.22) / 2, innerCZ); // 壁板通高
    addBox(DR + 0.02, 0.30, wz, IM.paintC, wx, F + 2.98, innerCZ);       // 彩带
    addBox(DR + 0.02, 0.12, wz, IM.trim,   wx, F + 1.28, innerCZ);
    const nb = Math.max(3, Math.round(innerD / 3.2));
    for (let i = 0; i <= nb; i++) {                                      // 跨间立柱
      addBox(0.18, Math.min(wallH, 4.2), 0.18, IM.column, wx - s * 0.075, F + Math.min(wallH, 4.2) / 2, zB + i * innerD / nb);
    }
  });
  // 后墙两侧：裙板 + 通高壁板（中央留后门洞 3 米，壁画另计）
  [-1, 1].forEach(s => {
    const bw = Math.max(0.8, (innerW - 3.2) / 2);
    const bx = s * (1.6 + bw / 2);
    addBox(bw, wallH, DR, IM.panel, bx, F + wallH / 2, zB + 0.02);
    addBox(bw, 1.00, DR + 0.02, IM.wood, bx, F + 0.50, zB + 0.03);
    addBox(bw, 0.28, DR + 0.03, IM.paintC, bx, F + 2.98, zB + 0.04);
    addBox(bw, 0.12, DR + 0.03, IM.trim, bx, F + 1.28, zB + 0.04);
  });

  // 3) 柱网贴两侧布置：两列三排，中央完全让出拜道（法堂式大空间）
  //    柱高改由天花标高反推 —— 殿内视角里柱头必须顶到梁底，不能悬空。
  const ceilY = spec.ceilingY !== undefined ? spec.ceilingY : top + H - 0.30;
  const colH = Math.max(2.6, ceilY - F - 0.30);
  [-W * 0.42, W * 0.42].forEach(cx => {
    [zB + innerD * 0.20, zB + innerD * 0.54, zF - innerD * 0.16].forEach(cz => {
      addBox(0.60, 0.14, 0.60, IM.base, cx, F + 0.07, cz);
      addCyl(0.18, 0.21, colH, IM.column, 10, cx, F + colH / 2 + 0.12, cz);
      addBox(0.62, 0.18, 0.62, IM.beam, cx, F + colH + 0.18, cz);
    });
    addBox(0.22, 0.26, innerD * 0.92, IM.wood, cx, F + colH + 0.22, innerCZ);
  });

  // 4) 天花：望板封顶 + 椽子 + 檩 + 梁 + 中心藻井（殿内抬头即见此面）
  //    望板是殿内视角的关键：没有它，抬头会从屋面背面（单面材质）直接看到天空。
  addBox(innerW + 0.8, 0.10, innerD + 1.2, IM.ceil, 0, ceilY + 0.16, innerCZ, ceilG);
  // 椽子：贴望板下方满铺，间距 0.55
  const nRaf = Math.max(6, Math.min(46, Math.round(innerW / 0.55)));
  for (let i = 0; i <= nRaf; i++)
    addBox(0.09, 0.11, innerD + 1.0, IM.rafter,
      -innerW / 2 + i * innerW / nRaf, ceilY + 0.055, innerCZ, ceilG);
  // 檩：横向三道，压住椽尾
  [zB + innerD * 0.12, innerCZ, zF - innerD * 0.12].forEach(cz =>
    addBox(innerW + 0.6, 0.15, 0.17, IM.beam, 0, ceilY - 0.03, cz, ceilG));
  // 梁架：七道主梁 + 三道纵枋（原剖视内容，改为天花组）
  for (let i = -3; i <= 3; i++)
    addBox(W - 0.9, 0.17, 0.21, IM.beam, 0, ceilY - 0.14, zB + (i + 3) * innerD / 6, ceilG);
  [-W * 0.30, 0, W * 0.30].forEach(x =>
    addBox(0.21, 0.19, innerD, IM.beam, x, ceilY - 0.01, innerCZ, ceilG));
  // 梁底彩画：青绿叠晕的简化表达，只在梁侧贴一条色带
  for (let i = -3; i <= 3; i++) {
    const cz2 = zB + (i + 3) * innerD / 6;
    addBox(W - 1.0, 0.055, 0.225, i % 2 ? IM.paintC : IM.paintB, 0, ceilY - 0.235, cz2, ceilG);
  }
  // 中心藻井：方井 → 八角 → 圆镜，三层收分
  const cw = Math.min(4.4, W * 0.30), cd = Math.min(4.4, innerD * 0.62);
  addBox(cw + 0.9, 0.09, cd + 0.9, IM.paintC, 0, ceilY - 0.22, innerCZ, ceilG);
  addBox(cw + 0.5, 0.12, cd + 0.5, IM.wood, 0, ceilY - 0.30, innerCZ, ceilG);
  addBox(cw + 0.2, 0.10, cd + 0.2, IM.paintB, 0, ceilY - 0.38, innerCZ, ceilG);
  addCyl(cw * 0.42, cw * 0.42, 0.10, IM.trim, 8, 0, ceilY - 0.45, innerCZ, ceilG);
  addCyl(cw * 0.30, cw * 0.30, 0.08, IM.gold, 8, 0, ceilY - 0.52, innerCZ, ceilG);
  addCyl(0.55, 0.55, 0.05, IM.goldLight, 24, 0, ceilY - 0.58, innerCZ, ceilG);

  // 5) 后部佛坛（五层须弥座）+ 壁画背屏 + 造像群（按殿别配置，殿内近观的主体）
  const az = zB + Math.min(1.55, innerD * 0.22);
  const aw = Math.min(W * 0.60, 15.0);
  const by = F + 0.64;                       // 佛坛顶面
  if (!spec.furnish) {
    addBox(aw + 1.10, 0.16, 2.70, IM.base,     0, F + 0.08, az);   // 下枋
    addBox(aw + 1.00, 0.10, 2.62, IM.altarTop, 0, F + 0.21, az);   // 下枭
    addBox(aw + 0.66, 0.26, 2.34, IM.altar,    0, F + 0.39, az);   // 束腰（内收）
    addBox(aw + 1.00, 0.06, 2.58, IM.trim,     0, F + 0.55, az);   // 上枭
    addBox(aw + 1.06, 0.07, 2.64, IM.altarTop, 0, F + 0.605, az);  // 上枋
    const sw = Math.min(aw * 0.94, W * 0.62);
    // 背屏通到梁下：原先封顶 5.4 m，其上是一整片素墙，殿内视角抬头就露白
    const sh = Math.min(Math.max(3.0, ceilY - F - 1.45), 8.8);
    const sy = F + 0.45 + sh / 2;
    addBox(sw + 0.30, sh + 0.30, 0.20, IM.trim, 0, sy, zB + 0.26);
    add(new T.PlaneGeometry(sw, sh), IM.mural, 0, sy, zB + 0.38);
    addBox(sw + 0.46, 0.14, 0.34, IM.trim, 0, sy + sh / 2 + 0.10, zB + 0.40);
    addBox(sw + 0.46, 0.14, 0.34, IM.trim, 0, sy - sh / 2 - 0.10, zB + 0.40);
    [-sw / 2 - 0.12, sw / 2 + 0.12].forEach(x =>
      addBox(0.14, sh + 0.30, 0.34, IM.trim, x, sy, zB + 0.40));
    // 壁画上方加一道横枋与两侧立颊，让背屏收边（不再另设圆光，佛像自带背光）
    addBox(sw + 0.62, 0.16, 0.26, IM.beam, 0, sy + sh / 2 + 0.34, zB + 0.44);
  } else {
    // 功能房（祖堂 / 五观堂 / 客堂 / 廊庑）：不设佛坛，后墙改通长经柜 + 案桌
    addBox(aw + 0.8, 2.30, 0.55, IM.wood, 0, F + 1.15, zB + 0.55);
    const nSh = Math.max(6, Math.round((aw + 0.6) / 0.62));
    for (let i = 0; i <= nSh; i++) {
      addBox(0.05, 2.20, 0.56, IM.screen, -(aw + 0.6) / 2 + i * (aw + 0.6) / nSh, F + 1.15, zB + 0.55);
    }
    [0.62, 1.36, 2.02].forEach(y =>
      addBox(aw + 0.86, 0.08, 0.60, IM.trim, 0, F + y, zB + 0.55));
    // 案桌：长条木案 + 文房 / 茶器
    addBox(aw * 0.86, 0.13, 1.05, IM.wood, 0, F + 0.84, az - 0.30);
    [-1, 1].forEach(s =>
      addBox(0.14, 0.80, 0.14, IM.wood, s * (aw * 0.40), F + 0.40, az - 0.30));
    addCyl(0.16, 0.13, 0.24, IM.bronze, 10, 0, F + 1.03, az - 0.30);
  }

  /* ---- 造像工厂 -----------------------------------------------------------
   * 六种尊格共用一套骨架（座 → 腿/裙 → 躯干 → 臂 → 头），只在首冠、坐姿、
   * 衣饰、法器的岔口上分叉。总高 h 是连座高度，全部比例由 h 推导，
   * 因此同一份代码可同时服务 2.8 米的主尊与 1.4 米的胁侍。
   * ----------------------------------------------------------------------- */
  const MK = {
    buddha:      { robe: IM.gold,      skin: IM.gold,      crown: 'ushnisha', halo: 1 },
    medicine:    { robe: IM.gold,      skin: IM.gold,      crown: 'ushnisha', halo: 1, bowl: 1 },
    bodhisattva: { robe: IM.goldLight, skin: IM.goldLight, crown: 'tiara',    halo: 1 },
    waterMoon:   { robe: IM.goldLight, skin: IM.goldLight, crown: 'tiara',    halo: 1, vase: 1 },
    maitreya:    { robe: IM.gold,      skin: IM.goldLight, crown: 'bald',     halo: 1, belly: 1 },
    disciple:    { robe: IM.gold,      skin: IM.gold,      crown: 'bald',     halo: 0 },
    attendant:   { robe: IM.cloth,     skin: IM.goldLight, crown: 'bun',      halo: 0 },
    guardian:    { robe: IM.paintC,    skin: IM.gold,      crown: 'helmet',   halo: 0, armor: 1 },
    weiTuo:      { robe: IM.paintC,    skin: IM.gold,      crown: 'helmet',   halo: 0, armor: 1 },
    dragonKing:  { robe: IM.paintB,    skin: IM.goldLight, crown: 'crown',    halo: 0, hu: 1 },
    wealth:      { robe: IM.clothR,    skin: IM.goldLight, crown: 'crown',    halo: 0, ingot: 1 },
  };
  const STANDING = ['disciple', 'attendant', 'guardian', 'weiTuo', 'dragonKing', 'wealth'];
  const sz = az - 0.40;
  function deity(d) {
    const mark = inner.children.length;   // 供 ry 收组用
    const kind = d.kind || 'buddha';
    const P = MK[kind] || MK.buddha;
    const h = d.h || 2.4;
    const px = d.x || 0;
    const pz = az + (d.dz === undefined ? -0.40 : d.dz);
    const standing = STANDING.indexOf(kind) >= 0;
    const bh0 = standing ? h * 0.07 : h * 0.19;      // 台座高
    const bR = Math.min(h * 0.33, 1.02);              // 座盘半径：不得撑出佛坛
    /* ---- 须弥座 + 莲台 ----
     * 三层收分（下枭 / 束腰 / 上枋）外面围一圈仰莲瓣。原先用压扁球当花瓣，
     * 正面只剩几颗凸点；改成向外倾的锥体，莲瓣才有“开”的意思。 */
    addCyl(bR * 0.94, bR, bh0 * 0.34, IM.base, 18, px, by + bh0 * 0.17, pz);
    addCyl(bR * 0.70, bR * 0.90, bh0 * 0.28, IM.altar, 18, px, by + bh0 * 0.46, pz);
    addCyl(bR * 0.99, bR * 0.90, bh0 * 0.26, IM.altarTop, 18, px, by + bh0 * 0.73, pz);
    const nP = standing ? 12 : 16;
    for (let i = 0; i < nP; i++) {
      const a = i * Math.PI * 2 / nP;
      const petal = add(new T.ConeGeometry(bR * 0.185, bh0 * 0.46, 4), IM.goldLight,
        px + Math.cos(a) * bR * 0.80, by + bh0 * 0.92, pz + Math.sin(a) * bR * 0.80);
      petal.rotation.y = -a;
      petal.rotation.z = -0.26;                       // 外倾（局部 +x 恒为径向）
    }
    const y0 = by + bh0;                              // 像底
    const HH = h - bh0;                               // 像高
    const hr = HH * (standing ? 0.106 : 0.124);       // 头半径（坐像头略放大，别被宽肩吃掉）
    const headY = y0 + HH * (standing ? 0.858 : 0.775);
    // 下身：立像留给裙裾，坐像给结跏趺坐（盘腿不外撑座盘）
    if (standing) {
      const skirt = addCyl(HH * 0.145, HH * 0.215, HH * 0.42, P.robe, 12, px, y0 + HH * 0.21, pz);
      skirt.scale.z = 0.80;
      [-1, 1].forEach(s =>
        addBox(HH * 0.080, HH * 0.042, HH * 0.155, P.skin,
          px + s * HH * 0.070, y0 + HH * 0.021, pz + HH * 0.045));
    } else {
      const lap = add(new T.SphereGeometry(Math.min(bR * 0.90, HH * 0.30), 16, 8), P.robe,
        px, y0 + HH * 0.085, pz + HH * 0.035);
      lap.scale.set(1.10, 0.36, 0.80);
      [-1, 1].forEach(s => {                          // 双膝
        const kn = add(new T.SphereGeometry(HH * 0.098, 10, 8), P.robe,
          px + s * HH * 0.205, y0 + HH * 0.105, pz + HH * 0.075);
        kn.scale.set(1, 0.90, 1.12);
      });
      addBox(HH * 0.34, HH * 0.085, HH * 0.13, P.robe, px, y0 + HH * 0.118, pz + HH * 0.138);
    }
    /* 躯干：LatheGeometry 沿半径剖面旋转。关键是 88% 高度处最宽、再急收为颈根——
     * 有肩线才像“人”；原先剖面在中段最宽、往上收到很细，读起来是一截花瓶。 */
    const torsoH = standing ? HH * 0.455 : HH * 0.49;
    const torsoBot = standing ? y0 + HH * 0.30 : y0 + HH * 0.135;
    const torsoY = torsoBot + torsoH * 0.5;
    const prof = [
      [0.052, 0.00], [0.150, 0.04], [0.190, 0.18], [0.206, 0.42],
      [0.212, 0.62], [0.226, 0.80], [0.230, 0.89], [0.192, 0.945],
      [0.108, 0.98], [0.072, 1.00],
    ].map((q) => new T.Vector2(HH * q[0], torsoH * q[1]));
    const torso = add(new T.LatheGeometry(prof, 22), P.robe, px, torsoBot, pz);
    torso.scale.z = 0.74;
    // 颈：短而粗，先前的 0.14 HH 长脖子把头像顶成一根签子
    addCyl(HH * 0.058, HH * 0.072, HH * 0.09, P.skin, 10,
      px, torsoBot + torsoH + HH * 0.035, pz);
    /* 双臂：肩球 + 上臂 + 前臂。手臂半径中心从 HH*0.248 外移到 HH*0.288，
     * 否则整个上臂埋进躯干，正面只剩两条缝。坐像前臂内收结禅定印。 */
    const shY = torsoBot + torsoH * 0.90;
    [-1, 1].forEach(s => {
      const ax = px + s * HH * 0.288;
      const sh = add(new T.SphereGeometry(HH * 0.082, 10, 8), P.robe, ax, shY, pz);
      sh.scale.set(1, 1.05, 0.92);
      const armLen = HH * (standing ? 0.40 : 0.36);
      const arm = addCyl(HH * 0.052, HH * 0.060, armLen, P.robe, 10,
        ax, shY - armLen * 0.46, pz + HH * 0.006);
      arm.rotation.z = s * (standing ? 0.10 : 0.16);
      const elY = shY - armLen * 0.92;
      if (standing) {
        addCyl(HH * 0.048, HH * 0.052, HH * 0.17, P.skin, 8,
          ax + s * HH * 0.012, elY - HH * 0.075, pz + HH * 0.02);
        const hn = add(new T.SphereGeometry(HH * 0.054, 8, 6), P.skin,
          ax + s * HH * 0.018, elY - HH * 0.16, pz + HH * 0.035);
        hn.scale.set(1, 1.15, 1.05);
      } else {
        const fa = addCyl(HH * 0.045, HH * 0.049, HH * 0.22, P.skin, 8,
          ax - s * HH * 0.045, elY - HH * 0.02, pz + HH * 0.155);
        fa.rotation.z = s * 0.80;
        fa.rotation.x = -0.30;
        const hn = add(new T.SphereGeometry(HH * 0.058, 8, 6), P.skin,
          px + s * HH * 0.035, elY - HH * 0.075, pz + HH * 0.185);
        hn.scale.set(1.10, 0.62, 1.20);
      }
    });
    // 衣纹：躯干正面三道浅褶（整圈会把身体切成节）
    (standing ? [0.22, 0.38] : [0.22, 0.34, 0.46]).forEach((k, i) => {
      const rr = add(new T.TorusGeometry(HH * 0.214 * (1 - i * 0.05), HH * 0.0075, 6, 22), IM.trim,
        px, torsoBot + torsoH * k, pz + HH * 0.010);
      rr.rotation.x = Math.PI / 2;
      rr.scale.z = 0.76;
    });
    // 袈裟斜披（右肩 → 左腰）
    if (kind === 'buddha' || kind === 'medicine' || kind === 'maitreya') {
      const sash = addBox(HH * 0.075, torsoH * 0.60, HH * 0.016, IM.clothR,
        px + HH * 0.072, torsoBot + torsoH * 0.55, pz + HH * 0.152);
      sash.rotation.z = 0.40;
    }
    // 头 + 耳（沿 z 略压扁，正面更接近东方面相）
    const head = add(new T.SphereGeometry(hr, 14, 10), P.skin, px, headY, pz);
    head.scale.set(1, 1.06, 0.94);
    [-1, 1].forEach(s => {
      const e = add(new T.SphereGeometry(hr * 0.28, 6, 5), P.skin, px + s * hr * 0.94, headY - hr * 0.06, pz);
      e.scale.set(0.40, 1.20, 0.55);
    });
    // 面部：眼 / 唇（只在高度足够的像上，否则远看糊成一团）
    if (h > 2.2) {
      [-1, 1].forEach(s =>
        addBox(hr * 0.32, hr * 0.075, hr * 0.05, IM.screen, px + s * hr * 0.34, headY + hr * 0.12, pz + hr * 0.86));
      addBox(hr * 0.26, hr * 0.045, hr * 0.04, IM.clothR, px, headY - hr * 0.36, pz + hr * 0.88);
    }
    // 首冠 / 肉髻
    if (P.crown === 'ushnisha') {
      add(new T.SphereGeometry(hr * 0.46, 10, 8), P.skin, px, headY + hr * 0.92, pz);
      for (let i = 0; i < 12; i++) {                  // 螺髻
        const a = i * 2.399, r = hr * (0.30 + (i % 3) * 0.26);
        add(new T.SphereGeometry(hr * 0.145, 6, 5), P.skin,
          px + Math.cos(a) * r, headY + hr * 0.56 + (i % 4) * hr * 0.115, pz + Math.sin(a) * r * 0.9);
      }
    } else if (P.crown === 'tiara' || P.crown === 'crown') {
      addBox(hr * 2.02, hr * 0.32, hr * 1.86, IM.gold, px, headY + hr * 0.70, pz);
      [-0.62, 0, 0.62].forEach((k, i) => {
        const cone = add(new T.ConeGeometry(hr * 0.30, hr * (0.66 - Math.abs(k) * 0.22), 6),
          P.crown === 'crown' ? IM.goldLight : IM.gold, px + k * hr, headY + hr * 0.98, pz);
        if (i === 1) cone.position.y += hr * 0.09;
      });
    } else if (P.crown === 'helmet') {
      const hm = add(new T.SphereGeometry(hr * 1.08, 12, 8), IM.trim, px, headY + hr * 0.32, pz);
      hm.scale.set(1, 0.85, 1);
      addCyl(hr * 0.10, hr * 0.16, hr * 0.5, IM.clothR, 8, px, headY + hr * 1.30, pz);
      [-1, 1].forEach(s => addBox(hr * 0.3, hr * 0.9, hr * 0.08, IM.trim, px + s * hr * 0.94, headY - hr * 0.3, pz));
    } else if (P.crown === 'bun') {
      add(new T.SphereGeometry(hr * 0.44, 8, 6), P.skin, px, headY + hr * 0.90, pz);
      addBox(hr * 1.66, hr * 0.15, hr * 1.54, IM.clothR, px, headY + hr * 0.52, pz);
    }
    // 背光：金环 + 光盘 + 外圈细环，贴在背屏前一层，是殿内的视觉焦点
    if (P.halo) {
      const hy = headY + hr * 0.14;
      add(new T.CircleGeometry(hr * 1.95, 30), IM.goldLight, px, hy, pz - hr * 1.00);
      add(new T.TorusGeometry(hr * 2.06, hr * 0.105, 8, 30), IM.gold, px, hy, pz - hr * 0.96);
      add(new T.TorusGeometry(hr * 2.56, hr * 0.045, 6, 32), IM.trim, px, hy, pz - hr * 0.92);
    }
    // 璎珞 / 天衣（菩萨）
    if (kind === 'bodhisattva' || kind === 'waterMoon') {
      const ring2 = add(new T.TorusGeometry(HH * 0.118, HH * 0.011, 6, 20), IM.goldLight,
        px, torsoY - HH * 0.03, pz + HH * 0.03);
      ring2.rotation.x = 1.32;
      [-1, 1].forEach(s =>
        addBox(HH * 0.045, HH * 0.32, HH * 0.02, IM.goldLight,
          px + s * HH * 0.19, torsoY - HH * 0.13, pz - HH * 0.02));
    }
    // 法器 / 持物
    if (P.bowl) addCyl(HH * 0.07, HH * 0.05, HH * 0.06, IM.goldLight, 10, px, torsoY - torsoH * 0.42, pz + HH * 0.12);
    if (P.vase) addCyl(HH * 0.05, HH * 0.065, HH * 0.16, IM.bronze, 10, px - HH * 0.26, torsoY - torsoH * 0.40, pz + HH * 0.10);
    if (P.hu) addBox(HH * 0.05, HH * 0.34, HH * 0.02, IM.goldLight, px, torsoY - HH * 0.02, pz + HH * 0.17);
    if (P.ingot) {
      const ig = add(new T.SphereGeometry(HH * 0.09, 8, 6), IM.gold, px + HH * 0.26, torsoY - torsoH * 0.46, pz + HH * 0.10);
      ig.scale.set(1.25, 0.62, 0.9);
    }
    /* 整体朝向：deity 是逐件往 inner 里塞的，用“本次新增子节点”反收进一个组，
     * 再对组做旋转 —— 这样韦陀这类背向门口的像不必重写坐标。 */
    if (d.ry) {
      const g = new T.Group();
      g.position.set(px, 0, pz);
      g.rotation.y = d.ry;
      inner.children.slice(mark).forEach((m) => {
        inner.remove(m);
        m.position.x -= px;
        m.position.z -= pz;
        g.add(m);
      });
      inner.add(g);
    }
    return { px, pz, h };
  }

  const pantheon = spec.pantheon ||
    [{ kind: 'buddha', h: Math.min(3.0, H * 0.30), main: true }];
  const mains = [];
  pantheon.forEach((d) => { const r = deity(d); if (d.main) mains.push(r); });


  // 6) 供桌 / 五供（香炉 · 烛台 · 花瓶 · 供果）+ 桌围锦
  const tz = Math.min(az + 1.75, zF - 1.0);
  const tw = Math.min(aw * 0.72, 8.2);
  if (!spec.furnish) {
  addBox(tw, 0.16, 0.90, IM.wood, 0, F + 0.78, tz);
  [-1, 1].forEach(s =>
    addBox(0.16, 0.72, 0.16, IM.wood, s * (tw / 2 - 0.22), F + 0.40, tz));
  // 桌围：正面与两端垂红锦，殿内近看时供桌不再是光板
  addBox(tw - 0.08, 0.58, 0.03, IM.clothR, 0, F + 0.49, tz + 0.47);
  addBox(tw - 0.20, 0.06, 0.04, IM.gold, 0, F + 0.76, tz + 0.48);
  [-1, 1].forEach(s =>
    addBox(0.03, 0.58, 0.86, IM.clothR, s * (tw / 2 - 0.02), F + 0.49, tz));
  addCyl(0.40, 0.34, 0.34, IM.bronze, 14, 0, F + 1.03, tz);
  addRing(0.42, 0.05, IM.gold, 0, F + 1.21, tz);
  add(new T.SphereGeometry(0.16, 8, 6), IM.goldLight, 0, F + 1.30, tz);
  [-1, 1].forEach(s => {
    const lx = s * (tw / 2 - 0.95);
    addCyl(0.09, 0.13, 0.55, IM.bronze, 10, lx, F + 1.05, tz);
    add(new T.SphereGeometry(0.21, 8, 6), IM.lamp, lx, F + 1.42, tz);
  });
  // 花瓶一对 + 供果三盘
  [-1, 1].forEach(s => {
    const vx = s * Math.min(tw / 2 - 1.80, 2.6);
    addCyl(0.10, 0.14, 0.46, IM.bronze, 10, vx, F + 1.09, tz);
    const bloom = add(new T.SphereGeometry(0.17, 8, 6), IM.leaf, vx, F + 1.42, tz);
    bloom.scale.set(1.15, 0.92, 1);
    add(new T.SphereGeometry(0.07, 6, 5), IM.clothR, vx, F + 1.55, tz);
  });
  [-1, 0, 1].forEach((k) => {
    const fx = k * Math.min(1.15, tw * 0.16);
    addCyl(0.20, 0.16, 0.05, IM.altarTop, 8, fx, F + 0.90, tz);
    [-1, 1].forEach(s => {
      const fr = add(new T.SphereGeometry(0.095, 8, 6), IM.fruit, fx + s * 0.085, F + 0.98, tz + s * 0.04);
      fr.scale.set(1, 0.9, 1);
    });
  });

  // 6b) 幡：自天花垂下，殿内视角的纵向标尺（也补齐佛坛两侧的空白）
  const bannerX = Math.min(innerW / 2 - 1.0, aw / 2 + 1.5);
  [-1, 1].forEach(s => {
    const bx = s * bannerX, bz2 = az + 0.35;
    addCyl(0.035, 0.035, 1.05, IM.wood, 6, bx, ceilY - 0.60, bz2);
    addBox(0.98, 0.10, 0.06, IM.clothR, bx, ceilY - 1.15, bz2);
    const bh2 = Math.max(1.6, ceilY - 1.25 - (F + 2.15));
    addBox(0.86, bh2, 0.03, IM.cloth, bx, F + 2.15 + bh2 / 2, bz2);
    addBox(0.92, 0.12, 0.05, IM.gold, bx, F + 2.15, bz2);
    addBox(0.10, 0.42, 0.04, IM.clothR, bx - 0.34, F + 1.95, bz2);
    addBox(0.10, 0.42, 0.04, IM.clothR, bx + 0.34, F + 1.95, bz2);
  });
  }

  // 7) 侧案：木鱼 + 念珠（参考韩国山寺法堂的两件静心器物）
  const sideZ = zB + innerD * 0.66;
  const sideX = innerW / 2 - 1.15;
  if (!spec.furnish) [-1, 1].forEach(s => {
    const sx = s * sideX;
    addBox(1.5, 0.12, 0.90, IM.wood, sx, F + 0.72, sideZ);
    addBox(0.10, 0.66, 0.10, IM.wood, sx - 0.55, F + 0.39, sideZ);
    addBox(0.10, 0.66, 0.10, IM.wood, sx + 0.55, F + 0.39, sideZ);
  });
  if (!spec.furnish) {
    const mok = add(new T.SphereGeometry(0.40, 10, 8), IM.bead, -sideX, F + 1.00, sideZ);
    mok.scale.set(1.10, 0.78, 0.90);
    addBox(0.42, 0.09, 0.07, IM.screen, -sideX, F + 1.00, sideZ + 0.37);
    const stick = addCyl(0.045, 0.045, 0.62, IM.wood, 8, -sideX + 0.60, F + 1.02, sideZ);
    stick.rotation.z = Math.PI / 2;
    addRing(0.34, 0.035, IM.bead, sideX, F + 0.84, sideZ);
    add(new T.SphereGeometry(0.11, 8, 6), IM.goldLight, sideX, F + 0.84, sideZ + 0.34);
  }

  // 8) 成排灰色蒲团：按内室面积自适应行列，中央留拜道（法堂容量扩容）
  const seatEnd = zF - 0.55;
  const span = Math.max(0, seatEnd - (tz + 1.05));
  const seats = [];
  if (!spec.noSeats) {
    const rows = Math.max(1, Math.min(grand ? 5 : 3, Math.floor(span / 1.55) + 1));
    const rowGap = rows > 1 ? Math.min(1.62, span / (rows - 1)) : 0;
    const cols = Math.max(3, Math.min(grand ? 11 : 7, Math.floor((innerW - 1.5) / 1.6) + 1));
    const colGap = Math.min(1.62, (innerW - 1.5) / Math.max(1, cols - 1));
    for (let r = 0; r < rows; r++) {
      const pz = seatEnd - r * rowGap;
      for (let c = 0; c < cols; c++) {
        const dx = (c - (cols - 1) / 2) * colGap;
        if (Math.abs(dx) < 1.05) continue;                // 中央拜道
        if (Math.abs(dx) + 0.56 > innerW / 2 - 0.2) continue;
        seats.push({ dx, pz });
      }
    }
  }
  // 全寺 268 个蒲团以 InstancedMesh 批量绘制，运行时每殿仅 2 次 drawcall；
  // 导出 GLB 时由 bakeInstances 展开为普通 Mesh，通用查看器仍可直接打开。
  const instSeats = (geo, mat, y) => {
    const im = new T.InstancedMesh(geo, mat, seats.length);
    const m4 = new T.Matrix4();
    seats.forEach((p, i) => { m4.makeTranslation(p.dx, y, p.pz); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = false; im.receiveShadow = true;
    im.frustumCulled = false;
    inner.add(im);
  };
  if (seats.length) {
    // 拜垫尺度按真实蒲团取 0.66 m：原先 1.0 m 直径在殿内视角里像一片灰色圆盘铺地
    instSeats(new T.BoxGeometry(0.72, 0.04, 0.72), IM.mat, F + 0.03);
    instSeats(new T.CylinderGeometry(0.33, 0.35, 0.13, 12), IM.cushion, F + 0.105);
  }

  // 9) 锚点注册（世界坐标，含高台 baseY 偏移；蒲团附朝向与座号）
  REG.anchors.push(
    { hallId: id, kind: 'altar',   ...world(0, by, az) },
    { hallId: id, kind: 'statue',
      ...world(mains.length ? mains[0].px : 0, by,
               mains.length ? mains[0].pz : sz) },
    { hallId: id, kind: 'incense', ...world(0, F + 0.86, tz) },
    { hallId: id, kind: 'mural',   ...world(0, F + 1.2, zB + 0.5) },
    { hallId: id, kind: 'moktak',  ...world(-sideX, F + 0.78, sideZ) },
    { hallId: id, kind: 'beads',   ...world(sideX, F + 0.78, sideZ) },
  );
  [-1, 1].forEach(s =>
    REG.anchors.push({ hallId: id, kind: 'lantern',
      ...world(s * (tw / 2 - 0.95), F + 0.86, tz) }));
  seats.forEach((p, i) =>
    REG.anchors.push({ hallId: id, kind: 'cushion',
      ...world(p.dx, F + 0.22, p.pz), yaw: faceYaw, seat: i + 1 }));
  REG.seats = REG.seats || {};
  REG.seats[id] = seats.length;

  // 7) 由几何生成碰撞矩形与包围盒（局部坐标 → 世界 AABB，旋转配殿同样适用）
  const half = W / 2;
  const rects = [
    { x: -(half + doorHalf) / 2, z: frontZ, w: half - doorHalf, d: 0.6 },
    { x:  (half + doorHalf) / 2, z: frontZ, w: half - doorHalf, d: 0.6 },
  ];
  if (spec.backDoor) {
    rects.push({ x: -(half + doorHalf) / 2, z: backZ, w: half - doorHalf, d: 0.6 });
    rects.push({ x:  (half + doorHalf) / 2, z: backZ, w: half - doorHalf, d: 0.6 });
  } else rects.push({ x: 0, z: backZ, w: W, d: 0.6 });
  // 左侧（世界 -x）若开侧门，把整条左墙拆成门洞前后两段，中间留出可通行缺口；
  // sdZ 用室内中心，门宽 2×sdHalf。右墙整条保留。
  [-1, 1].forEach(s => {
    const x = s < 0 ? -half + 0.25 : half - 0.25;
    if (s < 0 && spec.sideDoor) {
      rects.push({ x, z: (frontZ + sdZ + sdHalf) / 2, w: 0.6, d: Math.max(0.4, frontZ - (sdZ + sdHalf)) });
      rects.push({ x, z: (backZ + sdZ - sdHalf) / 2, w: 0.6, d: Math.max(0.4, (sdZ - sdHalf) - backZ) });
    } else {
      rects.push({ x, z: (frontZ + backZ) / 2, w: 0.6, d: frontZ - backZ });
    }
  });

  const body = toAABB(0, (spec.bodyFront + spec.bodyBack) / 2,
    W + 0.6, spec.bodyFront - spec.bodyBack);
  // 殿内不可穿越的实体：佛坛（含须弥座外沿）、供案、经柜
  const blocks = [];
  if (!spec.furnish) {
    blocks.push(toAABB(0, az, aw + 1.2, 2.8));
    blocks.push(toAABB(0, tz, tw + 0.2, 1.0));
  } else {
    blocks.push(toAABB(0, zB + 0.55, aw + 0.9, 0.7));
    blocks.push(toAABB(0, az - 0.30, aw * 0.86, 1.2));
  }

  REG.boxes.push({
    id,
    x: (body.x0 + body.x1) / 2, z: (body.z0 + body.z1) / 2,
    width: body.x1 - body.x0, depth: body.z1 - body.z0,
    baseY, floorY: baseY + F,
    ceilY: baseY + ceilY,
    innerW, innerD,
    walls: rects.map(r => toAABB(r.x, r.z, r.w, r.d)),
    blocks,
    inner: toAABB(0, innerCZ, innerW, innerD),
  });
  return { cut, ceil: ceilG, front: frontG, inner };
}

/** 带中央券洞的墙（前墙 / 后墙共用） */
function makeDoorWall(W, H, doorW, doorH, top, z, mat, depth) {
  const shape = new T.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  shape.holes.push(archShape(0, doorW, doorH));
  return makeMesh(new T.ExtrudeGeometry(shape,
    { depth, bevelEnabled: false, curveSegments: 16 }), mat, 0, top, z);
}

/* ---------- B. 通用中轴殿宇（单檐 / 重檐，抬高 + 可进入室内） ---------- */
function makeHall(s, baseY, id) {
  const g = new T.Group();
  const y0 = baseY || 0;
  g.position.set(0, y0, s.z);
  const W = s.W, D = s.D, H = s.H, top = 0.90;
  const frontZ = D / 2, wallZ = frontZ - 0.55, backZ = -D / 2 + 0.20;
  const gz = lz => s.z + lz;
  const pw = s.pw || 3.8;
  const doorHalf = 1.55;
  const F = 0.975;   // 室内地坪（局部 y，台基顶 0.97）

  const IT = buildInterior(g, {
    W, H, top, floorY: F,
    frontWallZ: wallZ, backWallZ: backZ, doorHalf,
    backDoor: true, bodyFront: frontZ + 1.25, bodyBack: backZ - 0.35,
    sideDoor: true,   // 左侧开可通行侧门：碰撞墙拆段 + 门洞格窗跳过
    pantheon: PANTHEON[id],
  }, id, y0);

  // 台基 + 踏道
  g.add(box(W + 3.2, 0.90, D + 2.6, M.stoneDark, 0, 0.45, 0));
  g.add(box(W + 3.4, 0.14, D + 2.8, M.stoneWhite, 0, 0.90, 0));
  for (let k = 0; k < 5; k++) {
    g.add(box(Math.min(6.4, W * 0.44), 0.18, 0.56, M.stone,
      0, 0.82 - k * 0.18, frontZ + 1.40 + k * 0.56));
  }

  // 前墙：三券门。中央门敞开供人物穿行；两侧门保留深色格栅
  const shape = new T.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const doorH = H * 0.72;
  const doors = [
    { x: 0, w: 3.0, h: doorH + 0.45, open: true },
    { x: -W * 0.28, w: 2.1, h: doorH, open: false },
    { x: W * 0.28, w: 2.1, h: doorH, open: false }
  ];
  doors.forEach(d => shape.holes.push(archShape(d.x, d.w, d.h)));
  const frontWall = makeMesh(new T.ExtrudeGeometry(shape,
    { depth: 0.5, bevelEnabled: false, curveSegments: 16 }), M.wall, 0, top, wallZ);
  IT.front.add(frontWall);  // 前墙单列：俯瞰掀盖时隐藏，殿内视角必须保留
  doors.forEach(d => {
    if (!d.open) {
      const sh = archShape(d.x, d.w - 0.06, d.h - 0.03);
      const dk = new T.ShapeGeometry(sh, 16); remapShapeUV(dk, d.w, d.h);
      IT.front.add(makeMesh(dk, M.ink, 0, top, wallZ + 0.47, false));
      const lat = new T.ShapeGeometry(sh, 16); remapShapeUV(lat, d.w, d.h);
      const lm = M.lattice.clone();
      lm.map = latticeTex.clone(); lm.map.repeat.set(2.0, 2.4); lm.map.needsUpdate = true;
      IT.front.add(makeMesh(lat, lm, 0, top, wallZ + 0.49, false));
    }
    const pts = archOutline(d.x, d.w + 0.06, d.h + 0.03)
      .map(p => new T.Vector3(p[0], p[1] + top, wallZ + 0.55));
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 40, 0.075, 6, true), M.woodDark));
  });

  // 侧墙 / 后墙（后墙开中央券门，贯通中轴御道）
  // 左侧墙开侧门：沿 z 展开的带券洞墙（洞心 z=0.315 与 buildInterior 的 sdZ 对齐），
  // 让香客可从西侧庭院经侧门进殿；碰撞缺口由 buildInterior sideDoor 同步生成。
  const sdZ = 0.315, sdW = 2.4, sdH = Math.min(5.4, H * 0.5);
  const lw = makeDoorWall(D, H, sdW, sdH, top, 0, M.wallShade, 0.5);
  lw.rotation.y = Math.PI / 2;
  lw.position.set(-W / 2 - 0.45, top, sdZ);
  g.add(lw);
  // 侧门木框：两根门柱 + 门楣（在宫墙内侧略凸出）
  [-1, 1].forEach(ss => g.add(box(0.30, sdH, 0.26, M.woodDark,
    -W / 2 - 0.10, top + sdH / 2, sdZ + ss * (sdW / 2 + 0.13))));
  g.add(box(0.30, 0.24, sdW + 0.50, M.woodDark, -W / 2 - 0.10, top + sdH + 0.10, sdZ));
  g.add(box(0.5, H, D, M.wallShade, W / 2 + 0.2, top + H / 2, 0));
  // 后门压到 4.6 米：原 H*0.72 在殿内看是半片天空，且小门更合寺观后门之制
  g.add(makeDoorWall(W, H, 3.0, Math.min(4.60, H * 0.55), top, backZ, M.wallShade, 0.5));

  // 前廊柱列 + 额枋 + 斗拱（斗拱是全局实例，坐标需换算到世界）
  [-3, -2, -1, 1, 2, 3].forEach(i => {
    const x = i * W / 7.2;
    g.add(cyl(0.22, 0.25, H + 0.1, M.wood, 10, x, top + (H + 0.1) / 2, frontZ));
    g.add(cyl(0.32, 0.32, 0.14, M.stoneDark, 10, x, top + 0.06, frontZ));
    pushDougong(x, y0 + top + H - 0.05, gz(frontZ), 0.8);
  });
  g.add(box(W + 0.6, 0.32, 0.36, M.woodMid, 0, top + H - 0.16, frontZ + 0.04));
  g.add(box(W + 0.6, 0.16, 0.30, M.woodDark, 0, top + H - 0.48, frontZ + 0.04));

  // 横匾 + 经板楹联
  const pm = plaqueMaterial(s.name);
  g.add(panel(pw, 0.95, pm, 0, top + H * 0.80, frontZ + 0.20));
  g.add(box(pw + 0.25, 1.10, 0.14, M.woodDark, 0, top + H * 0.80, frontZ + 0.12));
  [-W * 0.42, W * 0.42].forEach(x => {
    g.add(panel(0.70, 2.55, M.sutra, x, top + H * 0.45, wallZ + 0.56));
    g.add(box(0.84, 0.10, 0.10, M.woodMid, x, top + H * 0.45 + 1.35, wallZ + 0.58));
  });

  // 下檐 / 腰檐（归入剖视组）
  const rw = W + 3.4, rd = D + 3.6;
  const lowerRise = s.two ? s.rise * 0.55 : s.rise;
  // 飞檐起翘收敛：corner 0.62→0.36，翘角不再横向冲进两侧配殿；屋面略收，留采光缝
  IT.cut.add(makeRoof(rw - 0.8, rd, top + H + 0.22, lowerRise,
    { corner: 0.36, ridgeHalf: (rw - 0.8 - rd) / 2 - 0.30, curve: 1.40, seg: 20, beasts: false }));

  // 重檐：上层墙体 + 格窗 + 竖匾 + 上檐
  if (s.two) {
    const ub = top + H + 1.30;
    const uw = W * 0.74, ud = D * 0.62;
    g.add(box(uw, 2.9, ud, M.wall, 0, ub + 1.45, -0.5));
    g.add(box(uw + 0.3, 0.28, ud + 0.3, M.woodMid, 0, ub + 2.95, -0.5));
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      g.add(panel(1.35, 1.7, M.lattice, i * uw / 8, ub + 1.45, ud / 2 - 0.5 + 0.02));
    }
    const vm = plaqueMaterial(s.name, { vertical: true });
    g.add(panel(1.10, 2.45, vm, 0, ub + 1.45, ud / 2 - 0.5 + 0.06));
    g.add(box(1.28, 2.62, 0.12, M.woodDark, 0, ub + 1.45, ud / 2 - 0.5 - 0.02));
    [-uw / 2, -uw / 4, uw / 4, uw / 2].forEach(x => {
      g.add(cyl(0.18, 0.20, 2.9, M.wood, 8, x, ub + 1.45, ud / 2 - 0.45));
      pushDougong(x, y0 + ub + 2.95, gz(ud / 2 - 0.45), 0.66);
    });
    // “阁”形制：上层外挑平坐 + 一圈木栏杆（凌霄阁专用）
    if (s.gallery) {
      const gy = ub + 0.16, gw = uw + 1.5, gd = ud + 1.5, cz = -0.5;
      g.add(box(gw, 0.16, gd, M.stoneWhite, 0, gy, cz));
      const rail = (x, z, w, d) => {
        g.add(box(w, 0.10, d, M.woodMid, x, gy + 0.72, z));
        g.add(box(w, 0.08, d, M.woodDark, x, gy + 0.34, z));
      };
      rail(0, cz + gd / 2 - 0.06, gw, 0.10);
      rail(0, cz - gd / 2 + 0.06, gw, 0.10);
      rail(-gw / 2 + 0.06, cz, 0.10, gd);
      rail(gw / 2 - 0.06, cz, 0.10, gd);
      for (let i = -4; i <= 4; i++) {
        [-1, 1].forEach(sg => {
          g.add(box(0.16, 0.86, 0.16, M.woodDark, i * gw / 9, gy + 0.43, cz + sg * (gd / 2 - 0.06)));
          g.add(box(0.16, 0.86, 0.16, M.woodDark, sg * (gw / 2 - 0.06), gy + 0.43, cz + i * gd / 9));
        });
      }
    }
    const rw2 = W + 2.4, rd2 = D + 2.6;
    IT.cut.add(makeRoof(rw2 - 0.6, rd2, ub + 3.10, s.rise,
      { corner: 0.36, ridgeHalf: (rw2 - 0.6 - rd2) / 2 - 0.35, curve: 1.45, seg: 24, beasts: true }));
  }
  return g;
}

/* ---------- C. 两侧配殿：按龙王殿照片重做的两层楼阁 ---------------------
 * 下层层高加高、上层仅四成且收分；深栗木柱与铺作、米白墙、青灰筒瓦。
 * 一层：密直棂格门 / 金框墨底匾 / 黄色楹联 / 柱头 + 补间密铺作；
 * 腰檐：一排圆瓦当；二层窗直接落在瓦檐上，照片里没有平坐栏杆，故不设勾栏；
 * 上层：整面密直棂格窗 + 方格横披、深栗柱分间、上檐下悬墨底金字匾。 */
function makeSideHall(court, side, name, baseY, id, deep) {
  const g = new T.Group();
  g.position.set(side * (court.x || AXIS.sideX), baseY || 0, court.mid);
  g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const W = court.len, D = deep ? 11.2 : 9.0;   // 配殿进深随中轴再放大（局部 X 方向），中庭仍有余量
  const top = 0.70, F = SONG.podium;
  const H1 = SONG.colTop - top - 0.10;   // 7.60：下檐柱顶抬到 8.40 标高
  const wallZ = D / 2 - 0.30, backZ = -D / 2 + 0.15;
  const doorHalf = 1.05;

  const IT = buildInterior(g, {
    W, H: H1, top, floorY: F,
    frontWallZ: wallZ, backWallZ: backZ, doorHalf,
    backDoor: false, bodyFront: D / 2 + 0.8, bodyBack: -D / 2 - 0.8,
    // 室内天花抬到一层腰檐下极限：净高 6.88 → 8.48（腰檐 9.5 不破，二层楼面 10.6 不穿）
    ceilingY: SONG.eave1 - 0.20,
    pantheon: SIDE_PANTHEON[name],
    furnish: SIDE_FURNISH[name],
    noSeats: !!SIDE_FURNISH[name],
  }, id, baseY || 0);

  // 台基 + 天王殿配色：米白墙、深栗木构，前墙开中央门贯通庭院
  g.add(box(W + 1.6, 0.70, D + 1.6, M.stoneDark, 0, 0.35, 0));
  g.add(box(W + 1.8, 0.12, D + 1.8, M.stoneWhite, 0, 0.70, 0));
  IT.front.add(makeDoorWall(W, H1, 2.1, H1 * 0.70, top, wallZ, SM.wall, 0.30));
  g.add(box(0.30, H1, D, SM.wallShade, -W / 2 - 0.15, top + H1 / 2, 0));
  g.add(box(0.30, H1, D, SM.wallShade, W / 2 + 0.15, top + H1 / 2, 0));
  g.add(box(W, H1, 0.30, SM.wallShade, 0, top + H1 / 2, backZ));

  // 一层：粗栗柱 + 密直棂格门 + 层层出跳的柱头 / 补间铺作
  const n = Math.max(3, Math.floor(W / 2.6));
  const spots = [];
  for (let i = 0; i <= n; i++) {
    const xc = -W / 2 + i * W / n;
    const col = cyl(0.19, 0.21, SONG.colTop - F, SM.column, 12,
      xc, F + (SONG.colTop - F) / 2, D / 2);
    if (i === 0 || i === n) col.rotation.z = i === 0 ? -0.012 : 0.012;  // 侧脚
    g.add(col);
    g.add(cyl(0.28, 0.30, 0.12, M.stoneDark, 10, xc, F + 0.06, D / 2));
    g.add(box(0.40, 0.22, 0.16, SM.columnDim, xc, SONG.colTop - 0.18, D / 2 + 0.16));
    spots.push({ x: xc, z: D / 2 });
    if (i < n) {                                       // 每间两朵补间铺作
      const step = W / n;
      spots.push({ x: xc + step / 3, z: D / 2 });
      spots.push({ x: xc + step * 2 / 3, z: D / 2 });
    }
  }
  for (let i = 0; i < n; i++) {
    const xw = -W / 2 + (i + 0.5) * W / n;
    if (Math.abs(xw) < 1.35) continue;                // 让出中央门洞
    const bw = W / n - 0.28;
    // 门墙挤出体的前表面恰在 D/2，格门必须再前移才能盖住白墙
    g.add(panel(bw, 5.60, SM_LATTICE, xw, F + 3.02, D / 2 + 0.05));
    g.add(panel(bw, 1.20, SM_LATTICE, xw, F + 6.45, D / 2 + 0.05));  // 门楣横披，不留白墙带
    g.add(box(bw + 0.10, 0.16, 0.16, SM.columnDim, xw, F + 5.88, D / 2 + 0.09));
    g.add(box(bw + 0.10, 0.16, 0.16, SM.columnDim, xw, F + 7.12, D / 2 + 0.09));
    g.add(box(bw + 0.10, 0.16, 0.16, SM.columnDim, xw, F + 0.28, D / 2 + 0.09));
  }
  [SONG.colTop - 2.90, SONG.colTop - 0.10].forEach(y =>   // 腰串：避开金匾
    g.add(box(W + 0.2, 0.10, 0.12, SM.columnDim, 0, y, D / 2 + 0.10)));
  g.add(box(W + 0.5, SONG.lintel, 0.30, SM.lintel,
    0, SONG.colTop + SONG.lintel / 2, D / 2));
  g.add(box(W + 1.2, SONG.pupai, 0.46, SM.pupai,
    0, SONG.colTop + SONG.lintel + SONG.pupai / 2, D / 2));   // 普拍方两端出头
  songBracketSet(g, spots, SONG.eave1, SONG.bracketScale);

  // 一层金框墨底匾（照片中“龙王殿”）：挑出到腰檐前沿之下，避免被瓦檐遮住
  const longName = name.length > 4;
  const pw2 = longName ? 4.6 : 3.2;
  const py = SONG.colTop - 0.85, pz = D / 2 + 0.92;
  g.add(box(pw2 + 0.28, 1.16, 0.16, SM.columnDim, 0, py, pz - 0.10));
  g.add(panel(pw2, 1.00,
    goldPlaque(name, { w: longName ? 1024 : 768, h: 240, size: longName ? 92 : 128 }),
    0, py, pz));
  [-1, 1].forEach(s =>   // 匾上两根吊杆，挂在阑额下
    g.add(box(0.06, 0.42, 0.06, SM.lattice, s * pw2 * 0.34, py + 0.76, pz - 0.06)));
  const couplets = ['佛光普照三千界', '法雨均沾万亿心'];
  [-1, 1].forEach((s, k) => {
    const cx = s * 2.06;
    g.add(box(0.54, 4.34, 0.12, SM.columnDim, cx, F + 2.90, D / 2 + 0.14));
    g.add(panel(0.44, 4.20, coupletMat(couplets[k]), cx, F + 2.90, D / 2 + 0.22));
  });

  // 一层腰檐：加大外挑 + 举高，使俯瞰与近景都能看到一楼有一圈独立屋檐
  // （原先挑出仅 1.3、举高 1.0，被二层上檐盖住，远看像"一楼没屋檐"）。
  // 外挑比二层上檐多出约 2.6，形成清晰的一层披檐；四角仅轻翘，不与主体打架。
  // w 沿中轴方向：收到 W+1.6，避免相邻配殿首尾飞檐重叠（原 W+2.6 首尾搭 2.0）；
  // d 朝中庭方向：加大到 D+5.2，一楼披檐朝庭院明显外挑，二层上檐也不会盖住它。
  IT.cut.add(songRoof(W + 1.6, D + 5.2, SONG.eave1, 1.30,
    { corner: 0.36, curve: 1.26, seg: 18 }));
  eaveTileRow(IT.cut, W + 1.5, SONG.eave1 - 0.08, D / 2 + 2.60);

  /* 二层：腰檐瓦之上直接起密直棂格窗，不设平坐勾栏（照片中无红色栏杆） */
  const upper = new T.Group();
  IT.cut.add(upper);                       // 剖视时二层一并隐去，避免遮挡室内
  const P = SONG.pingzuo, C2 = SONG.colH2;
  const W2 = W * 0.86, D2 = D * 0.80;
  const gw = W2 + 2.4, gd = D2 + 2.4;
  upper.add(box(gw, 0.20, gd, M.woodDark, 0, P, 0));        // 平坐外挑（深栗）
  upper.add(box(gw + 0.16, 0.10, gd + 0.16, M.stoneWhite, 0, P + 0.15, 0));
  // 只留一圈低矮雁翅板，不立望柱、不设寻杖
  [-1, 1].forEach(sg => upper.add(box(gw, 0.24, 0.12, SM.columnDim,
    0, P + 0.02, sg * (gd / 2 - 0.06))));
  const f2 = P + 0.20;                     // 二层楼面
  upper.add(box(W2, C2, D2, SM.wall, 0, f2 + C2 / 2, -0.20));
  const n2 = Math.max(3, Math.floor(W2 / 2.4));
  const spots2 = [];
  for (let i = 0; i <= n2; i++) {
    const xc = -W2 / 2 + i * W2 / n2;
    upper.add(cyl(0.15, 0.17, C2, SM.column, 10, xc, f2 + C2 / 2, D2 / 2 - 0.20));
    spots2.push({ x: xc, z: D2 / 2 - 0.20 });
  }
  for (let i = 0; i < n2; i++) {
    const xw = -W2 / 2 + (i + 0.5) * W2 / n2;
    const bw = W2 / n2 - 0.24;
    upper.add(panel(bw, C2 - 0.44, SM_LATTICE, xw, f2 + C2 / 2, D2 / 2 - 0.12));
    upper.add(box(bw + 0.10, 0.14, 0.16, SM.columnDim, xw, f2 + 0.16, D2 / 2 - 0.08));
    upper.add(box(bw + 0.10, 0.14, 0.16, SM.columnDim, xw, f2 + C2 - 0.16, D2 / 2 - 0.08));
  }
  const t2 = f2 + C2;                      // 13.80：二层柱顶
  upper.add(box(W2 + 0.5, 0.30, 0.28, SM.lintel, 0, t2 + 0.15, D2 / 2 - 0.20));
  upper.add(box(W2 + 1.0, 0.12, 0.42, SM.pupai, 0, t2 + 0.36, D2 / 2 - 0.20));
  songBracketSet(upper, spots2, SONG.eave2, 0.55);
  // 上檐下悬墨底金字横匾（照片上层题额）
  const uw = 3.6;   // 照片里上层另题四字吉语“神应灵泽”，与一层殿名匾区分
  upper.add(box(uw + 0.18, 0.90, 0.12, SM.columnDim, 0, SONG.eave2 - 0.92, D2 / 2 + 0.30));
  upper.add(panel(uw, 0.78, plaqueMaterial('神應靈澤', { size: 88 }),
    0, SONG.eave2 - 0.92, D2 / 2 + 0.38));
  IT.cut.add(songRoof(W2 + 2.4, D2 + 2.6, SONG.eave2, SONG.roofRise,
    { corner: 0.32, curve: 1.28, seg: 18 }));
  eaveTileRow(IT.cut, W2 + 2.3, SONG.eave2 - 0.08, D2 / 2 + 1.28);
  return g;
}

/* ---------- D. 四角转角廊：加高到与配殿一层檐口齐平，深栗柱列直棂 ---------- */
function makeCrossLink(z, side, baseY, x) {
  const g = new T.Group();
  const L = 6.8, B = SONG.laneBase, CT = SONG.colTop;
  g.position.set(side * (x || 14.1), baseY || 0, z);
  g.add(box(L, 0.22, 3.2, M.stoneDark, 0, 0.11, 0));
  g.add(box(L, 0.08, 3.4, M.stoneWhite, 0, 0.26, 0));
  const spots = [];
  for (let i = 0; i <= 4; i++) {
    const xx = -L / 2 + i * L / 4;
    [-1.42, 1.42].forEach(zz => {
      g.add(cyl(0.15, 0.17, CT - B, SM.column, 8, xx, B + (CT - B) / 2, zz));
      g.add(cyl(0.24, 0.26, 0.10, M.stoneDark, 8, xx, B + 0.05, zz));
      spots.push({ x: xx, z: zz });
    });
  }
  [-1.42, 1.42].forEach(zz => {
    g.add(box(L + 0.4, SONG.lintel, 0.26, SM.lintel, 0, CT + SONG.lintel / 2, zz));
    g.add(box(L + 0.9, SONG.pupai, 0.42, SM.pupai,
      0, CT + SONG.lintel + SONG.pupai / 2, zz));
  });
  songBracketSet(g, spots, SONG.eave1, SONG.bracketScale);
  for (let i = 0; i < 4; i++) {
    const xx = -L / 2 + (i + 0.5) * L / 4;
    g.add(box(L / 4 - 0.06, 1.05, 0.14, SM.wallShade, xx, 1.15, -1.42));
    g.add(panel(L / 4 - 0.18, 4.30, SM_LATTICE, xx, 4.85, -1.34));
    g.add(box(L / 4 - 0.06, 0.12, 0.30, SM.lattice, xx, 0.66, 1.42));
    g.add(box(L / 4 - 0.06, 0.11, 0.18, SM.rail, xx, 1.02, 1.42));
  }
  [2.90, 5.60].forEach(y => [-1.42, 1.42].forEach(zz =>
    g.add(box(L, 0.10, 0.12, SM.columnDim, 0, y, zz))));
  const roof = songRoof(L + 1.0, 3.8, SONG.eave1, 0.82,
    { corner: 0.24, curve: 1.22, seg: 14 });
  g.add(roof);
  const _REG = window.__INTERIOR__; if (_REG && _REG.corridorRoofs) _REG.corridorRoofs.push(roof);
  return g;
}

/* ---------- D2. 前院抄手廊（天王殿配色）：加高柱列 / 直棂窗 / 灰瓦卷棚 ---------- */
/**
 * 一段开敞廊庑。局部 x = 廊长，局部 z = 廊宽，局部 +z 面朝中庭。
 * 柱顶 / 阑额 / 普拍方 / 铺作 / 檐口与两侧配殿一层完全同一标高（SONG）：
 * 条石台基 → 栗柱柱础 → 腰串 + 直棂横披 → 阑额普拍方 → 硕大铺作 → 青灰瓦卷棚顶。
 * 廊两端仍折入院内即止，中央御道是唯一通往殿门的直路。
 */
function makeCorridorBay(len, width, opt) {
  const o = Object.assign({ seats: true, lamps: false, backWall: true }, opt || {});
  const g = new T.Group();
  const zF = width / 2 - 0.16, zB = -width / 2 + 0.16;
  const B = SONG.laneBase, CT = SONG.colTop;
  g.add(box(len + 0.70, 0.22, width + 0.70, M.stoneDark, 0, 0.11, 0));
  g.add(box(len + 0.80, 0.08, width + 0.80, M.stoneWhite, 0, 0.26, 0));
  const n = Math.max(2, Math.round(len / 2.25));
  const spots = [];
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + i * len / n;
    [zF, zB].forEach(z => {
      g.add(cyl(0.24, 0.24, 0.12, M.stoneDark, 10, x, B + 0.02, z));
      g.add(cyl(0.145, 0.17, CT - B, SM.column, 10, x, B + (CT - B) / 2, z));
      spots.push({ x, z });
    });
    g.add(box(0.34, 0.20, 0.13, SM.columnDim, x, CT - 0.18, zF - 0.18)); // 绰幕方
  }
  [zF, zB].forEach(z => {
    g.add(box(len + 0.50, SONG.lintel, 0.28, SM.lintel, 0, CT + SONG.lintel / 2, z));
    g.add(box(len + 1.00, SONG.pupai, 0.44, SM.pupai,
      0, CT + SONG.lintel + SONG.pupai / 2, z));
  });
  songBracketSet(g, spots, SONG.eave1, SONG.bracketScale);
  const m = Math.max(2, Math.round(len / 0.55));
  for (let i = 1; i < m; i++)                                        // 挂落
    g.add(box(0.055, 0.34, 0.10, SM.lattice,
      -len / 2 + i * len / m, CT - 0.40, zF));
  // 高柱之间以腰串、直棂横披与槛墙分段，既存深栗木立面又不失开敞
  const bay = len / n;
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * bay;
    if (o.backWall) {
      g.add(box(bay - 0.06, 1.05, 0.14, SM.wallShade, x, 0.62, zB));
      g.add(panel(bay - 0.16, 3.20, SM_LATTICE, x, 5.80, zB + 0.08));
    }
    if (o.seats) {                                                    // 美人靠
      g.add(box(bay - 0.10, 0.12, 0.30, SM.lattice, x, 0.58, zF));
      g.add(box(bay - 0.10, 0.11, 0.18, SM.rail, x, 1.03, zF));
      const k = Math.max(2, Math.round(bay / 0.68));
      for (let j = 0; j <= k; j++)
        g.add(box(0.075, 0.42, 0.075, SM.rail,
          x - (bay - 0.10) / 2 + j * (bay - 0.10) / k, 0.80, zF));
    }
    g.add(panel(bay - 0.18, 1.55, SM_LATTICE, x, CT - 1.10, zF - 0.04));
  }
  [2.90, 5.60].forEach(y => [zF, zB].forEach(z =>
    g.add(box(len + 0.2, 0.10, 0.12, SM.columnDim, 0, y, z))));
  const roof = songRoof(len + 1.0, width + 1.0, SONG.eave1, 0.78,
    { corner: 0.26, curve: 1.22, seg: 16 });
  g.add(roof);
  const _REG = window.__INTERIOR__; if (_REG && _REG.corridorRoofs) _REG.corridorRoofs.push(roof);
  if (o.lamps) {
    [-len / 3, 0, len / 3].forEach(x => {
      g.add(cyl(0.020, 0.020, 0.30, SM.railDark, 6, x, CT - 0.32, zF - 0.10));
      g.add(makeMesh(new T.SphereGeometry(0.17, 10, 8), M2.lampWarm,
        x, CT - 0.56, zF - 0.10, false));
    });
  }
  return g;
}

/** 一侧前院抄手廊（柱顶 / 阑额 / 檐口与配殿一层齐平）：
 *  纵廊 + 后端向内折的横廊，前端由外移后的转角廊充当横臂，
 *  整体呈“ㄈ”字开口朝中庭。两端均不接山门、不接释迦宝殿，内端止于 |x| = 14.6，
 *  中央御道仍是唯一通往殿门的直路 —— 沿廊不能直接到门。 */
function makeFrontCloister(side) {
  const F = FRONT_COURT;
  const g = new T.Group();
  const len = F.z1 - F.z0;
  const run = makeCorridorBay(len, F.laneW, { lamps: true });
  run.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;  // 局部 +z 朝中庭
  run.position.set(side * F.laneX, 0, (F.z0 + F.z1) / 2);
  g.add(run);
  const turnX = side * (F.laneX - F.laneW / 2 - F.turn / 2);
  const arm = makeCorridorBay(F.turn, F.laneW, { lamps: false });
  arm.position.set(turnX, 0, F.z1 - F.laneW / 2);
  g.add(arm);
  return g;
}

/** 第一进外移后与第二进的错台：一段横向连廊把两列配殿接回，侧院仍不断开 */
function makeJunctionLink(side) {
  const len = 7.0;
  const bay = makeCorridorBay(len, 2.4, { seats: true, lamps: false });
  // 错台连廊接回外移后的一进 / 二进配殿（中心分别 27.0 / 26.5）
  bay.position.set(side * 24.8, 0, FRONT_COURT.linkZ);
  return bay;
}

/* ---------- E. 锦鲤池 + 跨池石桥 ---------- */
function makePond(z) {
  const g = new T.Group(); g.position.set(0, 0, z);
  const PW = 24, PD = 13;
  g.add(box(PW + 1.2, 0.28, PD + 1.2, M.stoneDark, 0, -0.20, 0));
  g.add(box(PW, 0.16, PD, M2.pondFloor, 0, -0.08, 0));
  const water = makeMesh(new T.PlaneGeometry(PW - 0.9, PD - 0.9), M2.water, 0, 0.055, 0, false);
  water.rotation.x = -Math.PI / 2; g.add(water);
  // 石岸（四条）
  [1, -1].forEach(s => {
    g.add(box(PW + 1.0, 0.52, 0.72, M.stoneWhite, 0, 0.20, s * PD / 2));
    g.add(box(0.72, 0.52, PD + 0.4, M.stoneWhite, s * PW / 2, 0.20, 0));
  });
  // 睡莲
  [[-8, 3.2], [-6.4, -3.8], [7.2, 3.8], [8.6, -2.6], [-2.8, 4.2], [3.6, -4.3], [10.1, 0.6], [-10.4, -0.8]]
    .forEach((p, i) => {
      const l = makeMesh(new T.CylinderGeometry(0.42 + (i % 3) * 0.08, 0.42, 0.035, 9), M2.lotus,
        p[0], 0.085, p[1], false);
      g.add(l);
    });
  // 锦鲤（红 / 白 / 橙）
  [[-6.5, -2.6], [3.2, 2.1], [7.8, -3.4], [-3.4, 3.6], [0.8, -1.2], [5.4, 4.2], [-8.6, 1.4], [8.8, 1.1]]
    .forEach((p, i) => {
      const k = new T.Group(); k.position.set(p[0], 0.13, p[1]);
      k.rotation.y = i * 0.87;
      const body = makeMesh(new T.SphereGeometry(0.32, 10, 8), M2.koi[i % 3], 0, 0, 0, false);
      body.scale.set(0.55, 0.34, 1.55); k.add(body);
      const tail = makeMesh(new T.ConeGeometry(0.20, 0.48, 4), M2.koi[(i + 1) % 3], 0, 0, -0.66, false);
      tail.rotation.x = -Math.PI / 2; k.add(tail);
      g.add(k);
    });
  // 岸边湖石
  [[-12.6, 5.2], [12.8, -5.0], [-11.4, -6.4], [11.6, 6.2]].forEach(p => {
    const r = makeMesh(new T.IcosahedronGeometry(0.85, 0), M2.rock, p[0], 0.45, p[1]);
    r.scale.set(1.1, 0.9, 0.8); g.add(r);
  });
  return g;
}

function makeBridge(z) {
  const g = new T.Group(); g.position.set(0, 0, z);
  const N = 7;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), zz = -6.7 + t * 13.4;
    const y = 0.30 + 0.44 * Math.sin(Math.PI * t);
    g.add(box(4.5, 0.24, 2.35, M.stoneWhite, 0, y, zz));
    [-1, 1].forEach(s => {
      g.add(box(0.20, 0.52, 2.35, M.stone, s * 2.28, y + 0.36, zz));
      g.add(box(0.28, 0.10, 2.35, M.stoneDark, s * 2.28, y + 0.66, zz));
    });
  }
  return g;
}

/* ---------- F. 抬高台地 + 上台阶道 + 栏板 ---------- */
function makeTerrace(z, H) {
  const g = new T.Group(); g.position.set(0, 0, z);
  g.add(box(52, H * 0.5, 36, M2.terraceDim, 0, H * 0.25, 0));
  g.add(box(46, H * 0.5, 30, M2.terrace, 0, H * 0.75, 0));
  g.add(box(46.2, 0.12, 30.2, M.stoneWhite, 0, H + 0.06, 0));
  // 分层石材线脚
  [H * 0.5, H].forEach(y => {
    g.add(box(52.3, 0.18, 36.3, M.stoneDark, 0, y - 0.08, 0));
    g.add(box(46.3, 0.16, 30.3, M.stoneDark, 0, y - 0.08, 0));
  });
  // 正面 12 级踏道（相对台地中心 +18 → +9.64；台地中心 -174 时即 z 从 -156 抬升到 -165）
  const steps = 12, rise = H / steps, run = 0.76;
  for (let k = 0; k < steps; k++) {
    const h = (k + 1) * rise;
    g.add(box(9.0, h, run + 0.04, M.stone, 0, h / 2, 18.0 - k * run));
    g.add(box(9.1, 0.08, run + 0.04, M.stoneWhite, 0, h, 18.0 - k * run));
  }
  // 台阶两侧斜栏板
  [-1, 1].forEach(s => {
    for (let k = 0; k < steps; k++) {
      const h = (k + 1) * rise;
      g.add(box(0.24, 0.72, run + 0.04, M.stoneWhite, s * 4.7, h + 0.36, 18.0 - k * run));
    }
  });
  // 台面望柱 / 栏板（前沿与两侧）
  for (let i = -10; i <= 10; i++) {
    g.add(box(0.20, 0.86, 0.20, M.stoneWhite, i * 2.2, H + 0.49, 15.0));
    if (i < 10) g.add(box(2.1, 0.34, 0.14, M.stone, i * 2.2 + 1.1, H + 0.32, 15.0));
  }
  [-1, 1].forEach(s => {
    for (let k = -6; k <= 6; k++) {
      g.add(box(0.20, 0.86, 0.20, M.stoneWhite, s * 22.6, H + 0.49, k * 2.3));
      if (k < 6) g.add(box(0.14, 0.34, 2.2, M.stone, s * 22.6, H + 0.32, k * 2.3 + 1.15));
    }
  });
  return g;
}

/* ---------- G. 轻量锥形松（院落 / 池畔 / 高台） ---------- */
function makePine(x, z, h, scale, baseY) {
  const g = new T.Group(); g.position.set(x, baseY || 0, z);
  const s = scale || 1;
  // 松柏不投影：俯瞰时避免细长阴影把院落切碎
  const trunk = cyl(0.11, 0.24, h * 0.92, M.trunk, 8, 0, h * 0.46, 0);
  trunk.castShadow = false; g.add(trunk);
  [[1.25, h * 0.36, h * 0.32], [1.00, h * 0.32, h * 0.58], [0.70, h * 0.28, h * 0.80]]
    .forEach(k => {
      const cone = makeMesh(new T.ConeGeometry(k[0] * s, k[1], 9), M2.pine, 0, k[2], 0);
      cone.castShadow = false; g.add(cone);
    });
  const leaf = new T.IcosahedronGeometry(1, 0);
  const im = new T.InstancedMesh(leaf, std(0xffffff, 1), 90);
  const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3();
  const col = new T.Color();
  for (let i = 0; i < 90; i++) {
    const t = rnd(), yy = h * (0.18 + t * 0.76);
    const rr = (1 - t) * 1.15 * s + 0.10, a = rnd() * 6.283;
    const rad = rr * (0.55 + 0.55 * rnd()), sz = (0.14 + rnd() * 0.16) * s;
    q.setFromEuler(new T.Euler(rnd(), rnd() * 6.28, rnd()));
    sc.set(sz, sz * 0.9, sz);
    m4.compose(v.set(Math.cos(a) * rad, yy, Math.sin(a) * rad), q, sc);
    im.setMatrixAt(i, m4);
    col.setHSL(0.28 + rnd() * 0.05, 0.30 + rnd() * 0.14, 0.13 + rnd() * 0.09);
    im.setColorAt(i, col);
  }
  im.castShadow = false; g.add(im);
  return g;
}

/* ---------- H. 组装 ---------- */
// H1. 中轴御道向后延伸（分段避开锦鲤池），仍挂在 ground 组以便 GLB 导出时保留
function axisRoad(z0, z1) {
  const len = Math.abs(z1 - z0), cz = (z0 + z1) / 2;
  const r = makeMesh(new T.PlaneGeometry(4.9, len),
    new T.MeshStandardMaterial({ map: paveRoad, color: 0xffffff, roughness: 1 }), 0, 0.014, cz, false);
  r.rotation.x = -Math.PI / 2; r.receiveShadow = true; ground.add(r);
  [-1, 1].forEach(sg => {
    const e = makeMesh(new T.PlaneGeometry(1.55, len),
      new T.MeshStandardMaterial({ map: paveEdge, color: 0xffffff, roughness: 1 }),
      sg * 3.25, 0.015, cz, false);
    e.rotation.x = -Math.PI / 2; e.receiveShadow = true; ground.add(e);
    ground.add(box(0.24, 0.07, len, M.stoneWhite, sg * 2.55, 0.035, cz, false));
    ground.add(box(0.24, 0.07, len, M.stoneWhite, sg * 4.06, 0.035, cz, false));
  });
}
axisRoad(6, window.__LAYOUT__.pondFront);   // 御道止于锦鲤池前岸（池前缘 -141.5）

// 中央庭院铺地：细石板，与外围粗网格区分（导出时仍在 ground 组内）
(function courtyardPaving() {
  const tex = paveCourt.clone(); tex.repeat.set(10, 34); tex.needsUpdate = true;
  const p = makeMesh(new T.PlaneGeometry(62, 202),
    new T.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1 }),
    0, 0.006, -101, false);
  p.rotation.x = -Math.PI / 2; p.receiveShadow = true; ground.add(p);
})();

// H1b. 前院丹墀：殿距拉到 44 后中庭同步加长，四边压条石收边
buildFrontCourtPaving();

/* ---------- H1c. Building：每座建筑封装为可独立扩展的对象 ----------
 * 目的：把“一栋殿宇”变成一等公民对象，后期功能扩展（新交互、动画、
 * 佛像/陈设建模、碰撞规则）都挂到实例上，不再靠全局遍历 id 字符串。
 * 约定：
 *   - group   该建筑的 THREE.Group（世界变换的载体）
 *   - parts   语义化子部件 { interior, cut(屋顶), ceiling, front }，来自 buildInterior
 *   - features 扩展功能注册表（Map<string, any>），addFeature 挂载、getFeature 读取
 *   - anchors  该殿室内锚点（佛像/蒲团/香炉…），来自 __INTERIOR__
 *   - bounds   该殿世界包围盒（碰撞/机位）
 * 所有实例集中到 window.__BUILDINGS__（Map<id, Building>），运行时可按需取用。
 * --------------------------------------------------------------------------- */
class Building {
  constructor({ id, name, kind, group, spec, baseY = 0, parts = null }) {
    this.id = id;
    this.name = name;
    this.kind = kind;               // 'axis' | 'side' | 'tower' 等，便于按类筛选
    this.group = group;             // THREE.Group
    this.spec = spec;               // 尺寸/布局参数（引用源对象，改它即可联动生成逻辑）
    this.baseY = baseY;
    this.features = new Map();      // 扩展功能插槽
    // 从几何注册表回查本殿的部件/碰撞盒/锚点（单一真源，不手写第二份）
    const REG = window.__INTERIOR__ || { boxes: [], anchors: [], roofs: {}, ceilings: {}, fronts: {} };
    this.bounds = REG.boxes.find(b => b.id === id) || null;
    this.parts = parts || {
      cut: REG.roofs[id] || null,
      ceiling: (REG.ceilings || {})[id] || null,
      front: (REG.fronts || {})[id] || null,
    };
    // 语义化标记：three.js 的 getObjectByName / traverse 可按 id 精确取到
    this.group.name = 'building:' + id;
    this.group.userData.buildingId = id;
    this.group.userData.buildingName = name;
    this.group.userData.kind = kind;
  }
  /** 挂载扩展功能；factory 可为值或 (building)=>value，返回所挂实例 */
  addFeature(key, factory) {
    if (this.features.has(key)) console.warn('[Building] 覆盖功能:', this.id, key);
    const inst = typeof factory === 'function' ? factory(this) : factory;
    this.features.set(key, inst);
    return inst;
  }
  getFeature(key) { return this.features.get(key); }
  /** 该殿室内锚点（佛像位 / 蒲团位 / 香炉位…），供后期佛像建模消费 */
  get anchors() {
    const REG = window.__INTERIOR__ || { anchors: [] };
    return REG.anchors.filter(a => a.hallId === this.id);
  }
  setVisible(v) { this.group.visible = !!v; return this; }
  get position() { return this.group.position; }
  get interior() { return this.bounds ? this.bounds.inner : null; }
}

const BUILDINGS = new Map();
window.__BUILDINGS__ = BUILDINGS;
function registerBuilding(opt) {
  const b = new Building(opt);
  BUILDINGS.set(b.id, b);
  return b;
}
/** 便捷读取：window.__BUILDING__('shijia') */
window.__BUILDING__ = (id) => BUILDINGS.get(id);

// H2. 中轴殿宇 → 先建模、再注册为 Building 实例（山门殿由 build.py 的 HALL_BLOCK 建好，group 变量 hall）
registerBuilding({ id: 'tianwang', name: '五凤山门', kind: 'axis',
  group: hall, spec: { W: 26.0, D: 13.5, H: 12.8, z: 0 }, baseY: 0 });
AXIS.halls.forEach(s => {
  const g = makeHall(s, 0, s.id);
  modelRoot.add(g);
  registerBuilding({ id: s.id, name: s.name, kind: 'axis', group: g, spec: s, baseY: 0 });
});

// H3. 四进四合院：依航拍图重排左右配殿，转角廊向内闭合
AXIS.courts.forEach((c, i) => {
  [[-1, c.left, 'l'], [1, c.right, 'r']].forEach(([side, name, tag]) => {
    const g = makeSideHall(c, side, name, 0, 'side_' + i + '_' + tag, true);
    modelRoot.add(g);
    registerBuilding({ id: 'side_' + i + '_' + tag, name, kind: 'side',
      group: g, spec: c, baseY: 0 });
  });
  // 转角廊贴着本进配殿内缘：配殿随中轴同步外扩后，转角廊中心 = 配殿中心 - 6.4，
  // 其外端搭在配殿台基上、内端退到中庭边，随各进 x 依次微收，保持四合院闭合。
  const cx = (c.x || AXIS.sideX) - 6.4;
  [c.mid - c.len / 2, c.mid + c.len / 2].forEach(z => {
    modelRoot.add(makeCrossLink(z, -1, 0, cx));
    modelRoot.add(makeCrossLink(z, 1, 0, cx));
  });
});

// H3b. 前院：左右两条中国式抄手廊 + 错台处横向连廊
[-1, 1].forEach(s => {
  modelRoot.add(makeFrontCloister(s));
  modelRoot.add(makeJunctionLink(s));
});

// H4. 观音堂前红墙院门 + 锦鲤池与跨池石桥（观音堂与凌霄阁之间）
modelRoot.add(makeRedWallGate(-110));  // 潮音堂(-88) 后、观音堂(-132) 之前的朱墙院门
modelRoot.add(makePond(AXIS.pondZ));
modelRoot.add(makeBridge(AXIS.pondZ));

// H5. 抬高台地 + 凌霄阁（二层平坐栏杆） + 台上两侧配院
modelRoot.add(makeTerrace(AXIS.terraceZ, AXIS.terraceY));
const LINGXIAO = { name: '凌霄閣', z: AXIS.lingxiaoZ, W: 28.0, D: 16.5, H: 12.4,
  two: true, gallery: true, rise: 3.60, pw: 4.5 };
const lxGroup = makeHall(LINGXIAO, AXIS.terraceY, 'lingxiao');
modelRoot.add(lxGroup);
registerBuilding({ id: 'lingxiao', name: '凌霄閣', kind: 'axis',
  group: lxGroup, spec: LINGXIAO, baseY: AXIS.terraceY });
// 台地台面仅 x∈[-23,23]，台上配院须保持 x=20.5，不随地面配殿外扩（否则悬空）
const topCourt = { mid: AXIS.lingxiaoZ, len: 12, x: 20.5 };
[[-1, '西配院', 'wenshu'], [1, '东配院', 'puxian']].forEach(([side, name, id]) => {
  const g = makeSideHall(topCourt, side, name, AXIS.terraceY, id);
  modelRoot.add(g);
  registerBuilding({ id, name, kind: 'side', group: g, spec: topCourt, baseY: AXIS.terraceY });
});
[topCourt.mid - topCourt.len / 2, topCourt.mid + topCourt.len / 2].forEach(z => {
  modelRoot.add(makeCrossLink(z, -1, AXIS.terraceY));
  modelRoot.add(makeCrossLink(z, 1, AXIS.terraceY));
});

// H5b. 航拍图标注的导览节点：各殿红底金字说明牌
SITE_PLAN.filter(s => s.sign).forEach(s => modelRoot.add(makeGuideSign(s)));

// H6. 对称松柏：院落四角、池畔、高台两侧
[
  // 庭院内侧：落在各进院落中部，避开两端转角廊与中轴殿宇屋檐
  // （配殿已连续成带，树不能再用原来的配殿间空档）
  [-11.6, -24.4], [11.6, -24.4],
  [-13.2, -91.2], [13.2, -91.2],
  [-13.2, -124.6], [13.2, -124.6],
  // 池畔与高台
  [-14.5, -143], [14.5, -143], [-14.5, -155], [14.5, -155],
  [-18.5, -165, AXIS.terraceY], [18.5, -165, AXIS.terraceY],
  // 外围林带（框景，不进 GLB：树挂在 natureRoot 下）
  [-35.5, -10], [35.5, -10], [-35.5, -40], [35.5, -40], [-32, -70], [32, -70],
  [-32, -100], [32, -100], [-32, -130], [32, -130], [-32, -165], [32, -165]
].forEach(p => natureRoot.add(makePine(p[0], p[1], 8.6 + rnd() * 2.2, 0.82, p[2] || 0)));

/* ---------- I. GLB 导出：展开实例 + 只导出建筑 ---------- */
function bakeInstances(root) {
  const swaps = [];
  root.traverse(o => {
    if (!o.isInstancedMesh) return;
    let p = o, hidden = false;
    while (p) { if (!p.visible) { hidden = true; break; } p = p.parent; }
    if (hidden) return;
    o.updateMatrix();
    const added = [], cache = new Map(), m = new T.Matrix4(), c = new T.Color();
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m);
      const mesh = new T.Mesh(o.geometry, o.material);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(o.matrix).multiply(m);
      mesh.castShadow = o.castShadow; mesh.receiveShadow = o.receiveShadow;
      if (o.instanceColor) {
        c.fromArray(o.instanceColor.array, i * 3);
        const key = c.getHexString();
        let mm = cache.get(key);
        if (!mm) { mm = o.material.clone(); mm.color.multiply(c); cache.set(key, mm); }
        mesh.material = mm;
      }
      o.parent.add(mesh); added.push(mesh);
    }
    o.visible = false;
    swaps.push({ o, added });
  });
  return function restore() {
    swaps.forEach(s => { s.added.forEach(m => m.parent.remove(m)); s.o.visible = true; });
  };
}
window.__EXPORT_GLB__ = async function () {
  const base = ground.children[0], treeVis = natureRoot.visible;
  // 导出前恢复所有剖视组，保证通用查看器里屋顶完整
  const REG = window.__INTERIOR__;
  if (REG) Object.keys(REG.roofs).forEach(k => { REG.roofs[k].visible = true; });
  base.visible = false; natureRoot.visible = false;
  const unbake = bakeInstances(modelRoot);
  try {
    const buf = await new GLTFExporter().parseAsync(modelRoot, { binary: true, onlyVisible: true, trs: true });
    return new Uint8Array(buf);
  } finally {
    unbake(); base.visible = true; natureRoot.visible = treeVis;
  }
};
