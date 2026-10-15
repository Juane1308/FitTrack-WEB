import {
  AppUser,
  DashboardSummary,
  Exercise,
  Food,
  ProgressEntry,
  Recipe,
  Routine,
} from '@/models'
import fullBodyImage from '@/assets/images/training/full-body.png'
import hypertrophyImage from '@/assets/images/training/hypertrophy.png'
import fatLossImage from '@/assets/images/training/fat-loss.png'
import strengthImage from '@/assets/images/training/strength.png'

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

  get routines() {
    return [
      new Routine({ id: 'full-body', name: 'Full Body', level: 'Principiante', durationWeeks: 4, image: fullBodyImage }),
      new Routine({ id: 'hypertrophy', name: 'Hipertrofia', level: 'Intermedio', durationWeeks: 8, image: hypertrophyImage }),
      new Routine({ id: 'fat-loss', name: 'Pérdida de grasa', level: 'Intermedio', durationWeeks: 8, image: fatLossImage }),
      new Routine({
        id: 'strength',
        name: 'Fuerza',
        image: strengthImage,
        durationWeeks: 8,
        level: 'Avanzado',
        durationMinutes: 45,
        goal: 'Ganar fuerza',
        muscleGroup: 'Tren superior',
        exercises: [
          new Exercise({
            name: 'Press de pecho',
            technique: 'Mantén la espalda apoyada y controla el descenso.',
            sets: 4,
            repetitions: 10,
          }),
          new Exercise({
            name: 'Remo con mancuerna',
            technique: 'Conserva la espalda recta y lleva el codo hacia atrás.',
            sets: 3,
            repetitions: 12,
          }),
        ],
      }),
    ]
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
