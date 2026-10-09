import { computed } from 'vue'

import { useAppStateController } from './appStateController'
import { useAuthController } from './authController'

export function useHomeController() {
  const appState = useAppStateController()
  const auth = useAuthController()

  const user = computed(() => auth.currentUser ?? appState.currentUser)
  const dashboard = computed(() => appState.dashboard)
  const routineDetails = computed(
    () =>
      `${dashboard.value.routineDate}  ·  ${dashboard.value.durationMinutes} min  ·  ${dashboard.value.difficulty}`,
  )
  const metrics = computed(() => [
    { key: 'weeklyGoal', label: 'Meta semanal', value: `${dashboard.value.weeklyGoal} días` },
    {
      key: 'progress',
      label: 'Progreso',
      value: `${Math.round(dashboard.value.progressPercent * 100)}%`,
    },
    { key: 'calories', label: 'Calorías', value: `${Math.round(dashboard.value.calories)} kcal` },
    { key: 'streak', label: 'Racha activa', value: `${dashboard.value.activeStreak} días` },
  ])

  return { user, dashboard, routineDetails, metrics }
}
