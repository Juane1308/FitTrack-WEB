import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import * as Validators from '@/core/validators'
import { useAuthController } from './authController'
import { authErrorMessage } from './authMessages'
import { useSnackbarController } from './snackbarController'

export function useLoginController() {
  const router = useRouter()
  const route = useRoute()
  const auth = useAuthController()
  const snackbar = useSnackbarController()

  const form = reactive({ email: '', password: '' })
  const errors = reactive({ email: null, password: null })
  const isLoading = computed(() => auth.isLoading)

  if (route.query.registered === '1') {
    form.email = String(route.query.email ?? '')
    snackbar.show('Cuenta creada. Inicia sesión con tu correo y contraseña.')
  }

  function validate() {
    errors.email = Validators.email(form.email)
    errors.password = Validators.required(form.password)
    return !errors.email && !errors.password
  }

  async function login() {
    if (isLoading.value || !validate()) return
    const result = await auth.login({ email: form.email, password: form.password })
    if (result.isSuccess) {
      router.replace({ name: result.user.profileCompleted ? 'home' : 'personalization' })
    } else {
      snackbar.show(authErrorMessage(result.status))
    }
  }

  return { form, errors, isLoading, login }
}
