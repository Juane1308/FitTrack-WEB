import { describe, expect, it } from 'vitest'

import { chartSeries, historyInPeriod, PROGRESS_PERIODS } from '@/controllers/useProgressController'

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

describe('Progreso: puntos del gráfico', () => {
  it('con un solo registro dibuja una línea desde el inicio del periodo hasta hoy', () => {
    const series = chartSeries([{ date: '2026-09-01', weightKg: 80 }], 30, today)
    expect(series).toEqual([
      { date: '2026-09-23', weightKg: 80, recordedOn: '2026-09-01' },
      { date: '2026-10-23', weightKg: 80, recordedOn: '2026-09-01' },
    ])
  })

  it('arrastra el último peso anterior al periodo y extiende el último registro hasta hoy', () => {
    const series = chartSeries(history, 30, today)
    expect(series.map(point => [point.date, point.weightKg, point.recordedOn])).toEqual([
      ['2026-09-23', 84, '2026-08-01'],
      ['2026-10-10', 80, '2026-10-10'],
      ['2026-10-22', 79, '2026-10-22'],
      ['2026-10-23', 79, '2026-10-22'],
    ])
  })

  it('sin registros no hay puntos', () => {
    expect(chartSeries([], 30, today)).toEqual([])
  })
})
