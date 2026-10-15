// Usuarios de demostración. Se puede ejecutar varias veces: si el usuario
// ya existe, actualiza su nombre, contraseña y perfil en lugar de duplicarlo.
require('../src/config/env');
const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/utils/password');

const DEMO_PASSWORD = 'FitTrack2026';

const DEMO_USERS = [
  {
    nombre: 'Juan',
    correo: 'juan@fittrack.com',
    objetivo: 'ganar_masa',
    nivelActividad: 'moderado',
    lugar: 'gimnasio',
    estatura: 1.78,
    metaSemana: 4,
  },
  {
    nombre: 'Samu',
    correo: 'samu@fittrack.com',
    objetivo: 'perder_peso',
    nivelActividad: 'ligero',
    lugar: 'casa',
    estatura: 1.72,
    metaSemana: 3,
  },
  {
    nombre: 'Mutis',
    correo: 'mutis@fittrack.com',
    objetivo: 'mantenerse_forma',
    nivelActividad: 'activo',
    lugar: 'aire_libre',
    estatura: 1.75,
    metaSemana: 5,
  },
];

async function findIdByCode(model, codigo) {
  const row = await prisma[model].findUnique({ where: { codigo } });
  return row?.id ?? null;
}

async function seedUser(user, contrasenaHash) {
  const perfil = {
    objetivo_id: await findIdByCode('objetivos', user.objetivo),
    nivel_actividad_id: await findIdByCode('niveles_actividad', user.nivelActividad),
    lugar_entrenamiento_id: await findIdByCode('lugares_entrenamiento', user.lugar),
    estatura_m: user.estatura,
    meta_entrenamientos_semana: user.metaSemana,
  };

  const existing = await prisma.usuarios.findFirst({
    where: { correo: { equals: user.correo, mode: 'insensitive' } },
  });

  if (existing) {
    await prisma.usuarios.update({
      where: { id: existing.id },
      data: {
        nombre_completo: user.nombre,
        contrasena_hash: contrasenaHash,
        activo: true,
        perfiles: { upsert: { create: perfil, update: perfil } },
      },
    });
    return 'actualizado';
  }

  await prisma.usuarios.create({
    data: {
      nombre_completo: user.nombre,
      correo: user.correo,
      contrasena_hash: contrasenaHash,
      acepto_terminos: true,
      fecha_acepto_terminos: new Date(),
      perfiles: { create: perfil },
      configuracion_usuario: { create: {} },
    },
  });
  return 'creado';
}

async function main() {
  const contrasenaHash = await hashPassword(DEMO_PASSWORD);
  for (const user of DEMO_USERS) {
    const result = await seedUser(user, contrasenaHash);
    console.log(`${user.correo}: ${result}`);
  }
  console.log(`Contraseña de los usuarios demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
