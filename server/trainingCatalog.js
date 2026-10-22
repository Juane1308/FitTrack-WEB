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
