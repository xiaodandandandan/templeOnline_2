/**
 * 真实后端适配器骨架。
 * 切到真实服务：.env 里设 VITE_USE_MOCK=false，后端按下列路径实现即可，
 * store / 组件无需改动（依赖 contracts.ts 接口）。
 */
import { appConfig } from '@/app/config'
import type {
  HallService,
  MeritService,
  NewWish,
  ServiceRegistry,
  WishQuery,
  WishService,
} from '../contracts'
import type { Hall } from '@/domain/hall'
import type { MeritRecord, Wish } from '@/domain/models'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${appConfig.apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return (await res.json()) as T
}

const hallService: HallService = {
  list: () => request<readonly Hall[]>('/halls'),
  get: (id) => request<Hall | null>(`/halls/${encodeURIComponent(id)}`),
}

const wishService: WishService = {
  list: (query: WishQuery = {}) => {
    const qs = new URLSearchParams()
    if (query.hallId) qs.set('hallId', query.hallId)
    if (query.category) qs.set('category', query.category)
    if (query.limit) qs.set('limit', String(query.limit))
    return request<Wish[]>(`/wishes?${qs.toString()}`)
  },
  create: (input: NewWish) =>
    request<Wish>('/wishes', { method: 'POST', body: JSON.stringify(input) }),
}

const meritService: MeritService = {
  list: () => request<MeritRecord[]>('/merits'),
  save: (record: MeritRecord) =>
    request<MeritRecord>('/merits', { method: 'POST', body: JSON.stringify(record) }),
  clear: () => request<void>('/merits', { method: 'DELETE' }),
}

export const httpServices: ServiceRegistry = {
  halls: hallService,
  wishes: wishService,
  merits: meritService,
}
