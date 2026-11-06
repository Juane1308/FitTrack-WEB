# Mis rutinas RF30

La API autentica cuentas de `public.app_users`. El catálogo general pertenece a `fittrack.rutinas`. La tabla `public.user_routines` relaciona ambas con clave primaria `(user_id, routine_id)` y `origin` igual a `saved` o `assigned`. Se crea con `server/schema.sql` al iniciar la API, después de tener disponible el esquema `fittrack` y su catálogo. No migra ni vincula por correo las cuentas independientes de `fittrack.usuarios`.

- `GET /api/me/routines`: rutinas activas guardadas o asignadas a la cuenta autenticada.
- `POST /api/me/routines/:id`: guarda una rutina activa. No duplica una relación existente ni reemplaza su origen.
- `DELETE /api/me/routines/:id`: quita exclusivamente una relación `saved` de la cuenta autenticada. Conserva las asignadas.

Todas estas rutas requieren un token válido. La identidad proviene de la sesión del servidor, nunca del cuerpo ni de parámetros de usuario enviados por el cliente. Las asignaciones se consultan desde la misma tabla con `origin='assigned'`; este requisito no incluye una interfaz administrativa para asignarlas automáticamente.

La vista ofrece Rutinas, Ejercicios y Mis rutinas. Permite guardar desde el catálogo y quitar las guardadas desde Mis rutinas. Muestra carga, error, reintento y estado vacío. Si la API no está disponible, no utiliza un catálogo personal de respaldo en JSON.
