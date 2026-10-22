import { apiRequest } from './apiClient'
import { Routine } from '@/models'
import fullBodyImage from '@/assets/images/training/full-body.png'
import hypertrophyImage from '@/assets/images/training/hypertrophy.png'
import fatLossImage from '@/assets/images/training/fat-loss.png'
import strengthImage from '@/assets/images/training/strength.png'

const images = {
  'full-body': fullBodyImage,
  hypertrophy: hypertrophyImage,
  'fat-loss': fatLossImage,
  strength: strengthImage,
}

export class TrainingRepository {
  async getMyRoutines() {
    const data = await apiRequest('/api/me/routines')
    if (!Array.isArray(data?.routines)) throw new Error('Respuesta de mis rutinas inválida')
    return data.routines.map(routine => ({ ...new Routine({ ...routine, image: images[routine.image] ?? fullBodyImage }), origin: routine.origin }))
  }

  saveRoutine(id) {
    return apiRequest(`/api/me/routines/${encodeURIComponent(id)}`, { method: 'POST' })
  }

  removeRoutine(id) {
    return apiRequest(`/api/me/routines/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async getExercises() {
    const data = await apiRequest('/api/exercises')
    if (!Array.isArray(data?.exercises)) throw new Error('Respuesta de ejercicios inválida')
    return data.exercises
  }

  async getRoutines() {
    const data = await apiRequest('/api/routines')
    if (!Array.isArray(data?.routines)) throw new Error('Respuesta de catálogo inválida')
    return data.routines.map(routine => new Routine({
      ...routine,
      image: images[routine.image] ?? fullBodyImage,
    }))
  }
}
