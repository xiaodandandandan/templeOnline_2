<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getHall } from '@/domain/hall'
import { useTempleStore } from '@/stores/temple'

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
}
onMounted(() => {
  window.addEventListener('pointerup', stopMove)
  window.addEventListener('pointercancel', stopMove)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', stopMove)
  window.removeEventListener('pointercancel', stopMove)
  window.clearTimeout(toastTimer)
  stopMove()
})
</script>

<template>
  <div class="hud">
    <div class="top-left">
      <span class="eyebrow">THIRD PERSON</span>
      <div class="who"><i class="figure" />方塊人物 · 第三人稱</div>
      <div class="pos">
        <span>{{ store.position }}</span>
        <span v-if="store.avatar.onTerrace" class="tag rise">高台</span>
        <span v-if="store.isMoving" class="tag walk">行走中</span>
        <span v-if="store.insideHallId" class="tag inside">
          殿內<span v-if="seatCount"> · {{ seatCount }} 席</span>
        </span>
      </div>
    </div>

    <div class="top-right">
      <span class="eyebrow">VIEW · 滾輪縮放</span>
      <div class="zoom-row">
        <span>{{ store.overview ? '全寺俯瞰' : '第三人稱' }}</span>
        <b>{{ store.zoomScale }} · {{ store.zoomOut }}%</b>
      </div>
      <div class="zoom-bar"><i :style="{ width: `${store.zoomOut}%` }" /></div>
      <button class="zoom-btn" @click="store.setZoom(store.overview ? 'close' : 'overview')">
        {{ store.overview ? '回到人物' : '全寺一覽' }}
      </button>
    </div>

    <div class="bottom-left">
      <div class="pad">
        <button class="key up" aria-label="前進" @pointerdown="startMove(1, 0)">↑</button>
        <button class="key left" aria-label="左轉" @pointerdown="startMove(0, -1)">↶</button>
        <button class="key down" aria-label="後退" @pointerdown="startMove(-1, 0)">↓</button>
        <button class="key right" aria-label="右轉" @pointerdown="startMove(0, 1)">↷</button>
      </div>
      <p class="hint">WASD 移動 · 拖曳轉向 · 滾輪縮放 · Shift 加速 · E 就近蒲團跪拜</p>
    </div>

    <div class="bottom-right">
      <template v-if="nearHall">
        <span class="eyebrow">NEARBY HALL</span>
        <strong class="serif">{{ nearHall.name }}</strong>
        <small>{{ nearHall.deity }} · 距 {{ store.avatar.distance.toFixed(1) }}</small>
        <div class="acts">
          <button class="btn btn-primary" @click="store.interact(store.nearHallId ?? undefined)">
            於此跪拜 <kbd>E</kbd>
          </button>
        </div>
      </template>
      <template v-else>
        <span class="eyebrow">沿御道前行</span>
        <small>走近任一殿宇即可跪拜</small>
      </template>
      <button class="reset" @click="store.teleport('tianwang')">回到天王殿（山門）</button>
    </div>

    <div v-if="toastHall" class="toast serif">已於 {{ toastHall }} 前跪拜</div>
    <div v-else-if="nearHall" class="toast subtle">按 E 於 {{ nearHall.name }} 前跪拜</div>
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
  background: rgba(43, 33, 28, 0.58);
  border: 1px solid rgba(255, 249, 236, 0.18);
  border-radius: var(--radius-m);
  backdrop-filter: blur(8px);
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
  background: rgba(43, 33, 28, 0.58);
  border: 1px solid rgba(255, 249, 236, 0.18);
  border-radius: var(--radius-m);
  backdrop-filter: blur(8px);
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
  background: rgba(43, 33, 28, 0.62);
  color: #fff9ec;
  border-radius: var(--radius-s);
  font-size: 17px;
  backdrop-filter: blur(6px);
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
  background: rgba(43, 33, 28, 0.66);
  border: 1px solid rgba(255, 249, 236, 0.2);
  border-radius: var(--radius-m);
  backdrop-filter: blur(8px);
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
  background: rgba(43, 33, 28, 0.62);
  border: 1px solid rgba(255, 249, 236, 0.24);
  font-size: 12px;
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
