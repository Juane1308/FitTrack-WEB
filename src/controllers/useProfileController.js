import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { activityLevels, goalLabel, locations } from '@/core/profileOptions'
import { ProfileRepository } from '@/repositories/profileRepository'
import { useAuthController } from './authController'

export function useProfileController(repository = new ProfileRepository()) {
  const router = useRouter()
  const auth = useAuthController()
  const overview = ref(null)
  const personalData = ref(null)
  const goals = ref(null)
  const isLoading = ref(false)
  const error = ref('')
  const avatarSaving = ref(false)
  const avatarError = ref('')

  const avatar = computed(() => overview.value?.avatar ?? null)
  const name = computed(() => overview.value?.name ?? auth.currentUser?.name ?? '')
  const email = computed(() => overview.value?.email ?? auth.currentUser?.email ?? '')
  const goal = computed(() => goalLabel(overview.value?.goal ?? auth.currentUser?.goal))
  const weightChange = computed(() => {
    const change = overview.value?.weightChangeKg
    if (change == null) return '--'
    return `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`
  })

  // Resumen físico y del plan para la columna izquierda del perfil
  const age = computed(() => {
    const birthDate = personalData.value?.birthDate
    if (!birthDate) return null
    const born = new Date(`${birthDate}T00:00:00`)
    const today = new Date()
    let years = today.getFullYear() - born.getFullYear()
    if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) years -= 1
    return years
  })
  const bmi = computed(() => {
    const weight = Number(personalData.value?.weightKg)
    const height = Number(personalData.value?.heightCm) / 100
    if (!weight || !height) return null
    return (weight / (height * height)).toFixed(1)
  })
  const activity = computed(() => activityLevels.find((level) => level.value === personalData.value?.sportExperience)?.label ?? null)
  const location = computed(() => locations.find((place) => place.value === personalData.value?.trainingLocation)?.label ?? null)

  async function loadDetails() {
    if (!repository.getPersonalData || !repository.getGoals) return
    const [data, userGoals] = await Promise.allSettled([repository.getPersonalData(), repository.getGoals()])
    if (data.status === 'fulfilled') personalData.value = data.value
    if (userGoals.status === 'fulfilled') goals.value = userGoals.value
  }

  async function loadOverview() {
    loadDetails()
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

  async function changeAvatar(file) {
    avatarError.value = ''
    if (!file?.type?.startsWith('image/')) {
      avatarError.value = 'Elige un archivo de imagen (JPG, PNG o WebP).'
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      avatarError.value = 'La imagen pesa más de 10 MB. Elige una más liviana.'
      return
    }
    avatarSaving.value = true
    try {
      const image = await squareThumbnail(file)
      const { avatar: saved } = await repository.uploadAvatar(image)
      overview.value = { ...overview.value, avatar: saved }
    } catch (_exception) {
      avatarError.value = 'No se pudo guardar la foto. Intenta con otra imagen.'
    } finally {
      avatarSaving.value = false
    }
  }

  async function removeAvatar() {
    avatarError.value = ''
    avatarSaving.value = true
    try {
      await repository.removeAvatar()
      overview.value = { ...overview.value, avatar: null }
    } catch (_exception) {
      avatarError.value = 'No se pudo quitar la foto. Intenta nuevamente.'
    } finally {
      avatarSaving.value = false
    }
  }

  function logout() {
    auth.logout()
    router.replace({ name: 'login' })
  }

  return { avatar, avatarSaving, avatarError, changeAvatar, removeAvatar, overview, personalData, goals, age, bmi, activity, location, name, email, goal, weightChange, isLoading, error, loadOverview, logout }
}

// Recorta la imagen al centro en un cuadrado y la comprime a JPEG para que la subida pese poco
// (debe quedar por debajo del límite de 100 KB de express.json).
async function squareThumbnail(file, size = 256) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas.getContext('2d').drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}
