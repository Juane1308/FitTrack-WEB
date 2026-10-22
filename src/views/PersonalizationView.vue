<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Dumbbell,
  HeartPulse,
  House,
  LogOut,
  Scale,
  Target,
  Trees,
  Ruler,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import logo from '@/assets/images/fittrack_logo.png'
import { useAuthController } from '@/controllers/authController'

const router = useRouter()
const auth = useAuthController()
const step = ref(1)
const isLoadingProfile = ref(true)
const isSaving = ref(false)
const formError = ref('')
const fieldErrors = reactive({})

const steps = [
  { number: 1, label: 'Tu objetivo' },
  { number: 2, label: 'Datos personales' },
  { number: 3, label: 'Tus hábitos' },
  { number: 4, label: 'Salud y alergias' },
]

const goals = [
  { value: 'lose_weight', label: 'Perder peso', detail: 'Construye hábitos y avanza a tu ritmo.', icon: Scale },
  { value: 'gain_muscle', label: 'Ganar masa muscular', detail: 'Entrena y aliméntate para crecer.', icon: Dumbbell },
  { value: 'stay_fit', label: 'Mantenerme en forma', detail: 'Conserva una rutina activa y equilibrada.', icon: Target },
  { value: 'improve_health', label: 'Mejorar mi salud', detail: 'Prioriza tu bienestar integral.', icon: HeartPulse },
]

const activityLevels = [
  { value: 'sedentary', label: 'Poco activo', detail: 'Paso la mayor parte del día sentado.' },
  { value: 'light', label: 'Actividad ligera', detail: 'Me muevo o entreno algunos días.' },
  { value: 'moderate', label: 'Actividad moderada', detail: 'Hago ejercicio varias veces por semana.' },
  { value: 'active', label: 'Muy activo', detail: 'Entreno o me muevo casi todos los días.' },
]

const locations = [
  { value: 'home', label: 'En casa', icon: House },
  { value: 'outdoors', label: 'Al aire libre', icon: Trees },
  { value: 'gym', label: 'Gimnasio', icon: Building2 },
]

const healthGroups = [
  { key: 'injuries', label: 'Lesiones previas', options: ['Rodilla', 'Espalda', 'Hombro', 'Tobillo', 'Muñeca'] },
  { key: 'jointPains', label: 'Dolores articulares', options: ['Rodillas', 'Espalda', 'Hombros', 'Cadera', 'Cuello'] },
  { key: 'surgeries', label: 'Cirugías', options: ['Rodilla', 'Cadera', 'Hombro', 'Columna'] },
  { key: 'chronicConditions', label: 'Condiciones crónicas', options: ['Hipertensión', 'Diabetes', 'Asma', 'Condición cardíaca'] },
  { key: 'allergies', label: 'Alergias alimentarias', options: ['Lácteos', 'Huevo', 'Frutos secos', 'Gluten', 'Soja', 'Mariscos'] },
]

const answers = reactive({
  injuries: false,
  jointPains: false,
  surgeries: false,
  chronicConditions: false,
  allergies: false,
})

const profile = reactive({
  goal: '',
  birthDate: '',
  weightKg: '',
  heightCm: '',
  sportExperience: '',
  trainingLocation: '',
  injuries: [],
  jointPains: [],
  surgeries: [],
  chronicConditions: [],
  allergies: [],
})

const progress = computed(() => `${Math.round((step.value / steps.length) * 100)}%`)
const today = new Date().toISOString().slice(0, 10)

async function logout() {
  auth.logout()
  await router.replace({ name: 'login' })
}

onMounted(async () => {
  if (auth.pendingRegistration) {
    isLoadingProfile.value = false
    return
  }
  if (!auth.isAuthenticated) {
    await router.replace({ name: 'login' })
    return
  }

  try {
    const saved = await auth.getProfile()
    for (const key of Object.keys(profile)) {
      if (saved[key] !== undefined && saved[key] !== null) profile[key] = saved[key]
    }
    for (const key of Object.keys(answers)) answers[key] = Array.isArray(saved[key])
  } catch (_error) {
    formError.value = 'No pudimos cargar tu perfil. Revisa tu conexión e inténtalo de nuevo.'
  } finally {
    isLoadingProfile.value = false
  }
})

function clearErrors() {
  formError.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

function validateCurrentStep() {
  clearErrors()
  if (step.value === 1 && !profile.goal) fieldErrors.goal = 'Selecciona el objetivo que mejor te representa.'
  if (step.value === 2) {
    if (!profile.birthDate || profile.birthDate > today) fieldErrors.birthDate = 'Ingresa una fecha de nacimiento válida.'
    if (!profile.weightKg || Number(profile.weightKg) < 25 || Number(profile.weightKg) > 350) {
      fieldErrors.weightKg = 'Ingresa un peso entre 25 y 350 kg.'
    }
    if (!profile.heightCm || Number(profile.heightCm) < 100 || Number(profile.heightCm) > 250) {
      fieldErrors.heightCm = 'Ingresa una estatura entre 100 y 250 cm.'
    }
  }
  if (step.value === 3) {
    if (!profile.sportExperience) fieldErrors.sportExperience = 'Selecciona tu nivel de actividad actual.'
    if (!profile.trainingLocation) fieldErrors.trainingLocation = 'Selecciona dónde entrenarás.'
  }
  if (step.value === 4) {
    for (const group of healthGroups) {
      if (!answers[group.key]) fieldErrors[group.key] = 'Elige una opción o selecciona “Ninguna”.'
    }
  }
  return Object.keys(fieldErrors).length === 0
}

function nextStep() {
  if (validateCurrentStep() && step.value < steps.length) step.value += 1
}

function previousStep() {
  clearErrors()
  if (step.value > 1) step.value -= 1
}

function toggleHealthItem(key, item) {
  const selected = new Set(profile[key])
  if (selected.has(item)) selected.delete(item)
  else selected.add(item)
  profile[key] = [...selected]
  answers[key] = true
  delete fieldErrors[key]
}

function chooseNone(key) {
  profile[key] = []
  answers[key] = true
  delete fieldErrors[key]
}

async function saveProfile() {
  if (!validateCurrentStep() || isSaving.value || isLoadingProfile.value) return
  isSaving.value = true
  try {
    const profileData = {
      ...profile,
      weightKg: Number(profile.weightKg),
      heightCm: Number(profile.heightCm),
    }

    if (auth.pendingRegistration) {
      const email = auth.pendingRegistration.email
      const result = await auth.completeRegistration(profileData)
      if (!result.isSuccess) {
        formError.value = result.status === 'emailAlreadyRegistered'
          ? 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.'
          : result.status === 'invalidProfileData'
            ? 'Revisa la información: algunos datos no son válidos.'
            : 'No pudimos crear tu cuenta. Revisa tu conexión e inténtalo de nuevo.'
        return
      }
      await router.replace({ name: 'login', query: { registered: '1', email } })
      return
    }

    await auth.saveProfile(profileData)
    await router.replace({ name: 'home' })
  } catch (error) {
    formError.value = error.code === 'invalidProfileData'
      ? 'Revisa la información: algunos datos no son válidos.'
      : 'No pudimos guardar tu perfil. Inténtalo de nuevo.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="personalization-page">
    <aside class="intro-panel">
      <RouterLink :to="{ name: 'personalization' }" class="brand" aria-label="FitTrack">
        <img :src="logo" alt="FitTrack" />
      </RouterLink>

      <div class="intro-copy">
        <span class="eyebrow">TU PLAN, A TU MEDIDA</span>
        <h1>Conocerte es el primer paso para avanzar.</h1>
        <p>Completa tu perfil para recibir recomendaciones que se adapten a ti y a tu día a día.</p>
      </div>

      <ol class="step-list" aria-label="Pasos de personalización">
        <li v-for="item in steps" :key="item.number" :class="{ current: step === item.number, completed: step > item.number }">
          <span class="step-marker">
            <Check v-if="step > item.number" :size="16" aria-hidden="true" />
            <span v-else>{{ item.number }}</span>
          </span>
          <span>{{ item.label }}</span>
        </li>
      </ol>

      <p class="privacy-note">Tus respuestas nos ayudan a adaptar la experiencia a tus necesidades.</p>
      <button v-if="auth.isAuthenticated" type="button" class="logout-button" @click="logout">
        <LogOut :size="16" aria-hidden="true" /> Cerrar sesión
      </button>
    </aside>

    <section class="form-panel" aria-labelledby="step-title">
      <div class="form-topline">
        <span>PASO {{ step }} DE {{ steps.length }}</span>
        <span>{{ progress }}</span>
      </div>
      <div class="progress-track" role="progressbar" :aria-valuenow="step" :aria-valuemin="1" :aria-valuemax="steps.length" aria-label="Progreso de personalización">
        <span :style="{ width: progress }"></span>
      </div>

      <div v-if="isLoadingProfile" class="loading-state" role="status">Cargando tu perfil…</div>
      <form v-else class="step-form" @submit.prevent="step === 4 ? saveProfile() : nextStep()">
        <template v-if="step === 1">
          <div class="step-heading">
            <span class="heading-icon"><Target :size="22" /></span>
            <p class="eyebrow">EMPECEMOS POR LO IMPORTANTE</p>
            <h2 id="step-title">¿Cuál es tu objetivo principal?</h2>
            <p class="step-description">Esto nos ayuda a orientar tus rutinas y recomendaciones.</p>
          </div>
          <div class="goal-grid" role="radiogroup" aria-labelledby="step-title">
            <button
              v-for="goal in goals"
              :key="goal.value"
              type="button"
              class="choice-card goal-card"
              :class="{ selected: profile.goal === goal.value }"
              role="radio"
              :aria-checked="profile.goal === goal.value"
              @click="profile.goal = goal.value; delete fieldErrors.goal"
            >
              <component :is="goal.icon" :size="23" aria-hidden="true" />
              <span class="choice-title">{{ goal.label }}</span>
              <span class="choice-detail">{{ goal.detail }}</span>
            </button>
          </div>
          <p v-if="fieldErrors.goal" class="field-error" role="alert">{{ fieldErrors.goal }}</p>
        </template>

        <template v-else-if="step === 2">
          <div class="step-heading">
            <span class="heading-icon"><CalendarDays :size="22" /></span>
            <p class="eyebrow">UN PUNTO DE PARTIDA</p>
            <h2 id="step-title">Cuéntanos un poco sobre ti</h2>
            <p class="step-description">Usaremos estos datos para contextualizar tu progreso.</p>
          </div>
          <div class="personal-fields">
            <label class="profile-field field-wide">
              <span>Fecha de nacimiento</span>
              <span class="input-wrap"><CalendarDays :size="19" aria-hidden="true" /><input v-model="profile.birthDate" type="date" :max="today" required /></span>
              <small v-if="fieldErrors.birthDate" class="field-error">{{ fieldErrors.birthDate }}</small>
            </label>
            <label class="profile-field">
              <span>Peso actual</span>
              <span class="input-wrap"><Scale :size="19" aria-hidden="true" /><input v-model="profile.weightKg" type="number" min="25" max="350" step="0.1" placeholder="Ej. 68" required /><small>kg</small></span>
              <small v-if="fieldErrors.weightKg" class="field-error">{{ fieldErrors.weightKg }}</small>
            </label>
            <label class="profile-field">
              <span>Estatura</span>
              <span class="input-wrap"><Ruler :size="19" aria-hidden="true" /><input v-model="profile.heightCm" type="number" min="100" max="250" step="0.1" placeholder="Ej. 170" required /><small>cm</small></span>
              <small v-if="fieldErrors.heightCm" class="field-error">{{ fieldErrors.heightCm }}</small>
            </label>
          </div>
        </template>

        <template v-else-if="step === 3">
          <div class="step-heading">
            <span class="heading-icon"><Dumbbell :size="22" /></span>
            <p class="eyebrow">TU RITMO Y TU ESPACIO</p>
            <h2 id="step-title">¿Cómo es tu actividad diaria?</h2>
            <p class="step-description">No hay respuestas buenas o malas. Queremos adaptar el plan a tu realidad.</p>
          </div>
          <div class="activity-grid" role="radiogroup" aria-label="Nivel de actividad actual">
            <button
              v-for="level in activityLevels"
              :key="level.value"
              type="button"
              class="activity-option"
              :class="{ selected: profile.sportExperience === level.value }"
              role="radio"
              :aria-checked="profile.sportExperience === level.value"
              @click="profile.sportExperience = level.value; delete fieldErrors.sportExperience"
            >
              <span class="radio-mark"></span>
              <span><strong>{{ level.label }}</strong><small>{{ level.detail }}</small></span>
            </button>
          </div>
          <p v-if="fieldErrors.sportExperience" class="field-error" role="alert">{{ fieldErrors.sportExperience }}</p>

          <h3 class="subheading">¿Dónde entrenarás?</h3>
          <div class="location-grid" role="radiogroup" aria-label="Lugar de entrenamiento">
            <button
              v-for="location in locations"
              :key="location.value"
              type="button"
              class="location-option"
              :class="{ selected: profile.trainingLocation === location.value }"
              role="radio"
              :aria-checked="profile.trainingLocation === location.value"
              @click="profile.trainingLocation = location.value; delete fieldErrors.trainingLocation"
            >
              <component :is="location.icon" :size="24" aria-hidden="true" />
              <span>{{ location.label }}</span>
            </button>
          </div>
          <p v-if="fieldErrors.trainingLocation" class="field-error" role="alert">{{ fieldErrors.trainingLocation }}</p>
        </template>

        <template v-else>
          <div class="step-heading compact-heading">
            <span class="heading-icon"><HeartPulse :size="22" /></span>
            <p class="eyebrow">ENTRENAMIENTO CON CUIDADO</p>
            <h2 id="step-title">¿Hay algo que debamos tener en cuenta?</h2>
            <p class="step-description">Responde cada apartado. Si no aplica, selecciona “Ninguna”.</p>
          </div>
          <div class="health-groups">
            <fieldset v-for="group in healthGroups" :key="group.key" class="health-group">
              <legend>{{ group.label }}</legend>
              <div class="chip-list">
                <button
                  v-for="option in group.options"
                  :key="option"
                  type="button"
                  class="health-chip"
                  :class="{ selected: profile[group.key].includes(option) }"
                  :aria-pressed="profile[group.key].includes(option)"
                  @click="toggleHealthItem(group.key, option)"
                >{{ option }}</button>
                <button
                  type="button"
                  class="health-chip none-chip"
                  :class="{ selected: answers[group.key] && profile[group.key].length === 0 }"
                  :aria-pressed="answers[group.key] && profile[group.key].length === 0"
                  @click="chooseNone(group.key)"
                >Ninguna</button>
              </div>
              <small v-if="fieldErrors[group.key]" class="field-error" role="alert">{{ fieldErrors[group.key] }}</small>
            </fieldset>
          </div>
          <p class="medical-note">Esta información se usa para contextualizar tus recomendaciones de ejercicio y alimentación.</p>
        </template>

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

        <div class="form-actions">
          <button v-if="step > 1" type="button" class="btn btn-outlined back-button" @click="previousStep">
            <ArrowLeft :size="18" aria-hidden="true" /> Atrás
          </button>
          <span v-else class="action-spacer"></span>
          <button v-if="step < steps.length" type="submit" class="btn btn-filled continue-button" :disabled="isLoadingProfile">
            Continuar <ArrowRight :size="18" aria-hidden="true" />
          </button>
          <button v-else type="submit" class="btn btn-filled continue-button" :disabled="isSaving || isLoadingProfile">
            <span v-if="isSaving" class="spinner" aria-hidden="true"></span>
            <template v-else>{{ auth.pendingRegistration ? 'Crear cuenta' : 'Completar perfil' }} <Check :size="18" aria-hidden="true" /></template>
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.personalization-page {
  display: grid;
  grid-template-columns: minmax(300px, 0.78fr) minmax(560px, 1.22fr);
  min-height: 100vh;
  background: var(--color-background);
}

.intro-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: clamp(28px, 5vw, 68px);
  border-right: 1px solid var(--color-card-border);
  background: radial-gradient(circle at 14% 75%, rgba(0, 200, 120, 0.12), transparent 36%), #070d0a;
}

.brand { display: inline-flex; width: fit-content; }
.brand img { width: 190px; height: 68px; object-fit: contain; object-position: left center; }

.intro-copy { margin: auto 0 54px; max-width: 470px; }
.eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 800; letter-spacing: 0.16em; }
.intro-copy h1 { margin-top: 18px; font-size: clamp(32px, 3.6vw, 48px); line-height: 1.08; letter-spacing: -0.04em; }
.intro-copy p { max-width: 390px; margin-top: 18px; color: var(--color-muted-text); font-size: 16px; line-height: 1.65; }

.step-list { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.step-list li { display: flex; align-items: center; gap: 14px; color: var(--color-subtle-text); font-size: 14px; }
.step-list li.current, .step-list li.completed { color: var(--color-text); }
.step-marker { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #34453d; border-radius: 50%; color: var(--color-muted-text); font-size: 13px; }
.step-list li.current .step-marker, .step-list li.completed .step-marker { border-color: var(--color-primary); background: rgba(0, 200, 120, 0.12); color: var(--color-primary); }
.privacy-note { margin-top: 35px; color: var(--color-subtle-text); font-size: 12px; line-height: 1.6; }
.logout-button { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; margin-top: 18px; padding: 8px 0; border: 0; background: transparent; color: var(--color-muted-text); font-size: 12px; cursor: pointer; }
.logout-button:hover { color: var(--color-text); }

.form-panel { width: 100%; max-width: 900px; margin: 0 auto; padding: clamp(28px, 5vw, 72px) clamp(24px, 6vw, 88px); }
.form-topline { display: flex; justify-content: space-between; color: var(--color-muted-text); font-size: 11px; font-weight: 700; letter-spacing: 0.14em; }
.progress-track { height: 4px; margin-top: 13px; overflow: hidden; border-radius: 4px; background: #1c2b24; }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); transition: width 0.25s ease; }
.step-form { display: flex; flex-direction: column; min-height: calc(100vh - 170px); }
.step-heading { margin: 48px 0 28px; }
.heading-icon { display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 20px; border: 1px solid rgba(0, 200, 120, 0.32); border-radius: 14px; background: rgba(0, 200, 120, 0.09); color: var(--color-primary); }
.step-heading h2 { margin-top: 10px; font-size: clamp(26px, 3vw, 36px); letter-spacing: -0.035em; }
.step-description { margin-top: 10px; color: var(--color-muted-text); font-size: 15px; line-height: 1.55; }

.goal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.choice-card { display: flex; flex-direction: column; align-items: flex-start; text-align: left; border: 1px solid var(--color-card-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; transition: border-color 0.15s, background-color 0.15s, transform 0.15s; }
.goal-card { min-height: 154px; padding: 20px; border-radius: 18px; }
.goal-card > svg { margin-bottom: 16px; color: var(--color-primary); }
.choice-title { font-size: 16px; font-weight: 700; }
.choice-detail { margin-top: 7px; color: var(--color-muted-text); font-size: 12px; line-height: 1.45; }
.choice-card:hover, .choice-card.selected { border-color: var(--color-primary); background: linear-gradient(145deg, rgba(0, 200, 120, 0.13), var(--color-surface) 70%); }
.choice-card.selected { box-shadow: 0 0 0 1px var(--color-primary); }

.personal-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.profile-field { display: grid; gap: 9px; color: var(--color-text); font-size: 13px; font-weight: 600; }
.field-wide { grid-column: 1 / -1; }
.input-wrap { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 15px; border: 1px solid var(--color-input-border); border-radius: var(--radius-input); background: var(--color-surface); color: var(--color-muted-text); }
.input-wrap:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); }
.input-wrap input { width: 100%; min-width: 0; min-height: 52px; border: 0; outline: 0; background: transparent; color: var(--color-text); }
.input-wrap input[type='date'] { color-scheme: dark; }
.input-wrap small { color: var(--color-muted-text); font-size: 12px; }
.input-wrap input::placeholder { color: var(--color-subtle-text); }

.activity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.activity-option { display: flex; align-items: flex-start; gap: 12px; min-height: 78px; padding: 15px; border: 1px solid var(--color-card-border); border-radius: 14px; background: var(--color-surface); color: var(--color-text); text-align: left; cursor: pointer; }
.activity-option.selected, .location-option.selected { border-color: var(--color-primary); background: rgba(0, 200, 120, 0.1); }
.radio-mark { flex: none; width: 17px; height: 17px; margin-top: 1px; border: 1px solid #718079; border-radius: 50%; }
.activity-option.selected .radio-mark { border: 5px solid var(--color-primary); }
.activity-option strong, .activity-option small { display: block; }
.activity-option strong { font-size: 13px; }
.activity-option small { margin-top: 5px; color: var(--color-muted-text); font-size: 11px; line-height: 1.4; }
.subheading { margin: 27px 0 12px; font-size: 15px; }
.location-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.location-option { display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 62px; padding: 10px; border: 1px solid var(--color-card-border); border-radius: 14px; background: var(--color-surface); color: var(--color-muted-text); font-size: 13px; cursor: pointer; }
.location-option svg { color: var(--color-primary); }

.compact-heading { margin-bottom: 22px; }
.compact-heading .heading-icon { margin-bottom: 15px; }
.health-groups { display: grid; gap: 16px; }
.health-group { min-width: 0; margin: 0; padding: 0; border: 0; }
.health-group legend { margin-bottom: 9px; font-size: 13px; font-weight: 700; }
.chip-list { display: flex; flex-wrap: wrap; gap: 7px; }
.health-chip { min-height: 34px; padding: 0 12px; border: 1px solid #2c4036; border-radius: 999px; background: #101a15; color: var(--color-muted-text); font-size: 12px; cursor: pointer; }
.health-chip:hover, .health-chip.selected { border-color: var(--color-primary); background: rgba(0, 200, 120, 0.12); color: var(--color-text); }
.none-chip { color: var(--color-accent); }
.medical-note { margin-top: 18px; color: var(--color-subtle-text); font-size: 11px; line-height: 1.5; }
.field-error, .form-error { color: var(--color-error); font-size: 12px; }
.form-error { margin-top: 18px; }
.form-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 32px; }
.back-button, .continue-button { gap: 9px; min-width: 142px; }
.action-spacer { flex: 1; }
.loading-state { display: grid; place-items: center; min-height: 50vh; color: var(--color-muted-text); }

@media (max-width: 900px) {
  .personalization-page { grid-template-columns: 1fr; }
  .intro-panel { min-height: auto; padding: 18px 22px 16px; border-right: 0; border-bottom: 1px solid var(--color-card-border); background: #070d0a; }
  .brand img { width: 145px; height: 48px; }
  .intro-copy, .privacy-note { display: none; }
  .step-list { display: flex; justify-content: space-between; gap: 7px; margin-top: 12px; }
  .step-list li { flex-direction: column; gap: 5px; text-align: center; font-size: 10px; }
  .step-marker { width: 28px; height: 28px; }
  .form-panel { max-width: 700px; padding: 24px 22px 34px; }
  .step-form { min-height: calc(100vh - 190px); }
  .step-heading { margin-top: 35px; }
}

@media (max-width: 560px) {
  .goal-grid, .personal-fields, .activity-grid { grid-template-columns: 1fr; }
  .field-wide { grid-column: auto; }
  .goal-card { min-height: 126px; }
  .goal-card > svg { margin-bottom: 10px; }
  .location-grid { grid-template-columns: 1fr; }
  .location-option { justify-content: flex-start; padding-left: 18px; }
  .form-panel { padding-right: 18px; padding-left: 18px; }
  .step-heading h2 { font-size: 27px; }
  .form-actions { position: sticky; bottom: 0; margin: 24px -18px -34px; padding: 14px 18px max(14px, env(safe-area-inset-bottom)); border-top: 1px solid var(--color-card-border); background: rgba(0, 0, 0, 0.96); }
  .back-button, .continue-button { min-width: 0; flex: 1; }
}
</style>
