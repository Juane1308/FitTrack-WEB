import { ref, computed } from 'vue'

import { NutritionRepository } from '@/repositories/nutritionRepository'

export function useNutritionController(repository = new NutritionRepository()) {
  const activeTab = ref('foods'), selectedCategory = ref(null), selectedItem = ref(null)
  const catalogs = ref({ foods: null, recipes: null })
  const isLoading = ref(false), error = ref('')
  const selectTab = (tab) => { activeTab.value = tab; selectedCategory.value = null; selectedItem.value = null }
  const openCategory = (category) => { selectedCategory.value = category }
  const backToCategories = () => { selectedCategory.value = null; selectedItem.value = null }
  const openItem = (item) => { selectedItem.value = item }
  const closeItem = () => { selectedItem.value = null }
  const items = computed(() => selectedCategory.value?.items ?? [])
  const categories = computed(() => catalogs.value[activeTab.value]?.categories ?? [])
  const sourceUrl = computed(() => catalogs.value[activeTab.value]?.sourceUrl ?? '')

  async function loadCatalogs() {
    isLoading.value = true
    error.value = ''
    try {
      const [foods, recipes] = await Promise.all([repository.getFoods(), repository.getRecipes()])
      catalogs.value = { foods, recipes }
    } catch (_exception) {
      error.value = 'No fue posible cargar el catálogo de alimentación. Intenta nuevamente.'
    } finally {
      isLoading.value = false
    }
  }

  return { activeTab, selectedCategory, selectedItem, items, categories, sourceUrl, isLoading, error, loadCatalogs, selectTab, openCategory, backToCategories, openItem, closeItem }
}
