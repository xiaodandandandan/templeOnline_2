/**
 * 中轴殿宇领域模型，依《径山寺游览全攻略》航拍标注图重排。
 * 最前方山门题“五凤山门”，内供弥勒、韦陀，兼天王殿之制，不再另设天王殿。
 * 坐标必须与 three.js 运行时 scripts/bridge-runtime.js 的 HALLS 表保持一致：
 * 五凤山门(0) → 释迦宝殿(-44) → 潮音堂(-88) → 观音堂(-132)
 * → 锦鲤池(-148) → 抬高台地(-174) → 凌霄阁(-176, +6)。
 * 中轴五殿相邻殿距一律 44，四进配殿随之拉长成带，两侧不留空地；
 * 池 / 台地 / 凌霄后段保持原相对关系整体后移 47。
 * 两侧配殿依照片重做两层楼阁并沿用天王殿配色：深栗木构、米白墙、青灰瓦，
 * 一层墙高 7.60、二层柱高 3.00、一层腰檐檐口 9.50；上层密直棂窗、无红色栏杆
 * 与加高后的两侧连廊共用同一 SONG 标高；台上西 / 东配院同制，局部总高约 16.3。
 * 图上其余标注点（请香处 / 进口 / 出口 / 祖堂 / 五观堂 / 药师殿 /
 * 龙王殿·财神殿 / 锦鲤池）由 3D 侧 window.__SITE_PLAN__ 下发，避免两份几何真源。
 */
export type HallId =
  | 'tianwang'
  | 'shijia'
  | 'chaoyin'
  | 'guanyin'
  | 'lingxiao'
  | 'wenshu'
  | 'puxian'

/** 3D 运行时支持的机位（人物模式下由第三人称相机接管） */
export type ViewKey = 'front' | 'angle' | 'top' | 'axis' | 'pond' | 'close'

/** 运行时模式 */
export type SceneMode = 'thirdPerson' | 'orbit'

/** 殿宇在场景中的包围盒（用于射线拾取、碰撞与聚焦机位计算） */
export interface HallBox {
  x: number
  z: number
  baseY: number
  width: number
  depth: number
  height: number
}

export interface Hall {
  id: HallId
  /** 匾额用繁体，与模型题字一致 */
  name: string
  /** 界面正文用简体 */
  alias: string
  /** 主尊 / 功能，按航拍图标注 */
  deity: string
  summary: string
  etiquette: string[]
  /** 中轴序号，配殿为 null */
  axisOrder: number | null
  /** 是否处于抬高台地 */
  elevated: boolean
  box: HallBox
}

export const HALLS: readonly Hall[] = [
  {
    id: 'tianwang',
    name: '五凤山门',
    alias: '五凤山门（天王殿）',
    deity: '弥勒 · 平安喜乐 / 韦驮 · 出行平安',
    summary:
      '全寺最前方山门，依航拍图题“五凤山门”，内供弥勒与韦驮，兼天王殿之制。人物由殿前广场出发，可穿中门入寺。',
    etiquette: ['由左门入、右门出，中门为尊', '入寺不踏门槛', '整衣肃容，缓步前行'],
    axisOrder: 0,
    elevated: false,
    box: { x: 0, z: 0, baseY: 0, width: 26.0, depth: 14.0, height: 17.7 },
  },
  {
    id: 'shijia',
    name: '释迦宝殿',
    alias: '释迦宝殿',
    deity: '释迦牟尼 · 万事可求 / 普贤 · 事业 / 文殊 · 学业',
    summary: '全寺主殿，重檐形制、月台最宽。与前后殿各距 44 单位，左侧祖堂、五观堂，右侧东庑、客堂围合前两进院落。',
    etiquette: ['于月台中央问讯', '上香三支，不以口吹熄', '礼佛三拜后从两侧退下'],
    axisOrder: 1,
    elevated: false,
    box: { x: 0, z: -44, baseY: 0, width: 29.6, depth: 18.0, height: 23.7 },
  },
  {
    id: 'chaoyin',
    name: '潮音堂',
    alias: '潮音堂',
    deity: '文化传播 · 展览',
    summary: '中轴第三进，航拍图标注为文化传播展览之所；左有药师殿，右有龙王殿与财神殿。',
    etiquette: ['入堂静坐，不交语', '听经毕合掌问讯', '不倚靠柱槛'],
    axisOrder: 2,
    elevated: false,
    box: { x: 0, z: -88, baseY: 0, width: 22.0, depth: 15.0, height: 16.0 },
  },
  {
    id: 'guanyin',
    name: '观音堂',
    alias: '观音堂',
    deity: '观世音菩萨 · 姻缘求子',
    summary: '中轴第四进，殿前设朱墙院门，殿后即锦鲤池与跨池石桥；两侧西院、东院朝内闭合最后一进平地院落。',
    etiquette: ['祈愿文宜简净', '殿前不抛掷物品入池', '礼毕由右侧回廊退出'],
    axisOrder: 3,
    elevated: false,
    box: { x: 0, z: -132, baseY: 0, width: 24.0, depth: 16.0, height: 16.8 },
  },
  {
    id: 'lingxiao',
    name: '凌霄阁',
    alias: '凌霄阁',
    deity: '凌霄阁 · 诸事顺遂',
    summary:
      '地势抬高 6 单位，经十二级踏道登台，重檐之上另设二层平坐栏杆，坐镇全寺最高处。台上西、东两配院左右相向。',
    etiquette: ['登踏道靠右缓行', '台上不奔跑、不倚栏', '回向后再下台'],
    axisOrder: 4,
    elevated: true,
    box: { x: 0, z: -176, baseY: 6, width: 28.0, depth: 16.5, height: 24.6 },
  },
  {
    id: 'wenshu',
    name: '西配院',
    alias: '凌霄阁西侧配院',
    deity: '凌霄高台西侧院落',
    summary: '航拍图上凌霄阁左侧的独立院落群，天王殿配色的深栗木两层楼阁：密直棂格窗、金匾楹联、无红色栏杆，一层檐口与连廊齐平，向内围合台上院落。',
    etiquette: ['合掌问讯', '不背对主殿久立'],
    axisOrder: null,
    elevated: true,
    box: { x: -20.5, z: -176, baseY: 6, width: 12, depth: 11, height: 16.5 },
  },
  {
    id: 'puxian',
    name: '东配院',
    alias: '凌霄阁东侧配院',
    deity: '凌霄高台东侧院落',
    summary: '航拍图上凌霄阁右侧的独立院落群，与西配院同制的天王殿配色两层楼阁，密直棂格窗、无红色栏杆，构成高台四合院的横向边界。',
    etiquette: ['合掌问讯', '顺右绕行'],
    axisOrder: null,
    elevated: true,
    box: { x: 20.5, z: -176, baseY: 6, width: 12, depth: 11, height: 16.5 },
  },
] as const

export const AXIS_HALLS: readonly Hall[] = HALLS.filter(
  (h): h is Hall => h.axisOrder !== null,
).sort((a, b) => (a.axisOrder ?? 0) - (b.axisOrder ?? 0))

const HALL_MAP = new Map<HallId, Hall>(HALLS.map((h) => [h.id, h]))

export function getHall(id: HallId): Hall {
  const hall = HALL_MAP.get(id)
  if (!hall) throw new Error(`未知殿宇: ${id}`)
  return hall
}

export function isHallId(value: string): value is HallId {
  return HALL_MAP.has(value as HallId)
}
