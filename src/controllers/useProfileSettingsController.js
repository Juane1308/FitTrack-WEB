import { reactive, ref } from 'vue'

import { ProfileRepository } from '@/repositories/profileRepository'
import { useSnackbarController } from './snackbarController'

// Notificaciones y Privacidad comparten la misma configuración (user_settings).
// Cada cambio se guarda al momento; si falla, se revierte.
export function useProfileSettingsController(repository = new ProfileRepository()) {
  const snackbar = useSnackbarController()
  const settings = reactive({
    workoutReminders: true,
    reminderTime: null,
    waterReminders: true,
    weeklySummary: true,
    news: false,
    privatePhotos: true,
    shareAnonymousData: false,
  })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const loadError = ref('')

  async function loadSettings() {
    isLoading.value = true
    loadError.value = ''
    try {
      Object.assign(settings, await repository.getSettings())
    } catch (_exception) {
      loadError.value = 'No fue posible cargar tu configuración. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  async function updateSetting(key, value) {
    const previous = settings[key]
    settings[key] = value
    isSaving.value = true
    try {
      Object.assign(settings, await repository.saveSettings({ ...settings }))
    } catch (_exception) {
      settings[key] = previous
      snackbar.show('No fue posible guardar el cambio. Intenta de nuevo.')
    } finally {
      isSaving.value = false
    }
  }

  return { settings, isLoading, isSaving, loadError, loadSettings, updateSetting }
}
