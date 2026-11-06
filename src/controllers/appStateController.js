import { defineStore } from 'pinia'

// Estado compartido entre pantallas. Los datos vienen siempre de la API.
export const useAppStateController = defineStore('appState', () => {
  return {
    routines: [],
  }
})
