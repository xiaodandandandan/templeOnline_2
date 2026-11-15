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
  height: calc(100vh - var(--header-h));
  min-height: 520px;
}
</style>
