import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * 全站只有一个视图：第三人称漫游 + 跪拜 + 滚轮缩放。
 * 3D 运行时常驻、不随路由重建；任何旧地址一律回落到漫游页。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
    meta: { title: '中軸漫游' },
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'guide' } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} · 徑山萬壽禪寺` : '徑山萬壽禪寺 · 數字漫游'
})
