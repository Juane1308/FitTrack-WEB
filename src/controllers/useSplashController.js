import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthController } from './authController'

const SPLASH_MS = 900

export function useSplashController() {
  const router = useRouter()
  const auth = useAuthController()
  let timer = null

  onMounted(() => {
    timer = setTimeout(() => {
      router.replace(auth.isAuthenticated ? { name: 'home' } : { name: 'login' })
    }, SPLASH_MS)
  })

  onUnmounted(() => clearTimeout(timer))
}
