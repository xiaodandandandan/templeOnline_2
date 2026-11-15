/** 礼佛仪式：纯数据与状态机定义，不含任何副作用 */
export type RitualStepKey =
  | 'cleansing'
  | 'incense'
  | 'offering'
  | 'bow'
  | 'chant'
  | 'dedication'

export interface RitualStep {
  key: RitualStepKey
  title: string
  subtitle: string
  instruction: string
  /** 建议时长（秒），仅作节奏提示，不强制计时 */
  seconds: number
  optional: boolean
}

export const RITUAL_STEPS: readonly RitualStep[] = [
  {
    key: 'cleansing',
    title: '净手 · 整容',
    subtitle: '入殿之前',
    instruction: '盥手、正衣冠，收摄心念，缓步至殿前月台。',
    seconds: 20,
    optional: false,
  },
  {
    key: 'incense',
    title: '上香 · 三支',
    subtitle: '香供养',
    instruction: '双手持香，举至眉心；点燃后不用口吹，以手轻扇；依次插入香炉。',
    seconds: 40,
    optional: false,
  },
  {
    key: 'offering',
    title: '献供 · 花灯果水',
    subtitle: '供品为虚拟演示，无实物与交易',
    instruction: '于案前陈设花、灯、果、净水，端立合掌。',
    seconds: 30,
    optional: true,
  },
  {
    key: 'bow',
    title: '问讯 · 三拜',
    subtitle: '礼敬',
    instruction: '合掌当胸，俯身问讯；三拜起立，动作舒缓。',
    seconds: 60,
    optional: false,
  },
  {
    key: 'chant',
    title: '诵持 · 静念',
    subtitle: '经偈或静坐',
    instruction: '随文入观，或静坐片刻；不设音频自动播放。',
    seconds: 90,
    optional: true,
  },
  {
    key: 'dedication',
    title: '回向 · 留存',
    subtitle: '礼成',
    instruction: '将所愿回向众生，可自愿写下祈愿文字并留存于本设备。',
    seconds: 30,
    optional: false,
  },
] as const

export type OfferingKind = 'flower' | 'lamp' | 'fruit' | 'water' | 'incense'

export interface OfferingItem {
  kind: OfferingKind
  label: string
  note: string
}

export const OFFERINGS: readonly OfferingItem[] = [
  { kind: 'incense', label: '香', note: '三支，表戒定慧' },
  { kind: 'flower', label: '花', note: '表因行与无常' },
  { kind: 'lamp', label: '灯', note: '表智慧明照' },
  { kind: 'fruit', label: '果', note: '表修因证果' },
  { kind: 'water', label: '净水', note: '表清净平等' },
] as const

/** 会话状态机的合法迁移 */
export type RitualPhase = 'idle' | 'running' | 'completed'

export interface RitualSession {
  id: string
  hallId: string
  startedAt: string
  stepIndex: number
  completedSteps: RitualStepKey[]
  skippedSteps: RitualStepKey[]
  offerings: OfferingKind[]
  phase: RitualPhase
  finishedAt: string | null
}

export function createSession(hallId: string, now = new Date()): RitualSession {
  return {
    id: `rit-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    hallId,
    startedAt: now.toISOString(),
    stepIndex: 0,
    completedSteps: [],
    skippedSteps: [],
    offerings: [],
    phase: 'running',
    finishedAt: null,
  }
}

/** 纯函数迁移，便于单测与重放 */
export function advanceSession(
  session: RitualSession,
  action: 'next' | 'prev' | 'skip' | 'finish' | 'reset',
  now = new Date(),
): RitualSession {
  const step = RITUAL_STEPS[session.stepIndex]
  switch (action) {
    case 'next': {
      if (session.phase !== 'running' || !step) return session
      const completedSteps = session.completedSteps.includes(step.key)
        ? session.completedSteps
        : [...session.completedSteps, step.key]
      const nextIndex = session.stepIndex + 1
      if (nextIndex >= RITUAL_STEPS.length) {
        return {
          ...session,
          completedSteps,
          stepIndex: RITUAL_STEPS.length - 1,
          phase: 'completed',
          finishedAt: now.toISOString(),
        }
      }
      return { ...session, completedSteps, stepIndex: nextIndex }
    }
    case 'prev':
      return { ...session, stepIndex: Math.max(0, session.stepIndex - 1) }
    case 'skip': {
      if (session.phase !== 'running' || !step || !step.optional) return session
      const skippedSteps = session.skippedSteps.includes(step.key)
        ? session.skippedSteps
        : [...session.skippedSteps, step.key]
      const nextIndex = session.stepIndex + 1
      if (nextIndex >= RITUAL_STEPS.length) {
        return {
          ...session,
          skippedSteps,
          stepIndex: RITUAL_STEPS.length - 1,
          phase: 'completed',
          finishedAt: now.toISOString(),
        }
      }
      return { ...session, skippedSteps, stepIndex: nextIndex }
    }
    case 'finish':
      return {
        ...session,
        phase: 'completed',
        stepIndex: RITUAL_STEPS.length - 1,
        finishedAt: now.toISOString(),
      }
    case 'reset':
      return createSession(session.hallId, now)
  }
}
