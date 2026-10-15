import { computed, ref } from 'vue'

import { fetchWeeklyProgress } from '@/repositories/weeklyProgressRepository'
import { useAppStateController } from './appStateController'
import { useAuthController } from './authController'

export function useHomeController() {
  const appState = useAppStateController()
  const auth = useAuthController()

  const user = computed(() => auth.currentUser ?? appState.currentUser)
  const weeklyProgress = ref(null)
  const isLoading = ref(false)
  const error = ref('')

  const progressPercent = computed(() => {
    if (!weeklyProgress.value) return 0

    const completed = Math.max(0, weeklyProgress.value.completedWorkouts)
    const goal = Math.max(0, weeklyProgress.value.weeklyGoal)

    if (goal === 0) return 0

    return Math.min(100, Math.round((completed / goal) * 100))
  })

  async function loadWeeklyProgress() {
    isLoading.value = true
    error.value = ''

    try {
      weeklyProgress.value = await fetchWeeklyProgress()
    } catch (exception) {
      error.value = exception.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    weeklyProgress,
    progressPercent,
    isLoading,
    error,
    loadWeeklyProgress,
  }
}
