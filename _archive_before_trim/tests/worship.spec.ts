import { describe, expect, it } from 'vitest'
import { RITUAL_STEPS, advanceSession, createSession } from '@/domain/worship'

describe('礼佛仪轨状态机', () => {
  it('从第 0 步开始且处于 running', () => {
    const s = createSession('shijia', new Date('2026-11-14T00:00:00.000Z'))
    expect(s.stepIndex).toBe(0)
    expect(s.phase).toBe('running')
    expect(s.completedSteps).toEqual([])
    expect(s.finishedAt).toBeNull()
  })

  it('next 逐步推进并记录已完成步骤', () => {
    let s = createSession('guanyin')
    s = advanceSession(s, 'next')
    expect(s.stepIndex).toBe(1)
    expect(s.completedSteps).toEqual([RITUAL_STEPS[0].key])
    s = advanceSession(s, 'prev')
    expect(s.stepIndex).toBe(0)
    expect(s.completedSteps).toEqual([RITUAL_STEPS[0].key])
  })

  it('只有可略步骤能被 skip', () => {
    const s = createSession('shijia')
    expect(advanceSession(s, 'skip')).toBe(s)
    const offering = { ...s, stepIndex: RITUAL_STEPS.findIndex((x) => x.optional) }
    const next = advanceSession(offering, 'skip')
    expect(next.stepIndex).toBe(offering.stepIndex + 1)
    expect(next.skippedSteps).toContain(RITUAL_STEPS[offering.stepIndex].key)
  })

  it('最后一步 next 直接礼成，并幂等', () => {
    let s = createSession('lingxiao')
    s = { ...s, stepIndex: RITUAL_STEPS.length - 1 }
    const done = advanceSession(s, 'next')
    expect(done.phase).toBe('completed')
    expect(done.finishedAt).not.toBeNull()
    expect(advanceSession(done, 'next')).toBe(done)
    expect(advanceSession(done, 'finish').phase).toBe('completed')
  })

  it('reset 产生全新会话且保留殿宇', () => {
    const s = { ...createSession('shijia'), stepIndex: 4, phase: 'completed' as const }
    const fresh = advanceSession(s, 'reset')
    expect(fresh.stepIndex).toBe(0)
    expect(fresh.hallId).toBe('shijia')
    expect(fresh.id).not.toBe(s.id)
  })
})
