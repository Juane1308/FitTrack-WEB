import { afterEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RoutineSession from '@/components/RoutineSession.vue'
import { useAuthController } from '@/controllers/authController'

afterEach(() => vi.unstubAllGlobals())
it('RF31–35: detalle, inicio, ejercicios y finalización confirmada por la API', async () => {
  const pinia = createPinia(); setActivePinia(pinia)
  const auth = useAuthController()
  auth.currentUser = { id: 'owner', name: 'Alexander' }
  auth.status = 'authenticated'
  const routine = { id: '7', name: 'Fuerza', goal: 'Ganar fuerza', level: 'Avanzado', durationMinutes: 45, muscleGroup: 'Piernas',
    exercises: [{ id: '2', name: 'Sentadilla', technique: 'Baja con control', sets: 3, repetitions: 10, restSeconds: 60 }] }
  const fetchMock = vi.fn(async url => {
    const path = String(url)
    const data = path.endsWith('/active') ? { session: null }
      : path.endsWith('/start') ? { session: { id: 'session', routineId: '7' } }
        : path.endsWith('/finish') ? { session: { id: 'session', durationMinutes: 20 } } : { routine }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  const wrapper = mount(RoutineSession, { props: { routineId: '7' }, global: { plugins: [pinia] } })
  await flushPromises()
  expect(wrapper.text()).toContain('Baja con control')
  expect(wrapper.text()).toContain('3 series · 10 repeticiones')
  expect(wrapper.text()).toContain('Ganar fuerza')
  const button = text => wrapper.findAll('button').find(b => b.text() === text)
  await button('Comenzar rutina').trigger('click'); await flushPromises()
  expect(button('Finalizar entrenamiento').attributes('disabled')).toBeDefined()
  await wrapper.get('input[type="checkbox"]').setValue(true)
  await button('Finalizar entrenamiento').trigger('click'); await flushPromises()
  expect(wrapper.text()).toContain('¡Entrenamiento registrado!')
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/finish'))).toHaveLength(1)
  wrapper.unmount()
})
