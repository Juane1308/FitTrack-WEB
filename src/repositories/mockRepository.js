import {
  AppUser,
  DashboardSummary,
  Food,
  ProgressEntry,
  Recipe,
} from '@/models'
export class MockRepository {
  get currentUser() {
    return new AppUser({
      name: 'Samuel',
      email: 'samuel@fittrack.local',
      goal: 'Ganar fuerza',
    })
  }

  get dashboard() {
    return new DashboardSummary({
      routineName: 'Fuerza de tren superior',
      routineDate: 'Hoy, 26 de septiembre',
      durationMinutes: 45,
      difficulty: 'Intermedia',
      weeklyGoal: 4,
      progressPercent: 0.75,
      calories: 320,
      exerciseMinutes: 135,
      activeStreak: 6,
    })
  }

  get foods() {
    return [
      new Food({ id: 'food-1', name: 'Avena', category: 'Cereales' }),
      new Food({ id: 'food-2', name: 'Huevo', category: 'Proteínas' }),
      new Food({ id: 'food-3', name: 'Banano', category: 'Frutas' }),
    ]
  }

  get recipes() {
    return [
      new Recipe({
        id: 'recipe-1',
        name: 'Avena con banano',
        ingredients: ['Avena', 'Leche', 'Banano'],
        mealTime: 'Desayuno',
      }),
    ]
  }

  get progress() {
    return [
      new ProgressEntry({ date: '2026-09-01', weight: 72.4, height: 1.74 }),
      new ProgressEntry({ date: '2026-09-15', weight: 71.8, height: 1.74 }),
      new ProgressEntry({ date: '2026-09-26', weight: 71.2, height: 1.74 }),
    ]
  }
}
