import type { Hall } from '@/domain/hall'
import type { MeritRecord, Wish, WishCategory } from '@/domain/models'

/** 服务层契约：mock 与 http 实现可互换，store 只依赖此接口 */
export interface HallService {
  list(): Promise<readonly Hall[]>
  get(id: string): Promise<Hall | null>
}

export interface WishQuery {
  hallId?: string
  category?: WishCategory
  limit?: number
}

export interface NewWish {
  hallId: Wish['hallId']
  category: WishCategory
  text: string
  anonymous: boolean
  author: string
}

export interface WishService {
  list(query?: WishQuery): Promise<Wish[]>
  create(input: NewWish): Promise<Wish>
}

export interface MeritService {
  list(): Promise<MeritRecord[]>
  save(record: MeritRecord): Promise<MeritRecord>
  clear(): Promise<void>
}

export interface ServiceRegistry {
  halls: HallService
  wishes: WishService
  merits: MeritService
}
