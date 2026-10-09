import { createRouter, createWebHistory } from 'vue-router'

import { AppSection } from '@/core/constants'
import { useAuthController } from '@/controllers/authController'

export const routes = [
  { path: '/', name: 'splash', component: () => import('@/views/SplashView.vue') },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/app',
    component: () => import('@/views/MainShell.vue'),
    meta: { requiresAuth: true },
    redirect: { name: 'home' },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/sections/HomeView.vue'),
        meta: { section: AppSection.home },
      },
      {
        path: 'training',
        name: 'training',
        component: () => import('@/views/sections/TrainingView.vue'),
        meta: { section: AppSection.training },
      },
      {
        path: 'nutrition',
        name: 'nutrition',
        component: () => import('@/views/sections/NutritionView.vue'),
        meta: { section: AppSection.nutrition },
      },
      {
        path: 'progress',
        name: 'progress',
        component: () => import('@/views/sections/ProgressView.vue'),
        meta: { section: AppSection.progress },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/sections/ProfileView.vue'),
        meta: { section: AppSection.profile },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export function installAuthGuard(router) {
  router.beforeEach((to) => {
    const auth = useAuthController()
    if (to.matched.some((record) => record.meta.requiresAuth) && !auth.isAuthenticated) {
      return { name: 'login' }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'home' }
    }
    return true
  })
  return router
}

export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  return installAuthGuard(createRouter({ history, routes }))
}
