# FitTrack-WEB

## Conectar PostgreSQL de Railway en desarrollo local

1. En la raíz del repositorio, crea `.env` copiando `.env.example`.
2. En Railway, abre el servicio PostgreSQL y copia la URL de **Public Networking** (TCP Proxy). La URL privada con host `*.railway.internal` solo funciona desde servicios dentro de Railway.
3. Pega esa URL en `DATABASE_URL` dentro de `.env`. No compartas ni subas este archivo; está excluido por `.gitignore`.
4. En una terminal ejecuta `npm run dev:api`. El servidor inicializa las tablas declaradas en `server/schema.sql` y escucha en `http://localhost:3000`.
5. En otra terminal ejecuta `npm run dev` y abre la URL que muestra Vite. Comprueba la conexión en `http://localhost:3000/api/health`.

En Railway, configura `DATABASE_URL` como variable del servicio de la aplicación usando la referencia a la URL privada del servicio PostgreSQL. No uses la URL de Public Networking para una aplicación desplegada en el mismo proyecto.

## Catálogos en la base de datos

La API crea al arrancar las tablas que faltan (`server/schema.sql`, solo `CREATE TABLE IF NOT EXISTS`). Los catálogos se cargan a mano y se pueden repetir sin duplicar datos:

```bash
npm run dataset:import     # rutinas y ejercicios (src/data/exercises.json, routines.json)
npm run nutrition:import   # alimentos y recetas (src/data/foods.json, recipes.json)
```

Los JSON de `src/data/` son solo la fuente de importación: la página siempre lee los datos desde la API.

## Perfil

| Método | Ruta                 | Descripción                                                                 |
|--------|----------------------|-----------------------------------------------------------------------------|
| GET    | `/api/me/overview`   | Nombre, correo, semanas en FitTrack, entrenamientos y cambio de peso        |
| PATCH  | `/api/me`            | Cambia el nombre                                                            |
| GET/PUT| `/api/me/goals`      | Objetivo, meta semanal (`user_goals`, la usa Inicio), peso objetivo y agua  |
| GET/PUT| `/api/me/settings`   | Notificaciones y privacidad (`user_settings`)                               |
| PUT    | `/api/me/password`   | Cambia la contraseña y cierra las demás sesiones                            |
| GET    | `/api/help/faqs`     | Preguntas frecuentes (`faqs`)                                               |
| POST   | `/api/auth/logout`   | Cierra la sesión actual en el servidor                                      |

Cada vez que se guarda el peso (registro o `PUT /api/profile`) queda un registro del día en `weight_logs`, que alimenta el progreso de peso.
