<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AXIS_HALLS, type HallId } from '@/domain/hall'
import { WISH_CATEGORIES, type WishCategory } from '@/domain/models'
import { appConfig } from '@/app/config'
import { useWishStore } from '@/stores/wish'
import WishCard from '@/components/wish/WishCard.vue'

const store = useWishStore()
const text = ref('')
const category = ref<WishCategory>('peace')
const hallId = ref<HallId>('guanyin')
const anonymity = ref(true)
const author = ref('')
const notice = ref('')

onMounted(() => void store.refresh())

async function submit(): Promise<void> {
  const result = await store.submit({
    hallId: hallId.value,
    category: category.value,
    text: text.value,
    anonymous: anonymity.value,
    author: author.value,
  })
  if (result) {
    text.value = ''
    notice.value = appConfig.moderation ? '已寫下，待審核（僅本設備可見）' : '已寫下'
    window.setTimeout(() => (notice.value = ''), 3200)
  }
}
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <span class="eyebrow">WISH WALL · MODERATED CONTENT</span>
        <h1 class="serif">祈願牆</h1>
        <p>文字留存於本設備；新增內容依開關進入審核態，不含任何交易或實物供養。</p>
      </div>
      <div class="count"><b>{{ store.visible.length }}</b><span>則</span></div>
    </header>

    <div class="layout">
      <section class="form panel">
        <span class="eyebrow">寫下一句</span>
        <label class="field">
          <span>殿宇</span>
          <select v-model="hallId">
            <option v-for="h in AXIS_HALLS" :key="h.id" :value="h.id">{{ h.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>類別</span>
          <select v-model="category">
            <option v-for="c in WISH_CATEGORIES" :key="c.key" :value="c.key">{{ c.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>祈願文字</span>
          <textarea v-model="text" rows="4" maxlength="120" placeholder="願…" />
          <small>{{ text.length }} / 120</small>
        </label>
        <label class="check">
          <input v-model="anonymity" type="checkbox" />
          <span>匿名</span>
        </label>
        <label v-if="!anonymity" class="field">
          <span>署名</span>
          <input v-model="author" maxlength="20" placeholder="可留空" />
        </label>
        <button class="btn btn-primary wide" :disabled="store.submitting" @click="submit">
          {{ store.submitting ? '提交中…' : '寫下祈願' }}
        </button>
        <p v-if="notice" class="notice">{{ notice }}</p>
        <p v-if="store.error" class="error">{{ store.error }}</p>
      </section>

      <section class="list-wrap">
        <div class="filters">
          <select v-model="store.hallFilter" aria-label="按殿宇篩選">
            <option value="">全部殿宇</option>
            <option v-for="h in AXIS_HALLS" :key="h.id" :value="h.id">{{ h.name }}</option>
          </select>
          <select v-model="store.categoryFilter" aria-label="按類別篩選">
            <option value="">全部類別</option>
            <option v-for="c in WISH_CATEGORIES" :key="c.key" :value="c.key">{{ c.label }}</option>
          </select>
          <button class="btn btn-ghost" @click="store.refresh()">刷新</button>
        </div>

        <p v-if="store.loading" class="muted">讀取中…</p>
        <div v-else class="list">
          <WishCard v-for="w in store.visible" :key="w.id" :wish="w" />
          <p v-if="!store.visible.length" class="muted">尚無符合條件的祈願。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 26px 26px 46px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}
.head h1 {
  font-size: 28px;
  margin-top: 4px;
}
.head p {
  font-size: 12px;
  color: var(--ink-3);
  margin: 4px 0 0;
}
.count b {
  font-family: var(--font-serif);
  font-size: 32px;
  color: var(--cinnabar);
}
.count span {
  font-size: 11px;
  color: var(--ink-3);
  margin-left: 4px;
}
.layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.form {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: var(--ink-3);
  position: relative;
}
.field select,
.field input,
.field textarea,
.filters select {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-s);
  background: var(--paper-3);
  padding: 8px 10px;
  font-size: 13px;
  color: var(--ink);
  resize: vertical;
}
.field small {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 10px;
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.wide {
  width: 100%;
}
.notice {
  font-size: 11px;
  color: var(--jade);
  margin: 0;
}
.error {
  font-size: 11px;
  color: var(--cinnabar);
  margin: 0;
}
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.filters .btn {
  margin-left: auto;
  font-size: 12px;
}
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  align-items: stretch;
}
@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .page {
    padding: 18px;
  }
}
</style>
