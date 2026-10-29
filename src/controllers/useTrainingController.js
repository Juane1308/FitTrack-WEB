import { computed, ref, watch } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'
import { useAppStateController } from './appStateController'
import { useAuthController } from './authController'

export function useTrainingController() {
  const state = useAppStateController()
  const auth = useAuthController()
  const myRoutines = ref([])
  const myLoading = ref(false)
  const myError = ref('')
  const actionError = ref('')
  const pendingIds = ref(new Set())
  const repository = new TrainingRepository()
  const canManageRoutines = computed(() => auth.isAuthenticated)
  const savedIds = computed(() => new Set(myRoutines.value.map(routine => routine.id)))
  let myRequestVersion = 0
  watch(() => [auth.isAuthenticated, auth.currentUser?.id], () => {
    myRequestVersion += 1
    myRoutines.value = []
    myError.value = ''
    actionError.value = ''
    myLoading.value = false
  }, { flush: 'sync' })
  async function loadMyRoutines() {
    const version = ++myRequestVersion
    myRoutines.value = []
    myError.value = ''
    if (!auth.isAuthenticated) return
    myLoading.value = true
    try {
      const result = await repository.getMyRoutines()
      if (version === myRequestVersion) myRoutines.value = result
    }
    catch (exception) {
      if (version === myRequestVersion) myError.value = exception.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' : 'No fue posible cargar tus rutinas. Intenta nuevamente.'
    } finally { if (version === myRequestVersion) myLoading.value = false }
  }
  async function changeSavedRoutine(id, remove = false) {
    if (!auth.isAuthenticated || pendingIds.value.has(id)) return
    pendingIds.value.add(id)
    actionError.value = ''
    try {
      if (remove) await repository.removeRoutine(id)
      else await repository.saveRoutine(id)
      await loadMyRoutines()
    } catch (exception) {
      actionError.value = exception.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' : 'No fue posible actualizar tus rutinas. Intenta nuevamente.'
    } finally { pendingIds.value.delete(id) }
  }
  async function removeCustomRoutine(id) {
    if (!auth.isAuthenticated || pendingIds.value.has(id)) return
    pendingIds.value.add(id); actionError.value = ''
    try { await repository.removeCustomRoutine(id); await loadMyRoutines() }
    catch (exception) { actionError.value = exception.status === 409 ? exception.message : exception.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' : 'No fue posible eliminar la rutina. Intenta nuevamente.' }
    finally { pendingIds.value.delete(id) }
  }
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
  return { routines, isLoading, error, loadRoutines, myRoutines, myLoading, myError, actionError, pendingIds, savedIds, canManageRoutines, loadMyRoutines, changeSavedRoutine, removeCustomRoutine }
}
