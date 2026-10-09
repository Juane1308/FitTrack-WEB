export const AppSection = Object.freeze({
  home: 'home',
  training: 'training',
  nutrition: 'nutrition',
  progress: 'progress',
  profile: 'profile',
})

export const APP_SECTIONS = Object.freeze({
  [AppSection.home]: { label: 'Inicio', description: 'Tu resumen de hoy' },
  [AppSection.training]: { label: 'Entrenar', description: 'Rutinas y ejercicios' },
  [AppSection.nutrition]: { label: 'Alimentación', description: 'Alimentación y hábitos' },
  [AppSection.progress]: { label: 'Progreso', description: 'Tu evolución física' },
  [AppSection.profile]: { label: 'Perfil', description: 'Datos y preferencias' },
})

export const APP_NAME = 'FITTRACK'
export const APP_TAGLINE = 'Entrena. Aliméntate. Evoluciona.'
