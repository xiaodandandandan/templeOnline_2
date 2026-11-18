<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { AXIS_HALLS, getHall, isHallId } from '@/domain/hall'
import { useTempleStore } from '@/stores/temple'

const route = useRoute()
const router = useRouter()
const store = useTempleStore()

const raw = String(route.params.id)
const hall = computed(() => getHall(isHallId(raw) ? raw : 'tianwang'))
const neighbours = computed(() => {
  const i = AXIS_HALLS.findIndex((h) => h.id === hall.value.id)
  return AXIS_HALLS.filter((_, idx) => Math.abs(idx - i) === 1)
})

function focusInScene(): void {
  store.selectHall(hall.value.id)
  void router.push('/')
}
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <span class="eyebrow">HALL DETAIL · {{ hall.elevated ? 'ELEVATED TERRACE' : 'SAME LEVEL' }}</span>
        <h1 class="serif">{{ hall.name }}</h1>
        <p>{{ hall.deity }}</p>
      </div>
      <RouterLink class="btn" to="/">← 返回导览</RouterLink>
    </header>

    <div class="grid">
      <section class="hero panel">
        <div class="hero-img" />
        <div class="hero-cap">
          <span>程序化三维复原 · 全寺俯瞰</span>
          <span>Z {{ hall.box.z }} / Y {{ hall.box.baseY }}</span>
        </div>
      </section>

      <section class="detail panel">
        <span class="eyebrow">形制与位置</span>
        <h2 class="serif">殿宇说明</h2>
        <p>{{ hall.summary }}</p>
        <div class="metrics">
          <div><span>面阔</span><b>{{ hall.box.width }} u</b></div>
          <div><span>进深</span><b>{{ hall.box.depth }} u</b></div>
          <div><span>标高</span><b>+{{ hall.box.baseY }} u</b></div>
          <div><span>中轴序</span><b>{{ hall.axisOrder === null ? '配殿' : `第 ${hall.axisOrder + 1} 进` }}</b></div>
        </div>
        <hr class="divider" />
        <span class="eyebrow">礼仪要点</span>
        <ul>
          <li v-for="(t, i) in hall.etiquette" :key="i">{{ t }}</li>
        </ul>
        <div class="actions">
          <button class="btn btn-primary" @click="focusInScene">在三维场景中定位</button>
          <RouterLink class="btn" :to="`/worship/${hall.id}`">入殿礼佛</RouterLink>
        </div>
      </section>
    </div>

    <section class="neighbours">
      <span class="eyebrow">沿中轴相邻</span>
      <div class="row">
        <RouterLink v-for="n in neighbours" :key="n.id" class="ncard panel" :to="`/hall/${n.id}`">
          <strong class="serif">{{ n.name }}</strong>
          <small>{{ n.deity }}</small>
          <span>Z {{ n.box.z }} →</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
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
  font-size: 30px;
  letter-spacing: 0.14em;
  margin-top: 4px;
}
.head p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--cinnabar);
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 14px;
}
.hero {
  overflow: hidden;
}
.hero-img {
  height: 420px;
  background: url('/temple/fallback.png') center / cover no-repeat;
}
.hero-cap {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  font-size: 11px;
  color: var(--ink-3);
}
.detail {
  padding: 20px;
}
.detail h2 {
  font-size: 20px;
  margin: 2px 0 10px;
}
.detail p {
  font-size: 12px;
  line-height: 1.9;
  color: var(--ink-2);
}
.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 16px 0;
}
.metrics div {
  background: var(--paper-2);
  padding: 9px 11px;
  border-radius: var(--radius-s);
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ink-3);
}
.metrics b {
  color: var(--ink);
  font-weight: 600;
}
.detail ul {
  margin: 8px 0 18px;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.9;
  color: var(--ink-2);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.neighbours {
  margin-top: 22px;
}
.row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.ncard {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all 0.2s var(--ease);
}
.ncard:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
}
.ncard strong {
  font-size: 16px;
}
.ncard small,
.ncard span {
  font-size: 11px;
  color: var(--ink-3);
}
.ncard span {
  color: var(--gold);
  margin-top: 6px;
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .hero-img {
    height: 260px;
  }
}
</style>
