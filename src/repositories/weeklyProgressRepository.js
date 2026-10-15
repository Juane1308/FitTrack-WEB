const ENDPOINT = '/api/progress/weekly'

export async function fetchWeeklyProgress() {
  const response = await fetch(ENDPOINT, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('No fue posible cargar el progreso semanal')
  }

  const data = await response.json()

  if (
    !Number.isFinite(Number(data.completedWorkouts)) ||
    !Number.isFinite(Number(data.weeklyGoal))
  ) {
    throw new Error('La respuesta del progreso no tiene el formato esperado')
  }

  return {
    completedWorkouts: Number(data.completedWorkouts),
    weeklyGoal: Number(data.weeklyGoal),
  }
}