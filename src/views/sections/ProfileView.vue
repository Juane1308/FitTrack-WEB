<script setup>
import {
  Bell,
  Camera,
  ChevronRight,
  CircleHelp,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-vue-next'
import { computed } from 'vue'

import AppCard from '@/components/AppCard.vue'
import { onEnter } from '@/controllers/onEnter'
import { useProfileController } from '@/controllers/useProfileController'

const { avatar, avatarSaving, avatarError, changeAvatar, removeAvatar, overview, personalData, goals, age, bmi, activity, location, name, email, goal, weightChange, isLoading, error, loadOverview, logout } = useProfileController()

onEnter(loadOverview)

// La tipografía de Perfil se carga solo en esta página para no cambiar el resto de módulos
const PROFILE_FONT_URL = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&display=swap'
if (!document.querySelector(`link[href="${PROFILE_FONT_URL}"]`)) {
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = PROFILE_FONT_URL
  document.head.append(fontLink)
}

// Categoría de IMC según la OMS
const bmiCategory = computed(() => {
  const value = Number(bmi.value)
  if (!value) return null
  return value < 18.5 ? 'Bajo peso' : value < 25 ? 'Normal' : value < 30 ? 'Sobrepeso' : 'Obesidad'
})

function onAvatarSelected(event) {
  const [file] = event.target.files ?? []
  event.target.value = ''
  if (file) changeAvatar(file)
}

const menu = [
  { route: 'profile-goals', label: 'Mis objetivos', detail: 'Meta semanal, peso objetivo y enfoque.', icon: Target },
  { route: 'profile-data', label: 'Mis datos', detail: 'Información personal y física.', icon: UserRound },
  { route: 'profile-notifications', label: 'Notificaciones', detail: 'Recordatorios y avisos.', icon: Bell },
  { route: 'profile-privacy', label: 'Privacidad', detail: 'Contraseña y seguridad de la cuenta.', icon: ShieldCheck },
  { route: 'profile-help', label: 'Ayuda', detail: 'Preguntas frecuentes y soporte.', icon: CircleHelp },
]
</script>

<template>
  <section class="section-page profile-page" aria-labelledby="profile-title">
    <h1 id="profile-title" class="sr-only">Perfil</h1>

    <header class="identity">
      <div class="avatar-block">
        <label class="avatar" :class="{ busy: avatarSaving }">
          <img v-if="avatar" :src="avatar" alt="Tu foto de perfil" />
          <span v-else aria-hidden="true">{{ (name || '?').trim().charAt(0).toUpperCase() }}</span>
          <span class="avatar-action">
            <LoaderCircle v-if="avatarSaving" class="spin" :size="20" aria-hidden="true" />
            <Camera v-else :size="20" aria-hidden="true" />
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            :disabled="avatarSaving"
            :aria-label="avatar ? 'Cambiar foto de perfil' : 'Subir foto de perfil'"
            @change="onAvatarSelected"
          />
        </label>
      </div>
      <div class="identity-text">
        <h2>{{ name }}</h2>
        <p>
          <span>{{ email }}</span>
          <span class="goal-chip">{{ goal }}</span>
        </p>
        <p class="avatar-links">
          <span>{{ avatar ? 'Haz clic en tu foto para cambiarla.' : 'Haz clic en el círculo para subir una foto.' }}</span>
          <button v-if="avatar" type="button" class="link-button" :disabled="avatarSaving" @click="removeAvatar">Quitar foto</button>
        </p>
        <p v-if="avatarError" class="avatar-error" role="alert">{{ avatarError }}</p>
      </div>
      <button type="button" class="logout btn" @click="logout">
        <LogOut :size="17" aria-hidden="true" />
        Cerrar sesión
      </button>
    </header>

    <div v-if="error" class="state-card" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-filled" @click="loadOverview">Reintentar</button>
    </div>

    <dl v-else class="stats" aria-label="Resumen de tu progreso" :aria-busy="isLoading">
      <div class="stat-card">
        <dt>Semanas en FitTrack</dt>
        <dd>{{ overview?.weeks ?? '--' }}</dd>
      </div>
      <div class="stat-card">
        <dt>Entrenamientos completados</dt>
        <dd>{{ overview?.completedWorkouts ?? '--' }}</dd>
      </div>
      <div class="stat-card">
        <dt>Cambio de peso</dt>
        <dd :class="{ highlight: overview?.weightChangeKg }">{{ weightChange }}</dd>
      </div>
    </dl>

    <div class="settings">
      <aside class="summary">
        <section class="summary-block" aria-labelledby="body-title">
          <div class="summary-heading">
            <h2 id="body-title">Tu cuerpo</h2>
            <RouterLink :to="{ name: 'profile-data' }">Editar</RouterLink>
          </div>
          <dl class="figure-grid">
            <div class="figure">
              <dt>Peso</dt>
              <dd>{{ personalData?.weightKg ?? '--' }}<small v-if="personalData?.weightKg">kg</small></dd>
            </div>
            <div class="figure">
              <dt>Estatura</dt>
              <dd>{{ personalData?.heightCm ?? '--' }}<small v-if="personalData?.heightCm">cm</small></dd>
            </div>
            <div class="figure">
              <dt>Edad</dt>
              <dd>{{ age ?? '--' }}<small v-if="age != null">años</small></dd>
            </div>
            <div class="figure">
              <dt>
                IMC
                <span v-if="bmiCategory" class="bmi-state" :class="{ healthy: bmiCategory === 'Normal' }">{{ bmiCategory }}</span>
              </dt>
              <dd>{{ bmi ?? '--' }}</dd>
            </div>
          </dl>
        </section>

        <section class="summary-block" aria-labelledby="plan-title">
          <div class="summary-heading">
            <h2 id="plan-title">Tu plan</h2>
            <RouterLink :to="{ name: 'profile-goals' }">Editar</RouterLink>
          </div>
          <dl class="plan-list">
            <div><dt>Entrenamientos por semana</dt><dd>{{ goals?.weeklyWorkouts ?? 'Sin definir' }}</dd></div>
            <div><dt>Peso objetivo</dt><dd :class="{ empty: !goals?.targetWeightKg }">{{ goals?.targetWeightKg ? `${goals.targetWeightKg} kg` : 'Sin definir' }}</dd></div>
            <div><dt>Agua al día</dt><dd>{{ goals?.dailyWaterMl ? `${(goals.dailyWaterMl / 1000).toFixed(1)} L` : 'Sin definir' }}</dd></div>
            <div><dt>Nivel de actividad</dt><dd>{{ activity ?? 'Sin definir' }}</dd></div>
            <div><dt>Dónde entrenas</dt><dd>{{ location ?? 'Sin definir' }}</dd></div>
          </dl>
        </section>
      </aside>
      <nav class="profile-menu" aria-label="Opciones del perfil">
        <RouterLink v-for="item in menu" :key="item.route" :to="{ name: item.route }" class="menu-item">
          <component :is="item.icon" class="menu-icon" :size="22" aria-hidden="true" />
          <span class="menu-text">
            <strong>{{ item.label }}</strong>
            <small>{{ item.detail }}</small>
          </span>
          <ChevronRight :size="20" aria-hidden="true" />
        </RouterLink>
      </nav>
    </div>
  </section>
</template>

<style scoped>
/* Tokens propios de Perfil: tarjetas grises neutras y tipografía Bricolage Grotesque */
.profile-page {
  --profile-surface: #111111;
  --profile-line: #242424;
  --profile-font: 'Bricolage Grotesque', 'Arial Narrow', sans-serif;

  max-width: none;
  font-family: 'Bricolage Grotesque', Arial, Helvetica, sans-serif;
}

.identity {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
}

.avatar {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 76px;
  height: 76px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary);
  color: #000;
  font-family: var(--profile-font);
  font-size: 34px;
  font-weight: 800;
  cursor: pointer;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Capa con la cámara: aparece al pasar el mouse, al enfocar o mientras se guarda */
.avatar-action {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 55%);
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}

.avatar:hover .avatar-action,
.avatar:focus-within .avatar-action,
.avatar.busy .avatar-action {
  opacity: 1;
}

.avatar:focus-within {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.avatar.busy {
  cursor: progress;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.identity-text {
  flex: 1;
  min-width: 0;
}

.identity h2 {
  font-family: var(--profile-font);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
  overflow-wrap: anywhere;
}

.identity p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin-top: 8px;
  color: var(--color-muted-text);
  font-size: 15px;
}

.identity .avatar-links {
  margin-top: 6px;
  color: var(--color-subtle-text);
  font-size: 13px;
}

.link-button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.link-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.link-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.identity .avatar-error {
  color: var(--color-error);
  font-size: 13px;
}

.goal-chip {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #000;
  font-size: 13px;
  font-weight: 600;
}

.logout {
  flex: 0 0 auto;
  align-self: flex-start;
  min-height: 38px;
  padding: 0 16px;
  background: transparent;
  color: var(--color-error);
  font-size: 14px;
  box-shadow: inset 0 0 0 1.5px currentColor;
}

.logout:hover,
.logout:focus-visible {
  background: var(--color-error);
  color: #000;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 0 36px;
  border-top: 1px solid var(--profile-line);
  border-bottom: 1px solid var(--profile-line);
}

.stat-card {
  display: flex;
  flex-direction: column-reverse;
  gap: 0;
  padding: 14px 20px 14px 0;
}

.stat-card + .stat-card {
  padding-left: 20px;
  border-left: 1px solid var(--profile-line);
}

.stat-card dd {
  margin: 0;
  font-family: var(--profile-font);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
}

.stat-card dd.highlight {
  color: var(--color-primary);
}

.stat-card dt {
  color: var(--color-muted-text);
  font-size: 13px;
}

.state-card {
  display: grid;
  justify-items: start;
  gap: 14px;
  margin-bottom: 48px;
  color: var(--color-error);
}

.settings {
  display: grid;
  gap: 40px;
}

.summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.summary-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border: 1px solid var(--profile-line);
  border-radius: 20px;
  background: var(--profile-surface);
}

.summary-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.summary-heading h2 {
  font-size: 17px;
  font-weight: 600;
}

.summary-heading a {
  color: var(--color-muted-text);
  font-size: 14px;
  text-decoration: none;
}

.summary-heading a:hover {
  color: var(--color-primary);
}

.summary-heading a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Tu cuerpo: cuadrícula 2×2 con líneas finas en cruz que llena la tarjeta */
.figure-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  margin: 0 -28px -28px;
  border-top: 1px solid var(--profile-line);
}

.figure {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 28px 24px;
}

.figure:nth-child(odd) {
  border-right: 1px solid var(--profile-line);
}

.figure:nth-child(-n + 2) {
  border-bottom: 1px solid var(--profile-line);
}

.figure dt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--color-muted-text);
  font-size: 14px;
}

.figure dd {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  font-family: var(--profile-font);
  font-size: 44px;
  font-variation-settings: 'wdth' 85;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
}

.figure small {
  color: var(--color-muted-text);
  font-family: inherit;
  font-size: 15px;
  font-variation-settings: 'wdth' 100;
  font-weight: 400;
  letter-spacing: 0;
}

.bmi-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-muted-text);
  font-size: 13px;
}

.bmi-state::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e8c25a;
}

.bmi-state.healthy::before {
  background: var(--color-primary);
}

/* Tu plan: lista simple de dos columnas */
.plan-list {
  display: grid;
  margin: 0 -28px;
  padding: 4px 28px 0;
  border-top: 1px solid var(--profile-line);
}

.plan-list div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--profile-line);
  font-size: 15px;
}

.plan-list div:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.plan-list dt {
  color: var(--color-muted-text);
}

.plan-list dd {
  margin: 0;
  font-weight: 500;
  text-align: right;
}

.plan-list dd.empty {
  color: var(--color-subtle-text);
  font-weight: 400;
}

.profile-menu {
  display: grid;
  border-top: 1px solid var(--profile-line);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 4px;
  border-bottom: 1px solid var(--profile-line);
  color: var(--color-muted-text);
  text-decoration: none;
}

.menu-item:hover strong {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.menu-item:hover {
  color: var(--color-text);
}

.menu-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 8px;
}

.menu-icon {
  flex: 0 0 auto;
  color: var(--color-primary);
}

.menu-text {
  display: grid;
  flex: 1;
  gap: 2px;
}

.menu-text strong {
  color: var(--color-text);
  font-size: 19px;
  font-weight: 700;
}

.menu-text small {
  font-size: 15px;
}

@media (max-width: 1000px) {
  .summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .summary-block {
    padding: 20px;
  }

  .figure-grid {
    margin: 0 -20px -20px;
  }

  .plan-list {
    margin: 0 -20px;
    padding: 4px 20px 0;
  }

  .figure {
    padding: 16px 20px 18px;
  }

  .figure dd {
    font-size: 34px;
  }

  .plan-list div {
    font-size: 14px;
  }
}

@media (max-width: 800px) {
  .identity {
    flex-wrap: wrap;
    gap: 20px;
  }


  .logout {
    width: 100%;
  }

  .stat-card dd {
    font-size: 22px;
  }

  .stat-card,
  .stat-card + .stat-card {
    padding: 16px 10px;
  }

  .summary {
    grid-template-columns: 1fr;
  }
}
</style>
