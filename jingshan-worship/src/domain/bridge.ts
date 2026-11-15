/**
 * 宿主（Vue）↔ 3D 运行时（iframe 内 three.js）的双向通道契约 v2。
 * 3D 层只负责渲染、人物、相机、碰撞与投影数学；业务状态与所有 UI 归 Vue。
 */
import type { HallId, SceneMode, ViewKey } from './hall'
import type { InteriorAnchor } from './interior'

export const BRIDGE_CHANNEL = 'JINGSHAN_TEMPLE' as const
export const BRIDGE_VERSION = 2 as const

export interface SceneStats {
  meshes: number
  tris: number
}

/** 中性人物的运行时状态 */
export interface AvatarState {
  x: number
  y: number
  z: number
  yaw: number
  moving: boolean
  nearHallId: HallId | null
  distance: number
  onTerrace: boolean
  mode: SceneMode
  /** 人物所在殿宇（含四合院 side_* 配殿）；null 表示在室外 */
  insideHallId: string | null
  /** 第三人称相机与人物之间的距离，滚轮缩放结果 */
  zoom: number
}

/** 屏幕归一化锚点：[0,1] 区间，宿主据此在 iframe 之上叠加殿名（纯标注）。
 *  guide=true 为航拍图标注点（請香處 / 祖堂 / 藥師殿 等），名称由 3D 侧直接下发；
 *  其余为 HALLS 中的殿宇，宿主按 id 查表取名。 */
export interface HallAnchor {
  id: string
  x: number
  y: number
  visible: boolean
  guide?: boolean
  name?: string
  no?: number
}

export type TempleCommand =
  | { cmd: 'setMode'; mode: SceneMode }
  | { cmd: 'setMove'; forward: number; turn: number; run?: boolean }
  | { cmd: 'wheel'; delta: number }
  | { cmd: 'setZoom'; distance: number | 'overview' | 'close' }
  | { cmd: 'teleport'; hallId: HallId }
  | { cmd: 'interact'; hallId?: HallId }
  | { cmd: 'resetAvatar' }
  | { cmd: 'setView'; view: ViewKey }
  | { cmd: 'focusHall'; hallId: HallId }
  | { cmd: 'setTrees'; on: boolean }
  | { cmd: 'setWireframe'; on: boolean }
  | { cmd: 'setRotate'; on: boolean }
  | { cmd: 'setDusk'; on: boolean }
  | { cmd: 'previewAvatar' }
  | { cmd: 'reset' }
  | { cmd: 'exportGlb' }
  | { cmd: 'getStats' }

export type TempleEvent =
  | { evt: 'ready'; stats: SceneStats; view: ViewKey; mode: SceneMode; avatar: AvatarState }
  | { evt: 'anchors'; items: HallAnchor[] }
  // seats: hallId → 该殿蒲团座位数（内部扩容后的容量）
  | { evt: 'interior'; anchors: InteriorAnchor[]; seats: Record<string, number> }
  | { evt: 'zoom'; distance: number; overview: boolean }
  | { evt: 'avatar' } & AvatarState
  | { evt: 'hallNear'; hallId: HallId | null; distance: number }
  | { evt: 'teleported'; hallId: HallId }
  | { evt: 'interaction'; hallId: HallId; kind: 'kneel' }
  | { evt: 'modeChanged'; mode: SceneMode }
  | { evt: 'avatarPreview' }
  | { evt: 'hallPicked'; hallId: HallId }
  | { evt: 'viewChanged'; view: ViewKey }
  | { evt: 'hallFocused'; hallId: HallId }
  | { evt: 'stats'; stats: SceneStats }
  | { evt: 'error'; message: string }

export interface BridgeEnvelope<T> {
  __channel: typeof BRIDGE_CHANNEL
  version: typeof BRIDGE_VERSION
  kind: 'cmd' | 'evt'
  payload: T
}

export type TempleCommandMap = {
  [C in TempleCommand as C['cmd']]: C
}
export type TempleEventMap = {
  [E in TempleEvent as E['evt']]: E
}

/** 带来源校验的消息解析，非法消息一律丢弃 */
export function parseBridgeMessage(data: unknown): BridgeEnvelope<TempleEvent> | null {
  if (typeof data !== 'object' || data === null) return null
  const env = data as Partial<BridgeEnvelope<unknown>>
  if (env.__channel !== BRIDGE_CHANNEL || env.version !== BRIDGE_VERSION) return null
  if (env.kind !== 'evt' || typeof env.payload !== 'object' || env.payload === null) return null
  const payload = env.payload as { evt?: unknown }
  if (typeof payload.evt !== 'string') return null
  return env as BridgeEnvelope<TempleEvent>
}
