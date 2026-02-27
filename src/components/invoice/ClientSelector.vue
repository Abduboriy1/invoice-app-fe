<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {useClient} from '@/composables/useClient'
import {useToast} from 'vue-toastification'
import type {ClientCreateRequest} from '@/types/client'
import ClientFormModal from '@/components/client/ClientFormModal.vue'

interface ClientFields {
    client_name: string
    client_email: string
    client_address: string
    client_phone: string
    client_company: string
    client_id?: string
    hourly_rate?: number
}

const props = defineProps<{
    modelValue: ClientFields
}>()

const emit = defineEmits<{
    'update:modelValue': [value: ClientFields]
}>()

const {clients, fetchClients, createClient, setCurrentClient} = useClient()
const toast = useToast()

const selectedClientId = ref('')
const showQuickAdd = ref(false)

function updateField(field: keyof ClientFields, value: string) {
    emit('update:modelValue', {...props.modelValue, [field]: value})
}

function handleClientChange() {
    const client = clients.value.find((c) => c.id === selectedClientId.value)
    if (client) {
        setCurrentClient(client)
        emit('update:modelValue', {
            client_name: client.name,
            client_email: client.email || '',
            client_address: client.address || '',
            client_phone: client.phone || '',
            client_company: client.company_name || '',
            client_id: client.id,
            hourly_rate: client.hourly_rate,
        })
    }
}

async function handleQuickAdd(data: ClientCreateRequest) {
    try {
        const newClient = await createClient(data)
        setCurrentClient(newClient)
        toast.success('Client created')
        showQuickAdd.value = false
        selectedClientId.value = newClient.id
        emit('update:modelValue', {
            client_name: newClient.name,
            client_email: newClient.email || '',
            client_address: newClient.address || '',
            client_phone: newClient.phone || '',
            client_company: newClient.company_name || '',
            client_id: newClient.id,
            hourly_rate: newClient.hourly_rate,
        })
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to create client')
    }
}

onMounted(() => {
    fetchClients()
})
</script>

<template>
    <div class="bg-white shadow-sm rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700" for="client_select">Select Client</label>
                <div class="mt-1 flex space-x-2">
                    <select
                        id="client_select"
                        v-model="selectedClientId"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        @change="handleClientChange"
                    >
                        <option value="">-- Select a client --</option>
                        <option v-for="client in clients" :key="client.id" :value="client.id">
                            {{ client.name }}{{ client.company_name ? ` (${client.company_name})` : '' }}
                        </option>
                    </select>
                    <button
                        class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap"
                        type="button"
                        @click="showQuickAdd = true"
                    >
                        + New
                    </button>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" for="client_name">Client Name</label>
                <input
                    id="client_name"
                    :value="modelValue.client_name"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                    type="text"
                    @input="updateField('client_name', ($event.target as HTMLInputElement).value)"
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" for="client_email">Client Email</label>
                <input
                    id="client_email"
                    :value="modelValue.client_email"
                    class="mt-1 w-full block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                    type="email"
                    @input="updateField('client_email', ($event.target as HTMLInputElement).value)"
                />
            </div>
            <div class="sm:col-span-1">
                <label class="block text-sm font-medium text-gray-700" for="client_address">Client Address</label>
                <input
                    id="client_address"
                    :value="modelValue.client_address"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    @input="updateField('client_address', ($event.target as HTMLInputElement).value)"
                />
            </div>
            <div class="sm:col-span-1">
                <label class="block text-sm font-medium text-gray-700" for="client_address">Hourly Rate</label>
                <input
                    :value="modelValue.hourly_rate"
                    type="number"
                    id="hourly_rate"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    @input="emit('update:modelValue', {...modelValue, hourly_rate: parseFloat(($event.target as HTMLInputElement).value) || 0})"
                />
            </div>
        </div>

        <ClientFormModal
            :visible="showQuickAdd"
            @close="showQuickAdd = false"
            @save="handleQuickAdd"
        />
    </div>
</template>
