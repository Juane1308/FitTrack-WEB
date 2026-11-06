// @vitest-environment node
import express from 'express'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTrainingSessionsRouter } from '../server/trainingSessions.js'
const query = vi.fn()
let server, base
beforeAll(async () => {
  const app = express()
  app.use(createTrainingSessionsRouter({ query,
    authenticate: (req, res, next) => { if (!req.headers.authorization) return res.sendStatus(401); req.user = { id: 'owner' }; next() },
    validateRoutineId: (req, res, next) => /^\d+$/.test(req.params.id) ? next() : res.sendStatus(400),
  }))
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise(resolve => server.close(resolve)))
beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }) })
const headers = { Authorization: 'Bearer session' }
describe('RF31–RF35: detalle y sesiones', () => {
  it('devuelve ficha y ejercicios de la rutina seleccionada en orden', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: '7', name: 'Fuerza', goal: 'Fuerza', level: 'Avanzado', durationMinutes: 45, muscleGroup: 'Piernas' }] })
      .mockResolvedValueOnce({ rows: [{ id: '2', name: 'Sentadilla', technique: 'Controlar el descenso', sets: 3, repetitions: 10 }] })
    const response = await fetch(base + '/routines/7')
    const { routine } = await response.json()
    expect(routine.exercises[0]).toMatchObject({ sets: 3, repetitions: 10, technique: 'Controlar el descenso' })
    expect(query.mock.calls.every(([, args]) => args[0] === '7')).toBe(true)
    expect(query.mock.calls[1][0]).toContain('ORDER BY re.orden')
  })
  it('rechaza rutinas inexistentes', async () => {
    expect((await fetch(base + '/routines/999')).status).toBe(404)
  })
  it('protege inicio, recuperación y finalización sin sesión', async () => {
    for (const [url, method] of [['/me/workouts/active', 'GET'], ['/me/routines/1/start', 'POST'], ['/me/workouts/id/finish', 'POST']]) {
      expect((await fetch(base + url, { method })).status).toBe(401)
    }
    expect(query).not.toHaveBeenCalled()
  })
  it('inicia usando la cuenta autenticada y evita sesiones activas simultáneas', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'workout', routineId: '7' }] })
    expect((await fetch(base + '/me/routines/7/start', { method: 'POST', headers })).status).toBe(201)
    expect(query.mock.calls[0][1].slice(1)).toEqual(['owner', '7'])
    expect(query.mock.calls[0][0]).toContain('ON CONFLICT (user_id)')
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 'workout', routineId: '7' }] })
    expect((await fetch(base + '/me/routines/8/start', { method: 'POST', headers })).status).toBe(409)
  })
  it('recupera solo la sesión activa del usuario', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'active', routineId: '7' }] })
    const response = await fetch(base + '/me/workouts/active', { headers })
    expect((await response.json()).session.id).toBe('active')
    expect(query.mock.calls[0][1]).toEqual(['owner'])
  })
  it('finaliza atómicamente y un reintento devuelve el mismo registro sin insertar otro', async () => {
    const finished = { id: 'workout', durationMinutes: 20 }
    query.mockResolvedValueOnce({ rows: [finished] })
    const finish = () => fetch(base + '/me/workouts/workout/finish', { method: 'POST', headers })
    expect((await (await finish()).json()).session).toEqual(finished)
    expect(query.mock.calls[0][1]).toEqual(['workout', 'owner'])
    expect(query.mock.calls[0][0]).toContain('completed=FALSE')
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [finished] })
    expect((await (await finish()).json()).session).toEqual(finished)
    expect(query.mock.calls.some(([sql]) => sql.includes('INSERT'))).toBe(false)
  })
  it('no finaliza sesiones ajenas ni inexistentes', async () => {
    expect((await fetch(base + '/me/workouts/other/finish', { method: 'POST', headers })).status).toBe(404)
    expect(query.mock.calls.every(([, args]) => args[1] === 'owner')).toBe(true)
  })
})
