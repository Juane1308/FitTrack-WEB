<script setup>
import { ArrowLeft } from 'lucide-vue-next'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['retry'])
</script>

<template>
  <section class="section-page profile-subpage" :aria-label="title">
    <header class="subpage-header">
      <RouterLink :to="{ name: 'profile' }" class="back-link" aria-label="Volver al perfil">
        <ArrowLeft :size="26" aria-hidden="true" />
      </RouterLink>
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="muted">{{ subtitle }}</p>
      </div>
    </header>

    <div v-if="isLoading" class="subpage-state" role="status">Cargando…</div>
    <div v-else-if="error" class="subpage-state" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-filled" @click="$emit('retry')">Reintentar</button>
    </div>
    <slot v-else />
  </section>
</template>

<style scoped>
.profile-subpage {
  max-width: 760px;
}

.subpage-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
}

.back-link {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-top: 2px;
  border-radius: 50%;
  color: var(--color-text);
}

.back-link:hover,
.back-link:focus-visible {
  background: var(--color-indicator);
}

h1 {
  font-size: clamp(26px, 5vw, 36px);
}

.subpage-header p {
  margin-top: 4px;
}

.subpage-state {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 38px 20px;
  border: 1px dashed var(--color-card-border);
  border-radius: 16px;
  color: var(--color-muted-text);
  text-align: center;
}
</style>
