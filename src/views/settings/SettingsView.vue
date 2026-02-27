<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/api/user.service'
import { useToast } from 'vue-toastification'
import type { UserProfileUpdateRequest } from '@/types/user'
import ThreeColumnLayout from '@/layouts/ThreeColumnLayout.vue'

const authStore = useAuthStore()
const toast = useToast()
const loading = ref(false)
const saving = ref(false)

const form = reactive<UserProfileUpdateRequest>({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    address: '',
})

onMounted(async () => {
    loading.value = true
    try {
        await authStore.fetchProfile()
        if (authStore.user) {
            form.full_name = authStore.user.full_name || ''
            form.email = authStore.user.email || ''
            form.company_name = authStore.user.company_name || ''
            form.phone = authStore.user.phone || ''
            form.address = authStore.user.address || ''
        }
    } finally {
        loading.value = false
    }
})

async function handleSave() {
    saving.value = true
    try {
        const updated = await userService.updateProfile({ ...form })
        authStore.user = updated
        toast.success('Profile updated successfully')
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to update profile')
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <ThreeColumnLayout>
        <template #center>
            <div class="px-4 sm:px-0">
                <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>
                <p class="mt-2 text-sm text-gray-700">Manage your profile information.</p>

                <div v-if="loading" class="mt-8 text-center">
                    <p class="text-gray-500">Loading profile...</p>
                </div>

                <form v-else @submit.prevent="handleSave" class="mt-8 space-y-6">
                    <div class="bg-white shadow-sm rounded-lg p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Profile</h3>
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label for="full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    v-model="form.full_name"
                                    type="text"
                                    id="full_name"
                                    required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    v-model="form.email"
                                    type="email"
                                    id="email"
                                    required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label for="company_name" class="block text-sm font-medium text-gray-700">Company Name</label>
                                <input
                                    v-model="form.company_name"
                                    type="text"
                                    id="company_name"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    v-model="form.phone"
                                    type="tel"
                                    id="phone"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div class="sm:col-span-2">
                                <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
                                <textarea
                                    v-model="form.address"
                                    id="address"
                                    rows="3"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <button
                            type="submit"
                            :disabled="saving"
                            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                            {{ saving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </ThreeColumnLayout>
</template>
