/* =========================================================================
 * 10.6 依《徑山寺遊覽全攻略》航拍标注图重新布局 + 殿宇内部空间
 *   中軸（由南向北）：請香處 → 進口 → 五鳳山門(1) → 釋迦寶殿(2) → 潮音堂(3)
 *                    → 觀音堂(5) → 錦鯉池 → 十二級踏道 → 凌霄閣(6，抬高 +6)
 *   左側：祖堂（抄經）→ 五觀堂（素麵）→ 藥師殿(4，健康延壽) → 西院 → 出口
 *   右側：東廡 → 客堂 → 龍王殿·財神殿(7，順風順水順財神) → 東院
 *   最前方山門題「五鳳山門」，內供彌勒、韋陀，兼天王殿之制；不再另設天王殿。
 *   每进院落由前后殿 + 左右配殿 + 四角转角廊向内围合成四合院，觀音堂前設紅牆院門。
 *   本次：中軸五殿改為「等距 44」—— 0 / -44 / -88 / -132 / -176，相鄰殿距全部拉齊；
 *   池、台地、凌霄閣整段後移 47，四進配殿同步拉長，沿縱深首尾相接、只留屋檐縫，
 *   兩側不留空地；御道 / 鋪地 / 抄手廊 / 導覽立牌 / 松柏 / 朱牆院門一併跟隨。
 *   前院（五鳳山門 ↔ 釋迦寶殿）：第一進左右配殿外移拓寬中庭，兩側各增一條
 *   「抄手廊」，廊兩端折入院內即止，內端止於 |x|≈14.6，绝不沿廊直抵殿門。
 *   兩側配殿依「龍王殿」照片重做兩層樓閣，配色沿用天王殿：深栗木構、米白牆、青灰瓦；
 *   一層金框墨底匾與黃色楹聯、密直棂格門、層層出跳鋪作，腰檐帶一排圓瓦當；
 *   二層整面密直棂格窗 + 方格橫披、窗下直接坐瓦檐，不設紅色平坐欄杆，上檐懸墨底金字匾。
 *   天王殿兩側連廊（抄手廊 / 轉角廊 / 錯台連廊）同步加高，柱頂 8.40、闌額、
 *   普拍方、鋪作與一層腰檐檐口 9.50 全部取同一標高 SONG，與配殿一層嚴格對齊。
 *   中軸主殿形制沿用山門殿：曲面瓦顶 / 举折反宇 / 飞檐翘角 / 白墙栗色木构 / 斗拱。
 *
 *   室内（参考韩国线上山寺 SANSA 木造法堂）：木地板 + 中央拜道 + 贴边柱网 + 藻井 +
 *   壁画背屏 + 金色主尊 + 供桌香炉莲花灯 + 木鱼念珠 + 成排灰色蒲团，行列按面积自适应。
 *   屋顶 / 天花 / 前墙归入「剖视组」，人物入殿时自动隐藏；锚点、碰撞盒、踏地高度
 *   均由几何产出并注册到 window.__INTERIOR__。
 *   window.__SITE_PLAN__ 为图上全部标注点（编号 / 名称 / 红字说明 / 世界坐标），
 *   运行时据此投影俯瞰导览标注，3D 侧据此生成红底金字导览立牌。
 * ========================================================================= */

/* ---------- A. 布局表（只改这里即可调整轴线与院落） ---------- */
const AXIS = {
  // 中軸五殿等距：五鳳山門(0) → 釋迦(-44) → 潮音(-88) → 觀音(-132) → 凌霄(-176)，
  // 相鄰殿距一律 44（原有 28/40/17/44 全部拉齊、整體進深由 129 擴到 176）。
  // 後段（池 / 台地 / 凌霄）保持原相對關係整體後移 47：池 = 觀音 -16、凌霄 = 池 -28、
  // 台地中心 = 凌霄 + 2，池後緣與台地前沿仍留 1.5 過渡。
  step: 44,
  halls: [
    { id: 'shijia',  name: '釋迦寶殿', z: -44,  W: 25.0, D: 12.6, H: 10.4, two: true,  rise: 3.20, pw: 4.8 },
    { id: 'chaoyin', name: '潮音堂',   z: -88,  W: 18.0, D: 9.8,  H: 8.8, two: false, rise: 1.95, pw: 3.4 },
    { id: 'guanyin', name: '觀音堂',   z: -132, W: 20.0, D: 10.8, H: 9.2, two: false, rise: 2.25, pw: 3.7 }
  ],
  pondZ: -148,     // 觀音 -16；池後緣 -154.5 與台地前沿 -156 留 1.5
  terraceZ: -174,  // 凌霄 -176 + 2
  terraceY: 6,
  lingxiaoZ: -176,
  sideX: 20.5,
  // 四進配殿隨殿距拉長：每進 32.8、段距 33.4，相鄰僅 0.6 屋檐縫，
  // 從山門後 -8 一直綿延到池前緣 -141.5，兩側不留空地。
  courts: [
    // 前院一進整体外移：中庭净宽由 ±15.3 扩到 ±20.3；其余三进保持 20.5
    { mid: -24.4,  len: 32.8, x: 25.5, left: '祖堂',   right: '東廡' },
    { mid: -57.8,  len: 32.8, left: '五觀堂', right: '客堂' },
    { mid: -91.2,  len: 32.8, left: '藥師殿', right: '龍王殿·財神殿' },
    { mid: -124.6, len: 32.8, left: '西院',   right: '東院' }
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

/* 前院（五鳳山門 ↔ 釋迦寶殿）抄手廊：外移配殿 + 廊廡一并加大中庭。
 * 全部廊段都在 |x| ≥ 14.6，中央御道（|x| < 4.1）是唯一通往殿门的直路；
 * 廊两端与山门后墙、释迦月台踏道均留空隙，不接门。 */
const FRONT_COURT = {
  crossX: 18.1,   // 前院转角廊中心 |x|，内端 14.7（原 10.7，不再挤占中庭）
  laneX: 18.6,    // 抄手廊纵廊中心 |x|：外缘 20.0，恰在配殿出檐 20.3 之内
  laneW: 2.8,     // 廊宽
  z0: -10.7,      // 纵廊前端：接前院转角廊后缘，距山门后墙 3.5
  z1: -33.0,      // 纵廊后端：殿距由 28 拉到 44，随释迦前移 16，仍不接殿门
  turn: 2.6,      // 后端向内折的横廊长度，内端止于 |x| = 14.6
  linkZ: -41.1    // 第一进外移与第二进的错台处，加一段横向连廊接回
};

/* ---------- A3. 两侧两层楼阁：沿用天王殿配色（深栗木 / 米白墙 / 青灰瓦） ---
 * 依实景照片「龍王殿」重做立面，不再用丹粉朱饰：
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

/** 金框墨底金字横匾：照片中一层「龍王殿」匾，从右往左题字 */
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
  { id: 'qingxiang', name: '請香處', note: '入寺前請香', x: 0, y: 4.6, z: 32, guide: true,
    sign: [4.8, 32, 0, 0] },
  { id: 'entrance', name: '進口', note: '由此入寺', x: -9, y: 5.4, z: 24, guide: true },
  { id: 'exit', name: '出口', note: '禮畢由此出', x: -30, y: 5.4, z: -59, guide: true },
  { id: 'wufeng', name: '五鳳山門', note: '韋陀 · 出行平安|彌勒 · 平安喜樂',
    no: 1, x: 0, y: 11.0, z: 0, sign: [9.8, 5.6, 0, 0] },
  { id: 'zutang', name: '祖堂', note: '抄經', x: -25.5, y: 13.0, z: -24.4, guide: true,
    sign: [-11.8, -24.4, 0, Math.PI / 2] },
  { id: 'shijia', name: '釋迦寶殿', note: '釋迦摩尼 · 萬事可求|普賢 · 事業|文殊 · 學業',
    no: 2, x: 0, y: 12.4, z: -44, sign: [10.8, -37.2, 0, 0] },
  { id: 'wuguantang', name: '五觀堂', note: '素麵', x: -20.5, y: 13.0, z: -57.8, guide: true,
    sign: [-14.2, -57.8, 0, Math.PI / 2] },
  { id: 'chaoyin', name: '潮音堂', note: '文化傳播 · 展覽', no: 3,
    x: 0, y: 9.4, z: -88, sign: [9.2, -82.6, 0, 0] },
  { id: 'yaoshi', name: '藥師殿', note: '健康延壽', no: 4, x: -20.5, y: 13.0, z: -91.2, guide: true,
    sign: [-14.2, -91.2, 0, Math.PI / 2] },
  { id: 'longwang', name: '龍王殿·財神殿', note: '順風順水順財神', no: 7,
    x: 20.5, y: 13.0, z: -91.2, guide: true, sign: [14.2, -91.2, 0, -Math.PI / 2] },
  { id: 'guanyin', name: '觀音堂', note: '姻緣求子', no: 5,
    x: 0, y: 9.8, z: -132, sign: [9.6, -126.4, 0, 0] },
  { id: 'koi', name: '錦鯉池', note: '觀音堂與凌霄閣之間',
    x: 0, y: 1.6, z: -148, guide: true },
  { id: 'lingxiao', name: '凌霄閣', note: '諸事順遂', no: 6,
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

/** 木石牌坊：进口 / 出口；匾额沿用传统右读排版 */
function makePailou(name, x, z, rotY) {
  const g = new T.Group();
  g.position.set(x, 0, z); g.rotation.y = rotY || 0;
  const W = 6.2;
  [-W / 2, W / 2].forEach(px => {
    g.add(box(0.92, 0.50, 0.92, M.stoneDark, px, 0.25, 0));
    g.add(box(0.44, 4.9, 0.44, M.woodMid, px, 2.95, 0));
    g.add(cyl(0.30, 0.30, 0.12, M.stoneWhite, 10, px, 0.56, 0));
  });
  g.add(box(W + 1.2, 0.42, 0.62, M.woodDark, 0, 4.62, 0));
  g.add(box(W + 0.8, 0.24, 0.50, M.woodMid, 0, 5.08, 0));
  g.add(box(3.35, 1.08, 0.12, M.woodDark, 0, 4.62, 0.30));
  g.add(panel(3.15, 0.92, plaqueMaterial(name, { size: 84 }), 0, 4.62, 0.38));
  g.add(makeRoof(W + 2.1, 2.7, 5.42, 0.95,
    { corner: 0.34, ridgeHalf: 1.55, curve: 1.20, seg: 14, beasts: false, finial: false }));
  return g;
}

/** 请香处：四柱小亭 + 三足香炉 + 竖匾，置于山门之前 */
function makeIncensePavilion(x, z) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.add(box(5.4, 0.42, 5.4, M.stoneDark, 0, 0.21, 0));
  g.add(box(5.5, 0.10, 5.5, M.stoneWhite, 0, 0.47, 0));
  [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]].forEach(p => {
    g.add(cyl(0.19, 0.22, 3.5, M.wood, 10, p[0], 2.22, p[1]));
    g.add(cyl(0.28, 0.28, 0.12, M.stoneDark, 10, p[0], 0.58, p[1]));
  });
  g.add(box(4.6, 0.26, 4.6, M.woodDark, 0, 3.90, 0));
  g.add(makeRoof(6.2, 6.2, 4.04, 1.45,
    { corner: 0.55, ridgeHalf: 1.10, curve: 1.35, seg: 18, beasts: false, finial: true }));
  // 三足香炉
  g.add(cyl(0.72, 0.62, 0.78, M2.bronze, 16, 0, 1.00, 0));
  g.add(cyl(0.86, 0.72, 0.14, M2.bronze, 16, 0, 1.44, 0));
  [-1, 0, 1].forEach(i => g.add(cyl(0.075, 0.075, 0.52, M.woodDark, 6,
    Math.cos(i * 2.094) * 0.52, 0.75, Math.sin(i * 2.094) * 0.52)));
  // 香枝三缕
  [-0.22, 0, 0.22].forEach(dx => g.add(cyl(0.018, 0.018, 0.86, M2.incense, 5, dx, 1.92, 0)));
  // 竖匾朝南，挂在前檐之外，避免俯瞰时被屋面遮住
  g.add(box(0.86, 2.05, 0.12, M.woodDark, 0, 2.90, 3.30));
  g.add(panel(0.72, 1.90, plaqueMaterial('請香處', { vertical: true, size: 46 }), 0, 2.90, 3.38));
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
 * 本函数也会在「基线山门殿」代码块中被调用（此时本扩展的 const 尚未初始化），
 * 因此只依赖基线已定义的 T / box / cyl / makeMesh 与 window 注册表。
 *
 * 产出（window.__INTERIOR__）：
 *   boxes   —— 建筑世界包围盒、墙体矩形、室内区域；运行时的碰撞 / 踏地 / 剖视唯一真源
 *   roofs   —— hallId → 剖视组（屋顶 + 天花 + 前墙），人物入殿时隐藏
 *   anchors —— 预留锚点 statue / altar / incense / cushion，供后续佛像蒲团交互挂载
 * ------------------------------------------------------------------------- */
function buildInterior(group, spec, id, baseY) {
  const REG = window.__INTERIOR__ ||
    (window.__INTERIOR__ = { boxes: [], roofs: {}, anchors: [] });
  const IM = window.__INTERIOR_MAT__ || (window.__INTERIOR_MAT__ = (() => {
    const mk = (c, e, r, m) => new T.MeshStandardMaterial({
      color: c, roughness: r === undefined ? 0.92 : r, metalness: m || 0,
      emissive: e || 0x000000, emissiveIntensity: 0.38,
    });
    // 法堂背屏壁画：赭底金光 + 莲瓣 + 云气，程序化 canvas 一次生成、全寺复用
    const muralTex = canvasTex(512, 384, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#5b3224'); bg.addColorStop(1, '#2a1812');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.46;
      [148, 122, 96, 70].forEach((r, i) => {
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
        g.strokeStyle = i % 2 ? 'rgba(226,183,92,.55)' : 'rgba(247,214,140,.75)';
        g.lineWidth = i % 2 ? 3 : 6; g.stroke();
      });
      for (let i = 0; i < 20; i++) {
        const a = i * Math.PI / 10;
        g.save(); g.translate(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96);
        g.rotate(a + Math.PI / 2);
        g.beginPath(); g.ellipse(0, 0, 13, 34, 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(224,178,96,.42)'; g.fill();
        g.restore();
      }
      g.strokeStyle = 'rgba(232,196,124,.34)'; g.lineWidth = 3;
      for (let k = 0; k < 4; k++) {
        const yy = 46 + k * 94;
        g.beginPath(); g.moveTo(0, yy);
        g.bezierCurveTo(w * 0.24, yy - 30, w * 0.34, yy + 34, w * 0.5, yy + 4);
        g.bezierCurveTo(w * 0.66, yy - 26, w * 0.78, yy + 30, w, yy);
        g.stroke();
      }
      g.strokeStyle = '#b18a45'; g.lineWidth = 9; g.strokeRect(9, 9, w - 18, h - 18);
      g.strokeStyle = 'rgba(247,214,140,.5)'; g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44);
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
      cushion:  mk(0x8e8a83, 0x1a1815), cushionEdge: mk(0x6d6a66, 0x141210),
      mat:      mk(0xb6a184, 0x2d2213), bead: mk(0x6a3a24, 0x1a0d08),
      lamp:     new T.MeshStandardMaterial({ color: 0xffd9a0, roughness: 0.5, metalness: 0, emissive: 0xffb347, emissiveIntensity: 0.85 }),
      mural:    new T.MeshStandardMaterial({ map: muralTex, color: 0xffffff, roughness: 0.88, emissive: 0x3a1e0e, emissiveIntensity: 0.3 }),
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
  const cut = new T.Group();   group.add(cut);   // 剖视组：屋顶 / 天花 / 前墙
  cut.userData.cutaway = id;
  REG.roofs[id] = cut;

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
  const winN = 2;
  [-1, 1].forEach(s => {
    const wx = s * (innerW / 2 - 0.06);
    for (let i = 0; i < winN; i++) {
      const wz = zB + (i + 0.5) * innerD / winN;
      const ww = Math.min(1.75, innerD / winN * 0.74);
      addBox(0.05, 1.85, ww, IM.screen, wx, F + 1.62, wz);
      addBox(0.07, 0.055, ww, IM.trim, wx - s * 0.04, F + 1.62, wz);
    }
  });

  // 3) 柱网贴两侧布置：两列三排，中央完全让出拜道（法堂式大空间）
  const colH = Math.max(2.6, H - 0.5);
  [-W * 0.42, W * 0.42].forEach(cx => {
    [zB + innerD * 0.20, zB + innerD * 0.54, zF - innerD * 0.16].forEach(cz => {
      addBox(0.60, 0.14, 0.60, IM.base, cx, F + 0.07, cz);
      addCyl(0.18, 0.21, colH, IM.column, 10, cx, F + colH / 2 + 0.12, cz);
      addBox(0.62, 0.18, 0.62, IM.beam, cx, F + colH + 0.20, cz);
    });
    addBox(0.22, 0.26, innerD * 0.92, IM.wood, cx, F + colH + 0.28, innerCZ);
  });

  // 4) 天花梁架 + 中心藻井（归入剖视组，入殿后隐藏以便俯看室内）
  const ceilY = spec.ceilingY !== undefined ? spec.ceilingY : top + H - 0.30;
  for (let i = -3; i <= 3; i++)
    addBox(W - 0.9, 0.16, 0.20, IM.beam, 0, ceilY, zB + (i + 3) * innerD / 6, cut);
  [-W * 0.30, 0, W * 0.30].forEach(x =>
    addBox(0.20, 0.18, innerD, IM.beam, x, ceilY + 0.13, innerCZ, cut));
  const cw = Math.min(4.4, W * 0.30), cd = Math.min(4.4, innerD * 0.62);
  addBox(cw + 0.5, 0.12, cd + 0.5, IM.wood, 0, ceilY - 0.16, innerCZ, cut);
  addCyl(cw * 0.42, cw * 0.42, 0.10, IM.trim, 8, 0, ceilY - 0.25, innerCZ, cut);
  addCyl(0.55, 0.55, 0.05, IM.goldLight, 24, 0, ceilY - 0.34, innerCZ, cut);

  // 5) 后部佛坛（须弥座）+ 大幅壁画背屏 + 金色主尊：法堂视觉中心
  const az = zB + Math.min(1.55, innerD * 0.22);
  const aw = Math.min(W * 0.60, 15.0);
  const by = F + 0.64;                       // 佛坛顶面
  addBox(aw + 1.0, 0.20, 2.6, IM.altar, 0, F + 0.10, az);
  addBox(aw + 0.4, 0.34, 2.3, IM.altar, 0, F + 0.37, az);
  addBox(aw + 0.6, 0.10, 2.5, IM.altarTop, 0, F + 0.59, az);
  const sw = Math.min(aw * 0.94, W * 0.62);
  const sh = Math.min(Math.max(3.0, H * 0.62), 5.4);
  const sy = F + 0.45 + sh / 2;
  addBox(sw + 0.30, sh + 0.30, 0.20, IM.trim, 0, sy, zB + 0.26);
  add(new T.PlaneGeometry(sw, sh), IM.mural, 0, sy, zB + 0.38);
  addBox(sw + 0.46, 0.14, 0.34, IM.trim, 0, sy + sh / 2 + 0.10, zB + 0.40);
  addBox(sw + 0.46, 0.14, 0.34, IM.trim, 0, sy - sh / 2 - 0.10, zB + 0.40);
  [-sw / 2 - 0.12, sw / 2 + 0.12].forEach(x =>
    addBox(0.14, sh + 0.30, 0.34, IM.trim, x, sy, zB + 0.40));
  // 立体圆光（壁画前、主尊后）
  const haloY = Math.min(sy + sh * 0.20, by + 2.05);
  add(new T.TorusGeometry(1.35, 0.09, 8, 28), IM.gold, 0, haloY, zB + 0.58);
  add(new T.CircleGeometry(1.28, 28), IM.goldLight, 0, haloY, zB + 0.54);
  // 金色坐佛：莲座 → 盘腿 → 身 → 手 → 头 → 肉髻，面向殿门（+Z）
  const sz = az - 0.40;
  addCyl(1.12, 1.28, 0.24, IM.gold, 16, 0, by + 0.12, sz);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const petal = add(new T.SphereGeometry(0.34, 6, 4), IM.goldLight,
      Math.cos(a) * 1.12, by + 0.32, sz + Math.sin(a) * 1.12);
    petal.scale.set(1, 0.32, 0.58);
  }
  addCyl(0.92, 1.02, 0.18, IM.gold, 14, 0, by + 0.44, sz);
  const legs = add(new T.SphereGeometry(0.96, 10, 6), IM.gold, 0, by + 0.66, sz + 0.14);
  legs.scale.set(1.18, 0.42, 0.82);
  const torso = add(new T.SphereGeometry(0.80, 12, 8), IM.gold, 0, by + 1.30, sz);
  torso.scale.set(1, 1.02, 0.66);
  const hands = add(new T.SphereGeometry(0.30, 8, 6), IM.goldLight, 0, by + 1.08, sz + 0.58);
  hands.scale.set(1.20, 0.48, 0.65);
  add(new T.SphereGeometry(0.46, 12, 8), IM.gold, 0, by + 2.10, sz);
  add(new T.SphereGeometry(0.21, 8, 6), IM.goldLight, 0, by + 2.50, sz);
  [-1, 1].forEach(s => {
    const ear = add(new T.SphereGeometry(0.16, 6, 4), IM.gold, s * 0.46, by + 2.05, sz + 0.02);
    ear.scale.set(0.5, 1.3, 0.6);
  });

  // 6) 供桌 / 香炉 / 莲花灯
  const tz = Math.min(az + 1.75, zF - 1.0);
  const tw = Math.min(aw * 0.72, 8.2);
  addBox(tw, 0.16, 0.90, IM.wood, 0, F + 0.78, tz);
  [-1, 1].forEach(s =>
    addBox(0.16, 0.72, 0.16, IM.wood, s * (tw / 2 - 0.22), F + 0.40, tz));
  addCyl(0.40, 0.34, 0.34, IM.bronze, 14, 0, F + 1.03, tz);
  addRing(0.42, 0.05, IM.gold, 0, F + 1.21, tz);
  [-1, 1].forEach(s => {
    const lx = s * (tw / 2 - 0.95);
    addCyl(0.09, 0.13, 0.55, IM.bronze, 10, lx, F + 1.05, tz);
    add(new T.SphereGeometry(0.21, 8, 6), IM.lamp, lx, F + 1.42, tz);
  });

  // 7) 侧案：木鱼 + 念珠（参考韩国山寺法堂的两件静心器物）
  const sideZ = zB + innerD * 0.66;
  const sideX = innerW / 2 - 1.15;
  [-1, 1].forEach(s => {
    const sx = s * sideX;
    addBox(1.5, 0.12, 0.90, IM.wood, sx, F + 0.72, sideZ);
    addBox(0.10, 0.66, 0.10, IM.wood, sx - 0.55, F + 0.39, sideZ);
    addBox(0.10, 0.66, 0.10, IM.wood, sx + 0.55, F + 0.39, sideZ);
  });
  const mok = add(new T.SphereGeometry(0.40, 10, 8), IM.bead, -sideX, F + 1.00, sideZ);
  mok.scale.set(1.10, 0.78, 0.90);
  addBox(0.42, 0.09, 0.07, IM.screen, -sideX, F + 1.00, sideZ + 0.37);
  const stick = addCyl(0.045, 0.045, 0.62, IM.wood, 8, -sideX + 0.60, F + 1.02, sideZ);
  stick.rotation.z = Math.PI / 2;
  addRing(0.34, 0.035, IM.bead, sideX, F + 0.84, sideZ);
  add(new T.SphereGeometry(0.11, 8, 6), IM.goldLight, sideX, F + 0.84, sideZ + 0.34);

  // 8) 成排灰色蒲团：按内室面积自适应行列，中央留拜道（法堂容量扩容）
  const seatEnd = zF - 0.55;
  const span = Math.max(0, seatEnd - (tz + 1.05));
  const rows = Math.max(1, Math.min(grand ? 5 : 3, Math.floor(span / 1.55) + 1));
  const rowGap = rows > 1 ? Math.min(1.62, span / (rows - 1)) : 0;
  const cols = Math.max(3, Math.min(grand ? 11 : 7, Math.floor((innerW - 1.5) / 1.6) + 1));
  const colGap = Math.min(1.62, (innerW - 1.5) / Math.max(1, cols - 1));
  const seats = [];
  for (let r = 0; r < rows; r++) {
    const pz = seatEnd - r * rowGap;
    for (let c = 0; c < cols; c++) {
      const dx = (c - (cols - 1) / 2) * colGap;
      if (Math.abs(dx) < 1.05) continue;                  // 中央拜道
      if (Math.abs(dx) + 0.56 > innerW / 2 - 0.2) continue;
      seats.push({ dx, pz });
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
    instSeats(new T.BoxGeometry(1.04, 0.045, 1.04), IM.mat, F + 0.03);
    instSeats(new T.CylinderGeometry(0.50, 0.52, 0.16, 12), IM.cushion, F + 0.13);
  }

  // 9) 锚点注册（世界坐标，含高台 baseY 偏移；蒲团附朝向与座号）
  REG.anchors.push(
    { hallId: id, kind: 'altar',   ...world(0, by, az) },
    { hallId: id, kind: 'statue',  ...world(0, by, sz) },
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
  [-half + 0.25, half - 0.25].forEach(x =>
    rects.push({ x, z: (frontZ + backZ) / 2, w: 0.6, d: frontZ - backZ }));

  const body = toAABB(0, (spec.bodyFront + spec.bodyBack) / 2,
    W + 0.6, spec.bodyFront - spec.bodyBack);
  REG.boxes.push({
    id,
    x: (body.x0 + body.x1) / 2, z: (body.z0 + body.z1) / 2,
    width: body.x1 - body.x0, depth: body.z1 - body.z0,
    baseY, floorY: baseY + F,
    walls: rects.map(r => toAABB(r.x, r.z, r.w, r.d)),
    inner: toAABB(0, innerCZ, innerW, innerD),
  });
  return { cut, inner };
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
  IT.cut.add(frontWall);   // 入殿剖视时隐藏前墙，避免挡住室内
  doors.forEach(d => {
    if (!d.open) {
      const sh = archShape(d.x, d.w - 0.06, d.h - 0.03);
      const dk = new T.ShapeGeometry(sh, 16); remapShapeUV(dk, d.w, d.h);
      IT.cut.add(makeMesh(dk, M.ink, 0, top, wallZ + 0.47, false));
      const lat = new T.ShapeGeometry(sh, 16); remapShapeUV(lat, d.w, d.h);
      const lm = M.lattice.clone();
      lm.map = latticeTex.clone(); lm.map.repeat.set(2.0, 2.4); lm.map.needsUpdate = true;
      IT.cut.add(makeMesh(lat, lm, 0, top, wallZ + 0.49, false));
    }
    const pts = archOutline(d.x, d.w + 0.06, d.h + 0.03)
      .map(p => new T.Vector3(p[0], p[1] + top, wallZ + 0.55));
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 40, 0.075, 6, true), M.woodDark));
  });

  // 侧墙 / 后墙（后墙开中央券门，贯通中轴御道）
  g.add(box(0.5, H, D, M.wallShade, -W / 2 - 0.2, top + H / 2, 0));
  g.add(box(0.5, H, D, M.wallShade, W / 2 + 0.2, top + H / 2, 0));
  g.add(makeDoorWall(W, H, 3.0, doorH + 0.20, top, backZ, M.wallShade, 0.5));

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
  IT.cut.add(makeRoof(rw, rd, top + H + 0.22, lowerRise,
    { corner: 0.62, ridgeHalf: (rw - rd) / 2 - 0.30, curve: 1.45, seg: 20, beasts: false }));

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
    // 「阁」形制：上层外挑平坐 + 一圈木栏杆（凌霄阁专用）
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
    IT.cut.add(makeRoof(rw2, rd2, ub + 3.10, s.rise,
      { corner: 0.58, ridgeHalf: (rw2 - rd2) / 2 - 0.35, curve: 1.5, seg: 24, beasts: true }));
  }
  return g;
}

/* ---------- C. 两侧配殿：按龍王殿照片重做的两层楼阁 ---------------------
 * 下层层高加高、上层仅四成且收分；深栗木柱与铺作、米白墙、青灰筒瓦。
 * 一层：密直棂格门 / 金框墨底匾 / 黄色楹联 / 柱头 + 补间密铺作；
 * 腰檐：一排圆瓦当；二层窗直接落在瓦檐上，照片里没有平坐栏杆，故不设勾栏；
 * 上层：整面密直棂格窗 + 方格横披、深栗柱分间、上檐下悬墨底金字匾。 */
function makeSideHall(court, side, name, baseY, id, deep) {
  const g = new T.Group();
  g.position.set(side * (court.x || AXIS.sideX), baseY || 0, court.mid);
  g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const W = court.len, D = deep ? 8.0 : 6.4;
  const top = 0.70, F = SONG.podium;
  const H1 = SONG.colTop - top - 0.10;   // 7.60：下檐柱顶抬到 8.40 標高
  const wallZ = D / 2 - 0.30, backZ = -D / 2 + 0.15;
  const doorHalf = 1.05;

  const IT = buildInterior(g, {
    W, H: H1, top, floorY: F,
    frontWallZ: wallZ, backWallZ: backZ, doorHalf,
    backDoor: false, bodyFront: D / 2 + 0.8, bodyBack: -D / 2 - 0.8,
    ceilingY: SONG.colTop - 0.70,
  }, id, baseY || 0);

  // 台基 + 天王殿配色：米白墙、深栗木构，前墙开中央门贯通庭院
  g.add(box(W + 1.6, 0.70, D + 1.6, M.stoneDark, 0, 0.35, 0));
  g.add(box(W + 1.8, 0.12, D + 1.8, M.stoneWhite, 0, 0.70, 0));
  IT.cut.add(makeDoorWall(W, H1, 2.1, H1 * 0.70, top, wallZ, SM.wall, 0.30));
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
    0, SONG.colTop + SONG.lintel + SONG.pupai / 2, D / 2));   // 普拍方兩端出頭
  songBracketSet(g, spots, SONG.eave1, SONG.bracketScale);

  // 一层金框墨底匾（照片中「龍王殿」）：挑出到腰檐前沿之下，避免被瓦檐遮住
  const longName = name.length > 4;
  const pw2 = longName ? 4.6 : 3.2;
  const py = SONG.colTop - 0.85, pz = D / 2 + 0.92;
  g.add(box(pw2 + 0.28, 1.16, 0.16, SM.columnDim, 0, py, pz - 0.10));
  g.add(panel(pw2, 1.00,
    goldPlaque(name, { w: longName ? 1024 : 768, h: 240, size: longName ? 92 : 128 }),
    0, py, pz));
  [-1, 1].forEach(s =>   // 匾上两根吊杆，挂在阑额下
    g.add(box(0.06, 0.42, 0.06, SM.lattice, s * pw2 * 0.34, py + 0.76, pz - 0.06)));
  const couplets = ['佛光普照三千界', '法雨均霑萬億心'];
  [-1, 1].forEach((s, k) => {
    const cx = s * 2.06;
    g.add(box(0.54, 4.34, 0.12, SM.columnDim, cx, F + 2.90, D / 2 + 0.14));
    g.add(panel(0.44, 4.20, coupletMat(couplets[k]), cx, F + 2.90, D / 2 + 0.22));
  });

  // 一层腰檐：青灰筒瓦 + 前檐一排圆瓦当；入殿剖视时一并隐藏
  IT.cut.add(songRoof(W + 2.6, D + 2.8, SONG.eave1, SONG.waistRise,
    { corner: 0.26, curve: 1.22, seg: 16 }));
  eaveTileRow(IT.cut, W + 2.5, SONG.eave1 - 0.08, D / 2 + 1.40);

  /* 二层：腰檐瓦之上直接起密直棂格窗，不设平坐勾欄（照片中无红色栏杆） */
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
  const uw = 3.6;   // 照片里上层另题四字吉语「神應靈澤」，与一层殿名匾区分
  upper.add(box(uw + 0.18, 0.90, 0.12, SM.columnDim, 0, SONG.eave2 - 0.92, D2 / 2 + 0.30));
  upper.add(panel(uw, 0.78, plaqueMaterial('神應靈澤', { size: 88 }),
    0, SONG.eave2 - 0.92, D2 / 2 + 0.38));
  IT.cut.add(songRoof(W2 + 2.8, D2 + 3.0, SONG.eave2, SONG.roofRise,
    { corner: 0.34, curve: 1.28, seg: 18 }));
  eaveTileRow(IT.cut, W2 + 2.7, SONG.eave2 - 0.08, D2 / 2 + 1.48);
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
  g.add(songRoof(L + 1.0, 3.8, SONG.eave1, 0.82,
    { corner: 0.24, curve: 1.22, seg: 14 }));
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
  g.add(songRoof(len + 1.0, width + 1.0, SONG.eave1, 0.78,
    { corner: 0.26, curve: 1.22, seg: 16 }));
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
 *  整体呈「ㄈ」字开口朝中庭。两端均不接山门、不接释迦宝殿，内端止于 |x| = 14.6，
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
  bay.position.set(side * 23.4, 0, FRONT_COURT.linkZ);
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
(function frontCourtPaving() {
  const cz = -21.5, len = 31.2;
  const tex = paveCourt.clone(); tex.repeat.set(10, 8); tex.needsUpdate = true;
  const p = makeMesh(new T.PlaneGeometry(42.4, len),
    new T.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1 }),
    0, 0.010, cz, false);
  p.rotation.x = -Math.PI / 2; p.receiveShadow = true; ground.add(p);
  [-21.2, 21.2].forEach(x =>
    ground.add(box(0.30, 0.09, len + 0.4, M.stoneWhite, x, 0.045, cz, false)));
  [-5.9, -37.1].forEach(z =>
    ground.add(box(42.4, 0.09, 0.30, M.stoneWhite, 0, 0.045, z, false)));
})();

// H2. 中轴三殿（最前方「五鳳山門」由基线场景构建）
AXIS.halls.forEach(s => modelRoot.add(makeHall(s, 0, s.id)));

// H3. 四进四合院：依航拍图重排左右配殿，转角廊向内闭合
AXIS.courts.forEach((c, i) => {
  modelRoot.add(makeSideHall(c, -1, c.left, 0, 'side_' + i + '_l', true));
  modelRoot.add(makeSideHall(c, 1, c.right, 0, 'side_' + i + '_r', true));
  // 前院一进配殿外移后，转角廊同步外移，其内端从 10.7 退到 14.7，中庭不再被挤窄
  const cx = c.x ? FRONT_COURT.crossX : 14.1;
  [c.mid - c.len / 2, c.mid + c.len / 2].forEach(z => {
    modelRoot.add(makeCrossLink(z, -1, 0, cx));
    modelRoot.add(makeCrossLink(z, 1, 0, cx));
  });
});

// H3b. 前院：左右两条中國式抄手廊 + 错台处横向连廊
[-1, 1].forEach(s => {
  modelRoot.add(makeFrontCloister(s));
  modelRoot.add(makeJunctionLink(s));
});

// H4. 观音堂前红墙院门 + 锦鲤池与跨池石桥（观音堂与凌霄阁之间）
modelRoot.add(makeRedWallGate(-110));  // 潮音堂(-88) 後、觀音堂(-132) 之前的朱牆院門
modelRoot.add(makePond(AXIS.pondZ));
modelRoot.add(makeBridge(AXIS.pondZ));

// H5. 抬高台地 + 凌霄阁（二层平坐栏杆） + 台上两侧配院
modelRoot.add(makeTerrace(AXIS.terraceZ, AXIS.terraceY));
const LINGXIAO = { name: '凌霄閣', z: AXIS.lingxiaoZ, W: 23.0, D: 11.6, H: 10.4,
  two: true, gallery: true, rise: 3.45, pw: 4.5 };
modelRoot.add(makeHall(LINGXIAO, AXIS.terraceY, 'lingxiao'));
const topCourt = { mid: AXIS.lingxiaoZ, len: 12 };
modelRoot.add(makeSideHall(topCourt, -1, '西配院', AXIS.terraceY, 'wenshu'));
modelRoot.add(makeSideHall(topCourt, 1, '東配院', AXIS.terraceY, 'puxian'));
[topCourt.mid - topCourt.len / 2, topCourt.mid + topCourt.len / 2].forEach(z => {
  modelRoot.add(makeCrossLink(z, -1, AXIS.terraceY));
  modelRoot.add(makeCrossLink(z, 1, AXIS.terraceY));
});

// H5b. 航拍图标注的导览节点：请香处香亭、进口 / 出口牌坊、各殿红底金字说明牌
modelRoot.add(makeIncensePavilion(0, 32));
modelRoot.add(makePailou('進口', -9, 24, 0));
modelRoot.add(makePailou('出口', -30, -59, -Math.PI / 2));
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
