import { computed, ref } from 'vue'

import { fetchHomeDashboard } from '@/repositories/weeklyProgressRepository'
import { useAuthController } from './authController'

export function useHomeController() {
  const auth = useAuthController()

  const dashboard = ref(null)
  const user = computed(() => dashboard.value?.user ?? auth.currentUser)
  const isLoading = ref(false)
  const error = ref('')

  const progressPercent = computed(() => {
    const weeklyProgress = dashboard.value?.weeklyProgress
    if (!weeklyProgress || weeklyProgress.weeklyGoal == null) return 0

    const completed = Math.max(0, weeklyProgress.completedWorkouts)
    const goal = Math.max(0, weeklyProgress.weeklyGoal)

    if (goal === 0) return 0

    return Math.min(100, Math.round((completed / goal) * 100))
  })

  async function loadHomeDashboard() {
    isLoading.value = true
    error.value = ''

    try {
      dashboard.value = await fetchHomeDashboard()
    } catch (exception) {
      error.value = exception.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    dashboard,
    weeklyProgress: computed(() => dashboard.value?.weeklyProgress ?? null),
    metrics: computed(() => dashboard.value?.metrics ?? null),
    todayRoutine: computed(() => dashboard.value?.todayRoutine ?? null),
    progressPercent,
    isLoading,
    error,
    loadHomeDashboard,
  }
}
