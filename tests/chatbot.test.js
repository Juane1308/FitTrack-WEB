import { describe, expect, it, vi } from 'vitest'

import { answerChatMessage } from '../server/chatbot.js'

describe('Asistencia IA basada en datasets', () => {
  it('devuelve la cantidad solicitada de ejercicios del grupo muscular', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        { id: 1, name: 'Remo con barra', technique: 'Espalda recta', muscleGroup: 'Espalda', level: 'Intermedio' },
        { id: 2, name: 'Jalón al pecho', technique: 'Controla el descenso', muscleGroup: 'Espalda', level: 'Principiante' },
      ],
    })

    const result = await answerChatMessage(query, 'dame 2 ejercicios para espalda')

    expect(result.type).toBe('exercises')
    expect(result.items).toHaveLength(2)
    expect(query.mock.calls[0][1]).toEqual(['%espalda%', 2, null])
  })

  it('filtra ejercicios relacionados con lesiones del perfil', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })

    const result = await answerChatMessage(query, 'dame 3 ejercicios para espalda', {
      injuries: ['rodilla'],
      joint_pains: [],
      surgeries: [],
      chronic_conditions: [],
    })

    expect(result.type).toBe('exercises')
    expect(result.message).toContain('Tomé en cuenta')
    expect(query.mock.calls[0][0]).toContain('LIKE ANY')
    expect(query.mock.calls[0][1][2]).toEqual(['%rodilla%'])
  })

  it('reconoce el grupo muscular glúteos en singular', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })

    const result = await answerChatMessage(query, 'dame 2 ejercicios para gluteo')

    expect(result.type).toBe('exercises')
    expect(query.mock.calls[0][1]).toEqual(['%glute%', 2, null])
  })

  it('busca recetas sin ingredientes lácteos identificados', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: 'r1', name: 'Avena con fruta', minutes: 10, servings: 1, calories: 300, protein: 8, carbs: 50, fat: 7 }],
    })

    const result = await answerChatMessage(query, 'soy intolerante a la lactosa, ¿qué puedo comer?')

    expect(result.type).toBe('recipes')
    expect(result.items[0].name).toBe('Avena con fruta')
    expect(query.mock.calls[0][0]).toContain('NOT EXISTS')
    expect(query.mock.calls[0][1][0]).toContain('lactosa')
  })

  it('explica las consultas disponibles cuando no reconoce la intención', async () => {
    const result = await answerChatMessage(vi.fn(), 'hola')

    expect(result.type).toBe('help')
    expect(result.message).toContain('ejercicios')
  })
})
