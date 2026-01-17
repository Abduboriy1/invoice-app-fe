import { apiClient } from './client'
import { Invoice, InvoiceCreateRequest } from '@/types/invoice'

export const invoiceService = {
    async list(params?: { page?: number; limit?: number }): Promise<Invoice[]> {
        const { data } = await apiClient.get('/invoices', { params })
        return data
    },

    async get(id: string): Promise<Invoice> {
        const { data } = await apiClient.get(`/invoices/${id}`)
        return data
    },

    async create(invoice: InvoiceCreateRequest): Promise<Invoice> {
        const { data } = await apiClient.post('/invoices', invoice)
        return data
    },

    async update(id: string, invoice: Partial<InvoiceCreateRequest>): Promise<Invoice> {
        const { data } = await apiClient.put(`/invoices/${id}`, invoice)
        return data
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/invoices/${id}`)
    },

    async send(id: string): Promise<void> {
        await apiClient.post(`/invoices/${id}/send`)
    },

    async generatePDF(id: string): Promise<Blob> {
        const { data } = await apiClient.get(`/invoices/${id}/pdf`, {
            responseType: 'blob',
        })
        return data
    },
}