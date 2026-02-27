<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {useClient} from '@/composables/useClient'
import {useToast} from 'vue-toastification'
import type {Client, ClientCreateRequest} from '@/types/client'
import ClientFormModal from '@/components/client/ClientFormModal.vue'
import ThreeColumnLayout from '@/layouts/ThreeColumnLayout.vue'


const {clients, loading, error, fetchClients, createClient, updateClient, deleteClient} = useClient()
const toast = useToast()

const modalVisible = ref(false)
const editingClient = ref<Client | null>(null)

function openCreateModal() {
    editingClient.value = null
    modalVisible.value = true
}

function openEditModal(client: Client) {
    editingClient.value = client
    modalVisible.value = true
}

function closeModal() {
    modalVisible.value = false
    editingClient.value = null
}

async function handleSave(data: ClientCreateRequest) {
    try {
        if (editingClient.value) {
            await updateClient(editingClient.value.id, data)
            toast.success('Client updated')
        } else {
            await createClient(data)
            toast.success('Client created')
        }
        closeModal()
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to save client')
    }
}

async function handleDelete(client: Client) {
    if (!confirm(`Are you sure you want to delete "${client.name}"?`)) return
    try {
        await deleteClient(client.id)
        toast.success('Client deleted')
    } catch (e: any) {
        if (e.response?.status === 409) {
            toast.error('Cannot delete client: they have associated invoices')
        } else {
            toast.error(e.response?.data?.message || 'Failed to delete client')
        }
    }
}

onMounted(() => {
    fetchClients()
})
</script>

<template>
    <ThreeColumnLayout>
        <template #center>
            <div class="px-4 sm:px-0">
                <div class="sm:flex sm:items-center">
                    <div class="sm:flex-auto">
                        <h1 class="text-2xl font-semibold text-gray-900">Clients</h1>
                        <p class="mt-2 text-sm text-gray-700">Manage your clients.</p>
                    </div>
                    <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
                            @click="openCreateModal"
                        >
                            Add Client
                        </button>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="mt-8 text-center">
                    <p class="text-gray-500">Loading clients...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="mt-8 rounded-md bg-red-50 p-4">
                    <p class="text-sm text-red-800">{{ error }}</p>
                </div>

                <!-- Clients Table -->
                <div v-else class="mt-8 flex flex-col">
                    <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50">
                                    <tr>
                                        <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                            scope="col">
                                            Name
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Company
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Email
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Phone
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Hourly Rate
                                        </th>
                                        <th class="relative py-3.5 pl-3 pr-4 sm:pr-6" scope="col">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                    <tr v-for="client in clients" :key="client.id">
                                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {{ client.name }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {{ client.company_name || '—' }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {{ client.email || '—' }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {{ client.phone || '—' }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {{ client.hourly_rate != null ? `$${client.hourly_rate.toFixed(2)}` : '—' }}
                                        </td>
                                        <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                class="text-primary-600 hover:text-primary-900 mr-4"
                                                @click="openEditModal(client)"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                class="text-red-600 hover:text-red-900"
                                                @click="handleDelete(client)"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>

                                <div v-if="clients.length === 0" class="text-center py-12">
                                    <p class="text-sm text-gray-500">No clients found. Add your first client!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ClientFormModal
                    :client="editingClient"
                    :visible="modalVisible"
                    @close="closeModal"
                    @save="handleSave"
                />
            </div>
        </template>
    </ThreeColumnLayout>
</template>
