<script setup>
import { LockKeyhole } from 'lucide-vue-next'

import LoadingButton from '@/components/LoadingButton.vue'
import TextField from '@/components/TextField.vue'
import { onEnter } from '@/controllers/onEnter'
import { useChangePasswordController } from '@/controllers/useChangePasswordController'
import { useProfileSettingsController } from '@/controllers/useProfileSettingsController'
import ProfileSubpage from './ProfileSubpage.vue'

const { settings, isLoading, isSaving, loadError, loadSettings, updateSetting } = useProfileSettingsController()
const password = useChangePasswordController()

onEnter(loadSettings)

const options = [
  { key: 'privatePhotos', label: 'Fotos de progreso privadas', detail: 'Solo tú puedes ver tus fotos de antes y después.' },
  { key: 'shareAnonymousData', label: 'Compartir datos anónimos', detail: 'Ayuda a mejorar FitTrack sin revelar tu identidad.' },
]
</script>

<template>
  <ProfileSubpage
    title="Privacidad"
    subtitle="Controla tu información y la seguridad de tu cuenta."
    :is-loading="isLoading"
    :error="loadError"
    @retry="loadSettings"
  >
    <div class="profile-form">
      <div class="form-card">
        <h2>Tus datos</h2>
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

      <form class="form-card" novalidate @submit.prevent="password.changePassword">
        <h2>Cambiar contraseña</h2>
        <p class="muted">Al cambiarla cerramos las sesiones abiertas en otros dispositivos.</p>
        <TextField
          v-model="password.form.currentPassword"
          label="Contraseña actual"
          type="password"
          :icon="LockKeyhole"
          autocomplete="current-password"
          :error="password.errors.currentPassword"
        />
        <TextField
          v-model="password.form.newPassword"
          label="Contraseña nueva"
          type="password"
          :icon="LockKeyhole"
          autocomplete="new-password"
          :error="password.errors.newPassword"
        />
        <TextField
          v-model="password.form.confirmation"
          label="Confirmar contraseña nueva"
          type="password"
          :icon="LockKeyhole"
          autocomplete="new-password"
          :error="password.errors.confirmation"
        />
        <div class="form-actions">
          <LoadingButton :loading="password.isSaving.value">Actualizar contraseña</LoadingButton>
        </div>
      </form>
    </div>
  </ProfileSubpage>
</template>

<style scoped src="./profile-form.css"></style>
