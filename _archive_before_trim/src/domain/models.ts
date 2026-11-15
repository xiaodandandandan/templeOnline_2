/** 祈愿与记录：带审核态字段，便于接入内容治理 */
import type { HallId } from './hall'

export type WishCategory = 'peace' | 'health' | 'study' | 'family' | 'world'
export type ModerationStatus = 'pending' | 'approved' | 'hidden'

export interface Wish {
  id: string
  hallId: HallId
  category: WishCategory
  text: string
  anonymous: boolean
  author: string
  createdAt: string
  status: ModerationStatus
}

export const WISH_CATEGORIES: readonly { key: WishCategory; label: string }[] = [
  { key: 'peace', label: '平安' },
  { key: 'health', label: '康健' },
  { key: 'study', label: '学业' },
  { key: 'family', label: '家亲' },
  { key: 'world', label: '世间' },
] as const

export interface MeritRecord {
  id: string
  sessionId: string
  hallId: HallId
  completedSteps: string[]
  skippedSteps: string[]
  offerings: string[]
  finishedAt: string
}

/** 仅用于本地演示的初始祈愿，不代表真实用户内容 */
export const SEED_WISHES: readonly Wish[] = [
  {
    id: 'seed-1',
    hallId: 'guanyin',
    category: 'peace',
    text: '愿家中长辈四时安稳，岁月无惊。',
    anonymous: true,
    author: '',
    createdAt: '2026-11-10T09:20:00.000Z',
    status: 'approved',
  },
  {
    id: 'seed-2',
    hallId: 'shijia',
    category: 'world',
    text: '愿往来行人各得其所，路上有灯。',
    anonymous: true,
    author: '',
    createdAt: '2026-11-11T02:40:00.000Z',
    status: 'approved',
  },
  {
    id: 'seed-3',
    hallId: 'lingxiao',
    category: 'study',
    text: '愿心不散乱，读过的书都记得。',
    anonymous: false,
    author: '过客',
    createdAt: '2026-11-12T11:05:00.000Z',
    status: 'approved',
  },
] as const
