import { Router } from 'express'
import { randomUUID } from 'node:crypto'

export function createTrainingSessionsRouter({ query, authenticate, validateRoutineId }) {
  const router = Router()
  router.get('/routines/:id', validateRoutineId, async (req, res, next) => {
    try {
      const routine = await query(`SELECT r.id::TEXT AS id, r.nombre AS name,
        n.nombre AS level, o.nombre AS goal, r.duracion_estimada_min AS "durationMinutes",
        STRING_AGG(DISTINCT g.nombre, ', ' ORDER BY g.nombre) AS "muscleGroup"
        FROM fittrack.rutinas r JOIN fittrack.niveles_dificultad n ON n.id=r.nivel_id
        LEFT JOIN fittrack.objetivos o ON o.id=r.objetivo_id
        LEFT JOIN fittrack.rutina_grupos_musculares rg ON rg.rutina_id=r.id
        LEFT JOIN fittrack.grupos_musculares g ON g.id=rg.grupo_muscular_id
        WHERE r.id=$1 AND r.activa=TRUE GROUP BY r.id,n.nombre,o.nombre`, [req.params.id])
      if (!routine.rows.length) return res.status(404).json({ message: 'Rutina no disponible' })
      const exercises = await query(`SELECT e.id::TEXT AS id, e.nombre AS name, e.tecnica AS technique,
        re.orden AS "order", re.series AS sets, re.repeticiones AS repetitions,
        re.duracion_seg AS "durationSeconds", re.descanso_seg AS "restSeconds", re.por_lado AS "perSide"
        FROM fittrack.rutina_ejercicios re JOIN fittrack.ejercicios e ON e.id=re.ejercicio_id
        WHERE re.rutina_id=$1 ORDER BY re.orden,e.id`, [req.params.id])
      res.json({ routine: { ...routine.rows[0], exercises: exercises.rows } })
    } catch (error) { next(error) }
  })
  router.get('/me/workouts/active', authenticate, async (req, res, next) => {
    try {
      const result = await query(`SELECT id, routine_id::TEXT AS "routineId", started_at AS "startedAt"
        FROM workout_sessions WHERE user_id=$1 AND completed=FALSE AND started_at IS NOT NULL`, [req.user.id])
      res.json({ session: result.rows[0] ?? null })
    } catch (error) { next(error) }
  })
  router.post('/me/routines/:id/start', authenticate, validateRoutineId, async (req, res, next) => {
    try {
      const result = await query(`INSERT INTO workout_sessions (id,user_id,routine_id,started_at,performed_at,completed)
        SELECT $1,$2,r.id,NOW(),NOW(),FALSE FROM fittrack.rutinas r
        WHERE r.id=$3 AND r.activa=TRUE AND EXISTS
          (SELECT 1 FROM fittrack.rutina_ejercicios re WHERE re.rutina_id=r.id)
        ON CONFLICT (user_id) WHERE completed=FALSE AND started_at IS NOT NULL DO NOTHING
        RETURNING id,routine_id::TEXT AS "routineId",started_at AS "startedAt"`, [randomUUID(), req.user.id, req.params.id])
      if (result.rows.length) return res.status(201).json({ session: result.rows[0] })
      const active = await query(`SELECT id,routine_id::TEXT AS "routineId",started_at AS "startedAt"
        FROM workout_sessions WHERE user_id=$1 AND completed=FALSE AND started_at IS NOT NULL`, [req.user.id])
      if (active.rows.length) return res.status(409).json({ message: 'Ya tienes una rutina en curso. Retómala antes de comenzar otra.' })
      res.status(404).json({ message: 'Rutina no disponible o sin ejercicios' })
    } catch (error) { next(error) }
  })
  router.post('/me/workouts/:sessionId/finish', authenticate, async (req, res, next) => {
    try {
      const result = await query(`UPDATE workout_sessions SET completed=TRUE, performed_at=NOW(),
        duration_minutes=GREATEST(0,FLOOR(EXTRACT(EPOCH FROM (NOW()-started_at))/60))::INTEGER
        WHERE id=$1 AND user_id=$2 AND completed=FALSE AND started_at IS NOT NULL
        RETURNING id,duration_minutes AS "durationMinutes"`, [req.params.sessionId, req.user.id])
      if (result.rows.length) return res.json({ session: result.rows[0] })
      const previous = await query(`SELECT id,duration_minutes AS "durationMinutes" FROM workout_sessions
        WHERE id=$1 AND user_id=$2 AND completed=TRUE AND started_at IS NOT NULL`, [req.params.sessionId, req.user.id])
      if (!previous.rows.length) return res.status(404).json({ message: 'Sesión no encontrada' })
      res.json({ session: previous.rows[0] })
    } catch (error) { next(error) }
  })
  return router
}
