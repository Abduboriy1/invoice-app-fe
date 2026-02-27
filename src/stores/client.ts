import { defineStore } from 'pinia'
import { ref } from 'vue'
import { clientService } from '@/services/api/client.service'
import { Client, ClientCreateRequest } from '@/types/client'

export const useClientStore = defineStore('client', () => {
    const clients = ref<Client[]>([])
    const currentClient = ref<Client | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchClients() {
        loading.value = true
        error.value = null
        try {
            clients.value = await clientService.list()
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function fetchClient(id: string) {
        loading.value = true
        error.value = null
        try {
            currentClient.value = await clientService.get(id)
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function createClient(data: ClientCreateRequest) {
        loading.value = true
        error.value = null
        try {
            const client = await clientService.create(data)
            clients.value.push(client)
            return client
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateClient(id: string, data: Partial<ClientCreateRequest>) {
        loading.value = true
        error.value = null
        try {
            const updated = await clientService.update(id, data)
            const index = clients.value.findIndex((c) => c.id === id)
            if (index !== -1) {
                clients.value[index] = updated
            }
            if (currentClient.value?.id === id) {
                currentClient.value = updated
            }
            return updated
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function deleteClient(id: string) {
        loading.value = true
        error.value = null
        try {
            await clientService.delete(id)
            clients.value = clients.value.filter((c) => c.id !== id)
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function setCurrentClient(client: Client) {
        currentClient.value = client
    }

    return {
        clients,
        currentClient,
        setCurrentClient,
        loading,
        error,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        deleteClient,
    }
})
