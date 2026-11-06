import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ replace: vi.fn() }) }))

import { useAuthController } from '@/controllers/authController'
import { useChangePasswordController } from '@/controllers/useChangePasswordController'
import { useNutritionController } from '@/controllers/useNutritionController'
import { useProfileController } from '@/controllers/useProfileController'
import { useProfileDataController } from '@/controllers/useProfileDataController'
import { useProfileGoalsController } from '@/controllers/useProfileGoalsController'
import { useProfileHelpController } from '@/controllers/useProfileHelpController'
import { useProfileSettingsController } from '@/controllers/useProfileSettingsController'
import { AppUser } from '@/models'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  useAuthController().currentUser = new AppUser({ id: '1', name: 'Ana', email: 'ana@x.co', goal: 'stay_fit', profileCompleted: true })
})

describe('Perfil', () => {
  it('muestra el resumen y formatea el cambio de peso', async () => {
    const profile = useProfileController({ getOverview: async () => ({ name: 'Ana María', email: 'ana@x.co', goal: 'lose_weight', weeks: 12, completedWorkouts: 48, weightChangeKg: -6.2 }) })
    await profile.loadOverview()
    expect(profile.weightChange.value).toBe('-6.2 kg')
    expect(profile.goal.value).toBe('Perder peso')
    expect(useAuthController().currentUser.name).toBe('Ana María')
  })

  it('avisa si la sesión venció', async () => {
    const profile = useProfileController({ getOverview: async () => { throw Object.assign(new Error(), { status: 401 }) } })
    await profile.loadOverview()
    expect(profile.error.value).toContain('sesión venció')
  })

  it('guarda los objetivos convirtiendo litros a mililitros y limita la meta semanal', async () => {
    const saveGoals = vi.fn(async goals => goals)
    const controller = useProfileGoalsController({
      getGoals: async () => ({ goal: 'stay_fit', currentWeightKg: 80, weeklyWorkouts: 14, targetWeightKg: null, dailyWaterMl: 2000 }),
      saveGoals,
    })
    await controller.loadGoals()
    expect(controller.form.dailyWaterLiters).toBe(2)
    controller.changeWeeklyWorkouts(1)
    expect(controller.form.weeklyWorkouts).toBe(14)

    controller.form.targetWeightKg = '400'
    await controller.saveGoals()
    expect(saveGoals).not.toHaveBeenCalled()

    Object.assign(controller.form, { goal: 'gain_muscle', targetWeightKg: '75', dailyWaterLiters: 2.5 })
    await controller.saveGoals()
    expect(saveGoals).toHaveBeenCalledWith({ goal: 'gain_muscle', weeklyWorkouts: 14, targetWeightKg: 75, dailyWaterMl: 2500 })
    expect(useAuthController().currentUser.goal).toBe('gain_muscle')
  })

  it('guarda mis datos y solo cambia el nombre si se editó', async () => {
    const repository = {
      getPersonalData: async () => ({ goal: 'stay_fit', birthDate: '2000-05-10', weightKg: 80, heightCm: 175, sportExperience: 'moderate',
        trainingLocation: 'gym', injuries: [], jointPains: [], surgeries: [], chronicConditions: [], allergies: ['Huevo'] }),
      updateName: vi.fn(),
      savePersonalData: vi.fn(async profile => ({ ...profile, profileCompleted: true })),
    }
    const controller = useProfileDataController(repository)
    await controller.loadData()
    expect(controller.form.name).toBe('Ana')
    controller.toggleHealthItem('allergies', 'Huevo')
    controller.toggleHealthItem('injuries', 'Rodilla')
    controller.form.weightKg = '78.5'
    await controller.saveData()
    expect(repository.updateName).not.toHaveBeenCalled()
    expect(repository.savePersonalData.mock.calls[0][0]).toMatchObject({ weightKg: 78.5, allergies: [], injuries: ['Rodilla'] })
    expect(repository.savePersonalData.mock.calls[0][0]).not.toHaveProperty('name')

    controller.form.name = 'Ana María'
    await controller.saveData()
    expect(repository.updateName).toHaveBeenCalledWith('Ana María')
  })

  it('revierte un ajuste si no se pudo guardar', async () => {
    const controller = useProfileSettingsController({ getSettings: async () => ({ news: false }), saveSettings: async () => { throw new Error() } })
    await controller.loadSettings()
    await controller.updateSetting('news', true)
    expect(controller.settings.news).toBe(false)
  })

  it('marca la contraseña actual incorrecta', async () => {
    const controller = useChangePasswordController({ changePassword: async () => { throw Object.assign(new Error(), { code: 'wrongPassword' }) } })
    Object.assign(controller.form, { currentPassword: 'mala', newPassword: 'NuevaClave123', confirmation: 'NuevaClave123' })
    await controller.changePassword()
    expect(controller.errors.currentPassword).toBe('La contraseña actual no es correcta.')
  })

  it('agrupa la ayuda por categoría', async () => {
    const controller = useProfileHelpController({ getFaqs: async () => [
      { id: '1', category: 'Cuenta', question: 'a', answer: 'a' },
      { id: '2', category: 'Objetivos', question: 'b', answer: 'b' },
      { id: '3', category: 'Cuenta', question: 'c', answer: 'c' },
    ] })
    await controller.loadFaqs()
    expect(controller.groups.value.map(group => [group.category, group.items.length])).toEqual([['Cuenta', 2], ['Objetivos', 1]])
  })
})

describe('Alimentación', () => {
  it('carga el catálogo desde la API y muestra error si falla', async () => {
    const catalog = { sourceUrl: 'https://fdc', categories: [{ id: 'proteins', items: [{ id: 'p-1' }] }] }
    const controller = useNutritionController({ getFoods: async () => catalog, getRecipes: async () => ({ categories: [] }) })
    await controller.loadCatalogs()
    expect(controller.categories.value).toHaveLength(1)
    expect(controller.sourceUrl.value).toBe('https://fdc')

    const failing = useNutritionController({ getFoods: async () => { throw new Error() }, getRecipes: async () => ({}) })
    await failing.loadCatalogs()
    expect(failing.error.value).toContain('No fue posible')
  })
})
