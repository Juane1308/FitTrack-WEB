# FitTrack-WEB
## Base de datos

- Motor **PostgreSQL** en Railway, esquema `fittrack`, administrado con **Prisma** desde `backend/`.
- Configuración:
  1. Copiar `backend/.env.example` a `backend/.env` y pegar la URL pública de Railway (`DATABASE_PUBLIC_URL`) terminando en `?schema=fittrack`.
  2. Ejecutar:
     ```bash
     cd backend && npm install && npm run db:deploy && npm run db:generate
     ```
- Regla: los cambios futuros al modelo se hacen como una **nueva migración** en otra rama (`feature/...` o `fix/...`). Nunca se edita una migración que ya se aplicó.

## Ramas Git

- `main`: estable. Nunca se trabaja ni se hace push directo aquí.
- `develop`: rama de integración. Todo llega aquí por Pull Request.
- `feature/<nombre>`: todo lo nuevo. Sale de `develop` y vuelve a `develop`.
- `fix/<nombre>`: arreglos de algo que ya está cargado. Sale de `develop` y vuelve a `develop`.
