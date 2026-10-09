import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { MockAuthRepository } from '@/repositories/authRepository'

export const AuthStatus = Object.freeze({
  loggedOut: 'loggedOut',
  loading: 'loading',
  authenticated: 'authenticated',
})

export const useAuthController = defineStore('auth', () => {
  const repository = shallowRef(new MockAuthRepository())
  const status = ref(AuthStatus.loggedOut)
  const currentUser = ref(null)

  const isAuthenticated = computed(() => status.value === AuthStatus.authenticated)
  const isLoading = computed(() => status.value === AuthStatus.loading)

  function setRepository(newRepository) {
    repository.value = newRepository
  }

  async function register({ name, email, password }) {
    status.value = AuthStatus.loading
    const result = await repository.value.register({ name, email, password })
    status.value = AuthStatus.loggedOut
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

  function requestPasswordReset(email) {
    return repository.value.requestPasswordReset(email)
  }

  function logout() {
    currentUser.value = null
    status.value = AuthStatus.loggedOut
  }

  return {
    status,
    currentUser,
    isAuthenticated,
    isLoading,
    setRepository,
    register,
    login,
    requestPasswordReset,
    logout,
  }
})
