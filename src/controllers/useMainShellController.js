import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { APP_SECTIONS, AppSection } from '@/core/constants'
import { ChatContext } from '@/models'

export function useMainShellController() {
  const route = useRoute()

  const sections = Object.values(AppSection).map((key) => ({
    key,
    label: APP_SECTIONS[key].label,
  }))
  const currentSection = computed(() => route.meta.section ?? AppSection.home)
  const chatContext = computed(() => new ChatContext({ section: currentSection.value }))

  return { sections, currentSection, chatContext }
}
