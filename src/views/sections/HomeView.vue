<script setup>
import { ChartNoAxesCombined, Flag, Flame, Play, Zap } from 'lucide-vue-next'

import AppCard from '@/components/AppCard.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import { useHomeController } from '@/controllers/useHomeController'

const { user, dashboard, routineDetails, metrics } = useHomeController()

const metricIcons = {
  weeklyGoal: Flag,
  progress: ChartNoAxesCombined,
  calories: Flame,
  streak: Zap,
}
</script>

<template>
  <section class="section-page">
    <h1 class="greeting">Hola, {{ user.name }} 👋</h1>
    <p class="muted goal">Listo para avanzar hacia tu objetivo: {{ user.goal }}.</p>

    <AppCard padding="0" class="routine-card">
      <div class="routine">
        <p class="soft">Rutina de hoy</p>
        <h2>{{ dashboard.routineName }}</h2>
        <p class="soft details">{{ routineDetails }}</p>
        <button type="button" class="btn routine-button">
          <Play :size="20" fill="currentColor" aria-hidden="true" />
          Ver rutina
        </button>
      </div>
    </AppCard>

    <SectionTitle
      class="summary-title"
      title="Tu resumen"
      subtitle="Indicadores mock para la primera etapa"
    />

    <div class="metrics">
      <AppCard v-for="metric in metrics" :key="metric.key" padding="14px" class="metric">
        <component :is="metricIcons[metric.key]" :size="24" class="metric-icon" aria-hidden="true" />
        <span class="metric-label">{{ metric.label }}</span>
        <strong class="metric-value">{{ metric.value }}</strong>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
.greeting {
  font-size: 24px;
  font-weight: 900;
}

.goal {
  margin-top: 6px;
  font-size: 16px;
}

.routine-card {
  margin-top: 24px;
}

.routine {
  padding: 20px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
}

.soft {
  color: rgba(255, 255, 255, 0.7);
}

h2 {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 800;
}

.details {
  margin-top: 12px;
  white-space: pre-wrap;
}

.routine-button {
  margin-top: 18px;
  background: #fff;
  color: var(--color-primary);
}

.routine-button:hover {
  filter: brightness(0.95);
}

.summary-title {
  margin-top: 26px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 14px;
}

@media (min-width: 650px) {
  .metrics {
    grid-template-columns: repeat(4, 1fr);
  }
}

.metric {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  aspect-ratio: 1.35;
}

.metric-icon {
  color: var(--color-primary);
}

.metric-label {
  font-size: 12px;
  color: var(--color-muted-text);
}

.metric-value {
  font-size: 16px;
  font-weight: 800;
}
</style>
