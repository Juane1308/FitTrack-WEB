import foods from './foods.json'
import recipes from './recipes.json'

const nutritionPhotos = import.meta.glob('../assets/images/nutrition/**/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
})

const resolveImage = (imagePath) => nutritionPhotos[`../assets/images/nutrition/${imagePath}`] ?? ''
const attachImages = (catalog) => catalog.map((category) => ({
  ...category,
  image: resolveImage(category.image),
  items: category.items.map((item) => ({ ...item, image: resolveImage(item.image) })),
}))

export const foodCategories = attachImages(foods.categories)
export const recipeCategories = attachImages(recipes.categories)
export const nutritionSources = { foods: foods.sourceUrl, recipes: recipes.sourceUrl }
