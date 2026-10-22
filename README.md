# FitTrack-WEB

## Conectar PostgreSQL de Railway en desarrollo local

1. En la raíz del repositorio, crea `.env` copiando `.env.example`.
2. En Railway, abre el servicio PostgreSQL y copia la URL de **Public Networking** (TCP Proxy). La URL privada con host `*.railway.internal` solo funciona desde servicios dentro de Railway.
3. Pega esa URL en `DATABASE_URL` dentro de `.env`. No compartas ni subas este archivo; está excluido por `.gitignore`.
4. En una terminal ejecuta `npm run dev:api`. El servidor inicializa las tablas declaradas en `server/schema.sql` y escucha en `http://localhost:3000`.
5. En otra terminal ejecuta `npm run dev` y abre la URL que muestra Vite. Comprueba la conexión en `http://localhost:3000/api/health`.

En Railway, configura `DATABASE_URL` como variable del servicio de la aplicación usando la referencia a la URL privada del servicio PostgreSQL. No uses la URL de Public Networking para una aplicación desplegada en el mismo proyecto.
