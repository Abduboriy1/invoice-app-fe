<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {useTimeEntry} from '@/composables/useTimeEntry'
import {useToast} from 'vue-toastification'
import {format} from 'date-fns'
import type {TimeEntry} from '@/types/timeEntry'
import TimeEntryModal from '@/components/time/TimeEntryModal.vue'
import ThreeColumnLayout from "@/layouts/ThreeColumnLayout.vue"


const {timeEntries, loading, error, fetchTimeEntries, deleteTimeEntry, syncTimeEntryToJira} = useTimeEntry()
const toast = useToast()

const showCreateModal = ref(false)
const editingEntry = ref<TimeEntry | null>(null)

const filters = ref({
    start_date: '',
    end_date: '',
    is_billable: '',
})

const totalDuration = computed(() => {
    return timeEntries.value.reduce((sum, entry) => sum + entry.hours, 0)
})

const billableDuration = computed(() => {
    return timeEntries.value
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => sum + entry.hours, 0)
})

const nonBillableDuration = computed(() => {
    return timeEntries.value
        .filter(entry => !entry.is_billable)
        .reduce((sum, entry) => sum + entry.hours, 0)
})

function formatDate(date: string) {
    return format(new Date(date), 'MMM dd, yyyy')
}

function formatDuration(decimal: number): string {
    // Get the integer part as hours
    const hours = Math.floor(decimal);

    // Get the fractional part and convert to minutes
    const fractionalPart = decimal - hours;
    let minutes = Math.round(fractionalPart * 60);

    // Handle edge case where rounding gives 60 minutes
    if (minutes === 60) {
        return `${hours + 1}h ${0}m`;
    }

    return `${hours}h ${minutes}m`;
}

function applyFilters() {
    const params: any = {}
    if (filters.value.start_date) params.start_date = filters.value.start_date
    if (filters.value.end_date) params.end_date = filters.value.end_date
    if (filters.value.is_billable !== '') params.is_billable = filters.value.is_billable === 'true'

    fetchTimeEntries(params)
}

function editEntry(entry: TimeEntry) {
    editingEntry.value = entry
}

function closeModal() {
    showCreateModal.value = false
    editingEntry.value = null
}

async function handleSubmit() {
    closeModal()
    await fetchTimeEntries()
    toast.success(editingEntry.value ? 'Time entry updated!' : 'Time entry created!')
}

async function deleteEntry(id: string) {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
        await deleteTimeEntry(id)
        toast.success('Time entry deleted!')
        await fetchTimeEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to delete time entry')
    }
}

async function syncToJira(entry: TimeEntry) {
    if (!entry.id) return

    try {
        await syncTimeEntryToJira(entry.id)
        toast.success('Time entry synced to Jira!')
        await fetchTimeEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to sync to Jira')
    }
}

onMounted(() => {
    fetchTimeEntries()
})
</script>


<template>
    <ThreeColumnLayout>
        <template #left>
            <div class="sm:flex sm:items-center">
                <button
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
                    @click="showCreateModal = true"
                >
                    Add Time Entry
                </button>
            </div>
        </template>
        <template #center>
            <div class="px-4 sm:px-0">
                <!-- Filters -->
                <div class="bg-white shadow-sm rounded-lg p-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="start-date">Start Date</label>
                            <input
                                id="start-date"
                                v-model="filters.start_date"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                type="date"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="end-date">End Date</label>
                            <input
                                id="end-date"
                                v-model="filters.end_date"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                type="date"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700"
                                   for="billable-filter">Billable</label>
                            <select
                                id="billable-filter"
                                v-model="filters.is_billable"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                                <option value="">All</option>
                                <option value="true">Billable</option>
                                <option value="false">Non-billable</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button
                                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                                @click="applyFilters"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="mt-8 text-center">
                    <p class="text-gray-500">Loading time entries...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="mt-8 rounded-md bg-red-50 p-4">
                    <p class="text-sm text-red-800">{{ error }}</p>
                </div>

                <!-- Time Entries Table -->
                <div v-else class="mt-8 flex flex-col">
                    <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50">
                                    <tr>
                                        <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                            scope="col">
                                            Date
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Description
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Duration
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Jira Issue
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Billable
                                        </th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            scope="col">
                                            Status
                                        </th>
                                        <th class="relative py-3.5 pl-3 pr-4 sm:pr-6" scope="col">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                    <tr v-for="entry in timeEntries" :key="entry.id">
                                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {{ formatDate(entry.date) }}
                                        </td>
                                        <td class="px-3 py-4 text-sm text-gray-500">
                                            {{ entry.description }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {{ formatDuration(entry.hours) }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {{ entry.jira_issue_key || '-' }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span
                        :class="entry.is_billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                        class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                    >
                      {{ entry.is_billable ? 'Yes' : 'No' }}
                    </span>
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span
                        :class="entry.invoiced ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'"
                        class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                    >
                      {{ entry.invoiced ? 'Invoiced' : 'Pending' }}
                    </span>
                                        </td>
                                        <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                class="text-primary-600 hover:text-primary-900 mr-4"
                                                @click="editEntry(entry)"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                v-if="entry.jira_issue_key && !entry.jira_worklog_id"
                                                class="text-primary-600 hover:text-primary-900 mr-4"
                                                @click="syncToJira(entry)"
                                            >
                                                Sync to Jira
                                            </button>
                                            <button
                                                class="text-red-600 hover:text-red-900"
                                                @click="deleteEntry(entry.id!)"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>

                                <div v-if="timeEntries.length === 0" class="text-center py-12">
                                    <p class="text-sm text-gray-500">No time entries found. Add your first time
                                        entry!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary -->
                <div v-if="timeEntries.length > 0" class="mt-6 bg-white shadow-sm rounded-lg p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <p class="text-sm text-gray-500">Total Hours</p>
                            <p class="mt-1 text-2xl font-semibold text-gray-900">{{ formatDuration(totalDuration) }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Billable Hours</p>
                            <p class="mt-1 text-2xl font-semibold text-green-600">{{
                                    formatDuration(billableDuration)
                                }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Non-billable Hours</p>
                            <p class="mt-1 text-2xl font-semibold text-gray-600">{{
                                    formatDuration(nonBillableDuration)
                                }}</p>
                        </div>
                    </div>
                </div>

                <!-- Create/Edit Modal -->
                <TimeEntryModal
                    v-if="showCreateModal || editingEntry"
                    :entry="editingEntry"
                    @close="closeModal"
                    @submit="handleSubmit"
                />
            </div>
        </template>
    </ThreeColumnLayout>
</template>
