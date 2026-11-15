/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** true = 使用本地 mock 适配器；false = 走 /api 真实服务 */
  readonly VITE_USE_MOCK?: string
  /** 3D 运行时入口，默认 /temple/index.html */
  readonly VITE_TEMPLE_RUNTIME?: string
  /** API 基址，默认 /api */
  readonly VITE_API_BASE?: string
  /** 内容审核开关：线上环境应恒为 true */
  readonly VITE_MODERATION?: string
  /** 是否允许线上供奉相关入口（合规开关） */
  readonly VITE_ENABLE_OFFERING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
