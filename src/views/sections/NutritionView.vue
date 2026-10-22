<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, Clock3, Flame, Utensils, X } from 'lucide-vue-next'
import { useNutritionController } from '@/controllers/useNutritionController'

const { activeTab, selectedCategory, selectedItem, items, categories, sourceUrl, isLoading, error, loadCatalogs, selectTab, openCategory, backToCategories, openItem, closeItem } = useNutritionController()
onMounted(loadCatalogs)
const query = ref('')
const filteredCategories = computed(() => categories.value.filter((category) => category.name.toLowerCase().includes(query.value.toLowerCase())))
const filteredItems = computed(() => items.value.filter((item) => item.name.toLowerCase().includes(query.value.toLowerCase())))
const onEscape = (event) => { if (event.key === 'Escape' && selectedItem.value) closeItem() }
</script>

<template>
  <section class="section-page nutrition-page" aria-labelledby="nutrition-title" @keydown="onEscape">
    <header class="nutrition-heading">
      <div>
        <p class="eyebrow">ALIMENTACIÓN PARA TUS OBJETIVOS</p>
        <h1 id="nutrition-title">Una buena alimentación también te acerca a tus metas.</h1>
        <span class="heading-accent"></span>
      </div>
      <Utensils class="heading-icon" :size="38" aria-hidden="true" />
    </header>

    <div class="nutrition-tabs" role="tablist" aria-label="Explorar alimentación">
      <button id="tab-foods" role="tab" :aria-selected="activeTab === 'foods'" aria-controls="nutrition-content" @click="selectTab('foods')">Alimentos</button>
      <button id="tab-recipes" role="tab" :aria-selected="activeTab === 'recipes'" aria-controls="nutrition-content" @click="selectTab('recipes')">Recetas</button>
    </div>

    <div class="catalog-toolbar">
      <div class="catalog-copy">
        <button v-if="selectedCategory" class="back-button" type="button" @click="backToCategories">
          <ArrowLeft :size="18" aria-hidden="true" /> Categorías
        </button>
        <p v-else class="muted">{{ activeTab === 'foods' ? 'Explora grupos de alimentos y consulta su información nutricional.' : 'Explora ideas saludables para cada momento del día.' }}</p>
        <h2 v-if="selectedCategory">{{ selectedCategory.name }}</h2>
      </div>
      <label class="search-box">
        <span class="sr-only">Buscar {{ activeTab === 'foods' ? 'alimentos' : 'recetas' }}</span>
        <input v-model="query" type="search" :placeholder="selectedCategory ? `Buscar en ${selectedCategory.name.toLowerCase()}` : 'Buscar categoría…'" />
      </label>
    </div>

    <div id="nutrition-content" role="tabpanel" :aria-labelledby="activeTab === 'foods' ? 'tab-foods' : 'tab-recipes'">
      <div v-if="isLoading" class="empty-state" role="status"><p>Cargando catálogo de alimentación…</p></div>
      <div v-else-if="error" class="empty-state" role="alert">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-filled" @click="loadCatalogs">Reintentar</button>
      </div>
      <ul v-else-if="!selectedCategory" class="category-grid" aria-label="Categorías">
        <li v-for="category in filteredCategories" :key="category.id">
          <button class="category-card" type="button" @click="openCategory(category)">
            <img :src="category.image" :alt="`Preparación de ${category.name.toLowerCase()}`" loading="lazy" />
            <span class="category-info"><strong>{{ category.name }}</strong><small>{{ activeTab === 'foods' ? category.description : 'Ver recetas saludables' }}</small></span>
            <span class="category-arrow" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>

      <template v-else>
        <p class="result-count muted">{{ filteredItems.length }} {{ activeTab === 'foods' ? 'alimentos' : 'recetas' }} disponibles</p>
        <ul v-if="filteredItems.length" class="item-grid" :class="{ 'food-grid': activeTab === 'foods' }">
          <li v-for="item in filteredItems" :key="item.id">
            <button class="item-card" type="button" @click="openItem(item)">
              <img :src="item.image" :alt="item.name" loading="lazy" />
              <span class="item-info">
                <strong>{{ item.name }}</strong>
                <span v-if="activeTab === 'recipes'" class="item-metadata">
                  <span><Clock3 :size="15" /> {{ item.minutes }} min</span>
                  <span><Flame :size="15" /> {{ item.calories }} kcal aprox.</span>
                </span>
                <span v-else class="item-metadata"><span><Flame :size="15" /> {{ item.calories }} kcal / 100 g</span></span>
                <small v-if="activeTab === 'recipes'">Proteína {{ item.protein }} g · Carbohidratos {{ item.carbs }} g · Grasas {{ item.fat }} g</small>
                <small v-else>Por cada 100 g · Ver información nutricional</small>
              </span>
            </button>
          </li>
        </ul>
        <div v-else class="empty-state"><p>No encontramos resultados para “{{ query }}”.</p></div>
      </template>
    </div>

    <footer class="source-note">
      <span>Fuente de referencia:</span>
      <a :href="sourceUrl" target="_blank" rel="noreferrer">{{ activeTab === 'foods' ? 'USDA FoodData Central' : 'Kaggle · Food.com Recipes and Reviews' }}</a>
      <p v-if="activeTab === 'foods'">Información nutricional de referencia por 100 g basada en USDA FoodData Central. Las fotografías tienen su fuente y licencia indicadas en cada ficha.</p>
      <p v-else>Los nombres, ingredientes y pasos se basan en Food.com en Kaggle. Calorías y macronutrientes son estimaciones de FitTrack; las fotos incluyen su fuente y licencia en cada ficha.</p>
    </footer>

    <Teleport to="body">
      <div v-if="selectedItem" class="nutrition-backdrop" @click.self="closeItem" @keydown.esc="closeItem">
        <article class="nutrition-dialog" role="dialog" aria-modal="true" :aria-labelledby="`detail-${selectedItem.id}`">
          <button type="button" class="dialog-close" aria-label="Cerrar detalle" @click="closeItem"><X :size="22" /></button>
          <img class="dialog-image" :src="selectedItem.image" :alt="selectedItem.name" />
          <div class="dialog-content">
            <p class="eyebrow">{{ activeTab === 'foods' ? 'INFORMACIÓN DEL ALIMENTO' : selectedCategory.name }}</p>
            <h2 :id="`detail-${selectedItem.id}`">{{ selectedItem.name }}</h2>
            <div class="dialog-facts">
              <span v-if="activeTab === 'recipes'"><Clock3 :size="16" /> {{ selectedItem.minutes }} min</span>
              <span><Flame :size="16" /> {{ selectedItem.calories }} kcal {{ activeTab === 'foods' ? '/ 100 g' : 'aprox. por porción' }}</span>
              <span v-if="activeTab === 'recipes'"><Utensils :size="16" /> {{ selectedItem.servings }} porciones</span>
            </div>

            <template v-if="activeTab === 'foods'">
              <p class="serving-note">Información nutricional reportada por USDA por {{ selectedItem.serving }}</p>
              <div class="nutrition-facts">
                <div><span>Proteína</span><strong>{{ selectedItem.protein }} g</strong></div>
                <div><span>Carbohidratos</span><strong>{{ selectedItem.carbs }} g</strong></div>
                <div><span>Grasas</span><strong>{{ selectedItem.fat }} g</strong></div>
                <div><span>Fibra</span><strong>{{ selectedItem.fiber == null ? 'No disponible' : `${selectedItem.fiber} g` }}</strong></div>
              </div>
              <h3>Beneficios</h3><p class="detail-paragraph">{{ selectedItem.benefits }}</p>
              <p class="detail-source">Información: <a :href="selectedItem.sourceUrl" target="_blank" rel="noreferrer">{{ selectedItem.source }}</a></p>
              <p v-if="selectedItem.imageSource?.sourcePage" class="detail-source">
                Fotografía: <a :href="selectedItem.imageSource.sourcePage" target="_blank" rel="noreferrer">{{ selectedItem.imageSource.title }}</a>
                <span v-if="selectedItem.imageSource.creator"> · {{ selectedItem.imageSource.creator }}</span>
                <span v-if="selectedItem.imageSource.license"> · <a :href="selectedItem.imageSource.licenseUrl" target="_blank" rel="noreferrer">{{ selectedItem.imageSource.license }}</a></span>
              </p>
            </template>
            <template v-else>
              <p class="serving-note">Por porción: proteína {{ selectedItem.protein }} g · carbohidratos {{ selectedItem.carbs }} g · grasas {{ selectedItem.fat }} g</p>
              <h3>Ingredientes</h3>
              <ul class="ingredients-list"><li v-for="ingredient in selectedItem.ingredients" :key="ingredient">{{ ingredient }}</li></ul>
              <h3>Preparación</h3>
              <ol class="steps-list"><li v-for="step in selectedItem.steps" :key="step">{{ step }}</li></ol>
              <p class="detail-source">{{ selectedItem.source }}</p>
              <p v-if="selectedItem.imageSource?.sourcePage" class="detail-source">
                Fotografía: <a :href="selectedItem.imageSource.sourcePage" target="_blank" rel="noreferrer">{{ selectedItem.imageSource.title }}</a>
                <span v-if="selectedItem.imageSource.creator"> · {{ selectedItem.imageSource.creator }}</span>
                <span v-if="selectedItem.imageSource.license"> · <a :href="selectedItem.imageSource.licenseUrl" target="_blank" rel="noreferrer">{{ selectedItem.imageSource.license }}</a></span>
              </p>
            </template>
          </div>
        </article>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.nutrition-page { padding-top: 34px; }
.nutrition-heading { display: flex; align-items: center; justify-content: space-between; gap: 22px; }
.eyebrow { color: var(--color-primary); font-size: 11px; font-weight: 700; letter-spacing: 1.8px; margin-bottom: 10px; }
h1 { max-width: 650px; font-size: clamp(28px, 4vw, 40px); letter-spacing: -1px; line-height: 1.15; }
.heading-accent { display: block; width: 58px; height: 4px; margin-top: 20px; border-radius: 3px; background: var(--color-primary); }
.heading-icon { color: var(--color-primary); flex-shrink: 0; }
.nutrition-tabs { display: flex; gap: 38px; margin-top: 30px; border-bottom: 1px solid var(--color-card-border); }
.nutrition-tabs button { position: relative; min-width: 105px; padding: 0 7px 15px; border: 0; background: none; color: var(--color-muted-text); font-size: 16px; cursor: pointer; }
.nutrition-tabs button[aria-selected="true"] { color: var(--color-primary); }
.nutrition-tabs button[aria-selected="true"]::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 3px; border-radius: 3px 3px 0 0; background: var(--color-primary); content: ''; }
.catalog-toolbar { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin: 22px 0 22px; }
.catalog-copy { display: grid; gap: 9px; }
.catalog-copy p { max-width: 620px; line-height: 1.5; }
.catalog-copy h2 { font-size: 26px; }
.back-button { display: flex; align-items: center; gap: 7px; width: fit-content; padding: 0; border: 0; background: none; color: var(--color-primary); font-size: 15px; cursor: pointer; }
.search-box input { width: min(270px, 36vw); height: 42px; padding: 0 14px; border: 1px solid var(--color-input-border); border-radius: 12px; outline: 0; background: var(--color-surface); }
.search-box input:focus { border-color: var(--color-primary); }
.category-grid,.item-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
.category-card { display: flex; align-items: center; width: 100%; min-height: 148px; overflow: hidden; padding: 0; border: 1px solid var(--color-card-border); border-radius: var(--radius-card); background: var(--color-surface); text-align: left; cursor: pointer; transition: border-color .18s, transform .18s; }
.category-card:hover,.item-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }
.category-card img { width: 36%; height: 148px; flex-shrink: 0; object-fit: cover; }
.category-info { display: grid; gap: 8px; min-width: 0; padding: 18px; }
.category-info strong { font-size: 20px; }
.category-info small { color: var(--color-muted-text); font-size: 14px; line-height: 1.45; }
.category-arrow { margin-left: auto; padding: 0 20px; color: var(--color-muted-text); font-size: 32px; }
.result-count { margin: 0 0 16px; font-size: 14px; }
.item-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
.item-card { display: flex; flex-direction: column; width: 100%; overflow: hidden; padding: 0; border: 1px solid var(--color-card-border); border-radius: var(--radius-card); background: var(--color-surface); text-align: left; cursor: pointer; transition: border-color .18s, transform .18s; }
.item-card > img { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: #14231d; }
.item-info { display: grid; gap: 10px; padding: 16px; }
.item-info strong { font-size: 19px; line-height: 1.3; }
.item-metadata { display: flex; flex-wrap: wrap; gap: 14px; color: var(--color-muted-text); font-size: 13px; }
.item-metadata span { display: inline-flex; align-items: center; gap: 6px; }
.item-metadata svg { color: var(--color-primary); }
.item-info small { color: var(--color-muted-text); font-size: 13px; line-height: 1.5; }
.source-note { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px; margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--color-card-border); color: var(--color-subtle-text); font-size: 12px; }
.source-note a,.detail-source a { color: var(--color-primary); }
.source-note p { flex-basis: 100%; margin-top: 3px; }
.empty-state { padding: 38px; border: 1px dashed var(--color-card-border); border-radius: 16px; color: var(--color-muted-text); text-align: center; }
.nutrition-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgb(0 0 0 / 72%); }
.nutrition-dialog { position: relative; width: min(800px,100%); max-height: min(90vh,900px); overflow-y: auto; border: 1px solid var(--color-card-border); border-radius: 24px; background: var(--color-surface); box-shadow: 0 22px 80px #000a; }
.dialog-close { position: absolute; top: 13px; right: 13px; z-index: 1; display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid #ffffff35; border-radius: 50%; background: #0009; cursor: pointer; }
.dialog-image { display: block; width: 100%; height: 300px; object-fit: cover; }
.dialog-content { padding: 24px 28px 28px; }
.dialog-content h2 { font-size: clamp(24px,4vw,32px); line-height: 1.2; }
.dialog-facts { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 14px; color: var(--color-muted-text); font-size: 14px; }
.dialog-facts span { display: inline-flex; align-items: center; gap: 7px; }
.dialog-facts svg { color: var(--color-primary); }
.serving-note { margin-top: 18px; color: var(--color-muted-text); line-height: 1.55; }
.dialog-content h3 { margin: 22px 0 10px; font-size: 18px; }
.nutrition-facts { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 15px; }
.nutrition-facts div { display: grid; gap: 5px; padding: 12px; border: 1px solid var(--color-card-border); border-radius: 12px; }
.nutrition-facts span { color: var(--color-muted-text); font-size: 12px; }
.detail-paragraph,.ingredients-list,.steps-list { color: var(--color-muted-text); line-height: 1.7; }
.ingredients-list,.steps-list { display: grid; gap: 7px; padding-left: 22px; }
.ingredients-list li::marker,.steps-list li::marker { color: var(--color-primary); }
.detail-source { margin-top: 20px; color: var(--color-subtle-text); font-size: 12px; }
button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
@media(max-width:900px) { .item-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media(max-width:650px) {
  .nutrition-page { padding: 28px 18px calc(var(--nav-height) + 110px); }
  .heading-icon { display: none; }
  .nutrition-tabs { justify-content: space-around; gap: 0; }
  .catalog-toolbar { align-items: stretch; flex-direction: column; }
  .search-box input { width: 100%; }
  .category-grid,.item-grid { grid-template-columns: 1fr; gap: 14px; }
  .category-card { min-height: 124px; }
  .category-card img { width: 34%; height: 124px; }
  .category-info { padding: 14px; }
  .category-info strong { font-size: 18px; }
  .category-info small { font-size: 12px; }
  .category-arrow { padding: 0 15px; }
  .item-card { border-radius: 20px; }
  .item-card > img { aspect-ratio: 16/8; }
  .item-info { padding: 14px 16px; }
  .nutrition-backdrop { align-items: end; padding: 0; }
  .nutrition-dialog { max-height: 92vh; border-radius: 22px 22px 0 0; }
  .dialog-image { height: 220px; }
  .dialog-content { padding: 20px; }
  .nutrition-facts { grid-template-columns: repeat(2,1fr); }
}
</style>
