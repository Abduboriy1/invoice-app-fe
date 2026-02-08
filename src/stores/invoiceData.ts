import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoiceDataService } from '@/services/api/invoiceData.service'
import { MonthlyInvoiceDataResponse } from '@/types/invoiceData'

export const useInvoiceDataStore = defineStore('invoiceData', () => {
    const monthlyData = ref<MonthlyInvoiceDataResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchMonthlyData(month: string) {
        loading.value = true
        error.value = null
        try {
            monthlyData.value = await invoiceDataService.getMonthlyData(month)
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    function clearData() {
        monthlyData.value = null
        error.value = null
    }

    return {
        monthlyData,
        loading,
        error,
        fetchMonthlyData,
        clearData,
    }
})
