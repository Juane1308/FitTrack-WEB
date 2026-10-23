import { computed, ref } from 'vue'

import { ProgressRepository } from '@/repositories/progressRepository'
import { useSnackbarController } from './snackbarController'

export const PROGRESS_PERIODS = Object.freeze([
  { key: '1w', label: '1 Semana', days: 7 },
  { key: '1m', label: '1 Mes', days: 30 },
  { key: '3m', label: '3 Meses', days: 91 },
  { key: '6m', label: '6 Meses', days: 182 },
  { key: '1y', label: '1 Año', days: 365 },
])

const DAY_MS = 86400000

// Los registros de peso que caen dentro del periodo elegido (fechas YYYY-MM-DD).
export function historyInPeriod(history, days, today = new Date()) {
  const from = new Date(today.getTime() - days * DAY_MS).toISOString().slice(0, 10)
  return history.filter((entry) => entry.date >= from)
}

export function useProgressController(repository = new ProgressRepository()) {
  const snackbar = useSnackbarController()
  const progress = ref(null)
  const isLoading = ref(false)
  const error = ref('')
  const period = ref('1m')
  const savingWeight = ref(false)
  const savingHeight = ref(false)
  const savingPhoto = ref(false)

  const periodHistory = computed(() => {
    const days = PROGRESS_PERIODS.find((option) => option.key === period.value)?.days ?? 30
    return historyInPeriod(progress.value?.history ?? [], days)
  })

  async function loadProgress() {
    isLoading.value = true
    error.value = ''
    try {
      progress.value = await repository.getProgress()
    } catch (exception) {
      error.value = exception.status === 401
        ? 'Tu sesión venció. Inicia sesión nuevamente.'
        : 'No fue posible cargar tu progreso. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  async function saveWeight(weightKg) {
    const value = Number(weightKg)
    if (!Number.isFinite(value) || value < 25 || value > 350) {
      snackbar.show('Ingresa un peso entre 25 y 350 kg.')
      return false
    }
    savingWeight.value = true
    try {
      await repository.saveWeight(value)
      await loadProgress()
      snackbar.show('Peso guardado.')
      return true
    } catch (_exception) {
      snackbar.show('No se pudo guardar el peso. Intenta nuevamente.')
      return false
    } finally {
      savingWeight.value = false
    }
  }

  async function saveHeight(heightMeters) {
    const heightCm = Math.round(Number(heightMeters) * 1000) / 10
    if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
      snackbar.show('Ingresa una estatura entre 1.00 y 2.50 m.')
      return false
    }
    savingHeight.value = true
    try {
      const { heightCm: saved } = await repository.saveHeight(heightCm)
      progress.value = { ...progress.value, heightCm: saved }
      snackbar.show('Estatura guardada.')
      return true
    } catch (_exception) {
      snackbar.show('No se pudo guardar la estatura. Intenta nuevamente.')
      return false
    } finally {
      savingHeight.value = false
    }
  }

  async function addPhoto(file) {
    if (!file?.type?.startsWith('image/')) {
      snackbar.show('Elige un archivo de imagen (JPG, PNG o WebP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      snackbar.show('La imagen pesa más de 10 MB. Elige una más liviana.')
      return
    }
    savingPhoto.value = true
    try {
      await repository.addPhoto(await portraitThumbnail(file))
      await loadProgress()
      snackbar.show('Foto de progreso guardada.')
    } catch (_exception) {
      snackbar.show('No se pudo guardar la foto. Intenta con otra imagen.')
    } finally {
      savingPhoto.value = false
    }
  }

  return {
    progress,
    isLoading,
    error,
    period,
    periodHistory,
    savingWeight,
    savingHeight,
    savingPhoto,
    loadProgress,
    saveWeight,
    saveHeight,
    addPhoto,
  }
}

// Recorta la foto en vertical (3:4) desde el centro y la comprime a JPEG.
// Baja la calidad hasta que el envío quede por debajo del límite de 100 KB de express.json.
async function portraitThumbnail(file, width = 360, height = 480) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.max(width / bitmap.width, height / bitmap.height)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(
    bitmap,
    (bitmap.width - sourceWidth) / 2,
    (bitmap.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  )
  bitmap.close()
  let quality = 0.82
  let image = canvas.toDataURL('image/jpeg', quality)
  while (image.length > 90000 && quality > 0.4) {
    quality -= 0.1
    image = canvas.toDataURL('image/jpeg', quality)
  }
  return image
}
