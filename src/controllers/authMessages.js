import { AuthResultStatus } from '@/models'

export function authErrorMessage(status) {
  switch (status) {
    case AuthResultStatus.emailAlreadyRegistered:
      return 'Este correo ya está registrado.'
    case AuthResultStatus.invalidCredentials:
      return 'Correo o contraseña incorrectos.'
    case AuthResultStatus.inactiveAccount:
      return 'La cuenta no está activa.'
    case AuthResultStatus.backendUnavailable:
      return 'No fue posible conectar con el servidor. Inténtalo de nuevo.'
    case AuthResultStatus.invalidData:
      return 'Revisa los datos ingresados.'
    default:
      return ''
  }
}
