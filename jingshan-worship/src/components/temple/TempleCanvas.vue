<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { appConfig } from '@/app/config'
import { AXIS_HALLS, getHall, type HallId } from '@/domain/hall'
import type { HallAnchor } from '@/domain/bridge'
import { useTempleStore } from '@/stores/temple'
import { useTempleScene } from '@/three/useTempleScene'
import AvatarHud from './AvatarHud.vue'

const store = useTempleStore()
const frame = ref<HTMLIFrameElement | null>(null)
const webglOk = ref(true)
const { timedOut } = useTempleScene(frame)

const runtimeUrl = computed(() => {
  const url = new URL(appConfig.templeRuntime, window.location.origin)
  url.searchParams.set('embed', '1')
  url.searchParams.set('mode', 'thirdPerson')
  return url.pathname + url.search
})

/**
 * 贴近时所有殿宇投影会叠在中轴同一点，只标注当前所处殿宇；
 * 滚轮拉远进入「全寺俯瞰」后显示全部中轴殿名 + 航拍图标注的导览点。
 */
const marks = computed(() => {
  const ids = new Set<string>(AXIS_HALLS.map((h) => h.id))
  const nameOf = (a: HallAnchor): string =>
    a.guide ? (a.name ?? a.id) : getHall(a.id as HallId).name
  return store.anchors
    .filter((a) => {
      if (!a.visible) return false
      if (a.guide) return store.overview
      return ids.has(a.id) && (store.overview || a.id === store.nearHallId)
    })
    .map((a) => ({
      ...a,
      name: nameOf(a),
      active: !a.guide && a.id === store.nearHallId,
    }))
})

const degraded = computed(() => !webglOk.value || timedOut.value)

/** HUD 覆盖层上发生的滚轮转交给 iframe；iframe 自身的滚轮由运行时原生处理 */
function forwardWheel(e: WheelEvent): void {
  if (e.ctrlKey || degraded.value) return
  const target = e.target as Element | null
  if (target?.tagName === 'IFRAME') return
  e.preventDefault()
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
  store.wheel(e.deltaY * unit)
}

onMounted(() => {
  try {
    const canvas = document.createElement('canvas')
    webglOk.value = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    webglOk.value = false
  }
  window.addEventListener('wheel', forwardWheel, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('wheel', forwardWheel)
})
</script>

<template>
  <section class="stage">
    <iframe
      v-if="!degraded"
      ref="frame"
      :src="runtimeUrl"
      title="徑山萬壽禪寺 · 人物第三人稱漫游"
      allow="fullscreen"
      frameborder="0"
    />

    <template v-if="!degraded && store.layers.labels && store.ready">
      <div
        v-for="m in marks"
        :key="m.id"
        class="hall-mark"
        :class="{ active: m.active, guide: m.guide }"
        :style="{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }"
      >
        <i />{{ m.name }}
      </div>
    </template>

    <div v-if="!degraded && !store.ready" class="mask">
      <div class="loader" />
      <p>正在構建殿宇與人物…</p>
      <small>五鳳山門 → 釋迦寶殿 → 潮音堂 → 觀音堂 → 凌霄閣</small>
    </div>

    <div
      v-if="degraded"
      class="fallback"
      :style="{ backgroundImage: 'url(/temple/fallback.png)' }"
    >
      <div class="fallback-txt">
        <strong class="serif">三維運行時不可用</strong>
        <p>已切換為全寺俯瞰靜態圖。</p>
      </div>
    </div>

    <div v-if="store.errorMessage" class="err">{{ store.errorMessage }}</div>

    <AvatarHud v-if="!degraded" />
  </section>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #cfe3f0;
}
iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.hall-mark {
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid rgba(255, 249, 236, 0.55);
  border-radius: 999px;
  background: rgba(43, 33, 28, 0.52);
  color: #fff9ec;
  font-family: var(--font-serif);
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 4;
  backdrop-filter: blur(3px);
}
.hall-mark i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold-soft);
}
.hall-mark.active {
  background: var(--cinnabar);
  border-color: #e8c9a0;
}
.hall-mark.guide {
  padding: 2px 8px;
  font-size: 10px;
  background: rgba(116, 44, 35, 0.74);
  border-color: rgba(255, 226, 178, 0.6);
  color: #ffeccd;
}
.hall-mark.guide i {
  width: 4px;
  height: 4px;
  background: #ffd9a0;
}
.mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  background: linear-gradient(160deg, #e8e1d2, #cfe3f0);
  color: var(--ink-2);
  z-index: 6;
}
.mask p {
  margin: 4px 0 0;
  font-family: var(--font-serif);
  letter-spacing: 0.08em;
}
.mask small {
  color: var(--ink-3);
}
.loader {
  width: 30px;
  height: 30px;
  border: 2px solid var(--line-strong);
  border-top-color: var(--cinnabar);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.fallback {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  display: grid;
  place-items: center;
}
.fallback-txt {
  background: rgba(255, 252, 245, 0.94);
  padding: 22px 28px;
  border-radius: var(--radius-m);
  text-align: center;
}
.fallback-txt p {
  font-size: 12px;
  color: var(--ink-2);
}
.err {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9;
  background: rgba(168, 60, 50, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: var(--radius-s);
  font-size: 11px;
}
</style>
