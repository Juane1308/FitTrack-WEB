const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function required(value, message = 'Por favor, completa todos los campos.') {
  if (value == null || String(value).trim() === '') return message
  return null
}

export function email(value) {
  const requiredError = required(value)
  if (requiredError) return requiredError
  if (!EMAIL_PATTERN.test(value.trim())) return 'Ingresa un correo electrónico válido.'
  return null
}

export function password(value) {
  const requiredError = required(value)
  if (requiredError) return requiredError
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return null
}

export function confirmPassword(value, originalPassword) {
  const requiredError = required(value)
  if (requiredError) return requiredError
  if (value !== originalPassword) return 'Las contraseñas no coinciden.'
  return null
}
