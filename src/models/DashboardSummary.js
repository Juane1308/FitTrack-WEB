export class DashboardSummary {
  constructor({
    routineName,
    routineDate,
    durationMinutes,
    difficulty,
    weeklyGoal,
    progressPercent,
    calories,
    exerciseMinutes,
    activeStreak,
  }) {
    this.routineName = routineName
    this.routineDate = routineDate
    this.durationMinutes = durationMinutes
    this.difficulty = difficulty
    this.weeklyGoal = weeklyGoal
    this.progressPercent = progressPercent
    this.calories = calories
    this.exerciseMinutes = exerciseMinutes
    this.activeStreak = activeStreak
  }
}
