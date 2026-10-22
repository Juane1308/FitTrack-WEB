import { reactive, ref } from 'vue'

import * as Validators from '@/core/validators'
import { ProfileRepository } from '@/repositories/profileRepository'
import { useSnackbarController } from './snackbarController'

export function useChangePasswordController(repository = new ProfileRepository()) {
  const snackbar = useSnackbarController()
  const form = reactive({ currentPassword: '', newPassword: '', confirmation: '' })
  const errors = reactive({ currentPassword: null, newPassword: null, confirmation: null })
  const isSaving = ref(false)

  function validate() {
    errors.currentPassword = Validators.required(form.currentPassword, 'Ingresa tu contraseña actual.')
    errors.newPassword = Validators.password(form.newPassword)
    errors.confirmation = Validators.confirmPassword(form.confirmation, form.newPassword)
    return Object.values(errors).every((error) => !error)
  }

  async function changePassword() {
    if (isSaving.value || !validate()) return
    isSaving.value = true
    try {
      await repository.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      Object.assign(form, { currentPassword: '', newPassword: '', confirmation: '' })
      snackbar.show('Contraseña actualizada. Cerramos tus otras sesiones abiertas.')
    } catch (exception) {
      if (exception.code === 'wrongPassword') errors.currentPassword = 'La contraseña actual no es correcta.'
      else snackbar.show('No fue posible cambiar la contraseña. Intenta de nuevo.')
    } finally {
      isSaving.value = false
    }
  }

  return { form, errors, isSaving, changePassword }
}
