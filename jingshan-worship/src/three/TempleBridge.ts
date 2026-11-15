import {
  BRIDGE_CHANNEL,
  BRIDGE_VERSION,
  parseBridgeMessage,
  type BridgeEnvelope,
  type TempleCommand,
  type TempleEvent,
  type TempleEventMap,
} from '@/domain/bridge'

type EventHandler = (event: TempleEvent) => void
type TypedHandler<K extends keyof TempleEventMap> = (event: TempleEventMap[K]) => void

/**
 * 宿主侧 3D 运行时通道。
 * - ready 之前的命令进入队列，ready 后按序下发，避免竞态丢命令
 * - 只接受来自已绑定 iframe 的消息，且必须满足通道/版本契约
 */
export class TempleBridge {
  private frame: HTMLIFrameElement | null = null
  private ready = false
  private queue: TempleCommand[] = []
  private handlers = new Set<EventHandler>()
  private onMessage = (e: MessageEvent<unknown>): void => {
    if (!this.frame || e.source !== this.frame.contentWindow) return
    if (e.origin !== window.location.origin && e.origin !== 'null') return
    const env = parseBridgeMessage(e.data)
    if (!env) return
    if (env.payload.evt === 'ready') {
      this.ready = true
      this.flush()
    }
    this.handlers.forEach((fn) => fn(env.payload))
  }

  attach(frame: HTMLIFrameElement): void {
    this.detach()
    this.frame = frame
    window.addEventListener('message', this.onMessage)
  }

  detach(): void {
    window.removeEventListener('message', this.onMessage)
    this.frame = null
    this.ready = false
    this.queue = []
  }

  on(handler: EventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  onEvent<K extends keyof TempleEventMap>(kind: K, handler: TypedHandler<K>): () => void {
    return this.on((event) => {
      if (event.evt === kind) handler(event as TempleEventMap[K])
    })
  }

  send(command: TempleCommand): void {
    if (!this.ready || !this.frame?.contentWindow) {
      this.queue.push(command)
      return
    }
    const envelope: BridgeEnvelope<TempleCommand> = {
      __channel: BRIDGE_CHANNEL,
      version: BRIDGE_VERSION,
      kind: 'cmd',
      payload: command,
    }
    this.frame.contentWindow.postMessage(envelope, '*')
  }

  get isReady(): boolean {
    return this.ready
  }

  private flush(): void {
    const pending = this.queue
    this.queue = []
    pending.forEach((cmd) => this.send(cmd))
  }
}

/** 全局单例：3D 运行时只有一个，命令与事件必须共用同一通道 */
export const templeBridge = new TempleBridge()
