<script lang="ts" setup>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useTimeEntry} from '@/composables/useTimeEntry'
import {useToast} from 'vue-toastification'
import {format, isToday, parseISO} from 'date-fns'
import type {TimeEntryCreateRequest} from '@/types/timeEntry'
import ThreeColumnLayout from "@/layouts/ThreeColumnLayout.vue";

const {timeEntries, createTimeEntry, fetchTimeEntries} = useTimeEntry()
const toast = useToast()

const isRunning = ref(false)
const elapsedSeconds = ref(0)
let timerInterval: number | null = null

const currentEntry = ref<TimeEntryCreateRequest>({
    description: '',
    hours: 0,
    date: new Date(), // Backend expects Date object
    jira_issue_key: '',
    is_billable: true,
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
        await createTimeEntry({
            description,
            hours,
            date: new Date(),
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
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Today's Time Entries</h3>

                    <div v-if="todayEntries.length === 0" class="text-center py-8">
                        <p class="text-sm text-gray-500">No time entries for today yet.</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div
                            v-for="entry in todayEntries"
                            :key="entry.id"
                            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900">{{ entry.description }}</p>
                                <div class="mt-1 flex items-center space-x-4">
                            <span v-if="entry.jira_issue_key" class="text-xs text-gray-500">
                                {{ entry.jira_issue_key }}
                            </span>
                                    <span :class="entry.is_billable ? 'text-green-600' : 'text-gray-500'"
                                          class="text-xs">
                                {{ entry.is_billable ? 'Billable' : 'Non-billable' }}
                            </span>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-semibold text-gray-900">{{ formatHours(entry.hours) }}</p>
                                <p class="text-xs text-gray-500">{{ formatTime(entry.created_at) }}</p>
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
            </div>
        </template>

        <!-- Right Section (1 unit) -->
        <template #right>
            <h2 class="text-xl font-bold mb-2">Right Section</h2>
            <p>This section is 1/3 the size of the center</p>
        </template>
    </ThreeColumnLayout>
</template>
