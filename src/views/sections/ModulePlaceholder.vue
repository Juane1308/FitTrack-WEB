<script setup>
import { computed } from 'vue'

import AppCard from '@/components/AppCard.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import { APP_SECTIONS } from '@/core/constants'

const props = defineProps({
  section: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
})

const info = computed(() => APP_SECTIONS[props.section])
</script>

<template>
  <section class="section-page">
    <SectionTitle :title="info.label" :subtitle="info.description" />
    <AppCard class="placeholder-card">
      <div class="avatar">
        <component :is="icon" :size="32" aria-hidden="true" />
      </div>
      <h3>Módulo en construcción</h3>
      <p class="muted">Esta sección todavía no está disponible.</p>
    </AppCard>
    <slot />
  </section>
</template>

<style scoped>
.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
  text-align: center;
}

.avatar {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(0, 200, 120, 0.12);
  color: var(--color-primary);
}

h3 {
  margin-top: 18px;
  font-size: 22px;
  font-weight: 800;
}

p {
  margin-top: 8px;
  font-size: 14px;
}
</style>
