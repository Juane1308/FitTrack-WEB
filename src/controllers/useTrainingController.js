import { computed } from 'vue'
import { useAppStateController } from './appStateController'

export function useTrainingController() {
  const state = useAppStateController()
  const routines = computed(() => state.routines)
  return { routines }
}
