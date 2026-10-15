// Mismos códigos que AuthResultStatus del frontend (src/models/AuthResult.js).
const AuthStatus = Object.freeze({
  success: 'success',
  emailAlreadyRegistered: 'emailAlreadyRegistered',
  invalidCredentials: 'invalidCredentials',
  inactiveAccount: 'inactiveAccount',
});

module.exports = { AuthStatus };
