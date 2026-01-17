<template>
  <div class="px-4 sm:px-0">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Edit Invoice</h1>
      <p class="mt-1 text-sm text-gray-600">Update the invoice details below.</p>
    </div>

    <div v-if="loading && !currentInvoice" class="text-center py-12">
      <p class="text-gray-500">Loading invoice...</p>
    </div>

    <div v-else-if="currentInvoice">
      <InvoiceForm
          :initial-data="formData"
          :loading="saving"
          @submit="handleSubmit"
          @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvoice } from '@/composables/useInvoice'
import { useToast } from 'vue-toastification'
import InvoiceForm from '@/components/invoice/InvoiceForm.vue'
import type { InvoiceCreateRequest } from '@/types/invoice'

const route = useRoute()
const router = useRouter()
const { currentInvoice, loading, fetchInvoice, updateInvoice } = useInvoice()
const toast = useToast()
const saving = ref(false)

const formData = computed<Partial<InvoiceCreateRequest>>(() => {
  if (!currentInvoice.value) return {}

  return {
    client_name: currentInvoice.value.client_name,
    client_email: currentInvoice.value.client_email,
    client_address: currentInvoice.value.client_address,
    issue_date: currentInvoice.value.issue_date,
    due_date: currentInvoice.value.due_date,
    line_items: currentInvoice.value.line_items,
    tax_rate: currentInvoice.value.tax_rate,
    notes: currentInvoice.value.notes,
  }
})

async function handleSubmit(data: InvoiceCreateRequest) {
  const id = route.params.id as string
  if (!id) return

  saving.value = true
  try {
    await updateInvoice(id, data)
    toast.success('Invoice updated successfully!')
    router.push(`/invoices/${id}`)
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to update invoice')
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  const id = route.params.id as string
  router.push(`/invoices/${id}`)
}

onMounted(() => {
  const id = route.params.id as string
  if (id) {
    fetchInvoice(id)
  }
})
</script>