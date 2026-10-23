import { describe, expect, it } from 'vitest'

import { historyInPeriod, PROGRESS_PERIODS } from '@/controllers/useProgressController'

const history = [
  { date: '2025-10-01', weightKg: 90 },
  { date: '2026-08-01', weightKg: 84 },
  { date: '2026-10-10', weightKg: 80 },
  { date: '2026-10-22', weightKg: 79 },
]
const today = new Date('2026-10-23T12:00:00Z')

describe('Progreso: periodos del gráfico', () => {
  it('ofrece los cinco periodos del mockup en orden', () => {
    expect(PROGRESS_PERIODS.map(option => option.label)).toEqual(['1 Semana', '1 Mes', '3 Meses', '6 Meses', '1 Año'])
  })

  it('deja solo los registros dentro del periodo elegido', () => {
    expect(historyInPeriod(history, 7, today).map(entry => entry.weightKg)).toEqual([79])
    expect(historyInPeriod(history, 30, today).map(entry => entry.weightKg)).toEqual([80, 79])
    expect(historyInPeriod(history, 91, today).map(entry => entry.weightKg)).toEqual([84, 80, 79])
    expect(historyInPeriod(history, 365, today)).toHaveLength(3)
  })
})
