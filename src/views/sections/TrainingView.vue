<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bookmark, BookmarkCheck, BookmarkMinus, CalendarDays, Clock, Dumbbell, LoaderCircle, Plus, Trash2 } from 'lucide-vue-next'
import AppCard from '@/components/AppCard.vue'
import ExerciseCatalog from '@/components/ExerciseCatalog.vue'
import CreateRoutineDialog from '@/components/CreateRoutineDialog.vue'
import RoutineSession from '@/components/RoutineSession.vue'
import { useTrainingController } from '@/controllers/useTrainingController'

const { routines, isLoading, error, loadRoutines, myRoutines, myLoading, myError, actionError, pendingIds, savedIds, canManageRoutines, loadMyRoutines, changeSavedRoutine, removeCustomRoutine } = useTrainingController()
onMounted(() => { loadRoutines(); loadMyRoutines() })
const selectedCatalog = ref('routines')
const selectedRoutineId = ref(null)
const createRoutineOpen = ref(false)
const isMyCatalog = computed(() => selectedCatalog.value === 'mine')
const displayedRoutines = computed(() => isMyCatalog.value ? myRoutines.value : routines.value)
const loading = computed(() => isMyCatalog.value ? myLoading.value : isLoading.value)
const catalogError = computed(() => isMyCatalog.value ? myError.value : error.value)
function selectMyRoutines() { selectedCatalog.value = 'mine'; loadMyRoutines() }
const routineOrigin = routine => myRoutines.value.find(item => item.id === routine.id)?.origin ?? routine.origin
const bookmarkLabel = routine => routineOrigin(routine) === 'assigned' ? `${routine.name}: rutina asignada` : routineOrigin(routine) === 'saved' ? `Quitar ${routine.name} de mis rutinas` : `Guardar ${routine.name} en mis rutinas`
async function onRoutineCreated(routine) {
  selectedCatalog.value = 'mine'
  actionError.value = ''
  await loadMyRoutines()
  if (routine?.id && !myRoutines.value.some(item => String(item.id) === String(routine.id))) {
    actionError.value = 'La rutina se creó, pero no apareció en “Mis rutinas”. Actualiza la lista para volver a cargarla.'
  }
}
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
    <CreateRoutineDialog :open="createRoutineOpen" @close="createRoutineOpen = false" @created="onRoutineCreated" />
    <div v-show="!selectedRoutineId">
    <div class="catalog-navigation" role="group" aria-label="Seleccionar catálogo">
      <button type="button" :aria-pressed="selectedCatalog === 'routines'" @click="selectedCatalog = 'routines'">Rutinas</button>
      <button type="button" :aria-pressed="selectedCatalog === 'exercises'" @click="selectedCatalog = 'exercises'">Ejercicios</button>
      <button type="button" :aria-pressed="isMyCatalog" @click="selectMyRoutines">Mis rutinas</button>
    </div>
    <div v-if="selectedCatalog === 'exercises'" class="exercise-tab">
      <div class="create-routine-row">
        <div><strong>Arma tu propio entrenamiento</strong><p class="muted">Combina movimientos y configura series y repeticiones.</p></div>
        <button v-if="canManageRoutines" type="button" class="create-routine-button" @click="createRoutineOpen = true"><Plus :size="18" /> Crear rutina</button>
        <a v-else class="create-routine-button" href="/login"><Plus :size="18" /> Inicia sesión para crear una rutina</a>
      </div>
      <ExerciseCatalog />
    </div>
    <div v-show="selectedCatalog !== 'exercises'">
    <div class="catalog-heading">
      <h2>{{ isMyCatalog ? 'Mis rutinas' : 'Rutinas' }}</h2>
      <span v-if="!loading && !catalogError" class="muted">{{ displayedRoutines.length }} {{ displayedRoutines.length === 1 ? 'disponible' : 'disponibles' }}</span>
      <button v-if="isMyCatalog && canManageRoutines" type="button" class="create-routine-button" @click="createRoutineOpen = true"><Plus :size="18" /> Crear rutina</button>
    </div>

    <p v-if="actionError" role="alert">{{ actionError }}</p>
    <p v-else-if="catalogError && displayedRoutines.length" class="catalog-warning" role="status">{{ catalogError }} Se muestran las rutinas cargadas anteriormente.</p>
    <p v-if="loading" role="status">Cargando rutinas…</p>
    <AppCard v-else-if="isMyCatalog && !canManageRoutines" class="empty-state">
      <p>Inicia sesión para consultar tus rutinas guardadas o asignadas.</p>
      <a href="/login">Iniciar sesión</a>
    </AppCard>
    <AppCard v-else-if="catalogError && !displayedRoutines.length" class="empty-state">
      <p role="alert">{{ catalogError }}</p>
      <button type="button" @click="isMyCatalog ? loadMyRoutines() : loadRoutines()">Reintentar</button>
    </AppCard>
    <ul v-else-if="displayedRoutines.length" class="routine-grid" :aria-label="isMyCatalog ? 'Mis rutinas' : 'Catálogo de rutinas'">
      <li v-for="routine in displayedRoutines" :key="routine.id">
        <AppCard class="routine-card" padding="0">
          <div class="routine-face">
            <img :src="routine.image" alt="" class="routine-image" width="361" height="298" />
            <div class="routine-info">
            <h3>{{ routine.name }}</h3>
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
            </div>
          </div>
          <button type="button" class="routine-select" :aria-label="`Ver rutina ${routine.name}`" @click="selectedRoutineId = routine.custom ? `custom:${routine.id}` : routine.id"></button>
          <template v-if="canManageRoutines">
            <button v-if="routine.custom" type="button" class="bookmark-routine delete-custom-routine" :disabled="pendingIds.has(routine.id)" :aria-label="`Eliminar ${routine.name}`" title="Eliminar rutina" @click="removeCustomRoutine(routine.id)">
              <LoaderCircle v-if="pendingIds.has(routine.id)" class="bookmark-loading" :size="19" aria-hidden="true" />
              <Trash2 v-else :size="18" aria-hidden="true" />
            </button>
            <button v-else type="button" class="bookmark-routine" :class="{ saved: savedIds.has(routine.id), removable: routineOrigin(routine) === 'saved' }" :disabled="pendingIds.has(routine.id) || routineOrigin(routine) === 'assigned'" :aria-label="bookmarkLabel(routine)" :title="pendingIds.has(routine.id) ? 'Actualizando…' : routineOrigin(routine) === 'assigned' ? 'Rutina asignada' : routineOrigin(routine) === 'saved' ? 'Quitar' : 'Guardar'" @click="changeSavedRoutine(routine, routineOrigin(routine) === 'saved')">
              <LoaderCircle v-if="pendingIds.has(routine.id)" class="bookmark-loading" :size="19" aria-hidden="true" />
              <template v-else-if="savedIds.has(routine.id)">
                <BookmarkCheck class="bookmark-check-icon" :size="19" aria-hidden="true" />
                <BookmarkMinus v-if="routineOrigin(routine) === 'saved'" class="bookmark-remove-icon" :size="19" aria-hidden="true" />
              </template>
              <Bookmark v-else :size="19" aria-hidden="true" />
              <span class="bookmark-tooltip" aria-hidden="true">{{ routineOrigin(routine) === 'saved' ? 'Quitar' : 'Guardar' }}</span>
            </button>
          </template>
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
h1 { font-size: clamp(26px, 2.8vw, 34px); letter-spacing: -.7px; }
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
.routine-grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.routine-card { position: relative; height: 100%; display: flex; flex-direction:column; align-items:stretch; overflow:hidden; background: linear-gradient(135deg, #0b1713, #050907); }
.routine-face { height:100%; }
.routine-select { position:absolute; z-index:1; inset:0; width:100%; height:100%; padding:0; border:0; border-radius:inherit; background:transparent; cursor:pointer; }
.routine-select:focus-visible { outline:2px solid var(--color-primary); outline-offset:-3px; }
.bookmark-routine { position: absolute; z-index:2; top: 10px; right: 10px; width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--color-card-border); border-radius: 10px; background: #0b1713; color: var(--color-primary); cursor: pointer; transition: color .18s ease, background .18s ease, border-color .18s ease, transform .18s ease; }
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
.routine-image { display:block; width:100%; height:clamp(120px,10vw,148px); object-fit:contain; background:#f4f5f3; flex-shrink:0; }
.routine-info { position:relative; flex:1; padding:14px 14px 13px; min-width:0; }
.level { display: inline-block; color: var(--color-accent); background: var(--color-indicator); border-radius: 6px; padding: 5px 8px; font-size: 12px; }
h3 { margin: 0 0 12px; font-size: 19px; overflow-wrap: anywhere; }
.routine-classification { margin: 0 0 14px; display: grid; gap: 12px; }
.routine-classification dt { color: var(--color-muted-text); font-size: 12px; margin-bottom: 5px; }
.routine-classification dd { margin: 0; }
.session-duration { color: var(--color-text, #fff); font-weight: 600; }
.duration { color: var(--color-muted-text); font-size: 13px; line-height: 1.6; display: flex; align-items: center; gap: 7px; }
.duration svg { flex-shrink: 0; }
.empty-state { text-align: center; }
.empty-state svg { color: var(--color-primary); }
@media (max-width: 760px) {
  .routine-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; }
  .training-page { padding-top: 28px; }
  .routine-image { height:clamp(130px,28vw,180px); }
  .routine-info { padding:20px 14px 14px; }
  h3 { font-size: 20px; }
  .header-icon { display: none; }
  .create-routine-row { align-items:stretch; flex-direction:column; }
}
@media(max-width:540px) { .routine-grid { grid-template-columns:1fr; }.routine-image { height:190px; } }
.create-routine-row { display:flex; align-items:center; justify-content:space-between; gap:16px; margin:8px 0 18px; }
.create-routine-row p { margin:5px 0 0; }
.create-routine-row strong { font-size:16px; }
.create-routine-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; flex-shrink:0; min-height:42px; padding:0 15px; border:1px solid var(--color-primary); border-radius:11px; background:var(--color-primary); color:#04110b; font:inherit; font-size:13px; font-weight:700; text-decoration:none; cursor:pointer; }
.create-routine-button:hover { filter:brightness(1.08); }
.catalog-heading .create-routine-button { margin-left:auto; margin-bottom:10px; }
.delete-custom-routine { color:var(--color-error); }
.catalog-warning { margin:0 0 14px; color:var(--color-muted-text); font-size:12px; }
@media (min-width: 761px) {
  .routine-grid { grid-template-columns: repeat(4,minmax(0,1fr)); gap:13px; }
}
@media (min-width: 901px) {
  .training-page { padding-top: 26px; }
  .eyebrow { margin-bottom: 8px; }
  h1 { font-size: clamp(25px, 2vw, 30px); }
  .introduction { margin-top: 7px; font-size: 14px; }
  .catalog-navigation { margin: 20px 0; }
  .catalog-navigation button { padding: 11px 15px; font-size: 14px; }
  .catalog-heading { margin: 24px 0 18px; }
  .catalog-heading h2 { font-size: 18px; padding-bottom: 11px; }
  .routine-grid { grid-template-columns: repeat(4,minmax(0,1fr)); gap: 13px; }
  .routine-image { height: clamp(115px, 10vw, 145px); }
  .routine-info { padding: 13px 13px 12px; }
  h3 { margin-bottom: 9px; font-size: 17px; }
  .save-routine { margin-top: 9px; padding: 8px 10px; font-size: 12px; }
  .routine-classification { gap: 8px; margin-bottom: 10px; }
  .duration { font-size: 12px; }
}
</style>
