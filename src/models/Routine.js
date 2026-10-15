export class Routine {
  constructor({ id, name, level, durationMinutes, durationWeeks, image, goal, muscleGroup, exercises = [] }) {
    this.id = id
    this.durationWeeks = durationWeeks
    this.image = image
    this.name = name
    this.level = level
    this.durationMinutes = durationMinutes
    this.goal = goal
    this.muscleGroup = muscleGroup
    this.exercises = exercises
  }
}
