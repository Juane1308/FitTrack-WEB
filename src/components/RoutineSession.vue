<script setup>
import { useRoutineSessionController } from '@/controllers/useRoutineSessionController'
import { onEnter } from '@/controllers/onEnter'
const props = defineProps({ routineId: { type: [String, Number], default: null } })
const emit = defineEmits(['close', 'select'])
import { watch } from 'vue'
const c = useRoutineSessionController()
const { detail, selectedId, loading, busy, error, session, completedExercises, result, isActiveRoutine, canFinish, authenticated } = c
watch(() => props.routineId, id => { if (id != null) c.openRoutine(id) }, { immediate: true })
onEnter(c.restoreSession)
function close() { c.close(); emit('close') }
function resume() { emit('select', session.value.routineId) }
</script>

<template>
  <aside v-if="session && !selectedId" class="active-banner" aria-label="Rutina en curso">
    <p>Tienes una rutina en curso. Puedes retomarla y registrar tu entrenamiento.</p>
    <button type="button" @click="resume">Retomar rutina</button>
  </aside>
  <section v-if="selectedId" class="routine-detail" aria-label="Detalle de rutina" :aria-busy="loading">
    <button type="button" class="back" :disabled="busy" @click="close">← Volver al catálogo</button>
    <p v-if="loading" role="status">Cargando detalle…</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <button v-if="!loading && !detail" type="button" @click="c.openRoutine(selectedId)">Reintentar</button>
    <template v-if="detail">
      <p class="eyebrow">{{ isActiveRoutine ? 'SESIÓN ACTIVA' : 'TU PRÓXIMO ENTRENAMIENTO' }}</p>
      <h2>{{ detail.name }}</h2>
      <dl class="facts">
        <div><dt>Objetivo</dt><dd>{{ detail.goal || 'No especificado' }}</dd></div>
        <div><dt>Nivel</dt><dd>{{ detail.level }}</dd></div>
        <div><dt>Duración estimada</dt><dd>{{ detail.durationMinutes }} min</dd></div>
        <div><dt>Grupo muscular</dt><dd>{{ detail.muscleGroup || 'No especificado' }}</dd></div>
      </dl>
      <p v-if="isActiveRoutine" role="status">Marca cada ejercicio al terminarlo: {{ completedExercises.length }} de {{ detail.exercises.length }} completados.</p>
      <ol class="exercises">
        <li v-for="exercise in detail.exercises" :key="exercise.id">
          <h3>{{ exercise.name }}</h3>
          <p class="prescription">{{ exercise.sets }} series · {{ exercise.repetitions != null ? `${exercise.repetitions} repeticiones` : `${exercise.durationSeconds} segundos` }}{{ exercise.perSide ? ' por lado' : '' }}</p>
          <p>{{ exercise.technique || 'Técnica no disponible.' }}</p>
          <p class="muted">Descanso entre series: {{ exercise.restSeconds ?? 0 }} segundos</p>
          <label v-if="isActiveRoutine"><input v-model="completedExercises" type="checkbox" :value="exercise.id" :disabled="busy" /> Ejercicio completado</label>
        </li>
      </ol>
      <p v-if="!detail.exercises.length">Esta rutina aún no tiene ejercicios disponibles.</p>
      <div v-if="result" class="success" role="status">
        <h3>¡Entrenamiento registrado!</h3>
        <p>Duración: {{ result.durationMinutes }} min. Tus indicadores de Inicio y Perfil se actualizaron.</p>
        <a href="/app/home">Ver mi progreso semanal</a>
      </div>
      <template v-else-if="authenticated">
        <button v-if="isActiveRoutine" type="button" :disabled="busy || !canFinish" @click="c.finish">{{ busy ? 'Registrando…' : 'Finalizar entrenamiento' }}</button>
        <template v-else-if="session"><p>Termina la sesión en curso antes de comenzar otra.</p><button type="button" @click="resume">Retomar rutina activa</button></template>
        <button v-else type="button" :disabled="busy || !detail.exercises.length" @click="c.start">{{ busy ? 'Comenzando…' : 'Comenzar rutina' }}</button>
      </template>
      <a v-else href="/login">Inicia sesión para comenzar la rutina</a>
    </template>
  </section>
</template>

<style scoped>
.routine-detail,.active-banner { border:1px solid var(--color-card-border); border-radius:16px; padding:clamp(18px,4vw,32px); margin:24px 0; background:var(--color-card,#0b1713); }
h2 { font-size:clamp(26px,4vw,36px); margin:12px 0 24px; } h3 { margin-bottom:10px; }
.facts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; margin-bottom:28px; }
dt,.muted { color:var(--color-muted-text); font-size:13px; } dd { margin:6px 0 0; line-height:1.5; }
.eyebrow,.prescription { color:var(--color-primary); } .eyebrow { margin-top:24px; font-size:12px; letter-spacing:1px; }
.exercises { padding-left:24px; } li { padding:18px 8px; border-bottom:1px solid var(--color-card-border); } p { line-height:1.7; margin:10px 0; }
button,a { display:inline-block; padding:12px 18px; border:1px solid var(--color-primary); border-radius:8px; background:transparent; color:var(--color-primary); font:inherit; cursor:pointer; margin-top:12px; }
button:disabled { opacity:.5; cursor:default; } button:focus-visible,a:focus-visible,input:focus-visible { outline:2px solid var(--color-primary); outline-offset:4px; }
label { display:flex; align-items:center; gap:10px; margin-top:16px; } input { width:20px; height:20px; accent-color:var(--color-primary); } .success { padding:20px; border:1px solid var(--color-primary); border-radius:12px; margin-top:24px; }
@media(max-width:480px) { .facts { grid-template-columns:1fr; } }
</style>
