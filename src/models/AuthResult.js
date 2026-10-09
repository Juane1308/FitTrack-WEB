export const AuthResultStatus = Object.freeze({
  success: 'success',
  emailAlreadyRegistered: 'emailAlreadyRegistered',
  invalidCredentials: 'invalidCredentials',
  inactiveAccount: 'inactiveAccount',
})

export class AuthResult {
  constructor({ status, user = null }) {
    this.status = status
    this.user = user
  }

  get isSuccess() {
    return this.status === AuthResultStatus.success
  }
}
