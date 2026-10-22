// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../server/db.js', () => ({ query, initializeDatabase: vi.fn() }))
import { app } from '../server/index.js'

let server
let base
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise(resolve => server.close(resolve)))
beforeEach(() => {
  query.mockReset()
  query.mockImplementation(async sql => sql.includes('FROM sessions s')
    ? { rows: [{ id: 'current-user', name: 'Cuenta actual' }] }
    : { rows: [], rowCount: 0 })
})
const headers = { Authorization: 'Bearer test-session', 'Content-Type': 'application/json' }

describe('Mis rutinas RF30: autorización', () => {
  it('rechaza consultas y modificaciones sin sesión', async () => {
    for (const [path, method] of [['/api/me/routines', 'GET'], ['/api/me/routines/1', 'POST'], ['/api/me/routines/1', 'DELETE']]) {
      expect((await fetch(base + path, { method })).status).toBe(401)
    }
    expect(query).not.toHaveBeenCalled()
  })
  it('consulta exclusivamente la cuenta de la sesión, ignorando un usuario enviado por URL', async () => {
    const result = await fetch(base + '/api/me/routines?userId=other-user', { headers })
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ routines: [] })
    const catalogCall = query.mock.calls.find(([sql]) => sql.includes('JOIN public.user_routines'))
    expect(catalogCall[1]).toEqual(['current-user'])
    expect(catalogCall[0]).toContain('ur.user_id=$1')
  })
  it('valida los identificadores y rechaza rutinas inexistentes', async () => {
    expect((await fetch(base + '/api/me/routines/invalid', { method: 'POST', headers })).status).toBe(400)
    expect((await fetch(base + '/api/me/routines/999', { method: 'POST', headers })).status).toBe(404)
    expect(query.mock.calls.some(([sql]) => sql.includes('INSERT'))).toBe(false)
  })
  it('guarda para la cuenta autenticada sin reemplazar asignaciones ni duplicar filas', async () => {
    query.mockImplementation(async sql => sql.includes('FROM sessions s')
      ? { rows: [{ id: 'current-user' }] }
      : { rows: [{ id: '1' }], rowCount: 1 })
    const result = await fetch(base + '/api/me/routines/1', { method: 'POST', headers, body: JSON.stringify({ userId: 'other-user', origin: 'assigned' }) })
    expect(result.status).toBe(200)
    const insert = query.mock.calls.find(([sql]) => sql.includes('INSERT'))
    expect(insert[1]).toEqual(['current-user', '1'])
    expect(insert[0]).toContain("'saved'")
    expect(insert[0]).toContain('ON CONFLICT (user_id,routine_id) DO NOTHING')
  })
  it('solo permite quitar guardadas de la cuenta autenticada', async () => {
    expect((await fetch(base + '/api/me/routines/1', { method: 'DELETE', headers })).status).toBe(204)
    const deletion = query.mock.calls.find(([sql]) => sql.includes('DELETE'))
    expect(deletion[1]).toEqual(['current-user', '1'])
    expect(deletion[0]).toContain("user_id=$1 AND routine_id=$2 AND origin='saved'")
  })
})
