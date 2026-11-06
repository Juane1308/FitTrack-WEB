import { describe, expect, it } from 'vitest'
import exercises from '@/data/exercises.json'
import routines from '@/data/routines.json'

describe('Integridad del dataset de entrenamiento', () => {
  it('mantiene identificadores únicos y referencias válidas con prescripciones completas', () => {
    const ids = new Set(exercises.map(exercise => exercise.id))
    expect(ids.size).toBe(exercises.length)
    expect(new Set(routines.map(routine => routine.id)).size).toBe(routines.length)
    for (const exercise of exercises) {
      for (const field of ['id', 'name', 'technique', 'muscleGroup', 'equipment', 'level']) {
        expect(exercise[field].trim().length).toBeGreaterThan(0)
      }
    }
    for (const routine of routines) {
      expect(routine.durationMinutes).toBeGreaterThan(0)
      expect(routine.durationWeeks).toBeGreaterThan(0)
      expect(routine.exercises.length).toBeGreaterThan(0)
      routine.exercises.forEach((entry, index) => {
        expect(ids.has(entry.exerciseId)).toBe(true)
        expect(entry.order).toBe(index + 1)
        expect(Number.isInteger(entry.sets) && entry.sets > 0).toBe(true)
        expect(entry.restSeconds).toBeGreaterThanOrEqual(0)
        expect(typeof entry.perSide).toBe('boolean')
        expect((entry.repetitions > 0 && entry.durationSeconds === null)
          || (entry.durationSeconds > 0 && entry.repetitions === null)).toBe(true)
      })
    }
  })

})
