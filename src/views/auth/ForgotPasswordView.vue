<script setup>
import { Mail } from 'lucide-vue-next'

import LoadingButton from '@/components/LoadingButton.vue'
import TextField from '@/components/TextField.vue'
import { useForgotPasswordController } from '@/controllers/useForgotPasswordController'
import AuthLayout from './AuthLayout.vue'

const { form, errors, isLoading, requestReset, goBack } = useForgotPasswordController()
</script>

<template>
  <AuthLayout
    title="Recupera tu contraseña"
    subtitle="Ingresa tu correo y te ayudaremos a recuperar el acceso."
  >
    <form class="auth-form" novalidate @submit.prevent="requestReset">
      <TextField
        v-model="form.email"
        label="Correo electrónico"
        type="email"
        autocomplete="email"
        :icon="Mail"
        :error="errors.email"
      />
      <LoadingButton :loading="isLoading">Enviar enlace</LoadingButton>
      <button type="button" class="btn btn-text" :disabled="isLoading" @click="goBack">
        Volver al inicio de sesión
      </button>
    </form>
  </AuthLayout>
</template>

<style scoped src="./auth-form.css"></style>
