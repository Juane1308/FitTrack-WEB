import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TrainingView from '@/views/sections/TrainingView.vue'
import { useAuthController, AuthStatus } from '@/controllers/authController'

afterEach(() => vi.unstubAllGlobals())
const response = routines => new Response(JSON.stringify({ routines }), { headers: { 'Content-Type': 'application/json' } })
const click = (wrapper, text) => wrapper.findAll('button').find(b => b.text() === text).trigger('click')

describe('Mis rutinas RF30', () => {
  it('guarda, consulta y quita una rutina; conserva las asignadas', async () => {
    const routine = { id: '1', name: 'Rutina personal', level: 'Principiante', durationMinutes: 25 }
    let saved = false
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options) => {
      if (options.method === 'POST') { saved = true; return Promise.resolve(response([])) }
      if (options.method === 'DELETE') { saved = false; return Promise.resolve(new Response(null, { status: 204 })) }
      const mine = String(url).endsWith('/api/me/routines')
      return Promise.resolve(response(mine ? [ ...(saved ? [{ ...routine, origin: 'saved' }] : []), { ...routine, id: '2', name: 'Rutina asignada', origin: 'assigned' }] : [routine]))
    }))
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthController().status = AuthStatus.authenticated
    const wrapper = mount(TrainingView, { global: { plugins: [pinia] } })
    await flushPromises()
    await wrapper.get('button[aria-label="Guardar Rutina personal en mis rutinas"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('button[aria-label="Quitar Rutina personal de mis rutinas"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('button[aria-label="Quitar Rutina personal de mis rutinas"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('button[aria-label="Guardar Rutina personal en mis rutinas"]').exists()).toBe(true)
    await wrapper.get('button[aria-label="Guardar Rutina personal en mis rutinas"]').trigger('click')
    await flushPromises()
    await click(wrapper, 'Mis rutinas')
    await flushPromises()
    expect(wrapper.get('[aria-label="Mis rutinas"]').text()).toContain('Guardada')
    expect(wrapper.get('[aria-label="Mis rutinas"]').text()).toContain('Asignada')
    expect(wrapper.get('[aria-label="Mis rutinas"]').get('button[aria-label="Rutina asignada: rutina asignada"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="Mis rutinas"]').get('button[aria-label="Quitar Rutina personal de mis rutinas"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Mis rutinas"]').text()).not.toContain('Rutina personal')
    expect(wrapper.get('[aria-label="Mis rutinas"]').text()).toContain('Rutina asignada')
  })
  it('requiere sesión para consultar mis rutinas en la vista previa', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])))
    const wrapper = mount(TrainingView, { global: { plugins: [createPinia()] } })
    await flushPromises()
    await click(wrapper, 'Mis rutinas')
    expect(wrapper.text()).toContain('Inicia sesión para consultar tus rutinas')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
