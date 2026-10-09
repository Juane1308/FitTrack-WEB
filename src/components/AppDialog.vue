<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  actionLabel: { type: String, default: 'Aceptar' },
})

const emit = defineEmits(['action'])
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="backdrop" @keydown.esc="emit('action')">
      <div class="dialog" role="alertdialog" aria-modal="true" :aria-label="title">
        <h2>{{ title }}</h2>
        <p><slot /></p>
        <div class="actions">
          <button type="button" class="btn btn-text" autofocus @click="emit('action')">
            {{ actionLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}

.dialog {
  width: min(400px, 100%);
  padding: 24px;
  border-radius: 28px;
  background: var(--color-surface);
}

h2 {
  font-size: 22px;
  font-weight: 600;
}

p {
  margin-top: 16px;
  color: var(--color-muted-text);
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
