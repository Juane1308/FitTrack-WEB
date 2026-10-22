import { Router } from 'express'

import { hashPassword, verifyPassword } from './passwords.js'

const PROFILE_GOALS = new Set(['lose_weight', 'gain_muscle', 'stay_fit', 'improve_health'])
const DEFAULT_GOALS = { weeklyWorkouts: 3, targetWeightKg: null, dailyWaterMl: 2000 }
const DEFAULT_SETTINGS = {
  workoutReminders: true,
  reminderTime: null,
  waterReminders: true,
  weeklySummary: true,
  news: false,
  privatePhotos: true,
  shareAnonymousData: false,
}
const SETTING_COLUMNS = {
  workoutReminders: 'workout_reminders',
  waterReminders: 'water_reminders',
  weeklySummary: 'weekly_summary',
  news: 'news',
  privatePhotos: 'private_photos',
  shareAnonymousData: 'share_anonymous_data',
}
const DAY_MS = 86400000

const toNumber = value => value == null ? null : Number(value)
const roundOne = value => Math.round(value * 10) / 10

function isIntegerBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max
}

function validateGoals(body = {}) {
  const weeklyWorkouts = Number(body.weeklyWorkouts)
  const dailyWaterMl = Number(body.dailyWaterMl)
  const targetWeightKg = body.targetWeightKg === null || body.targetWeightKg === '' ? null : Number(body.targetWeightKg)

  if (!PROFILE_GOALS.has(body.goal)
    || !isIntegerBetween(weeklyWorkouts, 1, 14)
    || !isIntegerBetween(dailyWaterMl, 250, 10000)
    || (targetWeightKg !== null && !(Number.isFinite(targetWeightKg) && targetWeightKg >= 25 && targetWeightKg <= 350))) {
    return null
  }
  return { goal: body.goal, weeklyWorkouts, dailyWaterMl, targetWeightKg }
}

function validateSettings(body = {}) {
  const settings = {}
  for (const key of Object.keys(SETTING_COLUMNS)) {
    if (typeof body[key] !== 'boolean') return null
    settings[key] = body[key]
  }
  const reminderTime = body.reminderTime ?? null
  if (reminderTime !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) return null
  return { ...settings, reminderTime }
}

function settingsPayload(row) {
  if (!row) return { ...DEFAULT_SETTINGS }
  const settings = Object.fromEntries(Object.entries(SETTING_COLUMNS).map(([key, column]) => [key, row[column]]))
  return { ...settings, reminderTime: row.reminder_time ? String(row.reminder_time).slice(0, 5) : null }
}

export function weeksSince(createdAt, now = new Date()) {
  return Math.max(1, Math.ceil((now - new Date(createdAt)) / (7 * DAY_MS)))
}

export function createProfileRouter({ query, transaction, authenticate }) {
  const router = Router()

  // Encabezado del perfil: datos de la cuenta y las tres estadísticas del mockup.
  router.get('/me/overview', authenticate, async (request, response, next) => {
    try {
      const result = await query(
        `SELECT u.name, u.email, u.created_at, p.goal, p.weight_kg,
           (SELECT COUNT(*) FROM workout_sessions ws WHERE ws.user_id = u.id AND ws.completed = TRUE)::INTEGER AS workouts,
           (SELECT w.weight_kg FROM weight_logs w WHERE w.user_id = u.id ORDER BY w.logged_on ASC LIMIT 1) AS first_weight,
           (SELECT w.weight_kg FROM weight_logs w WHERE w.user_id = u.id ORDER BY w.logged_on DESC LIMIT 1) AS last_weight
         FROM app_users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = $1`,
        [request.user.id],
      )
      const row = result.rows[0]
      const first = toNumber(row.first_weight)
      const last = toNumber(row.last_weight)
      return response.json({
        name: row.name,
        email: row.email,
        goal: row.goal,
        memberSince: new Date(row.created_at).toISOString(),
        weeks: weeksSince(row.created_at),
        completedWorkouts: row.workouts,
        currentWeightKg: last ?? toNumber(row.weight_kg),
        weightChangeKg: first === null || last === null ? null : roundOne(last - first),
      })
    } catch (error) {
      return next(error)
    }
  })

  router.patch('/me', authenticate, async (request, response, next) => {
    try {
      const name = String(request.body?.name ?? '').trim()
      if (!name || name.length > 150) return response.status(400).json({ status: 'invalidData' })
      await query('UPDATE app_users SET name = $2 WHERE id = $1', [request.user.id, name])
      return response.json({ name })
    } catch (error) {
      return next(error)
    }
  })

  router.get('/me/goals', authenticate, async (request, response, next) => {
    try {
      const result = await query(
        `SELECT p.goal, p.weight_kg, g.weekly_workouts, g.target_weight_kg, g.daily_water_ml
         FROM app_users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         LEFT JOIN user_goals g ON g.user_id = u.id
         WHERE u.id = $1`,
        [request.user.id],
      )
      const row = result.rows[0]
      return response.json({
        goal: row.goal ?? '',
        currentWeightKg: toNumber(row.weight_kg),
        weeklyWorkouts: row.weekly_workouts ?? DEFAULT_GOALS.weeklyWorkouts,
        targetWeightKg: toNumber(row.target_weight_kg),
        dailyWaterMl: row.daily_water_ml ?? DEFAULT_GOALS.dailyWaterMl,
      })
    } catch (error) {
      return next(error)
    }
  })

  router.put('/me/goals', authenticate, async (request, response, next) => {
    try {
      const goals = validateGoals(request.body)
      if (!goals) return response.status(400).json({ status: 'invalidGoalsData' })

      await transaction(async (client) => {
        await client.query(
          `INSERT INTO user_profiles (user_id, goal) VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET goal = EXCLUDED.goal`,
          [request.user.id, goals.goal],
        )
        await client.query(
          `INSERT INTO user_goals (user_id, weekly_workouts, target_weight_kg, daily_water_ml, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id) DO UPDATE SET
             weekly_workouts = EXCLUDED.weekly_workouts,
             target_weight_kg = EXCLUDED.target_weight_kg,
             daily_water_ml = EXCLUDED.daily_water_ml,
             updated_at = NOW()`,
          [request.user.id, goals.weeklyWorkouts, goals.targetWeightKg, goals.dailyWaterMl],
        )
      })
      return response.json(goals)
    } catch (error) {
      return next(error)
    }
  })

  router.get('/me/settings', authenticate, async (request, response, next) => {
    try {
      const result = await query('SELECT * FROM user_settings WHERE user_id = $1', [request.user.id])
      return response.json(settingsPayload(result.rows[0]))
    } catch (error) {
      return next(error)
    }
  })

  router.put('/me/settings', authenticate, async (request, response, next) => {
    try {
      const settings = validateSettings(request.body)
      if (!settings) return response.status(400).json({ status: 'invalidSettingsData' })

      const result = await query(
        `INSERT INTO user_settings (
           user_id, workout_reminders, reminder_time, water_reminders, weekly_summary, news,
           private_photos, share_anonymous_data, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           workout_reminders = EXCLUDED.workout_reminders,
           reminder_time = EXCLUDED.reminder_time,
           water_reminders = EXCLUDED.water_reminders,
           weekly_summary = EXCLUDED.weekly_summary,
           news = EXCLUDED.news,
           private_photos = EXCLUDED.private_photos,
           share_anonymous_data = EXCLUDED.share_anonymous_data,
           updated_at = NOW()
         RETURNING *`,
        [request.user.id, settings.workoutReminders, settings.reminderTime, settings.waterReminders,
          settings.weeklySummary, settings.news, settings.privatePhotos, settings.shareAnonymousData],
      )
      return response.json(settingsPayload(result.rows[0]))
    } catch (error) {
      return next(error)
    }
  })

  // Al cambiar la contraseña se cierran las demás sesiones; la actual sigue abierta.
  router.put('/me/password', authenticate, async (request, response, next) => {
    try {
      const currentPassword = String(request.body?.currentPassword ?? '')
      const newPassword = String(request.body?.newPassword ?? '')
      if (newPassword.length < 8) return response.status(400).json({ status: 'invalidData' })

      const result = await query('SELECT password_hash FROM app_users WHERE id = $1', [request.user.id])
      if (!verifyPassword(currentPassword, result.rows[0]?.password_hash)) {
        return response.status(400).json({ status: 'wrongPassword' })
      }

      await transaction(async (client) => {
        await client.query('UPDATE app_users SET password_hash = $2 WHERE id = $1', [request.user.id, hashPassword(newPassword)])
        await client.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [request.user.id, request.tokenHash])
      })
      return response.json({ status: 'success' })
    } catch (error) {
      return next(error)
    }
  })

  router.get('/help/faqs', async (_request, response, next) => {
    try {
      const result = await query(
        `SELECT id, category, question, answer FROM faqs
         WHERE is_active = TRUE ORDER BY sort_order, id`,
      )
      return response.json({ faqs: result.rows })
    } catch (error) {
      return next(error)
    }
  })

  return router
}
