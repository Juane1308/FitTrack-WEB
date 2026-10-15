import { AppUser, AuthResult, AuthResultStatus } from '@/models'

const KNOWN_STATUSES = new Set(Object.values(AuthResultStatus))

/**
 * Mismo contrato que MockAuthRepository, pero contra la API del backend.
 * Si el servidor no responde, devuelve AuthResultStatus.serverUnavailable.
 */
export class HttpAuthRepository {
  #baseUrl

  constructor(baseUrl) {
    this.#baseUrl = baseUrl.replace(/\/$/, '')
  }

  async #post(path, body) {
    try {
      const response = await fetch(`${this.#baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      return { ok: response.ok, data }
    } catch {
      return { ok: false, data: { status: AuthResultStatus.serverUnavailable } }
    }
  }

  #toResult({ data }) {
    const status = KNOWN_STATUSES.has(data.status)
      ? data.status
      : AuthResultStatus.serverUnavailable
    const user = data.user ? new AppUser(data.user) : null
    return new AuthResult({ status, user })
  }

  async register({ name, email, password }) {
    return this.#toResult(
      await this.#post('/auth/register', { name, email, password, acceptTerms: true }),
    )
  }

  async login({ email, password }) {
    return this.#toResult(await this.#post('/auth/login', { email, password }))
  }

  async requestPasswordReset(email) {
    await this.#post('/auth/forgot-password', { email })
  }
}
