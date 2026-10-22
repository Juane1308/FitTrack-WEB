import { readFile } from 'node:fs/promises'
import { transaction, pool } from './db.js'

// Run explicitly (npm run nutrition:import); never part of API startup. Safe to repeat: upserts by id.
const foods = JSON.parse(await readFile(new URL('../src/data/foods.json', import.meta.url)))
const recipes = JSON.parse(await readFile(new URL('../src/data/recipes.json', import.meta.url)))
if (!pool) throw new Error('Configura DATABASE_URL antes de importar')

const ids = catalog => catalog.categories.flatMap(category => [category.id, ...category.items.map(item => item.id)])
for (const catalog of [foods, recipes]) {
  if (new Set(ids(catalog)).size !== ids(catalog).length) throw new Error('Dataset inválido: identificadores duplicados')
}

async function upsertCategories(client, table, categories) {
  for (const [index, category] of categories.entries()) {
    await client.query(`INSERT INTO ${table} (id, name, description, image, source, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
      image=EXCLUDED.image, source=EXCLUDED.source, sort_order=EXCLUDED.sort_order`,
    [category.id, category.name, category.description, category.image, category.source, index])
  }
}

try {
  await transaction(async client => {
    await client.query(`INSERT INTO nutrition_catalogs (id, source, source_url, note) VALUES
      ('foods', $1, $2, $3), ('recipes', $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET source=EXCLUDED.source, source_url=EXCLUDED.source_url, note=EXCLUDED.note`,
    [foods.source, foods.sourceUrl, foods.basis, recipes.referenceDataset, recipes.sourceUrl, recipes.note])

    await upsertCategories(client, 'food_categories', foods.categories)
    for (const category of foods.categories) {
      for (const [index, food] of category.items.entries()) {
        await client.query(`INSERT INTO foods (id, category_id, name, calories, protein, carbs, fat, fiber, serving,
            benefits, source, source_url, image, image_source, sort_order)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          ON CONFLICT (id) DO UPDATE SET category_id=EXCLUDED.category_id, name=EXCLUDED.name,
          calories=EXCLUDED.calories, protein=EXCLUDED.protein, carbs=EXCLUDED.carbs, fat=EXCLUDED.fat,
          fiber=EXCLUDED.fiber, serving=EXCLUDED.serving, benefits=EXCLUDED.benefits, source=EXCLUDED.source,
          source_url=EXCLUDED.source_url, image=EXCLUDED.image, image_source=EXCLUDED.image_source, sort_order=EXCLUDED.sort_order`,
        [food.id, category.id, food.name, food.calories, food.protein, food.carbs, food.fat, food.fiber ?? null,
          food.serving, food.benefits, food.source, food.sourceUrl ?? null, food.image, food.imageSource ?? null, index])
      }
    }

    await upsertCategories(client, 'recipe_categories', recipes.categories)
    for (const category of recipes.categories) {
      for (const [index, recipe] of category.items.entries()) {
        await client.query(`INSERT INTO recipes (id, category_id, name, minutes, servings, calories, protein, carbs, fat,
            ingredients, steps, source, source_recipe_name, image, image_source, sort_order)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
          ON CONFLICT (id) DO UPDATE SET category_id=EXCLUDED.category_id, name=EXCLUDED.name,
          minutes=EXCLUDED.minutes, servings=EXCLUDED.servings, calories=EXCLUDED.calories, protein=EXCLUDED.protein,
          carbs=EXCLUDED.carbs, fat=EXCLUDED.fat, ingredients=EXCLUDED.ingredients, steps=EXCLUDED.steps,
          source=EXCLUDED.source, source_recipe_name=EXCLUDED.source_recipe_name, image=EXCLUDED.image,
          image_source=EXCLUDED.image_source, sort_order=EXCLUDED.sort_order`,
        [recipe.id, category.id, recipe.name, recipe.minutes, recipe.servings, recipe.calories, recipe.protein,
          recipe.carbs, recipe.fat, recipe.ingredients, recipe.steps, recipe.source, recipe.sourceRecipeName ?? null,
          recipe.image, recipe.imageSource ?? null, index])
      }
    }
  })
  const count = catalog => catalog.categories.reduce((total, category) => total + category.items.length, 0)
  console.log(`Alimentación importada: ${count(foods)} alimentos y ${count(recipes)} recetas.`)
} catch (error) {
  console.error('Importación revertida:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
