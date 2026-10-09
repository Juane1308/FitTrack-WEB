import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/App.vue'
import { installAuthGuard, routes } from '@/router'

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra la base de FITTRACK y luego el inicio de sesión', async () => {
    const pinia = createPinia()
    const router = installAuthGuard(createRouter({ history: createMemoryHistory(), routes }))
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await router.push('/')
    await flushPromises()

    expect(wrapper.findAll('img')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(900)
    vi.useRealTimers()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Inicia sesión')
      expect(wrapper.text()).toContain('Regístrate')
    })
  })

  it('redirige al login si se intenta entrar a la app sin sesión', async () => {
    const pinia = createPinia()
    const router = installAuthGuard(createRouter({ history: createMemoryHistory(), routes }))
    mount(App, { global: { plugins: [pinia, router] } })

    await router.push('/app/home')

    expect(router.currentRoute.value.name).toBe('login')
  })
})
