<template>
  <div class="bg-white shadow-sm rounded-lg p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Import from Jira</h3>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label for="jira_month" class="block text-sm font-medium text-gray-700">Month</label>
        <input
            v-model="month"
            type="month"
            id="jira_month"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div>
        <label for="hourly_rate" class="block text-sm font-medium text-gray-700">Hourly Rate</label>
        <input
            v-model.number="hourlyRate"
            type="number"
            id="hourly_rate"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div class="flex items-end">
        <button
            type="button"
            :disabled="!month || !hourlyRate || loading"
            @click="handleFetch"
            class="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
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

<script setup lang="ts">
import { ref } from 'vue'
import { useInvoiceData } from '@/composables/useInvoiceData'
import type { InvoiceLineItem } from '@/types/invoice'

const emit = defineEmits<{
    dataFetched: [lineItems: InvoiceLineItem[]]
}>()

const { monthlyData, loading, error, fetchMonthlyData } = useInvoiceData()

const month = ref('')
const hourlyRate = ref<number>(0)
const summary = ref<{ epicCount: number; totalHours: number } | null>(null)

async function handleFetch() {
    summary.value = null
    await fetchMonthlyData(month.value)

    if (monthlyData.value && monthlyData.value.epics.length > 0) {
        const lineItems: InvoiceLineItem[] = monthlyData.value.epics.map((epic) => ({
            description: `${epic.epic_key} - ${epic.epic_name}`,
            quantity: epic.total_hours,
            rate: hourlyRate.value,
            amount: epic.total_hours * hourlyRate.value,
        }))

        summary.value = {
            epicCount: lineItems.length,
            totalHours: monthlyData.value.grand_total_hours,
        }

        emit('dataFetched', lineItems)
    }
}
</script>
