<script setup>
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  icon: { type: [Object, Function], default: null },
  error: { type: String, default: null },
  autocomplete: { type: String, default: undefined },
})

const id = useId()
const errorId = `${id}-error`
const obscured = ref(true)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && !obscured.value ? 'text' : props.type))
const toggleLabel = computed(() => (obscured.value ? 'Mostrar contraseña' : 'Ocultar contraseña'))
</script>

<template>
  <div class="text-field" :class="{ 'has-error': error }">
    <div class="control">
      <component :is="icon" v-if="icon" class="prefix" :size="20" aria-hidden="true" />
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? errorId : undefined"
        placeholder=" "
      />
      <label :for="id">{{ label }}</label>
      <button
        v-if="isPassword"
        type="button"
        class="suffix"
        :aria-label="toggleLabel"
        :title="toggleLabel"
        @click="obscured = !obscured"
      >
        <Eye v-if="obscured" :size="20" />
        <EyeOff v-else :size="20" />
      </button>
    </div>
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.control {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-input);
  transition: border-color 0.15s;
}

.control:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.has-error .control {
  border-color: var(--color-error);
}

.prefix {
  flex: none;
  margin-left: 14px;
  color: var(--color-muted-text);
}

input {
  flex: 1;
  min-width: 0;
  height: 56px;
  padding: 22px 14px 6px 12px;
  border: none;
  background: transparent;
  outline: none;
}

label {
  position: absolute;
  left: 46px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted-text);
  pointer-events: none;
  transition: top 0.15s, font-size 0.15s;
}

.control:not(:has(.prefix)) label {
  left: 12px;
}

input:focus + label,
input:not(:placeholder-shown) + label {
  top: 16px;
  font-size: 12px;
}

input:focus + label {
  color: var(--color-primary);
}

.suffix {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: 4px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-muted-text);
  cursor: pointer;
}

.suffix:hover {
  background: rgba(255, 255, 255, 0.06);
}

.error {
  margin: 6px 0 0 14px;
  font-size: 12px;
  color: var(--color-error);
}
</style>
