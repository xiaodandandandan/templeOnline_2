<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getHall, isHallId, type HallId } from '@/domain/hall'
import { OFFERINGS, RITUAL_STEPS } from '@/domain/worship'
import { WISH_CATEGORIES, type WishCategory } from '@/domain/models'
import { appConfig } from '@/app/config'
import { useWorshipStore } from '@/stores/worship'
import { useWishStore } from '@/stores/wish'
import RitualStepper from '@/components/ritual/RitualStepper.vue'

const route = useRoute()
const router = useRouter()
const worship = useWorshipStore()
const wishes = useWishStore()

const raw = String(route.params.hallId)
const hallId: HallId = isHallId(raw) ? raw : 'tianwang'
const hall = getHall(hallId)

const entered = ref(false)
const wishText = ref('')
const wishCategory = ref<WishCategory>('peace')
const wishSaved = ref(false)

const session = computed(() => worship.session)
const step = computed(() => worship.currentStep)
const isOfferingStep = computed(() => step.value?.key === 'offering')

function begin(): void {
  worship.start(hallId)
  entered.value = true
}

async function finishAndSave(): Promise<void> {
  await worship.complete()
}

async function submitWish(): Promise<void> {
  const result = await wishes.submit({
    hallId,
    category: wishCategory.value,
    text: wishText.value,
    anonymous: true,
    author: '',
  })
  if (result) {
    wishSaved.value = true
    wishText.value = ''
  }
}

function backToGuide(): void {
  void router.push('/')
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">WORSHIP RITUAL · STATE MACHINE</span>
        <h1 class="serif">{{ hall.name }} · 礼佛仪轨</h1>
        <p>{{ hall.deity }} · {{ hall.etiquette[0] }}</p>
      </div>
      <button class="btn" @click="backToGuide">← 返回三维导览</button>
    </header>

    <div class="layout">
      <section class="left panel">
        <div class="box-head">
          <span class="eyebrow">流程</span>
          <b>{{ worship.progress }}%</b>
        </div>
        <div class="bar"><i :style="{ width: `${worship.progress}%` }" /></div>
        <RitualStepper v-if="session" :session="session" />
        <div v-else class="idle">
          <p>仪轨共 {{ RITUAL_STEPS.length }} 步，依序进行；标注“可略”的步骤可跳过。</p>
          <button class="btn btn-primary" @click="begin">开始礼佛</button>
        </div>
      </section>

      <section class="main panel">
        <template v-if="session && !worship.isCompleted && step">
          <div class="step-head">
            <span class="eyebrow">STEP {{ session.stepIndex + 1 }} / {{ RITUAL_STEPS.length }}</span>
            <h2 class="serif">{{ step.title }}</h2>
            <p class="sub">{{ step.subtitle }} · 建议 {{ step.seconds }} 秒</p>
          </div>
          <div class="instruction">
            <span class="seal serif">仪</span>
            <p>{{ step.instruction }}</p>
          </div>

          <div v-if="isOfferingStep" class="offerings">
            <div class="offerings-head">
              <span class="eyebrow">虚拟供品（无实物与交易）</span>
              <small>资质开关：{{ appConfig.enableOffering ? '已开启' : '演示模式' }}</small>
            </div>
            <div class="offer-grid">
              <button
                v-for="o in OFFERINGS"
                :key="o.kind"
                class="offer"
                :class="{ on: session.offerings.includes(o.kind) }"
                @click="worship.toggleOffering(o.kind)"
              >
                <strong class="serif">{{ o.label }}</strong>
                <small>{{ o.note }}</small>
              </button>
            </div>
          </div>

          <div class="controls">
            <button class="btn" :disabled="session.stepIndex === 0" @click="worship.apply('prev')">
              上一步
            </button>
            <button v-if="step.optional" class="btn" @click="worship.apply('skip')">略过此步</button>
            <button class="btn btn-primary" @click="worship.apply('next')">
              {{ session.stepIndex === RITUAL_STEPS.length - 1 ? '礼成 →' : '完成此步 →' }}
            </button>
          </div>
        </template>

        <template v-else-if="session && worship.isCompleted">
          <div class="done">
            <span class="done-seal serif">回向</span>
            <h2 class="serif">礼成</h2>
            <p>所行礼节已依序完成。可将此作息留存于本设备，或自愿写下一句祈愿。</p>

            <div class="done-stat">
              <span>完成 {{ session.completedSteps.length }} 步</span>
              <span>略过 {{ session.skippedSteps.length }} 步</span>
              <span>供品 {{ session.offerings.length }} 项</span>
            </div>

            <div class="record">
              <button class="btn btn-primary" :disabled="worship.saving || !!worship.saved" @click="finishAndSave">
                {{ worship.saved ? '✓ 已留存记录' : worship.saving ? '保存中…' : '留存礼佛记录' }}
              </button>
              <RouterLink v-if="worship.saved" class="btn" to="/merit">查看记录</RouterLink>
            </div>

            <div class="wish-box">
              <span class="eyebrow">自愿 · 祈愿一句</span>
              <div class="wish-row">
                <select v-model="wishCategory" aria-label="祈愿类别">
                  <option v-for="c in WISH_CATEGORIES" :key="c.key" :value="c.key">{{ c.label }}</option>
                </select>
                <input v-model="wishText" maxlength="120" placeholder="愿…" @keyup.enter="submitWish" />
                <button class="btn" :disabled="wishes.submitting || wishSaved" @click="submitWish">
                  {{ wishSaved ? '已写下' : '写下' }}
                </button>
              </div>
              <small v-if="appConfig.moderation">提交后进入“待审核”状态，仅本设备可见。</small>
              <small v-else>已直接显示于祈愿墙。</small>
            </div>

            <p v-if="worship.error || wishes.error" class="error">{{ worship.error || wishes.error }}</p>
            <button class="btn btn-ghost restart" @click="begin">再行一次</button>
          </div>
        </template>

        <template v-else>
          <div class="placeholder">
            <p class="serif">入殿之前，先净手整容。</p>
            <small>左侧点击“开始礼佛”进入仪轨流程</small>
          </div>
        </template>
      </section>

      <aside class="right panel">
        <span class="eyebrow">殿宇须知</span>
        <h3 class="serif">{{ hall.name }}</h3>
        <ul>
          <li v-for="(t, i) in hall.etiquette" :key="i">{{ t }}</li>
        </ul>
        <hr class="divider" />
        <p class="muted small">{{ hall.summary }}</p>
        <hr class="divider" />
        <span class="eyebrow">合规说明</span>
        <p class="small">
          本页为传统礼节的流程演示与前端状态机示例，不涉及宗教服务资质、实物供养、支付或功德量化。
        </p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 22px 26px 40px;
  max-width: 1320px;
  margin: 0 auto;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}
.page-head h1 {
  font-size: 26px;
  margin-top: 4px;
}
.page-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}
.layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 250px;
  gap: 14px;
  align-items: start;
}
.left,
.right,
.main {
  padding: 18px;
}
.box-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ink-3);
}
.bar {
  height: 4px;
  background: var(--paper-2);
  border-radius: 99px;
  margin: 8px 0 12px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--cinnabar);
  transition: width 0.4s var(--ease);
}
.idle p,
.placeholder p {
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.8;
}
.idle .btn {
  margin-top: 12px;
  width: 100%;
}
.main {
  min-height: 440px;
}
.step-head h2 {
  font-size: 26px;
  margin-top: 4px;
}
.sub {
  font-size: 12px;
  color: var(--ink-3);
  margin: 2px 0 0;
}
.instruction {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin: 24px 0;
  padding: 20px;
  background: rgba(236, 228, 212, 0.5);
  border-left: 2px solid var(--gold);
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
}
.seal {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  background: var(--chestnut);
  color: #fff;
  border-radius: 4px;
  font-size: 20px;
}
.instruction p {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 2;
  letter-spacing: 0.05em;
}
.offerings {
  margin-bottom: 22px;
}
.offerings-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.offerings-head small {
  font-size: 10px;
  color: var(--ink-3);
}
.offer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 8px;
}
.offer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  background: var(--paper-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  text-align: left;
}
.offer strong {
  font-size: 15px;
}
.offer small {
  font-size: 10px;
  color: var(--ink-3);
}
.offer.on {
  border-color: var(--cinnabar);
  background: rgba(168, 60, 50, 0.07);
}
.controls {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
  border-top: 1px solid var(--line);
  padding-top: 16px;
}
.done {
  text-align: center;
  padding: 10px 8px;
}
.done-seal {
  display: inline-grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px solid var(--gold);
  border-radius: 50%;
  color: var(--gold);
  font-size: 15px;
  letter-spacing: 0.1em;
}
.done h2 {
  font-size: 26px;
  margin: 12px 0 4px;
}
.done > p {
  font-size: 12px;
  color: var(--ink-2);
  max-width: 420px;
  margin: 0 auto;
  line-height: 1.8;
}
.done-stat {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 18px 0;
  font-size: 11px;
  color: var(--ink-3);
}
.record {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.wish-box {
  margin-top: 24px;
  text-align: left;
  padding: 14px;
  background: rgba(236, 228, 212, 0.45);
  border-radius: var(--radius-m);
}
.wish-row {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}
.wish-row select,
.wish-row input {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-s);
  padding: 8px 10px;
  background: var(--paper-3);
}
.wish-row input {
  flex: 1;
  min-width: 0;
}
.wish-box small {
  font-size: 10px;
  color: var(--ink-3);
}
.restart {
  margin-top: 16px;
  font-size: 11px;
  color: var(--ink-3);
}
.error {
  color: var(--cinnabar);
  font-size: 11px;
}
.right h3 {
  font-size: 17px;
  margin: 3px 0 8px;
}
.right ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.9;
  color: var(--ink-2);
}
.small {
  font-size: 11px;
  line-height: 1.8;
}
.placeholder {
  display: grid;
  place-content: center;
  text-align: center;
  min-height: 340px;
  color: var(--ink-3);
}
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .right {
    grid-column: 1 / -1;
  }
}
@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .page {
    padding: 16px;
  }
}
</style>
