/**
 * 殿宇内部空间契约（参考韩国线上山寺 SANSA 法堂扩容后的陈设）。
 *
 * 锚点由 three.js 几何在构建室内时直接产出，经桥接 ready 后一次下发；
 * Vue 侧只持有纯数据，不接触任何 three.js 对象。后续要挂佛像、蒲团、香炉，
 * 只需按 kind 取锚点，新增一条 spawnProp 命令即可，不需要重新推导坐标。
 */
export type InteriorPropKind =
  | 'statue'
  | 'altar'
  | 'incense'
  | 'cushion'
  | 'mural'
  | 'moktak'
  | 'beads'
  | 'lantern'

export interface InteriorAnchor {
  /** 殿宇 id：中轴 / 台上配殿用 HallId，四合院配殿用 side_<n>_<l|r> */
  hallId: string
  kind: InteriorPropKind
  /** 世界坐标，含高台 baseY 偏移；y 为可放置面高度 */
  x: number
  y: number
  z: number
  /** 蒲团面朝主尊的人物 yaw（弧度），仅 cushion 产出 */
  yaw?: number
  /** 蒲团在本殿内的座号，仅 cushion 产出 */
  seat?: number
}

export const INTERIOR_PROP_LABELS: Record<InteriorPropKind, string> = {
  statue: '佛像',
  altar: '佛台',
  incense: '香炉',
  cushion: '蒲团',
  mural: '壁画背屏',
  moktak: '木鱼',
  beads: '念珠',
  lantern: '莲花灯',
}

export function anchorsOf(
  anchors: readonly InteriorAnchor[],
  hallId: string,
  kind?: InteriorPropKind,
): InteriorAnchor[] {
  return anchors.filter((a) => a.hallId === hallId && (!kind || a.kind === kind))
}
