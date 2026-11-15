import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Wish, WishCategory } from '@/domain/models'
import type { NewWish } from '@/services/contracts'
import { services } from '@/services'

export const useWishStore = defineStore('wish', () => {
  const items = ref<Wish[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const hallFilter = ref<string>('')
  const categoryFilter = ref<WishCategory | ''>('')

  const visible = computed(() =>
    items.value.filter(
      (w) =>
        (!hallFilter.value || w.hallId === hallFilter.value) &&
        (!categoryFilter.value || w.category === categoryFilter.value),
    ),
  )

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      items.value = await services.wishes.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '祈愿读取失败'
    } finally {
      loading.value = false
    }
  }

  async function submit(input: NewWish): Promise<Wish | null> {
    if (!input.text.trim()) {
      error.value = '请先写下祈愿文字'
      return null
    }
    submitting.value = true
    error.value = ''
    try {
      const wish = await services.wishes.create(input)
      items.value = [wish, ...items.value]
      return wish
    } catch (e) {
      error.value = e instanceof Error ? e.message : '提交失败'
      return null
    } finally {
      submitting.value = false
    }
  }

  return {
    items,
    visible,
    loading,
    submitting,
    error,
    hallFilter,
    categoryFilter,
    refresh,
    submit,
  }
})
