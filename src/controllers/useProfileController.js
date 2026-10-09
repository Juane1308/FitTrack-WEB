import { useRouter } from 'vue-router'

import { useAuthController } from './authController'

export function useProfileController() {
  const router = useRouter()
  const auth = useAuthController()

  function logout() {
    auth.logout()
    router.replace({ name: 'login' })
  }

  return { logout }
}
