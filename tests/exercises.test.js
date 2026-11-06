import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ExerciseCatalog from '@/components/ExerciseCatalog.vue'

const entries = [
  { id: '1', name: 'Extensión de tríceps', level: 'Principiante', muscleGroup: 'Tríceps', equipment: 'Polea', technique: 'Extiende los brazos con control.' },
  { id: '2', name: 'Sentadilla', level: 'Intermedio', muscleGroup: 'Piernas', equipment: 'Sin equipo', technique: 'Baja con control.' },
]
const reply = exercises => new Response(JSON.stringify({ exercises }), { headers: { 'Content-Type': 'application/json' } })
afterEach(() => vi.unstubAllGlobals())

describe('Consulta de ejercicios RF29', () => {
  it('consulta la API, muestra los ejercicios y permite buscar sin tildes', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(entries))
    vi.stubGlobal('fetch', fetch)
    const wrapper = mount(ExerciseCatalog)
    expect(wrapper.text()).toContain('Cargando ejercicios')
    await flushPromises()
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/api\/exercises$/)
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('Polea')
    expect(wrapper.find('details').text()).toContain(entries[0].technique)
    await wrapper.get('input').setValue('TRICEPS')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.get('li').text()).toContain('Extensión de tríceps')
    await wrapper.get('input').setValue('sin resultados')
    expect(wrapper.text()).toContain('No se encontraron ejercicios')
    await wrapper.get('button').trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })
  it('muestra un catálogo vacío sin confundirlo con un error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply([])))
    const wrapper = mount(ExerciseCatalog)
    await flushPromises()
    expect(wrapper.text()).toContain('Aún no hay ejercicios disponibles')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('permite reintentar una conexión fallida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(reply(entries)))
    const wrapper = mount(ExerciseCatalog)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('No fue posible cargar')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('li')).toHaveLength(2)
  })
})
