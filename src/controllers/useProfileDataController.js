import { reactive, ref } from 'vue'

import { healthGroups } from '@/core/profileOptions'
import * as Validators from '@/core/validators'
import { ProfileRepository } from '@/repositories/profileRepository'
import { useAuthController } from './authController'
import { useSnackbarController } from './snackbarController'

const HEALTH_KEYS = healthGroups.map((group) => group.key)

export function useProfileDataController(repository = new ProfileRepository()) {
  const auth = useAuthController()
  const snackbar = useSnackbarController()
  const today = new Date().toISOString().slice(0, 10)
  const form = reactive({
    name: '',
    goal: '',
    birthDate: '',
    weightKg: '',
    heightCm: '',
    sportExperience: '',
    trainingLocation: '',
    ...Object.fromEntries(HEALTH_KEYS.map((key) => [key, []])),
  })
  const errors = reactive({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const loadError = ref('')

  async function loadData() {
    isLoading.value = true
    loadError.value = ''
    try {
      const profile = await repository.getPersonalData()
      for (const key of Object.keys(form)) {
        if (key !== 'name' && profile[key] !== undefined && profile[key] !== null) form[key] = profile[key]
      }
      form.name = auth.currentUser?.name ?? ''
    } catch (_exception) {
      loadError.value = 'No fue posible cargar tus datos. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  function toggleHealthItem(key, item) {
    const selected = new Set(form[key])
    if (selected.has(item)) selected.delete(item)
    else selected.add(item)
    form[key] = [...selected]
  }

  function clearHealthGroup(key) {
    form[key] = []
  }

  // Mismas reglas que la personalización y que validateProfile en server/index.js.
  function validate() {
    Object.keys(errors).forEach((key) => delete errors[key])
    const weight = Number(form.weightKg)
    const height = Number(form.heightCm)
    const nameError = Validators.required(form.name, 'Ingresa tu nombre.')
    if (nameError) errors.name = nameError
    if (!form.birthDate || form.birthDate > today) errors.birthDate = 'Ingresa una fecha de nacimiento válida.'
    if (!(weight >= 25 && weight <= 350)) errors.weightKg = 'Ingresa un peso entre 25 y 350 kg.'
    if (!(height >= 100 && height <= 250)) errors.heightCm = 'Ingresa una estatura entre 100 y 250 cm.'
    if (!form.sportExperience) errors.sportExperience = 'Selecciona tu nivel de actividad.'
    if (!form.trainingLocation) errors.trainingLocation = 'Selecciona dónde entrenas.'
    return Object.keys(errors).length === 0
  }

  async function saveData() {
    if (isSaving.value || !validate()) return
    isSaving.value = true
    try {
      const name = form.name.trim()
      if (name !== auth.currentUser?.name) await repository.updateName(name)
      const { name: _name, ...profile } = form
      const saved = await repository.savePersonalData({
        ...profile,
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
      })
      auth.updateUser({ name, goal: saved.goal, profileCompleted: saved.profileCompleted })
      snackbar.show('Tus datos se guardaron correctamente.')
    } catch (_exception) {
      snackbar.show('No fue posible guardar tus datos. Revisa la información e intenta de nuevo.')
    } finally {
      isSaving.value = false
    }
  }

  return { form, errors, today, isLoading, isSaving, loadError, loadData, toggleHealthItem, clearHealthGroup, saveData }
}
