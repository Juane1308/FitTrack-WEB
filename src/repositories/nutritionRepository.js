import { apiRequest } from './apiClient'

// Las fotos son recursos del proyecto; la BD guarda su ruta relativa (foods/proteins-1.jpg).
const nutritionPhotos = import.meta.glob('../assets/images/nutrition/**/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
})

const resolveImage = (imagePath) => nutritionPhotos[`../assets/images/nutrition/${imagePath}`] ?? ''

function toCatalog(data) {
  if (!Array.isArray(data?.categories)) throw new Error('Respuesta del catálogo de alimentación inválida')
  return {
    sourceUrl: data.sourceUrl,
    categories: data.categories.map((category) => ({
      ...category,
      image: resolveImage(category.image),
      items: category.items.map((item) => ({ ...item, image: resolveImage(item.image) })),
    })),
  }
}

export class NutritionRepository {
  async getFoods() {
    return toCatalog(await apiRequest('/api/nutrition/foods'))
  }

  async getRecipes() {
    return toCatalog(await apiRequest('/api/nutrition/recipes'))
  }
}
