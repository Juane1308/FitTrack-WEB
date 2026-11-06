import crypto from 'node:crypto'

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${passwordHash}`
}

export function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash).split(':')
  if (!salt || !expectedHash) return false

  const actualHash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'))
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
