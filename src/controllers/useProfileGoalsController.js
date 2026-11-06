import { reactive, ref } from 'vue'

import { ProfileRepository } from '@/repositories/profileRepository'
import { useAuthController } from './authController'
import { useSnackbarController } from './snackbarController'

export const WEEKLY_WORKOUTS = { min: 1, max: 14 }

export function useProfileGoalsController(repository = new ProfileRepository()) {
  const auth = useAuthController()
  const snackbar = useSnackbarController()
  const form = reactive({ goal: '', weeklyWorkouts: 3, targetWeightKg: '', dailyWaterLiters: 2 })
  const currentWeightKg = ref(null)
  const errors = reactive({ goal: null, targetWeightKg: null, dailyWaterLiters: null })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const loadError = ref('')

  async function loadGoals() {
    isLoading.value = true
    loadError.value = ''
    try {
      const goals = await repository.getGoals()
      form.goal = goals.goal
      form.weeklyWorkouts = goals.weeklyWorkouts
      form.targetWeightKg = goals.targetWeightKg ?? ''
      form.dailyWaterLiters = goals.dailyWaterMl / 1000
      currentWeightKg.value = goals.currentWeightKg
    } catch (_exception) {
      loadError.value = 'No fue posible cargar tus objetivos. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  function changeWeeklyWorkouts(step) {
    form.weeklyWorkouts = Math.min(WEEKLY_WORKOUTS.max, Math.max(WEEKLY_WORKOUTS.min, form.weeklyWorkouts + step))
  }

  function validate() {
    const target = form.targetWeightKg === '' ? null : Number(form.targetWeightKg)
    const water = Number(form.dailyWaterLiters)
    errors.goal = form.goal ? null : 'Selecciona tu objetivo principal.'
    errors.targetWeightKg = target === null || (target >= 25 && target <= 350) ? null : 'Ingresa un peso entre 25 y 350 kg.'
    errors.dailyWaterLiters = water >= 0.25 && water <= 10 ? null : 'Ingresa una cantidad entre 0.25 y 10 litros.'
    return Object.values(errors).every((error) => !error)
  }

  async function saveGoals() {
    if (isSaving.value || !validate()) return
    isSaving.value = true
    try {
      const saved = await repository.saveGoals({
        goal: form.goal,
        weeklyWorkouts: form.weeklyWorkouts,
        targetWeightKg: form.targetWeightKg === '' ? null : Number(form.targetWeightKg),
        dailyWaterMl: Math.round(Number(form.dailyWaterLiters) * 1000),
      })
      auth.updateUser({ goal: saved.goal })
      snackbar.show('Tus objetivos se guardaron correctamente.')
    } catch (_exception) {
      snackbar.show('No fue posible guardar tus objetivos. Revisa los datos e intenta de nuevo.')
    } finally {
      isSaving.value = false
    }
  }

  return { form, errors, currentWeightKg, isLoading, isSaving, loadError, loadGoals, changeWeeklyWorkouts, saveGoals }
}
