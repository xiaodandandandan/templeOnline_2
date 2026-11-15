import { HALLS, type Hall } from '@/domain/hall'
import { SEED_WISHES, type MeritRecord, type Wish } from '@/domain/models'
import { appConfig } from '@/app/config'
import type {
  HallService,
  MeritService,
  NewWish,
  ServiceRegistry,
  WishQuery,
  WishService,
} from '../contracts'
import { delay, readCollection, uid, writeCollection } from './storage'

const K_WISH = 'jingshan:wishes:v1'
const K_MERIT = 'jingshan:merits:v1'

const hallService: HallService = {
  async list() {
    await delay(40)
    return HALLS
  },
  async get(id) {
    await delay(40)
    return HALLS.find((h) => h.id === id) ?? null
  },
}

const wishService: WishService = {
  async list(query: WishQuery = {}) {
    await delay()
    let rows = readCollection<Wish>(K_WISH, SEED_WISHES)
    // 演示数据也过一遍审核态，便于验证内容治理开关
    rows = rows.filter((w) => w.status !== 'hidden')
    if (query.hallId) rows = rows.filter((w) => w.hallId === query.hallId)
    if (query.category) rows = rows.filter((w) => w.category === query.category)
    rows = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return query.limit ? rows.slice(0, query.limit) : rows
  },
  async create(input: NewWish): Promise<Wish> {
    await delay()
    const wish: Wish = {
      id: uid('wish'),
      ...input,
      text: input.text.trim().slice(0, 120),
      author: input.anonymous ? '' : input.author.trim().slice(0, 20),
      createdAt: new Date().toISOString(),
      status: appConfig.moderation ? 'pending' : 'approved',
    }
    writeCollection(K_WISH, [wish, ...readCollection<Wish>(K_WISH, SEED_WISHES)])
    return wish
  },
}

const meritService: MeritService = {
  async list() {
    await delay(60)
    return readCollection<MeritRecord>(K_MERIT).sort((a, b) =>
      b.finishedAt.localeCompare(a.finishedAt),
    )
  },
  async save(record: MeritRecord) {
    await delay(60)
    const rows = readCollection<MeritRecord>(K_MERIT)
    writeCollection(K_MERIT, [record, ...rows.filter((r) => r.id !== record.id)])
    return record
  },
  async clear() {
    await delay(60)
    writeCollection<MeritRecord>(K_MERIT, [])
  },
}

export const mockServices: ServiceRegistry = {
  halls: hallService,
  wishes: wishService,
  merits: meritService,
}

export type { Hall }
