import { apiRequest } from './apiClient'

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export class ProgressRepository {
  async getProgress() {
    const data = await apiRequest('/api/progress')
    if (!Array.isArray(data?.history)) throw new Error('Respuesta de progreso inválida')
    return data
  }

  saveWeight(weightKg) {
    return apiRequest('/api/progress/weight', json('PUT', { weightKg }))
  }

  saveHeight(heightCm) {
    return apiRequest('/api/progress/height', json('PUT', { heightCm }))
  }

  addPhoto(image) {
    return apiRequest('/api/progress/photos', json('POST', { image }))
  }
}
