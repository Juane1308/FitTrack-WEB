<script setup>
import { Lock, LockKeyhole, Mail, User } from 'lucide-vue-next'

import AppDialog from '@/components/AppDialog.vue'
import LoadingButton from '@/components/LoadingButton.vue'
import TextField from '@/components/TextField.vue'
import { useRegisterController } from '@/controllers/useRegisterController'
import AuthLayout from './AuthLayout.vue'

const { form, errors, isLoading, showSuccessDialog, register, confirmSuccess, goBack } =
  useRegisterController()
</script>

<template>
  <AuthLayout title="Crea tu cuenta" subtitle="Comienza a construir hábitos sostenibles.">
    <form class="auth-form" novalidate @submit.prevent="register">
      <TextField
        v-model="form.name"
        label="Nombre"
        autocomplete="name"
        :icon="User"
        :error="errors.name"
      />
      <TextField
        v-model="form.email"
        label="Correo electrónico"
        type="email"
        autocomplete="email"
        :icon="Mail"
        :error="errors.email"
      />
      <TextField
        v-model="form.password"
        label="Contraseña"
        type="password"
        autocomplete="new-password"
        :icon="Lock"
        :error="errors.password"
      />
      <TextField
        v-model="form.confirmation"
        label="Confirmar contraseña"
        type="password"
        autocomplete="new-password"
        :icon="LockKeyhole"
        :error="errors.confirmation"
      />
      <label class="terms">
        <input v-model="form.acceptTerms" type="checkbox" :disabled="isLoading" />
        Acepto los términos y condiciones.
      </label>
      <LoadingButton :loading="isLoading">Crear cuenta</LoadingButton>
      <button type="button" class="btn btn-text" :disabled="isLoading" @click="goBack">
        Ya tengo una cuenta
      </button>
    </form>

    <AppDialog
      :open="showSuccessDialog"
      title="Cuenta creada correctamente."
      action-label="Continuar"
      @action="confirmSuccess"
    >
      Ahora puedes iniciar sesión en FITTRACK.
    </AppDialog>
  </AuthLayout>
</template>

<style scoped src="./auth-form.css"></style>
<style scoped>
.terms {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  cursor: pointer;
}

.terms input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}
</style>
