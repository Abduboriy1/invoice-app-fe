import { apiClient } from './client'
import { MonthlyInvoiceDataResponse } from '@/types/invoiceData'

export const invoiceDataService = {
    async getMonthlyData(month: string): Promise<MonthlyInvoiceDataResponse> {
        const { data } = await apiClient.get(`/invoice-data/monthly/${month}`)
        return data
    },
}
