/** 环境变量集中解析：组件与 store 不直接读 import.meta.env */
export const appConfig = {
  templeRuntime: import.meta.env.VITE_TEMPLE_RUNTIME ?? '/temple/index.html',
} as const

export type AppConfig = typeof appConfig
