import { readFile } from 'node:fs/promises'
import { pool } from './db.js'

// This command is intentionally separate from API startup. It can be rerun safely.
const exercises = JSON.parse(await readFile(new URL('../src/data/sourceExercises.json', import.meta.url), 'utf8'))
if (!pool) throw new Error('Configura DATABASE_URL antes de importar')
if (!Array.isArray(exercises) || !exercises.length || exercises.some(exercise => !exercise.slug || !exercise.name || !exercise.instructions?.length)) {
  throw new Error('Dataset inválido: se requieren ejercicios identificados, nombrados y con instrucciones.')
}
if (new Set(exercises.map(exercise => exercise.slug)).size !== exercises.length) throw new Error('Dataset inválido: hay slugs duplicados.')

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query("SET LOCAL lock_timeout = '10s'")
  await client.query(`
    ALTER TABLE fittrack.ejercicios
      ADD COLUMN IF NOT EXISTS slug_fuente TEXT,
      ADD COLUMN IF NOT EXISTS grupo_fuente TEXT,
      ADD COLUMN IF NOT EXISTS categoria_muscular TEXT,
      ADD COLUMN IF NOT EXISTS musculos_primarios TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS musculos_secundarios TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS instrucciones TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS errores_comunes TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS alternativas TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS imagen_url TEXT,
      ADD COLUMN IF NOT EXISTS imagen_masculina_url TEXT,
      ADD COLUMN IF NOT EXISTS imagen_femenina_url TEXT,
      ADD COLUMN IF NOT EXISTS mapa_muscular_url TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS ejercicios_slug_fuente_idx ON fittrack.ejercicios(slug_fuente);
    LOCK TABLE fittrack.ejercicios IN SHARE ROW EXCLUSIVE MODE;
  `)
  await client.query(`INSERT INTO fittrack.niveles_dificultad (nombre)
    SELECT 'No especificado' WHERE NOT EXISTS
      (SELECT 1 FROM fittrack.niveles_dificultad WHERE nombre='No especificado')`)

  const lookup = async table => new Map((await client.query(`SELECT nombre,id FROM fittrack.${table}`)).rows.map(row => [row.nombre, row.id]))
  const levels = await lookup('niveles_dificultad')
  const muscles = await lookup('grupos_musculares')
  const noLevelId = levels.get('No especificado')
  if (!noLevelId) throw new Error('No se pudo preparar el nivel «No especificado».')

  function muscleId(exercise) {
    const category = exercise.muscleCategory
    const groupByCategory = {
      biceps: 'Bíceps', triceps: 'Tríceps', hombros: 'Hombros', espalda: 'Espalda',
      pecho: 'Pecho', pierna: 'Piernas', abdomen: 'Abdomen', general: 'Cuerpo completo',
    }[category]
    const groupAliases = {
      Cardio: ['Cuerpo completo', 'Piernas'],
      Core: ['Abdomen'],
      Brazos: [groupByCategory, 'Bíceps', 'Tríceps', 'Cuerpo completo'],
      Piernas: ['Piernas', 'Pierna'],
    }
    const candidates = [...(groupAliases[exercise.group] ?? [exercise.group]), groupByCategory, 'Cuerpo completo'].filter(Boolean)
    const match = candidates.find(name => muscles.has(name))
    if (!match) throw new Error(`No existe un grupo muscular compatible con ${exercise.name} (${exercise.group}).`)
    return muscles.get(match)
  }

  for (const exercise of exercises) {
    const bySlug = (await client.query('SELECT id FROM fittrack.ejercicios WHERE slug_fuente=$1', [exercise.slug])).rows[0]
    const byName = bySlug ?? (await client.query('SELECT id FROM fittrack.ejercicios WHERE nombre=$1 ORDER BY id LIMIT 1', [exercise.name])).rows[0]
    const values = [
      exercise.slug, exercise.name, exercise.description, exercise.technique,
      muscleId(exercise), noLevelId, exercise.equipment || null, exercise.group,
      exercise.muscleCategory, exercise.primaryMuscles, exercise.secondaryMuscles,
      exercise.instructions, exercise.mistakes, exercise.alternatives,
      exercise.imageUrl, exercise.maleImageUrl, exercise.femaleImageUrl, exercise.muscleMapUrl,
    ]
    if (byName) {
      await client.query(`UPDATE fittrack.ejercicios SET
        slug_fuente=$1,nombre=$2,descripcion=$3,tecnica=$4,grupo_muscular_id=$5,nivel_id=$6,equipo=$7,
        grupo_fuente=$8,categoria_muscular=$9,musculos_primarios=$10,musculos_secundarios=$11,
        instrucciones=$12,errores_comunes=$13,alternativas=$14,imagen_url=$15,
        imagen_masculina_url=$16,imagen_femenina_url=$17,mapa_muscular_url=$18
        WHERE id=$19`, [...values, byName.id])
      continue
    }
    await client.query(`INSERT INTO fittrack.ejercicios
      (slug_fuente,nombre,descripcion,tecnica,grupo_muscular_id,nivel_id,equipo,
       grupo_fuente,categoria_muscular,musculos_primarios,musculos_secundarios,
       instrucciones,errores_comunes,alternativas,imagen_url,imagen_masculina_url,imagen_femenina_url,mapa_muscular_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (slug_fuente) DO UPDATE SET
        nombre=EXCLUDED.nombre,descripcion=EXCLUDED.descripcion,tecnica=EXCLUDED.tecnica,
        grupo_muscular_id=EXCLUDED.grupo_muscular_id,nivel_id=EXCLUDED.nivel_id,equipo=EXCLUDED.equipo,
        grupo_fuente=EXCLUDED.grupo_fuente,categoria_muscular=EXCLUDED.categoria_muscular,
        musculos_primarios=EXCLUDED.musculos_primarios,musculos_secundarios=EXCLUDED.musculos_secundarios,
        instrucciones=EXCLUDED.instrucciones,errores_comunes=EXCLUDED.errores_comunes,
        alternativas=EXCLUDED.alternativas,imagen_url=EXCLUDED.imagen_url,
        imagen_masculina_url=EXCLUDED.imagen_masculina_url,imagen_femenina_url=EXCLUDED.imagen_femenina_url,
        mapa_muscular_url=EXCLUDED.mapa_muscular_url`, values)
  }

  await client.query('COMMIT')
  console.log(`Importados ${exercises.length} ejercicios del catálogo original en fittrack.ejercicios.`)
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Importación revertida:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
