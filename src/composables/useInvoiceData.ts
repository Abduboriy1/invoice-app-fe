import { computed } from 'vue'
import { useInvoiceDataStore } from '@/stores/invoiceData'

export function useInvoiceData() {
    const store = useInvoiceDataStore()

    const monthlyData = computed(() => store.monthlyData)
    const loading = computed(() => store.loading)
    const error = computed(() => store.error)

    const fetchMonthlyData = (month: string) => store.fetchMonthlyData(month)
    const clearData = () => store.clearData()

    return {
        monthlyData,
        loading,
        error,
        fetchMonthlyData,
        clearData,
    }
}
