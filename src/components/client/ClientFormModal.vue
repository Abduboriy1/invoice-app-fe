<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />
      <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
          {{ client ? 'Edit Client' : 'Add Client' }}
        </h3>
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name *</label>
            <input
                v-model="form.name"
                type="text"
                id="name"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
                v-model="form.email"
                type="email"
                id="email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label for="company_name" class="block text-sm font-medium text-gray-700">Company Name</label>
            <input
                v-model="form.company_name"
                type="text"
                id="company_name"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
            <textarea
                v-model="form.address"
                id="address"
                rows="2"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
            <input
                v-model="form.phone"
                type="text"
                id="phone"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label for="hourly_rate" class="block text-sm font-medium text-gray-700">Hourly Rate</label>
            <input
                v-model.number="form.hourly_rate"
                type="number"
                id="hourly_rate"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div class="mt-5 sm:mt-6 flex justify-end space-x-3">
            <button
                type="button"
                @click="$emit('close')"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              {{ client ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Client, ClientCreateRequest } from '@/types/client'

interface Props {
  visible: boolean
  client?: Client | null
}

const props = withDefaults(defineProps<Props>(), {
  client: null,
})

const emit = defineEmits<{
  save: [data: ClientCreateRequest]
  close: []
}>()

const form = reactive<ClientCreateRequest>({
  name: '',
  email: '',
  company_name: '',
  address: '',
  phone: '',
  hourly_rate: undefined,
})

watch(() => props.visible, (val) => {
  if (val && props.client) {
    form.name = props.client.name
    form.email = props.client.email || ''
    form.company_name = props.client.company_name || ''
    form.address = props.client.address || ''
    form.phone = props.client.phone || ''
    form.hourly_rate = props.client.hourly_rate
  } else if (val) {
    form.name = ''
    form.email = ''
    form.company_name = ''
    form.address = ''
    form.phone = ''
    form.hourly_rate = undefined
  }
})

function handleSave() {
  emit('save', { ...form })
}
</script>
