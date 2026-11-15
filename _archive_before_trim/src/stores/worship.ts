import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  RITUAL_STEPS,
  advanceSession,
  createSession,
  type OfferingKind,
  type RitualSession,
  type RitualStep,
} from '@/domain/worship'
import type { HallId } from '@/domain/hall'
import type { MeritRecord } from '@/domain/models'
import { services } from '@/services'
import { useMeritStore } from './merit'

/** 仪式状态机：会话只在前端持有，完成后落一条本地记录 */
export const useWorshipStore = defineStore('worship', () => {
  const session = ref<RitualSession | null>(null)
  const saved = ref<MeritRecord | null>(null)
  const saving = ref(false)
  const error = ref('')

  const currentStep = computed<RitualStep | null>(
    () => RITUAL_STEPS[session.value?.stepIndex ?? -1] ?? null,
  )
  const progress = computed(() => {
    if (!session.value) return 0
    if (session.value.phase === 'completed') return 100
    return Math.round((session.value.stepIndex / RITUAL_STEPS.length) * 100)
  })
  const isCompleted = computed(() => session.value?.phase === 'completed')

  function start(hallId: HallId): void {
    session.value = createSession(hallId)
    saved.value = null
    error.value = ''
  }

  function apply(action: 'next' | 'prev' | 'skip' | 'finish' | 'reset'): void {
    if (!session.value) return
    session.value = advanceSession(session.value, action)
  }

  function toggleOffering(kind: OfferingKind): void {
    if (!session.value) return
    const list = session.value.offerings
    session.value = {
      ...session.value,
      offerings: list.includes(kind) ? list.filter((o) => o !== kind) : [...list, kind],
    }
  }

  /** 礼成：把会话固化为记录，并同步记录列表 */
  async function complete(): Promise<MeritRecord | null> {
    const s = session.value
    if (!s || s.phase !== 'completed') return null
    saving.value = true
    error.value = ''
    try {
      const record: MeritRecord = {
        id: `merit-${s.id}`,
        sessionId: s.id,
        hallId: s.hallId as HallId,
        completedSteps: s.completedSteps,
        skippedSteps: s.skippedSteps,
        offerings: s.offerings,
        finishedAt: s.finishedAt ?? new Date().toISOString(),
      }
      saved.value = await services.merits.save(record)
      const meritStore = useMeritStore()
      await meritStore.refresh()
      return saved.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : '记录保存失败'
      return null
    } finally {
      saving.value = false
    }
  }

  function clear(): void {
    session.value = null
    saved.value = null
    error.value = ''
  }

  return {
    session,
    saved,
    saving,
    error,
    currentStep,
    progress,
    isCompleted,
    start,
    apply,
    toggleOffering,
    complete,
    clear,
  }
})
