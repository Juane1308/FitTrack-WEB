const NUMBER_WORDS = new Map([
  ['uno', 1], ['dos', 2], ['tres', 3], ['cuatro', 4], ['cinco', 5],
  ['seis', 6], ['siete', 7], ['ocho', 8], ['nueve', 9], ['diez', 10],
])

const MUSCLE_GROUPS = [
  { label: 'espalda', terms: ['espalda'], pattern: '%espalda%' },
  { label: 'pecho', terms: ['pecho'], pattern: '%pecho%' },
  { label: 'piernas', terms: ['pierna', 'piernas'], pattern: '%pierna%' },
  { label: 'hombros', terms: ['hombro', 'hombros'], pattern: '%hombro%' },
  { label: 'brazos', terms: ['brazo', 'brazos', 'biceps', 'triceps'], pattern: '%brazo%' },
  { label: 'abdomen', terms: ['abdomen', 'abdominal'], pattern: '%abdomen%' },
  { label: 'glúteos', terms: ['gluteo', 'gluteos', 'gluteal'], pattern: '%glute%' },
]

const DAIRY_TERMS = [
  'leche', 'lactosa', 'queso', 'yogur', 'yogurt', 'mantequilla', 'crema',
  'nata', 'caseina', 'caseína', 'suero', 'requeson', 'requesón', 'whey',
]

const PROFILE_SAFETY_FIELDS = [
  'injuries', 'joint_pains', 'surgeries', 'chronic_conditions',
]

const PROFILE_STOP_WORDS = new Set([
  'dolor', 'dolores', 'lesion', 'lesiones', 'cirugia', 'cirugias',
  'enfermedad', 'enfermedades', 'cronica', 'cronico', 'articular',
  'pasada', 'pasado', 'ninguna', 'ninguno', 'ningun', 'aplica', 'sin',
])

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function requestedCount(message) {
  const numeric = normalize(message).match(/\b(\d{1,2})\b/)
  if (numeric) return Math.min(20, Math.max(1, Number(numeric[1])))

  const word = [...NUMBER_WORDS.entries()].find(([name]) => new RegExp(`\\b${name}\\b`).test(normalize(message)))
  return word ? word[1] : 5
}

function findMuscleGroup(message) {
  const normalized = normalize(message)
  return MUSCLE_GROUPS.find(group => group.terms.some(term => normalized.includes(term)))
}

function asksForExercises(message) {
  const normalized = normalize(message)
  return /ejercicio|ejercicios|entrenar|entrenamiento|rutina|espalda|pecho|pierna|hombro|brazo|abdomen|glute/.test(normalized)
}

function asksForLactoseFreeFood(message) {
  const normalized = normalize(message)
  return /lactosa|lactose|intolerante.*leche|intolerancia.*leche|sin lacte|sin leche|no puedo comer lacte/.test(normalized)
}

function profileSafetyPatterns(profile = {}) {
  const terms = PROFILE_SAFETY_FIELDS
    .flatMap(field => Array.isArray(profile[field]) ? profile[field] : [])
    .flatMap(value => normalize(value).split(/[^a-z0-9]+/))
    .filter(term => term.length >= 4 && !PROFILE_STOP_WORDS.has(term))

  return [...new Set(terms)].slice(0, 20).map(term => `%${term}%`)
}

function safetyNotice(patterns) {
  return patterns.length
    ? 'Tomé en cuenta las lesiones, dolores o condiciones registradas en tu perfil y excluí coincidencias de riesgo. Si tienes síntomas, consulta a un profesional antes de entrenar.'
    : ''
}

function dairyExclusionSql() {
  return `NOT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(r.ingredients, ARRAY[]::TEXT[])) AS ingredient
    WHERE lower(ingredient) ~ $1
  ) AND lower(r.name) !~ $1`
}

export async function answerChatMessage(query, message, profile = {}) {
  const text = String(message ?? '').trim()

  if (!text) {
    return {
      type: 'help',
      message: 'Escribe una pregunta sobre ejercicios o alimentación y buscaré opciones en FitTrack.',
      items: [],
    }
  }

  if (asksForLactoseFreeFood(text)) {
    const dairyPattern = `(${DAIRY_TERMS.join('|')})`
    const result = await query(
      `SELECT r.id, r.name, r.minutes, r.servings, r.calories, r.protein, r.carbs, r.fat
       FROM recipes r
       WHERE ${dairyExclusionSql()}
       ORDER BY r.sort_order, r.id
       LIMIT $2`,
      [dairyPattern, requestedCount(text)],
    )

    return {
      type: 'recipes',
      message: result.rows.length
        ? 'Estas recetas no contienen ingredientes identificados como lácteos. Si tu intolerancia es médica, revisa siempre las etiquetas y la contaminación cruzada.'
        : 'No encontré recetas compatibles con esa restricción. Puedes probar otra consulta o revisar los ingredientes manualmente.',
      items: result.rows.map(recipe => ({
        id: String(recipe.id),
        name: recipe.name,
        detail: `${recipe.minutes} min · ${recipe.calories} kcal · ${recipe.servings} porciones`,
        metadata: `Proteína ${recipe.protein} g · Carbohidratos ${recipe.carbs} g · Grasas ${recipe.fat} g`,
      })),
    }
  }

  if (asksForExercises(text)) {
    const muscle = findMuscleGroup(text)
    const count = requestedCount(text)
    const pattern = muscle?.pattern ?? '%'
    const blockedPatterns = profileSafetyPatterns(profile)
    const result = await query(
      `SELECT e.id, e.nombre AS name, e.tecnica AS technique,
              g.nombre AS "muscleGroup", n.nombre AS level
       FROM fittrack.ejercicios e
       LEFT JOIN fittrack.grupos_musculares g ON g.id = e.grupo_muscular_id
       LEFT JOIN fittrack.niveles_dificultad n ON n.id = e.nivel_id
       WHERE e.activo = TRUE
         AND ($1 = '%' OR lower(translate(g.nombre, 'áéíóúüñ', 'aeiouun')) ILIKE $1)
         AND ($3::TEXT[] IS NULL OR NOT (
           lower(concat_ws(' ', e.nombre, e.descripcion, e.tecnica, g.nombre)) LIKE ANY($3::TEXT[])
         ))
       ORDER BY e.nombre, e.id
       LIMIT $2`,
      [pattern, count, blockedPatterns.length ? blockedPatterns : null],
    )

    const focusLabel = muscle?.label ?? 'entrenamiento'
    const notice = safetyNotice(blockedPatterns)
    return {
      type: 'exercises',
      message: `${result.rows.length
        ? `Encontré ${result.rows.length} ejercicio${result.rows.length === 1 ? '' : 's'} de ${focusLabel}.`
        : `No encontré ejercicios de ${focusLabel} compatibles con los datos de tu perfil.`}${notice ? ` ${notice}` : ''}`,
      items: result.rows.map(exercise => ({
        id: String(exercise.id),
        name: exercise.name,
        detail: [exercise.muscleGroup, exercise.level].filter(Boolean).join(' · '),
        metadata: exercise.technique ?? 'Técnica no especificada',
      })),
    }
  }

  return {
    type: 'help',
    message: 'Puedo buscar ejercicios por grupo muscular y cantidad, o recomendar recetas según restricciones como intolerancia a la lactosa. Por ejemplo: “dame 4 ejercicios para espalda” o “soy intolerante a la lactosa, ¿qué puedo comer?”.',
    items: [],
  }
}
