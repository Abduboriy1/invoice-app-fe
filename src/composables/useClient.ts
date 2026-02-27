import { computed } from 'vue'
import { useClientStore } from '@/stores/client'
import {Client, ClientCreateRequest} from '@/types/client'

export function useClient() {
    const store = useClientStore()

    const clients = computed(() => store.clients)
    const currentClient = computed(() => store.currentClient)
    const loading = computed(() => store.loading)
    const error = computed(() => store.error)

    const fetchClients = () => store.fetchClients()
    const fetchClient = (id: string) => store.fetchClient(id)
    const createClient = (data: ClientCreateRequest) => store.createClient(data)
    const updateClient = (id: string, data: Partial<ClientCreateRequest>) =>
        store.updateClient(id, data)
    const deleteClient = (id: string) => store.deleteClient(id)
    const setCurrentClient = (client: Client) => store.setCurrentClient(client)

    return {
        clients,
        currentClient,
        loading,
        error,
        setCurrentClient,
        fetchClients,
        fetchClient,
        createClient,
        updateClient,
        deleteClient,
    }
}
