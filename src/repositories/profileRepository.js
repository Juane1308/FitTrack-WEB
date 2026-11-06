import { apiRequest } from './apiClient'

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export class ProfileRepository {
  getOverview() {
    return apiRequest('/api/me/overview')
  }

  updateName(name) {
    return apiRequest('/api/me', json('PATCH', { name }))
  }

  uploadAvatar(image) {
    return apiRequest('/api/me/avatar', json('PUT', { image }))
  }

  removeAvatar() {
    return apiRequest('/api/me/avatar', { method: 'DELETE' })
  }

  getPersonalData() {
    return apiRequest('/api/profile')
  }

  savePersonalData(profile) {
    return apiRequest('/api/profile', json('PUT', profile))
  }

  getGoals() {
    return apiRequest('/api/me/goals')
  }

  saveGoals(goals) {
    return apiRequest('/api/me/goals', json('PUT', goals))
  }

  getSettings() {
    return apiRequest('/api/me/settings')
  }

  saveSettings(settings) {
    return apiRequest('/api/me/settings', json('PUT', settings))
  }

  changePassword({ currentPassword, newPassword }) {
    return apiRequest('/api/me/password', json('PUT', { currentPassword, newPassword }))
  }

  async getFaqs() {
    const data = await apiRequest('/api/help/faqs')
    if (!Array.isArray(data?.faqs)) throw new Error('Respuesta de ayuda inválida')
    return data.faqs
  }
}
