<script setup>
import logo from '@/assets/images/fittrack_logo.png'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
})
</script>

<template>
  <main class="auth-layout">
    <div class="auth-content">
      <img :src="logo" alt="Logo de FITTRACK" width="230" height="170" />
      <h1>{{ title }}</h1>
      <p class="muted">{{ subtitle }}</p>
      <slot />
    </div>
  </main>
</template>

<style scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.auth-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 460px;
}

img {
  align-self: center;
  width: 230px;
  height: 170px;
  object-fit: contain;
}

h1 {
  margin-top: 16px;
  font-size: 24px;
  font-weight: 900;
  text-align: center;
}

p {
  margin: 8px 0 24px;
  font-size: 14px;
  text-align: center;
}
</style>
