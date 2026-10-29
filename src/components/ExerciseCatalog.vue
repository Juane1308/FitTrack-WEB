<script setup>
import { computed, onMounted, ref } from 'vue'
import { Check, ChevronRight, Dumbbell, Search, X } from 'lucide-vue-next'
import AppCard from '@/components/AppCard.vue'
import { useExerciseCatalogController } from '@/controllers/useExerciseCatalogController'
import { useAuthController } from '@/controllers/authController'

const { exercises, search, selectedGroup, groupOptions, filteredExercises, isLoading, error, loadExercises, clearSearch } = useExerciseCatalogController()
const selectedExercise = ref(null)
const auth = useAuthController()
const recommendation = computed(() => {
  const goal = String(auth.currentUser?.goal ?? '').toUpperCase()
  if (goal.includes('STRENGTH') || goal.includes('FUERZA')) return { sets: 4, repetitions: '4–8', focus: 'Cargas controladas y descansos amplios.' }
  if (goal.includes('MUSCLE') || goal.includes('MASA')) return { sets: 3, repetitions: '8–12', focus: 'Progresión gradual y técnica.' }
  if (goal.includes('WEIGHT') || goal.includes('GRASA')) return { sets: 3, repetitions: '10–15', focus: 'Circuitos moderados y constancia.' }
  return { sets: 3, repetitions: '8–12', focus: 'Técnica y movimiento seguro.' }
})
const resultLabel = computed(() => `${filteredExercises.value.length} ${filteredExercises.value.length === 1 ? 'ejercicio' : 'ejercicios'}`)
const primaryMuscle = exercise => exercise?.primaryMuscles?.[0] || exercise?.muscleGroup || 'Cuerpo completo'
onMounted(loadExercises)
</script>

<template>
  <section class="exercise-catalog" aria-labelledby="exercise-catalog-title">
    <header class="exercise-heading">
      <div>
        <p class="eyebrow">BIBLIOTECA DE MOVIMIENTOS</p>
        <h2 id="exercise-catalog-title">Explora los ejercicios</h2>
        <p class="muted">Encuentra movimientos por grupo muscular y consulta cómo ejecutarlos.</p>
      </div>
      <span v-if="!isLoading && !error" class="result-count" role="status">{{ resultLabel }}</span>
    </header>

    <label class="exercise-search">
      <Search :size="18" aria-hidden="true" />
      <span class="sr-only">Buscar ejercicios</span>
      <input v-model="search" type="search" placeholder="Buscar por nombre o músculo" />
      <button v-if="search" type="button" aria-label="Limpiar búsqueda" @click="clearSearch"><X :size="16" /></button>
    </label>

    <nav class="muscle-filters" aria-label="Filtrar por grupo muscular">
      <button v-for="group in groupOptions" :key="group.id" type="button" :aria-pressed="selectedGroup === group.id" :class="{ active: selectedGroup === group.id }" @click="selectedGroup = group.id">{{ group.label }}</button>
    </nav>

    <p v-if="isLoading" class="catalog-status" role="status">Cargando ejercicios…</p>
    <AppCard v-else-if="error" class="empty-state">
      <p role="alert">{{ error }}</p><button type="button" class="action-button" @click="loadExercises">Reintentar</button>
    </AppCard>
    <ul v-else-if="filteredExercises.length" class="exercise-grid" aria-label="Catálogo de ejercicios">
      <li v-for="exercise in filteredExercises" :key="exercise.slug || exercise.id">
        <AppCard class="exercise-card" padding="0">
          <button type="button" class="exercise-row" :aria-label="`Ver detalle de ${exercise.name}`" @click="selectedExercise = exercise">
            <span class="exercise-image-wrap">
              <img v-if="exercise.imageUrl" class="exercise-image" :src="exercise.imageUrl" :alt="`Demostración de ${exercise.name}`" loading="lazy" />
              <Dumbbell v-else class="image-fallback" :size="30" aria-hidden="true" />
            </span>
            <span class="exercise-copy">
              <span class="exercise-group">{{ exercise.muscleGroup || 'Cuerpo completo' }}</span>
              <strong>{{ exercise.name }}</strong>
              <span class="exercise-prescription">{{ primaryMuscle(exercise) }} <span aria-hidden="true">·</span> {{ recommendation.sets }} series</span>
            </span>
            <ChevronRight class="row-chevron" :size="19" aria-hidden="true" />
          </button>
        </AppCard>
      </li>
    </ul>
    <AppCard v-else class="empty-state">
      <Dumbbell :size="30" aria-hidden="true" />
      <h3>No encontramos ejercicios</h3>
      <p>Prueba otra búsqueda o selecciona otro grupo muscular.</p>
      <button type="button" class="action-button" @click="selectedGroup = 'all'; clearSearch()">Limpiar filtros</button>
    </AppCard>

    <Teleport to="body">
      <div v-if="selectedExercise" class="detail-backdrop" @click.self="selectedExercise = null" @keydown.esc="selectedExercise = null">
        <section class="exercise-detail" role="dialog" aria-modal="true" :aria-label="`Detalle de ${selectedExercise.name}`">
          <button type="button" class="detail-close" aria-label="Cerrar detalle" @click="selectedExercise = null"><X :size="20" /></button>
          <div class="detail-layout">
            <div class="detail-image-wrap">
              <img v-if="selectedExercise.imageUrl" :src="selectedExercise.imageUrl" :alt="`Demostración de ${selectedExercise.name}`" />
              <Dumbbell v-else :size="46" />
            </div>
            <div class="detail-content">
              <p class="eyebrow">{{ selectedExercise.muscleGroup || 'EJERCICIO' }}</p>
              <h2>{{ selectedExercise.name }}</h2>
              <div class="detail-stats">
                <div><strong>{{ recommendation.sets }}</strong><span>Series</span></div>
                <div><strong>{{ recommendation.repetitions }}</strong><span>Repeticiones</span></div>
                <div><strong>{{ primaryMuscle(selectedExercise) }}</strong><span>Músculo</span></div>
              </div>
              <AppCard v-if="selectedExercise.description" class="recommendation-card">
                <p><strong>Enfoque: {{ recommendation.focus }}</strong></p><p>{{ selectedExercise.description }}</p>
              </AppCard>
              <div class="detail-equipment"><span>Equipo necesario</span><strong>{{ selectedExercise.equipment || 'Sin equipo' }}</strong></div>
              <section class="technique-section">
                <h3><Check :size="17" /> Técnica de ejecución</h3>
                <ol v-if="selectedExercise.instructions?.length">
                  <li v-for="(instruction, index) in selectedExercise.instructions" :key="index">{{ instruction }}</li>
                </ol>
                <p v-else>{{ selectedExercise.technique || 'Mantén el movimiento controlado y detente si sientes dolor.' }}</p>
              </section>
              <section v-if="selectedExercise.mistakes?.length" class="mistakes-section">
                <h3>Errores frecuentes</h3><ul><li v-for="mistake in selectedExercise.mistakes" :key="mistake">{{ mistake }}</li></ul>
              </section>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.exercise-catalog { min-width:0; }
.exercise-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin:24px 0 18px; }
.eyebrow { margin:0 0 5px; color:var(--color-primary); font-size:10px; font-weight:800; letter-spacing:1.5px; }
.exercise-heading h2 { margin:0; font-size:clamp(20px,2vw,24px); }
.exercise-heading .muted { margin:6px 0 0; font-size:13px; }
.result-count { flex-shrink:0; color:var(--color-muted-text); font-size:13px; }
.exercise-search { display:flex; align-items:center; gap:10px; min-height:46px; margin:18px 0 13px; padding:0 13px; border:1px solid var(--color-card-border); border-radius:12px; background:var(--color-background); color:var(--color-primary); }
.exercise-search:focus-within { outline:2px solid var(--color-primary); outline-offset:2px; }
.exercise-search input { flex:1; width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--color-text); font:inherit; font-size:13px; }
.exercise-search input::placeholder { color:var(--color-muted-text); }
.exercise-search button { display:grid; place-items:center; width:28px; height:28px; padding:0; border:0; border-radius:50%; background:transparent; color:var(--color-muted-text); cursor:pointer; }
.muscle-filters { display:flex; gap:7px; overflow-x:auto; padding:2px 0 12px; border-bottom:1px solid var(--color-card-border); scrollbar-width:thin; }
.muscle-filters button { appearance:none; flex:0 0 auto; min-height:34px; padding:0 13px; border:1px solid var(--color-card-border); border-radius:999px; background:var(--color-surface); color:var(--color-muted-text); font:inherit; font-size:12px; cursor:pointer; transition:background .15s,border-color .15s,color .15s; }
.muscle-filters button:hover,.muscle-filters button.active { border-color:var(--color-primary); background:var(--color-indicator); color:var(--color-primary); }
.muscle-filters button:focus-visible,.exercise-row:focus-visible,.detail-close:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
.exercise-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin:16px 0 0; padding:0; list-style:none; }
.exercise-card { height:100%; overflow:hidden; border:1px solid var(--color-card-border); border-radius:15px; background:var(--color-surface); transition:border-color .16s,transform .16s; }
.exercise-card:hover { border-color:color-mix(in srgb,var(--color-primary) 48%,var(--color-card-border)); transform:translateY(-1px); }
.exercise-row { appearance:none; display:flex; align-items:center; gap:13px; width:100%; min-height:116px; padding:11px; border:0; background:transparent; color:var(--color-text); font:inherit; text-align:left; cursor:pointer; }
.exercise-image-wrap { display:grid; place-items:center; flex:0 0 116px; width:116px; height:92px; overflow:hidden; border-radius:10px; background:#f3f5f4; color:var(--color-primary); }
.exercise-image { display:block; width:100%; height:100%; object-fit:contain; }
.exercise-copy { display:grid; flex:1; align-content:center; gap:5px; min-width:0; }
.exercise-group { color:var(--color-primary); font-size:10px; font-weight:800; letter-spacing:.5px; text-transform:uppercase; }
.exercise-copy strong { display:-webkit-box; overflow:hidden; font-size:14px; line-height:1.35; overflow-wrap:anywhere; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
.exercise-prescription { color:var(--color-muted-text); font-size:11px; line-height:1.4; }
.row-chevron { flex:0 0 auto; color:var(--color-muted-text); }
.catalog-status { padding:30px 0; color:var(--color-muted-text); }
.empty-state { display:grid; justify-items:center; gap:10px; margin-top:18px; padding:30px; text-align:center; }
.empty-state svg { color:var(--color-primary); }.empty-state h3,.empty-state p { margin:0; }.empty-state p { color:var(--color-muted-text); font-size:13px; }
.action-button { min-height:38px; margin-top:5px; padding:0 14px; border:1px solid var(--color-primary); border-radius:9px; background:var(--color-indicator); color:var(--color-primary); font:inherit; cursor:pointer; }
.detail-backdrop { position:fixed; inset:0; z-index:1200; display:grid; place-items:center; overflow:auto; padding:24px; background:rgb(0 0 0 / 78%); backdrop-filter:blur(5px); }
.exercise-detail { position:relative; width:min(100%,960px); max-height:min(90vh,900px); overflow:auto; border:1px solid var(--color-card-border); border-radius:20px; background:var(--color-surface); box-shadow:0 25px 90px rgb(0 0 0 / 48%); }
.detail-close { position:absolute; top:12px; right:12px; z-index:2; display:grid; place-items:center; width:38px; height:38px; border:1px solid rgb(255 255 255 / 20%); border-radius:50%; background:rgb(0 0 0 / 70%); color:white; cursor:pointer; }
.detail-layout { display:grid; grid-template-columns:minmax(260px,.9fr) minmax(0,1.2fr); }
.detail-image-wrap { position:sticky; top:0; display:grid; place-items:center; min-height:360px; align-self:start; overflow:hidden; background:#f3f5f4; color:var(--color-primary); }
.detail-image-wrap img { width:100%; height:100%; max-height:520px; object-fit:contain; }
.detail-content { padding:clamp(22px,3vw,34px); }
.detail-content h2 { max-width:90%; margin:0 0 18px; font-size:clamp(21px,2.4vw,30px); line-height:1.2; }
.detail-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-bottom:14px; }
.detail-stats div { display:grid; justify-items:center; gap:5px; min-width:0; padding:12px 8px; border:1px solid var(--color-card-border); border-radius:11px; background:var(--color-background); text-align:center; }
.detail-stats strong { font-size:14px; overflow-wrap:anywhere; }.detail-stats span { color:var(--color-muted-text); font-size:10px; }
.recommendation-card { margin-bottom:12px; padding:13px; border:1px solid var(--color-card-border); background:var(--color-background); }.recommendation-card p { color:var(--color-muted-text); font-size:12px; line-height:1.5; }.recommendation-card p:first-child { margin-bottom:4px; color:var(--color-primary); }
.detail-equipment { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid var(--color-card-border); color:var(--color-muted-text); font-size:12px; }.detail-equipment strong { color:var(--color-text); text-align:right; }
.technique-section,.mistakes-section { margin-top:17px; }.technique-section h3,.mistakes-section h3 { display:flex; align-items:center; gap:7px; margin:0 0 10px; font-size:15px; }.technique-section h3 svg { color:var(--color-primary); }
.technique-section ol,.mistakes-section ul { display:grid; gap:8px; margin:0; padding-left:22px; }.technique-section li,.technique-section>p,.mistakes-section li { color:var(--color-muted-text); font-size:12px; line-height:1.55; }.technique-section li::marker,.mistakes-section li::marker { color:var(--color-primary); }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media(max-width:1050px) { .exercise-grid { grid-template-columns:1fr; } }
@media(max-width:700px) { .exercise-heading { align-items:flex-start; flex-direction:column; gap:8px; }.exercise-row { min-height:102px; gap:10px; padding:9px; }.exercise-image-wrap { flex-basis:94px; width:94px; height:74px; }.exercise-copy strong { font-size:13px; }.detail-backdrop { align-items:end; padding:0; }.exercise-detail { width:100%; max-height:94vh; border-radius:20px 20px 0 0; }.detail-layout { grid-template-columns:1fr; }.detail-image-wrap { position:relative; min-height:0; height:220px; }.detail-image-wrap img { max-height:220px; }.detail-content { padding:22px 18px 28px; }.detail-close { top:10px; right:10px; } }
@media(max-width:460px) { .exercise-grid { grid-template-columns:1fr; }.exercise-row { min-height:96px; }.muscle-filters button { min-height:32px; padding:0 11px; } }
</style>
