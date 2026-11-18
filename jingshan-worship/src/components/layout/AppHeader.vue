<script setup lang="ts">
import { computed } from 'vue'
import { useTempleStore } from '@/stores/temple'

const store = useTempleStore()
const status = computed(() => (store.ready ? '三维就绪' : '载入中'))
</script>

<template>
  <header class="header">
    <div class="brand">
      <span class="seal">径</span>
      <span class="brand-txt">
        <strong class="serif">径山万寿禅寺</strong>
      </span>
    </div>

    <div class="tip">滚轮缩放 · 拉远可览全寺</div>

    <div class="status" :class="{ on: store.ready }">
      <i class="dot" />
      <span>{{ status }}</span>
    </div>
  </header>
</template>

<style scoped>
.header {
  /* 刘海屏：内容让进安全区，页头总高度同步加高，避免品牌被状态栏压住 */
  height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  display: flex;
  align-items: center;
  gap: 28px;
  padding-left: 26px;
  padding-right: 26px;
  background: rgba(255, 252, 245, 0.97);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 30;
  /* 页头常驻在 3D 画布上方：这里若用 backdrop-filter，合成器需要不断从跨文档
   * iframe 重捕获背景，移动端会持续闪烁并明显掉帧。改用接近不透明的底色。 */
  transform: translateZ(0);
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}
.seal {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background: var(--cinnabar);
  color: #fff;
  border-radius: 5px;
  font-family: var(--font-serif);
  font-size: 20px;
}
.brand-txt {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.brand-txt strong {
  font-size: 16px;
  letter-spacing: 0.12em;
}
.tip {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}
.status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--ink-3);
  padding-left: 20px;
  border-left: 1px solid var(--line);
  white-space: nowrap;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink-3);
}
.status.on .dot {
  background: var(--jade);
  box-shadow: 0 0 0 3px rgba(74, 106, 98, 0.14);
}
@media (max-width: 900px) {
  .header {
    gap: 12px;
    padding-left: max(14px, env(safe-area-inset-left, 0px));
    padding-right: max(14px, env(safe-area-inset-right, 0px));
  }
  .status,
  .tip {
    display: none;
  }
}
</style>
