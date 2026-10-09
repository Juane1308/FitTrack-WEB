<script setup>
import { ChartLine } from 'lucide-vue-next'

import { AppSection } from '@/core/constants'
import ModulePlaceholder from './ModulePlaceholder.vue'
</script>

<template>
  <ModulePlaceholder :section="AppSection.progress" :icon="ChartLine" />
</template>
