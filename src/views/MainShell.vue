<script setup>
import { Bell, ChartLine, Dumbbell, House, Menu, User, Utensils, X } from 'lucide-vue-next'
import { ref } from 'vue'

import ContextualChatButton from '@/components/ContextualChatButton.vue'
import { AppSection } from '@/core/constants'
import { useMainShellController } from '@/controllers/useMainShellController'
import logo from '@/assets/images/fittrack_logo.png'

const { sections, currentSection, chatContext } = useMainShellController()
const sidebarOpen = ref(typeof window === 'undefined' || window.innerWidth > 900)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 900) sidebarOpen.value = false
}

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
    <aside id="main-sidebar" class="sidebar" :class="{ 'sidebar-hidden': !sidebarOpen }">
      <RouterLink :to="{ name: 'home' }" class="brand" aria-label="Ir al inicio">
        <img :src="logo" alt="FitTrack" />
      </RouterLink>

      <nav class="main-navigation" aria-label="Navegación principal">
        <RouterLink
          v-for="section in sections"
          :key="section.key"
          :to="{ name: section.key }"
          class="main-link"
          :class="{ selected: currentSection === section.key }"
          :aria-current="currentSection === section.key ? 'page' : undefined"
          @click="closeSidebarOnMobile"
        >
          <component :is="icons[section.key]" :size="18" aria-hidden="true" />
          <span>{{ section.label }}</span>
        </RouterLink>
      </nav>

      <RouterLink :to="{ name: 'profile' }" class="profile-button" aria-label="Abrir perfil" :aria-current="currentSection === AppSection.profile ? 'page' : undefined">
        <User :size="20" aria-hidden="true" />
      </RouterLink>
    </aside>

    <main class="main-content" :class="{ 'sidebar-collapsed': !sidebarOpen, 'home-content': currentSection === AppSection.home }">
      <header class="topbar">
        <button
          type="button"
          class="menu-button"
          :aria-expanded="sidebarOpen"
          aria-controls="main-sidebar"
          :aria-label="sidebarOpen ? 'Ocultar navegación' : 'Mostrar navegación'"
          @click="toggleSidebar"
        >
          <X v-if="sidebarOpen" :size="25" aria-hidden="true" />
          <Menu v-else :size="25" aria-hidden="true" />
        </button>
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

    <button
      v-if="sidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Cerrar navegación"
      @click="sidebarOpen = false"
    ></button>

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
  transition: transform 0.25s ease;
}

.sidebar-hidden {
  transform: translateX(-100%);
  pointer-events: none;
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
  transition: margin-left 0.25s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}

.main-content.home-content {
  position: relative;
  z-index: 2;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 26px;
  height: 96px;
  padding: 0 38px;
}

.menu-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.menu-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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

.notification-button {
  margin-left: auto;
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
.menu-button:focus-visible,
.sidebar-link:focus-visible,
.destination:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.sidebar-backdrop {
  display: none;
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
    width: min(258px, 86vw);
    box-shadow: 14px 0 32px rgba(0, 0, 0, 0.38);
  }

  .main-content {
    margin-left: 0;
  }

  .topbar {
    height: 74px;
    padding: 0 20px;
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 15;
    display: block;
    border: 0;
    background: rgba(0, 0, 0, 0.58);
    cursor: pointer;
  }

  .navigation-bar {
    display: grid;
  }
}
</style>
