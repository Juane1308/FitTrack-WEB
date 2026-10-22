<script setup>
import { CalendarDays, Mail, Ruler, Scale, UserRound } from 'lucide-vue-next'

import LoadingButton from '@/components/LoadingButton.vue'
import { useAuthController } from '@/controllers/authController'
import { onEnter } from '@/controllers/onEnter'
import { useProfileDataController } from '@/controllers/useProfileDataController'
import { activityLevels, healthGroups, locations } from '@/core/profileOptions'
import ProfileSubpage from './ProfileSubpage.vue'

const auth = useAuthController()
const { form, errors, today, isLoading, isSaving, loadError, loadData, toggleHealthItem, clearHealthGroup, saveData } =
  useProfileDataController()

onEnter(loadData)
</script>

<template>
  <ProfileSubpage
    title="Mis datos"
    subtitle="Mantén tu información al día para que tus recomendaciones sean precisas."
    :is-loading="isLoading"
    :error="loadError"
    @retry="loadData"
  >
    <form class="profile-form" novalidate @submit.prevent="saveData">
      <div class="form-card">
        <h2>Cuenta</h2>
        <label class="field">
          <span>Nombre completo</span>
          <span class="input-wrap">
            <UserRound :size="19" aria-hidden="true" />
            <input v-model="form.name" type="text" maxlength="150" autocomplete="name" required />
          </span>
          <small v-if="errors.name" class="field-error">{{ errors.name }}</small>
        </label>
        <label class="field">
          <span>Correo electrónico</span>
          <span class="input-wrap">
            <Mail :size="19" aria-hidden="true" />
            <input :value="auth.currentUser?.email" type="email" disabled />
          </span>
        </label>
      </div>

      <div class="form-card">
        <h2>Datos personales</h2>
        <label class="field">
          <span>Fecha de nacimiento</span>
          <span class="input-wrap">
            <CalendarDays :size="19" aria-hidden="true" />
            <input v-model="form.birthDate" type="date" :max="today" required />
          </span>
          <small v-if="errors.birthDate" class="field-error">{{ errors.birthDate }}</small>
        </label>
        <div class="field-row">
          <label class="field">
            <span>Peso actual</span>
            <span class="input-wrap">
              <Scale :size="19" aria-hidden="true" />
              <input v-model="form.weightKg" type="number" min="25" max="350" step="0.1" required />
              <small>kg</small>
            </span>
            <small v-if="errors.weightKg" class="field-error">{{ errors.weightKg }}</small>
          </label>
          <label class="field">
            <span>Estatura</span>
            <span class="input-wrap">
              <Ruler :size="19" aria-hidden="true" />
              <input v-model="form.heightCm" type="number" min="100" max="250" step="0.1" required />
              <small>cm</small>
            </span>
            <small v-if="errors.heightCm" class="field-error">{{ errors.heightCm }}</small>
          </label>
        </div>
      </div>

      <div class="form-card">
        <h2>Actividad</h2>
        <div class="chip-list" role="radiogroup" aria-label="Nivel de actividad">
          <button
            v-for="level in activityLevels"
            :key="level.value"
            type="button"
            class="chip"
            :class="{ selected: form.sportExperience === level.value }"
            role="radio"
            :aria-checked="form.sportExperience === level.value"
            :title="level.detail"
            @click="form.sportExperience = level.value"
          >
            {{ level.label }}
          </button>
        </div>
        <small v-if="errors.sportExperience" class="field-error">{{ errors.sportExperience }}</small>

        <h2>¿Dónde entrenas?</h2>
        <div class="chip-list" role="radiogroup" aria-label="Lugar de entrenamiento">
          <button
            v-for="location in locations"
            :key="location.value"
            type="button"
            class="chip"
            :class="{ selected: form.trainingLocation === location.value }"
            role="radio"
            :aria-checked="form.trainingLocation === location.value"
            @click="form.trainingLocation = location.value"
          >
            {{ location.label }}
          </button>
        </div>
        <small v-if="errors.trainingLocation" class="field-error">{{ errors.trainingLocation }}</small>
      </div>

      <div class="form-card">
        <h2>Salud y alergias</h2>
        <p class="muted">Marca lo que aplique o deja “Ninguna”.</p>
        <div v-for="group in healthGroups" :key="group.key" class="health-group">
          <h3>{{ group.label }}</h3>
          <div class="chip-list">
            <button
              type="button"
              class="chip"
              :class="{ selected: form[group.key].length === 0 }"
              :aria-pressed="form[group.key].length === 0"
              @click="clearHealthGroup(group.key)"
            >
              Ninguna
            </button>
            <button
              v-for="option in group.options"
              :key="option"
              type="button"
              class="chip"
              :class="{ selected: form[group.key].includes(option) }"
              :aria-pressed="form[group.key].includes(option)"
              @click="toggleHealthItem(group.key, option)"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <LoadingButton :loading="isSaving">Guardar cambios</LoadingButton>
      </div>
    </form>
  </ProfileSubpage>
</template>

<style scoped src="./profile-form.css"></style>
<style scoped>
.health-group {
  display: grid;
  gap: 10px;
}

.health-group h3 {
  font-size: 15px;
  font-weight: 700;
}
</style>
