// Devuelve los catálogos con la misma forma que tenían src/data/foods.json y recipes.json.
const number = value => value == null ? null : Number(value)

async function getCatalog(query, catalogId, categoryTable, itemSql, toItem) {
  const [catalog, categories, items] = await Promise.all([
    query('SELECT source, source_url, note FROM nutrition_catalogs WHERE id=$1', [catalogId]),
    query(`SELECT id, name, description, image, source FROM ${categoryTable} ORDER BY sort_order, id`),
    query(itemSql),
  ])
  const byCategory = new Map(categories.rows.map(category => [category.id, { ...category, items: [] }]))
  for (const item of items.rows) byCategory.get(item.category_id)?.items.push(toItem(item))
  return {
    source: catalog.rows[0]?.source ?? null,
    sourceUrl: catalog.rows[0]?.source_url ?? null,
    note: catalog.rows[0]?.note ?? null,
    categories: [...byCategory.values()],
  }
}

export function getFoodCatalog(query) {
  return getCatalog(query, 'foods', 'food_categories',
    'SELECT * FROM foods ORDER BY category_id, sort_order, id',
    food => ({
      id: food.id, name: food.name, calories: number(food.calories), protein: number(food.protein),
      carbs: number(food.carbs), fat: number(food.fat), fiber: number(food.fiber), serving: food.serving,
      benefits: food.benefits, source: food.source, sourceUrl: food.source_url, image: food.image,
      imageSource: food.image_source,
    }))
}

export function getRecipeCatalog(query) {
  return getCatalog(query, 'recipes', 'recipe_categories',
    'SELECT * FROM recipes ORDER BY category_id, sort_order, id',
    recipe => ({
      id: recipe.id, name: recipe.name, minutes: recipe.minutes, servings: recipe.servings,
      calories: number(recipe.calories), protein: number(recipe.protein), carbs: number(recipe.carbs),
      fat: number(recipe.fat), ingredients: recipe.ingredients, steps: recipe.steps, source: recipe.source,
      sourceRecipeName: recipe.source_recipe_name, image: recipe.image, imageSource: recipe.image_source,
    }))
}
