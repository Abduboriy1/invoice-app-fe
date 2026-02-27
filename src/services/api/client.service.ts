import { apiClient } from './client'
import { Client, ClientCreateRequest } from '@/types/client'

export const clientService = {
    async list(): Promise<Client[]> {
        const { data } = await apiClient.get('/clients')
        return data
    },

    async get(id: string): Promise<Client> {
        const { data } = await apiClient.get(`/clients/${id}`)
        return data
    },

    async create(client: ClientCreateRequest): Promise<Client> {
        const { data } = await apiClient.post('/clients', client)
        return data
    },

    async update(id: string, client: Partial<ClientCreateRequest>): Promise<Client> {
        const { data } = await apiClient.put(`/clients/${id}`, client)
        return data
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/clients/${id}`)
    },
}
