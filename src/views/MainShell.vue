<script setup>
import { Bell, ChartLine, Dumbbell, House, User, Utensils } from 'lucide-vue-next'

import ContextualChatButton from '@/components/ContextualChatButton.vue'
import { AppSection } from '@/core/constants'
import { useMainShellController } from '@/controllers/useMainShellController'
import logo from '@/assets/images/fittrack_logo.png'

const { sections, currentSection, chatContext } = useMainShellController()

const icons = {
  [AppSection.home]: House,
  [AppSection.training]: Dumbbell,
  [AppSection.nutrition]: Utensils,
  [AppSection.progress]: ChartLine,
  [AppSection.profile]: User,
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <RouterLink :to="{ name: 'home' }" class="brand" aria-label="Ir al inicio">
        <img :src="logo" alt="FitTrack" />
      </RouterLink>

      <nav class="sidebar-navigation" aria-label="Navegación principal">
        <RouterLink
          v-for="section in sections"
          :key="section.key"
          :to="{ name: section.key }"
          class="sidebar-link"
          :class="{ selected: currentSection === section.key }"
          :aria-current="currentSection === section.key ? 'page' : undefined"
        >
          <component :is="icons[section.key]" :size="25" aria-hidden="true" />
          <span>{{ section.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer" aria-hidden="true">
        <span>MEJORES HÁBITOS</span>
        <span>GRANDES RESULTADOS</span>
        <i></i>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <button type="button" class="notification-button" aria-label="Notificaciones">
          <Bell :size="29" />
          <span></span>
        </button>

        <RouterLink
          :to="{ name: 'profile' }"
          class="profile-button"
          aria-label="Abrir perfil"
        >
          <User :size="27" />
        </RouterLink>
      </header>

      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <ContextualChatButton :context="chatContext" />

    <nav class="navigation-bar" aria-label="Navegación principal">
      <RouterLink
        v-for="section in sections"
        :key="section.key"
        :to="{ name: section.key }"
        class="destination"
        :class="{ selected: currentSection === section.key }"
        :aria-current="currentSection === section.key ? 'page' : undefined"
      >
        <span class="indicator">
          <component
            :is="icons[section.key]"
            :size="24"
            :stroke-width="currentSection === section.key ? 2.5 : 2"
            aria-hidden="true"
          />
        </span>
        <span class="label">{{ section.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--color-background);
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: 258px;
  padding: 28px 17px 32px;
  border-right: 1px solid var(--color-card-border);
  background: #060b0f;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 75px;
  margin-bottom: 42px;
}

.brand img {
  width: 190px;
  max-height: 58px;
  object-fit: contain;
}

.sidebar-navigation {
  display: grid;
  gap: 14px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 58px;
  padding: 0 20px;
  border-radius: 12px;
  color: #c7d2df;
  font-size: 18px;
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
}

.sidebar-link:hover,
.sidebar-link.selected {
  background: linear-gradient(90deg, #064e3f, #08705a);
  color: #00f0b5;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
  padding: 0 16px;
  color: #a4b6c7;
  font-size: 12px;
  letter-spacing: 2px;
}

.sidebar-footer i {
  width: 38px;
  height: 3px;
  margin-top: 10px;
  background: var(--color-primary);
}

.main-content {
  min-width: 0;
  min-height: 100vh;
  margin-left: 258px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 26px;
  height: 96px;
  padding: 0 38px;
}

.notification-button,
.profile-button {
  position: relative;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: #dbe6f0;
  cursor: pointer;
}

.notification-button span {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 11px;
  height: 11px;
  border: 2px solid var(--color-background);
  border-radius: 50%;
  background: #00e5aa;
}

.profile-button {
  width: 50px;
  height: 50px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
}

.notification-button:focus-visible,
.profile-button:focus-visible,
.sidebar-link:focus-visible,
.destination:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.navigation-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  display: none;
  height: var(--nav-height);
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--color-card-border);
  background: var(--color-surface);
}

.destination {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  color: var(--color-muted-text);
  text-decoration: none;
}

.indicator {
  display: grid;
  place-items: center;
  width: 64px;
  height: 32px;
  border-radius: 16px;
  transition: background-color 0.2s;
}

.selected {
  color: var(--color-text);
}

.selected .indicator {
  background: var(--color-indicator);
}

.label {
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.destination:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -4px;
}

@media (max-width: 900px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
  }

  .topbar {
    height: 74px;
    padding: 0 20px;
  }

  .navigation-bar {
    display: grid;
  }
}
</style>
