<script setup>
import { Clock3 } from 'lucide-vue-next'

import { onEnter } from '@/controllers/onEnter'
import { useProfileSettingsController } from '@/controllers/useProfileSettingsController'
import ProfileSubpage from './ProfileSubpage.vue'

const { settings, isLoading, isSaving, loadError, loadSettings, updateSetting } = useProfileSettingsController()

onEnter(loadSettings)

const options = [
  { key: 'workoutReminders', label: 'Recordatorio de entrenamiento', detail: 'Te avisamos el día que tienes una rutina.' },
  { key: 'waterReminders', label: 'Recordatorio de agua', detail: 'Pequeños avisos para llegar a tu meta diaria.' },
  { key: 'weeklySummary', label: 'Resumen semanal', detail: 'Tu progreso de la semana cada lunes.' },
  { key: 'news', label: 'Novedades de FitTrack', detail: 'Nuevas rutinas, recetas y funciones.' },
]
</script>

<template>
  <ProfileSubpage
    title="Notificaciones"
    subtitle="Elige qué avisos quieres recibir. Los cambios se guardan al instante."
    :is-loading="isLoading"
    :error="loadError"
    @retry="loadSettings"
  >
    <div class="profile-form">
      <div class="form-card">
        <div v-for="option in options" :key="option.key" class="toggle-row">
          <span :id="`setting-${option.key}`">
            <strong>{{ option.label }}</strong>
            <small>{{ option.detail }}</small>
          </span>
          <button
            type="button"
            class="switch"
            role="switch"
            :aria-checked="settings[option.key]"
            :aria-labelledby="`setting-${option.key}`"
            :disabled="isSaving"
            @click="updateSetting(option.key, !settings[option.key])"
          ></button>
        </div>
      </div>

      <div v-if="settings.workoutReminders" class="form-card">
        <label class="field">
          <span>Hora del recordatorio de entrenamiento</span>
          <span class="input-wrap">
            <Clock3 :size="19" aria-hidden="true" />
            <input
              type="time"
              :value="settings.reminderTime ?? ''"
              :disabled="isSaving"
              @change="updateSetting('reminderTime', $event.target.value || null)"
            />
          </span>
        </label>
      </div>
    </div>
  </ProfileSubpage>
</template>

<style scoped src="./profile-form.css"></style>
