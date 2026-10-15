import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthResultStatus } from '@/models'
import { HttpAuthRepository } from '@/repositories/httpAuthRepository'

function mockFetch(status, body) {
  const fetch = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('HttpAuthRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('inicia sesión contra la API y convierte la respuesta en AuthResult', async () => {
    const fetch = mockFetch(200, {
      status: 'success',
      user: { id: '1', name: 'Juan', email: 'juan@fittrack.com', goal: 'Ganar masa muscular' },
    })
    const repository = new HttpAuthRepository('/api/')

    const result = await repository.login({ email: 'juan@fittrack.com', password: 'FitTrack2026' })

    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
    expect(result.isSuccess).toBe(true)
    expect(result.user.name).toBe('Juan')
    expect(result.user.goal).toBe('Ganar masa muscular')
  })

  it('devuelve el estado de error que envía la API', async () => {
    mockFetch(401, { status: 'invalidCredentials' })
    const repository = new HttpAuthRepository('/api')

    const result = await repository.login({ email: 'juan@fittrack.com', password: 'mala' })

    expect(result.status).toBe(AuthResultStatus.invalidCredentials)
    expect(result.user).toBeNull()
  })

  it('informa servidor no disponible si la API no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const repository = new HttpAuthRepository('/api')

    const result = await repository.register({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'ClaveSegura123',
    })

    expect(result.status).toBe(AuthResultStatus.serverUnavailable)
  })
})
