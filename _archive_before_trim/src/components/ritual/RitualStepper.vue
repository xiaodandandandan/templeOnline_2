<script setup lang="ts">
import { RITUAL_STEPS, type RitualSession } from '@/domain/worship'

defineProps<{ session: RitualSession }>()
</script>

<template>
  <ol class="stepper">
    <li
      v-for="(step, i) in RITUAL_STEPS"
      :key="step.key"
      :class="{
        current: session.stepIndex === i && session.phase === 'running',
        done: session.completedSteps.includes(step.key),
        skipped: session.skippedSteps.includes(step.key),
      }"
    >
      <span class="mark">
        <b v-if="session.completedSteps.includes(step.key)">✓</b>
        <b v-else-if="session.skippedSteps.includes(step.key)">–</b>
        <b v-else>{{ i + 1 }}</b>
      </span>
      <span class="txt">
        <strong class="serif">{{ step.title }}</strong>
        <small>{{ step.subtitle }}{{ step.optional ? ' · 可略' : '' }}</small>
      </span>
    </li>
  </ol>
</template>

<style scoped>
.stepper {
  list-style: none;
  margin: 0;
  padding: 0;
}
.stepper li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  position: relative;
  opacity: 0.55;
  transition: opacity 0.24s var(--ease);
}
.stepper li::after {
  content: '';
  position: absolute;
  left: 15px;
  top: 38px;
  bottom: -10px;
  width: 1px;
  background: var(--line);
}
.stepper li:last-child::after {
  display: none;
}
.stepper li.current,
.stepper li.done {
  opacity: 1;
}
.mark {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: var(--paper-3);
  font-family: var(--font-serif);
  font-size: 12px;
  color: var(--ink-2);
}
.current .mark {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(168, 60, 50, 0.12);
}
.done .mark {
  background: var(--jade);
  border-color: var(--jade);
  color: #fff;
}
.txt {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.txt strong {
  font-size: 13px;
}
.txt small {
  font-size: 10px;
  color: var(--ink-3);
}
</style>
