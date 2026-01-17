<template>
  <div class="px-4 sm:px-0">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Create Invoice</h1>
      <p class="mt-1 text-sm text-gray-600">Fill in the details below to create a new invoice.</p>
    </div>

    <InvoiceForm
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInvoice } from '@/composables/useInvoice'
import { useToast } from 'vue-toastification'
import InvoiceForm from '@/components/invoice/InvoiceForm.vue'
import type { InvoiceCreateRequest } from '@/types/invoice'

const router = useRouter()
const { createInvoice } = useInvoice()
const toast = useToast()
const loading = ref(false)

async function handleSubmit(data: InvoiceCreateRequest) {
  loading.value = true
  try {
    const invoice = await createInvoice(data)
    toast.success('Invoice created successfully!')
    router.push(`/invoices/${invoice.id}`)
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to create invoice')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/invoices')
}
</script>