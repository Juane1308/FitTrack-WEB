<script setup>
import { onMounted, ref } from 'vue'
import { CalendarDays, Clock, Dumbbell } from 'lucide-vue-next'
import AppCard from '@/components/AppCard.vue'
import ExerciseCatalog from '@/components/ExerciseCatalog.vue'
import { useTrainingController } from '@/controllers/useTrainingController'

const { routines, isLoading, error, loadRoutines } = useTrainingController()
onMounted(loadRoutines)
const selectedCatalog = ref('routines')
</script>

<template>
  <section class="section-page training-page" aria-labelledby="training-title">
    <header class="training-header">
      <div>
        <p class="eyebrow">TU ESPACIO DE ENTRENAMIENTO</p>
        <h1 id="training-title">Entrenamientos</h1>
        <p class="muted introduction">Explora nuestras rutinas y conoce los ejercicios de la plataforma.</p>
      </div>
      <Dumbbell class="header-icon" :size="38" aria-hidden="true" />
    </header>

    <div class="catalog-navigation" role="group" aria-label="Seleccionar catálogo">
      <button type="button" :aria-pressed="selectedCatalog === 'routines'" @click="selectedCatalog = 'routines'">Rutinas</button>
      <button type="button" :aria-pressed="selectedCatalog === 'exercises'" @click="selectedCatalog = 'exercises'">Ejercicios</button>
    </div>
    <ExerciseCatalog v-if="selectedCatalog === 'exercises'" />
    <div v-show="selectedCatalog === 'routines'">
    <div class="catalog-heading">
      <h2>Rutinas</h2>
      <span v-if="!isLoading && !error" class="muted">{{ routines.length }} disponibles</span>
    </div>

    <p v-if="isLoading" role="status">Cargando rutinas…</p>
    <AppCard v-else-if="error" class="empty-state">
      <p role="alert">{{ error }}</p>
      <button type="button" @click="loadRoutines">Reintentar</button>
    </AppCard>
    <ul v-else-if="routines.length" class="routine-grid" aria-label="Catálogo de rutinas">
      <li v-for="routine in routines" :key="routine.id">
        <AppCard class="routine-card" padding="0">
          <img :src="routine.image" alt="" class="routine-image" width="361" height="298" />
          <div class="routine-info">
            <h3>{{ routine.name }}</h3>
            <dl class="routine-classification">
              <div>
                <dt>Nivel de dificultad</dt>
                <dd class="level">{{ routine.level }}</dd>
              </div>
              <div>
                <dt>Duración estimada</dt>
                <dd class="duration session-duration">
                  <Clock :size="16" aria-hidden="true" />
                  {{ routine.durationMinutes }} min por sesión
                </dd>
              </div>
            </dl>
            <p v-if="routine.location" class="duration">{{ routine.location }}</p>
            <p v-if="routine.durationWeeks" class="duration">
              <CalendarDays :size="16" aria-hidden="true" />
              Programa de {{ routine.durationWeeks }} semanas
            </p>
          </div>
        </AppCard>
      </li>
    </ul>
    <AppCard v-else class="empty-state">
      <Dumbbell :size="32" aria-hidden="true" />
      <h3>Aún no hay rutinas disponibles</h3>
      <p class="muted">Vuelve más adelante para consultar el catálogo.</p>
    </AppCard>
    </div>
  </section>
</template>

<style scoped>
.training-page { padding-top: 40px; }
.training-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.eyebrow { color: var(--color-primary); font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px; }
h1 { font-size: clamp(28px, 4vw, 40px); letter-spacing: -1px; }
.introduction { margin-top: 12px; line-height: 1.6; max-width: 520px; }
.header-icon { color: var(--color-primary); flex-shrink: 0; }
.catalog-navigation { display: flex; gap: 12px; margin: 28px 0; border-bottom: 1px solid var(--color-card-border); }
.catalog-navigation button { background: transparent; border: 0; border-bottom: 3px solid transparent; color: var(--color-muted-text); padding: 14px 18px; font: inherit; cursor: pointer; }
.catalog-navigation button[aria-pressed="true"] { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.catalog-navigation button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.catalog-heading { display: flex; align-items: center; justify-content: space-between; margin: 36px 0 24px; border-bottom: 1px solid var(--color-card-border); }
.catalog-heading h2 { color: var(--color-primary); font-size: 20px; padding: 0 8px 16px; border-bottom: 3px solid var(--color-primary); }
.catalog-heading span { font-size: 13px; padding-bottom: 16px; }
.routine-grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.routine-card { height: 100%; display: flex; align-items: center; background: linear-gradient(135deg, #0b1713, #050907); }
.routine-image { width: 36%; align-self: stretch; height: auto; min-height: 240px; object-fit: cover; flex-shrink: 0; }
.routine-info { padding: 20px; min-width: 0; }
.level { display: inline-block; color: var(--color-accent); background: var(--color-indicator); border-radius: 6px; padding: 5px 8px; font-size: 12px; }
h3 { margin: 0 0 16px; font-size: 22px; overflow-wrap: anywhere; }
.routine-classification { margin: 0 0 14px; display: grid; gap: 12px; }
.routine-classification dt { color: var(--color-muted-text); font-size: 12px; margin-bottom: 5px; }
.routine-classification dd { margin: 0; }
.session-duration { color: var(--color-text, #fff); font-weight: 600; }
.duration { color: var(--color-muted-text); font-size: 13px; line-height: 1.6; display: flex; align-items: center; gap: 7px; }
.duration svg { flex-shrink: 0; }
.empty-state { text-align: center; }
.empty-state svg { color: var(--color-primary); }
@media (max-width: 760px) {
  .routine-grid { grid-template-columns: 1fr; gap: 16px; }
  .training-page { padding-top: 28px; }
  .routine-image { width: 30%; min-height: 240px; }
  .routine-info { padding: 16px; }
  h3 { font-size: 20px; }
  .header-icon { display: none; }
}
</style>
