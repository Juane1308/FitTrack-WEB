// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { query, transaction } = vi.hoisted(() => {
  const query = vi.fn()
  return { query, transaction: vi.fn(async callback => callback({ query })) }
})
vi.mock('../server/db.js', () => ({ query, transaction, initializeDatabase: vi.fn() }))
import { app } from '../server/index.js'
import { goalProgress } from '../server/progress.js'

let server
let base
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise(resolve => server.close(resolve)))

const session = { rows: [{ id: 'current-user', name: 'Cuenta actual', email: 'yo@fittrack.com' }] }
function respond(handlers) {
  query.mockImplementation(async (sql, params) => {
    if (sql.includes('FROM sessions s')) return session
    for (const [fragment, result] of handlers) if (sql.includes(fragment)) return typeof result === 'function' ? result(params) : result
    return { rows: [], rowCount: 0 }
  })
}
beforeEach(() => { query.mockReset(); transaction.mockClear(); respond([]) })
const headers = { Authorization: 'Bearer test-session', 'Content-Type': 'application/json' }
const send = (path, method, body) => fetch(base + path, { method, headers, body: JSON.stringify(body) })
const jpeg = `data:image/jpeg;base64,${Buffer.from('foto').toString('base64')}`

describe('Progreso: autorización', () => {
  it('rechaza las rutas de progreso sin sesión y sin consultar datos', async () => {
    for (const [path, method] of [['/api/progress', 'GET'], ['/api/progress/weight', 'PUT'],
      ['/api/progress/height', 'PUT'], ['/api/progress/photos', 'POST']]) {
      expect((await fetch(base + path, { method })).status).toBe(401)
    }
    expect(query).not.toHaveBeenCalled()
  })
})

describe('Progreso: resumen', () => {
  it('devuelve historial, cambio de peso, objetivo y fotos de la cuenta de la sesión', async () => {
    respond([
      ['FROM user_profiles p', { rows: [{ weight_kg: '78.50', height_cm: '170.00', target_weight_kg: '75.00' }] }],
      ['FROM weight_logs', { rows: [{ logged_on: '2026-09-01', weight_kg: '84.70' }, { logged_on: '2026-10-01', weight_kg: '78.50' }] }],
      ['FROM progress_photos', { rows: [
        { id: 1, taken_on: '2026-09-01', image_data: Buffer.from('a'), mime_type: 'image/jpeg' },
        { id: 2, taken_on: '2026-10-01', image_data: Buffer.from('b'), mime_type: 'image/jpeg' },
      ] }],
    ])
    const data = await (await fetch(base + '/api/progress', { headers })).json()
    expect(data).toMatchObject({ currentWeightKg: 78.5, startWeightKg: 84.7, weightChangeKg: -6.2, heightCm: 170,
      targetWeightKg: 75, goalProgressPercent: 64 })
    expect(data.history).toEqual([{ date: '2026-09-01', weightKg: 84.7 }, { date: '2026-10-01', weightKg: 78.5 }])
    expect(data.photos.before).toMatchObject({ id: 1, takenOn: '2026-09-01' })
    expect(data.photos.current).toMatchObject({ id: 2, takenOn: '2026-10-01' })
    expect(query.mock.calls.filter(([sql]) => !sql.includes('FROM sessions s')).every(([, params]) => params[0] === 'current-user')).toBe(true)
  })

  it('con una sola foto la muestra como actual y deja vacío el antes', async () => {
    respond([['FROM progress_photos', { rows: [
      { id: 7, taken_on: '2026-10-01', image_data: Buffer.from('a'), mime_type: 'image/jpeg' },
      { id: 7, taken_on: '2026-10-01', image_data: Buffer.from('a'), mime_type: 'image/jpeg' },
    ] }]])
    const data = await (await fetch(base + '/api/progress', { headers })).json()
    expect(data.photos.before).toBeNull()
    expect(data.photos.current).toMatchObject({ id: 7 })
  })

  it('calcula el avance hacia el objetivo al bajar o subir de peso', () => {
    expect(goalProgress(84.7, 78.5, 75)).toBe(64)
    expect(goalProgress(60, 63, 66)).toBe(50)
    expect(goalProgress(80, 82, 75)).toBe(0)
    expect(goalProgress(80, 74, 75)).toBe(100)
    expect(goalProgress(80, 78, null)).toBeNull()
  })
})

describe('Progreso: actualizar peso, estatura y fotos', () => {
  it('guarda el peso en el perfil y en el historial del día', async () => {
    const response = await send('/api/progress/weight', 'PUT', { weightKg: 78.46 })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ weightKg: 78.5 })
    const writes = query.mock.calls.filter(([sql]) => sql.includes('weight_kg') && !sql.includes('FROM sessions s'))
    expect(writes.map(([sql]) => sql.includes('weight_logs') ? 'historial' : 'perfil')).toEqual(['perfil', 'historial'])
    expect(writes.every(([, params]) => params[0] === 'current-user' && params[1] === 78.5)).toBe(true)
  })

  it('rechaza pesos y estaturas fuera de rango sin escribir', async () => {
    expect((await send('/api/progress/weight', 'PUT', { weightKg: 10 })).status).toBe(400)
    expect((await send('/api/progress/height', 'PUT', { heightCm: 300 })).status).toBe(400)
    expect(query.mock.calls.some(([sql]) => sql.includes('UPDATE user_profiles'))).toBe(false)
  })

  it('guarda la estatura en centímetros', async () => {
    const response = await send('/api/progress/height', 'PUT', { heightCm: 170.04 })
    expect(await response.json()).toEqual({ heightCm: 170 })
    expect(query.mock.calls.find(([sql]) => sql.includes('height_cm'))[1]).toEqual(['current-user', 170])
  })

  it('guarda una foto válida y rechaza datos que no son imagen', async () => {
    respond([['INSERT INTO progress_photos', { rows: [{ id: 3, taken_on: '2026-10-23', image_data: Buffer.from('foto'), mime_type: 'image/jpeg' }] }]])
    const created = await send('/api/progress/photos', 'POST', { image: jpeg })
    expect(created.status).toBe(201)
    expect(await created.json()).toEqual({ id: 3, takenOn: '2026-10-23', image: jpeg })
    expect((await send('/api/progress/photos', 'POST', { image: 'no es una imagen' })).status).toBe(400)
  })
})
