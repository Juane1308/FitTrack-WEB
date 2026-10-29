<script setup>
import { computed, ref, watch } from 'vue'
import { Check, Dumbbell, Plus, Search, Trash2, X } from 'lucide-vue-next'
import { TrainingRepository } from '@/repositories/trainingRepository'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'created'])
const repository = new TrainingRepository()
const catalog = ref([])
const selected = ref([])
const name = ref('')
const description = ref('')
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const filtered = computed(() => {
  const term = normalize(search.value.trim())
  return catalog.value.filter(exercise => !selected.value.some(item => item.slug === exercise.slug)
    && normalize(`${exercise.name} ${exercise.group} ${(exercise.primaryMuscles ?? []).join(' ')}`).includes(term)).slice(0, 8)
})
const canSave = computed(() => name.value.trim().length >= 2 && selected.value.length > 0 && !saving.value)

watch(() => props.open, async open => {
  if (!open || catalog.value.length) return
  loading.value = true
  try { catalog.value = await repository.getExercises() }
  catch { error.value = 'No se pudo cargar el catálogo de ejercicios.' }
  finally { loading.value = false }
})

function add(exercise) {
  if (!exercise.slug || selected.value.some(item => item.slug === exercise.slug)) return
  selected.value = [...selected.value, { slug: exercise.slug, name: exercise.name, imageUrl: exercise.imageUrl, sets: 3, repetitions: 10, restSeconds: 60 }]
}
function remove(slug) { selected.value = selected.value.filter(item => item.slug !== slug) }
function close() { if (!saving.value) emit('close') }
async function save() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  try {
    const result = await repository.createCustomRoutine({
      name: name.value.trim(), description: description.value.trim(),
      exercises: selected.value.map(({ slug, sets, repetitions, restSeconds }) => ({ slug, sets: Number(sets), repetitions: Number(repetitions), restSeconds: Number(restSeconds) })),
    })
    emit('created', result.routine)
    name.value = ''; description.value = ''; selected.value = []; search.value = ''
    emit('close')
  } catch (exception) {
    error.value = exception.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' : exception.message || 'No se pudo guardar la rutina.'
  } finally { saving.value = false }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="builder-backdrop" @click.self="close">
      <section class="routine-builder" role="dialog" aria-modal="true" aria-labelledby="builder-title">
        <header class="builder-header">
          <div><p class="eyebrow">ENTRENAMIENTO PERSONALIZADO</p><h2 id="builder-title">Crear una rutina</h2><p>Elige ejercicios y define las series y repeticiones para cada uno.</p></div>
          <button type="button" class="close-button" aria-label="Cerrar" :disabled="saving" @click="close"><X :size="21" /></button>
        </header>
        <div class="builder-fields">
          <label>Nombre de la rutina<input v-model="name" type="text" maxlength="80" placeholder="Ej. Tren superior en casa" /></label>
          <label>Descripción <span class="optional">(opcional)</span><textarea v-model="description" rows="2" maxlength="300" placeholder="¿Qué quieres trabajar hoy?" /></label>
        </div>
        <div class="builder-columns">
          <section class="exercise-picker">
            <h3>Agregar ejercicios</h3>
            <label class="picker-search"><Search :size="17" /><span class="sr-only">Buscar ejercicio</span><input v-model="search" type="search" placeholder="Buscar ejercicio" /></label>
            <p v-if="loading" class="muted">Cargando catálogo…</p>
            <p v-else-if="error && !catalog.length" class="error">{{ error }}</p>
            <ul v-else class="picker-list">
              <li v-for="exercise in filtered" :key="exercise.slug">
                <img v-if="exercise.imageUrl" :src="exercise.imageUrl" alt="" loading="lazy" />
                <span v-else class="picker-icon"><Dumbbell :size="18" /></span>
                <span class="picker-copy"><strong>{{ exercise.name }}</strong><small>{{ exercise.primaryMuscles?.[0] || exercise.group }}</small></span>
                <button type="button" class="add-button" :aria-label="`Agregar ${exercise.name}`" @click="add(exercise)"><Plus :size="18" /></button>
              </li>
              <li v-if="!filtered.length && !loading" class="muted picker-empty">No hay más resultados. Cambia la búsqueda o agrega otros ejercicios.</li>
            </ul>
          </section>
          <section class="selected-exercises">
            <header><h3>Tu rutina</h3><span>{{ selected.length }} ejercicios</span></header>
            <div v-if="!selected.length" class="empty-selection"><Dumbbell :size="25" /><p>Agrega al menos un ejercicio para continuar.</p></div>
            <ol v-else class="selected-list">
              <li v-for="(exercise, index) in selected" :key="exercise.slug">
                <div class="selected-exercise-heading">
                  <span class="order">{{ String(index + 1).padStart(2, '0') }}</span>
                  <img v-if="exercise.imageUrl" :src="exercise.imageUrl" alt="" />
                  <strong>{{ exercise.name }}</strong>
                  <button type="button" class="remove-button" :aria-label="`Quitar ${exercise.name}`" @click="remove(exercise.slug)"><Trash2 :size="16" /></button>
                </div>
                <div class="exercise-settings">
                  <label>Series<input v-model.number="exercise.sets" type="number" min="1" max="10" /></label>
                  <label>Repeticiones<input v-model.number="exercise.repetitions" type="number" min="1" max="100" /></label>
                  <label>Descanso (s)<input v-model.number="exercise.restSeconds" type="number" min="0" max="600" step="5" /></label>
                </div>
              </li>
            </ol>
          </section>
        </div>
        <p v-if="error && selected.length" class="error builder-error" role="alert">{{ error }}</p>
        <footer class="builder-footer"><span class="muted">La rutina quedará guardada en “Mis rutinas”.</span><button type="button" class="save-button" :disabled="!canSave" @click="save"><Check v-if="!saving" :size="18" />{{ saving ? 'Guardando…' : 'Guardar rutina' }}</button></footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.builder-backdrop { position:fixed; inset:0; z-index:1100; display:grid; place-items:center; overflow-y:auto; padding:26px; background:rgb(0 0 0 / 78%); backdrop-filter:blur(6px); }
.routine-builder { width:min(100%,1100px); max-height:92vh; overflow:auto; padding:clamp(22px,3vw,34px); border:1px solid var(--color-card-border); border-radius:22px; background:var(--color-surface); box-shadow:0 30px 100px rgb(0 0 0 / 45%); }
.builder-header { display:flex; justify-content:space-between; gap:18px; margin-bottom:22px; }.builder-header h2 { margin:0; font-size:clamp(24px,3vw,32px); }.builder-header p:last-child { margin:8px 0 0; color:var(--color-muted-text); font-size:13px; line-height:1.5; }
.eyebrow { margin:0 0 8px; color:var(--color-primary); font-size:10px; font-weight:800; letter-spacing:1.5px; }.close-button { flex:0 0 40px; height:40px; border:1px solid var(--color-card-border); border-radius:11px; background:transparent; color:var(--color-muted-text); cursor:pointer; }.close-button:disabled { opacity:.5; }
.builder-fields { display:grid; grid-template-columns:1fr 1.4fr; gap:14px; margin-bottom:20px; }.builder-fields label { display:grid; gap:7px; color:var(--color-muted-text); font-size:12px; font-weight:600; }.optional { font-weight:400; }.builder-fields input,.builder-fields textarea,.picker-search input,.exercise-settings input { width:100%; min-width:0; border:1px solid var(--color-input-border); border-radius:10px; padding:11px 12px; background:var(--color-background); color:var(--color-text); font:inherit; font-size:13px; }.builder-fields textarea { resize:vertical; }.builder-fields input:focus,.builder-fields textarea:focus,.picker-search:focus-within,.exercise-settings input:focus { outline:2px solid var(--color-primary); outline-offset:1px; }
.builder-columns { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.1fr); gap:18px; }.exercise-picker,.selected-exercises { min-width:0; padding:17px; border:1px solid var(--color-card-border); border-radius:15px; background:color-mix(in srgb,var(--color-background) 45%,var(--color-surface)); }.exercise-picker h3,.selected-exercises h3 { margin:0; font-size:16px; }.picker-search { display:flex; align-items:center; gap:8px; margin:12px 0; color:var(--color-muted-text); }.picker-search input { padding:10px 11px; }.picker-list,.selected-list { display:grid; gap:8px; max-height:44vh; overflow:auto; margin:0; padding:0; list-style:none; }.picker-list li { display:grid; grid-template-columns:48px minmax(0,1fr) 34px; align-items:center; gap:9px; padding:7px; border:1px solid transparent; border-radius:10px; }.picker-list li:hover { border-color:var(--color-card-border); background:var(--color-surface); }.picker-list img,.picker-icon { display:grid; place-items:center; width:48px; height:42px; border-radius:7px; object-fit:cover; background:var(--color-indicator); color:var(--color-primary); }.picker-copy { display:grid; min-width:0; gap:4px; }.picker-copy strong { display:-webkit-box; overflow:hidden; font-size:12px; line-height:1.4; text-overflow:ellipsis; white-space:normal; -webkit-box-orient:vertical; -webkit-line-clamp:2; }.picker-copy small { overflow:hidden; color:var(--color-muted-text); font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.add-button,.remove-button { display:grid; place-items:center; width:32px; height:32px; border:1px solid var(--color-card-border); border-radius:9px; background:transparent; color:var(--color-primary); cursor:pointer; }.picker-empty { grid-template-columns:1fr !important; padding:18px 8px !important; font-size:12px; line-height:1.5; }
.selected-exercises>header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:13px; }.selected-exercises>header span { color:var(--color-primary); font-size:12px; }.selected-list { max-height:50vh; }.selected-list>li { padding:11px; border:1px solid var(--color-card-border); border-radius:12px; background:var(--color-surface); }.selected-exercise-heading { display:grid; grid-template-columns:30px 42px minmax(0,1fr) 32px; align-items:center; gap:9px; }.selected-exercise-heading img { width:42px; height:38px; border-radius:7px; object-fit:cover; }.selected-exercise-heading strong { font-size:12px; line-height:1.35; }.order { color:var(--color-primary); font-size:11px; font-weight:800; }.remove-button { color:var(--color-error); }.exercise-settings { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:12px 0 0 39px; }.exercise-settings label { display:grid; gap:5px; color:var(--color-muted-text); font-size:10px; }.exercise-settings input { padding:8px; text-align:center; }.empty-selection { display:grid; place-items:center; min-height:140px; color:var(--color-muted-text); text-align:center; }.empty-selection svg { color:var(--color-primary); }.empty-selection p { max-width:220px; font-size:12px; line-height:1.5; }.builder-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:20px; padding-top:17px; border-top:1px solid var(--color-card-border); }.muted { color:var(--color-muted-text); font-size:12px; }.save-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 18px; border:1px solid var(--color-primary); border-radius:11px; background:var(--color-primary); color:#04110b; font:inherit; font-weight:800; cursor:pointer; }.save-button:disabled { opacity:.45; cursor:not-allowed; }.error { color:var(--color-error); font-size:12px; }.builder-error { margin:14px 0 0; }.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
@media(max-width:760px) { .builder-backdrop { align-items:end; padding:0; }.routine-builder { width:100%; max-height:95vh; padding:22px 18px 28px; border-radius:22px 22px 0 0; }.builder-fields,.builder-columns { grid-template-columns:1fr; }.picker-list { max-height:28vh; }.selected-list { max-height:none; }.builder-footer { align-items:stretch; flex-direction:column; }.save-button { width:100%; } }
</style>
