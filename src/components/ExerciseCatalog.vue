<script setup>
import { computed, onMounted } from 'vue'
import { Dumbbell, Search, SlidersHorizontal } from 'lucide-vue-next'
import AppCard from '@/components/AppCard.vue'
import { useExerciseCatalogController } from '@/controllers/useExerciseCatalogController'

const { exercises, search, selectedGroup, selectedLevel, muscleGroups, levels, filteredExercises, isLoading, error, loadExercises, clearFilters } = useExerciseCatalogController()
const resultLabel = computed(() => `${filteredExercises.value.length} ${filteredExercises.value.length === 1 ? 'ejercicio' : 'ejercicios'}`)
onMounted(loadExercises)
</script>

<template>
  <section class="exercise-catalog" aria-labelledby="exercise-catalog-title">
    <header class="exercise-heading">
      <div>
        <p class="eyebrow">BIBLIOTECA DE MOVIMIENTOS</p>
        <h2 id="exercise-catalog-title">Explora los ejercicios</h2>
        <p class="muted">Encuentra movimientos por grupo muscular y nivel para aprender su ejecución.</p>
      </div>
      <span v-if="!isLoading && !error" class="result-count" role="status">{{ resultLabel }}</span>
    </header>

    <div class="exercise-tools">
      <label class="exercise-search">
        <Search :size="18" aria-hidden="true" />
        <span class="sr-only">Buscar ejercicios</span>
        <input v-model="search" type="search" placeholder="Buscar por nombre, músculo o equipo" />
      </label>
      <label class="level-filter"><SlidersHorizontal :size="16" aria-hidden="true" /><span>Nivel</span>
        <select v-model="selectedLevel" aria-label="Filtrar por nivel"><option v-for="level in levels" :key="level" :value="level">{{ level }}</option></select>
      </label>
    </div>

    <nav class="muscle-filters" aria-label="Filtrar por grupo muscular">
      <button v-for="group in muscleGroups" :key="group" type="button" :aria-pressed="selectedGroup === group" :class="{ active: selectedGroup === group }" @click="selectedGroup = group">{{ group }}</button>
    </nav>

    <p v-if="isLoading" class="catalog-status" role="status">Cargando ejercicios…</p>
    <AppCard v-else-if="error" class="empty-state">
      <p role="alert">{{ error }}</p><button type="button" @click="loadExercises">Reintentar</button>
    </AppCard>
    <ul v-else-if="filteredExercises.length" class="exercise-grid" aria-label="Catálogo de ejercicios">
      <li v-for="exercise in filteredExercises" :key="exercise.id">
        <AppCard class="exercise-card" padding="0">
          <div class="exercise-image-wrap">
            <img v-if="exercise.imageUrl" class="exercise-image" :src="exercise.imageUrl" :alt="`Demostración de ${exercise.name}`" loading="lazy" />
            <Dumbbell v-else class="image-fallback" :size="32" aria-hidden="true" />
            <span class="group-badge">{{ exercise.muscleGroup || 'General' }}</span>
          </div>
          <div class="exercise-content">
            <div class="exercise-title"><div><span class="exercise-level">{{ exercise.level || 'Todos los niveles' }}</span><h3>{{ exercise.name }}</h3></div></div>
            <p v-if="exercise.description" class="exercise-description">{{ exercise.description }}</p>
            <div class="equipment-line"><span>Equipo</span><strong>{{ exercise.equipment || 'Sin equipo' }}</strong></div>
            <details v-if="exercise.technique" class="technique-details">
              <summary>Ver técnica de ejecución</summary>
              <p>{{ exercise.technique }}</p>
              <ul v-if="exercise.instructions?.length"><li v-for="(step, index) in exercise.instructions" :key="index">{{ step }}</li></ul>
              <div v-if="exercise.mistakes?.length" class="mistakes"><strong>Errores frecuentes</strong><ul><li v-for="mistake in exercise.mistakes" :key="mistake">{{ mistake }}</li></ul></div>
            </details>
          </div>
        </AppCard>
      </li>
    </ul>
    <AppCard v-else class="empty-state">
      <Dumbbell :size="30" aria-hidden="true" />
      <h3>No encontramos ejercicios</h3>
      <p>Prueba otra búsqueda o cambia los filtros.</p>
      <button type="button" @click="clearFilters">Limpiar filtros</button>
    </AppCard>
  </section>
</template>

<style scoped>
.exercise-catalog { min-width: 0; }
.exercise-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin:26px 0 18px; }
.eyebrow { margin:0 0 5px; color:var(--color-primary); font-size:10px; font-weight:800; letter-spacing:1.5px; }
.exercise-heading h2 { margin:0; font-size:clamp(20px,2vw,24px); }
.exercise-heading .muted { margin:6px 0 0; font-size:13px; }
.result-count { flex-shrink:0; color:var(--color-muted-text); font-size:13px; }
.exercise-tools { display:flex; align-items:center; gap:12px; margin:20px 0 14px; }
.exercise-search,.level-filter { display:flex; align-items:center; gap:10px; min-height:44px; border:1px solid var(--color-card-border); border-radius:11px; background:var(--color-surface); color:var(--color-muted-text); }
.exercise-search { flex:1; padding:0 13px; }
.exercise-search:focus-within,.level-filter:focus-within { outline:2px solid var(--color-primary); outline-offset:2px; }
.exercise-search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--color-text); font:inherit; font-size:13px; }
.level-filter { padding:0 10px; font-size:12px; white-space:nowrap; }
.level-filter select { max-width:140px; border:0; outline:0; background:transparent; color:var(--color-text); font:inherit; cursor:pointer; }
.level-filter option { background:var(--color-surface); }
.muscle-filters { display:flex; gap:7px; overflow-x:auto; padding:2px 0 12px; border-bottom:1px solid var(--color-card-border); scrollbar-width:thin; }
.muscle-filters button { flex:0 0 auto; min-height:34px; padding:0 12px; border:1px solid var(--color-card-border); border-radius:9px; background:var(--color-surface); color:var(--color-muted-text); font:inherit; font-size:12px; cursor:pointer; transition:background .15s,border-color .15s,color .15s; }
.muscle-filters button:hover,.muscle-filters button.active { border-color:var(--color-primary); background:var(--color-indicator); color:var(--color-primary); }
.muscle-filters button:focus-visible,.technique-details summary:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
.exercise-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; margin:18px 0 0; padding:0; list-style:none; }
.exercise-card { height:100%; overflow:hidden; border-radius:15px; background:var(--color-surface); }
.exercise-image-wrap { position:relative; display:grid; place-items:center; height:clamp(150px,16vw,205px); overflow:hidden; background:#f3f5f4; }
.exercise-image { width:100%; height:100%; object-fit:contain; }
.image-fallback { color:var(--color-primary); }
.group-badge { position:absolute; right:10px; bottom:10px; padding:5px 9px; border:1px solid rgb(0 0 0 / 8%); border-radius:999px; background:rgb(6 13 10 / 88%); color:var(--color-primary); font-size:10px; font-weight:700; }
.exercise-content { padding:14px 15px 15px; }
.exercise-level { display:inline-block; margin-bottom:6px; color:var(--color-primary); font-size:10px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; }
.exercise-title h3 { margin:0; font-size:16px; line-height:1.35; overflow-wrap:anywhere; }
.exercise-description { margin:8px 0 10px; color:var(--color-muted-text); font-size:12px; line-height:1.5; }
.equipment-line { display:flex; justify-content:space-between; gap:10px; padding:9px 0; border-top:1px solid var(--color-card-border); color:var(--color-muted-text); font-size:11px; }
.equipment-line strong { color:var(--color-text); font-weight:600; text-align:right; }
.technique-details { border-top:1px solid var(--color-card-border); }
.technique-details summary { padding:10px 0 2px; color:var(--color-primary); font-size:12px; font-weight:700; cursor:pointer; }
.technique-details p,.technique-details li { color:var(--color-muted-text); font-size:12px; line-height:1.55; }
.technique-details p { white-space:pre-line; }
.technique-details ul { display:grid; gap:5px; padding-left:18px; }
.mistakes { padding-top:7px; border-top:1px solid var(--color-card-border); }
.mistakes strong { font-size:11px; }
.catalog-status { padding:30px 0; color:var(--color-muted-text); }
.empty-state { display:grid; justify-items:center; gap:10px; margin-top:18px; padding:30px; text-align:center; }
.empty-state svg { color:var(--color-primary); }
.empty-state h3,.empty-state p { margin:0; }
.empty-state p { color:var(--color-muted-text); font-size:13px; }
.empty-state button { margin-top:5px; padding:9px 13px; border:1px solid var(--color-primary); border-radius:9px; background:var(--color-indicator); color:var(--color-primary); font:inherit; cursor:pointer; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media(max-width:1000px) { .exercise-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:620px) { .exercise-heading { align-items:flex-start; flex-direction:column; gap:8px; }.exercise-tools { align-items:stretch; flex-direction:column; }.level-filter { justify-content:flex-start; }.level-filter select { flex:1; max-width:none; }.exercise-grid { grid-template-columns:1fr; }.exercise-image-wrap { height:210px; } }
</style>
