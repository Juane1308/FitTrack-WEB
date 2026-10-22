<script setup>
import { ChevronDown } from 'lucide-vue-next'

import { onEnter } from '@/controllers/onEnter'
import { useProfileHelpController } from '@/controllers/useProfileHelpController'
import ProfileSubpage from './ProfileSubpage.vue'

const { groups, isLoading, error, loadFaqs } = useProfileHelpController()

onEnter(loadFaqs)
</script>

<template>
  <ProfileSubpage
    title="Ayuda"
    subtitle="Preguntas frecuentes sobre FitTrack."
    :is-loading="isLoading"
    :error="error"
    @retry="loadFaqs"
  >
    <div class="profile-form">
      <section v-for="group in groups" :key="group.category" class="form-card" :aria-label="group.category">
        <h2>{{ group.category }}</h2>
        <details v-for="faq in group.items" :key="faq.id" class="faq">
          <summary>
            <span>{{ faq.question }}</span>
            <ChevronDown :size="20" aria-hidden="true" />
          </summary>
          <p>{{ faq.answer }}</p>
        </details>
      </section>
      <p v-if="!groups.length" class="muted">Todavía no hay preguntas frecuentes publicadas.</p>
      <p class="muted help-note">¿No encontraste tu respuesta? Usa el botón del asistente en la esquina inferior.</p>
    </div>
  </ProfileSubpage>
</template>

<style scoped src="./profile-form.css"></style>
<style scoped>
.faq {
  border-top: 1px solid var(--color-card-border);
}

.faq summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}

.faq summary::-webkit-details-marker {
  display: none;
}

.faq summary svg {
  flex: none;
  color: var(--color-primary);
  transition: transform 0.15s;
}

.faq[open] summary svg {
  transform: rotate(180deg);
}

.faq p {
  padding-bottom: 14px;
  color: var(--color-muted-text);
  line-height: 1.5;
}

.help-note {
  text-align: center;
}
</style>
