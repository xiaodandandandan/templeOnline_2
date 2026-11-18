<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getHall } from '@/domain/hall'
import { useMeritStore } from '@/stores/merit'

const store = useMeritStore()
onMounted(() => void store.refresh())

const fmt = (iso: string): string => iso.replace('T', ' ').slice(0, 16)
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <span class="eyebrow">LOCAL RECORDS · NO MERIT SCORING</span>
        <h1 class="serif">礼佛记录</h1>
        <p>仅记录仪轨完成情况与时间，不作功德量化、不排名、不与任何权益挂钩。</p>
      </div>
      <div class="stats">
        <div><b>{{ store.total }}</b><span>次礼成</span></div>
        <div><b>{{ store.hallIds }}</b><span>座殿宇</span></div>
      </div>
    </header>

    <section class="panel table">
      <div class="thead">
        <span>时间</span><span>殿宇</span><span>完成</span><span>略过</span><span>供品</span>
      </div>
      <p v-if="store.loading" class="empty">读取中…</p>
      <p v-else-if="!store.records.length" class="empty">
        尚无记录。<RouterLink to="/">前往导览</RouterLink> 选择殿宇并完成一次仪轨。
      </p>
      <div v-for="r in store.records" :key="r.id" class="tr">
        <span class="muted">{{ fmt(r.finishedAt) }}</span>
        <span class="serif">{{ getHall(r.hallId).name }}</span>
        <span>{{ r.completedSteps.length }} 步</span>
        <span>{{ r.skippedSteps.length }} 步</span>
        <span>{{ r.offerings.length }} 项</span>
      </div>
      <div v-if="store.records.length" class="foot">
        <button class="btn btn-ghost" @click="store.clear()">清空本地记录</button>
      </div>
      <p v-if="store.error" class="error">{{ store.error }}</p>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
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
  max-width: 520px;
}
.stats {
  display: flex;
  gap: 22px;
}
.stats div {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stats b {
  font-family: var(--font-serif);
  font-size: 26px;
  color: var(--cinnabar);
}
.stats span {
  font-size: 10px;
  color: var(--ink-3);
}
.table {
  overflow: hidden;
}
.thead,
.tr {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.7fr 0.7fr 0.7fr;
  gap: 8px;
  padding: 12px 18px;
  font-size: 12px;
}
.thead {
  background: var(--paper-2);
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
}
.tr {
  border-top: 1px solid var(--line);
}
.empty {
  padding: 34px 18px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-3);
}
.empty a {
  color: var(--cinnabar);
}
.foot {
  border-top: 1px solid var(--line);
  padding: 8px 14px;
  text-align: right;
}
.foot .btn {
  font-size: 11px;
  color: var(--ink-3);
}
.error {
  padding: 0 18px 12px;
  color: var(--cinnabar);
  font-size: 11px;
}
@media (max-width: 700px) {
  .thead {
    display: none;
  }
  .tr {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
