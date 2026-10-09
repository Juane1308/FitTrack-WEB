import { AuthResultStatus } from '@/models'

export function authErrorMessage(status) {
  switch (status) {
    case AuthResultStatus.emailAlreadyRegistered:
      return 'Este correo ya está registrado.'
    case AuthResultStatus.invalidCredentials:
      return 'Correo o contraseña incorrectos.'
    case AuthResultStatus.inactiveAccount:
      return 'La cuenta no está activa.'
    default:
      return ''
  }
}
