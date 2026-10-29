<script setup>
import { onEnter } from '@/controllers/onEnter'
import { computed } from 'vue'
import { Clock3, Dumbbell, Flame, Play, Trophy } from 'lucide-vue-next'

import AppCard from '@/components/AppCard.vue'
import { useHomeController } from '@/controllers/useHomeController'

const {
  user,
  homeBackground,
  weeklyProgress,
  metrics,
  todayRoutine,
  progressPercent,
  isLoading,
  error,
  isCompletingWorkout,
  completionMessage,
  routineSummary,
  weeklyActivity,
  loadHomeDashboard,
  completeTodayWorkout,
} = useHomeController()

onEnter(loadHomeDashboard)

const activityMax = computed(() => Math.max(...weeklyActivity.value.map(day => day.exerciseMinutes), 0))
const totalWeeklyMinutes = computed(() => weeklyActivity.value.reduce((total, day) => total + day.exerciseMinutes, 0))

function activityHeight(day) {
  if (!activityMax.value || !day.exerciseMinutes) return 0
  return Math.max(8, Math.round((day.exerciseMinutes / activityMax.value) * 100))
}

function formatActivityDay(date) {
  return new Intl.DateTimeFormat('es-CO', { weekday: 'short' })
    .format(new Date(`${date}T00:00:00`))
    .replace('.', '')
}
</script>

<template>
  <div class="home-view">
    <img
      v-if="homeBackground"
      class="home-background-image"
      :src="homeBackground"
      alt=""
      aria-hidden="true"
    />
    <div class="home-background-overlay" aria-hidden="true"></div>

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
          <p class="eyebrow">
            {{ todayRoutine.origin === 'scheduled' ? 'ENTRENAMIENTO DE HOY' : todayRoutine.origin === 'assigned' ? 'RUTINA ASIGNADA' : 'MI RUTINA' }}
          </p>
          <h2>{{ todayRoutine.name }}</h2>
        </div>
      </div>
      <p class="muted">
        {{ todayRoutine.durationMinutes ?? '--' }} min
        <span v-if="todayRoutine.difficulty"> · {{ todayRoutine.difficulty }}</span>
      </p>
      <div class="routine-actions">
        <RouterLink class="btn btn-outline routine-action" :to="{ name: 'training' }">
          <Play :size="18" fill="currentColor" aria-hidden="true" />
          Ver entrenamiento
        </RouterLink>
        <button
          type="button"
          class="btn btn-filled routine-action"
          :disabled="todayRoutine.completed || isCompletingWorkout"
          @click="completeTodayWorkout"
        >
          {{ todayRoutine.completed ? 'Completado hoy' : isCompletingWorkout ? 'Guardando...' : 'Completar entrenamiento' }}
        </button>
      </div>
    </AppCard>

    <AppCard v-else class="routine-card empty-routine-card">
      <Dumbbell :size="28" aria-hidden="true" />
      <div>
        <h2>No hay entrenamiento programado hoy</h2>
        <p class="muted">Cuando exista una rutina en tu cuenta aparecerá aquí.</p>
      </div>
      <RouterLink class="btn btn-outline routine-action" :to="{ name: 'training' }">
        Explorar rutinas
      </RouterLink>
    </AppCard>

    <p v-if="completionMessage" class="success-message" role="status">{{ completionMessage }}</p>

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

    <section class="home-secondary-grid" aria-label="Resumen de entrenamiento">
      <AppCard class="routine-summary-card">
        <div class="secondary-card-heading">
          <Dumbbell :size="28" aria-hidden="true" />
          <div>
            <p class="eyebrow">MIS RUTINAS</p>
            <h2>{{ routineSummary?.total ?? 0 }}</h2>
          </div>
        </div>
        <p class="muted">
          {{ routineSummary?.assigned ?? 0 }} asignadas · {{ routineSummary?.saved ?? 0 }} guardadas
        </p>
        <RouterLink class="btn btn-outline" :to="{ name: 'training' }">Ver mis rutinas</RouterLink>
      </AppCard>

      <AppCard class="activity-card">
        <div class="secondary-card-heading activity-heading">
          <div>
            <p class="eyebrow">ACTIVIDAD SEMANAL</p>
            <h2>{{ totalWeeklyMinutes }} min registrados</h2>
          </div>
          <span class="muted">Datos reales</span>
        </div>
        <div v-if="weeklyActivity.length" class="activity-chart" role="img" aria-label="Actividad semanal por día">
          <div v-for="day in weeklyActivity" :key="day.date" class="activity-column">
            <span class="activity-value">{{ day.exerciseMinutes }}</span>
            <div class="activity-bar-track">
              <div class="activity-bar" :style="{ height: `${activityHeight(day)}%` }"></div>
            </div>
            <small>{{ formatActivityDay(day.date) }}</small>
          </div>
        </div>
        <p v-else class="muted">Aún no hay actividad registrada esta semana.</p>
      </AppCard>
    </section>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

.home-background-image,
.home-background-overlay {
  position: fixed;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.home-background-image {
  object-fit: cover;
  object-position: center;
}

.home-background-overlay {
  z-index: 1;
  background: linear-gradient(180deg, rgba(2, 10, 7, .42), rgba(0, 0, 0, .82));
}

.home-page {
  max-width: none;
  position: relative;
  z-index: 2;
  border-radius: 28px;
}

.home-page > * {
  position: relative;
  z-index: 3;
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
  font-size: clamp(26px, 2.8vw, 34px);
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
  min-height: 124px;
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
  font-size: 24px;
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

.routine-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.empty-routine-card {
  flex-wrap: nowrap;
}

.success-message {
  margin: 14px 0 0;
  color: var(--color-primary);
  font-weight: 700;
}

.home-secondary-grid {
  display: grid;
  grid-template-columns: minmax(220px, .8fr) minmax(0, 1.5fr);
  gap: 16px;
  margin-top: 24px;
}

.routine-summary-card,
.activity-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.secondary-card-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}

.secondary-card-heading svg {
  flex: 0 0 auto;
  color: var(--color-primary);
}

.secondary-card-heading .eyebrow {
  margin-bottom: 6px;
}

.secondary-card-heading h2 {
  font-size: 22px;
}

.routine-summary-card .btn {
  align-self: flex-start;
  text-decoration: none;
}

.activity-heading {
  justify-content: space-between;
}

.activity-heading h2 {
  font-size: 20px;
}

.activity-chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: end;
  gap: 10px;
  min-height: 190px;
  padding-top: 12px;
  border-bottom: 1px solid var(--color-card-border);
}

.activity-column {
  display: grid;
  grid-template-rows: 22px 1fr 24px;
  align-items: end;
  height: 170px;
  text-align: center;
}

.activity-value,
.activity-column small {
  color: var(--color-muted-text);
  font-size: 11px;
}

.activity-bar-track {
  display: flex;
  align-items: end;
  justify-content: center;
  height: 120px;
}

.activity-bar {
  width: min(28px, 70%);
  border-radius: 8px 8px 2px 2px;
  background: linear-gradient(180deg, var(--color-primary), #079c79);
  transition: height .2s ease;
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

  .home-secondary-grid {
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

  .routine-actions,
  .routine-actions .routine-action {
    width: 100%;
  }

  .activity-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
