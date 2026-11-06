<script setup>
import { computed, nextTick, ref } from 'vue'
import { Send, Sparkles, X } from 'lucide-vue-next'

import { apiRequest } from '@/repositories/apiClient'
import { APP_SECTIONS } from '@/core/constants'
import assistantLogo from '@/assets/images/ai-assistant-logo.png'

const props = defineProps({
  context: { type: Object, required: true },
})

const open = ref(false)
const draft = ref('')
const isSending = ref(false)
const error = ref('')
const messages = ref([
  {
    role: 'assistant',
    text: 'Hola. Puedo buscar ejercicios por grupo muscular o recomendar recetas según tus restricciones alimentarias.',
    items: [],
  },
])
const sectionLabel = computed(() => APP_SECTIONS[props.context.section].label)

function openChat() {
  open.value = true
}

async function sendMessage() {
  const text = draft.value.trim()
  if (!text || isSending.value) return

  messages.value.push({ role: 'user', text, items: [] })
  draft.value = ''
  error.value = ''
  isSending.value = true

  try {
    const result = await apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text, section: props.context.section }),
    })
    messages.value.push({ role: 'assistant', text: result.message, items: result.items ?? [] })
    await nextTick()
  } catch (exception) {
    error.value = exception.message || 'No fue posible consultar la asistencia IA.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="chat-fab"
    title="Asistencia IA"
    :aria-label="`Abrir asistencia IA de ${sectionLabel}`"
    @click="openChat"
  >
    <img class="assistant-logo" :src="assistantLogo" alt="" aria-hidden="true" />
  </button>

  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="backdrop" @click.self="open = false" @keydown.esc="open = false">
        <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="chat-sheet-title">
          <div class="drag-handle" aria-hidden="true" />
          <div class="sheet-header">
            <Sparkles :size="24" class="sparkles" aria-hidden="true" />
            <h2 id="chat-sheet-title">Asistente FITTRACK</h2>
            <button type="button" class="close-button" aria-label="Cerrar asistencia IA" @click="open = false">
              <X :size="20" />
            </button>
          </div>
          <p class="context-label">Contexto actual: {{ sectionLabel }}</p>

          <div class="messages" aria-live="polite">
            <div v-for="(message, index) in messages" :key="`${message.role}-${index}`" class="message" :class="`message-${message.role}`">
              <p>{{ message.text }}</p>
              <ul v-if="message.items.length" class="result-list">
                <li v-for="item in message.items" :key="item.id">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.detail }}</small>
                  <small>{{ item.metadata }}</small>
                </li>
              </ul>
            </div>
            <p v-if="isSending" class="typing">Buscando opciones…</p>
          </div>

          <p v-if="error" class="chat-error" role="alert">{{ error }}</p>

          <form class="composer" @submit.prevent="sendMessage">
            <label class="sr-only" for="assistant-message">Escribe tu pregunta</label>
            <input
              id="assistant-message"
              v-model="draft"
              type="text"
              maxlength="500"
              autocomplete="off"
              placeholder="Ej: dame 4 ejercicios para espalda"
              :disabled="isSending"
            />
            <button type="submit" class="send-button" aria-label="Enviar pregunta" :disabled="!draft.trim() || isSending">
              <Send :size="19" />
            </button>
          </form>
          <p class="chat-disclaimer">Las recomendaciones consideran los datos de tu perfil. Revisa siempre las etiquetas si tienes una alergia o condición médica.</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-fab {
  position: fixed;
  right: 18px;
  bottom: 20px;
  z-index: 20;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  padding: 0;
  overflow: hidden;
  border: none;
  border-radius: 50%;
  background: #030806;
  color: #fff;
  box-shadow: 0 0 18px rgba(53, 240, 108, 0.45), 0 4px 14px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.chat-fab:hover {
  filter: brightness(1.12);
}

.chat-fab:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}

.assistant-logo {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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

.close-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-left: auto;
  border: 1px solid var(--color-card-border);
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.context-label,
.chat-disclaimer,
.typing {
  margin: 0;
  color: var(--color-muted-text);
  font-size: 13px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(48vh, 430px);
  overflow-y: auto;
  padding: 4px 2px;
}

.message {
  width: fit-content;
  max-width: 92%;
  padding: 11px 13px;
  border-radius: 14px;
  line-height: 1.45;
}

.message p {
  margin: 0;
}

.message-assistant {
  border: 1px solid var(--color-card-border);
  background: #0d1914;
}

.message-user {
  align-self: flex-end;
  background: var(--color-primary);
  color: #03120d;
}

.result-list {
  display: grid;
  gap: 7px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.result-list li {
  display: grid;
  gap: 2px;
  padding: 9px 10px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.22);
}

.result-list small {
  color: var(--color-muted-text);
  font-size: 12px;
}

.message-user .result-list small {
  color: #164d3c;
}

.chat-error {
  margin: 0;
  color: #ff9c9c;
  font-size: 13px;
}

.composer {
  display: flex;
  gap: 8px;
}

.composer input {
  min-width: 0;
  flex: 1;
  height: 44px;
  padding: 0 13px;
  border: 1px solid var(--color-input-border);
  border-radius: 12px;
  outline: none;
  background: var(--color-background);
  color: var(--color-text);
}

.composer input:focus {
  border-color: var(--color-primary);
}

.send-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 12px;
  background: var(--color-primary);
  color: #03120d;
  cursor: pointer;
}

.send-button:disabled {
  cursor: default;
  opacity: .5;
}

.chat-disclaimer {
  line-height: 1.35;
}

.sparkles {
  color: var(--color-primary);
}

h2 {
  font-size: 22px;
  font-weight: 800;
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
