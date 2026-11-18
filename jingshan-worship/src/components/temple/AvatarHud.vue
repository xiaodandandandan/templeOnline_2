<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getHall } from '@/domain/hall'
import { useTempleStore } from '@/stores/temple'
import VirtualJoystick from './VirtualJoystick.vue'

const store = useTempleStore()

const nearHall = computed(() =>
  store.nearHallId ? getHall(store.nearHallId) : null,
)
/** 殿内蒲团席位：由 3D 几何注册表下发，体现各殿扩容后的容量 */
const seatCount = computed(() => {
  const id = store.insideHallId
  return id ? (store.interiorSeats[id] ?? 0) : 0
})
const toastHall = ref('')
let toastTimer = 0
/** 是否触屏布局：决定提示文案（移动端没有 E 键） */
const coarse = ref(false)
/** 移动端首屏操作提示：首次推杆即消失，或在 8 秒后自动收起 */
const tip = ref(false)
let tipTimer = 0
function dismissTip(): void {
  if (!tip.value) return
  tip.value = false
  window.clearTimeout(tipTimer)
}
/** 场景已就绪再提示：软件渲染 / 低端机上建模要好几秒，提前计时会让提示一闪而过 */
function showTip(): void {
  if (!coarse.value || !store.ready) return
  tip.value = true
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (tip.value = false), 8000)
}
watch(
  () => store.lastInteraction?.at,
  () => {
    const last = store.lastInteraction
    window.clearTimeout(toastTimer)
    if (!last) {
      toastHall.value = ''
      return
    }
    toastHall.value = getHall(last.hallId).name
    toastTimer = window.setTimeout(() => (toastHall.value = ''), 4200)
  },
)

function startMove(forward: number, turn: number): void {
  store.setMove(forward, turn, false)
}
function stopMove(): void {
  store.setMove(0, 0, false)
  store.setMoveVector(0, 0)
}
/** 摇杆 → 镜头相对的四向位移（前后左右都能走，人物自动转向） */
function onJoy(x: number, y: number): void {
  dismissTip()
  store.setMoveVector(x, y)
}
/** 移动端动作按钮在按下时给一次短反馈，点按手感更实 */
function tap(): void {
  navigator.vibrate?.(8)
}
watch(
  () => store.ready,
  (ok) => {
    if (ok) showTip()
  },
  { immediate: true },
)
onMounted(() => {
  window.addEventListener('pointerup', stopMove)
  window.addEventListener('pointercancel', stopMove)
  // 触屏设备（或无鼠标的窄窗口）才走摇杆布局
  coarse.value =
    !!window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 760
  showTip()
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', stopMove)
  window.removeEventListener('pointercancel', stopMove)
  window.clearTimeout(toastTimer)
  window.clearTimeout(tipTimer)
  stopMove()
})
</script>

<template>
  <div class="hud">
    <div class="top-left">
      <span class="eyebrow">THIRD PERSON</span>
      <div class="who"><i class="figure" />方块人物 · 第三人称</div>
      <div class="pos">
        <span>{{ store.position }}</span>
        <span v-if="store.avatar.onTerrace" class="tag rise">高台</span>
        <span v-if="store.isMoving" class="tag walk">行走中</span>
        <span v-if="store.insideHallId" class="tag inside">
          殿内<span v-if="seatCount"> · {{ seatCount }} 席</span>
        </span>
      </div>
    </div>

    <div class="top-right desktop-ui">
      <span class="eyebrow">VIEW · 滚轮缩放</span>
      <div class="zoom-row">
        <span>{{ store.overview ? '全寺俯瞰' : '第三人称' }}</span>
        <b>{{ store.zoomScale }} · {{ store.zoomOut }}%</b>
      </div>
      <div class="zoom-bar"><i :style="{ width: `${store.zoomOut}%` }" /></div>
      <button class="zoom-btn" @click="store.setZoom(store.overview ? 'close' : 'overview')">
        {{ store.overview ? '回到人物' : '全寺一览' }}
      </button>
    </div>

    <div class="bottom-left desktop-ui">
      <div class="pad">
        <button class="key up" aria-label="前进" @pointerdown="startMove(1, 0)">↑</button>
        <button class="key left" aria-label="左转" @pointerdown="startMove(0, -1)">↶</button>
        <button class="key down" aria-label="后退" @pointerdown="startMove(-1, 0)">↓</button>
        <button class="key right" aria-label="右转" @pointerdown="startMove(0, 1)">↷</button>
      </div>
      <p class="hint">WASD 移动 · 拖曳转向 · 滚轮缩放 · Shift 加速 · E 就近蒲团跪拜</p>
    </div>

    <div class="bottom-right desktop-ui">
      <template v-if="nearHall">
        <span class="eyebrow">NEARBY HALL</span>
        <strong class="serif">{{ nearHall.name }}</strong>
        <small>{{ nearHall.deity }} · 距 {{ store.avatar.distance.toFixed(1) }}</small>
        <div class="acts">
          <button class="btn btn-primary" @click="store.interact(store.nearHallId ?? undefined)">
            于此跪拜 <kbd>E</kbd>
          </button>
        </div>
      </template>
      <template v-else>
        <span class="eyebrow">沿御道前行</span>
        <small>走近任一殿宇即可跪拜</small>
      </template>
      <button class="reset" @click="store.teleport('tianwang')">回到天王殿（山门）</button>
    </div>

    <!-- 移动端：左手摇杆走位，右手拇指键跪拜 / 换视角 / 回山门 -->
    <div class="touch-ui">
      <div class="joy-wrap">
        <VirtualJoystick @move="onJoy" />
        <span class="joy-hint">推杆行走 · 松手即停</span>
      </div>
      <div class="thumb">
        <button
          v-if="nearHall"
          class="tb kneel"
          aria-label="于此跪拜"
          @pointerdown="tap"
          @click="store.interact(store.nearHallId ?? undefined)"
        >
          <b class="serif">拜</b>
          <small>{{ nearHall.name }}</small>
        </button>
        <button
          class="tb"
          :class="{ on: store.overview }"
          :aria-label="store.overview ? '回到人物' : '全寺一览'"
          @pointerdown="tap"
          @click="store.setZoom(store.overview ? 'close' : 'overview')"
        >
          <b class="serif">{{ store.overview ? '人' : '寺' }}</b>
          <small>{{ store.overview ? '回人物' : '全寺' }}</small>
        </button>
        <button class="tb ghost" aria-label="回到天王殿" @pointerdown="tap" @click="store.teleport('tianwang')">
          <b class="serif">回</b>
          <small>天王殿</small>
        </button>
      </div>
    </div>

    <div v-if="tip" class="tip serif">左摇杆行走 · 单指拖曳环视 · 双指缩放</div>

    <div v-if="toastHall" class="toast serif">已于 {{ toastHall }} 前跪拜</div>
    <div v-else-if="nearHall && !coarse" class="toast subtle">按 E 于 {{ nearHall.name }} 前跪拜</div>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  color: #fff9ec;
  font-size: 12px;
  /* 独立合成层：HUD 每 250ms 会随运行时回传刷新一次，若与下层 WebGL 表面
   * 混在同一层，每次刷新都会连带重绘整个 iframe。这里把 HUD 单独提层。
   * 注意：所有面板都不能再用 backdrop-filter —— 跨文档 iframe 上方的毛玻璃
   * 会让 Chromium 合成器反复重捕获背景，在部分 GPU/手机上就是整屏频闪。 */
  transform: translateZ(0);
}
.hud > * {
  pointer-events: auto;
}
.eyebrow {
  color: #e6c98c;
  font-size: 10px;
  letter-spacing: 0.2em;
}
.top-left {
  position: absolute;
  top: 16px;
  left: 18px;
  padding: 10px 14px;
  background: rgba(43, 33, 28, 0.72);
  border: 1px solid rgba(255, 249, 236, 0.18);
  border-radius: var(--radius-m);
  backdrop-filter: none;
  pointer-events: none;
}
.who {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-serif);
  font-size: 14px;
  margin-top: 2px;
}
.figure {
  width: 13px;
  height: 9px;
  display: inline-block;
  background: #e8ddc6;
  border-radius: 5px 5px 3px 3px;
  position: relative;
}
.figure::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e8ddc6;
  top: -11px;
  left: 0.5px;
}
.pos {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
  font-size: 10px;
  opacity: 0.82;
}
.pos .tag {
  border-color: rgba(255, 249, 236, 0.4);
  color: #fff9ec;
  font-size: 9px;
  padding: 0 6px;
}
.pos .rise {
  color: #f0cf83;
}
.pos .inside {
  color: #ffe3b0;
  border: 1px solid rgba(255, 227, 176, 0.5);
  border-radius: 999px;
  padding: 0 6px;
}
.top-right {
  position: absolute;
  top: 16px;
  right: 18px;
  width: 168px;
  padding: 10px 12px;
  background: rgba(43, 33, 28, 0.72);
  border: 1px solid rgba(255, 249, 236, 0.18);
  border-radius: var(--radius-m);
  backdrop-filter: none;
}
.zoom-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 4px;
  font-family: var(--font-serif);
  font-size: 13px;
}
.zoom-row b {
  font-size: 11px;
  font-weight: 500;
  color: #e6c98c;
}
.zoom-bar {
  height: 3px;
  margin-top: 8px;
  background: rgba(255, 249, 236, 0.22);
  border-radius: 3px;
  overflow: hidden;
}
.zoom-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #d9b45f, #a83c32);
  transition: width 0.18s var(--ease);
}
.zoom-btn {
  width: 100%;
  margin-top: 9px;
  padding: 5px 0;
  border: 1px solid rgba(255, 249, 236, 0.35);
  border-radius: var(--radius-s);
  background: rgba(255, 252, 245, 0.1);
  color: #fff9ec;
  font-size: 11px;
  letter-spacing: 0.08em;
}
.zoom-btn:hover {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}
.bottom-left {
  position: absolute;
  left: 18px;
  bottom: 18px;
  text-align: center;
}
.pad {
  display: grid;
  grid-template-columns: repeat(3, 40px);
  grid-template-rows: repeat(2, 40px);
  gap: 5px;
}
.key {
  border: 1px solid rgba(255, 249, 236, 0.42);
  background: rgba(43, 33, 28, 0.74);
  color: #fff9ec;
  border-radius: var(--radius-s);
  font-size: 17px;
  backdrop-filter: none;
  transition: background 0.15s var(--ease);
  touch-action: none;
  user-select: none;
}
.key:hover,
.key:active {
  background: var(--cinnabar);
  border-color: #e8c9a0;
}
.key.up {
  grid-column: 2;
  grid-row: 1;
}
.key.left {
  grid-column: 1;
  grid-row: 2;
}
.key.down {
  grid-column: 2;
  grid-row: 2;
}
.key.right {
  grid-column: 3;
  grid-row: 2;
}
.hint {
  margin: 8px 0 0;
  font-size: 10px;
  color: rgba(255, 249, 236, 0.88);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.bottom-right {
  position: absolute;
  right: 18px;
  bottom: 18px;
  min-width: 218px;
  padding: 14px 16px;
  background: rgba(43, 33, 28, 0.78);
  border: 1px solid rgba(255, 249, 236, 0.2);
  border-radius: var(--radius-m);
  backdrop-filter: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.bottom-right strong {
  font-size: 19px;
  letter-spacing: 0.08em;
}
.bottom-right small {
  font-size: 10px;
  opacity: 0.8;
}
.acts {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.acts .btn {
  flex: 1;
  padding: 7px 8px;
  font-size: 11px;
  background: rgba(255, 252, 245, 0.1);
  border-color: rgba(255, 249, 236, 0.35);
  color: #fff9ec;
}
.acts .btn-primary {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}
kbd {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  opacity: 0.8;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  padding: 0 3px;
}
.reset {
  margin-top: 10px;
  padding-top: 8px;
  border: 0;
  border-top: 1px solid rgba(255, 249, 236, 0.18);
  background: transparent;
  color: rgba(255, 249, 236, 0.75);
  font-size: 10px;
  text-align: left;
}
.reset:hover {
  color: #f0cf83;
}
/* 首屏操作提示：只做提示，绝不吃手势 */
.hud > .tip {
  position: absolute;
  left: 50%;
  bottom: calc(170px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(43, 33, 28, 0.74);
  border: 1px solid rgba(255, 249, 236, 0.24);
  color: #fff9ec;
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  animation: toast-in 0.3s var(--ease);
}
.toast {
  position: absolute;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  padding: 8px 20px;
  border-radius: 999px;
  background: rgba(168, 60, 50, 0.9);
  color: #fff9ec;
  font-size: 13px;
  letter-spacing: 0.08em;
  white-space: nowrap;
  pointer-events: none;
  animation: toast-in 0.24s var(--ease);
}
@keyframes toast-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.toast.subtle {
  background: rgba(43, 33, 28, 0.74);
  border: 1px solid rgba(255, 249, 236, 0.24);
  font-size: 12px;
}
/* ---------- 移动端：虚拟摇杆 + 拇指键 ---------- */
.touch-ui {
  display: none;
}
/* 覆盖层本身不吃手势，只有摇杆与按钮吃，空白处仍可拖拽环视 */
.hud > .touch-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.joy-wrap {
  position: absolute;
  left: max(14px, env(safe-area-inset-left));
  bottom: calc(16px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  pointer-events: none;
}
.joy-wrap :deep(.joy) {
  pointer-events: auto;
}
.joy-hint {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: rgba(255, 249, 236, 0.78);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.thumb {
  position: absolute;
  right: max(14px, env(safe-area-inset-right));
  bottom: calc(18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column-reverse; /* DOM 首个（跪拜）贴拇指，其余往上排 */
  align-items: center;
  gap: 10px;
  pointer-events: none;
}
.tb {
  pointer-events: auto;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 0;
  border: 1px solid rgba(255, 249, 236, 0.42);
  background: rgba(43, 33, 28, 0.76);
  color: #fff9ec;
  box-shadow: 0 4px 14px rgba(20, 14, 10, 0.38);
  backdrop-filter: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s var(--ease), background 0.18s var(--ease);
}
.tb:active {
  transform: scale(0.94);
  background: var(--cinnabar);
}
.tb b {
  font-size: 19px;
  line-height: 1;
  font-weight: 600;
}
.tb small {
  font-size: 8px;
  line-height: 1.1;
  opacity: 0.72;
  letter-spacing: 0.02em;
  max-width: 50px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tb.kneel {
  width: 72px;
  height: 72px;
  background: var(--cinnabar);
  border-color: #e8c9a0;
  box-shadow: 0 6px 18px rgba(168, 60, 50, 0.42);
}
.tb.kneel b {
  font-size: 25px;
}
.tb.kneel small {
  font-size: 8.5px;
  opacity: 0.88;
  max-width: 66px;
}
.tb.ghost {
  width: 46px;
  height: 46px;
  background: rgba(43, 33, 28, 0.6);
}
.tb.on {
  border-color: #e8c9a0;
  background: var(--cinnabar);
}
.tb.ghost b {
  font-size: 15px;
}
.tb.ghost small {
  font-size: 7.5px;
}
@media (pointer: coarse), (max-width: 760px) {
  .desktop-ui {
    display: none !important;
  }
  .touch-ui {
    display: block;
  }
  .top-left {
    top: calc(10px + env(safe-area-inset-top));
    left: max(12px, env(safe-area-inset-left));
    padding: 7px 11px;
  }
  .top-left .eyebrow {
    display: none;
  }
  .who {
    font-size: 12px;
    margin-top: 0;
  }
  .pos {
    margin-top: 3px;
    font-size: 9px;
  }
  .toast {
    bottom: calc(160px + env(safe-area-inset-bottom));
    font-size: 12px;
    padding: 6px 14px;
  }
}
@media (max-height: 520px) {
  .tb {
    width: 50px;
    height: 50px;
  }
  .tb.kneel {
    width: 62px;
    height: 62px;
  }
  .joy-hint {
    display: none;
  }
  .toast {
    bottom: calc(122px + env(safe-area-inset-bottom));
  }
}
@media (max-width: 760px) {
  .bottom-right {
    min-width: 0;
    right: 12px;
    bottom: 12px;
  }
  .bottom-left {
    left: 12px;
    bottom: 12px;
  }
  .hint {
    display: none;
  }
  .top-left {
    top: 10px;
    left: 12px;
  }
  .top-right {
    top: 10px;
    right: 12px;
    width: 132px;
  }
}
</style>
