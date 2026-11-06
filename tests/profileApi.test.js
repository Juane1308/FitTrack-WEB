// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { query, transaction } = vi.hoisted(() => {
  const query = vi.fn()
  return { query, transaction: vi.fn(async callback => callback({ query })) }
})
vi.mock('../server/db.js', () => ({ query, transaction, initializeDatabase: vi.fn() }))
import { app } from '../server/index.js'
import { hashPassword } from '../server/passwords.js'
import { weeksSince } from '../server/profile.js'

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

describe('Perfil: autorización', () => {
  it('rechaza las rutas del perfil sin sesión y sin consultar datos', async () => {
    for (const [path, method] of [['/api/me/overview', 'GET'], ['/api/me', 'PATCH'], ['/api/me/goals', 'GET'],
      ['/api/me/goals', 'PUT'], ['/api/me/settings', 'GET'], ['/api/me/settings', 'PUT'], ['/api/me/password', 'PUT']]) {
      expect((await fetch(base + path, { method })).status).toBe(401)
    }
    expect(query).not.toHaveBeenCalled()
  })
})

describe('Perfil: resumen', () => {
  it('calcula semanas, entrenamientos y cambio de peso de la cuenta de la sesión', async () => {
    respond([['FROM app_users u', { rows: [{ name: 'Ana', email: 'ana@x.co', goal: 'lose_weight', weight_kg: '78.50',
      created_at: new Date(Date.now() - 15 * 86400000), workouts: 12, first_weight: '84.70', last_weight: '78.50' }] }]])
    const data = await (await fetch(base + '/api/me/overview', { headers })).json()
    expect(data).toMatchObject({ name: 'Ana', weeks: 3, completedWorkouts: 12, currentWeightKg: 78.5, weightChangeKg: -6.2 })
    expect(query.mock.calls.find(([sql]) => sql.includes('FROM app_users u'))[1]).toEqual(['current-user'])
  })

  it('cuenta al menos una semana desde el registro', () => {
    expect(weeksSince(new Date())).toBe(1)
    expect(weeksSince(new Date('2026-01-01'), new Date('2026-01-15'))).toBe(2)
  })
})

describe('Perfil: objetivos', () => {
  it('devuelve valores por defecto si aún no hay metas guardadas', async () => {
    respond([['LEFT JOIN user_goals', { rows: [{ goal: 'stay_fit', weight_kg: '70.00' }] }]])
    expect(await (await fetch(base + '/api/me/goals', { headers })).json())
      .toEqual({ goal: 'stay_fit', currentWeightKg: 70, weeklyWorkouts: 3, targetWeightKg: null, dailyWaterMl: 2000 })
  })

  it('valida y guarda objetivo y metas en una transacción', async () => {
    expect((await send('/api/me/goals', 'PUT', { goal: 'otro', weeklyWorkouts: 3, dailyWaterMl: 2000 })).status).toBe(400)
    expect((await send('/api/me/goals', 'PUT', { goal: 'stay_fit', weeklyWorkouts: 20, dailyWaterMl: 2000 })).status).toBe(400)
    expect(transaction).not.toHaveBeenCalled()

    const response = await send('/api/me/goals', 'PUT', { goal: 'gain_muscle', weeklyWorkouts: 5, targetWeightKg: 72, dailyWaterMl: 2500, userId: 'otro' })
    expect(response.status).toBe(200)
    const goalsInsert = query.mock.calls.find(([sql]) => sql.includes('INSERT INTO user_goals'))
    expect(goalsInsert[1]).toEqual(['current-user', 5, 72, 2500])
    expect(query.mock.calls.find(([sql]) => sql.includes('INSERT INTO user_profiles'))[1]).toEqual(['current-user', 'gain_muscle'])
  })
})

describe('Perfil: configuración y contraseña', () => {
  it('rechaza configuraciones incompletas o con hora inválida', async () => {
    const valid = { workoutReminders: true, reminderTime: '07:30', waterReminders: true, weeklySummary: false, news: false, privatePhotos: true, shareAnonymousData: false }
    expect((await send('/api/me/settings', 'PUT', { ...valid, news: 'si' })).status).toBe(400)
    expect((await send('/api/me/settings', 'PUT', { ...valid, reminderTime: '25:00' })).status).toBe(400)
    respond([['INSERT INTO user_settings', { rows: [{ workout_reminders: true, reminder_time: '07:30:00', water_reminders: true,
      weekly_summary: false, news: false, private_photos: true, share_anonymous_data: false }] }]])
    expect(await (await send('/api/me/settings', 'PUT', valid)).json()).toEqual(valid)
  })

  it('exige la contraseña actual y cierra las demás sesiones al cambiarla', async () => {
    respond([['SELECT password_hash', { rows: [{ password_hash: hashPassword('ClaveActual123') }] }]])
    const wrong = await send('/api/me/password', 'PUT', { currentPassword: 'mala', newPassword: 'NuevaClave123' })
    expect(await wrong.json()).toEqual({ status: 'wrongPassword' })
    expect(transaction).not.toHaveBeenCalled()

    expect((await send('/api/me/password', 'PUT', { currentPassword: 'ClaveActual123', newPassword: 'NuevaClave123' })).status).toBe(200)
    const closeOthers = query.mock.calls.find(([sql]) => sql.includes('DELETE FROM sessions'))
    expect(closeOthers[0]).toContain('token_hash <> $2')
    expect(closeOthers[1][0]).toBe('current-user')
  })

  it('cerrar sesión borra solo la sesión actual', async () => {
    expect((await send('/api/auth/logout', 'POST')).status).toBe(204)
    const deletion = query.mock.calls.find(([sql]) => sql.includes('DELETE FROM sessions'))
    expect(deletion[1]).toHaveLength(1)
  })
})

describe('Ayuda y alimentación', () => {
  it('lista las preguntas frecuentes sin necesitar sesión', async () => {
    respond([['FROM faqs', { rows: [{ id: 'a', category: 'Cuenta', question: '¿?', answer: 'Sí' }] }]])
    expect(await (await fetch(base + '/api/help/faqs')).json()).toEqual({ faqs: [{ id: 'a', category: 'Cuenta', question: '¿?', answer: 'Sí' }] })
  })

  it('arma el catálogo de alimentos por categoría desde la BD', async () => {
    respond([
      ['FROM nutrition_catalogs', { rows: [{ source: 'USDA', source_url: 'https://fdc', note: null }] }],
      ['FROM food_categories', { rows: [{ id: 'proteins', name: 'Proteínas', description: 'd', image: 'foods/p.jpg', source: 'USDA' }] }],
      ['FROM foods', { rows: [{ id: 'p-1', category_id: 'proteins', name: 'Pollo', calories: '165.00', protein: '31.00', carbs: '0.00',
        fat: '3.60', fiber: null, serving: '100 g', image: 'foods/p-1.jpg', image_source: null }] }],
    ])
    const data = await (await fetch(base + '/api/nutrition/foods')).json()
    expect(data.sourceUrl).toBe('https://fdc')
    expect(data.categories[0].items[0]).toMatchObject({ name: 'Pollo', calories: 165, fat: 3.6, fiber: null })
  })
})
