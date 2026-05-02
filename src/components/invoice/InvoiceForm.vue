<script lang="ts" setup>
import {computed, onMounted, reactive, ref, watch} from 'vue'
import type {InvoiceCreateRequest, InvoiceLineItem} from '@/types/invoice'
import type {InvoicePDFData} from '@/utils/generateInvoicePDF'
import {generateInvoicePDF} from '@/utils/generateInvoicePDF'
import ClientSelector from '@/components/invoice/ClientSelector.vue'
import {useAuthStore} from '@/stores/auth'

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

const authStore = useAuthStore()

// Additional PDF-only fields
const invoiceNumber = ref('1')
const serviceDate = ref(new Date().toISOString().split('T')[0])
const issuerName = ref('')
const issuerAddress = ref('')
const issuerPhone = ref('')
const clientPhone = ref('')
const clientCompany = ref('')
const clientHourlyRate = ref<number>(0.00)

const formData = reactive<InvoiceCreateRequest>({
    client_name: props.initialData?.client_name || '',
    client_email: props.initialData?.client_email || '',
    client_address: props.initialData?.client_address || '',
    client_id: props.initialData?.client_id,
    issue_date: props.initialData?.issue_date || new Date().toISOString().split('T')[0],
    due_date: props.initialData?.due_date || '',
    line_items: props.initialData?.line_items || [],
    tax_rate: props.initialData?.tax_rate || 0,
    notes: props.initialData?.notes || '',
})

// Auto-fill issuer info from user profile (only if fields are empty, i.e. not editing)
onMounted(() => {
    if (authStore.user) {
        if (!issuerName.value) issuerName.value = authStore.user.full_name || ''
        if (!issuerAddress.value) issuerAddress.value = authStore.user.address || ''
        if (!issuerPhone.value) issuerPhone.value = authStore.user.phone || ''
    }
})

function addOneMonth(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split('T')[0]
}

// Keep item.rate in sync whenever the shared hourly rate changes
watch(clientHourlyRate, (newRate) => {
    formData.line_items.forEach(item => {
        item.rate = newRate
        item.amount = item.quantity * newRate
    })
})

// Auto-set due date to 1 month after service date
watch(serviceDate, (newVal) => {
    if (newVal) {
        formData.due_date = addOneMonth(newVal)
    }
}, {immediate: true})

const clientFields = computed({
    get() {
        return {
            client_name: formData.client_name,
            client_email: formData.client_email,
            client_address: formData.client_address || '',
            client_phone: clientPhone.value,
            client_company: clientCompany.value,
            client_id: formData.client_id,
            hourly_rate: clientHourlyRate.value,
        }
    },
    set(val: {
        client_name: string;
        client_email: string;
        client_address: string;
        client_phone: string;
        client_company: string;
        client_id?: string;
        hourly_rate?: number
    }) {
        formData.client_name = val.client_name
        formData.client_email = val.client_email
        formData.client_address = val.client_address
        formData.client_id = val.client_id
        clientPhone.value = val.client_phone
        clientCompany.value = val.client_company
        clientHourlyRate.value = Number(val.hourly_rate) || 0
    },
})

const groupedLineItems = computed(() => {
    const groups: Record<string, { item: InvoiceLineItem; originalIndex: number }[]> = {}
    formData.line_items.forEach((item, index) => {
        const key = item.application || 'Other'
        if (!groups[key]) groups[key] = []
        groups[key].push({item, originalIndex: index})
    })
    return groups
})

const subtotal = computed(() => {
    return formData.line_items.reduce((sum, item) => sum + ((clientHourlyRate.value ?? 0) * item.quantity), 0)
})

const taxAmount = computed(() => {
    return subtotal.value * (formData.tax_rate / 100)
})

const total = computed(() => {
    return subtotal.value + taxAmount.value
})

function addLineItem() {
    const rate = clientHourlyRate.value || 0
    formData.line_items.push({
        description: '',
        quantity: 1,
        rate,
        amount: rate,
        application: '',
    })
}

function removeLineItem(index: number) {
    formData.line_items.splice(index, 1)
}

function calculateLineItem(index: number) {
    const item = formData.line_items[index]
    item.rate = clientHourlyRate.value
    item.amount = item.quantity * clientHourlyRate.value
}

function handleSubmit() {
    emit('submit', formData)
}

const generatingPDF = ref(false)

async function handleDownloadPDF() {
    generatingPDF.value = true
    try {
        const pdfData: InvoicePDFData = {
            invoice_number: invoiceNumber.value,
            issuer_name: issuerName.value,
            issuer_address: issuerAddress.value,
            issuer_phone: issuerPhone.value,
            client_name: formData.client_name,
            client_email: formData.client_email,
            client_address: formData.client_address,
            client_phone: clientPhone.value,
            client_company: clientCompany.value,
            issue_date: formData.issue_date,
            due_date: formData.due_date,
            service_date: serviceDate.value,
            line_items: formData.line_items,
            tax_rate: formData.tax_rate,
            notes: formData.notes,
            subtotal: subtotal.value,
            taxAmount: taxAmount.value,
            total: total.value,
        }
        generateInvoicePDF(pdfData)
    } finally {
        generatingPDF.value = false
    }
}
</script>

<template>
    <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Issuer Information -->
        <div class="bg-white shadow-sm rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Issuer Information</h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="issuer_name">Full Name</label>
                    <input
                        id="issuer_name"
                        v-model="issuerName"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                        type="text"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="issuer_phone">Phone</label>
                    <input
                        id="issuer_phone"
                        v-model="issuerPhone"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        type="tel"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="issuer_address">Address</label>
                    <input
                        id="issuer_address"
                        v-model="issuerAddress"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        type="text"
                    />
                </div>
            </div>
        </div>

        <!-- Client Information -->
        <ClientSelector v-model="clientFields"/>

        <!-- Invoice Details -->
        <div class="bg-white shadow-sm rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="invoice_number">Invoice Number</label>
                    <input
                        id="invoice_number"
                        v-model="invoiceNumber"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="1"
                        required
                        type="text"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="issue_date">Issue Date</label>
                    <input
                        id="issue_date"
                        v-model="formData.issue_date"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                        type="date"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="due_date">Due Date</label>
                    <input
                        id="due_date"
                        v-model="formData.due_date"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                        type="date"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700" for="service_date">Service Date</label>
                    <input
                        id="service_date"
                        v-model="serviceDate"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                        type="date"
                    />
                </div>
            </div>
        </div>

        <!-- Line Items -->
        <div class="bg-white shadow-sm rounded-lg p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Line Items</h3>
                <button
                    class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    type="button"
                    @click="addLineItem"
                >
                    + Add Item
                </button>
            </div>
            <!-- Column headers -->
            <div class="grid grid-cols-12 gap-4 items-center mb-1 px-1">
                <div class="col-span-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</div>
                <div class="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</div>
                <div class="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Rate</div>
                <div class="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</div>
                <div class="col-span-1"></div>
            </div>
            <div class="space-y-4">
                <template v-for="(group, groupName) in groupedLineItems" :key="groupName">
                    <div class="bg-gray-50 rounded-md px-3 py-2 mt-2">
                        <span class="text-sm font-semibold text-gray-700">{{ groupName }}</span>
                    </div>
                    <div
                        v-for="{ item, originalIndex } in group"
                        :key="originalIndex"
                        class="grid grid-cols-12 gap-4 items-start"
                    >
                        <div class="col-span-5">
                            <input
                                v-model="item.description"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                placeholder="Description"
                                required
                                type="text"
                            />
                        </div>
                        <div class="col-span-2">
                            <input
                                v-model.number="item.quantity"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                min="0"
                                placeholder="Qty"
                                required
                                step="0.001"
                                type="number"
                                @input="calculateLineItem(originalIndex)"
                            />
                        </div>
                        <div class="col-span-2">
                            <input
                                v-model.number="clientHourlyRate"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                min="0"
                                placeholder="Rate"
                                required
                                step="0.01"
                                type="number"
                                @input="calculateLineItem(originalIndex)"
                            />
                        </div>
                        <div class="col-span-2">
                            <input
                                :value="((clientHourlyRate.valueOf() ?? 0) * item.quantity).toFixed(2)"
                                class="block w-full rounded-md border-gray-300 bg-gray-50 text-sm"
                                readonly
                                type="text"
                            />
                        </div>
                        <div class="col-span-1 flex items-center">
                            <button
                                class="text-red-600 hover:text-red-700"
                                type="button"
                                @click="removeLineItem(originalIndex)"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        stroke-linecap="round" stroke-linejoin="round"
                                        stroke-width="2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </template>

                <!-- Line items totals row -->
                <div v-if="formData.line_items.length > 0" class="grid grid-cols-12 gap-4 items-center border-t pt-3 mt-2">
                    <div class="col-span-5 text-sm font-semibold text-gray-700">Total</div>
                    <div class="col-span-2 text-sm font-semibold text-gray-900">
                        {{ formData.line_items.reduce((s, i) => s + i.quantity, 0).toFixed(2) }} hrs
                    </div>
                    <div class="col-span-2"></div>
                    <div class="col-span-2 text-sm font-semibold text-gray-900">
                        ${{ formData.line_items.reduce((s, i) => s + (clientHourlyRate * i.quantity), 0).toFixed(2) }}
                    </div>
                    <div class="col-span-1"></div>
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
                                class="w-20 text-right rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                max="100"
                                min="0"
                                step="0.01"
                                type="number"
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
            <label class="block text-sm font-medium text-gray-700 mb-2" for="notes">
                Notes
            </label>
            <textarea
                id="notes"
                v-model="formData.notes"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Additional notes or payment terms..."
                rows="4"
            />
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
            <button
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                type="button"
                @click="$emit('cancel')"
            >
                Cancel
            </button>
            <button
                :disabled="generatingPDF"
                class="px-4 py-2 border border-primary-300 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 disabled:opacity-50"
                type="button"
                @click="handleDownloadPDF"
            >
                {{ generatingPDF ? 'Generating...' : 'Download PDF' }}
            </button>
            <button
                :disabled="loading"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                type="submit"
            >
                {{ loading ? 'Saving...' : 'Save Invoice' }}
            </button>
        </div>
    </form>
</template>