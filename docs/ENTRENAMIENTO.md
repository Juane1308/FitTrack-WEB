# Entrenamiento: RF-30 a RF-35

La sección Entrenar conserva el catálogo y Mis rutinas (guardadas o asignadas, RF-30).
Cada tarjeta incluye «Ver detalle», con ejercicios en el orden del dataset (RF-31),
técnica, series, repeticiones o segundos, descanso y trabajo por lado (RF-32).
La ficha muestra objetivo, nivel, minutos estimados y grupos musculares (RF-33).

Una cuenta autenticada puede comenzar una rutina con ejercicios (RF-34).
La sesión activa se guarda en PostgreSQL y se recupera al volver a Entrenar o recargar.
Solo se admite una sesión activa por usuario. Las casillas de ejercicios son una
ayuda local: se deben volver a marcar después de recargar la página.

Después de marcar todos los ejercicios se habilita «Finalizar entrenamiento» (RF-35).
El servidor calcula la duración real y cambia la sesión a completada mediante una
actualización atómica. Repetir la solicitud devuelve el registro existente; no suma
otro entrenamiento. Inicio vuelve a consultar sus indicadores al regresar y Perfil
utiliza el mismo historial de sesiones completadas.

## Base de datos

Se necesita una `DATABASE_URL` válida en `.env` y el esquema `fittrack` con su dataset
de rutinas y ejercicios. Al arrancar el backend, `server/schema.sql` añade a
`workout_sessions` las columnas `routine_id` y `started_at`, y el índice que limita
las sesiones activas por usuario. Las sesiones históricas se conservan.
No se requieren nuevas importaciones del dataset para esta funcionalidad.

## API

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/routines/:id` | Ficha y ejercicios ordenados |
| GET | `/api/me/workouts/active` | Recuperar la sesión activa de la cuenta |
| POST | `/api/me/routines/:id/start` | Iniciar una sesión |
| POST | `/api/me/workouts/:sessionId/finish` | Finalizar sin duplicados |

Las rutas `/me/` usan exclusivamente la identidad de la sesión autenticada.
Comenzar otra rutina mientras existe una activa devuelve 409; una rutina sin
ejercicios o no disponible devuelve 404. Finalizar una sesión ajena devuelve 404.

## Validación

`npm test` cubre detalle, autorización, aislamiento por cuenta, recuperación de sesión,
conflicto de sesiones activas, finalización idempotente y el flujo de la interfaz.
Las pruebas usan respuestas simuladas; no reemplazan una prueba contra PostgreSQL.

Prueba manual con la base conectada: guardar una rutina, abrirla desde Mis rutinas,
verificar ficha y ejercicios, comenzar, recargar y retomar, marcar los ejercicios y
finalizar. Al volver a Inicio y Perfil debe contarse un entrenamiento adicional.
