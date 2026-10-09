import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import * as Validators from '@/core/validators'
import { useAuthController } from './authController'
import { useSnackbarController } from './snackbarController'

export function useForgotPasswordController() {
  const router = useRouter()
  const auth = useAuthController()
  const snackbar = useSnackbarController()

  const form = reactive({ email: '' })
  const errors = reactive({ email: null })
  const isLoading = ref(false)

  async function requestReset() {
    errors.email = Validators.email(form.email)
    if (isLoading.value || errors.email) return
    isLoading.value = true
    await auth.requestPasswordReset(form.email)
    isLoading.value = false
    snackbar.show('Se ha enviado el enlace de recuperación a tu correo.')
  }

  function goBack() {
    router.back()
  }

  return { form, errors, isLoading, requestReset, goBack }
}
