import { appConfig } from '@/app/config'
import type { ServiceRegistry } from './contracts'
import { mockServices } from './mock'
import { httpServices } from './http'

/** 依赖注入点：一处切换 mock / 真实后端 */
export const services: ServiceRegistry = appConfig.useMock ? mockServices : httpServices
export type { ServiceRegistry } from './contracts'
