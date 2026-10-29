<script setup>
import { ChartLine, Dumbbell, House, User, Utensils } from 'lucide-vue-next'
import ContextualChatButton from '@/components/ContextualChatButton.vue'
import { AppSection } from '@/core/constants'
import { useMainShellController } from '@/controllers/useMainShellController'
import logo from '@/assets/images/fittrack_logo.png'

const { sections, currentSection, chatContext } = useMainShellController()
const primarySections = sections.filter(section => section.key !== AppSection.profile)
const icons = {
  [AppSection.home]: House,
  [AppSection.training]: Dumbbell,
  [AppSection.nutrition]: Utensils,
  [AppSection.progress]: ChartLine,
}
</script>

<template>
  <div class="shell">
    <header class="site-header">
      <RouterLink :to="{ name: 'home' }" class="brand" aria-label="FitTrack, ir al inicio">
        <img :src="logo" alt="FitTrack" />
      </RouterLink>

      <nav class="main-navigation" aria-label="Navegación principal">
        <RouterLink
          v-for="section in primarySections"
          :key="section.key"
          :to="{ name: section.key }"
          class="main-link"
          :class="{ selected: currentSection === section.key }"
          :aria-current="currentSection === section.key ? 'page' : undefined"
        >
          <component :is="icons[section.key]" :size="18" aria-hidden="true" />
          <span>{{ section.label }}</span>
        </RouterLink>
      </nav>

      <RouterLink :to="{ name: 'profile' }" class="profile-button" aria-label="Abrir perfil" :aria-current="currentSection === AppSection.profile ? 'page' : undefined">
        <User :size="20" aria-hidden="true" />
      </RouterLink>
    </header>

    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <ContextualChatButton :context="chatContext" />
  </div>
</template>
