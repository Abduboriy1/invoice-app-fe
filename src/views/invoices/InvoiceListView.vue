<template>
    <div class="px-4 sm:px-0">
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-2xl font-semibold text-gray-900">Invoices</h1>
                <p class="mt-2 text-sm text-gray-700">A list of all invoices in your account.</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <router-link
                    to="/invoices/create"
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
                >
                    Create Invoice
                </router-link>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="mt-8 text-center">
            <p class="text-gray-500">Loading invoices...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="mt-8 rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Invoices Table -->
        <div v-else class="mt-8 flex flex-col">
            <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table class="min-w-full divide-y divide-gray-300">
                            <thead class="bg-gray-50">
                            <tr>
                                <th scope="col"
                                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    Invoice #
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Client
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Date
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Due Date
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Status
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Amount
                                </th>
                                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span class="sr-only">Actions</span>
                                </th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                            <tr v-for="invoice in invoices" :key="invoice.id">
                                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {{ invoice.invoice_number || `INV-${invoice.id}` }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {{ invoice.client_name }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {{ formatDate(invoice.issue_date) }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {{ formatDate(invoice.due_date) }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span :class="getStatusClass(invoice.status)"
                          class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                      {{ invoice.status }}
                    </span>
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    ${{ invoice.total.toFixed(2) }}
                                </td>
                                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <router-link
                                        :to="`/invoices/${invoice.id}`"
                                        class="text-primary-600 hover:text-primary-900 mr-4"
                                    >
                                        View
                                    </router-link>
                                    <router-link
                                        :to="`/invoices/${invoice.id}/edit`"
                                        class="text-primary-600 hover:text-primary-900"
                                    >
                                        Edit
                                    </router-link>
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        <div v-if="invoices.length === 0" class="text-center py-12">
                            <p class="text-sm text-gray-500">No invoices found. Create your first invoice!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {onMounted} from 'vue'
import {useInvoice} from '@/composables/useInvoice'
import {InvoiceStatus} from '@/types/invoice'
import {format} from 'date-fns'

const {invoices, loading, error, fetchInvoices} = useInvoice()

function formatDate(date: string) {
    return format(new Date(date), 'MMM dd, yyyy')
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

onMounted(() => {
    fetchInvoices()
})
</script>