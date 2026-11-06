import { computed, onScopeDispose, ref, watch } from 'vue'
import { TrainingRepository } from '@/repositories/trainingRepository'
import { useAuthController } from './authController'

const progressPrefix = 'fittrack_workout_progress:'
const setGoal = exercise => Math.max(1, Number(exercise?.sets) || 1)

export function useRoutineSessionController() {
  const repository = new TrainingRepository()
  const auth = useAuthController()
  const detail = ref(null)
  const selectedId = ref(null)
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const session = ref(null)
  const elapsedSeconds = ref(0)
  const timerPaused = ref(false)
  const currentExerciseIndex = ref(0)
  const completedSets = ref({})
  const result = ref(null)
  let version = 0
  let timer = null
  let lastTickAt = 0

  const storageKey = sessionId => `${progressPrefix}${sessionId}`
  function saveProgress() {
    if (!session.value?.id) return
    try {
      localStorage.setItem(storageKey(session.value.id), JSON.stringify({
        elapsedSeconds: elapsedSeconds.value, paused: timerPaused.value,
        currentExerciseIndex: currentExerciseIndex.value, completedSets: completedSets.value, savedAt: Date.now(),
      }))
    } catch { /* El entrenamiento puede seguir aunque el navegador no permita almacenamiento local. */ }
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null }
  function startTimer() {
    stopTimer()
    if (!session.value) return
    lastTickAt = Date.now()
    timer = setInterval(() => {
      const now = Date.now()
      if (timerPaused.value) { lastTickAt = now; return }
      const seconds = Math.floor((now - lastTickAt) / 1000)
      if (seconds < 1) return
      elapsedSeconds.value += seconds
      lastTickAt += seconds * 1000
      saveProgress()
    }, 1000)
  }
  function restoreProgress(activeSession) {
    stopTimer()
    elapsedSeconds.value = 0; timerPaused.value = false; currentExerciseIndex.value = 0; completedSets.value = {}
    if (!activeSession?.id) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(activeSession.id)) ?? 'null')
      if (saved) {
        elapsedSeconds.value = Math.max(0, Number(saved.elapsedSeconds) || 0)
        if (!saved.paused) elapsedSeconds.value += Math.max(0, Math.floor((Date.now() - Number(saved.savedAt)) / 1000))
        timerPaused.value = Boolean(saved.paused)
        currentExerciseIndex.value = Math.max(0, Number(saved.currentExerciseIndex) || 0)
        completedSets.value = saved.completedSets && typeof saved.completedSets === 'object' ? saved.completedSets : {}
      } else if (activeSession.startedAt) elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000))
    } catch { /* Ignora un progreso local malformado y empieza desde el estado del servidor. */ }
    startTimer()
  }

  watch(() => auth.currentUser?.id, () => {
    version++; stopTimer(); detail.value = null; selectedId.value = null; session.value = null
    result.value = null; error.value = ''; loading.value = false; busy.value = false; restoreProgress(null)
  }, { flush: 'sync' })
  watch(session, restoreProgress, { flush: 'sync' })

  async function openRoutine(id) {
    const request = ++version
    selectedId.value = id; loading.value = true; error.value = ''; detail.value = null; result.value = null
    try { const routine = await repository.getRoutine(id); if (request === version) detail.value = routine }
    catch (exception) { if (request === version) error.value = exception.message }
    finally { if (request === version) loading.value = false }
  }
  async function restoreSession() {
    if (!auth.isAuthenticated) return
    const request = version
    try { const data = await repository.getActiveWorkout(); if (request === version) session.value = data.session }
    catch (exception) { if (request === version) error.value = exception.message }
  }

  const resumeRoutineId = computed(() => session.value?.customRoutineId ? `custom:${session.value.customRoutineId}` : session.value?.routineId ?? null)
  const isActiveRoutine = computed(() => Boolean(session.value && String(resumeRoutineId.value) === String(selectedId.value)))
  const currentExercise = computed(() => detail.value?.exercises?.[currentExerciseIndex.value] ?? null)
  const currentExerciseSetGoal = computed(() => setGoal(currentExercise.value))
  const currentExerciseCompletedSets = computed(() => currentExercise.value ? Number(completedSets.value[currentExercise.value.id] ?? 0) : 0)
  const completedExercises = computed(() => (detail.value?.exercises ?? []).filter(exercise => Number(completedSets.value[exercise.id] ?? 0) >= setGoal(exercise)).map(exercise => exercise.id))
  const canFinish = computed(() => Boolean(isActiveRoutine.value && detail.value?.exercises.length && detail.value.exercises.every(exercise => Number(completedSets.value[exercise.id] ?? 0) >= setGoal(exercise))))
  const formattedTime = computed(() => [Math.floor(elapsedSeconds.value / 3600), Math.floor((elapsedSeconds.value % 3600) / 60), elapsedSeconds.value % 60].map(value => String(value).padStart(2, '0')).join(':'))

  async function start() {
    if (busy.value || !auth.isAuthenticated || !detail.value) return
    busy.value = true; error.value = ''
    const request = version
    try {
      const data = await repository.startWorkout(selectedId.value)
      if (request === version) { completedSets.value = {}; currentExerciseIndex.value = 0; timerPaused.value = false; session.value = data.session }
    } catch (exception) { if (request === version) { error.value = exception.message; await restoreSession() } }
    finally { if (request === version) busy.value = false }
  }
  function toggleTimer() {
    if (!session.value) return
    const now = Date.now()
    if (!timerPaused.value) elapsedSeconds.value += Math.max(0, Math.floor((now - lastTickAt) / 1000))
    timerPaused.value = !timerPaused.value
    lastTickAt = now
    saveProgress()
  }
  function completeSet() {
    if (!isActiveRoutine.value || !currentExercise.value) return
    const id = currentExercise.value.id
    const count = Math.min(currentExerciseSetGoal.value, currentExerciseCompletedSets.value + 1)
    completedSets.value = { ...completedSets.value, [id]: count }
    if (count >= currentExerciseSetGoal.value && currentExerciseIndex.value < detail.value.exercises.length - 1) currentExerciseIndex.value++
    saveProgress()
  }
  function undoSet() {
    if (!currentExercise.value || currentExerciseCompletedSets.value < 1) return
    const id = currentExercise.value.id
    completedSets.value = { ...completedSets.value, [id]: currentExerciseCompletedSets.value - 1 }
    saveProgress()
  }
  function selectExercise(index) {
    if (!detail.value?.exercises?.length) return
    const nextIndex = Math.min(detail.value.exercises.length - 1, Math.max(0, index))
    if (nextIndex > currentExerciseIndex.value && currentExercise.value) {
      completedSets.value = { ...completedSets.value, [currentExercise.value.id]: currentExerciseSetGoal.value }
    }
    currentExerciseIndex.value = nextIndex
    saveProgress()
  }
  async function finish() {
    if (busy.value || !canFinish.value) return
    busy.value = true; error.value = ''
    const request = version
    try {
      const data = await repository.finishWorkout(session.value.id, elapsedSeconds.value)
      if (request === version) {
        result.value = data.session
        try { localStorage.removeItem(storageKey(session.value.id)) } catch { /* No impide finalizar la sesión. */ }
        stopTimer(); session.value = null; completedSets.value = {}
      }
    } catch (exception) { if (request === version) error.value = exception.message }
    finally { if (request === version) busy.value = false }
  }
  function close() { version++; selectedId.value = null; detail.value = null; loading.value = false; result.value = null }
  onScopeDispose(stopTimer)

  return {
    detail, selectedId, loading, busy, error, session, completedExercises, completedSets, result,
    isActiveRoutine, canFinish, currentExercise, currentExerciseIndex, currentExerciseSetGoal,
    currentExerciseCompletedSets, elapsedSeconds, formattedTime, timerPaused, resumeRoutineId,
    openRoutine, restoreSession, start, finish, close, toggleTimer, completeSet, undoSet, selectExercise,
    authenticated: computed(() => auth.isAuthenticated),
  }
}
