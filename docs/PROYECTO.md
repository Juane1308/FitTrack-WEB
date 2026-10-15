# FITTRACK

Aplicación web para seguimiento del entrenamiento, alimentación y progreso físico.

## Estado actual

Etapas 1 y 2: proyecto base y autenticación conectada a PostgreSQL mediante la API del backend.

Incluye:

- Tema visual oscuro en español.
- Navegación principal: Inicio, Entrenar, Alimentación, Progreso y Perfil.
- Datos mock separados en modelos y repositorios.
- Arquitectura MVC: modelos, controladores (Pinia + composables) y vistas.
- Botón único y contextual del asistente virtual.
- Diseño responsive para móvil y escritorio.
- Login y registro contra PostgreSQL (API Express + Prisma), recuperación de contraseña y cierre de sesión.
- Contraseñas guardadas con bcrypt, nunca en texto plano.
- Identidad visual con logo FITTRACK.

## Tecnologías

- Vue 3 (`<script setup>`) y JavaScript.
- Vite.
- Vue Router.
- Pinia para gestión de estado.
- Vitest y Vue Test Utils.
- Node.js, Express, Prisma y PostgreSQL (Railway) en el backend.
- Git y GitHub.

## Requisitos

- Node.js 20 o superior y npm.

## Instalación y ejecución

Se necesitan dos terminales: una para la API (`backend/`) y otra para el frontend.

**1. API (backend)** — requiere `backend/.env` con `DATABASE_URL` (ver README principal, sección *Base de datos*):

```bash
cd backend
npm install
npm run db:deploy     # aplica las migraciones (solo la primera vez o si hay nuevas)
npm run db:generate
npm run db:seed       # crea/actualiza los usuarios demo
npm run dev           # API en http://localhost:3000/api
```

**2. Frontend** (desde la raíz del proyecto):

```bash
npm install
npm run dev           # http://localhost:5173
```

En modo desarrollo el frontend usa la API real: Vite redirige `/api` a `http://localhost:3000` (configurado en `.env.development` y `vite.config.js`). Si se borra `VITE_API_URL` de `.env.development`, vuelve a usar el MOCK en memoria.

### Usuarios demo

| Nombre | Correo               | Contraseña     | Objetivo            |
|--------|----------------------|----------------|---------------------|
| Juan   | `juan@fittrack.com`  | `FitTrack2026` | Ganar masa muscular |
| Samu   | `samu@fittrack.com`  | `FitTrack2026` | Perder peso         |
| Mutis  | `mutis@fittrack.com` | `FitTrack2026` | Mantenerse en forma |

`npm run db:seed` se puede ejecutar varias veces: si el usuario ya existe lo actualiza en lugar de duplicarlo.

### Pruebas

```bash
npm test                  # frontend (Vitest)
cd backend && npm test    # API (node:test, sin necesidad de base de datos)
```

## Entregables

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ localmente
```

## Arquitectura (MVC)

```text
src/
├── core/           # Constantes y validadores
├── models/         # MODELO: clases de datos (AppUser, Routine, AuthResult...)
├── repositories/   # MODELO: fuentes de datos mock o reales
├── controllers/    # CONTROLADOR: stores Pinia y controladores por pantalla
├── views/          # VISTA: pantallas (auth/, sections/, MainShell, Splash)
├── components/     # VISTA: componentes reutilizables
├── router/         # Rutas y guardas de autenticación
├── styles/         # Tema global
└── assets/         # Imágenes, íconos y fuentes
tests/              # Pruebas con Vitest
backend/            # API Express + Prisma (routes, controllers, services, prisma/seed.js)
```

Las vistas solo contienen plantilla y estilos; toda la lógica (validación, llamadas a repositorios, navegación) vive en `src/controllers/`.

## Ramas Git

- `main`: rama estable.
- `develop`: rama principal de desarrollo.

Las funcionalidades se desarrollarán en ramas `feature/...` y se integrarán en `develop`.

## API de autenticación

| Método | Ruta                        | Respuesta                                                                  |
|--------|-----------------------------|----------------------------------------------------------------------------|
| POST   | `/api/auth/register`        | `201 success` · `409 emailAlreadyRegistered` · `400` datos inválidos       |
| POST   | `/api/auth/login`           | `200 success` · `401 invalidCredentials` · `403 inactiveAccount`           |
| POST   | `/api/auth/forgot-password` | `202` (aún no envía correos; no revela si el correo existe)                |
| GET    | `/api/health`               | `200 { status: "ok" }`                                                     |

Las contraseñas se guardan con **bcrypt** en `usuarios.contrasena_hash`. El registro crea también el `perfil` y la `configuracion_usuario` del usuario. El inicio de sesión actualiza `usuarios.ultimo_acceso`.

El backend sigue la misma separación MVC: `routes/` → `controllers/` (HTTP) → `services/` (lógica y acceso con Prisma) → base de datos.

Pendiente: la sesión vive en memoria del navegador (recargar la página la cierra); los tokens de sesión (`sesiones`) y el envío de correos de recuperación se implementarán más adelante.
