import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TrainingView from '@/views/sections/TrainingView.vue'
import { useAppStateController } from '@/controllers/appStateController'

describe('Catálogo de rutinas RF27', () => {
  it('muestra todas las rutinas del repositorio', () => {
    const pinia = createPinia()
    const wrapper = mount(TrainingView, { global: { plugins: [pinia] } })
    expect(wrapper.findAll('li')).toHaveLength(4)
    for (const name of ['Full Body', 'Hipertrofia', 'Pérdida de grasa', 'Fuerza']) {
      expect(wrapper.text()).toContain(name)
    }
    expect(wrapper.findAll('img').every(image => Boolean(image.attributes('src')))).toBe(true)
  })

  it('muestra un mensaje cuando el catálogo está vacío', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAppStateController().routines = []
    const wrapper = mount(TrainingView, { global: { plugins: [pinia] } })
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aún no hay rutinas disponibles')
  })
})
