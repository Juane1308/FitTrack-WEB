<script setup>
defineProps({
  padding: { type: String, default: '18px' },
})
</script>

<template>
  <div class="app-card" :style="{ padding }">
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background: var(--color-surface);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}
</style>
