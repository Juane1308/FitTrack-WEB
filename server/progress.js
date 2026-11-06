import { Router } from 'express'

import { parseImageDataUrl, toDataUrl } from './profile.js'

const toNumber = value => value == null ? null : Number(value)
const roundOne = value => Math.round(value * 10) / 10
const toIsoDate = value => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)

// Porcentaje recorrido entre el peso inicial y el peso objetivo (sirve para bajar o subir de peso).
export function goalProgress(startKg, currentKg, targetKg) {
  if (startKg == null || currentKg == null || targetKg == null) return null
  if (startKg === targetKg) return currentKg === targetKg ? 100 : 0
  const percent = ((startKg - currentKg) / (startKg - targetKg)) * 100
  return Math.round(Math.min(100, Math.max(0, percent)))
}

const photoResponse = row => row && {
  id: Number(row.id),
  takenOn: toIsoDate(row.taken_on),
  image: toDataUrl(row.mime_type, row.image_data),
}

export function createProgressRouter({ query, transaction, authenticate }) {
  const router = Router()

  // Todo lo que muestra la pantalla de Progreso: historial de peso, estatura, objetivo y fotos.
  router.get('/progress', authenticate, async (request, response, next) => {
    try {
      const userId = request.user.id
      const [profile, weights, photos] = await Promise.all([
        query(
          `SELECT p.weight_kg, p.height_cm, g.target_weight_kg
           FROM user_profiles p
           LEFT JOIN user_goals g ON g.user_id = p.user_id
           WHERE p.user_id = $1`,
          [userId],
        ),
        query('SELECT logged_on, weight_kg FROM weight_logs WHERE user_id = $1 ORDER BY logged_on ASC', [userId]),
        query(
          `(SELECT id, taken_on, image_data, mime_type FROM progress_photos
            WHERE user_id = $1 ORDER BY taken_on ASC, id ASC LIMIT 1)
           UNION ALL
           (SELECT id, taken_on, image_data, mime_type FROM progress_photos
            WHERE user_id = $1 ORDER BY taken_on DESC, id DESC LIMIT 1)`,
          [userId],
        ),
      ])

      const row = profile.rows[0] ?? {}
      const history = weights.rows.map(log => ({ date: toIsoDate(log.logged_on), weightKg: toNumber(log.weight_kg) }))
      const startWeightKg = history[0]?.weightKg ?? toNumber(row.weight_kg)
      const currentWeightKg = history.at(-1)?.weightKg ?? toNumber(row.weight_kg)
      const targetWeightKg = toNumber(row.target_weight_kg)
      const [before, current] = photos.rows
      const sameFirstAndLast = before && current && Number(before.id) === Number(current.id)

      return response.json({
        currentWeightKg,
        startWeightKg,
        weightChangeKg: startWeightKg == null || currentWeightKg == null ? null : roundOne(currentWeightKg - startWeightKg),
        heightCm: toNumber(row.height_cm),
        targetWeightKg,
        goalProgressPercent: goalProgress(startWeightKg, currentWeightKg, targetWeightKg),
        history,
        photos: {
          before: sameFirstAndLast ? null : photoResponse(before),
          current: photoResponse(current ?? before),
        },
      })
    } catch (error) {
      return next(error)
    }
  })

  // Actualizar peso: queda en el perfil y como registro del día en el historial.
  router.put('/progress/weight', authenticate, async (request, response, next) => {
    try {
      const weightKg = Number(request.body?.weightKg)
      if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 350) {
        return response.status(400).json({ status: 'invalidWeight' })
      }
      const rounded = roundOne(weightKg)
      await transaction(async (client) => {
        await client.query('UPDATE user_profiles SET weight_kg = $2 WHERE user_id = $1', [request.user.id, rounded])
        await client.query(
          `INSERT INTO weight_logs (user_id, logged_on, weight_kg) VALUES ($1, CURRENT_DATE, $2)
           ON CONFLICT (user_id, logged_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg`,
          [request.user.id, rounded],
        )
      })
      return response.json({ weightKg: rounded })
    } catch (error) {
      return next(error)
    }
  })

  router.put('/progress/height', authenticate, async (request, response, next) => {
    try {
      const heightCm = Number(request.body?.heightCm)
      if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
        return response.status(400).json({ status: 'invalidHeight' })
      }
      const rounded = roundOne(heightCm)
      await query('UPDATE user_profiles SET height_cm = $2 WHERE user_id = $1', [request.user.id, rounded])
      return response.json({ heightCm: rounded })
    } catch (error) {
      return next(error)
    }
  })

  // Foto de progreso: llega recortada y comprimida por el navegador, igual que la foto de perfil.
  router.post('/progress/photos', authenticate, async (request, response, next) => {
    try {
      const image = parseImageDataUrl(request.body?.image)
      if (!image) return response.status(400).json({ status: 'invalidImage' })
      const result = await query(
        `INSERT INTO progress_photos (user_id, image_data, mime_type)
         VALUES ($1, $2, $3)
         RETURNING id, taken_on, image_data, mime_type`,
        [request.user.id, image.data, image.mimeType],
      )
      return response.status(201).json(photoResponse(result.rows[0]))
    } catch (error) {
      return next(error)
    }
  })

  return router
}
