<script setup>
import { Droplets, Minus, Plus, Scale } from 'lucide-vue-next'

import LoadingButton from '@/components/LoadingButton.vue'
import { onEnter } from '@/controllers/onEnter'
import { WEEKLY_WORKOUTS, useProfileGoalsController } from '@/controllers/useProfileGoalsController'
import { goals } from '@/core/profileOptions'
import ProfileSubpage from './ProfileSubpage.vue'

const { form, errors, currentWeightKg, isLoading, isSaving, loadError, loadGoals, changeWeeklyWorkouts, saveGoals } =
  useProfileGoalsController()

onEnter(loadGoals)
</script>

<template>
  <ProfileSubpage
    title="Mis objetivos"
    subtitle="Define hacia dónde vas y cuánto quieres entrenar."
    :is-loading="isLoading"
    :error="loadError"
    @retry="loadGoals"
  >
    <form class="profile-form" novalidate @submit.prevent="saveGoals">
      <fieldset class="form-card">
        <h2>Objetivo principal</h2>
        <div class="choice-grid" role="radiogroup" aria-label="Objetivo principal">
          <button
            v-for="goal in goals"
            :key="goal.value"
            type="button"
            class="choice-card"
            :class="{ selected: form.goal === goal.value }"
            role="radio"
            :aria-checked="form.goal === goal.value"
            @click="form.goal = goal.value"
          >
            <component :is="goal.icon" :size="26" aria-hidden="true" />
            <strong>{{ goal.label }}</strong>
            <small>{{ goal.detail }}</small>
          </button>
        </div>
        <p v-if="errors.goal" class="field-error" role="alert">{{ errors.goal }}</p>
      </fieldset>

      <div class="form-card">
        <h2>Meta semanal</h2>
        <p class="muted">Entrenamientos que quieres completar cada semana. Inicio usa esta meta para tu progreso.</p>
        <div class="stepper">
          <button
            type="button"
            class="step-button"
            aria-label="Un entrenamiento menos"
            :disabled="form.weeklyWorkouts <= WEEKLY_WORKOUTS.min"
            @click="changeWeeklyWorkouts(-1)"
          >
            <Minus :size="22" />
          </button>
          <output aria-live="polite"><strong>{{ form.weeklyWorkouts }}</strong> por semana</output>
          <button
            type="button"
            class="step-button"
            aria-label="Un entrenamiento más"
            :disabled="form.weeklyWorkouts >= WEEKLY_WORKOUTS.max"
            @click="changeWeeklyWorkouts(1)"
          >
            <Plus :size="22" />
          </button>
        </div>
      </div>

      <div class="form-card">
        <h2>Peso y agua</h2>
        <div class="field-row">
          <label class="field">
            <span>Peso objetivo <small class="muted">(opcional)</small></span>
            <span class="input-wrap">
              <Scale :size="19" aria-hidden="true" />
              <input v-model="form.targetWeightKg" type="number" min="25" max="350" step="0.1" placeholder="Ej. 72" />
              <small>kg</small>
            </span>
            <small v-if="currentWeightKg != null" class="muted">Tu peso actual: {{ currentWeightKg }} kg</small>
            <small v-if="errors.targetWeightKg" class="field-error">{{ errors.targetWeightKg }}</small>
          </label>
          <label class="field">
            <span>Agua al día</span>
            <span class="input-wrap">
              <Droplets :size="19" aria-hidden="true" />
              <input v-model="form.dailyWaterLiters" type="number" min="0.25" max="10" step="0.25" required />
              <small>L</small>
            </span>
            <small v-if="errors.dailyWaterLiters" class="field-error">{{ errors.dailyWaterLiters }}</small>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <LoadingButton :loading="isSaving">Guardar objetivos</LoadingButton>
      </div>
    </form>
  </ProfileSubpage>
</template>

<style scoped src="./profile-form.css"></style>
<style scoped>
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
}

.stepper output {
  min-width: 140px;
  color: var(--color-muted-text);
  text-align: center;
}

.stepper strong {
  display: block;
  color: var(--color-text);
  font-size: 40px;
  font-weight: 800;
  line-height: 1.1;
}

.step-button {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-input-border);
  border-radius: 50%;
  background: #0a1410;
  color: var(--color-primary);
  cursor: pointer;
}

.step-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

fieldset {
  min-width: 0;
  margin: 0;
}
</style>
