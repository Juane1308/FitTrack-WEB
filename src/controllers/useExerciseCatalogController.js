import { computed, ref } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function useExerciseCatalogController() {
  const exercises = ref([])
  const search = ref('')
  const selectedGroup = ref('Todos')
  const selectedLevel = ref('Todos')
  const muscleGroups = computed(() => ['Todos', ...new Set(exercises.value.map(exercise => exercise.muscleGroup).filter(Boolean).sort((a, b) => a.localeCompare(b, 'es')))])
  const levels = computed(() => ['Todos', ...new Set(exercises.value.map(exercise => exercise.level).filter(level => level && !['No especificado', 'Todos los niveles'].includes(level)).sort((a, b) => a.localeCompare(b, 'es')))])
  const isLoading = ref(true)
  const error = ref('')
  const filteredExercises = computed(() => {
    const term = normalize(search.value.trim())
    return exercises.value.filter(exercise => (selectedGroup.value === 'Todos' || exercise.muscleGroup === selectedGroup.value)
      && (selectedLevel.value === 'Todos' || exercise.level === selectedLevel.value)
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

  function clearFilters() { search.value = ''; selectedGroup.value = 'Todos'; selectedLevel.value = 'Todos' }
  return { exercises, search, selectedGroup, selectedLevel, muscleGroups, levels, filteredExercises, isLoading, error, loadExercises, clearFilters }
}
