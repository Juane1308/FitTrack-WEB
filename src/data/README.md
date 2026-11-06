# Dataset de entrenamiento FitTrack

Dataset original elaborado para el catálogo RF27. Incluye 30 ejercicios en español y 8 rutinas. No contiene datos de usuarios ni se importa de un proveedor externo. Es contenido inicial de demostración pendiente de revisión profesional para recomendaciones personalizadas; no modela contraindicaciones médicas.

`exercises.json` contiene un arreglo de ejercicios con identificador estable, nombre, técnica, grupo muscular, equipo y nivel. `routines.json` contiene un arreglo de rutinas con identificador, nombre, objetivo, nivel, lugar, equipo, duración estimada por sesión en minutos y duración del programa en semanas. Las duraciones son estimaciones editoriales, no cálculos medidos.

Cada rutina referencia ejercicios por `exerciseId`. `order` indica el orden; `sets`, las series; `restSeconds`, el descanso entre series. Cada entrada usa repeticiones (`repetitions`) o tiempo (`durationSeconds`), dejando el otro campo en `null`. Cuando `perSide` es verdadero, las repeticiones o el tiempo son por lado. No se prescriben cargas ni frecuencia semanal.

`imageKey` referencia una de las cuatro imágenes existentes del proyecto mediante TrainingRepository; las imágenes se reutilizan como portadas ilustrativas. Los dos JSON se pueden copiar juntos sin depender de rutas de imágenes locales.

Los JSON son la fuente de importación; la página no los usa como catálogo local ni como respaldo. TrainingRepository consulta `GET /api/routines`, que obtiene las rutinas activas del esquema `fittrack` en PostgreSQL. El catálogo general es público y no contiene datos personales. La autenticación existente sigue usando `public`.

Con `DATABASE_URL` en `.env`, ejecutar `npm run dataset:import` explícitamente. La importación se ejecuta en una transacción y añade campos e índices para identificar el origen (`codigo_dataset`), equipo, semanas y prescripciones por lado. Ante un fallo se revierten los cambios. Repetirla actualiza registros con la misma clave y reconstruye únicamente las relaciones de esas rutinas; no elimina otras rutinas ni cambia cuentas. Un ejercicio ajeno con el mismo nombre detiene la importación para evitar sobrescribirlo. Se conservan los estados activo/inactivo existentes. Los identificadores numéricos los genera PostgreSQL.

Los catálogos auxiliares deben existir: objetivos, niveles, lugares y grupos musculares. Pantorrillas y cadena posterior se relacionan con el grupo general Piernas. Las relaciones de músculos de una rutina se deducen de sus ejercicios. `imagen_url` admite las claves de las cuatro portadas incluidas, resueltas por el frontend; una clave desconocida usa la portada general.

Iniciar la API con `npm run dev:api` y la página con `npm run dev`. Para añadir rutinas, usar identificadores únicos y referencias existentes, repetir la importación y ejecutar `npm test` y `npm run build`. La API de RF27 devuelve metadatos del catálogo; la consulta detallada de ejercicios corresponde a requisitos posteriores.
