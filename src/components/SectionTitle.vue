<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
})
</script>

<template>
  <div class="section-title">
    <h2>{{ title }}</h2>
    <p v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<style scoped>
h2 {
  font-size: 22px;
  font-weight: 800;
}

p {
  margin-top: 4px;
  font-size: 14px;
  color: var(--color-subtle-text);
}
</style>
