<script lang="ts" setup>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useTimeEntry} from '@/composables/useTimeEntry'
import {useToast} from 'vue-toastification'
import {format, isToday, parseISO} from 'date-fns'
import type {TimeEntry, TimeEntryCreateRequest} from '@/types/timeEntry'
import ThreeColumnLayout from "@/layouts/ThreeColumnLayout.vue"
import TimeEntryModal from "@/components/time/TimeEntryModal.vue"

const {
    timeEntries,
    createTimeEntry,
    fetchTimeEntries,
    deleteTimeEntry,
    updateTimeEntry,
    syncTimeEntryToJira
} = useTimeEntry()
const toast = useToast()

const isRunning = ref(false)
const elapsedSeconds = ref(0)
let timerInterval: number | null = null
const editingEntry = ref<TimeEntry | null>(null)

const currentEntry = ref<TimeEntryCreateRequest>({
    description: '',
    hours: 0,
    date: new Date(), // Backend expects Date object
    jira_issue_key: '',
    is_billable: true,
    jira_synced_at: null
})

const displayTime = computed(() => {
    const hours = Math.floor(elapsedSeconds.value / 3600)
    const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
    const seconds = elapsedSeconds.value % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const todayEntries = computed(() => {
    return timeEntries.value.filter(entry => {
        // Parse the date string from backend (YYYY-MM-DD)
        const entryDate = parseISO(entry.date)
        return isToday(entryDate)
    })
})

const todayTotal = computed(() => {
    return todayEntries.value.reduce((sum, entry) => sum + entry.hours, 0)
})

function startTimer() {
    if (!currentEntry.value.description) {
        toast.error('Please enter a description')
        return
    }

    isRunning.value = true
    timerInterval = window.setInterval(() => {
        elapsedSeconds.value++
    }, 1000)
}

function pauseTimer() {
    isRunning.value = false
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

async function stopTimer() {
    pauseTimer()

    if (elapsedSeconds.value === 0) {
        toast.error('No time to save')
        return
    }

    // Convert seconds to hours (decimal)
    const hours = elapsedSeconds.value / 3600

    try {
        await createTimeEntry({
            description: currentEntry.value.description,
            hours: parseFloat(hours.toFixed(2)), // Round to 2 decimals
            date: new Date(), // Today's date
            jira_issue_key: currentEntry.value.jira_issue_key || undefined,
            is_billable: currentEntry.value.is_billable,
        })

        toast.success(`Time entry saved: ${formatHours(hours)}`)
        resetTimer()
        await fetchTimeEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.error || 'Failed to save time entry')
    }
}

function resetTimer() {
    elapsedSeconds.value = 0
    currentEntry.value = {
        description: '',
        hours: 0,
        date: new Date(),
        jira_issue_key: '',
        is_billable: true,
    }
}

async function quickLog(hours: number) {
    const description = prompt('Enter description for this time entry:')
    if (!description) return

    try {
        // Create a Date object at midnight in user's local timezone
        const today = new Date()
        const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

        await createTimeEntry({
            description,
            hours,
            date: localDate, // Date object at local midnight
            is_billable: true,
        })

        toast.success(`${formatHours(hours)} logged successfully!`)
        await fetchTimeEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.error || 'Failed to log time')
    }
}

function formatHours(hours: number) {
    const h = Math.floor(hours)
    const minutes = Math.round((hours - h) * 60)
    return `${h}h ${minutes}m`
}

function formatTime(datetime: string) {
    return format(parseISO(datetime), 'h:mm a')
}

function editEntry(entry: TimeEntry) {
    console.log(entry)
    editingEntry.value = entry
}

function closeModal() {
    editingEntry.value = null
}

async function handleModalSubmit() {
    closeModal()
    await fetchTimeEntries()
    toast.success('Time entry updated!')
}

async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
        await deleteTimeEntry(id)
        toast.success('Time entry deleted!')
        await fetchTimeEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to delete time entry')
    }
}

async function handleSyncToJira(entry: TimeEntry) {
    if (!entry.id || !entry.jira_issue_key) return

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

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval)
    }
})
</script>

<template>
    <ThreeColumnLayout>

        <template #left>
            <!-- Quick Actions -->
            <div class="bg-white shadow-sm rounded-lg p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Time Logs</h3>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <button
                        class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        @click="quickLog(0.5)"
                    >
                        30 minutes
                    </button>
                    <button
                        class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        @click="quickLog(1)"
                    >
                        1 hour
                    </button>
                    <button
                        class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        @click="quickLog(2)"
                    >
                        2 hours
                    </button>
                </div>
            </div>
        </template>

        <!-- Center Section (3 units) -->
        <template #center>
            <div class="px-4 sm:px-0">
                <!-- Active Timer Card -->
                <div class="bg-white shadow-sm rounded-lg p-5">
                    <!-- Single Row Layout -->
                    <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                        <!-- Timer Display -->
                        <div
                            class="flex items-center justify-center bg-gray-50 rounded-lg px-6 py-4 lg:py-3 lg:w-48 flex-shrink-0">
                            <div class="text-4xl lg:text-3xl font-bold text-gray-900 font-mono tracking-tight">
                                {{ displayTime }}
                            </div>
                        </div>

                        <!-- Description Input -->
                        <div class="flex-1 min-w-0">
                            <input
                                id="description"
                                v-model="currentEntry.description"
                                :disabled="isRunning"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100 h-[42px]"
                                placeholder="What are you working on?"
                                type="text"
                            />
                        </div>

                        <!-- Jira Issue Input -->
                        <div class="w-full lg:w-36 flex-shrink-0">
                            <input
                                id="jira-issue"
                                v-model="currentEntry.jira_issue_key"
                                :disabled="isRunning"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm disabled:bg-gray-100 h-[42px]"
                                placeholder="PROJ-123"
                                type="text"
                            />
                        </div>

                        <!-- Billable Checkbox -->
                        <div class="flex items-center justify-center lg:w-24 flex-shrink-0 h-[42px]">
                            <label class="flex items-center cursor-pointer">
                                <input
                                    v-model="currentEntry.is_billable"
                                    :disabled="isRunning"
                                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:bg-gray-100"
                                    type="checkbox"
                                />
                                <span class="ml-2 text-sm text-gray-700 whitespace-nowrap">Billable</span>
                            </label>
                        </div>

                        <!-- Control Buttons -->
                        <div class="flex gap-2 flex-shrink-0">
                            <button
                                v-if="!isRunning"
                                :disabled="!currentEntry.description"
                                class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                                @click="startTimer"
                            >
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round"
                                          stroke-linejoin="round"
                                          stroke-width="2"/>
                                </svg>
                                Start
                            </button>

                            <button
                                v-if="isRunning"
                                class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 h-[42px]"
                                @click="pauseTimer"
                            >
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round"
                                          stroke-linejoin="round" stroke-width="2"/>
                                </svg>
                                Pause
                            </button>

                            <button
                                v-if="elapsedSeconds > 0"
                                class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 h-[42px]"
                                @click="stopTimer"
                            >
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round"
                                          stroke-linejoin="round"
                                          stroke-width="2"/>
                                    <path d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                                          stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                                </svg>
                                Stop
                            </button>

                            <button
                                v-if="elapsedSeconds > 0 && !isRunning"
                                class="inline-flex items-center px-3 py-2.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 h-[42px]"
                                @click="resetTimer"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Today's Entries -->
                <div class="mt-6 bg-white shadow-sm rounded-lg p-6">
                    <div v-if="todayEntries.length === 0" class="text-center py-8">
                        <p class="text-sm text-gray-500">No time entries for today yet.</p>
                    </div>

                    <div v-else class="space-y-2">
                        <div
                            v-for="entry in todayEntries"
                            :key="entry.id"
                            class="group relative bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200"
                        >

                            <div class="flex items-start gap-4 p-5">
                                <div class="flex-1 min-w-0">
                                    <!-- Description and Hours -->
                                    <div class="flex items-baseline gap-2 mb-2">
                                        <h3 class="text-base font-semibold text-gray-900 truncate">
                                            {{ entry.description }}
                                        </h3>
                                        <span class="text-sm font-medium text-gray-600 whitespace-nowrap">
                                            {{ formatHours(entry.hours) }}
                                        </span>
                                    </div>

                                    <!-- Metadata Row -->
                                    <div class="flex flex-wrap items-center gap-3">
                                        <!-- Time -->
                                        <div class="flex items-center gap-1.5 text-xs text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                 stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                            </svg>
                                            <span>{{ formatTime(entry.created_at) }}</span>
                                        </div>

                                        <!-- Jira Issue -->
                                        <div v-if="entry.jira_issue_key" class="flex items-center gap-1.5">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                {{ entry.jira_issue_key }}
                                            </span>
                                                        </div>

                                                        <!-- Billable Status -->
                                                        <div class="flex items-center gap-1.5">
                                            <span
                                                :class="entry.is_billable
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200'"
                                                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
                                            >
                                                <span :class="entry.is_billable ? 'bg-green-500' : 'bg-gray-400'"
                                                      class="w-1.5 h-1.5 rounded-full"></span>
                                                {{ entry.is_billable ? 'Billable' : 'Non-billable' }}
                                            </span>
                                                        </div>

                                                        <!-- Sync Status -->
                                                        <div v-if="entry.jira_issue_key" class="flex items-center gap-1.5">
                                            <span
                                                :class="entry.jira_synced_at
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-orange-50 text-orange-700 border-orange-200'"
                                                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
                                            >
                                                <svg v-if="entry.jira_synced_at" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                     viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                                                </svg>
                                                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                     stroke-width="2" stroke="currentColor" class="w-3 h-3">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                                </svg>
                                                {{ entry.jira_synced_at ? 'Synced' : 'Pending' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right Side: Action Buttons -->
                                <div class="flex items-center gap-1" style="height: -webkit-fill-available">
                                    <!-- Edit Button -->
                                    <button
                                        class="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                                        @click="editEntry(entry)"
                                        title="Edit entry"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                                        </svg>
                                    </button>

                                    <!-- Sync to Jira Button -->
                                    <button
                                        v-if="entry.jira_issue_key && !entry.jira_synced_at"
                                        class="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                                        @click="handleSyncToJira(entry)"
                                        title="Sync to Jira"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                                        </svg>
                                    </button>

                                    <!-- Delete Button -->
                                    <button
                                        class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                                        @click="handleDelete(entry.id)"
                                        title="Delete entry"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="todayEntries.length > 0" class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Total Today:</span>
                            <span class="text-lg font-semibold text-gray-900">{{ formatHours(todayTotal) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Edit Modal -->
                <TimeEntryModal
                    v-if="editingEntry"
                    :entry="editingEntry"
                    @close="closeModal"
                    @submit="handleModalSubmit"
                />
            </div>
        </template>

        <!-- Right Section (1 unit) -->
        <template #right>
            <h2 class="text-xl font-bold mb-2">Right Section</h2>
            <p>This section is 1/3 the size of the center</p>
        </template>
    </ThreeColumnLayout>
</template>


