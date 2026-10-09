<script setup>
import { computed, ref } from 'vue'
import { MessageCircle, Sparkles } from 'lucide-vue-next'

import { APP_SECTIONS } from '@/core/constants'

const props = defineProps({
  context: { type: Object, required: true },
})

const open = ref(false)
const sectionLabel = computed(() => APP_SECTIONS[props.context.section].label)
</script>

<template>
  <button
    type="button"
    class="chat-fab"
    title="Asistente virtual"
    :aria-label="`Abrir asistente virtual de ${sectionLabel}`"
    @click="open = true"
  >
    <MessageCircle :size="24" />
  </button>

  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="backdrop" @click.self="open = false" @keydown.esc="open = false">
        <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="chat-sheet-title">
          <div class="drag-handle" aria-hidden="true" />
          <div class="sheet-header">
            <Sparkles :size="24" class="sparkles" aria-hidden="true" />
            <h2 id="chat-sheet-title">Asistente FITTRACK</h2>
          </div>
          <p>Contexto actual: {{ sectionLabel }}</p>
          <p>
            La interfaz del chatbot está preparada. La conversación MOCK se implementará en la
            etapa 8.
          </p>
          <div>
            <button type="button" class="btn btn-filled" autofocus @click="open = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-fab {
  position: fixed;
  right: 18px;
  bottom: calc(var(--nav-height) + 16px);
  z-index: 20;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 16px;
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.chat-fab:hover {
  filter: brightness(1.1);
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(640px, 100%);
  padding: 8px 24px 24px;
  border-radius: 28px 28px 0 0;
  background: var(--color-surface);
}

.drag-handle {
  width: 32px;
  height: 4px;
  margin: 14px auto 12px;
  border-radius: 2px;
  background: var(--color-muted-text);
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sparkles {
  color: var(--color-primary);
}

h2 {
  font-size: 22px;
  font-weight: 800;
}

.sheet > div:last-child {
  margin-top: 6px;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
