import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type {
  AvatarState,
  HallAnchor,
  SceneStats,
  TempleCommand,
  TempleEvent,
} from '@/domain/bridge'
import type { HallId, SceneMode, ViewKey } from '@/domain/hall'
import type { InteriorAnchor } from '@/domain/interior'
import { templeBridge } from '@/three/TempleBridge'

export interface SceneLayers {
  labels: boolean
  trees: boolean
  wireframe: boolean
  rotate: boolean
  dusk: boolean
}

const EMPTY_AVATAR: AvatarState = {
  x: 0,
  y: 0,
  z: 18,
  yaw: 0,
  moving: false,
  nearHallId: null,
  distance: 999,
  onTerrace: false,
  mode: 'thirdPerson',
  insideHallId: null,
  zoom: 9.4,
}

/**
 * 3D 视图状态：唯一的「场景真相」来源。
 * 组件不直接操作 iframe，一律通过此 store 的 action 下发命令。
 */
export const useTempleStore = defineStore('temple', () => {
  const ready = ref(false)
  const stats = ref<SceneStats>({ meshes: 0, tris: 0 })
  const anchors = ref<HallAnchor[]>([])
  const interiorAnchors = ref<InteriorAnchor[]>([])
  /** hallId → 蒲团座位数，由 3D 几何注册表随 interior 事件下发 */
  const interiorSeats = ref<Record<string, number>>({})
  const zoomDistance = ref(9.4)
  const avatar = ref<AvatarState>({ ...EMPTY_AVATAR })
  const mode = ref<SceneMode>('thirdPerson')
  const view = ref<ViewKey>('axis')
  const selectedHallId = ref<HallId | null>(null)
  const errorMessage = ref('')
  const lastInteraction = ref<{ hallId: HallId; at: number } | null>(null)
  const layers = reactive<SceneLayers>({
    labels: true,
    trees: true,
    wireframe: false,
    rotate: false,
    dusk: false,
  })

  const nearHallId = computed(() => avatar.value.nearHallId)
  const insideHallId = computed(() => avatar.value.insideHallId)
  const position = computed(() => `X ${avatar.value.x.toFixed(1)} · Z ${avatar.value.z.toFixed(1)}`)
  const isMoving = computed(() => avatar.value.moving)
  /** 拉远到一定距离后按「全寺俯瞰」呈现：显示全部殿名、不再只标注当前殿 */
  const overview = computed(() => zoomDistance.value > 150)
  /** 拉远程度 0~100：进度条随滚轮向外拉远而增长 */
  const zoomOut = computed(() =>
    Math.round(Math.max(0, Math.min(1, (zoomDistance.value - 9.4) / 240.6)) * 100),
  )
  const zoomScale = computed(() =>
    zoomDistance.value > 150 ? '全寺' : zoomDistance.value > 45 ? '院落' : '近景',
  )

  function applyEvent(event: TempleEvent): void {
    switch (event.evt) {
      case 'ready':
        ready.value = true
        stats.value = event.stats
        mode.value = event.mode
        avatar.value = event.avatar
        errorMessage.value = ''
        break
      case 'avatar':
        avatar.value = {
          x: event.x,
          y: event.y,
          z: event.z,
          yaw: event.yaw,
          moving: event.moving,
          nearHallId: event.nearHallId,
          distance: event.distance,
          onTerrace: event.onTerrace,
          mode: event.mode,
          insideHallId: event.insideHallId,
          zoom: event.zoom,
        }
        break
      case 'anchors':
        anchors.value = event.items
        break
      case 'interior':
        interiorAnchors.value = event.anchors
        interiorSeats.value = event.seats
        break
      case 'zoom':
        zoomDistance.value = event.distance
        break
      case 'modeChanged':
        mode.value = event.mode
        break
      case 'hallNear':
      case 'avatarPreview':
        break
      case 'teleported':
        selectedHallId.value = event.hallId
        break
      case 'interaction':
        selectedHallId.value = event.hallId
        lastInteraction.value = { hallId: event.hallId, at: Date.now() }
        break
      case 'hallPicked':
        selectedHallId.value = event.hallId
        break
      case 'viewChanged':
        view.value = event.view
        break
      case 'stats':
        stats.value = event.stats
        break
      case 'error':
        errorMessage.value = event.message
        break
      case 'hallFocused':
        break
    }
  }

  function send(command: TempleCommand): void {
    templeBridge.send(command)
  }

  function setMode(next: SceneMode): void {
    mode.value = next
    send({ cmd: 'setMode', mode: next })
  }

  function setMove(forward: number, turn = 0, run = false): void {
    send({ cmd: 'setMove', forward, turn, run })
  }

  /** HUD 覆盖层上的滚轮转交给 iframe（iframe 自身的滚轮由运行时直接处理） */
  function wheel(delta: number): void {
    send({ cmd: 'wheel', delta })
  }

  function setZoom(distance: number | 'overview' | 'close'): void {
    send({ cmd: 'setZoom', distance })
  }

  function teleport(hallId: HallId): void {
    selectedHallId.value = hallId
    send({ cmd: 'teleport', hallId })
  }

  function interact(hallId?: HallId): void {
    send({ cmd: 'interact', hallId })
  }

  function resetAvatar(): void {
    lastInteraction.value = null
    send({ cmd: 'resetAvatar' })
  }

  function setView(next: ViewKey): void {
    view.value = next
    send({ cmd: 'setView', view: next })
  }

  function selectHall(id: HallId, focus = true): void {
    selectedHallId.value = id
    if (focus) teleport(id)
  }

  function setLayer<K extends keyof SceneLayers>(key: K, on: boolean): void {
    layers[key] = on
    switch (key) {
      case 'trees':
        send({ cmd: 'setTrees', on })
        break
      case 'wireframe':
        send({ cmd: 'setWireframe', on })
        break
      case 'rotate':
        send({ cmd: 'setRotate', on })
        break
      case 'dusk':
        send({ cmd: 'setDusk', on })
        break
      case 'labels':
        break
    }
  }

  function reset(): void {
    selectedHallId.value = null
    view.value = 'front'
    send({ cmd: 'reset' })
  }

  return {
    ready,
    stats,
    anchors,
    interiorAnchors,
    interiorSeats,
    zoomDistance,
    avatar,
    mode,
    view,
    selectedHallId,
    errorMessage,
    lastInteraction,
    layers,
    nearHallId,
    insideHallId,
    overview,
    zoomOut,
    zoomScale,
    position,
    isMoving,
    applyEvent,
    send,
    setMode,
    setMove,
    wheel,
    setZoom,
    teleport,
    interact,
    resetAvatar,
    setView,
    selectHall,
    setLayer,
    reset,
  }
})
