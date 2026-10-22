import { readFile } from 'node:fs/promises'
import { pool } from './db.js'

// Run explicitly; importing the dataset is never part of API startup.
const exercises = JSON.parse(await readFile(new URL('../src/data/exercises.json', import.meta.url)))
const routines = JSON.parse(await readFile(new URL('../src/data/routines.json', import.meta.url)))
if (!pool) throw new Error('Configura DATABASE_URL antes de importar')
const ids = new Set(exercises.map(e => e.id))
if (ids.size !== exercises.length || new Set(routines.map(r => r.id)).size !== routines.length
  || routines.some(r => r.exercises.some(e => !ids.has(e.exerciseId)))) {
  throw new Error('Dataset inválido: identificadores duplicados o referencias inexistentes')
}
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query("SET LOCAL lock_timeout = '10s'")
  await client.query(`
    ALTER TABLE fittrack.ejercicios ADD COLUMN IF NOT EXISTS codigo_dataset TEXT;
    ALTER TABLE fittrack.ejercicios ADD COLUMN IF NOT EXISTS equipo TEXT;
    ALTER TABLE fittrack.rutinas ADD COLUMN IF NOT EXISTS codigo_dataset TEXT;
    ALTER TABLE fittrack.rutinas ADD COLUMN IF NOT EXISTS duracion_semanas SMALLINT;
    ALTER TABLE fittrack.rutinas ADD COLUMN IF NOT EXISTS equipo TEXT[];
    ALTER TABLE fittrack.rutina_ejercicios ADD COLUMN IF NOT EXISTS por_lado BOOLEAN NOT NULL DEFAULT FALSE;
    CREATE UNIQUE INDEX IF NOT EXISTS ejercicios_codigo_dataset_idx ON fittrack.ejercicios(codigo_dataset);
    CREATE UNIQUE INDEX IF NOT EXISTS rutinas_codigo_dataset_idx ON fittrack.rutinas(codigo_dataset);
    LOCK TABLE fittrack.ejercicios, fittrack.rutinas, fittrack.rutina_ejercicios IN SHARE ROW EXCLUSIVE MODE;
  `)
  const lookup = async table => new Map((await client.query(`SELECT nombre, id FROM fittrack.${table}`)).rows.map(r => [r.nombre, r.id]))
  const levels = await lookup('niveles_dificultad')
  const goals = await lookup('objetivos')
  const places = await lookup('lugares_entrenamiento')
  const muscles = await lookup('grupos_musculares')
  const requireId = (map, name) => {
    const id = map.get(name)
    if (id === undefined) throw new Error(`Catálogo auxiliar incompleto: ${name}`)
    return id
  }
  // Existing auxiliary catalog has no separate calf or posterior-chain groups.
  const muscleName = name => ({ Pantorrillas: 'Piernas', 'Cadena posterior': 'Piernas' })[name] ?? name
  const exerciseIds = new Map()
  for (const exercise of exercises) {
    const existing = (await client.query('SELECT id FROM fittrack.ejercicios WHERE codigo_dataset = $1', [exercise.id])).rows[0]
    // Never claim or overwrite an unrelated exercise with the same unique name.
    if (!existing && (await client.query('SELECT 1 FROM fittrack.ejercicios WHERE nombre = $1', [exercise.name])).rowCount) {
      throw new Error(`Ejercicio existente sin vínculo al dataset: ${exercise.name}`)
    }
    const inserted = await client.query(`INSERT INTO fittrack.ejercicios
      (codigo_dataset, nombre, tecnica, grupo_muscular_id, nivel_id, equipo)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (codigo_dataset) DO UPDATE SET nombre=EXCLUDED.nombre, tecnica=EXCLUDED.tecnica,
      grupo_muscular_id=EXCLUDED.grupo_muscular_id, nivel_id=EXCLUDED.nivel_id, equipo=EXCLUDED.equipo RETURNING id`,
    [exercise.id, exercise.name, exercise.technique, requireId(muscles, muscleName(exercise.muscleGroup)), requireId(levels, exercise.level), exercise.equipment])
    exerciseIds.set(exercise.id, inserted.rows[0].id)
  }
  for (const routine of routines) {
    const inserted = await client.query(`INSERT INTO fittrack.rutinas
      (codigo_dataset,nombre,descripcion,objetivo_id,nivel_id,lugar_entrenamiento_id,duracion_estimada_min,duracion_semanas,equipo,imagen_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (codigo_dataset) DO UPDATE SET nombre=EXCLUDED.nombre,descripcion=EXCLUDED.descripcion,
      objetivo_id=EXCLUDED.objetivo_id,nivel_id=EXCLUDED.nivel_id,lugar_entrenamiento_id=EXCLUDED.lugar_entrenamiento_id,
      duracion_estimada_min=EXCLUDED.duracion_estimada_min,duracion_semanas=EXCLUDED.duracion_semanas,equipo=EXCLUDED.equipo,imagen_url=EXCLUDED.imagen_url RETURNING id`,
    [routine.id,routine.name,`Rutina de ${routine.muscleGroup.toLowerCase()}.`,requireId(goals,routine.goal),requireId(levels,routine.level),requireId(places,routine.location === 'Gimnasio' ? 'Gimnasio equipado' : routine.location === 'Aire libre' ? 'Al aire libre' : routine.location),routine.durationMinutes,routine.durationWeeks,routine.equipment,routine.imageKey])
    const id = inserted.rows[0].id
    // Only replace associations belonging to this dataset's routine, inside the transaction.
    await client.query('DELETE FROM fittrack.rutina_ejercicios WHERE rutina_id=$1', [id])
    await client.query('DELETE FROM fittrack.rutina_grupos_musculares WHERE rutina_id=$1', [id])
    const muscleIds = new Set()
    for (const entry of routine.exercises) {
      await client.query(`INSERT INTO fittrack.rutina_ejercicios
        (rutina_id,ejercicio_id,orden,series,repeticiones,duracion_seg,descanso_seg,por_lado)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id,exerciseIds.get(entry.exerciseId),entry.order,entry.sets,entry.repetitions,entry.durationSeconds,entry.restSeconds,entry.perSide])
      muscleIds.add(requireId(muscles,muscleName(exercises.find(e => e.id === entry.exerciseId).muscleGroup)))
    }
    for (const muscleId of muscleIds) await client.query('INSERT INTO fittrack.rutina_grupos_musculares VALUES ($1,$2)', [id,muscleId])
  }
  await client.query('COMMIT')
  console.log(`Dataset importado: ${exercises.length} ejercicios y ${routines.length} rutinas.`)
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Importación revertida:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
