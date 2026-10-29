import { readFile } from 'node:fs/promises'

const sourceExercises = JSON.parse(await readFile(new URL('../src/data/sourceExercises.json', import.meta.url), 'utf8'))
const bySlug = new Map(sourceExercises.map(exercise => [exercise.slug, exercise]))
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const byName = new Map(sourceExercises.map(exercise => [normalize(exercise.name), exercise]))
const legacyImages = {
  squat: 'bodyweight-squat', 'chair-squat': 'box-squat', 'reverse-lunge': 'dumbbell-lunges',
  'glute-bridge': 'glute-bridge', 'calf-raise': 'standing-calf-raises', 'wall-push-up': 'diamond-push-up',
  'incline-push-up': 'diamond-push-up', 'push-up': 'diamond-push-up', plank: 'plank', 'side-plank': 'side-plank',
  'dead-bug': 'dead-bug', 'bird-dog': 'bird-dog', march: 'high-knees', walk: 'treadmill',
  'step-jack': 'jumping-jacks', 'jumping-jack': 'jumping-jacks', 'mountain-climber': 'mountain-climbers',
  'goblet-squat': 'goblet-squats', 'dumbbell-rdl': 'romanian-deadlift', 'dumbbell-row': 'dumbbell-row',
  'dumbbell-press': 'dumbbell-bench-press', 'shoulder-press': 'seated-dumbbell-overhead-shoulder-press',
  'lateral-raise': 'dumbbell-lateral-raises', 'biceps-curl': 'alternating-dumbbell-biceps-curl',
  'triceps-pushdown': 'triceps-pushdown', 'lat-pulldown': 'chest-pulldown', 'seated-row': 'seated-cable-back-rows',
  'leg-press': 'leg-press', 'bench-press': 'barbell-bench-press', 'barbell-squat': 'barbell-squat',
}
const routineCovers = {
  'full-body': 'bodyweight-squat', hypertrophy: 'dumbbell-bench-press', 'fat-loss': 'treadmill', strength: 'barbell-squat',
  'home-starter': 'bodyweight-squat', 'upper-body': 'seated-dumbbell-overhead-shoulder-press', 'lower-body': 'romanian-deadlift',
  'outdoor-active': 'bodyweight-squat', 'core-stability': 'plank', 'legs-glutes-home': 'bodyweight-squat',
  'low-impact-cardio': 'high-knees', 'chest-arms-gym': 'barbell-bench-press', 'back-posture': 'seated-cable-back-rows',
  'full-body-dumbbells': 'goblet-squats',
}

export function getExerciseImage(datasetId, name, legacyId) {
  const exercise = bySlug.get(datasetId) ?? bySlug.get(legacyImages[legacyId]) ?? byName.get(normalize(name))
  return exercise?.imageUrl ?? null
}

export function getSourceExerciseBySlug(slug) { return bySlug.get(slug) ?? null }

export async function getTrainingCatalog(query, userId = null) {
  const result = await query(`SELECT r.id::TEXT AS id, r.nombre AS name,
    n.nombre AS level, r.duracion_estimada_min AS "durationMinutes",
    r.duracion_semanas AS "durationWeeks", r.imagen_url AS image,
    o.nombre AS goal, l.nombre AS location, COALESCE(r.equipo, '{}') AS equipment,
    r.codigo_dataset AS "datasetId"
    ${userId === null ? '' : ', ur.origin AS origin'}
    FROM fittrack.rutinas r
    JOIN fittrack.niveles_dificultad n ON n.id=r.nivel_id
    LEFT JOIN fittrack.objetivos o ON o.id=r.objetivo_id
    LEFT JOIN fittrack.lugares_entrenamiento l ON l.id=r.lugar_entrenamiento_id
    ${userId === null ? '' : 'JOIN public.user_routines ur ON ur.routine_id=r.id AND ur.user_id=$1'}
    WHERE r.activa=TRUE ORDER BY r.id`, userId === null ? [] : [userId])
  const standard = result.rows.map(row => ({ ...row, image: `/images/exercises/${routineCovers[row.datasetId] ?? 'bodyweight-squat'}.jpg` }))
  if (userId === null) return standard
  const custom = await query(`SELECT cr.id, cr.name, cr.description, 'Personalizada' AS level,
    GREATEST(10, COUNT(cre.id)::INTEGER * 8) AS "durationMinutes", 1 AS "durationWeeks",
    'Personalizada' AS goal, 'Personalizada' AS location, '{}'::TEXT[] AS equipment,
    'custom' AS origin, TRUE AS custom,
    COALESCE((SELECT '/images/exercises/' || e.slug || '.jpg' FROM public.user_custom_routine_exercises e
      WHERE e.routine_id=cr.id ORDER BY e.sort_order LIMIT 1), '/images/exercises/bodyweight-squat.jpg') AS image
    FROM public.user_custom_routines cr LEFT JOIN public.user_custom_routine_exercises cre ON cre.routine_id=cr.id
    WHERE cr.user_id=$1 GROUP BY cr.id ORDER BY cr.created_at DESC`, [userId])
  return [...standard, ...custom.rows]
}

export async function getExerciseCatalog(query) {
  const result = await query(`SELECT e.id::TEXT AS id, e.slug_fuente AS slug, e.codigo_dataset AS "legacyId", e.nombre AS name,
    e.descripcion AS description, e.tecnica AS technique,
    g.nombre AS "muscleGroup", n.nombre AS level, e.equipo AS equipment
    FROM fittrack.ejercicios e
    LEFT JOIN fittrack.grupos_musculares g ON g.id=e.grupo_muscular_id
    LEFT JOIN fittrack.niveles_dificultad n ON n.id=e.nivel_id
    WHERE e.activo=TRUE ORDER BY e.nombre, e.id`)
  return result.rows.filter(row => row.slug && bySlug.has(row.slug)).map(row => {
    const source = bySlug.get(row.slug)
    return { ...source, ...row, level: row.level === 'No especificado' ? source.level : row.level,
      muscleGroup: source.group, group: source.group, primaryMuscles: source.primaryMuscles,
      imageUrl: getExerciseImage(row.slug, row.name) }
  })
}
