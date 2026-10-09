<script setup>
import { Utensils } from 'lucide-vue-next'

import { AppSection } from '@/core/constants'
import ModulePlaceholder from './ModulePlaceholder.vue'
</script>

<template>
  <ModulePlaceholder :section="AppSection.nutrition" :icon="Utensils" />
</template>
