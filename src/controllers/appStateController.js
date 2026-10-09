import { defineStore } from 'pinia'

import { MockRepository } from '@/repositories/mockRepository'

export const useAppStateController = defineStore('appState', () => {
  const repository = new MockRepository()

  return {
    currentUser: repository.currentUser,
    dashboard: repository.dashboard,
    routines: repository.routines,
    foods: repository.foods,
    recipes: repository.recipes,
    progress: repository.progress,
  }
})
