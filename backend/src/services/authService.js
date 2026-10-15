const defaultPrisma = require('../config/prisma');
const { AuthStatus } = require('../utils/authStatus');
const { hashPassword, verifyPassword } = require('../utils/password');

const DEFAULT_GOAL = 'Definir objetivo';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Convierte el registro de la BD al AppUser que usa el frontend.
function toAppUser(usuario) {
  return {
    id: usuario.id.toString(),
    name: usuario.nombre_completo,
    email: usuario.correo,
    goal: usuario.perfiles?.objetivos?.nombre ?? DEFAULT_GOAL,
  };
}

const userInclude = { perfiles: { include: { objetivos: true } } };

function createAuthService(prisma = defaultPrisma) {
  // El índice único de la BD es LOWER(correo), por eso se busca sin distinguir mayúsculas.
  function findByEmail(email) {
    return prisma.usuarios.findFirst({
      where: { correo: { equals: normalizeEmail(email), mode: 'insensitive' } },
      include: userInclude,
    });
  }

  async function register({ name, email, password }) {
    if (await findByEmail(email)) {
      return { status: AuthStatus.emailAlreadyRegistered };
    }

    const now = new Date();
    const usuario = await prisma.usuarios.create({
      data: {
        nombre_completo: name.trim(),
        correo: normalizeEmail(email),
        contrasena_hash: await hashPassword(password),
        acepto_terminos: true,
        fecha_acepto_terminos: now,
        perfiles: { create: {} },
        configuracion_usuario: { create: {} },
      },
      include: userInclude,
    });
    return { status: AuthStatus.success, user: toAppUser(usuario) };
  }

  async function login({ email, password }) {
    const usuario = await findByEmail(email);
    if (!usuario || !(await verifyPassword(password, usuario.contrasena_hash))) {
      return { status: AuthStatus.invalidCredentials };
    }
    if (!usuario.activo) {
      return { status: AuthStatus.inactiveAccount };
    }

    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { ultimo_acceso: new Date() },
    });
    return { status: AuthStatus.success, user: toAppUser(usuario) };
  }

  async function requestPasswordReset(_email) {
    // Aún no hay servicio de correo. No se revela si la dirección existe.
  }

  return { register, login, requestPasswordReset };
}

module.exports = { createAuthService, toAppUser };
