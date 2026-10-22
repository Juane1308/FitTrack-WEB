import { AppUser, AuthResult, AuthResultStatus } from '@/models'

import { ACCESS_TOKEN_KEY, apiRequest, clearAccessToken } from './apiClient'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Contrato: register({ name, email, password }), login({ email, password }),
 * requestPasswordReset(email). Todos devuelven promesas.
 */
export class MockAuthRepository {
  #users = new Map()

  async register({ name, email, password }) {
    await delay(250)
    const normalizedEmail = email.trim().toLowerCase()
    if (this.#users.has(normalizedEmail)) {
      return new AuthResult({ status: AuthResultStatus.emailAlreadyRegistered })
    }

    const user = new AppUser({
      name: name.trim(),
      email: normalizedEmail,
      goal: 'Definir objetivo',
    })
    this.#users.set(normalizedEmail, {
      user,
      passwordHash: await hashPassword(password),
      isActive: true,
    })
    return new AuthResult({ status: AuthResultStatus.success, user })
  }

  async login({ email, password }) {
    await delay(250)
    const storedUser = this.#users.get(email.trim().toLowerCase())
    if (!storedUser || storedUser.passwordHash !== (await hashPassword(password))) {
      return new AuthResult({ status: AuthResultStatus.invalidCredentials })
    }
    if (!storedUser.isActive) {
      return new AuthResult({ status: AuthResultStatus.inactiveAccount })
    }
    return new AuthResult({ status: AuthResultStatus.success, user: storedUser.user })
  }

  async requestPasswordReset(_email) {
    await delay(250)
    // El MOCK no envía correos. Tampoco revela si una dirección existe.
  }
}

export class ApiAuthRepository {
  async register({ name, email, password }) {
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      return new AuthResult({ status: data.status, user: new AppUser(data.user) })
    } catch (error) {
      return new AuthResult({ status: error.code ?? AuthResultStatus.backendUnavailable })
    }
  }

  async login({ email, password }) {
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem(ACCESS_TOKEN_KEY, data.token)
      localStorage.setItem('fittrack_user', JSON.stringify(data.user))
      return new AuthResult({ status: data.status, user: new AppUser(data.user) })
    } catch (error) {
      return new AuthResult({ status: error.code ?? AuthResultStatus.backendUnavailable })
    }
  }

  async requestPasswordReset(_email) {
    return undefined
  }

  getStoredUser() {
    try {
      const storedUser = localStorage.getItem('fittrack_user')
      return storedUser ? new AppUser(JSON.parse(storedUser)) : null
    } catch (_error) {
      return null
    }
  }

  logout() {
    clearAccessToken()
    localStorage.removeItem('fittrack_user')
  }
}
