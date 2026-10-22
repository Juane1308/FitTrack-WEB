import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { goalLabel } from '@/core/profileOptions'
import { ProfileRepository } from '@/repositories/profileRepository'
import { useAuthController } from './authController'

export function useProfileController(repository = new ProfileRepository()) {
  const router = useRouter()
  const auth = useAuthController()
  const overview = ref(null)
  const isLoading = ref(false)
  const error = ref('')

  const name = computed(() => overview.value?.name ?? auth.currentUser?.name ?? '')
  const email = computed(() => overview.value?.email ?? auth.currentUser?.email ?? '')
  const goal = computed(() => goalLabel(overview.value?.goal ?? auth.currentUser?.goal))
  const weightChange = computed(() => {
    const change = overview.value?.weightChangeKg
    if (change == null) return '--'
    return `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`
  })

  async function loadOverview() {
    isLoading.value = true
    error.value = ''
    try {
      overview.value = await repository.getOverview()
      auth.updateUser({ name: overview.value.name, goal: overview.value.goal })
    } catch (exception) {
      error.value = exception.status === 401
        ? 'Tu sesión venció. Inicia sesión nuevamente.'
        : 'No fue posible cargar tu perfil. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    auth.logout()
    router.replace({ name: 'login' })
  }

  return { overview, name, email, goal, weightChange, isLoading, error, loadOverview, logout }
}
