export async function getTrainingCatalog(query) {
  const result = await query(`SELECT r.id::TEXT AS id, r.nombre AS name,
    n.nombre AS level, r.duracion_estimada_min AS "durationMinutes",
    r.duracion_semanas AS "durationWeeks", r.imagen_url AS image,
    o.nombre AS goal, l.nombre AS location, COALESCE(r.equipo, '{}') AS equipment
    FROM fittrack.rutinas r
    JOIN fittrack.niveles_dificultad n ON n.id=r.nivel_id
    LEFT JOIN fittrack.objetivos o ON o.id=r.objetivo_id
    LEFT JOIN fittrack.lugares_entrenamiento l ON l.id=r.lugar_entrenamiento_id
    WHERE r.activa=TRUE ORDER BY r.id`)
  return result.rows
}

export async function getExerciseCatalog(query) {
  const result = await query(`SELECT e.id::TEXT AS id, e.nombre AS name,
    e.descripcion AS description, e.tecnica AS technique,
    g.nombre AS "muscleGroup", n.nombre AS level, e.equipo AS equipment
    FROM fittrack.ejercicios e
    LEFT JOIN fittrack.grupos_musculares g ON g.id=e.grupo_muscular_id
    LEFT JOIN fittrack.niveles_dificultad n ON n.id=e.nivel_id
    WHERE e.activo=TRUE ORDER BY e.nombre, e.id`)
  return result.rows
}
