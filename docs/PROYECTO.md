# FITTRACK

Aplicación web para seguimiento del entrenamiento, alimentación y progreso físico.

## Estado actual

Etapas 1 y 2: proyecto base y autenticación MOCK funcionando con Vue 3.

Incluye:

- Tema visual oscuro en español.
- Navegación principal: Inicio, Entrenar, Alimentación, Progreso y Perfil.
- Datos mock separados en modelos y repositorios.
- Arquitectura MVC: modelos, controladores (Pinia + composables) y vistas.
- Botón único y contextual del asistente virtual.
- Diseño responsive para móvil y escritorio.
- Login, registro, recuperación de contraseña y cierre de sesión.
- Contraseñas mock representadas mediante huella SHA-256, nunca en texto plano.
- Identidad visual con logo FITTRACK.

## Tecnologías

- Vue 3 (`<script setup>`) y JavaScript.
- Vite.
- Vue Router.
- Pinia para gestión de estado.
- Vitest y Vue Test Utils.
- Git y GitHub.

## Requisitos

- Node.js 20 o superior y npm.

## Instalación y ejecución

```bash
npm install
npm test
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

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
backend/            # Estructura del backend (pendiente)
```

Las vistas solo contienen plantilla y estilos; toda la lógica (validación, llamadas a repositorios, navegación) vive en `src/controllers/`.

## Ramas Git

- `main`: rama estable.
- `develop`: rama principal de desarrollo.

Las funcionalidades se desarrollarán en ramas `feature/...` y se integrarán en `develop`.

## Flujo de autenticación MOCK

En esta etapa las cuentas viven únicamente en memoria mientras la pestaña está abierta (recargar la página las borra). Registra una cuenta desde la pantalla de Login y después inicia sesión. No se envían correos reales ni se conecta un backend.
