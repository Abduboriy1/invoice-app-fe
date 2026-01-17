<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Client Information -->
    <div class="bg-white shadow-sm rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label for="client_name" class="block text-sm font-medium text-gray-700">
            Client Name
          </label>
          <input
              v-model="formData.client_name"
              type="text"
              id="client_name"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label for="client_email" class="block text-sm font-medium text-gray-700">
            Client Email
          </label>
          <input
              v-model="formData.client_email"
              type="email"
              id="client_email"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="client_address" class="block text-sm font-medium text-gray-700">
            Client Address
          </label>
          <textarea
              v-model="formData.client_address"
              id="client_address"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Invoice Details -->
    <div class="bg-white shadow-sm rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label for="issue_date" class="block text-sm font-medium text-gray-700">
            Issue Date
          </label>
          <input
              v-model="formData.issue_date"
              type="date"
              id="issue_date"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label for="due_date" class="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
              v-model="formData.due_date"
              type="date"
              id="due_date"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Line Items -->
    <div class="bg-white shadow-sm rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Line Items</h3>
        <button
            type="button"
            @click="addLineItem"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + Add Item
        </button>
      </div>
      <div class="space-y-4">
        <div
            v-for="(item, index) in formData.line_items"
            :key="index"
            class="grid grid-cols-12 gap-4 items-start"
        >
          <div class="col-span-5">
            <input
                v-model="item.description"
                type="text"
                placeholder="Description"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
          <div class="col-span-2">
            <input
                v-model.number="item.quantity"
                type="number"
                placeholder="Qty"
                required
                min="0"
                step="0.01"
                @input="calculateLineItem(index)"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
          <div class="col-span-2">
            <input
                v-model.number="item.rate"
                type="number"
                placeholder="Rate"
                required
                min="0"
                step="0.01"
                @input="calculateLineItem(index)"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
          <div class="col-span-2">
            <input
                :value="item.amount.toFixed(2)"
                type="text"
                readonly
                class="block w-full rounded-md border-gray-300 bg-gray-50 text-sm"
            />
          </div>
          <div class="col-span-1 flex items-center">
            <button
                type="button"
                @click="removeLineItem(index)"
                class="text-red-600 hover:text-red-700"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Totals -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-end">
          <div class="w-64 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600">Tax Rate (%):</span>
              <input
                  v-model.number="formData.tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  class="w-20 text-right rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax:</span>
              <span class="font-medium">${{ taxAmount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-base font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div class="bg-white shadow-sm rounded-lg p-6">
      <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
        Notes
      </label>
      <textarea
          v-model="formData.notes"
          id="notes"
          rows="4"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Additional notes or payment terms..."
      />
    </div>

    <!-- Actions -->
    <div class="flex justify-end space-x-3">
      <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
      >
        {{ loading ? 'Saving...' : 'Save Invoice' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { InvoiceLineItem, InvoiceCreateRequest } from '@/types/invoice'

interface Props {
  initialData?: Partial<InvoiceCreateRequest>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [data: InvoiceCreateRequest]
  cancel: []
}>()

const formData = reactive<InvoiceCreateRequest>({
  client_name: props.initialData?.client_name || '',
  client_email: props.initialData?.client_email || '',
  client_address: props.initialData?.client_address || '',
  issue_date: props.initialData?.issue_date || new Date().toISOString().split('T')[0],
  due_date: props.initialData?.due_date || '',
  line_items: props.initialData?.line_items || [],
  tax_rate: props.initialData?.tax_rate || 0,
  notes: props.initialData?.notes || '',
})

const subtotal = computed(() => {
  return formData.line_items.reduce((sum, item) => sum + item.amount, 0)
})

const taxAmount = computed(() => {
  return subtotal.value * (formData.tax_rate / 100)
})

const total = computed(() => {
  return subtotal.value + taxAmount.value
})

function addLineItem() {
  formData.line_items.push({
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
  })
}

function removeLineItem(index: number) {
  formData.line_items.splice(index, 1)
}

function calculateLineItem(index: number) {
  const item = formData.line_items[index]
  item.amount = item.quantity * item.rate
}

function handleSubmit() {
  emit('submit', formData)
}
</script>