<script setup lang="ts">
import { computed } from 'vue'
import { useTempleStore } from '@/stores/temple'

const store = useTempleStore()
const status = computed(() => (store.ready ? '三維就緒' : '載入中'))
</script>

<template>
  <header class="header">
    <div class="brand">
      <span class="seal">徑</span>
      <span class="brand-txt">
        <strong class="serif">徑山萬壽禪寺</strong>
      </span>
    </div>

    <div class="tip">滾輪縮放 · 拉遠可覽全寺</div>

    <div class="status" :class="{ on: store.ready }">
      <i class="dot" />
      <span>{{ status }}</span>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 26px;
  background: rgba(255, 252, 245, 0.92);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(10px);
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
    padding: 0 14px;
  }
  .status,
  .tip {
    display: none;
  }
}
</style>
