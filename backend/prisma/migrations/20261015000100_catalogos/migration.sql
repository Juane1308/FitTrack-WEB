-- =====================================================================
--  FitTrack - Datos de catálogos (OPCIONAL)
--  Solo llena las listas predefinidas que piden los requisitos
--  (RF-11, RF-14, RF-15, RF-13, RF-24, RF-38, RF-40). No crea usuarios
--  ni datos de prueba. Migración de Prisma que va después de la inicial.
-- =====================================================================

INSERT INTO objetivos (codigo, nombre) VALUES
    ('perder_peso',       'Perder peso'),
    ('ganar_masa',        'Ganar masa muscular'),
    ('mantenerse_forma',  'Mantenerse en forma'),
    ('mejorar_salud',     'Mejorar salud');

INSERT INTO niveles_dificultad (codigo, nombre, orden) VALUES
    ('principiante', 'Principiante', 1),
    ('intermedio',   'Intermedio',   2),
    ('avanzado',     'Avanzado',     3);

INSERT INTO lugares_entrenamiento (codigo, nombre) VALUES
    ('gimnasio',   'Gimnasio equipado'),
    ('casa',       'Casa'),
    ('aire_libre', 'Al aire libre');

INSERT INTO niveles_actividad (codigo, nombre, descripcion, orden) VALUES
    ('sedentario', 'Sedentario',        'No realiza actividad física',          1),
    ('ligero',     'Actividad ligera',  '1 a 2 días por semana',                2),
    ('moderado',   'Actividad moderada','3 a 4 días por semana',                3),
    ('activo',     'Muy activo',        '5 o más días por semana',              4);

INSERT INTO condiciones_salud (tipo, nombre) VALUES
    ('enfermedad_cronica', 'Hipertensión'),
    ('enfermedad_cronica', 'Diabetes'),
    ('enfermedad_cronica', 'Asma'),
    ('dolor_articular',    'Dolor de rodilla'),
    ('dolor_articular',    'Dolor de espalda baja'),
    ('dolor_articular',    'Dolor de hombro'),
    ('lesion',             'Esguince de tobillo'),
    ('lesion',             'Lesión de ligamentos'),
    ('cirugia',            'Cirugía de rodilla'),
    ('cirugia',            'Cirugía de columna');

INSERT INTO alergias (nombre, tipo) VALUES
    ('Lactosa',        'alimentaria'),
    ('Gluten',         'alimentaria'),
    ('Maní',           'alimentaria'),
    ('Frutos secos',   'alimentaria'),
    ('Mariscos',       'alimentaria'),
    ('Huevo',          'alimentaria'),
    ('Soya',           'alimentaria'),
    ('Pescado',        'alimentaria');

INSERT INTO grupos_musculares (nombre) VALUES
    ('Pecho'), ('Espalda'), ('Hombros'), ('Bíceps'), ('Tríceps'),
    ('Piernas'), ('Glúteos'), ('Abdomen'), ('Cuerpo completo'), ('Cardio');

INSERT INTO categorias_alimento (nombre) VALUES
    ('Proteínas magras'), ('Carbohidratos'), ('Grasas saludables'), ('Vitaminas y minerales');

INSERT INTO categorias_receta (nombre, orden) VALUES
    ('Desayunos', 1), ('Almuerzos', 2), ('Snacks', 3), ('Comidas', 4);

