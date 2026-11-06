import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getExerciseImage, getSourceExerciseBySlug } from './trainingCatalog.js'

export function createTrainingSessionsRouter({ query, transaction, authenticate, validateRoutineId }) {
  const router = Router()
  const customId = value => String(value ?? '').replace(/^custom:/, '')

  router.get('/routines/:id', async (req, res, next) => {
    try {
      if (req.params.id.startsWith('custom:')) {
        const id = customId(req.params.id)
        const routine = await query('SELECT id,name,description FROM public.user_custom_routines WHERE id=$1', [id])
        if (!routine.rowCount) return res.status(404).json({ message: 'Rutina no disponible' })
        const items = await query(`SELECT exercise_slug AS slug,sort_order AS "order",sets,repetitions,rest_seconds AS "restSeconds"
          FROM public.user_custom_routine_exercises WHERE routine_id=$1 ORDER BY sort_order`, [id])
        const exercises = items.rows.map(item => {
          const source = getSourceExerciseBySlug(item.slug)
          return { id: item.slug, slug: item.slug, name: source.name, technique: source.technique,
            description: source.description, equipment: source.equipment, muscleGroup: source.group,
            primaryMuscle: source.primaryMuscles?.[0] ?? '',
            imageUrl: source.imageUrl, sets: item.sets, repetitions: item.repetitions,
            durationSeconds: null, restSeconds: item.restSeconds, perSide: false }
        })
        return res.json({ routine: { ...routine.rows[0], durationMinutes: Math.max(10, exercises.length * 8),
          level: 'Personalizada', goal: 'Personalizada', muscleGroup: 'Personalizada', exercises } })
      }
      if (!/^[1-9]\d{0,18}$/.test(req.params.id)) return res.status(400).json({ message: 'Identificador de rutina inválido' })
      const routine = await query(`SELECT r.id::TEXT AS id, r.nombre AS name, r.descripcion AS description,
        n.nombre AS level, o.nombre AS goal, r.duracion_estimada_min AS "durationMinutes",
        STRING_AGG(DISTINCT g.nombre, ', ' ORDER BY g.nombre) AS "muscleGroup"
        FROM fittrack.rutinas r JOIN fittrack.niveles_dificultad n ON n.id=r.nivel_id
        LEFT JOIN fittrack.objetivos o ON o.id=r.objetivo_id
        LEFT JOIN fittrack.rutina_grupos_musculares rg ON rg.rutina_id=r.id
        LEFT JOIN fittrack.grupos_musculares g ON g.id=rg.grupo_muscular_id
        WHERE r.id=$1 AND r.activa=TRUE GROUP BY r.id,n.nombre,o.nombre`, [req.params.id])
      if (!routine.rows.length) return res.status(404).json({ message: 'Rutina no disponible' })
      const exercises = await query(`SELECT e.id::TEXT AS id,e.codigo_dataset AS "legacyId",e.nombre AS name,
        e.tecnica AS technique,e.descripcion AS description,e.equipo AS equipment,
        g.nombre AS "muscleGroup",
        re.orden AS "order",re.series AS sets,re.repeticiones AS repetitions,re.duracion_seg AS "durationSeconds",
        re.descanso_seg AS "restSeconds",re.por_lado AS "perSide"
        FROM fittrack.rutina_ejercicios re JOIN fittrack.ejercicios e ON e.id=re.ejercicio_id
        LEFT JOIN fittrack.grupos_musculares g ON g.id=e.grupo_muscular_id
        WHERE re.rutina_id=$1 ORDER BY re.orden,e.id`, [req.params.id])
      return res.json({ routine: { ...routine.rows[0], exercises: exercises.rows.map(exercise => ({
        ...exercise, imageUrl: getExerciseImage(exercise.slug, exercise.name, exercise.legacyId),
      })) } })
    } catch (error) { next(error) }
  })

  router.get('/me/custom-routines', authenticate, async (req, res, next) => {
    try {
      const result = await query(`SELECT cr.id,cr.name,cr.description,
        json_agg(json_build_object('slug',cre.exercise_slug,'sets',cre.sets,'repetitions',cre.repetitions,'restSeconds',cre.rest_seconds) ORDER BY cre.sort_order) AS exercises
        FROM public.user_custom_routines cr JOIN public.user_custom_routine_exercises cre ON cre.routine_id=cr.id
        WHERE cr.user_id=$1 GROUP BY cr.id ORDER BY cr.created_at DESC`, [req.user.id])
      res.json({ routines: result.rows })
    } catch (error) { next(error) }
  })
  router.post('/me/custom-routines', authenticate, async (req, res, next) => {
    const name = String(req.body?.name ?? '').trim()
    const description = String(req.body?.description ?? '').trim().slice(0, 300)
    const exercises = req.body?.exercises
    if (name.length < 2 || name.length > 80 || !Array.isArray(exercises) || !exercises.length || exercises.length > 15) {
      return res.status(400).json({ message: 'Indica un nombre y entre 1 y 15 ejercicios.' })
    }
    const normalized = []
    const seen = new Set()
    for (const item of exercises) {
      const slug = String(item?.slug ?? '')
      const source = getSourceExerciseBySlug(slug)
      const sets = Number(item?.sets), repetitions = Number(item?.repetitions), restSeconds = Number(item?.restSeconds)
      if (!source || seen.has(slug) || !Number.isInteger(sets) || sets < 1 || sets > 10
        || !Number.isInteger(repetitions) || repetitions < 1 || repetitions > 100
        || !Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600) {
        return res.status(400).json({ message: 'Revisa los ejercicios, series, repeticiones y descansos.' })
      }
      seen.add(slug); normalized.push({ slug, sets, repetitions, restSeconds })
    }
    try {
      const id = randomUUID()
      await transaction(async client => {
        await client.query('INSERT INTO public.user_custom_routines(id,user_id,name,description) VALUES($1,$2,$3,$4)', [id, req.user.id, name, description])
        for (let index = 0; index < normalized.length; index++) {
          const item = normalized[index]
          await client.query(`INSERT INTO public.user_custom_routine_exercises(routine_id,exercise_slug,sort_order,sets,repetitions,rest_seconds)
            VALUES($1,$2,$3,$4,$5,$6)`, [id, item.slug, index + 1, item.sets, item.repetitions, item.restSeconds])
        }
      })
      res.status(201).json({ routine: { id, name, description } })
    } catch (error) { next(error) }
  })
  router.delete('/me/custom-routines/:id', authenticate, async (req, res, next) => {
    try {
      const id = customId(req.params.id)
      const active = await query('SELECT 1 FROM workout_sessions WHERE user_id=$1 AND custom_routine_id=$2 AND completed=FALSE', [req.user.id, id])
      if (active.rowCount) return res.status(409).json({ message: 'No puedes eliminar una rutina que está en curso.' })
      await query('DELETE FROM public.user_custom_routines WHERE id=$1 AND user_id=$2', [id, req.user.id])
      res.status(204).end()
    } catch (error) { next(error) }
  })

  router.get('/me/workouts/active', authenticate, async (req, res, next) => {
    try {
      const result = await query(`SELECT id,routine_id::TEXT AS "routineId",custom_routine_id AS "customRoutineId",started_at AS "startedAt"
        FROM workout_sessions WHERE user_id=$1 AND completed=FALSE AND started_at IS NOT NULL`, [req.user.id])
      res.json({ session: result.rows[0] ?? null })
    } catch (error) { next(error) }
  })
  router.post('/me/routines/:id/start', authenticate, async (req, res, next) => {
    try {
      const isCustom = req.params.id.startsWith('custom:')
      const id = isCustom ? customId(req.params.id) : req.params.id
      if (!isCustom && !/^[1-9]\d{0,18}$/.test(id)) return res.status(400).json({ message: 'Identificador de rutina inválido' })
      const result = isCustom
        ? await query(`INSERT INTO workout_sessions(id,user_id,custom_routine_id,started_at,performed_at,completed)
            SELECT $1,$2,cr.id,NOW(),NOW(),FALSE FROM public.user_custom_routines cr
            WHERE cr.id=$3 AND cr.user_id=$2 AND EXISTS(SELECT 1 FROM public.user_custom_routine_exercises WHERE routine_id=cr.id)
            ON CONFLICT (user_id) WHERE completed=FALSE AND started_at IS NOT NULL DO NOTHING
            RETURNING id,custom_routine_id AS "customRoutineId",started_at AS "startedAt"`, [randomUUID(), req.user.id, id])
        : await query(`INSERT INTO workout_sessions(id,user_id,routine_id,started_at,performed_at,completed)
            SELECT $1,$2,r.id,NOW(),NOW(),FALSE FROM fittrack.rutinas r WHERE r.id=$3 AND r.activa=TRUE
            AND EXISTS(SELECT 1 FROM fittrack.rutina_ejercicios re WHERE re.rutina_id=r.id)
            ON CONFLICT (user_id) WHERE completed=FALSE AND started_at IS NOT NULL DO NOTHING
            RETURNING id,routine_id::TEXT AS "routineId",started_at AS "startedAt"`, [randomUUID(), req.user.id, id])
      if (result.rows.length) return res.status(201).json({ session: result.rows[0] })
      const active = await query(`SELECT id,routine_id::TEXT AS "routineId",custom_routine_id AS "customRoutineId",started_at AS "startedAt"
        FROM workout_sessions WHERE user_id=$1 AND completed=FALSE AND started_at IS NOT NULL`, [req.user.id])
      if (active.rows.length) return res.status(409).json({ message: 'Ya tienes una rutina en curso. Retómala antes de comenzar otra.' })
      res.status(404).json({ message: 'Rutina no disponible o sin ejercicios' })
    } catch (error) { next(error) }
  })
  router.post('/me/workouts/:sessionId/finish', authenticate, async (req, res, next) => {
    try {
      const seconds = Number(req.body?.durationSeconds)
      const minutes = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds / 60)) : null
      const result = await query(`UPDATE workout_sessions SET completed=TRUE,performed_at=NOW(),
        duration_minutes=COALESCE($3,GREATEST(0,FLOOR(EXTRACT(EPOCH FROM (NOW()-started_at))/60))::INTEGER)
        WHERE id=$1 AND user_id=$2 AND completed=FALSE AND started_at IS NOT NULL
        RETURNING id,duration_minutes AS "durationMinutes"`, [req.params.sessionId, req.user.id, minutes])
      if (result.rows.length) return res.json({ session: result.rows[0] })
      const previous = await query('SELECT id,duration_minutes AS "durationMinutes" FROM workout_sessions WHERE id=$1 AND user_id=$2 AND completed=TRUE AND started_at IS NOT NULL', [req.params.sessionId, req.user.id])
      if (!previous.rows.length) return res.status(404).json({ message: 'Sesión no encontrada' })
      res.json({ session: previous.rows[0] })
    } catch (error) { next(error) }
  })
  return router
}
