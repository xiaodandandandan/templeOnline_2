import { describe, expect, it } from 'vitest'
import { RITUAL_STEPS, advanceSession, createSession } from '@/domain/worship'

describe('禮佛儀軌狀態機', () => {
  it('從第 0 步開始且處於 running', () => {
    const s = createSession('shijia', new Date('2026-11-14T00:00:00.000Z'))
    expect(s.stepIndex).toBe(0)
    expect(s.phase).toBe('running')
    expect(s.completedSteps).toEqual([])
    expect(s.finishedAt).toBeNull()
  })

  it('next 逐步推進並記錄已完成步驟', () => {
    let s = createSession('guanyin')
    s = advanceSession(s, 'next')
    expect(s.stepIndex).toBe(1)
    expect(s.completedSteps).toEqual([RITUAL_STEPS[0].key])
    s = advanceSession(s, 'prev')
    expect(s.stepIndex).toBe(0)
    expect(s.completedSteps).toEqual([RITUAL_STEPS[0].key])
  })

  it('只有可略步驟能被 skip', () => {
    const s = createSession('shijia')
    expect(advanceSession(s, 'skip')).toBe(s)
    const offering = { ...s, stepIndex: RITUAL_STEPS.findIndex((x) => x.optional) }
    const next = advanceSession(offering, 'skip')
    expect(next.stepIndex).toBe(offering.stepIndex + 1)
    expect(next.skippedSteps).toContain(RITUAL_STEPS[offering.stepIndex].key)
  })

  it('最後一步 next 直接禮成，並冪等', () => {
    let s = createSession('lingxiao')
    s = { ...s, stepIndex: RITUAL_STEPS.length - 1 }
    const done = advanceSession(s, 'next')
    expect(done.phase).toBe('completed')
    expect(done.finishedAt).not.toBeNull()
    expect(advanceSession(done, 'next')).toBe(done)
    expect(advanceSession(done, 'finish').phase).toBe('completed')
  })

  it('reset 產生全新會話且保留殿宇', () => {
    const s = { ...createSession('shijia'), stepIndex: 4, phase: 'completed' as const }
    const fresh = advanceSession(s, 'reset')
    expect(fresh.stepIndex).toBe(0)
    expect(fresh.hallId).toBe('shijia')
    expect(fresh.id).not.toBe(s.id)
  })
})
