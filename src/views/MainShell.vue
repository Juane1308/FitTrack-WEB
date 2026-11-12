<script setup>
import { Bell, ChartLine, Dumbbell, House, Menu, User, Utensils, X } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import ContextualChatButton from '@/components/ContextualChatButton.vue'
import { AppSection } from '@/core/constants'
import { useMainShellController } from '@/controllers/useMainShellController'
import logo from '@/assets/images/fittrack_logo.png'

const { sections, currentSection, chatContext } = useMainShellController()
const sidebarOpen = ref(typeof window === 'undefined' || window.innerWidth > 900)

function handleViewportChange() {
  if (window.innerWidth <= 900) sidebarOpen.value = false
}

onMounted(() => window.addEventListener('resize', handleViewportChange))
onBeforeUnmount(() => window.removeEventListener('resize', handleViewportChange))

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

      <nav class="sidebar-navigation" aria-label="Navegación principal">
        <RouterLink
          v-for="section in sections"
          :key="section.key"
          :to="{ name: section.key }"
          class="sidebar-link"
          :class="{ selected: currentSection === section.key }"
          :aria-current="currentSection === section.key ? 'page' : undefined"
          @click="closeSidebarOnMobile"
        >
          <component :is="icons[section.key]" :size="18" aria-hidden="true" />
          <span>{{ section.label }}</span>
        </RouterLink>
      </nav>

    </aside>

    <main class="main-content" :class="{ 'sidebar-collapsed': !sidebarOpen, 'home-content': currentSection === AppSection.home }">
      <header class="topbar">
        <RouterLink :to="{ name: 'home' }" class="topbar-brand" aria-label="FitTrack, ir al inicio">
          <img :src="logo" alt="FitTrack" />
        </RouterLink>
        <nav class="desktop-navigation" aria-label="Navegación principal">
          <RouterLink
            v-for="section in sections"
            :key="section.key"
            :to="{ name: section.key }"
            class="desktop-link"
            :class="{ selected: currentSection === section.key }"
            :aria-current="currentSection === section.key ? 'page' : undefined"
          >
            <component :is="icons[section.key]" :size="17" aria-hidden="true" />
            <span>{{ section.label }}</span>
          </RouterLink>
        </nav>
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
  overflow-x: clip;
  background: var(--color-background);
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: 230px;
  height: 100dvh;
  padding: 22px 14px 28px;
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
  margin-bottom: 30px;
}

.brand img {
  width: 164px;
  max-height: 50px;
  object-fit: contain;
}

.sidebar-navigation {
  display: grid;
  gap: 9px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 50px;
  padding: 0 16px;
  border-radius: 12px;
  color: #c7d2df;
  font-size: 15px;
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
  margin-left: 230px;
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
  justify-content: flex-end;
  gap: 18px;
  height: 72px;
  padding: 0 clamp(22px, 3vw, 42px);
  box-sizing: border-box;
}

.topbar-brand,
.desktop-navigation {
  display: none;
}

.topbar-brand img {
  display: block;
  width: 142px;
  max-height: 42px;
  object-fit: contain;
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
    position: sticky;
    top: 0;
    z-index: 25;
    justify-content: flex-start;
    height: 74px;
    padding: 0 20px;
    border-bottom: 1px solid var(--color-card-border);
    background: rgb(6 11 15 / 94%);
    backdrop-filter: blur(14px);
  }

  .notification-button {
    margin-left: auto;
  }

  .profile-button {
    width: 42px;
    height: 42px;
  }

  .profile-button svg {
    width: 21px;
    height: 21px;
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

@media (max-width: 520px) {
  .topbar {
    gap: 10px;
    height: 64px;
    padding: 0 14px;
  }

  .menu-button {
    width: 40px;
    height: 40px;
  }

  .notification-button svg {
    width: 24px;
    height: 24px;
  }

  .profile-button {
    width: 38px;
    height: 38px;
  }

  .navigation-bar {
    min-height: 64px;
  }

  .indicator {
    width: 48px;
    height: 28px;
  }

  .label {
    font-size: 10px;
  }
}

@media (min-width: 901px) {
  .sidebar {
    display: none;
  }

  .main-content,
  .main-content.sidebar-collapsed {
    margin-left: 0;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 25;
    justify-content: space-between;
    height: 66px;
    border-bottom: 1px solid var(--color-card-border);
    background: rgb(6 11 15 / 94%);
    backdrop-filter: blur(14px);
  }

  .topbar-brand {
    display: block;
    flex: 0 0 150px;
  }

  .desktop-navigation {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .desktop-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 0 13px;
    border-radius: 9px;
    color: var(--color-muted-text);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color .18s, color .18s;
  }

  .desktop-link:hover,
  .desktop-link.selected {
    background: var(--color-indicator);
    color: var(--color-primary);
  }

  .desktop-link:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .menu-button {
    display: none;
  }

  .site-header .profile-button,
  .profile-button {
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-primary);
    border-radius: 50%;
    color: var(--color-muted-text);
    text-decoration: none;
  }

  .profile-button svg {
    width: 20px;
    height: 20px;
  }
}
</style>
