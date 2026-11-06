import { Building2, Dumbbell, HeartPulse, House, Scale, Target, Trees } from 'lucide-vue-next'

// Opciones del perfil compartidas por la personalización (onboarding) y el módulo Perfil.
// Los value coinciden con los que valida server/index.js.
export const goals = [
  { value: 'lose_weight', label: 'Perder peso', detail: 'Construye hábitos y avanza a tu ritmo.', icon: Scale },
  { value: 'gain_muscle', label: 'Ganar masa muscular', detail: 'Entrena y aliméntate para crecer.', icon: Dumbbell },
  { value: 'stay_fit', label: 'Mantenerme en forma', detail: 'Conserva una rutina activa y equilibrada.', icon: Target },
  { value: 'improve_health', label: 'Mejorar mi salud', detail: 'Prioriza tu bienestar integral.', icon: HeartPulse },
]

export const activityLevels = [
  { value: 'sedentary', label: 'Poco activo', detail: 'Paso la mayor parte del día sentado.' },
  { value: 'light', label: 'Actividad ligera', detail: 'Me muevo o entreno algunos días.' },
  { value: 'moderate', label: 'Actividad moderada', detail: 'Hago ejercicio varias veces por semana.' },
  { value: 'active', label: 'Muy activo', detail: 'Entreno o me muevo casi todos los días.' },
]

export const locations = [
  { value: 'home', label: 'En casa', icon: House },
  { value: 'outdoors', label: 'Al aire libre', icon: Trees },
  { value: 'gym', label: 'Gimnasio', icon: Building2 },
]

export const healthGroups = [
  { key: 'injuries', label: 'Lesiones previas', options: ['Rodilla', 'Espalda', 'Hombro', 'Tobillo', 'Muñeca'] },
  { key: 'jointPains', label: 'Dolores articulares', options: ['Rodillas', 'Espalda', 'Hombros', 'Cadera', 'Cuello'] },
  { key: 'surgeries', label: 'Cirugías', options: ['Rodilla', 'Cadera', 'Hombro', 'Columna'] },
  { key: 'chronicConditions', label: 'Condiciones crónicas', options: ['Hipertensión', 'Diabetes', 'Asma', 'Condición cardíaca'] },
  { key: 'allergies', label: 'Alergias alimentarias', options: ['Lácteos', 'Huevo', 'Frutos secos', 'Gluten', 'Soja', 'Mariscos'] },
]

export const goalLabel = (value) => goals.find((goal) => goal.value === value)?.label ?? 'Sin definir'
