import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

/**
 * 全站只有一个视图：第三人称漫游 + 跪拜 + 滚轮缩放。
 * 3D 运行时常驻、不随路由重建；任何旧地址一律回落到漫游页。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
    meta: { title: '中轴漫游' },
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'guide' } },
]

export const router = createRouter({
  // hash 路由：兼容 file:// 单文件直接打开（无需服务器 rewrite），部署到子路径也免配置
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} · 径山万寿禅寺` : '径山万寿禅寺 · 数字漫游'
})
