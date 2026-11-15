<script setup lang="ts">
import { computed } from 'vue'
import { getHall } from '@/domain/hall'
import { WISH_CATEGORIES, type Wish as WishModel } from '@/domain/models'

const props = defineProps<{ wish: WishModel }>()

const category = computed(
  () => WISH_CATEGORIES.find((c) => c.key === props.wish.category)?.label ?? '其他',
)
const date = computed(() => props.wish.createdAt.slice(0, 10))
const hallName = computed(() => getHall(props.wish.hallId).name)
const statusText = computed(() =>
  props.wish.status === 'pending' ? '待審核' : props.wish.status === 'hidden' ? '已隱藏' : '',
)
</script>

<template>
  <article class="card panel" :class="{ pending: wish.status === 'pending' }">
    <div class="top">
      <span class="cat">{{ category }}</span>
      <span class="hall">{{ hallName }}</span>
      <span v-if="statusText" class="state">{{ statusText }}</span>
    </div>
    <p class="serif">「{{ wish.text }}」</p>
    <div class="bottom">
      <span>{{ wish.anonymous ? '匿名' : wish.author || '匿名' }}</span>
      <span>{{ date }}</span>
    </div>
  </article>
</template>

<style scoped>
.card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 2px solid var(--gold-soft);
}
.card.pending {
  border-top-color: var(--ink-3);
  opacity: 0.78;
}
.top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}
.cat {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(184, 147, 77, 0.18);
  color: var(--chestnut);
}
.hall,
.state {
  color: var(--ink-3);
}
.state {
  margin-left: auto;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 1px 7px;
}
.card p {
  margin: 0;
  font-size: 16px;
  line-height: 1.9;
  letter-spacing: 0.04em;
  color: var(--ink);
  flex: 1;
}
.bottom {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--ink-3);
  border-top: 1px dashed var(--line);
  padding-top: 8px;
}
</style>
