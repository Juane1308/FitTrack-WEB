<script setup>
import { computed, ref, watch } from 'vue'
import { Camera, LoaderCircle } from 'lucide-vue-next'

import WeightChart from '@/components/WeightChart.vue'
import { ensureDisplayFont } from '@/core/displayFont'
import { onEnter } from '@/controllers/onEnter'
import { PROGRESS_PERIODS, useProgressController } from '@/controllers/useProgressController'

const {
  progress,
  isLoading,
  error,
  period,
  periodHistory,
  savingWeight,
  savingHeight,
  savingPhoto,
  loadProgress,
  saveWeight,
  saveHeight,
  addPhoto,
} = useProgressController()

ensureDisplayFont()
onEnter(loadProgress)

const weightInput = ref('')
const heightInput = ref('')
const metric = ref('weight')

// Los campos arrancan con el valor guardado para que actualizar sea solo corregir el número
watch(progress, (value) => {
  weightInput.value = value?.currentWeightKg ?? ''
  heightInput.value = value?.heightCm ? (value.heightCm / 100).toFixed(2) : ''
})

const formatKg = (value) => Number(value).toFixed(1)
const heightMeters = computed(() => (progress.value?.heightCm ? (progress.value.heightCm / 100).toFixed(2) : null))

const change = computed(() => {
  const value = progress.value?.weightChangeKg
  if (value == null) return null
  const start = progress.value.startWeightKg
  const target = progress.value.targetWeightKg
  // Va bien si el cambio apunta hacia el objetivo; sin objetivo, solo se informa
  const towardGoal = target == null || value === 0 ? null : Math.sign(value) === Math.sign(target - start)
  return { text: `${value > 0 ? '+' : ''}${formatKg(value)} kg`, towardGoal }
})

const chartPoints = computed(() => {
  const heightM = (progress.value?.heightCm ?? 0) / 100
  return periodHistory.value.map((entry) => ({
    date: entry.date,
    value: metric.value === 'bmi' && heightM ? Math.round((entry.weightKg / (heightM * heightM)) * 10) / 10 : entry.weightKg,
  }))
})
const chartGoal = computed(() => (metric.value === 'weight' ? progress.value?.targetWeightKg ?? null : null))
const canShowBmi = computed(() => Boolean(progress.value?.heightCm))

const ringStyle = computed(() => ({ '--progress': `${progress.value?.goalProgressPercent ?? 0}%` }))

async function submitWeight() {
  await saveWeight(weightInput.value)
}

async function submitHeight() {
  await saveHeight(heightInput.value)
}

function onPhotoSelected(event) {
  const [file] = event.target.files ?? []
  event.target.value = ''
  if (file) addPhoto(file)
}

const photoDate = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' })
const formatPhotoDate = (date) => photoDate.format(new Date(`${date}T00:00:00`))
</script>

<template>
  <section class="section-page progress-page" aria-labelledby="progress-title">
    <header class="progress-header">
      <div>
        <h1 id="progress-title">Progreso</h1>
        <p>Registra tu peso y tus fotos para ver cómo avanzas hacia tu objetivo.</p>
      </div>
      <div class="periods" role="group" aria-label="Periodo del gráfico">
        <button
          v-for="option in PROGRESS_PERIODS"
          :key="option.key"
          type="button"
          :aria-pressed="period === option.key"
          @click="period = option.key"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <div v-if="isLoading && !progress" class="state" role="status">Cargando tu progreso…</div>
    <div v-else-if="error" class="state" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-filled" @click="loadProgress">Reintentar</button>
    </div>

    <div v-else-if="progress" class="progress-grid">
      <section class="card measure" aria-labelledby="weight-title">
        <div class="measure-value">
          <h2 id="weight-title">Peso actual</h2>
          <p class="big-number">
            {{ progress.currentWeightKg != null ? formatKg(progress.currentWeightKg) : '--' }}<small>kg</small>
          </p>
          <p v-if="change" class="change">
            <span :class="{ good: change.towardGoal === true, away: change.towardGoal === false }">{{ change.text }}</span>
            desde el inicio
          </p>
        </div>
        <form class="measure-form" @submit.prevent="submitWeight">
          <label for="weight-input">Actualizar peso</label>
          <div class="field">
            <input id="weight-input" v-model="weightInput" type="number" inputmode="decimal" min="25" max="350" step="0.1" required />
            <span>kg</span>
          </div>
          <button type="submit" class="btn btn-filled" :disabled="savingWeight">
            {{ savingWeight ? 'Guardando…' : 'Guardar peso' }}
          </button>
        </form>
      </section>

      <section class="card measure" aria-labelledby="height-title">
        <div class="measure-value">
          <h2 id="height-title">Estatura</h2>
          <p class="big-number">{{ heightMeters ?? '--' }}<small>m</small></p>
        </div>
        <form class="measure-form" @submit.prevent="submitHeight">
          <label for="height-input">Actualizar estatura</label>
          <div class="field">
            <input id="height-input" v-model="heightInput" type="number" inputmode="decimal" min="1" max="2.5" step="0.01" required />
            <span>m</span>
          </div>
          <button type="submit" class="btn btn-filled" :disabled="savingHeight">
            {{ savingHeight ? 'Guardando…' : 'Guardar estatura' }}
          </button>
        </form>
      </section>

      <section class="card chart-card" aria-labelledby="chart-title">
        <div class="card-heading">
          <h2 id="chart-title">Evolución del {{ metric === 'bmi' ? 'IMC' : 'peso' }}</h2>
          <label class="metric">
            <span class="sr-only">Medida del gráfico</span>
            <select v-model="metric">
              <option value="weight">Peso (kg)</option>
              <option value="bmi" :disabled="!canShowBmi">IMC</option>
            </select>
          </label>
        </div>
        <WeightChart
          v-if="chartPoints.length"
          :points="chartPoints"
          :goal="chartGoal"
          :unit="metric === 'bmi' ? '' : 'kg'"
          :label="metric === 'bmi' ? 'Evolución del IMC' : 'Evolución del peso'"
        />
        <p v-else class="empty">No hay registros de peso en este periodo. Elige un periodo más largo o guarda tu peso de hoy.</p>
        <p v-if="chartPoints.length === 1" class="hint">Guarda tu peso en otros días para ver la línea de evolución.</p>
      </section>

      <section class="card goal-card" aria-labelledby="goal-title">
        <h2 id="goal-title" class="sr-only">Avance hacia tu objetivo</h2>
        <template v-if="progress.targetWeightKg != null">
          <div class="goal-figure">
            <span>Objetivo</span>
            <strong class="accent">{{ formatKg(progress.targetWeightKg) }}<small>kg</small></strong>
          </div>
          <div
            class="ring"
            :style="ringStyle"
            role="img"
            :aria-label="`${progress.goalProgressPercent ?? 0}% del objetivo completado`"
          >
            <strong>{{ progress.goalProgressPercent ?? 0 }}%</strong>
            <span>completado</span>
          </div>
          <div class="goal-figure">
            <span>Actual</span>
            <strong>{{ progress.currentWeightKg != null ? formatKg(progress.currentWeightKg) : '--' }}<small>kg</small></strong>
          </div>
        </template>
        <div v-else class="no-goal">
          <p>Define un peso objetivo para ver cuánto te falta.</p>
          <RouterLink :to="{ name: 'profile-goals' }" class="btn btn-outlined">Definir objetivo</RouterLink>
        </div>
      </section>

      <section class="card photos-card" aria-labelledby="photos-title">
        <div class="photos-intro">
          <h2 id="photos-title">Fotos de progreso</h2>
          <p>Compara tu primera foto con la más reciente.</p>
          <label class="btn btn-outlined photo-button" :class="{ busy: savingPhoto }">
            <LoaderCircle v-if="savingPhoto" class="spin" :size="18" aria-hidden="true" />
            <Camera v-else :size="18" aria-hidden="true" />
            {{ savingPhoto ? 'Guardando…' : 'Agregar foto' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="savingPhoto" @change="onPhotoSelected" />
          </label>
        </div>
        <div class="photo-pair">
          <figure class="photo" :class="{ empty: !progress.photos.before }">
            <img v-if="progress.photos.before" :src="progress.photos.before.image" alt="Tu primera foto de progreso" />
            <figcaption>
              <strong>Antes</strong>
              <span>{{ progress.photos.before ? formatPhotoDate(progress.photos.before.takenOn) : 'Sin foto' }}</span>
            </figcaption>
          </figure>
          <figure class="photo current" :class="{ empty: !progress.photos.current }">
            <img v-if="progress.photos.current" :src="progress.photos.current.image" alt="Tu foto de progreso más reciente" />
            <figcaption>
              <strong>Actual</strong>
              <span>{{ progress.photos.current ? formatPhotoDate(progress.photos.current.takenOn) : 'Sin foto' }}</span>
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
/* Mismos tokens que Perfil: tarjetas grises neutras y Bricolage Grotesque */
.progress-page {
  --progress-surface: #111111;
  --progress-line: #242424;
  --progress-font: 'Bricolage Grotesque', 'Arial Narrow', sans-serif;

  max-width: 1240px;
  font-family: 'Bricolage Grotesque', Arial, Helvetica, sans-serif;
}

.progress-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
  margin-bottom: 24px;
}

.progress-header h1 {
  font-family: var(--progress-font);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.progress-header p {
  margin-top: 6px;
  color: var(--color-muted-text);
  font-size: 15px;
}

.periods {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--progress-line);
  border-radius: var(--radius-pill);
  background: var(--progress-surface);
}

.periods button {
  min-height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-muted-text);
  font-size: 14px;
  cursor: pointer;
}

.periods button:hover {
  color: var(--color-text);
}

.periods button[aria-pressed='true'] {
  background: var(--color-primary);
  color: #000;
  font-weight: 600;
}

.periods button:focus-visible,
.metric select:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.state {
  display: grid;
  justify-items: start;
  gap: 14px;
  padding: 24px;
  border: 1px solid var(--progress-line);
  border-radius: 20px;
  background: var(--progress-surface);
  color: var(--color-muted-text);
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card {
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--progress-line);
  border-radius: 20px;
  background: var(--progress-surface);
}

.card h2 {
  font-size: 17px;
  font-weight: 600;
}

/* Peso y estatura: cifra a la izquierda, formulario a la derecha (como el mockup) */
.measure {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
}

.big-number {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 14px;
  font-family: var(--progress-font);
  font-size: 52px;
  font-variation-settings: 'wdth' 85;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
}

.big-number small,
.goal-figure small {
  color: var(--color-muted-text);
  font-family: inherit;
  font-size: 17px;
  font-variation-settings: 'wdth' 100;
  font-weight: 400;
  letter-spacing: 0;
}

.change {
  margin-top: 14px;
  color: var(--color-muted-text);
  font-size: 14px;
}

.change span {
  margin-right: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: #1c1c1c;
  color: var(--color-text);
  font-weight: 600;
}

.change span.good {
  background: var(--color-indicator);
  color: var(--color-primary);
}

.change span.away {
  background: rgb(255 180 171 / 14%);
  color: var(--color-error);
}

.measure-form {
  display: grid;
  align-content: start;
  gap: 10px;
}

.measure-form label {
  font-size: 14px;
  font-weight: 600;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid #2e2e2e;
  border-radius: 12px;
  background: #0b0b0b;
  color: var(--color-muted-text);
}

.field:focus-within {
  border-color: var(--color-primary);
}

.field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
}

.measure-form .btn {
  min-height: 42px;
  border-radius: 12px;
}

/* Gráfico a todo el ancho */
.chart-card {
  grid-column: 1 / -1;
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.metric select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  background: #0b0b0b;
  color: var(--color-text);
  font-size: 14px;
}

.empty,
.hint {
  color: var(--color-muted-text);
  font-size: 14px;
}

.empty {
  padding: 40px 0;
  text-align: center;
}

.hint {
  margin-top: 12px;
}

/* Objetivo: tres columnas separadas por líneas finas */
.goal-card {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
}

.goal-figure {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.goal-figure span {
  color: var(--color-muted-text);
  font-size: 14px;
}

.goal-figure strong {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: var(--progress-font);
  font-size: 34px;
  font-variation-settings: 'wdth' 85;
  font-weight: 600;
  line-height: 1;
}

.goal-figure .accent {
  color: var(--color-primary);
}

.ring {
  position: relative;
  display: grid;
  place-content: center;
  justify-items: center;
  width: 124px;
  height: 124px;
  border-radius: 50%;
  background: conic-gradient(var(--color-primary) var(--progress), #242424 0);
}

.ring::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--progress-surface);
}

.ring strong,
.ring span {
  position: relative;
}

.ring strong {
  font-family: var(--progress-font);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.ring span {
  color: var(--color-muted-text);
  font-size: 12px;
}

.no-goal {
  display: grid;
  grid-column: 1 / -1;
  justify-items: start;
  gap: 14px;
  color: var(--color-muted-text);
}

.no-goal .btn {
  text-decoration: none;
}

/* Fotos: comparación antes / actual */
.photos-card {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 20px;
}

.photos-intro p {
  margin: 6px 0 18px;
  color: var(--color-muted-text);
  font-size: 14px;
}

.photo-button {
  gap: 8px;
  min-height: 42px;
  border-radius: 12px;
  cursor: pointer;
}

.photo-button:focus-within {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.photo-button.busy {
  cursor: progress;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.photo-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.photo {
  position: relative;
  margin: 0;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  border: 1px solid var(--progress-line);
  border-radius: 14px;
  background: #0b0b0b;
}

.photo.current {
  border-color: var(--color-primary);
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo figcaption {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  justify-items: center;
  padding: 18px 8px 10px;
  background: linear-gradient(transparent, rgb(0 0 0 / 80%));
  font-size: 13px;
}

.photo.empty figcaption {
  inset: 0;
  align-content: center;
  background: none;
  color: var(--color-muted-text);
}

.photo.current strong {
  color: var(--color-primary);
}

.photo figcaption span {
  color: var(--color-muted-text);
}

@media (max-width: 1100px) {
  .progress-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .card {
    padding: 20px;
  }

  .measure,
  .photos-card {
    grid-template-columns: 1fr;
  }

  .big-number {
    font-size: 44px;
  }

  .goal-card {
    gap: 10px;
  }

  .goal-figure strong {
    font-size: 26px;
  }

  .ring {
    width: 100px;
    height: 100px;
  }

  .ring strong {
    font-size: 22px;
  }

  .periods {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    width: 100%;
  }

  .periods button {
    padding: 0 4px;
    font-size: 12px;
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none;
  }
}
</style>
