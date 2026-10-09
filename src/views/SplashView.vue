<script setup>
import logo from '@/assets/images/fittrack_logo.png'
import { useSplashController } from '@/controllers/useSplashController'

useSplashController()
</script>

<template>
  <main class="splash">
    <img :src="logo" alt="Logo de FITTRACK" width="280" height="280" />
  </main>
</template>

<style scoped>
.splash {
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: var(--color-background);
}

img {
  width: 280px;
  height: 280px;
  object-fit: contain;
}
</style>
