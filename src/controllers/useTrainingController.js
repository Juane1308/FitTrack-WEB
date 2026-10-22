import { computed, ref } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'
import { useAppStateController } from './appStateController'

export function useTrainingController() {
  const state = useAppStateController()
  const routines = computed(() => state.routines)
  const isLoading = ref(true)
  const error = ref('')
  async function loadRoutines() {
    isLoading.value = true
    error.value = ''
    state.routines = []
    try {
      state.routines = await new TrainingRepository().getRoutines()
    } catch (_exception) {
      error.value = 'No fue posible cargar las rutinas. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }
  return { routines, isLoading, error, loadRoutines }
}
