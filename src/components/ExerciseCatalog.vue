<script setup>
import { onMounted } from 'vue'
import { Dumbbell, Search } from 'lucide-vue-next'
import AppCard from '@/components/AppCard.vue'
import { useExerciseCatalogController } from '@/controllers/useExerciseCatalogController'

const { exercises, search, filteredExercises, isLoading, error, loadExercises } = useExerciseCatalogController()
onMounted(loadExercises)
</script>

<template>
  <section aria-labelledby="exercise-catalog-title">
    <header class="exercise-heading">
      <h2 id="exercise-catalog-title">Ejercicios</h2>
      <span v-if="!isLoading && !error" class="muted" role="status">{{ filteredExercises.length }} de {{ exercises.length }} ejercicios</span>
    </header>
    <p v-if="isLoading" role="status">Cargando ejercicios…</p>
    <AppCard v-else-if="error" class="empty-state">
      <p role="alert">{{ error }}</p>
      <button type="button" @click="loadExercises">Reintentar</button>
    </AppCard>
    <template v-else-if="exercises.length">
      <label class="search-label" for="exercise-search">Buscar ejercicios</label>
      <div class="exercise-search">
        <Search :size="18" aria-hidden="true" />
        <input id="exercise-search" v-model="search" type="search" placeholder="Nombre, músculo o equipo" />
      </div>
      <ul v-if="filteredExercises.length" class="exercise-grid" aria-label="Catálogo de ejercicios">
        <li v-for="exercise in filteredExercises" :key="exercise.id">
          <AppCard class="exercise-card">
            <div class="exercise-title">
              <Dumbbell :size="22" aria-hidden="true" />
              <h3>{{ exercise.name }}</h3>
            </div>
            <dl>
              <div><dt>Grupo muscular</dt><dd>{{ exercise.muscleGroup || 'No especificado' }}</dd></div>
              <div><dt>Nivel de dificultad</dt><dd>{{ exercise.level || 'No especificado' }}</dd></div>
              <div><dt>Equipo</dt><dd>{{ exercise.equipment || 'No especificado' }}</dd></div>
            </dl>
            <p v-if="exercise.description" class="technique">{{ exercise.description }}</p>
            <details v-if="exercise.technique">
              <summary>Ver técnica</summary>
              <p class="technique">{{ exercise.technique }}</p>
            </details>
          </AppCard>
        </li>
      </ul>
      <AppCard v-else class="empty-state">
        <p>No se encontraron ejercicios con esa búsqueda.</p>
        <button type="button" @click="search = ''">Limpiar búsqueda</button>
      </AppCard>
    </template>
    <AppCard v-else class="empty-state">
      <p>Aún no hay ejercicios disponibles.</p>
    </AppCard>
  </section>
</template>

<style scoped>
.exercise-heading { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.exercise-heading h2 { font-size: 20px; }
.exercise-heading span, .search-label { font-size: 13px; }
.search-label { display: block; margin-bottom: 8px; }
.exercise-search { display: flex; align-items: center; gap: 10px; border: 1px solid var(--color-card-border); border-radius: 12px; padding: 0 14px; margin-bottom: 24px; }
.exercise-search svg, .exercise-title svg, summary { color: var(--color-primary); }
.exercise-search input { width: 100%; min-width: 0; padding: 14px 0; border: 0; background: transparent; color: inherit; font: inherit; }
.exercise-search:focus-within { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.exercise-search input:focus { outline: none; }
.exercise-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; list-style: none; margin: 0; padding: 0; }
.exercise-card { height: 100%; }
.exercise-title { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 18px; }
.exercise-title svg { flex-shrink: 0; }
h3 { font-size: 19px; line-height: 1.4; overflow-wrap: anywhere; }
dl { margin: 0 0 16px; display: grid; gap: 12px; }
dt { color: var(--color-muted-text); font-size: 12px; margin-bottom: 4px; }
dd { margin: 0; font-size: 14px; }
summary { cursor: pointer; padding: 10px 0; }
.technique { font-size: 14px; line-height: 1.7; margin-top: 10px; }
.empty-state { text-align: center; }
@media (max-width: 760px) { .exercise-grid { grid-template-columns: 1fr; } }
</style>
