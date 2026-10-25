import { computed, ref, watch } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'
import { useAuthController } from './authController'

export function useRoutineSessionController() {
  const repository = new TrainingRepository()
  const auth = useAuthController()
  const detail = ref(null)
  const selectedId = ref(null)
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const session = ref(null)
  const completedExercises = ref([])
  const result = ref(null)
  let version = 0
  watch(() => auth.currentUser?.id, () => {
    version++; detail.value = null; selectedId.value = null; session.value = null
    result.value = null; error.value = ''; loading.value = false; busy.value = false
    completedExercises.value = []
  }, { flush: 'sync' })
  async function openRoutine(id) {
    const request = ++version
    selectedId.value = id; loading.value = true; error.value = ''; detail.value = null; result.value = null
    try {
      const routine = await repository.getRoutine(id)
      if (request === version) detail.value = routine
    } catch (e) { if (request === version) error.value = e.message }
    finally { if (request === version) loading.value = false }
  }
  async function restoreSession() {
    if (!auth.isAuthenticated) return
    const request = version
    try {
      const data = await repository.getActiveWorkout()
      if (request === version) session.value = data.session
    } catch (e) { if (request === version) error.value = e.message }
  }
  const isActiveRoutine = computed(() => session.value && String(session.value.routineId) === String(selectedId.value))
  const canFinish = computed(() => isActiveRoutine.value && detail.value?.exercises.length > 0
    && detail.value.exercises.every(e => completedExercises.value.includes(e.id)))
  async function start() {
    if (busy.value || !auth.isAuthenticated || !detail.value) return
    busy.value = true; error.value = ''
    const request = version
    try {
      const data = await repository.startWorkout(selectedId.value)
      if (request === version) { session.value = data.session; completedExercises.value = [] }
    } catch (e) { if (request === version) { error.value = e.message; await restoreSession() } }
    finally { if (request === version) busy.value = false }
  }
  async function finish() {
    if (busy.value || !canFinish.value) return
    busy.value = true; error.value = ''
    const request = version
    try {
      const data = await repository.finishWorkout(session.value.id)
      if (request === version) { result.value = data.session; session.value = null; completedExercises.value = [] }
    } catch (e) { if (request === version) error.value = e.message }
    finally { if (request === version) busy.value = false }
  }
  function close() { version++; selectedId.value = null; detail.value = null; loading.value = false; result.value = null }
  return { detail, selectedId, loading, busy, error, session, completedExercises, result, isActiveRoutine,
    canFinish, openRoutine, restoreSession, start, finish, close, authenticated: computed(() => auth.isAuthenticated) }
}
