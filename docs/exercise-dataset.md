# Catálogo de ejercicios

FitTrack usa el catálogo de 151 ejercicios que consume el proyecto móvil desde [marcmayol.com/exercise-api](https://marcmayol.com/exercise-api/). El servicio entrega nombres, grupos musculares, equipo, instrucciones en español, errores frecuentes, alternativas y enlaces a imágenes.

El proyecto móvil selecciona primero la imagen `female` cuando está disponible. La preparación web conserva ese criterio y guarda una copia local en `public/images/exercises/`, además de conservar las URL originales como referencia. Así las fotos no dependen de una llamada al servicio externo cuando se muestra la página.

El proyecto móvil identifica el contenido de origen como **Free Exercise DB** (`yuhonas/free-exercise-db`), distribuido como dominio público. La API y las imágenes se obtienen del servicio anterior; esta atribución registra la procedencia de la colección incorporada.

Para volver a preparar los datos e imágenes desde el catálogo remoto, ejecuta `npm run exercises:prepare-source`. El proceso escribe `src/data/sourceExercises.json` y `public/images/exercises/` en este repositorio.

Para importar los registros a PostgreSQL, configura `DATABASE_URL` en el archivo `.env` de la raíz y ejecuta `npm run exercises:import-source`. La importación es transaccional e idempotente: añade columnas si faltan, identifica los registros por el `slug` de la fuente y conserva las relaciones de rutina existentes cuando coincide un ejercicio por nombre. No se ejecuta automáticamente al iniciar la API.
