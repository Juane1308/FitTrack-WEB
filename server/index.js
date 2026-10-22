import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'

import { initializeDatabase, query } from './db.js'

const app = express()
const port = Number(process.env.PORT) || 3000
const clientOrigin = process.env.CLIENT_ORIGIN || true
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

function createId() {
  return crypto.randomUUID()
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${passwordHash}`
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash).split(':')
  if (!salt || !expectedHash) return false

  const actualHash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'))
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    goal: row.goal,
  }
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  await query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [tokenHash, userId],
  )
  return token
}

async function authenticate(request, response, next) {
  try {
    const authorization = request.get('authorization')
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : ''

    if (!token) return response.status(401).json({ message: 'Autenticación requerida' })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const result = await query(
      `SELECT u.id, u.name, u.email, u.goal
       FROM sessions s
       JOIN app_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE`,
      [tokenHash],
    )

    if (!result.rows[0]) return response.status(401).json({ message: 'Sesión inválida o vencida' })
    request.user = result.rows[0]
    return next()
  } catch (error) {
    return next(error)
  }
}

async function getWeeklyData(userId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE ws.completed = TRUE)::INTEGER AS completed_workouts,
       (
         SELECT wg.target_workouts
         FROM weekly_goals wg
         WHERE wg.user_id = $1
           AND wg.week_start = date_trunc('week', CURRENT_DATE)::DATE
       )::INTEGER AS weekly_goal,
       COALESCE(SUM(ws.duration_minutes) FILTER (WHERE ws.completed = TRUE), 0)::INTEGER AS exercise_minutes,
       SUM(ws.calories_burned) FILTER (WHERE ws.completed = TRUE)::INTEGER AS calories
     FROM workout_sessions ws
     WHERE ws.user_id = $1
       AND ws.performed_at >= date_trunc('week', CURRENT_DATE)
       AND ws.performed_at < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'`,
    [userId],
  )

  const datesResult = await query(
    `SELECT DISTINCT performed_at::DATE AS workout_date
     FROM workout_sessions
     WHERE user_id = $1 AND completed = TRUE
     ORDER BY workout_date DESC`,
    [userId],
  )

  let activeStreak = 0
  let expectedDate = new Date()
  expectedDate.setUTCHours(0, 0, 0, 0)

  for (const row of datesResult.rows) {
    const workoutDate = new Date(`${row.workout_date}T00:00:00Z`)
    const difference = Math.round((expectedDate - workoutDate) / 86400000)

    if (difference === 0 || (activeStreak === 0 && difference === 1)) {
      activeStreak += 1
      expectedDate = workoutDate
      continue
    }

    break
  }

  const row = result.rows[0]
  return {
    completedWorkouts: Number(row.completed_workouts ?? 0),
    weeklyGoal: row.weekly_goal == null ? null : Number(row.weekly_goal),
    exerciseMinutes: Number(row.exercise_minutes ?? 0),
    calories: row.calories == null ? null : Number(row.calories),
    activeStreak,
  }
}

app.get('/api/health', async (_request, response) => {
  try {
    await query('SELECT 1')
    return response.json({ status: 'ok', database: 'connected' })
  } catch (_error) {
    return response.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const name = String(request.body?.name ?? '').trim()
    const email = normalizeEmail(request.body?.email)
    const password = String(request.body?.password ?? '')

    if (!name || !email || password.length < 8) {
      return response.status(400).json({ status: 'invalidData' })
    }

    const result = await query(
      `INSERT INTO app_users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, goal`,
      [createId(), name, email, hashPassword(password)],
    )

    return response.status(201).json({ status: 'success', user: publicUser(result.rows[0]) })
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ status: 'emailAlreadyRegistered' })
    return next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const email = normalizeEmail(request.body?.email)
    const password = String(request.body?.password ?? '')
    const result = await query(
      `SELECT id, name, email, goal, password_hash, is_active
       FROM app_users WHERE email = $1`,
      [email],
    )
    const row = result.rows[0]

    if (!row || !verifyPassword(password, row.password_hash)) {
      return response.status(401).json({ status: 'invalidCredentials' })
    }
    if (!row.is_active) return response.status(403).json({ status: 'inactiveAccount' })

    const token = await createSession(row.id)
    return response.json({ status: 'success', token, user: publicUser(row) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/home', authenticate, async (request, response, next) => {
  try {
    const weekly = await getWeeklyData(request.user.id)
    const routineResult = await query(
      `SELECT name, scheduled_for, duration_minutes, difficulty
       FROM routines
       WHERE user_id = $1 AND scheduled_for = CURRENT_DATE
       ORDER BY created_at DESC
       LIMIT 1`,
      [request.user.id],
    )
    const routine = routineResult.rows[0]

    return response.json({
      user: publicUser(request.user),
      weeklyProgress: {
        completedWorkouts: weekly.completedWorkouts,
        weeklyGoal: weekly.weeklyGoal,
      },
      metrics: {
        calories: weekly.calories,
        exerciseMinutes: weekly.exerciseMinutes,
        activeStreak: weekly.activeStreak,
      },
      todayRoutine: routine
        ? {
            name: routine.name,
            date: routine.scheduled_for,
            durationMinutes: routine.duration_minutes,
            difficulty: routine.difficulty,
          }
        : null,
    })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/progress/weekly', authenticate, async (request, response, next) => {
  try {
    const weekly = await getWeeklyData(request.user.id)
    return response.json({
      completedWorkouts: weekly.completedWorkouts,
      weeklyGoal: weekly.weeklyGoal,
    })
  } catch (error) {
    return next(error)
  }
})

app.use(express.static(path.resolve(__dirname, '../dist')))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.resolve(__dirname, '../dist/index.html'))
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(error.code === 'DATABASE_NOT_CONFIGURED' ? 503 : 500).json({
    message: 'No fue posible completar la solicitud',
  })
})

if (process.env.NODE_ENV !== 'test') {
  initializeDatabase()
    .then(() => app.listen(port, () => console.log(`FitTrack API escuchando en el puerto ${port}`)))
    .catch((error) => {
      console.error('No fue posible inicializar PostgreSQL', error)
      process.exitCode = 1
    })
}

export { app }
