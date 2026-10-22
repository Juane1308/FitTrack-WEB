<script setup>
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-vue-next'

import logo from '@/assets/images/fittrack_logo.png'
import AppCard from '@/components/AppCard.vue'
import { onEnter } from '@/controllers/onEnter'
import { useProfileController } from '@/controllers/useProfileController'

const { overview, name, email, goal, weightChange, isLoading, error, loadOverview, logout } = useProfileController()

onEnter(loadOverview)

const menu = [
  { route: 'profile-goals', label: 'Mis objetivos', icon: Target },
  { route: 'profile-data', label: 'Mis datos', icon: UserRound },
  { route: 'profile-notifications', label: 'Notificaciones', icon: Bell },
  { route: 'profile-privacy', label: 'Privacidad', icon: ShieldCheck },
  { route: 'profile-help', label: 'Ayuda', icon: CircleHelp },
]
</script>

<template>
  <section class="section-page profile-page" aria-labelledby="profile-title">
    <header class="profile-header">
      <h1 id="profile-title">Perfil</h1>
      <RouterLink :to="{ name: 'profile-notifications' }" class="settings-link" aria-label="Configuración">
        <Settings :size="28" aria-hidden="true" />
      </RouterLink>
    </header>

    <div class="identity">
      <span class="avatar"><img :src="logo" alt="" /></span>
      <h2>{{ name }}</h2>
      <p class="muted">{{ email }}</p>
      <span class="goal-chip">{{ goal }}</span>
    </div>

    <AppCard v-if="error" class="state-card" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-filled" @click="loadOverview">Reintentar</button>
    </AppCard>

    <section v-else class="stats" aria-label="Resumen de tu progreso" :aria-busy="isLoading">
      <AppCard class="stat-card">
        <strong>{{ overview?.weeks ?? '--' }}</strong>
        <span>Semanas</span>
      </AppCard>
      <AppCard class="stat-card">
        <strong>{{ overview?.completedWorkouts ?? '--' }}</strong>
        <span>Entrenamientos</span>
      </AppCard>
      <AppCard class="stat-card">
        <strong :class="{ highlight: overview?.weightChangeKg }">{{ weightChange }}</strong>
        <span>Progreso</span>
      </AppCard>
    </section>

    <nav class="profile-menu" aria-label="Opciones del perfil">
      <RouterLink v-for="item in menu" :key="item.route" :to="{ name: item.route }" class="menu-item">
        <component :is="item.icon" :size="30" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <ChevronRight :size="26" aria-hidden="true" />
      </RouterLink>
      <button type="button" class="menu-item logout" @click="logout">
        <LogOut :size="30" aria-hidden="true" />
        <span>Cerrar sesión</span>
        <ChevronRight :size="26" aria-hidden="true" />
      </button>
    </nav>
  </section>
</template>

<style scoped>
.profile-page {
  max-width: 760px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  font-size: clamp(30px, 6vw, 44px);
}

.settings-link {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--color-text);
}

.settings-link:hover,
.settings-link:focus-visible {
  background: var(--color-indicator);
}

.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 18px 0 28px;
  text-align: center;
}

.avatar {
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  margin-bottom: 18px;
  border: 2px solid var(--color-card-border);
  border-radius: 50%;
  background: radial-gradient(circle, #10251c 0%, #050a08 75%);
  box-shadow: 0 0 32px rgba(0, 200, 120, 0.12);
}

.avatar img {
  width: 92px;
  height: 92px;
  object-fit: contain;
}

.identity h2 {
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 800;
}

.identity p {
  margin-top: 4px;
  font-size: 17px;
  overflow-wrap: anywhere;
}

.goal-chip {
  margin-top: 12px;
  padding: 5px 14px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-pill);
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 700;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 112px;
  justify-content: center;
  text-align: center;
  border-color: var(--color-input-border);
}

.stat-card strong {
  font-size: clamp(20px, 5vw, 28px);
  font-weight: 800;
}

.stat-card strong.highlight {
  color: var(--color-primary);
}

.stat-card span {
  color: var(--color-muted-text);
  font-size: 14px;
}

.state-card {
  display: grid;
  justify-items: center;
  gap: 14px;
  margin-bottom: 22px;
  text-align: center;
}

.profile-menu {
  display: grid;
  gap: 12px;
}

.menu-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  width: 100%;
  min-height: 72px;
  padding: 0 20px;
  border: 1px solid var(--color-card-border);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 19px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.menu-item:hover,
.menu-item:focus-visible {
  border-color: var(--color-primary);
  background: #10251c;
}

.menu-item.logout {
  color: #ff5a5f;
}

@media (max-width: 420px) {
  .stats {
    gap: 8px;
  }

  .stat-card {
    min-height: 96px;
    padding: 12px 6px !important;
  }

  .menu-item {
    gap: 14px;
    min-height: 62px;
    padding: 0 14px;
    font-size: 17px;
  }
}
</style>
