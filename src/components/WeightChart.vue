<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  // [{ date: 'YYYY-MM-DD', value: Number }] ordenados por fecha
  points: { type: Array, required: true },
  goal: { type: Number, default: null },
  unit: { type: String, default: 'kg' },
  label: { type: String, required: true },
})

const HEIGHT = 260
const PADDING = { top: 20, right: 96, bottom: 30, left: 40 }

const container = ref(null)
const width = ref(640)
const activeIndex = ref(null)
let observer = null

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    width.value = Math.max(280, Math.round(entry.contentRect.width))
  })
  observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

const dayOf = (date) => new Date(`${date}T00:00:00`).getTime()
const shortDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
const longDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })
// Punto decimal, como en el mockup (78.5 kg)
const formatValue = (value) => `${Math.round(Number(value) * 10) / 10}${props.unit ? ` ${props.unit}` : ''}`

// Escala Y "redonda": paso de 1, 2, 5 o 10 según el rango, con margen arriba y abajo
const yScale = computed(() => {
  const values = props.points.map((point) => point.value)
  if (props.goal != null) values.push(props.goal)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (max - min < 2) {
    min -= 1
    max += 1
  }
  const step = [1, 2, 5, 10, 20].find((candidate) => (max - min) / candidate <= 5) ?? 50
  const low = Math.floor(min / step) * step
  const high = Math.ceil(max / step) * step
  const ticks = []
  for (let tick = low; tick <= high + step / 2; tick += step) ticks.push(Math.round(tick * 10) / 10)
  return { low, high, ticks }
})

const plot = computed(() => ({
  left: PADDING.left,
  right: width.value - PADDING.right,
  top: PADDING.top,
  bottom: HEIGHT - PADDING.bottom,
}))

const xRange = computed(() => {
  const first = dayOf(props.points[0].date)
  const last = dayOf(props.points.at(-1).date)
  return { first, span: Math.max(last - first, 1) }
})

const x = (date) => {
  if (props.points.length === 1) return (plot.value.left + plot.value.right) / 2
  return plot.value.left + ((dayOf(date) - xRange.value.first) / xRange.value.span) * (plot.value.right - plot.value.left)
}
const y = (value) => {
  const { low, high } = yScale.value
  return plot.value.bottom - ((value - low) / (high - low)) * (plot.value.bottom - plot.value.top)
}

const coords = computed(() => props.points.map((point) => ({ ...point, cx: x(point.date), cy: y(point.value) })))
const linePath = computed(() => coords.value.map((point, index) => `${index ? 'L' : 'M'}${point.cx},${point.cy}`).join(' '))
const areaPath = computed(() => {
  if (coords.value.length < 2) return ''
  const first = coords.value[0]
  const last = coords.value.at(-1)
  return `${linePath.value} L${last.cx},${plot.value.bottom} L${first.cx},${plot.value.bottom} Z`
})

// Como mucho cinco fechas en el eje X, repartidas entre el primer y el último registro
const xTicks = computed(() => {
  const count = Math.min(5, coords.value.length)
  if (count <= 1) return coords.value.slice(0, 1)
  return Array.from({ length: count }, (_, index) => coords.value[Math.round((index * (coords.value.length - 1)) / (count - 1))])
})

const last = computed(() => coords.value.at(-1))
const active = computed(() => (activeIndex.value == null ? null : coords.value[activeIndex.value]))

function nearestIndex(event) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const pointerX = ((event.clientX - bounds.left) / bounds.width) * width.value
  let best = 0
  coords.value.forEach((point, index) => {
    if (Math.abs(point.cx - pointerX) < Math.abs(coords.value[best].cx - pointerX)) best = index
  })
  activeIndex.value = best
}

function onKeydown(event) {
  const lastIndex = coords.value.length - 1
  const current = activeIndex.value ?? lastIndex
  if (event.key === 'ArrowLeft') activeIndex.value = Math.max(0, current - 1)
  else if (event.key === 'ArrowRight') activeIndex.value = Math.min(lastIndex, current + 1)
  else if (event.key === 'Home') activeIndex.value = 0
  else if (event.key === 'End') activeIndex.value = lastIndex
  else return
  event.preventDefault()
}

const summary = computed(() => {
  if (!coords.value.length) return `${props.label}: sin registros`
  const first = coords.value[0]
  return `${props.label}: de ${formatValue(first.value)} el ${longDate.format(new Date(dayOf(first.date)))} a ${formatValue(last.value.value)} el ${longDate.format(new Date(dayOf(last.value.date)))}. Usa las flechas para recorrer los registros.`
})
</script>

<template>
  <div ref="container" class="weight-chart">
    <svg
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      :width="width"
      :height="HEIGHT"
      role="img"
      tabindex="0"
      :aria-label="summary"
      @pointermove="nearestIndex"
      @pointerleave="activeIndex = null"
      @focus="activeIndex = coords.length - 1"
      @blur="activeIndex = null"
      @keydown="onKeydown"
    >
      <g class="grid" aria-hidden="true">
        <g v-for="tick in yScale.ticks" :key="tick">
          <line :x1="plot.left" :x2="plot.right" :y1="y(tick)" :y2="y(tick)" />
          <text :x="plot.left - 10" :y="y(tick)" class="y-label">{{ tick }}</text>
        </g>
        <text
          v-for="tick in xTicks"
          :key="tick.date"
          :x="tick.cx"
          :y="HEIGHT - 8"
          class="x-label"
        >{{ shortDate.format(new Date(dayOf(tick.date))) }}</text>
      </g>

      <g v-if="goal != null" class="goal" aria-hidden="true">
        <line :x1="plot.left" :x2="plot.right" :y1="y(goal)" :y2="y(goal)" />
        <text :x="plot.right + 10" :y="y(goal)">Objetivo {{ formatValue(goal) }}</text>
      </g>

      <path v-if="areaPath" :d="areaPath" class="area" aria-hidden="true" />
      <path :d="linePath" class="line" aria-hidden="true" />

      <g v-if="last" aria-hidden="true">
        <circle :cx="last.cx" :cy="last.cy" r="5" class="end-dot" />
        <text :x="last.cx + 12" :y="last.cy" class="end-label">{{ formatValue(last.value) }}</text>
      </g>

      <g v-if="active" class="crosshair" aria-hidden="true">
        <line :x1="active.cx" :x2="active.cx" :y1="plot.top" :y2="plot.bottom" />
        <circle :cx="active.cx" :cy="active.cy" r="5" />
      </g>
    </svg>

    <div
      v-if="active"
      class="tooltip"
      :style="{ left: `${(active.cx / width) * 100}%`, top: `${active.cy}px` }"
      role="status"
    >
      <strong>{{ formatValue(active.value) }}</strong>
      <span>{{ longDate.format(new Date(dayOf(active.date))) }}</span>
    </div>

    <table class="sr-only">
      <caption>{{ label }}</caption>
      <thead><tr><th scope="col">Fecha</th><th scope="col">Valor</th></tr></thead>
      <tbody>
        <tr v-for="point in points" :key="point.date">
          <td>{{ longDate.format(new Date(dayOf(point.date))) }}</td>
          <td>{{ formatValue(point.value) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.weight-chart {
  position: relative;
  width: 100%;
}

svg {
  display: block;
  overflow: visible;
  touch-action: pan-y;
}

svg:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
  border-radius: 8px;
}

.grid line {
  stroke: #242424;
  stroke-width: 1;
}

.grid text,
.goal text {
  fill: var(--color-muted-text);
  font-size: 12px;
}

.y-label {
  text-anchor: end;
  dominant-baseline: middle;
}

.x-label {
  text-anchor: middle;
}

.goal line {
  stroke: var(--color-muted-text);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.goal text {
  dominant-baseline: middle;
}

.area {
  fill: var(--color-primary);
  fill-opacity: 0.1;
}

.line {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.end-dot,
.crosshair circle {
  fill: var(--color-primary);
  stroke: #111111;
  stroke-width: 2;
}

.end-label {
  fill: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  dominant-baseline: middle;
}

.crosshair line {
  stroke: var(--color-muted-text);
  stroke-width: 1;
}

.tooltip {
  position: absolute;
  display: grid;
  gap: 2px;
  padding: 8px 12px;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  background: #1a1a1a;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 14px));
  white-space: nowrap;
}

.tooltip strong {
  font-size: 15px;
}

.tooltip span {
  color: var(--color-muted-text);
  font-size: 12px;
}
</style>
