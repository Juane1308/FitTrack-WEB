import { computed, ref } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const groupOptions = [
  { id: 'all', label: 'Todos' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'hombros', label: 'Hombros' },
  { id: 'espalda', label: 'Espalda' },
  { id: 'pecho', label: 'Pecho' },
  { id: 'pierna', label: 'Piernas' },
  { id: 'abdomen', label: 'Abdomen' },
]

export function useExerciseCatalogController() {
  const exercises = ref([])
  const search = ref('')
  const selectedGroup = ref('all')
  const isLoading = ref(true)
  const error = ref('')
  const filteredExercises = computed(() => {
    const term = normalize(search.value.trim())
    return exercises.value.filter(exercise => (selectedGroup.value === 'all' || exercise.muscleCategory === selectedGroup.value)
      && normalize(`${exercise.name} ${exercise.muscleGroup ?? ''} ${exercise.equipment ?? ''} ${(exercise.primaryMuscles ?? []).join(' ')}`).includes(term))
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

  function clearSearch() { search.value = '' }
  return { exercises, search, selectedGroup, groupOptions, filteredExercises, isLoading, error, loadExercises, clearSearch }
}
