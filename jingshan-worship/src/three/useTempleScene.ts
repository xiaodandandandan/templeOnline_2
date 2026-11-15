import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { useTempleStore } from '@/stores/temple'
import { templeBridge } from './TempleBridge'

/** 3D 运行时生命周期：绑定 iframe、订阅事件、下发初始命令、卸载时清理 */
export function useTempleScene(frameRef: Ref<HTMLIFrameElement | null>): {
  timedOut: Ref<boolean>
} {
  const store = useTempleStore()
  const timedOut = ref(false)
  let unsubscribe: (() => void) | null = null
  let timer = 0

  onMounted(() => {
    const frame = frameRef.value
    if (!frame) return
    templeBridge.attach(frame)
    unsubscribe = templeBridge.on((event) => store.applyEvent(event))
    // ready 之前发送的命令自动排队，避免加载竞态；默认进入人物第三人称
    templeBridge.send({ cmd: 'setMode', mode: store.mode })
    templeBridge.send({ cmd: 'getStats' })
    timer = window.setTimeout(() => {
      if (!store.ready) timedOut.value = true
    }, 20000)
  })

  onBeforeUnmount(() => {
    window.clearTimeout(timer)
    unsubscribe?.()
    templeBridge.detach()
  })

  return { timedOut }
}
