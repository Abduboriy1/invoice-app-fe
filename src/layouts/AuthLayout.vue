<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-bold text-primary-600">Invoice App</h1>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <router-link
                                to="/"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                active-class="border-primary-500 text-gray-900"
                            >
                                Dashboard
                            </router-link>
                            <router-link
                                to="/invoices"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                active-class="border-primary-500 text-gray-900"
                            >
                                Invoices
                            </router-link>
                            <router-link
                                to="/time-tracking"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                active-class="border-primary-500 text-gray-900"
                            >
                                Time Tracking
                            </router-link>
                            <router-link
                                to="/time-entries"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                active-class="border-primary-500 text-gray-900"
                            >
                                Time Entries
                            </router-link>
                            <router-link
                                to="/projects"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                active-class="border-primary-500 text-gray-900"
                            >
                                Projects
                            </router-link>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="ml-3 relative">
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-gray-700">{{ authStore.user?.name || authStore.user?.email }}</span>
                                <button
                                    @click="handleLogout"
                                    class="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main>
            <router-view />
        </main>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

function handleLogout() {
    authStore.logout()
    toast.info('Logged out successfully')
    router.push('/login')
}
</script>