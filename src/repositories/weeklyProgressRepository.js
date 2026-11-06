import { apiRequest } from './apiClient'

export async function fetchHomeDashboard() {
  return apiRequest('/api/home')
}

export async function completeWorkout({ routineId, durationMinutes = 0, caloriesBurned = null } = {}) {
  return apiRequest('/api/me/workouts', {
    method: 'POST',
    body: JSON.stringify({ routineId, durationMinutes, caloriesBurned }),
  })
}

export async function fetchWeeklyProgress() {
  const data = await apiRequest('/api/progress/weekly')

  if (!Number.isFinite(Number(data.completedWorkouts))) {
    throw new Error('La respuesta del progreso no tiene el formato esperado')
  }

  return {
    completedWorkouts: Number(data.completedWorkouts),
    weeklyGoal: data.weeklyGoal == null ? null : Number(data.weeklyGoal),
  }
}
