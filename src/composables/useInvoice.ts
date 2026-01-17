import { computed } from 'vue'
import { useInvoiceStore } from '@/stores/invoice'
import { InvoiceCreateRequest } from '@/types/invoice'

export function useInvoice() {
    const store = useInvoiceStore()

    const invoices = computed(() => store.invoices)
    const currentInvoice = computed(() => store.currentInvoice)
    const loading = computed(() => store.loading)
    const error = computed(() => store.error)

    const fetchInvoices = () => store.fetchInvoices()
    const fetchInvoice = (id: string) => store.fetchInvoice(id)
    const createInvoice = (data: InvoiceCreateRequest) => store.createInvoice(data)
    const updateInvoice = (id: string, data: Partial<InvoiceCreateRequest>) =>
        store.updateInvoice(id, data)
    const deleteInvoice = (id: string) => store.deleteInvoice(id)
    const sendInvoice = (id: string) => store.sendInvoice(id)
    const downloadPDF = (id: string) => store.downloadPDF(id)

    return {
        invoices,
        currentInvoice,
        loading,
        error,
        fetchInvoices,
        fetchInvoice,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        sendInvoice,
        downloadPDF,
    }
}