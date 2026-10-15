// Mismas reglas que src/core/validators.js del frontend.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isFilled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function validateRegister({ name, email, password, acceptTerms }) {
  if (![name, email, password].every(isFilled)) return 'Por favor, completa todos los campos.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Ingresa un correo electrónico válido.';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (acceptTerms !== true) return 'Debes aceptar los términos y condiciones.';
  return null;
}

function validateLogin({ email, password }) {
  if (![email, password].every(isFilled)) return 'Por favor, completa todos los campos.';
  return null;
}

module.exports = { validateRegister, validateLogin };
