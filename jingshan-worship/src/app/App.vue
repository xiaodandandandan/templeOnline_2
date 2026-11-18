<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<template>
  <div class="shell">
    <AppHeader />
    <main class="main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.shell {
  /* 移动端地址栏伸缩会改变 100vh，页面高度跟着变 → iframe 反复 resize →
   * WebGL 缓冲被反复重建，屏幕整片刷白，看起来就是频闪。
   * 用 dvh（动态视口高度）锁死，并禁止页面自身滚动（滚动条出现/消失同样会
   * 让视口宽度抖 15px）。旧浏览器回退到 100vh。 */
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
