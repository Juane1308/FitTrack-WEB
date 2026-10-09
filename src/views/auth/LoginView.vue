<script setup>
import { Lock, Mail } from 'lucide-vue-next'

import LoadingButton from '@/components/LoadingButton.vue'
import TextField from '@/components/TextField.vue'
import { useLoginController } from '@/controllers/useLoginController'
import AuthLayout from './AuthLayout.vue'

const { form, errors, isLoading, login } = useLoginController()
</script>

<template>
  <AuthLayout title="Inicia sesión" subtitle="Continúa con tu seguimiento en FITTRACK.">
    <form class="auth-form" novalidate @submit.prevent="login">
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
        autocomplete="current-password"
        :icon="Lock"
        :error="errors.password"
      />
      <RouterLink v-slot="{ navigate }" :to="{ name: 'forgot-password' }" custom>
        <button type="button" class="btn btn-text end" :disabled="isLoading" @click="navigate">
          ¿Olvidaste tu contraseña?
        </button>
      </RouterLink>
      <LoadingButton :loading="isLoading">Iniciar sesión</LoadingButton>
      <div class="inline-row">
        <span>¿No tienes una cuenta?</span>
        <RouterLink v-slot="{ navigate }" :to="{ name: 'register' }" custom>
          <button type="button" class="btn btn-text" :disabled="isLoading" @click="navigate">
            Regístrate
          </button>
        </RouterLink>
      </div>
    </form>
  </AuthLayout>
</template>

<style scoped src="./auth-form.css"></style>
