<script setup>
import { useSnackbarController } from '@/controllers/snackbarController'

const snackbar = useSnackbarController()
</script>

<template>
  <Transition name="snackbar">
    <div v-if="snackbar.visible" class="snackbar" role="status" aria-live="polite">
      {{ snackbar.message }}
    </div>
  </Transition>
</template>

<style scoped>
.snackbar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 100;
  transform: translateX(-50%);
  width: min(560px, calc(100% - 32px));
  padding: 14px 18px;
  border-radius: 8px;
  background: #e0f0e8;
  color: #0f1c17;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.snackbar-enter-active,
.snackbar-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.snackbar-enter-from,
.snackbar-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}
</style>
