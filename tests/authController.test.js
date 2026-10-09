import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthController } from '@/controllers/authController'
import { AuthResultStatus } from '@/models'
import { MockAuthRepository } from '@/repositories/authRepository'

describe('authController', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('registra un usuario y permite iniciar sesión sin guardar la contraseña original', async () => {
    const auth = useAuthController()
    auth.setRepository(new MockAuthRepository())

    const registration = await auth.register({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'ClaveSegura123',
    })

    expect(registration.isSuccess).toBe(true)
    expect(auth.isAuthenticated).toBe(false)

    const invalidLogin = await auth.login({ email: 'ana@example.com', password: 'incorrecta' })
    expect(invalidLogin.status).toBe(AuthResultStatus.invalidCredentials)

    const validLogin = await auth.login({ email: 'ana@example.com', password: 'ClaveSegura123' })
    expect(validLogin.isSuccess).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.currentUser?.name).toBe('Ana')
  })

  it('rechaza correos duplicados en el repositorio mock', async () => {
    const repository = new MockAuthRepository()

    await repository.register({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'ClaveSegura123',
    })
    const duplicate = await repository.register({
      name: 'Otra Ana',
      email: 'ANA@example.com',
      password: 'OtraClave123',
    })

    expect(duplicate.status).toBe(AuthResultStatus.emailAlreadyRegistered)
  })
})
