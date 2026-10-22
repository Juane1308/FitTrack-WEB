import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { ApiAuthRepository } from '@/repositories/authRepository'

export const AuthStatus = Object.freeze({
  loggedOut: 'loggedOut',
  loading: 'loading',
  authenticated: 'authenticated',
})

export const useAuthController = defineStore('auth', () => {
  const defaultRepository = new ApiAuthRepository()
  const repository = shallowRef(defaultRepository)
  const storedUser = defaultRepository.getStoredUser()
  const status = ref(storedUser ? AuthStatus.authenticated : AuthStatus.loggedOut)
  const currentUser = ref(storedUser)
  const pendingRegistration = ref(null)

  const isAuthenticated = computed(() => status.value === AuthStatus.authenticated)
  const isLoading = computed(() => status.value === AuthStatus.loading)

  function setRepository(newRepository) {
    repository.value = newRepository
  }

  function beginRegistration({ name, email, password }) {
    pendingRegistration.value = { name, email, password }
  }

  async function completeRegistration(profile) {
    if (!pendingRegistration.value) return { isSuccess: false, status: 'invalidData' }
    status.value = AuthStatus.loading
    const result = await repository.value.registerWithProfile({
      ...pendingRegistration.value,
      profile,
    })
    status.value = AuthStatus.loggedOut
    currentUser.value = null
    if (result.isSuccess) pendingRegistration.value = null
    return result
  }

  async function login({ email, password }) {
    status.value = AuthStatus.loading
    const result = await repository.value.login({ email, password })
    if (result.isSuccess) {
      currentUser.value = result.user
      status.value = AuthStatus.authenticated
    } else {
      status.value = AuthStatus.loggedOut
    }
    return result
  }

  async function getProfile() {
    return repository.value.getProfile()
  }

  async function saveProfile(profile) {
    const savedProfile = await repository.value.saveProfile(profile)
    currentUser.value = new currentUser.value.constructor({
      ...currentUser.value,
      goal: savedProfile.goal,
      profileCompleted: savedProfile.profileCompleted,
    })
    localStorage.setItem('fittrack_user', JSON.stringify(currentUser.value))
    return savedProfile
  }

  function requestPasswordReset(email) {
    return repository.value.requestPasswordReset(email)
  }

  function logout() {
    repository.value.logout?.()
    currentUser.value = null
    status.value = AuthStatus.loggedOut
  }

  return {
    status,
    currentUser,
    pendingRegistration,
    isAuthenticated,
    isLoading,
    setRepository,
    beginRegistration,
    completeRegistration,
    login,
    getProfile,
    saveProfile,
    requestPasswordReset,
    logout,
  }
})
