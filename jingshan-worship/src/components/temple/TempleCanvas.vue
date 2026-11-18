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
const stageEl = ref<HTMLElement | null>(null)
const webglOk = ref(true)
const { timedOut } = useTempleScene(frame)

/**
 * 单文件分发模式：打包脚本把 3D 场景 HTML / 兜底图以字符串注入到 window。
 * 存在时用 srcdoc 内联场景，使 file:// 直接打开也能跑完整宿主（无需服务器）。
 * 正常 dev / 部署下这两个全局变量不存在，走原本的 /temple/index.html URL。
 */
const inlineScene =
  typeof window !== 'undefined'
    ? (window as Window & { __TEMPLE_SCENE_HTML__?: string }).__TEMPLE_SCENE_HTML__ || ''
    : ''
const inlineFallback =
  typeof window !== 'undefined'
    ? (window as Window & { __TEMPLE_FALLBACK_DATAURL__?: string }).__TEMPLE_FALLBACK_DATAURL__ || ''
    : ''
const fallbackUrl = inlineFallback || '/temple/fallback.png'

const runtimeUrl = computed(() => {
  if (inlineScene) return '' // 内联场景用 srcdoc，不需要 URL
  const url = new URL(appConfig.templeRuntime, window.location.origin)
  url.searchParams.set('embed', '1')
  url.searchParams.set('mode', 'thirdPerson')
  return url.pathname + url.search
})

/**
 * 贴近时所有殿宇投影会叠在中轴同一点，只标注当前所处殿宇；
 * 滚轮拉远进入“全寺俯瞰”后显示全部中轴殿名 + 航拍图标注的导览点。
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

/** 是否彻底不可用（无 WebGL / 超时）——此时 iframe 可卸载 */
const fatal = computed(() => !webglOk.value || timedOut.value)
/** 是否显示降级兜底图：额外包含上下文临时丢失 */
const degraded = computed(() => fatal.value || store.contextLost)

/** HUD 覆盖层上发生的滚轮转交给 iframe；iframe 自身的滚轮由运行时原生处理 */
function forwardWheel(e: WheelEvent): void {
  if (e.ctrlKey || degraded.value) return
  const target = e.target as Element | null
  if (target?.tagName === 'IFRAME') return
  e.preventDefault()
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
  store.wheel(e.deltaY * unit)
}

/** 双指间距（像素） */
function touchSpan(touches: TouchList): number {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  )
}
let pinchSpan = 0

/**
 * 手指落在宿主 HUD 覆盖层（而非 iframe 场景）时的双指缩放转发。
 * 落在 iframe 上的手势由运行时原生 pointer 事件处理，两者跨文档互斥，不会重复。
 * 把间距比例换算成与运行时 applyWheel 等价的 delta：exp(delta * 0.00145) = 上次间距 / 当前间距。
 */
function onTouchStart(e: TouchEvent): void {
  if (degraded.value || e.touches.length !== 2) return
  // 一指按在摇杆/拇指键上、另一指落在场景：这是“走位 + 环视”，不是捏合缩放
  const target = e.target as Element | null
  if (target?.closest?.('.joy, .tb')) return
  pinchSpan = touchSpan(e.touches)
}
function onTouchMove(e: TouchEvent): void {
  if (degraded.value || e.touches.length !== 2 || pinchSpan <= 0) return
  const span = touchSpan(e.touches)
  if (span > 4) {
    const delta = Math.log(pinchSpan / span) / 0.00145
    pinchSpan = span
    if (Number.isFinite(delta) && delta !== 0) {
      e.preventDefault()
      // 运行时的 applyWheel 把单次 delta 截断到 ±400；拆帧下发以保持与场景区捏合一致的手感
      let remain = delta
      while (Math.abs(remain) > 400) {
        store.wheel(400 * Math.sign(remain))
        remain -= 400 * Math.sign(remain)
      }
      if (remain !== 0) store.wheel(remain)
    }
  }
}
function onTouchEnd(e: TouchEvent): void {
  if (e.touches.length < 2) pinchSpan = 0
}

onMounted(() => {
  try {
    const canvas = document.createElement('canvas')
    webglOk.value = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    webglOk.value = false
  }
  window.addEventListener('wheel', forwardWheel, { passive: false })
  const stage = stageEl.value
  if (stage) {
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })
    stage.addEventListener('touchend', onTouchEnd, { passive: true })
    stage.addEventListener('touchcancel', onTouchEnd, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('wheel', forwardWheel)
  const stage = stageEl.value
  if (stage) {
    stage.removeEventListener('touchstart', onTouchStart)
    stage.removeEventListener('touchmove', onTouchMove)
    stage.removeEventListener('touchend', onTouchEnd)
    stage.removeEventListener('touchcancel', onTouchEnd)
  }
})
</script>

<template>
  <section class="stage" ref="stageEl">
    <!-- 上下文临时丢失时不再把 iframe 的 display 切掉：
         隐藏/显示跨文档 iframe 会触发整块重新合成，掉一次上下文就闪一下；
         改为保留 iframe、在上面盖一层提示，恢复后提示消失即可。 -->
    <iframe
      v-if="!fatal"
      ref="frame"
      :src="inlineScene ? undefined : runtimeUrl"
      :srcdoc="inlineScene || undefined"
      title="径山万寿禅寺 · 人物第三人称漫游"
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
      <p>正在构建殿宇与人物…</p>
      <small>五凤山门 → 释迦宝殿 → 潮音堂 → 观音堂 → 凌霄阁</small>
    </div>

    <div
      v-if="degraded"
      class="fallback"
      :class="{ soft: !fatal }"
      :style="{ backgroundImage: `url(${fallbackUrl})` }"
    >
      <div class="fallback-txt">
        <strong class="serif">{{ fatal ? '三维运行时不可用' : '三维画面恢复中' }}</strong>
        <p>{{ fatal ? '已切换为全寺俯瞰静态图。' : '显卡上下文暂时中断，正在自动恢复…' }}</p>
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
  touch-action: none; /* 移动端：手势全部交给运行时缩放，禁用浏览器默认缩放/平移 */
  contain: paint;     /* 把重绘范围限制在舞台内，HUD 更新不会波及页面其余部分 */
}
iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  /* 独立合成层 + 关闭背面绘制：避免宿主 HUD 刷新时把跨文档的 WebGL 表面
   * 一起重绘（部分 GPU 上会表现为闪一下）。 */
  transform: translateZ(0);
  backface-visibility: hidden;
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
  background: rgba(43, 33, 28, 0.68);
  color: #fff9ec;
  font-family: var(--font-serif);
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 4;
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
  z-index: 5;
  background-size: cover;
  background-position: center;
  display: grid;
  place-items: center;
}
/* 上下文临时丢失时的过渡提示：压低底图存在感，恢复后自动消失 */
.fallback.soft {
  background-color: rgba(207, 227, 240, 0.86);
  background-blend-mode: screen;
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
