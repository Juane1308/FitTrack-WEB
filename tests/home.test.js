import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import HomeView from '@/views/sections/HomeView.vue'

afterEach(() => vi.unstubAllGlobals())

const dashboard = completed => ({
  user: { id: 'user-1', name: 'Samuel' },
  weeklyProgress: { completedWorkouts: completed ? 1 : 0, weeklyGoal: 3 },
  metrics: { calories: completed ? 240 : 0, exerciseMinutes: completed ? 35 : 0, activeStreak: completed ? 1 : 0 },
  todayRoutine: {
    id: '42',
    name: 'Fuerza de tren superior',
    durationMinutes: 35,
    difficulty: 'Intermedio',
    origin: 'assigned',
    completed,
  },
  routineSummary: { total: 2, assigned: 1, saved: 1 },
  weeklyActivity: [{ date: '2026-10-19', exerciseMinutes: completed ? 35 : 0, calories: 240, completedWorkouts: completed ? 1 : 0 }],
  homeBackground: 'data:image/png;base64,ZmFrZS1iYWNrZ3JvdW5k',
})

describe('Home conectado a actividad real', () => {
  it('muestra la rutina asignada, mis rutinas y actividad semanal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...dashboard(false), weeklyActivity: [...dashboard(false).weeklyActivity, { date: '2026-10-20', exerciseMinutes: 20, calories: 120, completedWorkouts: 1 }] }), { headers: { 'Content-Type': 'application/json' } })))
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Fuerza de tren superior')
    expect(wrapper.text()).toContain('1 asignadas · 1 guardadas')
    expect(wrapper.get('[aria-label="Actividad semanal por día"]').findAll('.activity-column')).toHaveLength(2)
    expect(wrapper.get('.home-background-image').attributes('src')).toContain('data:image/png;base64')
  })

  it('registra el entrenamiento y actualiza el resumen', async () => {
    let completed = false
    const fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        completed = true
        return Promise.resolve(new Response(JSON.stringify({ status: 'completed' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      }
      return Promise.resolve(new Response(JSON.stringify(dashboard(completed)), { headers: { 'Content-Type': 'application/json' } }))
    })
    vi.stubGlobal('fetch', fetch)
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    const request = fetch.mock.calls.find(([, options]) => options?.method === 'POST')
    expect(request[0]).toContain('/api/me/workouts')
    expect(JSON.parse(request[1].body)).toMatchObject({ routineId: '42', durationMinutes: 35 })
    expect(wrapper.text()).toContain('Entrenamiento completado. Tu progreso fue actualizado.')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
