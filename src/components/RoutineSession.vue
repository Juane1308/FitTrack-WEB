<script setup>
import { watch } from 'vue'
import { ArrowLeft, ArrowRight, Check, Clock3, Dumbbell, Pause, Play, Timer } from 'lucide-vue-next'
import { useRoutineSessionController } from '@/controllers/useRoutineSessionController'
import { onEnter } from '@/controllers/onEnter'

const props = defineProps({ routineId: { type: [String, Number], default: null } })
const emit = defineEmits(['close', 'select'])
const c = useRoutineSessionController()
const { detail, selectedId, loading, busy, error, session, completedSets, completedExercises, result, isActiveRoutine, canFinish, currentExercise, currentExerciseIndex, currentExerciseSetGoal, currentExerciseCompletedSets, formattedTime, timerPaused, resumeRoutineId, authenticated } = c
watch(() => props.routineId, id => { if (id != null) c.openRoutine(id) }, { immediate: true })
onEnter(c.restoreSession)
function close() { c.close(); emit('close') }
function resume() { if (resumeRoutineId.value) emit('select', resumeRoutineId.value) }
function exerciseImage(exercise) { return exercise?.imageUrl || exercise?.image || null }
</script>

<template>
  <aside v-if="session && !selectedId" class="active-banner" aria-label="Rutina en curso">
    <div><strong>Entrenamiento en curso</strong><p>Tiempo activo: {{ formattedTime }}</p></div>
    <div class="banner-actions">
      <button type="button" class="secondary-button" @click="c.toggleTimer"><Pause v-if="!timerPaused" :size="16" /><Play v-else :size="16" /> {{ timerPaused ? 'Reanudar' : 'Pausar' }}</button>
      <button type="button" class="primary-button" @click="resume">Retomar rutina</button>
    </div>
  </aside>

  <section v-if="selectedId" class="routine-detail" aria-label="Detalle de rutina" :aria-busy="loading">
    <button type="button" class="back-button" :disabled="busy" @click="close"><ArrowLeft :size="17" /> Volver a rutinas</button>
    <p v-if="loading" role="status">Cargando rutina…</p>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <button v-if="!loading && !detail" type="button" class="primary-button" @click="c.openRoutine(selectedId)">Reintentar</button>
    <template v-if="detail">
      <header class="detail-header">
        <div><p class="eyebrow">{{ isActiveRoutine ? 'ENTRENAMIENTO EN CURSO' : 'DETALLE DE RUTINA' }}</p><h2>{{ detail.name }}</h2><p v-if="detail.description" class="muted">{{ detail.description }}</p></div>
        <span class="duration-chip"><Clock3 :size="17" /> {{ detail.durationMinutes }} min</span>
      </header>
      <div class="routine-facts">
        <div><small>Objetivo</small><strong>{{ detail.goal || 'No especificado' }}</strong></div>
        <div><small>Nivel</small><strong>{{ detail.level || 'No especificado' }}</strong></div>
        <div><small>Grupos musculares</small><strong>{{ detail.muscleGroup || 'No especificado' }}</strong></div>
        <div><small>Ejercicios</small><strong>{{ detail.exercises.length }}</strong></div>
      </div>

      <div v-if="isActiveRoutine" class="session-layout">
        <section class="workout-player" aria-label="Ejercicio actual">
          <div class="player-topline">
            <div><p class="eyebrow">EJERCICIO {{ currentExerciseIndex + 1 }} DE {{ detail.exercises.length }}</p><p class="muted">{{ completedExercises.length }} ejercicios completados</p></div>
            <div class="stopwatch" :class="{ paused: timerPaused }" role="timer"><Timer :size="20" /><strong>{{ formattedTime }}</strong></div>
          </div>
          <div class="player-image">
            <img v-if="exerciseImage(currentExercise)" :src="exerciseImage(currentExercise)" :alt="`Demostración de ${currentExercise.name}`" />
            <Dumbbell v-else :size="46" />
          </div>
          <div v-if="currentExercise" class="player-content">
            <h3>{{ currentExercise.name }}</h3>
            <p class="prescription">{{ currentExercise.sets }} series · {{ currentExercise.repetitions != null ? `${currentExercise.repetitions} repeticiones` : `${currentExercise.durationSeconds} segundos` }}{{ currentExercise.perSide ? ' por lado' : '' }}</p>
            <div class="exercise-meta">
              <span><strong>Músculo</strong>{{ currentExercise.primaryMuscle || currentExercise.muscleGroup || 'Cuerpo completo' }}</span>
              <span><strong>Equipo</strong>{{ currentExercise.equipment || 'Sin equipo' }}</span>
              <span><strong>Descanso</strong>{{ currentExercise.restSeconds ?? 0 }} s</span>
            </div>
            <p v-if="currentExercise.description" class="exercise-description">{{ currentExercise.description }}</p>
            <div class="set-tracker">
              <div class="tracker-label"><span>Series completadas</span><strong>{{ currentExerciseCompletedSets }} / {{ currentExerciseSetGoal }}</strong></div>
              <div class="set-buttons" role="group" aria-label="Series completadas">
                <button v-for="set in currentExerciseSetGoal" :key="set" type="button" class="set-button" :class="{ done: set <= currentExerciseCompletedSets, next: set === currentExerciseCompletedSets + 1 }" :aria-pressed="set <= currentExerciseCompletedSets" :disabled="set > currentExerciseCompletedSets + 1" @click="set <= currentExerciseCompletedSets ? c.undoSet() : c.completeSet()">
                  <Check v-if="set <= currentExerciseCompletedSets" :size="15" />{{ set }}
                </button>
              </div>
              <button v-if="currentExerciseCompletedSets < currentExerciseSetGoal" type="button" class="complete-set-button" @click="c.completeSet">Completar serie {{ currentExerciseCompletedSets + 1 }} de {{ currentExerciseSetGoal }} <Check :size="16" /></button>
              <p v-else class="complete-note"><Check :size="16" /> Ejercicio completado</p>
            </div>
            <div v-if="currentExercise.technique" class="technique-box"><h4>Técnica</h4><p>{{ currentExercise.technique }}</p></div>
            <div class="player-controls">
              <button type="button" class="secondary-button" @click="c.toggleTimer"><Pause v-if="!timerPaused" :size="17" /><Play v-else :size="17" /> {{ timerPaused ? 'Reanudar cronómetro' : 'Pausar cronómetro' }}</button>
              <div class="exercise-nav-controls">
                <button type="button" class="secondary-button" aria-label="Ejercicio anterior" :disabled="currentExerciseIndex <= 0" @click="c.selectExercise(currentExerciseIndex - 1)"><ArrowLeft :size="17" /></button>
                <button type="button" class="primary-button" :disabled="currentExerciseIndex >= detail.exercises.length - 1" @click="c.selectExercise(currentExerciseIndex + 1)">{{ currentExerciseCompletedSets >= currentExerciseSetGoal ? 'Siguiente ejercicio' : 'Terminar ejercicio y continuar' }} <ArrowRight :size="17" /></button>
              </div>
            </div>
          </div>
        </section>
        <aside class="exercise-queue"><header><h3>Lista de ejercicios</h3><span>{{ completedExercises.length }}/{{ detail.exercises.length }}</span></header>
          <button v-for="(exercise,index) in detail.exercises" :key="exercise.id" type="button" class="queue-exercise" :class="{ selected:index===currentExerciseIndex,completed:completedExercises.includes(exercise.id) }" @click="c.selectExercise(index)">
            <span class="queue-number"><Check v-if="completedExercises.includes(exercise.id)" :size="15" /><template v-else>{{ String(index+1).padStart(2,'0') }}</template></span>
            <img v-if="exerciseImage(exercise)" :src="exerciseImage(exercise)" alt="" />
            <span class="queue-copy"><strong>{{ exercise.name }}</strong><small>{{ completedSets[exercise.id] || 0 }}/{{ exercise.sets }} series</small></span>
          </button>
        </aside>
      </div>
      <div v-else class="routine-exercise-preview"><h3>Ejercicios de la rutina</h3><ol class="preview-list">
        <li v-for="(exercise,index) in detail.exercises" :key="exercise.id" class="preview-exercise">
          <span class="preview-index">{{ String(index+1).padStart(2,'0') }}</span>
          <img v-if="exerciseImage(exercise)" :src="exerciseImage(exercise)" :alt="`Demostración de ${exercise.name}`" loading="lazy" />
          <span v-else class="preview-image-fallback"><Dumbbell :size="20" /></span>
          <div class="preview-copy">
            <h4>{{ exercise.name }}</h4>
            <p class="preview-prescription">{{ exercise.sets }} series · {{ exercise.repetitions != null ? `${exercise.repetitions} repeticiones` : `${exercise.durationSeconds} segundos` }}{{ exercise.perSide ? ' por lado' : '' }}</p>
            <div class="preview-facts"><span>{{ exercise.primaryMuscle || exercise.muscleGroup || 'Cuerpo completo' }}</span><span>{{ exercise.equipment || 'Sin equipo' }}</span><span>Descanso {{ exercise.restSeconds ?? 0 }} s</span></div>
            <p v-if="exercise.description" class="preview-description">{{ exercise.description }}</p>
            <div v-if="exercise.technique" class="preview-technique"><strong>Técnica</strong><p>{{ exercise.technique }}</p></div>
          </div>
        </li>
      </ol></div>
      <div v-if="result" class="success-message" role="status"><Check :size="22" /><div><h3>¡Rutina terminada!</h3><p>Tiempo activo: {{ result.durationMinutes }} min. Tu progreso se actualizó.</p></div><a href="/app/home">Ver progreso</a></div>
      <div v-else class="routine-actions">
        <p v-if="session && !isActiveRoutine" class="muted">Ya tienes otra rutina activa. Retómala antes de iniciar esta.</p>
        <template v-if="authenticated">
          <button v-if="isActiveRoutine" type="button" class="primary-button finish-button" :disabled="busy || !canFinish" @click="c.finish">{{ busy ? 'Guardando…' : canFinish ? 'Finalizar rutina' : `Completa las series (${completedExercises.length}/${detail.exercises.length})` }}</button>
          <button v-else-if="session" type="button" class="primary-button" @click="resume">Retomar rutina activa</button>
          <button v-else type="button" class="primary-button" :disabled="busy || !detail.exercises.length" @click="c.start"><Play :size="17" /> {{ busy ? 'Iniciando…' : 'Comenzar rutina' }}</button>
        </template>
        <a v-else href="/login">Inicia sesión para comenzar la rutina</a>
      </div>
    </template>
  </section>
</template>

<style scoped>
.active-banner,.routine-detail { margin:20px 0; padding:clamp(20px,2.5vw,32px); border:1px solid var(--color-card-border); border-radius:18px; background:var(--color-surface); }
.active-banner,.banner-actions,.detail-header,.player-topline,.tracker-label,.player-controls,.exercise-nav-controls,.routine-actions,.success-message { display:flex; align-items:center; justify-content:space-between; gap:14px; }
.active-banner p { margin:5px 0 0; color:var(--color-muted-text); font-size:13px; }.routine-detail h2 { margin:0; font-size:clamp(24px,2.8vw,34px); }.muted { color:var(--color-muted-text); font-size:13px; line-height:1.55; }.eyebrow { margin:0 0 8px; color:var(--color-primary); font-size:10px; font-weight:800; letter-spacing:1.5px; }
.back-button,.primary-button,.secondary-button,.complete-set-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:0 14px; border:1px solid var(--color-card-border); border-radius:10px; background:transparent; color:var(--color-text); font:inherit; font-size:13px; font-weight:600; text-decoration:none; cursor:pointer; }.back-button { margin-bottom:20px; color:var(--color-muted-text); }.primary-button,.complete-set-button { border-color:var(--color-primary); background:var(--color-primary); color:#04110b; }.primary-button:disabled,.secondary-button:disabled { opacity:.45; cursor:not-allowed; }
.detail-header { align-items:flex-start; margin:4px 0 22px; }.detail-header .muted { margin-top:7px; }.duration-chip { display:inline-flex; align-items:center; gap:7px; flex-shrink:0; padding:8px 12px; border:1px solid var(--color-card-border); border-radius:999px; color:var(--color-primary); font-size:13px; }
.routine-facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-bottom:22px; }.routine-facts div { display:grid; gap:6px; min-width:0; padding:12px 14px; border:1px solid var(--color-card-border); border-radius:12px; background:color-mix(in srgb,var(--color-background) 55%,var(--color-surface)); }.routine-facts small { color:var(--color-muted-text); font-size:11px; }.routine-facts strong { font-size:13px; overflow-wrap:anywhere; }
.routine-exercise-preview>h3 { margin:10px 0 14px; font-size:19px; }.preview-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin:0; padding:0; list-style:none; }.preview-exercise { display:grid; grid-template-columns:28px 100px minmax(0,1fr); align-items:start; gap:12px; min-width:0; padding:13px; border:1px solid var(--color-card-border); border-radius:13px; background:color-mix(in srgb,var(--color-background) 55%,var(--color-surface)); }.preview-index { color:var(--color-primary); font-size:12px; font-weight:800; }.preview-exercise img,.preview-image-fallback { display:grid; place-items:center; width:100px; height:90px; border-radius:9px; object-fit:contain; background:#f4f5f3; color:var(--color-primary); }.preview-copy { min-width:0; }.preview-copy h4 { margin:0 0 6px; font-size:14px; line-height:1.4; overflow-wrap:anywhere; }.preview-prescription { margin:0 0 8px; color:var(--color-primary); font-size:12px; font-weight:700; }.preview-facts { display:flex; flex-wrap:wrap; gap:5px; margin:0 0 8px; }.preview-facts span { padding:4px 7px; border:1px solid var(--color-card-border); border-radius:999px; color:var(--color-muted-text); font-size:10px; }.preview-description { color:var(--color-muted-text); font-size:11px; line-height:1.5; }.preview-technique { margin-top:9px; padding-top:8px; border-top:1px solid var(--color-card-border); }.preview-technique strong { color:var(--color-primary); font-size:11px; }.preview-technique p { margin:4px 0 0; color:var(--color-muted-text); font-size:11px; line-height:1.55; white-space:pre-line; }
.session-layout { display:grid; grid-template-columns:minmax(0,1.5fr) minmax(260px,.8fr); gap:16px; }.workout-player,.exercise-queue { overflow:hidden; border:1px solid var(--color-card-border); border-radius:15px; background:color-mix(in srgb,var(--color-background) 44%,var(--color-surface)); }.player-topline { padding:16px 18px; }.player-topline .muted { margin:0; }.stopwatch { display:flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid color-mix(in srgb,var(--color-primary) 45%,var(--color-card-border)); border-radius:10px; background:var(--color-indicator); color:var(--color-primary); font-variant-numeric:tabular-nums; }.stopwatch strong { font-size:19px; }.stopwatch.paused { color:var(--color-muted-text); background:transparent; }
.player-image { display:grid; place-items:center; height:clamp(210px,26vw,330px); overflow:hidden; background:#f4f5f3; color:var(--color-primary); }.player-image img { width:100%; height:100%; object-fit:contain; }.player-content { padding:18px; }.player-content h3 { margin:0; font-size:21px; }.prescription { margin:7px 0 2px; color:var(--color-primary); font-size:13px; font-weight:700; }.exercise-meta { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:13px; }.exercise-meta span { display:grid; gap:4px; min-width:0; padding:9px; border:1px solid var(--color-card-border); border-radius:9px; color:var(--color-muted-text); font-size:11px; overflow-wrap:anywhere; }.exercise-meta strong { color:var(--color-subtle-text); font-size:10px; }.exercise-description { margin:12px 0 0; color:var(--color-muted-text); font-size:12px; line-height:1.55; }.set-tracker { margin-top:17px; padding:14px; border:1px solid var(--color-card-border); border-radius:12px; background:var(--color-surface); }.tracker-label { color:var(--color-muted-text); font-size:12px; }.tracker-label strong { color:var(--color-text); }.set-buttons { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }.set-button { display:inline-flex; align-items:center; gap:4px; min-width:40px; height:38px; justify-content:center; border:1px solid var(--color-card-border); border-radius:9px; background:transparent; color:var(--color-muted-text); cursor:pointer; }.set-button.next { border-color:var(--color-primary); color:var(--color-primary); }.set-button.done { border-color:var(--color-primary); background:var(--color-primary); color:#04110b; }.set-button:disabled { opacity:.45; cursor:not-allowed; }.complete-set-button { margin-top:12px; min-height:40px; }.complete-note { display:flex; align-items:center; gap:7px; margin:12px 0 0; color:var(--color-primary); font-size:13px; font-weight:700; }
.technique-box { margin-top:16px; padding-top:14px; border-top:1px solid var(--color-card-border); }.technique-box h4 { margin:0 0 7px; font-size:13px; }.technique-box p { margin:0; color:var(--color-muted-text); font-size:12px; line-height:1.6; white-space:pre-line; }.player-controls { flex-wrap:wrap; margin-top:16px; }.exercise-nav-controls { justify-content:flex-end; }.exercise-queue { padding:15px; }.exercise-queue header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }.exercise-queue header h3 { margin:0; font-size:16px; }.exercise-queue header span { color:var(--color-primary); font-size:12px; }.queue-exercise { display:grid; grid-template-columns:28px 58px minmax(0,1fr); align-items:center; gap:9px; width:100%; margin-top:7px; padding:7px; border:1px solid transparent; border-radius:10px; background:transparent; color:var(--color-text); text-align:left; cursor:pointer; }.queue-exercise.selected { border-color:var(--color-primary); background:var(--color-surface); }.queue-number { display:grid; place-items:center; width:26px; height:26px; border-radius:7px; background:var(--color-indicator); color:var(--color-primary); font-size:11px; }.queue-exercise.completed .queue-number { background:var(--color-primary); color:#04110b; }.queue-exercise img { width:58px; height:48px; border-radius:7px; object-fit:cover; }.queue-copy { display:grid; gap:4px; min-width:0; }.queue-copy strong { overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }.queue-copy small { color:var(--color-muted-text); font-size:10px; }
.routine-actions { justify-content:flex-end; margin-top:20px; padding-top:16px; border-top:1px solid var(--color-card-border); }.routine-actions .muted { margin-right:auto; }.finish-button { min-width:220px; }.error-message { color:var(--color-error); }.success-message { justify-content:flex-start; margin-top:20px; padding:16px; border:1px solid var(--color-primary); border-radius:12px; background:var(--color-indicator); }.success-message h3 { margin:0 0 4px; font-size:16px; }.success-message p { margin:0; color:var(--color-muted-text); font-size:12px; }.success-message>a { margin-left:auto; color:var(--color-primary); }
@media(max-width:900px) { .session-layout { grid-template-columns:1fr; }.exercise-queue { order:2; } }
@media(max-width:680px) { .routine-facts { grid-template-columns:repeat(2,minmax(0,1fr)); }.preview-list { grid-template-columns:1fr; }.preview-exercise { grid-template-columns:25px 82px minmax(0,1fr); }.preview-exercise img,.preview-image-fallback { width:82px;height:76px; }.exercise-meta { grid-template-columns:1fr; }.detail-header,.active-banner,.banner-actions { align-items:flex-start; }.detail-header,.active-banner { flex-direction:column; }.player-controls,.routine-actions { align-items:stretch; flex-direction:column; }.exercise-nav-controls { justify-content:flex-end; }.success-message { align-items:flex-start; flex-wrap:wrap; }.success-message>a { margin-left:0; } }
</style>
