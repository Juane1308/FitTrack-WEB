import { createRouter, createWebHistory } from 'vue-router'

import { AppSection } from '@/core/constants'
import { useAuthController } from '@/controllers/authController'

export const routes = [
  ...(import.meta.env.DEV ? [{
    path: '/preview/training',
    name: 'training-preview',
    component: () => import('@/views/sections/TrainingView.vue'),
  }] : []),
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
    path: '/personalization',
    name: 'personalization',
    component: () => import('@/views/PersonalizationView.vue'),
    meta: { requiresAuth: true, onboardingOnly: true },
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
      {
        path: 'profile/goals',
        name: 'profile-goals',
        component: () => import('@/views/sections/profile/ProfileGoalsView.vue'),
        meta: { section: AppSection.profile },
      },
      {
        path: 'profile/data',
        name: 'profile-data',
        component: () => import('@/views/sections/profile/ProfileDataView.vue'),
        meta: { section: AppSection.profile },
      },
      {
        path: 'profile/notifications',
        name: 'profile-notifications',
        component: () => import('@/views/sections/profile/ProfileNotificationsView.vue'),
        meta: { section: AppSection.profile },
      },
      {
        path: 'profile/privacy',
        name: 'profile-privacy',
        component: () => import('@/views/sections/profile/ProfilePrivacyView.vue'),
        meta: { section: AppSection.profile },
      },
      {
        path: 'profile/help',
        name: 'profile-help',
        component: () => import('@/views/sections/profile/ProfileHelpView.vue'),
        meta: { section: AppSection.profile },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export function installAuthGuard(router) {
  router.beforeEach((to) => {
    const auth = useAuthController()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const signupPersonalization = to.name === 'personalization' && Boolean(auth.pendingRegistration)
    const profileCompleted = Boolean(auth.currentUser?.profileCompleted)

    if (requiresAuth && !auth.isAuthenticated && !signupPersonalization) {
      return { name: 'login' }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: profileCompleted ? 'home' : 'personalization' }
    }
    if (auth.isAuthenticated && requiresAuth && !profileCompleted && to.name !== 'personalization') {
      return { name: 'personalization' }
    }
    if (to.name === 'personalization' && profileCompleted) {
      return { name: 'home' }
    }
    return true
  })
  return router
}

export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  return installAuthGuard(createRouter({ history, routes }))
}
