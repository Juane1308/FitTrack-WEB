import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'

import { initializeDatabase, query, transaction } from './db.js'
import { getFoodCatalog, getRecipeCatalog } from './nutritionCatalog.js'
import { hashPassword, hashToken, verifyPassword } from './passwords.js'
import { createProfileRouter } from './profile.js'
import { createProgressRouter } from './progress.js'
import { getExerciseCatalog, getTrainingCatalog } from './trainingCatalog.js'
import { createTrainingSessionsRouter } from './trainingSessions.js'
import { answerChatMessage } from './chatbot.js'

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

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    goal: row.goal,
    profileCompleted: Boolean(row.profile_completed),
  }
}

const profileGoals = new Set(['lose_weight', 'gain_muscle', 'stay_fit', 'improve_health'])
const activityLevels = new Set(['sedentary', 'light', 'moderate', 'active'])
const trainingLocations = new Set(['home', 'outdoors', 'gym'])
const profileArrayFields = ['injuries', 'jointPains', 'surgeries', 'chronicConditions', 'allergies']

function profileIsComplete(profile) {
  if (!profile) return false
  const requiredFields = [
    'goal', 'birth_date', 'weight_kg', 'height_cm', 'sport_experience',
    'training_location', 'injuries', 'joint_pains', 'surgeries', 'chronic_conditions', 'allergies',
  ]
  return profileGoals.has(profile.goal)
    && activityLevels.has(profile.sport_experience)
    && trainingLocations.has(profile.training_location)
    && requiredFields.every((field) => profile[field] !== null && profile[field] !== undefined)
}

// pg devuelve las columnas DATE como Date en hora local; se formatean como YYYY-MM-DD.
function formatDate(value) {
  if (!(value instanceof Date)) return String(value).slice(0, 10)
  const pad = (number) => String(number).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function profilePayload(row) {
  return {
    goal: row.goal ?? '',
    birthDate: row.birth_date ? formatDate(row.birth_date) : '',
    weightKg: row.weight_kg == null ? '' : Number(row.weight_kg),
    heightCm: row.height_cm == null ? '' : Number(row.height_cm),
    sportExperience: row.sport_experience ?? '',
    trainingLocation: row.training_location ?? '',
    injuries: row.injuries ?? null,
    jointPains: row.joint_pains ?? null,
    surgeries: row.surgeries ?? null,
    chronicConditions: row.chronic_conditions ?? null,
    allergies: row.allergies ?? null,
  }
}

function normalizeProfileList(value) {
  if (!Array.isArray(value) || value.length > 20) return null
  if (value.some((item) => typeof item !== 'string' || item.trim().length === 0 || item.trim().length > 100)) {
    return null
  }
  return [...new Set(value.map((item) => item.trim()))]
}

function validateProfile(body = {}) {
  const arrays = Object.fromEntries(profileArrayFields.map((field) => [field, normalizeProfileList(body[field])]))
  const birthDate = typeof body.birthDate === 'string' ? body.birthDate : ''
  const weightKg = Number(body.weightKg)
  const heightCm = Number(body.heightCm)
  const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
    && !Number.isNaN(Date.parse(`${birthDate}T00:00:00Z`))
    && new Date(`${birthDate}T00:00:00Z`).toISOString().slice(0, 10) === birthDate
    && birthDate <= new Date().toISOString().slice(0, 10)

  if (!profileGoals.has(body.goal)
      || !dateIsValid
      || !Number.isFinite(weightKg) || weightKg < 25 || weightKg > 350
      || !Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250
      || !activityLevels.has(body.sportExperience)
      || !trainingLocations.has(body.trainingLocation)
      || Object.values(arrays).some((items) => items === null)) return null

  return {
    goal: body.goal,
    birthDate,
    weightKg,
    heightCm,
    sportExperience: body.sportExperience,
    trainingLocation: body.trainingLocation,
    ...arrays,
  }
}

// Guarda el peso del día en el historial; si ya hay uno hoy, lo reemplaza.
function logWeight(client, userId, weightKg) {
  return client.query(
    `INSERT INTO weight_logs (user_id, logged_on, weight_kg) VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (user_id, logged_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg`,
    [userId, weightKg],
  )
}

async function createSession(userId, connection = null) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const runQuery = connection ? connection.query.bind(connection) : query
  await runQuery(
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

    const tokenHash = hashToken(token)
    const result = await query(
      `SELECT u.id, u.name, u.email, p.*
       FROM sessions s
       JOIN app_users u ON u.id = s.user_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE`,
      [tokenHash],
    )

    if (!result.rows[0]) return response.status(401).json({ message: 'Sesión inválida o vencida' })
    request.user = { ...result.rows[0], profile_completed: profileIsComplete(result.rows[0]) }
    request.tokenHash = tokenHash
    return next()
  } catch (error) {
    return next(error)
  }
}

async function getWeeklyData(userId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE ws.completed = TRUE)::INTEGER AS completed_workouts,
       COALESCE(
         (
           SELECT wg.target_workouts
           FROM weekly_goals wg
           WHERE wg.user_id = $1
             AND wg.week_start = date_trunc('week', CURRENT_DATE)::DATE
         ),
         (SELECT ug.weekly_workouts FROM user_goals ug WHERE ug.user_id = $1)
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

  const activityResult = await query(
    `SELECT
       activity_date::DATE AS activity_date,
       COALESCE(SUM(ws.duration_minutes) FILTER (WHERE ws.completed = TRUE), 0)::INTEGER AS exercise_minutes,
       COALESCE(SUM(ws.calories_burned) FILTER (WHERE ws.completed = TRUE), 0)::INTEGER AS calories,
       COUNT(ws.id) FILTER (WHERE ws.completed = TRUE)::INTEGER AS completed_workouts
     FROM generate_series(
       date_trunc('week', CURRENT_DATE),
       date_trunc('week', CURRENT_DATE) + INTERVAL '6 days',
       INTERVAL '1 day'
     ) AS days(activity_date)
     LEFT JOIN workout_sessions ws
       ON ws.user_id = $1
       AND ws.performed_at >= days.activity_date
       AND ws.performed_at < days.activity_date + INTERVAL '1 day'
     GROUP BY days.activity_date
     ORDER BY days.activity_date`,
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
    weeklyActivity: activityResult.rows.map(activity => ({
      date: activity.activity_date,
      exerciseMinutes: Number(activity.exercise_minutes ?? 0),
      calories: Number(activity.calories ?? 0),
      completedWorkouts: Number(activity.completed_workouts ?? 0),
    })),
  }
}

function serializeHomeRoutine(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    date: row.scheduled_for ?? null,
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
    difficulty: row.difficulty ?? null,
    origin: row.origin ?? 'scheduled',
    completed: Boolean(row.completed),
  }
}

async function getHomeRoutine(userId) {
  const scheduledResult = await query(
    `SELECT
       id::TEXT AS id,
       name,
       scheduled_for,
       duration_minutes,
       difficulty,
       'scheduled' AS origin,
       EXISTS (
         SELECT 1
         FROM workout_sessions ws
         WHERE ws.user_id = $1
           AND ws.routine_id::TEXT = routines.id
           AND ws.completed = TRUE
           AND ws.performed_at::DATE = CURRENT_DATE
       ) AS completed
     FROM routines
     WHERE user_id = $1 AND scheduled_for = CURRENT_DATE
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  )

  if (scheduledResult.rows[0]) return serializeHomeRoutine(scheduledResult.rows[0])

  const catalogResult = await query(
    `SELECT
       r.id::TEXT AS id,
       r.nombre AS name,
       NULL::DATE AS scheduled_for,
       r.duracion_estimada_min AS duration_minutes,
       n.nombre AS difficulty,
       ur.origin,
       EXISTS (
         SELECT 1
         FROM workout_sessions ws
         WHERE ws.user_id = $1
           AND ws.routine_id::TEXT = r.id::TEXT
           AND ws.completed = TRUE
           AND ws.performed_at::DATE = CURRENT_DATE
       ) AS completed
     FROM public.user_routines ur
     JOIN fittrack.rutinas r ON r.id = ur.routine_id
     LEFT JOIN fittrack.niveles_dificultad n ON n.id = r.nivel_id
     WHERE ur.user_id = $1 AND r.activa = TRUE
     ORDER BY CASE WHEN ur.origin = 'assigned' THEN 0 ELSE 1 END, ur.created_at DESC
     LIMIT 1`,
    [userId],
  )

  return serializeHomeRoutine(catalogResult.rows[0])
}

async function getRoutineSummary(userId) {
  const result = await query(
    `SELECT
       COUNT(*)::INTEGER AS total,
       COUNT(*) FILTER (WHERE ur.origin = 'assigned')::INTEGER AS assigned,
       COUNT(*) FILTER (WHERE ur.origin = 'saved')::INTEGER AS saved
     FROM public.user_routines ur
     JOIN fittrack.rutinas r ON r.id = ur.routine_id
     WHERE ur.user_id = $1 AND r.activa = TRUE`,
    [userId],
  )

  const row = result.rows[0] ?? {}
  return {
    total: Number(row.total ?? 0),
    assigned: Number(row.assigned ?? 0),
    saved: Number(row.saved ?? 0),
  }
}

async function getHomeBackground() {
  const result = await query(
    `SELECT mime_type, encode(image_data, 'base64') AS image_base64
     FROM app_media
     WHERE media_key = 'home-background'`,
  )
  const row = result.rows[0]
  return row ? `data:${row.mime_type};base64,${row.image_base64}` : null
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
    const profile = validateProfile(request.body?.profile)

    if (!name || !email || password.length < 8) {
      return response.status(400).json({ status: 'invalidData' })
    }
    if (!profile) return response.status(400).json({ status: 'invalidProfileData' })

    const user = await transaction(async (client) => {
      const createdUser = await client.query(
        `INSERT INTO app_users (id, name, email, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email`,
        [createId(), name, email, hashPassword(password)],
      )
      const created = createdUser.rows[0]
      await client.query(
        `INSERT INTO user_profiles (
           user_id, goal, birth_date, weight_kg, height_cm, sport_experience, training_location,
           injuries, joint_pains, surgeries, chronic_conditions, allergies
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [created.id, profile.goal, profile.birthDate, profile.weightKg, profile.heightCm,
          profile.sportExperience, profile.trainingLocation, profile.injuries, profile.jointPains,
          profile.surgeries, profile.chronicConditions, profile.allergies],
      )
      await logWeight(client, created.id, profile.weightKg)
      return { ...created, goal: profile.goal, profile_completed: true }
    })

    return response.status(201).json({
      status: 'success',
      user: publicUser(user),
    })
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
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, p.*
       FROM app_users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email],
    )
    const row = result.rows[0]

    if (!row || !verifyPassword(password, row.password_hash)) {
      return response.status(401).json({ status: 'invalidCredentials' })
    }
    if (!row.is_active) return response.status(403).json({ status: 'inactiveAccount' })

    row.profile_completed = profileIsComplete(row)
    const token = await createSession(row.id)
    return response.json({ status: 'success', token, user: publicUser(row) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/auth/logout', authenticate, async (request, response, next) => {
  try {
    await query('DELETE FROM sessions WHERE token_hash = $1', [request.tokenHash])
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

app.get('/api/profile', authenticate, async (request, response, next) => {
  try {
    await query('INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [request.user.id])
    const result = await query('SELECT * FROM user_profiles WHERE user_id = $1', [request.user.id])
    const savedProfile = result.rows[0]
    return response.json({ ...profilePayload(savedProfile), profileCompleted: profileIsComplete(savedProfile) })
  } catch (error) {
    return next(error)
  }
})

app.put('/api/profile', authenticate, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const profile = validateProfile(body)
    if (!profile) return response.status(400).json({ status: 'invalidProfileData' })

    const result = await transaction(async (client) => {
      const saved = await client.query(
        `INSERT INTO user_profiles (
           user_id, goal, birth_date, weight_kg, height_cm, sport_experience, training_location,
           injuries, joint_pains, surgeries, chronic_conditions, allergies
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id) DO UPDATE SET
           goal = EXCLUDED.goal,
           birth_date = EXCLUDED.birth_date,
           weight_kg = EXCLUDED.weight_kg,
           height_cm = EXCLUDED.height_cm,
           sport_experience = EXCLUDED.sport_experience,
           training_location = EXCLUDED.training_location,
           injuries = EXCLUDED.injuries,
           joint_pains = EXCLUDED.joint_pains,
           surgeries = EXCLUDED.surgeries,
           chronic_conditions = EXCLUDED.chronic_conditions,
           allergies = EXCLUDED.allergies
         RETURNING *`,
        [
          request.user.id,
          profile.goal,
          profile.birthDate,
          profile.weightKg,
          profile.heightCm,
          profile.sportExperience,
          profile.trainingLocation,
          profile.injuries,
          profile.jointPains,
          profile.surgeries,
          profile.chronicConditions,
          profile.allergies,
        ],
      )
      await logWeight(client, request.user.id, profile.weightKg)
      return saved
    })
    const savedProfile = result.rows[0]
    return response.json({ ...profilePayload(savedProfile), profileCompleted: profileIsComplete(savedProfile) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/home', authenticate, async (request, response, next) => {
  try {
    const weekly = await getWeeklyData(request.user.id)
    const [todayRoutine, routineSummary, homeBackground] = await Promise.all([
      getHomeRoutine(request.user.id),
      getRoutineSummary(request.user.id),
      getHomeBackground(),
    ])

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
      todayRoutine,
      routineSummary,
      weeklyActivity: weekly.weeklyActivity,
      homeBackground,
    })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/me/workouts', authenticate, async (request, response, next) => {
  try {
    const routineId = request.body?.routineId == null ? null : String(request.body.routineId).trim()
    const routineDbId = routineId && /^\d+$/.test(routineId) ? routineId : null
    const durationMinutes = Number(request.body?.durationMinutes ?? 0)
    const rawCalories = request.body?.caloriesBurned
    const caloriesBurned = rawCalories == null || rawCalories === '' ? null : Number(rawCalories)

    if (routineId && routineId.length > 100) {
      return response.status(400).json({ message: 'Rutina inválida' })
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 0 || durationMinutes > 1440) {
      return response.status(400).json({ message: 'Duración inválida' })
    }
    if (caloriesBurned != null && (!Number.isInteger(caloriesBurned) || caloriesBurned < 0)) {
      return response.status(400).json({ message: 'Calorías inválidas' })
    }

    await query(
      `INSERT INTO workout_sessions
        (id, user_id, routine_id, performed_at, duration_minutes, calories_burned, completed)
       VALUES ($1, $2, $3::BIGINT, NOW(), $4, $5, TRUE)`,
      [createId(), request.user.id, routineDbId, durationMinutes, caloriesBurned],
    )

    return response.status(201).json({ status: 'completed' })
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

// General catalog contains no personal information and is also used by the local preview.
app.get('/api/routines', async (_request, response, next) => {
  try {
    response.json({ routines: await getTrainingCatalog(query) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/me/routines', authenticate, async (request, response, next) => {
  try {
    response.json({ routines: await getTrainingCatalog(query, request.user.id) })
  } catch (error) { next(error) }
})

function validateRoutineId(request, response, next) {
  if (!/^[1-9]\d{0,18}$/.test(request.params.id)
    || BigInt(request.params.id) > 9223372036854775807n) {
    return response.status(400).json({ message: 'Identificador de rutina inválido' })
  }
  next()
}

app.post('/api/me/routines/:id', authenticate, validateRoutineId, async (request, response, next) => {
  try {
    const routine = await query('SELECT id FROM fittrack.rutinas WHERE id=$1 AND activa=TRUE', [request.params.id])
    if (!routine.rowCount) return response.status(404).json({ message: 'Rutina no disponible' })
    await query(`INSERT INTO public.user_routines (user_id,routine_id,origin)
      VALUES ($1,$2,'saved') ON CONFLICT (user_id,routine_id) DO NOTHING`, [request.user.id,request.params.id])
    response.json({ status: 'saved' })
  } catch (error) { next(error) }
})

app.delete('/api/me/routines/:id', authenticate, validateRoutineId, async (request, response, next) => {
  try {
    await query(`DELETE FROM public.user_routines WHERE user_id=$1 AND routine_id=$2 AND origin='saved'`, [request.user.id,request.params.id])
    response.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/exercises', async (_request, response, next) => {
  try {
    response.json({ exercises: await getExerciseCatalog(query) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/nutrition/foods', async (_request, response, next) => {
  try {
    response.json(await getFoodCatalog(query))
  } catch (error) {
    next(error)
  }
})

app.get('/api/nutrition/recipes', async (_request, response, next) => {
  try {
    response.json(await getRecipeCatalog(query))
  } catch (error) {
    next(error)
  }
})

app.post('/api/chat', authenticate, async (request, response, next) => {
  try {
    const result = await answerChatMessage(query, request.body?.message, request.user)
    return response.json(result)
  } catch (error) {
    return next(error)
  }
})

app.use('/api', createTrainingSessionsRouter({ query, transaction, authenticate, validateRoutineId }))
app.use('/api', createProfileRouter({ query, transaction, authenticate }))
app.use('/api', createProgressRouter({ query, transaction, authenticate }))

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
