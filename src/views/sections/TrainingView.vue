<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bookmark, BookmarkCheck, BookmarkMinus, CalendarDays, Clock, Dumbbell, LoaderCircle } from 'lucide-vue-next'
import AppCard from '@/components/AppCard.vue'
import ExerciseCatalog from '@/components/ExerciseCatalog.vue'
import RoutineSession from '@/components/RoutineSession.vue'
import { useTrainingController } from '@/controllers/useTrainingController'

const { routines, isLoading, error, loadRoutines, myRoutines, myLoading, myError, actionError, pendingIds, savedIds, canManageRoutines, loadMyRoutines, changeSavedRoutine } = useTrainingController()
onMounted(() => { loadRoutines(); loadMyRoutines() })
const selectedCatalog = ref('routines')
const selectedRoutineId = ref(null)
const isMyCatalog = computed(() => selectedCatalog.value === 'mine')
const displayedRoutines = computed(() => isMyCatalog.value ? myRoutines.value : routines.value)
const loading = computed(() => isMyCatalog.value ? myLoading.value : isLoading.value)
const catalogError = computed(() => isMyCatalog.value ? myError.value : error.value)
function selectMyRoutines() { selectedCatalog.value = 'mine'; loadMyRoutines() }
const routineOrigin = routine => myRoutines.value.find(item => item.id === routine.id)?.origin ?? routine.origin
const bookmarkLabel = routine => routineOrigin(routine) === 'assigned' ? `${routine.name}: rutina asignada` : routineOrigin(routine) === 'saved' ? `Quitar ${routine.name} de mis rutinas` : `Guardar ${routine.name} en mis rutinas`
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

    <RoutineSession :routine-id="selectedRoutineId" @close="selectedRoutineId = null" @select="selectedRoutineId = $event" />
    <div v-show="!selectedRoutineId">
    <div class="catalog-navigation" role="group" aria-label="Seleccionar catálogo">
      <button type="button" :aria-pressed="selectedCatalog === 'routines'" @click="selectedCatalog = 'routines'">Rutinas</button>
      <button type="button" :aria-pressed="selectedCatalog === 'exercises'" @click="selectedCatalog = 'exercises'">Ejercicios</button>
      <button type="button" :aria-pressed="isMyCatalog" @click="selectMyRoutines">Mis rutinas</button>
    </div>
    <ExerciseCatalog v-if="selectedCatalog === 'exercises'" />
    <div v-show="selectedCatalog !== 'exercises'">
    <div class="catalog-heading">
      <h2>{{ isMyCatalog ? 'Mis rutinas' : 'Rutinas' }}</h2>
      <span v-if="!loading && !catalogError" class="muted">{{ displayedRoutines.length }} {{ displayedRoutines.length === 1 ? 'disponible' : 'disponibles' }}</span>
    </div>

    <p v-if="actionError" role="alert">{{ actionError }}</p>
    <p v-if="loading" role="status">Cargando rutinas…</p>
    <AppCard v-else-if="isMyCatalog && !canManageRoutines" class="empty-state">
      <p>Inicia sesión para consultar tus rutinas guardadas o asignadas.</p>
      <a href="/login">Iniciar sesión</a>
    </AppCard>
    <AppCard v-else-if="catalogError" class="empty-state">
      <p role="alert">{{ catalogError }}</p>
      <button type="button" @click="isMyCatalog ? loadMyRoutines() : loadRoutines()">Reintentar</button>
    </AppCard>
    <ul v-else-if="displayedRoutines.length" class="routine-grid" :aria-label="isMyCatalog ? 'Mis rutinas' : 'Catálogo de rutinas'">
      <li v-for="routine in displayedRoutines" :key="routine.id">
        <AppCard class="routine-card" padding="0">
          <img :src="routine.image" alt="" class="routine-image" width="361" height="298" />
          <div class="routine-info">
            <h3>{{ routine.name }}</h3>
            <button type="button" class="save-routine" @click="selectedRoutineId = routine.id">Ver detalle de {{ routine.name }}</button>
            <p v-if="isMyCatalog" class="origin">{{ routine.origin === 'assigned' ? 'Asignada' : 'Guardada' }}</p>
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
            <template v-if="canManageRoutines">
              <button type="button" class="bookmark-routine" :class="{ saved: savedIds.has(routine.id), removable: routineOrigin(routine) === 'saved' }" :disabled="pendingIds.has(routine.id) || routineOrigin(routine) === 'assigned' || Boolean(myError) || myLoading" :aria-label="bookmarkLabel(routine)" :title="pendingIds.has(routine.id) ? 'Actualizando…' : routineOrigin(routine) === 'assigned' ? 'Rutina asignada' : routineOrigin(routine) === 'saved' ? 'Quitar' : 'Guardar'" @click="changeSavedRoutine(routine.id, routineOrigin(routine) === 'saved')">
                <LoaderCircle v-if="pendingIds.has(routine.id)" class="bookmark-loading" :size="21" aria-hidden="true" />
                <template v-else-if="savedIds.has(routine.id)">
                  <BookmarkCheck class="bookmark-check-icon" :size="21" aria-hidden="true" />
                  <BookmarkMinus v-if="routineOrigin(routine) === 'saved'" class="bookmark-remove-icon" :size="21" aria-hidden="true" />
                </template>
                <Bookmark v-else :size="21" aria-hidden="true" />
                <span class="bookmark-tooltip" aria-hidden="true">{{ routineOrigin(routine) === 'saved' ? 'Quitar' : 'Guardar' }}</span>
              </button>
            </template>
          </div>
        </AppCard>
      </li>
    </ul>
    <AppCard v-else class="empty-state">
      <Dumbbell :size="32" aria-hidden="true" />
      <h3>{{ isMyCatalog ? 'Aún no tienes rutinas guardadas o asignadas' : 'Aún no hay rutinas disponibles' }}</h3>
      <p class="muted">{{ isMyCatalog ? 'Guarda una rutina del catálogo para encontrarla aquí.' : 'Vuelve más adelante para consultar el catálogo.' }}</p>
      <button v-if="isMyCatalog" type="button" class="save-routine" @click="selectedCatalog = 'routines'">Explorar rutinas</button>
    </AppCard>
    </div>
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
.catalog-navigation { flex-wrap: wrap; gap: 0; }
.save-routine { margin-top: 14px; border: 1px solid var(--color-primary); border-radius: 8px; background: transparent; color: var(--color-primary); padding: 10px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.save-routine:disabled { opacity: .6; cursor: default; }
.save-routine:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.origin { color: var(--color-primary); font-size: 13px; margin-bottom: 14px; }
.catalog-heading { display: flex; align-items: center; justify-content: space-between; margin: 36px 0 24px; border-bottom: 1px solid var(--color-card-border); }
.catalog-heading h2 { color: var(--color-primary); font-size: 20px; padding: 0 8px 16px; border-bottom: 3px solid var(--color-primary); }
.catalog-heading span { font-size: 13px; padding-bottom: 16px; }
.routine-grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.routine-card { position: relative; height: 100%; display: flex; align-items: center; background: linear-gradient(135deg, #0b1713, #050907); }
.bookmark-routine { position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid var(--color-card-border); border-radius: 10px; background: #0b1713; color: var(--color-primary); cursor: pointer; transition: color .18s ease, background .18s ease, border-color .18s ease, transform .18s ease; }
.bookmark-routine > svg { grid-area: 1 / 1; transition: opacity .18s ease, transform .18s ease; }
.bookmark-remove-icon { opacity: 0; transform: scale(.65); }
.bookmark-routine.removable:is(:hover, :focus-visible):not(:disabled) { color: #ff7878; border-color: #ff7878; background: #391719; transform: translateY(-2px); }
.bookmark-routine.removable:is(:hover, :focus-visible):not(:disabled) .bookmark-check-icon { opacity: 0; transform: scale(.65); }
.bookmark-routine.removable:is(:hover, :focus-visible):not(:disabled) .bookmark-remove-icon { opacity: 1; transform: scale(1); }
.bookmark-tooltip { pointer-events: none; position: absolute; top: calc(100% + 7px); right: 0; width: max-content; max-width: 190px; padding: 7px 10px; border-radius: 7px; font-size: 12px; line-height: 1.4; background: #18251f; color: #fff; opacity: 0; transform: translateY(-4px); transition: opacity .18s ease, transform .18s ease; z-index: 2; }
.bookmark-routine:is(:hover, :focus-visible):not(:disabled) .bookmark-tooltip { opacity: 1; transform: translateY(0); }
.bookmark-routine.removable .bookmark-tooltip { background: #391719; color: #ffb2b2; }
.bookmark-routine:hover:not(:disabled), .bookmark-routine.saved { border-color: var(--color-primary); background: #103b2d; }
.bookmark-routine:disabled { cursor: default; }
.bookmark-routine:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
.bookmark-loading { animation: bookmark-spin 1s linear infinite; }
@keyframes bookmark-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .bookmark-loading { animation: none; } .bookmark-routine, .bookmark-routine > svg, .bookmark-tooltip { transition: none; } }
.routine-image { width: 36%; align-self: stretch; height: auto; min-height: 240px; object-fit: cover; flex-shrink: 0; }
.routine-info { padding: 58px 20px 20px; min-width: 0; }
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
  .routine-info { padding: 58px 16px 16px; }
  h3 { font-size: 20px; }
  .header-icon { display: none; }
}
</style>
