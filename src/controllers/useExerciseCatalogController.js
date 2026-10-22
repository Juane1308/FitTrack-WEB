import { computed, ref } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function useExerciseCatalogController() {
  const exercises = ref([])
  const search = ref('')
  const isLoading = ref(true)
  const error = ref('')
  const filteredExercises = computed(() => {
    const term = normalize(search.value.trim())
    return exercises.value.filter(exercise => normalize(`${exercise.name} ${exercise.muscleGroup ?? ''} ${exercise.equipment ?? ''}`).includes(term))
  })

  async function loadExercises() {
    isLoading.value = true
    error.value = ''
    exercises.value = []
    try {
      exercises.value = await new TrainingRepository().getExercises()
    } catch (_exception) {
      error.value = 'No fue posible cargar los ejercicios. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  return { exercises, search, filteredExercises, isLoading, error, loadExercises }
}
