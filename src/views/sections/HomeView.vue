<script setup>
import { onEnter } from '@/controllers/onEnter'
import { Clock3, Dumbbell, Flame, Play, Trophy } from 'lucide-vue-next'

import AppCard from '@/components/AppCard.vue'
import { useHomeController } from '@/controllers/useHomeController'

const {
  user,
  weeklyProgress,
  metrics,
  todayRoutine,
  progressPercent,
  isLoading,
  error,
  loadHomeDashboard,
} = useHomeController()

onEnter(loadHomeDashboard)
</script>

<template>
  <section class="section-page home-page" aria-labelledby="home-title">
    <header class="welcome-header">
      <p class="eyebrow">INICIO</p>
      <h1 id="home-title">Hola, {{ user?.name ?? 'atleta' }} 👋</h1>
      <p class="muted">Disciplina hoy, resultados mañana.</p>
    </header>

    <AppCard v-if="isLoading" class="state-card">
      <p>Cargando progreso semanal...</p>
    </AppCard>

    <AppCard v-else-if="error" class="state-card error-card">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-filled" @click="loadHomeDashboard">
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

        <p v-if="weeklyProgress.weeklyGoal != null">
          {{ weeklyProgress.completedWorkouts }} de {{ weeklyProgress.weeklyGoal }} entrenamientos
          completados
        </p>
        <p v-else>Meta semanal sin configurar</p>
      </div>
    </AppCard>

    <AppCard v-else class="state-card">
      <p>No hay datos de progreso semanal disponibles.</p>
    </AppCard>

    <AppCard v-if="todayRoutine" class="routine-card">
      <div class="routine-heading">
        <Dumbbell :size="28" aria-hidden="true" />
        <div>
          <p class="eyebrow">ENTRENAMIENTO DE HOY</p>
          <h2>{{ todayRoutine.name }}</h2>
        </div>
      </div>
      <p class="muted">
        {{ todayRoutine.durationMinutes ?? '--' }} min
        <span v-if="todayRoutine.difficulty"> · {{ todayRoutine.difficulty }}</span>
      </p>
      <RouterLink class="btn btn-filled routine-action" :to="{ name: 'training' }">
        <Play :size="18" fill="currentColor" aria-hidden="true" />
        Ver entrenamiento
      </RouterLink>
    </AppCard>

    <AppCard v-else class="routine-card empty-routine-card">
      <Dumbbell :size="28" aria-hidden="true" />
      <div>
        <h2>No hay entrenamiento programado hoy</h2>
        <p class="muted">Cuando exista una rutina en tu cuenta aparecerá aquí.</p>
      </div>
    </AppCard>

    <section class="metric-grid" aria-label="Métricas semanales">
      <AppCard class="metric-card">
        <Flame :size="30" aria-hidden="true" />
        <h2>Calorías semanales</h2>
        <strong>{{ metrics?.calories ?? '--' }}<small v-if="metrics?.calories != null"> kcal</small></strong>
      </AppCard>

      <AppCard class="metric-card">
        <Clock3 :size="30" aria-hidden="true" />
        <h2>Tiempo semanal</h2>
        <strong>{{ metrics?.exerciseMinutes ?? '--' }}<small v-if="metrics?.exerciseMinutes != null"> min</small></strong>
      </AppCard>

      <AppCard class="metric-card">
        <Trophy :size="30" aria-hidden="true" />
        <h2>Racha</h2>
        <strong>{{ metrics?.activeStreak ?? '--' }}<small v-if="metrics?.activeStreak != null"> días</small></strong>
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

.metric-card strong {
  font-size: 28px;
}

.metric-card small {
  color: var(--color-muted-text);
  font-size: 14px;
  font-weight: 400;
}

.routine-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px 24px;
  margin-top: 24px;
  padding: 24px 28px;
}

.routine-heading {
  display: flex;
  flex: 1 1 320px;
  align-items: center;
  gap: 14px;
}

.routine-heading svg,
.empty-routine-card > svg {
  flex: 0 0 auto;
  color: var(--color-primary);
}

.routine-heading .eyebrow {
  margin-bottom: 6px;
}

.routine-heading h2,
.empty-routine-card h2 {
  font-size: 22px;
}

.routine-card > .muted {
  flex: 0 0 auto;
}

.routine-action {
  flex: 0 0 auto;
  text-decoration: none;
}

.empty-routine-card {
  flex-wrap: nowrap;
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

  .routine-card,
  .empty-routine-card {
    align-items: flex-start;
  }

  .routine-action {
    width: 100%;
  }
}
</style>
