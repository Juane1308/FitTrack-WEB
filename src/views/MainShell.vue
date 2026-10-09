<script setup>
import { ChartLine, Dumbbell, House, User, Utensils } from 'lucide-vue-next'

import ContextualChatButton from '@/components/ContextualChatButton.vue'
import { AppSection } from '@/core/constants'
import { useMainShellController } from '@/controllers/useMainShellController'

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
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>

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
}

.navigation-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: var(--nav-height);
  padding-bottom: env(safe-area-inset-bottom);
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
</style>
