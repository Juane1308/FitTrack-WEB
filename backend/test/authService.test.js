const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { createAuthService } = require('../src/services/authService');
const { AuthStatus } = require('../src/utils/authStatus');

// Prisma en memoria con solo lo que usa authService.
function fakePrisma() {
  const rows = [];
  let nextId = 1n;
  return {
    rows,
    usuarios: {
      async findFirst({ where }) {
        const email = where.correo.equals.toLowerCase();
        return rows.find((row) => row.correo.toLowerCase() === email) ?? null;
      },
      async create({ data }) {
        const row = {
          id: nextId++,
          nombre_completo: data.nombre_completo,
          correo: data.correo,
          contrasena_hash: data.contrasena_hash,
          activo: true,
          perfiles: null,
        };
        rows.push(row);
        return row;
      },
      async update({ where, data }) {
        const row = rows.find((r) => r.id === where.id);
        Object.assign(row, data);
        return row;
      },
    },
  };
}

describe('authService', () => {
  it('registra un usuario y permite iniciar sesión sin guardar la contraseña original', async () => {
    const prisma = fakePrisma();
    const service = createAuthService(prisma);

    const registration = await service.register({
      name: ' Ana ',
      email: 'Ana@Example.com',
      password: 'ClaveSegura123',
    });
    assert.equal(registration.status, AuthStatus.success);
    assert.deepEqual(registration.user, {
      id: '1',
      name: 'Ana',
      email: 'ana@example.com',
      goal: 'Definir objetivo',
    });
    assert.notEqual(prisma.rows[0].contrasena_hash, 'ClaveSegura123');

    const invalid = await service.login({ email: 'ana@example.com', password: 'incorrecta' });
    assert.equal(invalid.status, AuthStatus.invalidCredentials);

    const valid = await service.login({ email: 'ANA@example.com', password: 'ClaveSegura123' });
    assert.equal(valid.status, AuthStatus.success);
    assert.equal(valid.user.name, 'Ana');
    assert.ok(prisma.rows[0].ultimo_acceso instanceof Date);
  });

  it('rechaza correos duplicados sin distinguir mayúsculas', async () => {
    const service = createAuthService(fakePrisma());
    await service.register({ name: 'Ana', email: 'ana@example.com', password: 'ClaveSegura123' });

    const duplicate = await service.register({
      name: 'Otra Ana',
      email: 'ANA@example.com',
      password: 'OtraClave123',
    });
    assert.equal(duplicate.status, AuthStatus.emailAlreadyRegistered);
  });

  it('no deja entrar a cuentas inactivas', async () => {
    const prisma = fakePrisma();
    const service = createAuthService(prisma);
    await service.register({ name: 'Ana', email: 'ana@example.com', password: 'ClaveSegura123' });
    prisma.rows[0].activo = false;

    const result = await service.login({ email: 'ana@example.com', password: 'ClaveSegura123' });
    assert.equal(result.status, AuthStatus.inactiveAccount);
  });
});
