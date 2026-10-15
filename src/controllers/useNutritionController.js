import { ref, computed } from 'vue'
export function useNutritionController() {
  const activeTab = ref('foods'), selectedCategory = ref(null), selectedItem = ref(null)
  const selectTab = (tab) => { activeTab.value = tab; selectedCategory.value = null; selectedItem.value = null }
  const openCategory = (category) => { selectedCategory.value = category }
  const backToCategories = () => { selectedCategory.value = null; selectedItem.value = null }
  const openItem = (item) => { selectedItem.value = item }
  const closeItem = () => { selectedItem.value = null }
  const items = computed(() => selectedCategory.value?.items ?? [])
  return { activeTab, selectedCategory, selectedItem, items, selectTab, openCategory, backToCategories, openItem, closeItem }
}
