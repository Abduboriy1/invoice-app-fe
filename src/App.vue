<template>
  <router-view />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

if (authStore.isAuthenticated) {
  authStore.fetchProfile()
}
</script>
