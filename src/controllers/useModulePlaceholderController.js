import { computed, toValue } from 'vue'

import { APP_SECTIONS, AppSection } from '@/core/constants'
import { useAppStateController } from './appStateController'

export function useModulePlaceholderController(section) {
  const state = useAppStateController()

  const info = computed(() => APP_SECTIONS[toValue(section)])
  const count = computed(() => {
    switch (toValue(section)) {
      case AppSection.training:
        return state.routines.length
      case AppSection.nutrition:
        return state.foods.length + state.recipes.length
      case AppSection.progress:
        return state.progress.length
      default:
        return 1
    }
  })
  const countLabel = computed(() => {
    const plural = count.value === 1 ? '' : 's'
    return `${count.value} registro${plural} mock disponible${plural}`
  })

  return { info, count, countLabel }
}
