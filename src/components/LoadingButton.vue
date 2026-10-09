<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'submit' },
})
</script>

<template>
  <button :type="type" class="btn btn-filled" :disabled="loading" :aria-busy="loading">
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <slot v-else />
  </button>
</template>
