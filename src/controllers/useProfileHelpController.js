import { computed, ref } from 'vue'

import { ProfileRepository } from '@/repositories/profileRepository'

export function useProfileHelpController(repository = new ProfileRepository()) {
  const faqs = ref([])
  const isLoading = ref(false)
  const error = ref('')

  // Agrupa las preguntas por categoría conservando el orden que define la BD.
  const groups = computed(() => {
    const byCategory = new Map()
    for (const faq of faqs.value) {
      if (!byCategory.has(faq.category)) byCategory.set(faq.category, [])
      byCategory.get(faq.category).push(faq)
    }
    return [...byCategory].map(([category, items]) => ({ category, items }))
  })

  async function loadFaqs() {
    isLoading.value = true
    error.value = ''
    try {
      faqs.value = await repository.getFaqs()
    } catch (_exception) {
      error.value = 'No fue posible cargar la ayuda. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  return { groups, isLoading, error, loadFaqs }
}
