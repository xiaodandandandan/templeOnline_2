<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 移动端虚拟摇杆（拇指杆）。
 * 输出 -1~1 的屏幕向量：x 向右为正，y 向前为正。
 * 组件本身不做任何坐标换算，方向语义交给 3D 运行时按镜头朝向换算，
 * 因此镜头环绕后“上”始终是屏幕里的远处，不会出现推杆方向与画面不一致。
 */
const emit = defineEmits<{ (e: 'move', x: number, y: number): void }>()

const root = ref<HTMLElement | null>(null)
const knobEl = ref<HTMLElement | null>(null)
const active = ref(false)
/** 摇杆头相对中心的像素偏移，仅用于视觉跟随 */
const knobX = ref(0)
const knobY = ref(0)

/** 死区：中心 14% 内视为松手，避免拇指微抖导致人物原地抽搐 */
const DEAD = 0.14
let pid = -1
let centerX = 0
let centerY = 0
let radius = 46
let lastX = 0
let lastY = 0

/** 变化不足 1% 不下发：pointermove 有 60~120Hz，逐帧 postMessage 会白占主线程 */
function push(x: number, y: number): void {
  if (Math.abs(x - lastX) < 0.01 && Math.abs(y - lastY) < 0.01) return
  lastX = x
  lastY = y
  emit('move', x, y)
}

function apply(px: number, py: number): void {
  const r = radius || 1
  const m = Math.hypot(px, py)
  const clampK = m > r ? r / m : 1
  const kx = px * clampK
  const ky = py * clampK
  knobX.value = kx
  knobY.value = ky
  const n = Math.min(1, Math.hypot(kx, ky) / r)
  if (n <= DEAD) {
    push(0, 0)
    return
  }
  // 死区外重新映射到 0~1：刚出死区是慢走，推到底才是全速
  const mag = (n - DEAD) / (1 - DEAD)
  const ux = kx / (n * r)
  const uy = ky / (n * r)
  push(ux * mag, -uy * mag) // 屏幕 y 向下为正，翻成“向前”
}

function onDown(e: PointerEvent): void {
  if (pid !== -1) return
  const el = root.value
  if (!el) return
  const box = el.getBoundingClientRect()
  centerX = box.left + box.width / 2
  centerY = box.top + box.height / 2
  // 行程 = 底盘半径 - 摇杆头半径 - 3：推到底时球头刚好贴在底盘内沿，不会跑出圈外
  const knobR = (knobEl.value?.offsetWidth ?? 54) / 2
  radius = Math.max(20, box.width / 2 - knobR - 3)
  pid = e.pointerId
  active.value = true
  try {
    el.setPointerCapture(pid)
  } catch {
    /* 部分浏览器在合成事件里会拒绝捕获，忽略即可 */
  }
  apply(e.clientX - centerX, e.clientY - centerY)
}

function onMove(e: PointerEvent): void {
  if (e.pointerId !== pid) return
  apply(e.clientX - centerX, e.clientY - centerY)
}

function release(e?: PointerEvent): void {
  if (pid === -1) return
  if (e && e.pointerId !== pid) return
  const el = root.value
  try {
    if (el?.hasPointerCapture?.(pid)) el.releasePointerCapture(pid)
  } catch {
    /* 忽略 */
  }
  pid = -1
  active.value = false
  knobX.value = 0
  knobY.value = 0
  push(0, 0)
}

onBeforeUnmount(() => {
  window.removeEventListener('blur', onBlur)
  document.removeEventListener('visibilitychange', onHide)
  release()
})

/* 切后台 / 系统手势中断时可能收不到 pointerup：兜底归零，避免人物一直往前走 */
function onBlur(): void {
  release()
}
function onHide(): void {
  if (document.visibilityState === 'hidden') release()
}
onMounted(() => {
  window.addEventListener('blur', onBlur)
  document.addEventListener('visibilitychange', onHide)
})
</script>

<template>
  <div
    ref="root"
    class="joy"
    :class="{ on: active }"
    role="application"
    aria-label="虚拟摇杆：推杆行走，前后左右"
    @pointerdown.prevent="onDown"
    @pointermove="onMove"
    @pointerup="release"
    @pointercancel="release"
    @lostpointercapture="release"
    @contextmenu.prevent
  >
    <span class="tick n">前</span>
    <span class="tick s">后</span>
    <span class="tick w">左</span>
    <span class="tick e">右</span>
    <div class="ring" />
    <div
      ref="knobEl"
      class="knob"
      :style="{ transform: `translate3d(${knobX}px, ${knobY}px, 0)` }"
    >
      <i />
    </div>
  </div>
</template>

<style scoped>
.joy {
  position: relative;
  width: var(--joy, 128px);
  height: var(--joy, 128px);
  border-radius: 50%;
  /* 摇杆自己吃掉全部手势：否则单指推杆会被舞台当成拖拽转向 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 249, 236, 0.1), rgba(43, 33, 28, 0.42) 62%, rgba(43, 33, 28, 0.58)),
    rgba(43, 33, 28, 0.3);
  border: 1px solid rgba(255, 249, 236, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 249, 236, 0.18),
    0 6px 18px rgba(20, 14, 10, 0.35);
  transition: border-color 0.18s var(--ease), box-shadow 0.18s var(--ease);
}
.joy.on {
  border-color: rgba(240, 207, 131, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 249, 236, 0.22),
    0 0 0 3px rgba(168, 60, 50, 0.18),
    0 6px 18px rgba(20, 14, 10, 0.4);
}
/* 内圈：标出摇杆的有效行程半径，与 8px 内缩后的 radius 对应 */
.ring {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 249, 236, 0.16);
}
.tick {
  position: absolute;
  font-size: 9px;
  line-height: 1;
  color: rgba(255, 249, 236, 0.5);
  letter-spacing: 0.04em;
  pointer-events: none;
}
.tick.n {
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
}
.tick.s {
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
}
.tick.w {
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
}
.tick.e {
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
}
.knob {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 54px;
  height: 54px;
  margin: -27px 0 0 -27px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #f7e8c9, #d9b45f 60%, #b8934d);
  border: 1px solid rgba(255, 252, 245, 0.7);
  box-shadow:
    0 3px 10px rgba(20, 14, 10, 0.45),
    inset 0 -2px 4px rgba(120, 80, 40, 0.35);
  will-change: transform;
  transition: transform 0.18s var(--ease);
}
.joy.on .knob {
  transition: none; /* 跟手：按下后不再补间 */
}
.knob i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(74, 49, 40, 0.32);
  box-shadow: inset 0 1px 2px rgba(43, 33, 28, 0.4);
}
@media (max-height: 520px) {
  .joy {
    --joy: 108px;
  }
  .knob {
    width: 46px;
    height: 46px;
    margin: -23px 0 0 -23px;
  }
}
</style>
