import { computed, ref } from 'vue'

import { completeWorkout, fetchHomeDashboard } from '@/repositories/weeklyProgressRepository'
import { useAuthController } from './authController'

export function useHomeController() {
  const auth = useAuthController()

  const dashboard = ref(null)
  const user = computed(() => dashboard.value?.user ?? auth.currentUser)
  const isLoading = ref(false)
  const error = ref('')
  const isCompletingWorkout = ref(false)
  const completionMessage = ref('')
  const todayRoutine = computed(() => dashboard.value?.todayRoutine ?? null)

  const progressPercent = computed(() => {
    const weeklyProgress = dashboard.value?.weeklyProgress
    if (!weeklyProgress || weeklyProgress.weeklyGoal == null) return 0

    const completed = Math.max(0, weeklyProgress.completedWorkouts)
    const goal = Math.max(0, weeklyProgress.weeklyGoal)

    if (goal === 0) return 0

    return Math.min(100, Math.round((completed / goal) * 100))
  })

  async function loadHomeDashboard({ clearCompletion = true } = {}) {
    isLoading.value = true
    error.value = ''
    if (clearCompletion) completionMessage.value = ''

    try {
      dashboard.value = await fetchHomeDashboard()
    } catch (exception) {
      error.value = exception.message
    } finally {
      isLoading.value = false
    }
  }

  async function completeTodayWorkout() {
    if (!todayRoutine.value || todayRoutine.value.completed || isCompletingWorkout.value) return

    isCompletingWorkout.value = true
    error.value = ''
    completionMessage.value = ''

    try {
      await completeWorkout({
        routineId: todayRoutine.value.id,
        durationMinutes: todayRoutine.value.durationMinutes ?? 0,
      })
      completionMessage.value = 'Entrenamiento completado. Tu progreso fue actualizado.'
      await loadHomeDashboard({ clearCompletion: false })
    } catch (exception) {
      error.value = exception.message || 'No fue posible registrar el entrenamiento.'
    } finally {
      isCompletingWorkout.value = false
    }
  }

  return {
    user,
    dashboard,
    weeklyProgress: computed(() => dashboard.value?.weeklyProgress ?? null),
    metrics: computed(() => dashboard.value?.metrics ?? null),
    todayRoutine,
    homeBackground: computed(() => dashboard.value?.homeBackground ?? null),
    routineSummary: computed(() => dashboard.value?.routineSummary ?? null),
    weeklyActivity: computed(() => dashboard.value?.weeklyActivity ?? []),
    progressPercent,
    isLoading,
    error,
    isCompletingWorkout,
    completionMessage,
    loadHomeDashboard,
    completeTodayWorkout,
  }
}
