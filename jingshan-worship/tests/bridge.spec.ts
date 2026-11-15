import { describe, expect, it, vi } from 'vitest'
import { BRIDGE_CHANNEL, BRIDGE_VERSION, parseBridgeMessage } from '@/domain/bridge'
import { TempleBridge } from '@/three/TempleBridge'

const envelope = (payload: unknown) => ({
  __channel: BRIDGE_CHANNEL,
  version: BRIDGE_VERSION,
  kind: 'evt',
  payload,
})

describe('橋接訊息契約', () => {
  it('接受合法事件信封', () => {
    expect(parseBridgeMessage(envelope({ evt: 'ready', stats: { meshes: 1, tris: 2 } }))).not.toBeNull()
  })

  it('丟棄通道 / 版本 / 類型不符的訊息', () => {
    expect(parseBridgeMessage(null)).toBeNull()
    expect(parseBridgeMessage({ __channel: 'OTHER', version: 1, kind: 'evt', payload: { evt: 'ready' } })).toBeNull()
    expect(parseBridgeMessage({ ...envelope({ evt: 'ready' }), version: 99 })).toBeNull()
    expect(parseBridgeMessage({ ...envelope({ evt: 'ready' }), kind: 'cmd' })).toBeNull()
    expect(parseBridgeMessage(envelope({}))).toBeNull()
  })
})

describe('TempleBridge 命令隊列', () => {
  it('ready 之前排隊、ready 之後按序下發', () => {
    const postMessage = vi.fn()
    const fakeWin = { postMessage } as unknown as Window
    const frame = { contentWindow: fakeWin } as unknown as HTMLIFrameElement
    const bridge = new TempleBridge()
    bridge.attach(frame)

    bridge.send({ cmd: 'setView', view: 'top' })
    bridge.send({ cmd: 'focusHall', hallId: 'guanyin' })
    expect(postMessage).not.toHaveBeenCalled()

    const readyEvent = new MessageEvent('message', {
      data: envelope({ evt: 'ready', stats: { meshes: 10, tris: 20 }, view: 'axis' }),
      origin: window.location.origin,
    })
    Object.defineProperty(readyEvent, 'source', { value: fakeWin })
    window.dispatchEvent(readyEvent)

    expect(bridge.isReady).toBe(true)
    expect(postMessage).toHaveBeenCalledTimes(2)
    expect(postMessage.mock.calls[0][0].payload).toEqual({ cmd: 'setView', view: 'top' })
    expect(postMessage.mock.calls[1][0].payload).toEqual({ cmd: 'focusHall', hallId: 'guanyin' })
    bridge.detach()
  })

  it('忽略非綁定 iframe 來源的事件', () => {
    const frame = { contentWindow: { postMessage: vi.fn() } } as unknown as HTMLIFrameElement
    const bridge = new TempleBridge()
    bridge.attach(frame)
    const handler = vi.fn()
    bridge.on(handler)
    const event = new MessageEvent('message', { data: envelope({ evt: 'stats', stats: { meshes: 1, tris: 1 } }) })
    Object.defineProperty(event, 'source', { value: { another: true } })
    window.dispatchEvent(event)
    expect(handler).not.toHaveBeenCalled()
    bridge.detach()
  })
})
