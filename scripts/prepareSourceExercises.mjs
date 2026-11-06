import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dataPath = join(root, 'src/data/sourceExercises.json')
const imagesDirectory = join(root, 'public/images/exercises')
const apiRoot = 'https://marcmayol.com/exercise-api/v1'
const imageRoot = 'https://marcmayol.com/exercise-api/images/'

const localize = value => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.es ?? value.en ?? Object.values(value)[0] ?? ''
  return ''
}

function muscleCategory(exercise) {
  const text = [...exercise.primaryMuscles, exercise.group, exercise.name].join(' ').toLocaleLowerCase('es')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/biceps/.test(text)) return 'biceps'
  if (/triceps/.test(text)) return 'triceps'
  if (/hombro|shoulder|deltoid/.test(text)) return 'hombros'
  if (/espalda|back|lat|trap|rhomboid/.test(text)) return 'espalda'
  if (/pecho|chest|pectoral/.test(text)) return 'pecho'
  if (/abdomen|abdom|oblique|core|abs/.test(text)) return 'abdomen'
  if (/pierna|leg|quad|hamstring|glute|calf|thigh|femoral/.test(text)) return 'pierna'
  return 'general'
}

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`GET ${url} falló con HTTP ${response.status}`)
  return response.json()
}

async function downloadImage(url, destination) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`No se pudo descargar la imagen ${url}: HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) throw new Error(`El recurso no es una imagen: ${url}`)
  await writeFile(destination, Buffer.from(await response.arrayBuffer()))
}

const listing = await getJson(`${apiRoot}/exercises.json`)
const summaries = Array.isArray(listing) ? listing : Array.isArray(listing.exercises) ? listing.exercises : Object.values(listing)
if (!summaries.length) throw new Error('La API no devolvió ejercicios.')
await mkdir(imagesDirectory, { recursive: true })

const records = new Array(summaries.length)
let next = 0
const worker = async () => {
  while (true) {
    const index = next++
    if (index >= summaries.length) return
    const summary = summaries[index]
    const slug = String(summary?.slug ?? summary?.id ?? '')
    if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error(`Identificador de ejercicio no válido: ${slug}`)
    const detail = await getJson(`${apiRoot}/exercises/${encodeURIComponent(slug)}.json`)
    const group = localize(detail.group)
    const primaryMuscles = (Array.isArray(detail.primaryMuscles) ? detail.primaryMuscles : []).map(localize).filter(Boolean)
    const secondaryMuscles = (Array.isArray(detail.secondaryMuscles) ? detail.secondaryMuscles : []).map(localize).filter(Boolean)
    const instructions = (Array.isArray(detail.instructions?.es) ? detail.instructions.es : []).map(String)
    const mistakes = (Array.isArray(detail.mistakes?.es) ? detail.mistakes.es : []).map(String)
    const alternatives = (Array.isArray(detail.alternatives?.es) ? detail.alternatives.es : []).map(String)
    const images = detail.images ?? detail.image ?? {}
    const selectedImageUrl = images.female || images.male || null
    const imagePath = selectedImageUrl ? `/images/exercises/${slug}.jpg` : null
    if (selectedImageUrl) await downloadImage(selectedImageUrl, join(imagesDirectory, `${slug}.jpg`))
    records[index] = {
      id: slug,
      slug,
      name: localize(detail.name) || detail.title || slug,
      group,
      groupId: localize(detail.group?.id) || '',
      primaryMuscles,
      secondaryMuscles,
      muscleCategory: muscleCategory({ name: localize(detail.name), group, primaryMuscles }),
      equipment: localize(detail.equipment),
      description: `Ejercicio de ${group || 'entrenamiento'} enfocado en ${primaryMuscles.length ? primaryMuscles.join(', ') : 'la zona seleccionada'}.`,
      instructions,
      technique: instructions.join('\n'),
      mistakes,
      alternatives,
      imageUrl: imagePath,
      maleImageUrl: images.male ?? null,
      femaleImageUrl: images.female ?? null,
      muscleMapUrl: detail.muscleMaps?.female ?? detail.muscleMap ?? null,
      sourceUrl: summary.url ?? `https://marcmayol.com/exercise-api/v1/exercises/${slug}.json`,
    }
    console.log(`Preparado ${index + 1}/${summaries.length}: ${records[index].name}`)
  }
}

await Promise.all(Array.from({ length: Math.min(8, summaries.length) }, worker))
const temporaryDataPath = `${dataPath}.tmp`
await mkdir(dirname(dataPath), { recursive: true })
await writeFile(temporaryDataPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
await rename(temporaryDataPath, dataPath)
console.log(`Listos ${records.length} ejercicios y ${records.filter(item => item.imageUrl).length} imágenes locales.`)
