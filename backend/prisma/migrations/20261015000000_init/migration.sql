-- FitTrack - Migración inicial (estructura de las 31 tablas, sin datos)
-- Prisma la aplica dentro del esquema indicado en DATABASE_URL (?schema=fittrack).

-- ---------------------------------------------------------------------
-- Función común para mantener actualizado el campo actualizado_en
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================
--  CATÁLOGOS COMPARTIDOS
-- =====================================================================

-- RF-11: Perder peso, Ganar masa muscular, Mantenerse en forma, Mejorar salud
CREATE TABLE objetivos (
    id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo      VARCHAR(40)  NOT NULL UNIQUE,
    nombre      VARCHAR(80)  NOT NULL UNIQUE,
    descripcion TEXT
);

-- RF-24, RF-28: principiante, intermedio, avanzado
CREATE TABLE niveles_dificultad (
    id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    orden  SMALLINT    NOT NULL DEFAULT 0
);


-- =====================================================================
--  MÓDULO 1: REGISTRO E INICIO DE SESIÓN
-- =====================================================================

-- RF-01..RF-08, RNF-04 (contraseña con hash, nunca en texto plano)
CREATE TABLE usuarios (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo         VARCHAR(150) NOT NULL,
    correo                  VARCHAR(255) NOT NULL,
    contrasena_hash         VARCHAR(255) NOT NULL,
    acepto_terminos         BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_acepto_terminos   TIMESTAMPTZ,
    activo                  BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso           TIMESTAMPTZ,
    creado_en               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuarios_correo_formato
        CHECK (correo ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    CONSTRAINT ck_usuarios_terminos
        CHECK (acepto_terminos = FALSE OR fecha_acepto_terminos IS NOT NULL)
);
-- RF-03: el correo no puede repetirse (sin distinguir mayúsculas)
CREATE UNIQUE INDEX ux_usuarios_correo ON usuarios (LOWER(correo));

-- RF-09: "¿Olvidaste tu contraseña?" (se guarda el hash del token)
CREATE TABLE tokens_recuperacion (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expira_en   TIMESTAMPTZ  NOT NULL,
    usado_en    TIMESTAMPTZ,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_tokens_recuperacion_usuario ON tokens_recuperacion (usuario_id);

-- RF-07, RF-10, RF-65: sesiones activas (refresh tokens) para poder
-- cerrar sesión de forma segura desde el perfil
CREATE TABLE sesiones (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id         BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    dispositivo        VARCHAR(150),
    ip                 VARCHAR(45),
    creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expira_en          TIMESTAMPTZ  NOT NULL,
    cerrada_en         TIMESTAMPTZ
);
CREATE INDEX ix_sesiones_usuario ON sesiones (usuario_id);


-- =====================================================================
--  MÓDULO 2: OBJETIVOS Y PERSONALIZACIÓN
-- =====================================================================

-- RF-14: gimnasio equipado, casa, aire libre
CREATE TABLE lugares_entrenamiento (
    id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(60) NOT NULL UNIQUE
);

-- RF-14: vida deportiva actual (sedentario, ligera, moderada, ...)
CREATE TABLE niveles_actividad (
    id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo      VARCHAR(30) NOT NULL UNIQUE,
    nombre      VARCHAR(60) NOT NULL UNIQUE,
    descripcion TEXT,
    orden       SMALLINT    NOT NULL DEFAULT 0
);

-- RF-11, RF-12, RF-14, RF-16, RF-18, RF-47/48 (estatura en la ficha
-- física), RF-21 (meta semanal), RF-42 (meta de agua).
-- Relación 1:1 con usuarios. El peso NO se guarda aquí: se guarda en
-- registros_peso (módulo 6) para conservar el historial.
CREATE TABLE perfiles (
    usuario_id                  BIGINT       PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
    objetivo_id                 SMALLINT     REFERENCES objetivos (id),
    fecha_nacimiento            DATE,
    estatura_m                  NUMERIC(3,2),
    nivel_actividad_id          SMALLINT     REFERENCES niveles_actividad (id),
    lugar_entrenamiento_id      SMALLINT     REFERENCES lugares_entrenamiento (id),
    meta_entrenamientos_semana  SMALLINT     NOT NULL DEFAULT 3,
    meta_agua_ml                INTEGER      NOT NULL DEFAULT 2000,
    actualizado_en              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_perfiles_estatura    CHECK (estatura_m IS NULL OR estatura_m BETWEEN 0.50 AND 2.60),
    CONSTRAINT ck_perfiles_nacimiento  CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento > DATE '1900-01-01'),
    CONSTRAINT ck_perfiles_meta_semana CHECK (meta_entrenamientos_semana BETWEEN 1 AND 14),
    CONSTRAINT ck_perfiles_meta_agua   CHECK (meta_agua_ml BETWEEN 250 AND 10000)
);
CREATE INDEX ix_perfiles_objetivo ON perfiles (objetivo_id);

-- RF-13: catálogo de condiciones (lesión, dolor articular, cirugía,
-- enfermedad crónica como hipertensión o diabetes)
CREATE TABLE condiciones_salud (
    id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo   VARCHAR(30)  NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT ck_condiciones_tipo
        CHECK (tipo IN ('lesion', 'dolor_articular', 'cirugia', 'enfermedad_cronica')),
    CONSTRAINT uq_condiciones_tipo_nombre UNIQUE (tipo, nombre)
);

-- RF-13, RF-18: condiciones de salud de cada usuario. Se puede elegir
-- del catálogo o escribir una descripción libre ("otra").
CREATE TABLE usuario_condiciones_salud (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    condicion_id    SMALLINT     REFERENCES condiciones_salud (id),
    descripcion     VARCHAR(255),
    fecha_aprox     DATE,
    vigente         BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuario_condicion_dato
        CHECK (condicion_id IS NOT NULL OR descripcion IS NOT NULL)
);
CREATE INDEX ix_usuario_condiciones_usuario ON usuario_condiciones_salud (usuario_id);

-- RF-15: catálogo predefinido de alergias
CREATE TABLE alergias (
    id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo   VARCHAR(30)  NOT NULL DEFAULT 'alimentaria',
    CONSTRAINT ck_alergias_tipo CHECK (tipo IN ('alimentaria', 'medicamento', 'ambiental', 'otra'))
);

-- RF-15, RF-18: alergias de cada usuario (N:M)
CREATE TABLE usuario_alergias (
    usuario_id  BIGINT      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    alergia_id  SMALLINT    NOT NULL REFERENCES alergias (id),
    notas       VARCHAR(255),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, alergia_id)
);


-- =====================================================================
--  MÓDULO 4: ENTRENAMIENTO  (también alimenta los módulos 3 y 7)
-- =====================================================================

CREATE TABLE grupos_musculares (
    id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE
);

-- RF-29, RF-32: catálogo de ejercicios
CREATE TABLE ejercicios (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR(120) NOT NULL UNIQUE,
    descripcion       TEXT,
    tecnica           TEXT,
    grupo_muscular_id SMALLINT     REFERENCES grupos_musculares (id),
    nivel_id          SMALLINT     REFERENCES niveles_dificultad (id),
    imagen_url        VARCHAR(500),
    video_url         VARCHAR(500),
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_ejercicios_grupo ON ejercicios (grupo_muscular_id);

-- RF-17, RF-27, RF-28, RF-33: catálogo de rutinas, filtrables por objetivo
CREATE TABLE rutinas (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                VARCHAR(120) NOT NULL,
    descripcion           TEXT,
    objetivo_id           SMALLINT     REFERENCES objetivos (id),
    nivel_id              SMALLINT     NOT NULL REFERENCES niveles_dificultad (id),
    lugar_entrenamiento_id SMALLINT    REFERENCES lugares_entrenamiento (id),
    duracion_estimada_min SMALLINT     NOT NULL,
    calorias_estimadas    INTEGER,
    imagen_url            VARCHAR(500),
    activa                BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_rutinas_duracion CHECK (duracion_estimada_min > 0)
);
CREATE INDEX ix_rutinas_objetivo ON rutinas (objetivo_id);
CREATE INDEX ix_rutinas_nivel    ON rutinas (nivel_id);

-- RF-33: grupos musculares trabajados por la rutina (N:M)
CREATE TABLE rutina_grupos_musculares (
    rutina_id         BIGINT   NOT NULL REFERENCES rutinas (id) ON DELETE CASCADE,
    grupo_muscular_id SMALLINT NOT NULL REFERENCES grupos_musculares (id),
    PRIMARY KEY (rutina_id, grupo_muscular_id)
);

-- RF-31, RF-32: ejercicios que componen cada rutina, con series y reps
CREATE TABLE rutina_ejercicios (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rutina_id     BIGINT   NOT NULL REFERENCES rutinas (id) ON DELETE CASCADE,
    ejercicio_id  BIGINT   NOT NULL REFERENCES ejercicios (id),
    orden         SMALLINT NOT NULL,
    series        SMALLINT NOT NULL,
    repeticiones  SMALLINT,
    duracion_seg  INTEGER,
    descanso_seg  SMALLINT,
    CONSTRAINT uq_rutina_ejercicios_orden UNIQUE (rutina_id, orden),
    CONSTRAINT ck_rutina_ejercicios_series CHECK (series > 0),
    CONSTRAINT ck_rutina_ejercicios_carga  CHECK (repeticiones IS NOT NULL OR duracion_seg IS NOT NULL)
);
CREATE INDEX ix_rutina_ejercicios_ejercicio ON rutina_ejercicios (ejercicio_id);

-- RF-30: "Mis rutinas" (guardadas por el usuario o asignadas)
CREATE TABLE usuario_rutinas (
    usuario_id  BIGINT      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    rutina_id   BIGINT      NOT NULL REFERENCES rutinas (id) ON DELETE CASCADE,
    origen      VARCHAR(20) NOT NULL DEFAULT 'guardada',
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, rutina_id),
    CONSTRAINT ck_usuario_rutinas_origen CHECK (origen IN ('guardada', 'asignada'))
);

-- RF-22: rutina programada para una fecha concreta (entrenamiento del día)
CREATE TABLE rutinas_programadas (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  BIGINT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    rutina_id   BIGINT NOT NULL REFERENCES rutinas (id) ON DELETE CASCADE,
    fecha       DATE   NOT NULL,
    CONSTRAINT uq_rutinas_programadas UNIQUE (usuario_id, fecha, rutina_id)
);
CREATE INDEX ix_rutinas_programadas_usuario_fecha ON rutinas_programadas (usuario_id, fecha);

-- RF-34, RF-35 y métricas de RF-20, RF-21, RF-25, RF-59:
-- cada vez que el usuario comienza / finaliza una rutina
CREATE TABLE sesiones_entrenamiento (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id        BIGINT      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    rutina_id         BIGINT      REFERENCES rutinas (id) ON DELETE SET NULL,
    iniciada_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    finalizada_en     TIMESTAMPTZ,
    duracion_min      SMALLINT,
    calorias_quemadas INTEGER,
    estado            VARCHAR(20) NOT NULL DEFAULT 'en_curso',
    CONSTRAINT ck_sesiones_estado CHECK (estado IN ('en_curso', 'completada', 'cancelada')),
    CONSTRAINT ck_sesiones_fechas CHECK (finalizada_en IS NULL OR finalizada_en >= iniciada_en),
    CONSTRAINT ck_sesiones_completada CHECK (estado <> 'completada' OR finalizada_en IS NOT NULL)
);
CREATE INDEX ix_sesiones_entrenamiento_usuario_fecha ON sesiones_entrenamiento (usuario_id, iniciada_en);


-- =====================================================================
--  MÓDULO 5: ALIMENTACIÓN / NUTRICIÓN
-- =====================================================================

-- RF-37, RF-38: proteínas magras, carbohidratos, grasas saludables, vitaminas/minerales
CREATE TABLE categorias_alimento (
    id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(60) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE alimentos (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria_id     SMALLINT     NOT NULL REFERENCES categorias_alimento (id),
    nombre           VARCHAR(120) NOT NULL UNIQUE,
    descripcion      TEXT,
    porcion_g        NUMERIC(6,1) NOT NULL DEFAULT 100,
    calorias         NUMERIC(6,1),
    proteinas_g      NUMERIC(6,1),
    carbohidratos_g  NUMERIC(6,1),
    grasas_g         NUMERIC(6,1),
    imagen_url       VARCHAR(500)
);
CREATE INDEX ix_alimentos_categoria ON alimentos (categoria_id);

-- RF-40: snacks, desayunos, almuerzos, comidas
CREATE TABLE categorias_receta (
    id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE,
    orden  SMALLINT    NOT NULL DEFAULT 0
);

-- RF-39
CREATE TABLE recetas (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria_id     SMALLINT     NOT NULL REFERENCES categorias_receta (id),
    objetivo_id      SMALLINT     REFERENCES objetivos (id),
    nombre           VARCHAR(150) NOT NULL,
    descripcion      TEXT,
    ingredientes     TEXT         NOT NULL,
    preparacion      TEXT         NOT NULL,
    tiempo_prep_min  SMALLINT,
    porciones        SMALLINT,
    calorias         INTEGER,
    imagen_url       VARCHAR(500),
    activa           BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_recetas_categoria ON recetas (categoria_id);

-- RF-41, RF-42: registros de consumo de agua (la meta está en perfiles)
CREATE TABLE registros_agua (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id    BIGINT      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    cantidad_ml   INTEGER     NOT NULL,
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_registros_agua_cantidad CHECK (cantidad_ml BETWEEN 1 AND 5000)
);
CREATE INDEX ix_registros_agua_usuario_fecha ON registros_agua (usuario_id, registrado_en);

-- RF-43
CREATE TABLE consejos_nutricionales (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo     VARCHAR(150) NOT NULL,
    contenido  TEXT         NOT NULL,
    objetivo_id SMALLINT    REFERENCES objetivos (id),
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =====================================================================
--  MÓDULO 6: PROGRESO
-- =====================================================================

-- RF-12, RF-45, RF-46, RF-52, RF-53, RF-56: historial de peso.
-- Un registro por usuario y día (RNF-08: sin duplicados); si el usuario
-- vuelve a pesarse el mismo día se actualiza ese registro.
CREATE TABLE registros_peso (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id     BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    peso_kg        NUMERIC(5,2) NOT NULL,
    fecha          DATE         NOT NULL DEFAULT CURRENT_DATE,
    nota           VARCHAR(255),
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_registros_peso_usuario_fecha UNIQUE (usuario_id, fecha),
    CONSTRAINT ck_registros_peso_valor CHECK (peso_kg BETWEEN 20 AND 400)
);
-- El índice único (usuario_id, fecha) ya sirve para los filtros de RF-56.

-- RF-54, RF-55: meta de peso. Se guarda el peso inicial para poder
-- calcular el % de cumplimiento: (inicial - actual) / (inicial - meta).
-- Solo puede haber una meta activa por usuario.
CREATE TABLE metas_peso (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id       BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    peso_inicial_kg  NUMERIC(5,2) NOT NULL,
    peso_meta_kg     NUMERIC(5,2) NOT NULL,
    fecha_inicio     DATE         NOT NULL DEFAULT CURRENT_DATE,
    fecha_objetivo   DATE,
    activa           BOOLEAN      NOT NULL DEFAULT TRUE,
    alcanzada_en     DATE,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_metas_peso_valores CHECK (peso_inicial_kg BETWEEN 20 AND 400 AND peso_meta_kg BETWEEN 20 AND 400),
    CONSTRAINT ck_metas_peso_fechas  CHECK (fecha_objetivo IS NULL OR fecha_objetivo >= fecha_inicio)
);
CREATE UNIQUE INDEX ux_metas_peso_activa ON metas_peso (usuario_id) WHERE activa;

-- RF-49, RF-50, RF-51, RNF-16: fotografías de progreso. Se guarda la
-- URL del archivo (bucket / volumen), no la imagen en la BD.
CREATE TABLE fotos_progreso (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id     BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    url            VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_mime      VARCHAR(30)  NOT NULL,
    tamano_bytes   INTEGER      NOT NULL,
    vista          VARCHAR(20),
    fecha_foto     DATE         NOT NULL DEFAULT CURRENT_DATE,
    registro_peso_id BIGINT     REFERENCES registros_peso (id) ON DELETE SET NULL,
    nota           VARCHAR(255),
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_fotos_tipo   CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT ck_fotos_tamano CHECK (tamano_bytes BETWEEN 1 AND 10485760),  -- máx. 10 MB
    CONSTRAINT ck_fotos_vista  CHECK (vista IS NULL OR vista IN ('frente', 'perfil', 'espalda'))
);
CREATE INDEX ix_fotos_progreso_usuario_fecha ON fotos_progreso (usuario_id, fecha_foto);


-- =====================================================================
--  MÓDULO 7: PERFIL
-- =====================================================================

-- RF-62, RF-63: preferencias de notificaciones y privacidad (1:1)
CREATE TABLE configuracion_usuario (
    usuario_id                 BIGINT      PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
    notif_recordatorio_entreno BOOLEAN     NOT NULL DEFAULT TRUE,
    hora_recordatorio          TIME,
    notif_recordatorio_agua    BOOLEAN     NOT NULL DEFAULT TRUE,
    notif_resumen_semanal      BOOLEAN     NOT NULL DEFAULT TRUE,
    notif_novedades            BOOLEAN     NOT NULL DEFAULT FALSE,
    privacidad_fotos_privadas  BOOLEAN     NOT NULL DEFAULT TRUE,
    privacidad_compartir_datos BOOLEAN     NOT NULL DEFAULT FALSE,
    actualizado_en             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RF-64: centro de ayuda
CREATE TABLE preguntas_frecuentes (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria VARCHAR(60)  NOT NULL,
    pregunta  VARCHAR(255) NOT NULL,
    respuesta TEXT         NOT NULL,
    orden     SMALLINT     NOT NULL DEFAULT 0,
    activa    BOOLEAN      NOT NULL DEFAULT TRUE
);


-- =====================================================================
--  TRIGGERS de actualizado_en
-- =====================================================================
CREATE TRIGGER tg_usuarios_actualizado       BEFORE UPDATE ON usuarios              FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
CREATE TRIGGER tg_perfiles_actualizado       BEFORE UPDATE ON perfiles              FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
CREATE TRIGGER tg_registros_peso_actualizado BEFORE UPDATE ON registros_peso        FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
CREATE TRIGGER tg_configuracion_actualizado  BEFORE UPDATE ON configuracion_usuario FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
