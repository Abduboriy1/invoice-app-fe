<script lang="ts" setup>
import {ref} from 'vue'
import {useInvoiceData} from '@/composables/useInvoiceData'
import type {InvoiceLineItem} from '@/types/invoice'
import {useClient} from "@/composables/useClient.ts";

const emit = defineEmits<{
    dataFetched: [lineItems: InvoiceLineItem[]]
}>()

const {monthlyData, loading, error, fetchMonthlyData} = useInvoiceData()
const {currentClient} = useClient()


const month = ref('')
const summary = ref<{ epicCount: number; totalHours: number } | null>(null)

async function handleFetch() {
    summary.value = null
    await fetchMonthlyData(month.value)

    if (monthlyData.value && monthlyData.value.epics.length > 0) {
        const lineItems: InvoiceLineItem[] = monthlyData.value.epics.map((epic) => ({
            description: `${epic.epic_key} - ${epic.epic_name}`,
            quantity: epic.total_hours,
            application: epic.application,
            rate: currentClient?.value?.hourly_rate ?? 0.00,
            amount: (currentClient?.value?.hourly_rate ?? 0.00) * epic.total_hours
        }))

        summary.value = {
            epicCount: lineItems.length,
            totalHours: monthlyData.value.grand_total_hours,
        }

        emit('dataFetched', lineItems)
    }
}
</script>

<template>
    <div class="bg-white shadow-sm rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Import from Jira</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
                <label class="block text-sm font-medium text-gray-700" for="jira_month">Month</label>
                <input
                    id="jira_month"
                    v-model="month"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    type="month"
                />
            </div>
            <div class="flex items-end">
                <button
                    :disabled="!month || loading"
                    class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    type="button"
                    @click="handleFetch"
                >
                    <span v-if="loading">Fetching...</span>
                    <span v-else>Fetch Data</span>
                </button>
            </div>
        </div>

        <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {{ error }}
        </div>

        <div v-if="summary" class="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
            Imported {{ summary.epicCount }} line items totaling {{ summary.totalHours.toFixed(2) }} hours.
        </div>
    </div>
</template>
