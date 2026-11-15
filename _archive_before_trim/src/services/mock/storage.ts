/** localStorage 轻量仓储：无 window（测试/SSR）时退回内存，读写失败不抛错 */

const memory = new Map<string, string>()

function backend(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    /* 隐私模式下访问 localStorage 会抛错 */
  }
  return {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => void memory.set(k, v),
    removeItem: (k) => void memory.delete(k),
  }
}

export function readCollection<T>(key: string, seed: readonly T[] = []): T[] {
  try {
    const raw = backend().getItem(key)
    if (raw === null) return [...seed]
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : [...seed]
  } catch {
    return [...seed]
  }
}

export function writeCollection<T>(key: string, items: readonly T[]): void {
  try {
    backend().setItem(key, JSON.stringify(items))
  } catch {
    /* 配额不足时静默降级为内存态 */
  }
}

export const delay = (ms = 120): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
