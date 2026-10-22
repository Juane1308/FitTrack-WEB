import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import TrainingView from '@/views/sections/TrainingView.vue'
import routines from '@/data/routines.json'

afterEach(() => vi.unstubAllGlobals())
const reply = entries => new Response(JSON.stringify({ routines: entries }), { headers: { 'Content-Type': 'application/json' } })
const render = () => mount(TrainingView, { global: { plugins: [createPinia()] } })

describe('Catálogo de rutinas RF27 desde API', () => {
  it('carga y muestra todas las rutinas recibidas', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(routines.map(r => ({ ...r, image: r.imageKey }))))
    vi.stubGlobal('fetch', fetch)
    const wrapper = render()
    expect(wrapper.get('[role="status"]').text()).toContain('Cargando')
    await flushPromises()
    expect(new URL(fetch.mock.calls[0][0], 'http://localhost').pathname).toBe('/api/routines')
    expect(wrapper.findAll('li')).toHaveLength(routines.length)
    wrapper.findAll('li').forEach((card, index) => {
      const routine = routines[index]
      expect(card.get('h3').text()).toBe(routine.name)
      expect(card.findAll('dt').map(label => label.text())).toEqual(['Nivel de dificultad', 'Duración estimada'])
      expect(card.get('.level').text()).toBe(routine.level)
      expect(card.get('.session-duration').text()).toBe(`${routine.durationMinutes} min por sesión`)
      expect(card.text()).toContain(`Programa de ${routine.durationWeeks} semanas`)
    })
    expect(wrapper.findAll('img').every(image => Boolean(image.attributes('src')))).toBe(true)
  })
  it('muestra un catálogo vacío', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply([])))
    const wrapper = render()
    await flushPromises()
    expect(wrapper.text()).toContain('Aún no hay rutinas disponibles')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('permite reintentar un fallo sin mostrar datos locales de respaldo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(reply([{ id: 'db-only', name: 'Rutina desde PostgreSQL', level: 'Principiante', durationMinutes: 20 }])))
    const wrapper = render()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('No fue posible cargar')
    expect(wrapper.findAll('li')).toHaveLength(0)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Rutina desde PostgreSQL')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
