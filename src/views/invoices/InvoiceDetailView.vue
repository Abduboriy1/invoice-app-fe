<template>
  <div class="px-4 sm:px-0">
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading invoice...</p>
    </div>

    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <div v-else-if="currentInvoice">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">
            {{ currentInvoice.invoice_number || `Invoice #${currentInvoice.id}` }}
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Created on {{ formatDate(currentInvoice.created_at || currentInvoice.issue_date) }}
          </p>
        </div>
        <div class="flex space-x-3">
          <button
              @click="handleDownloadPDF"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Download PDF
          </button>
          <button
              v-if="currentInvoice.status === InvoiceStatus.DRAFT"
              @click="handleSendInvoice"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Send Invoice
          </button>
          <router-link
              :to="`/invoices/${currentInvoice.id}/edit`"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit
          </router-link>
        </div>
      </div>

      <!-- Invoice Preview -->
      <div class="bg-white shadow-sm rounded-lg p-8">
        <!-- Status Badge -->
        <div class="mb-6">
          <span :class="getStatusClass(currentInvoice.status)" class="inline-flex rounded-full px-3 py-1 text-sm font-semibold">
            {{ currentInvoice.status }}
          </span>
        </div>

        <!-- Invoice Info Grid -->
        <div class="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Bill To</h3>
            <p class="mt-2 text-sm text-gray-900 font-medium">{{ currentInvoice.client_name }}</p>
            <p class="text-sm text-gray-900">{{ currentInvoice.client_email }}</p>
            <p v-if="currentInvoice.client_address" class="text-sm text-gray-900 whitespace-pre-line">
              {{ currentInvoice.client_address }}
            </p>
          </div>
          <div class="text-right">
            <div class="mb-4">
              <p class="text-sm text-gray-500">Issue Date</p>
              <p class="text-sm text-gray-900">{{ formatDate(currentInvoice.issue_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Due Date</p>
              <p class="text-sm text-gray-900">{{ formatDate(currentInvoice.due_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <div class="mb-8">
          <table class="min-w-full divide-y divide-gray-300">
            <thead>
            <tr>
              <th class="py-3 text-left text-sm font-semibold text-gray-900">Description</th>
              <th class="py-3 text-right text-sm font-semibold text-gray-900">Quantity</th>
              <th class="py-3 text-right text-sm font-semibold text-gray-900">Rate</th>
              <th class="py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
            <tr v-for="(item, index) in currentInvoice.line_items" :key="index">
              <td class="py-3 text-sm text-gray-900">{{ item.description }}</td>
              <td class="py-3 text-sm text-gray-900 text-right">{{ item.quantity }}</td>
              <td class="py-3 text-sm text-gray-900 text-right">${{ item.rate.toFixed(2) }}</td>
              <td class="py-3 text-sm text-gray-900 text-right">${{ item.amount.toFixed(2) }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="flex justify-end">
          <div class="w-64 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">${{ currentInvoice.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax ({{ currentInvoice.tax_rate }}%):</span>
              <span class="font-medium">${{ currentInvoice.tax_amount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${{ currentInvoice.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="currentInvoice.notes" class="mt-8 pt-8 border-t">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Notes</h3>
          <p class="text-sm text-gray-600 whitespace-pre-line">{{ currentInvoice.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvoice } from '@/composables/useInvoice'
import { useToast } from 'vue-toastification'
import { InvoiceStatus } from '@/types/invoice'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()
const { currentInvoice, loading, error, fetchInvoice, sendInvoice, downloadPDF } = useInvoice()
const toast = useToast()

function formatDate(date: string) {
  return format(new Date(date), 'MMMM dd, yyyy')
}

function getStatusClass(status: InvoiceStatus) {
  const classes: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-800',
    [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
    [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [InvoiceStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

async function handleSendInvoice() {
  if (!currentInvoice.value?.id) return

  try {
    await sendInvoice(currentInvoice.value.id)
    toast.success('Invoice sent successfully!')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to send invoice')
  }
}

async function handleDownloadPDF() {
  if (!currentInvoice.value?.id) return

  try {
    await downloadPDF(currentInvoice.value.id)
    toast.success('PDF downloaded!')
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to download PDF')
  }
}

onMounted(() => {
  const id = route.params.id as string
  if (id) {
    fetchInvoice(id)
  }
})
</script>