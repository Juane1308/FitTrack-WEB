<script setup>
import { Dumbbell } from 'lucide-vue-next'

import { AppSection } from '@/core/constants'
import ModulePlaceholder from './ModulePlaceholder.vue'
</script>

<template>
  <ModulePlaceholder :section="AppSection.training" :icon="Dumbbell" />
</template>
