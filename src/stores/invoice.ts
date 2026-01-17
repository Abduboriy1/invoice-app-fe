import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoiceService } from '@/services/api/invoice.service'
import { Invoice, InvoiceCreateRequest } from '@/types/invoice'

export const useInvoiceStore = defineStore('invoice', () => {
    const invoices = ref<Invoice[]>([])
    const currentInvoice = ref<Invoice | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchInvoices() {
        loading.value = true
        error.value = null
        try {
            invoices.value = await invoiceService.list()
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function fetchInvoice(id: string) {
        loading.value = true
        error.value = null
        try {
            currentInvoice.value = await invoiceService.get(id)
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function createInvoice(data: InvoiceCreateRequest) {
        loading.value = true
        error.value = null
        try {
            const invoice = await invoiceService.create(data)
            invoices.value.push(invoice)
            return invoice
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateInvoice(id: string, data: Partial<InvoiceCreateRequest>) {
        loading.value = true
        error.value = null
        try {
            const updated = await invoiceService.update(id, data)
            const index = invoices.value.findIndex((inv) => inv.id === id)
            if (index !== -1) {
                invoices.value[index] = updated
            }
            if (currentInvoice.value?.id === id) {
                currentInvoice.value = updated
            }
            return updated
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function deleteInvoice(id: string) {
        loading.value = true
        error.value = null
        try {
            await invoiceService.delete(id)
            invoices.value = invoices.value.filter((inv) => inv.id !== id)
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function sendInvoice(id: string) {
        try {
            await invoiceService.send(id)
            await fetchInvoice(id) // Refresh to get updated status
        } catch (e: any) {
            error.value = e.message
            throw e
        }
    }

    async function downloadPDF(id: string) {
        try {
            const blob = await invoiceService.generatePDF(id)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `invoice-${id}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (e: any) {
            error.value = e.message
            throw e
        }
    }

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
})