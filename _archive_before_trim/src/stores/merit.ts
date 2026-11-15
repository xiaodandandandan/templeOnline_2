import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MeritRecord } from '@/domain/models'
import { services } from '@/services'

export const useMeritStore = defineStore('merit', () => {
  const records = ref<MeritRecord[]>([])
  const loading = ref(false)
  const error = ref('')

  const total = computed(() => records.value.length)
  const hallIds = computed(
    () => new Set(records.value.map((r) => r.hallId)).size,
  )

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      records.value = await services.merits.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '记录读取失败'
    } finally {
      loading.value = false
    }
  }

  async function clear(): Promise<void> {
    await services.merits.clear()
    records.value = []
  }

  return { records, loading, error, total, hallIds, refresh, clear }
})
