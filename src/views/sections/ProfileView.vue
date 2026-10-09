<script setup>
import { LogOut, User } from 'lucide-vue-next'

import { AppSection } from '@/core/constants'
import { useProfileController } from '@/controllers/useProfileController'
import ModulePlaceholder from './ModulePlaceholder.vue'

const { logout } = useProfileController()
</script>

<template>
  <ModulePlaceholder :section="AppSection.profile" :icon="User">
    <button type="button" class="btn btn-outlined btn-block logout" @click="logout">
      <LogOut :size="20" aria-hidden="true" />
      Cerrar sesión
    </button>
  </ModulePlaceholder>
</template>

<style scoped>
.logout {
  margin-top: 24px;
}
</style>
