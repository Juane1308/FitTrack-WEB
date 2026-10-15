<script setup>
import { onMounted } from 'vue'
import { Clock3, Flame, Trophy } from 'lucide-vue-next'

import AppCard from '@/components/AppCard.vue'
import { useHomeController } from '@/controllers/useHomeController'

const {
  user,
  weeklyProgress,
  progressPercent,
  isLoading,
  error,
  loadWeeklyProgress,
} = useHomeController()

onMounted(loadWeeklyProgress)
</script>

<template>
  <section class="section-page home-page" aria-labelledby="home-title">
    <header class="welcome-header">
      <p class="eyebrow">INICIO</p>
      <h1 id="home-title">Hola, {{ user.name }} </h1>
      <p class="muted">Disciplina hoy, resultados mañana.</p>
    </header>

    <AppCard v-if="isLoading" class="state-card">
      <p>Cargando progreso semanal...</p>
    </AppCard>

    <AppCard v-else-if="error" class="state-card error-card">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-filled" @click="loadWeeklyProgress">
        Reintentar
      </button>
    </AppCard>

    <AppCard v-else-if="weeklyProgress" class="progress-card">
      <div
        class="progress-ring"
        :style="{ '--progress': `${progressPercent}%` }"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${progressPercent}% de progreso semanal`"
      >
        <strong>{{ progressPercent }}%</strong>
      </div>

      <div class="progress-content">
        <h2>Tu progreso esta semana</h2>

        <div class="progress-bar">
          <span :style="{ width: `${progressPercent}%` }"></span>
        </div>

        <p>
          {{ weeklyProgress.completedWorkouts }}
          de
          {{ weeklyProgress.weeklyGoal }}
          entrenamientos completados
        </p>
      </div>
    </AppCard>

    <AppCard v-else class="state-card">
      <p>No hay datos de progreso semanal disponibles.</p>
    </AppCard>

    <section class="metric-grid" aria-label="Métricas semanales pendientes de datos">
      <AppCard class="metric-card">
        <Flame :size="30" aria-hidden="true" />
        <h2>Calorías semanales</h2>
      </AppCard>

      <AppCard class="metric-card">
        <Clock3 :size="30" aria-hidden="true" />
        <h2>Tiempo semanal</h2>
      </AppCard>

      <AppCard class="metric-card">
        <Trophy :size="30" aria-hidden="true" />
        <h2>Racha</h2>
      </AppCard>
    </section>
  </section>
</template>

<style scoped>
.home-page {
  max-width: 1180px;
}

.welcome-header {
  margin-bottom: 8px;
}

.eyebrow {
  margin-bottom: 10px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

h1 {
  font-size: clamp(28px, 5vw, 42px);
}

header > .muted {
  margin-top: 10px;
  line-height: 1.5;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  gap: 14px;
  text-align: center;
}

.metric-card svg {
  color: var(--color-primary);
}

.metric-card h2 {
  font-size: 17px;
}

.progress-card {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 32px;
  padding: 32px;
}

.progress-ring {
  display: grid;
  flex: 0 0 170px;
  place-items: center;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-primary) var(--progress),
    #2c3a43 0
  );
}

.progress-ring::before {
  content: '';
  position: absolute;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: var(--color-surface);
}

.progress-ring strong {
  position: relative;
  z-index: 1;
  font-size: 34px;
}

.progress-content {
  flex: 1;
}

.progress-content h2 {
  font-size: 24px;
}

.progress-bar {
  overflow: hidden;
  height: 12px;
  margin-top: 24px;
  border-radius: 999px;
  background: #2c3a43;
}

.progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.progress-content p {
  margin-top: 16px;
  color: var(--color-muted-text);
  font-size: 17px;
}

.state-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
  padding: 28px;
}

.error-card {
  border-color: var(--color-error);
}

@media (max-width: 600px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .progress-card {
    flex-direction: column;
    text-align: center;
  }

  .progress-content {
    width: 100%;
  }
}
</style>
