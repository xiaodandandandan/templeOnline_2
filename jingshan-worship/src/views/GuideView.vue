<script setup lang="ts">
import TempleCanvas from '@/components/temple/TempleCanvas.vue'
</script>

<template>
  <div class="guide">
    <TempleCanvas />
  </div>
</template>

<style scoped>
.guide {
  /* 高度交给父级 flex 决定，不再用 calc(100vh - header)。
   * 原来 100vh 会随手机地址栏伸缩变化，且 min-height 在矮视口下会撑出滚动条，
   * 两者叠加让 iframe 持续在 696px ↔ 700px 之间跳动，WebGL 每跳一次就重建缓冲。 */
  height: 100%;
  min-height: 0;
}
</style>
