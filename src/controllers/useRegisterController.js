import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

import * as Validators from '@/core/validators'
import { useAuthController } from './authController'
import { useSnackbarController } from './snackbarController'

export function useRegisterController() {
  const router = useRouter()
  const auth = useAuthController()
  const snackbar = useSnackbarController()

  const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmation: '',
    acceptTerms: false,
  })
  const errors = reactive({ name: null, email: null, password: null, confirmation: null })
  const isLoading = computed(() => auth.isLoading)

  function validate() {
    errors.name = Validators.required(form.name)
    errors.email = Validators.email(form.email)
    errors.password = Validators.password(form.password)
    errors.confirmation = Validators.confirmPassword(form.confirmation, form.password)
    return Object.values(errors).every((error) => !error)
  }

  async function register() {
    if (isLoading.value || !validate()) return
    if (!form.acceptTerms) {
      snackbar.show('Debes aceptar los términos y condiciones.')
      return
    }

    auth.beginRegistration({
      name: form.name,
      email: form.email,
      password: form.password,
    })
    await router.replace({ name: 'personalization' })
  }

  function goBack() {
    router.back()
  }

  return { form, errors, isLoading, register, goBack }
}
