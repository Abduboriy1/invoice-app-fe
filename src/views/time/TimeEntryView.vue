<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {useTimeEntry} from '@/composables/useTimeEntry'
import {useToast} from 'vue-toastification'
import {endOfMonth, format, startOfMonth} from 'date-fns'
import type {TimeEntry} from '@/types/timeEntry'
import {timeEntryService} from '@/services/api/timeEntry.service'
import TimeEntryModal from '@/components/time/TimeEntryModal.vue'
import ThreeColumnLayout from "@/layouts/ThreeColumnLayout.vue"

const {timeEntries, loading, error, fetchTimeEntries, deleteTimeEntry, syncTimeEntryToJira, pullWorklogs} = useTimeEntry()
const syncing = ref(false)
const resolvingEpics = ref(false)
const toast = useToast()

const showCreateModal = ref(false)
const editingEntry = ref<TimeEntry | null>(null)

const filters = ref({
    start_date: '',
    end_date: '',
    is_billable: '',
})

// --- Epic cache (localStorage) ---

const CACHE_KEY = 'jira_epic_cache'

interface EpicInfo {
    epicKey: string
    epicName: string
    epicStatus: string
}

function readCache(): Record<string, EpicInfo> {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

function writeCache(updates: Record<string, EpicInfo>) {
    try {
        const existing = readCache()
        localStorage.setItem(CACHE_KEY, JSON.stringify({...existing, ...updates}))
    } catch {
        // ignore storage errors
    }
}

const epicCache = ref<Record<string, EpicInfo>>(readCache())

async function resolveEpicsForEntries() {
    const keys = [...new Set(timeEntries.value.map(e => e.jira_issue_key).filter(Boolean) as string[])]
    const uncached = keys.filter(k => !epicCache.value[k])

    if (uncached.length === 0) return

    resolvingEpics.value = true
    try {
        const resolutions = await timeEntryService.resolveEpics(uncached)
        const updates: Record<string, EpicInfo> = {}
        for (const [issueKey, res] of Object.entries(resolutions)) {
            updates[issueKey] = {
                epicKey: res.epic_key,
                epicName: res.epic_name,
                epicStatus: res.epic_status,
            }
        }
        writeCache(updates)
        epicCache.value = readCache()
    } catch {
        // silently skip — grouping falls back to issue key
    } finally {
        resolvingEpics.value = false
    }
}

// --- Grouping ---

interface EpicGroup {
    epicKey: string
    epicName: string
    epicStatus: string
    totalHours: number
    entries: TimeEntry[]
}

const groupedEntries = computed<EpicGroup[]>(() => {
    const groups: Record<string, EpicGroup> = {}

    for (const entry of timeEntries.value) {
        let epicKey = ''
        let epicName = 'No Epic'
        let epicStatus = ''

        if (entry.jira_issue_key) {
            const cached = epicCache.value[entry.jira_issue_key]
            if (cached) {
                epicKey = cached.epicKey
                epicName = cached.epicName
                epicStatus = cached.epicStatus
            } else {
                // Not yet resolved — group under the issue key itself
                epicKey = entry.jira_issue_key
                epicName = entry.jira_issue_key
            }
        }

        const groupId = epicKey || '__no_epic__'
        if (!groups[groupId]) {
            groups[groupId] = {epicKey, epicName, epicStatus, totalHours: 0, entries: []}
        }
        groups[groupId].totalHours += entry.hours
        groups[groupId].entries.push(entry)
    }

    return Object.values(groups).sort((a, b) => b.totalHours - a.totalHours)
})

// --- Expand/collapse ---

const expandedEpics = ref(new Set<string>())

function toggleEpic(groupId: string) {
    if (expandedEpics.value.has(groupId)) {
        expandedEpics.value.delete(groupId)
    } else {
        expandedEpics.value.add(groupId)
    }
    // trigger reactivity
    expandedEpics.value = new Set(expandedEpics.value)
}

function epicGroupId(group: EpicGroup): string {
    return group.epicKey || '__no_epic__'
}

// --- Totals ---

const totalDuration = computed(() => timeEntries.value.reduce((s, e) => s + e.hours, 0))
const billableDuration = computed(() => timeEntries.value.filter(e => e.is_billable).reduce((s, e) => s + e.hours, 0))
const nonBillableDuration = computed(() => timeEntries.value.filter(e => !e.is_billable).reduce((s, e) => s + e.hours, 0))

// --- Helpers ---

function formatDate(date: string) {
    const d = new Date(date)
    return format(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), 'MMM dd, yyyy')
}

function formatDuration(decimal: number): string {
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)
    if (minutes === 60) return `${hours + 1}h 0m`
    return `${hours}h ${minutes}m`
}

// --- Filters & actions ---

function applyFilters() {
    const params: any = {}
    if (filters.value.start_date) params.start_date = filters.value.start_date
    if (filters.value.end_date) params.end_date = filters.value.end_date
    if (filters.value.is_billable !== '') params.is_billable = filters.value.is_billable === 'true'
    fetchTimeEntries(params).then(resolveEpicsForEntries)
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
    await resolveEpicsForEntries()
    toast.success(editingEntry.value ? 'Time entry updated!' : 'Time entry created!')
}

async function deleteEntry(id: string) {
    if (!confirm('Are you sure you want to delete this time entry?')) return
    try {
        await deleteTimeEntry(id)
        toast.success('Time entry deleted!')
        await fetchTimeEntries()
        await resolveEpicsForEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to delete time entry')
    }
}

async function syncFromJira() {
    if (!filters.value.start_date || !filters.value.end_date) {
        toast.error('Please set start and end dates before syncing')
        return
    }
    syncing.value = true
    try {
        await pullWorklogs(filters.value.start_date, filters.value.end_date)
        toast.success('Worklogs synced from Jira!')
        await fetchTimeEntries({start_date: filters.value.start_date, end_date: filters.value.end_date})
        await resolveEpicsForEntries()
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to sync worklogs from Jira')
    } finally {
        syncing.value = false
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

onMounted(async () => {
    const now = new Date()
    const start = format(startOfMonth(now), 'yyyy-MM-dd')
    const end = format(endOfMonth(now), 'yyyy-MM-dd')

    filters.value.start_date = start
    filters.value.end_date = end

    await fetchTimeEntries({start_date: start, end_date: end})
    await resolveEpicsForEntries()
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
                <button
                    :disabled="syncing"
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50"
                    @click="syncFromJira"
                >
                    {{ syncing ? 'Syncing...' : 'Sync from Jira' }}
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
                            <label class="block text-sm font-medium text-gray-700" for="billable-filter">Billable</label>
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

                <!-- Grouped Table -->
                <div v-else class="mt-8 flex flex-col">
                    <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50">
                                    <tr>
                                        <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6" scope="col">Date</th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Description</th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Duration</th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Jira Issue</th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Billable</th>
                                        <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Status</th>
                                        <th class="relative py-3.5 pl-3 pr-4 sm:pr-6" scope="col"><span class="sr-only">Actions</span></th>
                                    </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">

                                    <template v-for="group in groupedEntries" :key="epicGroupId(group)">
                                        <!-- Epic group header row -->
                                        <tr
                                            class="bg-indigo-50 cursor-pointer hover:bg-indigo-100 select-none"
                                            @click="toggleEpic(epicGroupId(group))"
                                        >
                                            <td class="py-3 pl-4 pr-3 sm:pl-6" colspan="7">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center gap-3">
                                                        <!-- Chevron -->
                                                        <svg
                                                            :class="expandedEpics.has(epicGroupId(group)) ? 'rotate-90' : ''"
                                                            class="h-4 w-4 text-indigo-500 transition-transform"
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                        >
                                                            <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                                                        </svg>
                                                        <!-- Epic badge -->
                                                        <span v-if="group.epicKey" class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            {{ group.epicKey }}
                                                        </span>
                                                        <span class="text-sm font-semibold text-gray-900">{{ group.epicName }}</span>
                                                        <span v-if="group.epicStatus" class="text-xs text-gray-500">{{ group.epicStatus }}</span>
                                                        <span v-if="resolvingEpics && !group.epicKey" class="text-xs text-gray-400 italic">resolving...</span>
                                                    </div>
                                                    <div class="flex items-center gap-4 pr-2">
                                                        <span class="text-sm font-semibold text-indigo-700">{{ formatDuration(group.totalHours) }}</span>
                                                        <span class="text-xs text-gray-500">{{ group.entries.length }} {{ group.entries.length === 1 ? 'entry' : 'entries' }}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        <!-- Entry rows (expanded) -->
                                        <template v-if="expandedEpics.has(epicGroupId(group))">
                                            <tr v-for="entry in group.entries" :key="entry.id" class="hover:bg-gray-50">
                                                <td class="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-gray-900 sm:pl-10">
                                                    {{ formatDate(entry.date) }}
                                                </td>
                                                <td class="px-3 py-4 text-sm text-gray-500">{{ entry.description }}</td>
                                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ formatDuration(entry.hours) }}</td>
                                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ entry.jira_issue_key || '-' }}</td>
                                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span
                                                        :class="entry.is_billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                                                        class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                                                    >{{ entry.is_billable ? 'Yes' : 'No' }}</span>
                                                </td>
                                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span
                                                        :class="entry.invoice_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'"
                                                        class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                                                    >{{ entry.invoice_id ? 'Invoiced' : 'Pending' }}</span>
                                                </td>
                                                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button class="text-primary-600 hover:text-primary-900 mr-4" @click="editEntry(entry)">Edit</button>
                                                    <button
                                                        v-if="entry.jira_issue_key && !entry.jira_worklog_id"
                                                        class="text-primary-600 hover:text-primary-900 mr-4"
                                                        @click="syncToJira(entry)"
                                                    >Sync to Jira</button>
                                                    <button class="text-red-600 hover:text-red-900" @click="deleteEntry(entry.id!)">Delete</button>
                                                </td>
                                            </tr>
                                        </template>
                                    </template>

                                    </tbody>
                                </table>

                                <div v-if="timeEntries.length === 0" class="text-center py-12">
                                    <p class="text-sm text-gray-500">No time entries found. Add your first time entry!</p>
                                </div>
                            </div>
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

        <template #right>
            <!-- Summary -->
            <div v-if="timeEntries.length > 0" class="bg-white shadow-sm rounded-lg p-6 flex-col">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div>
                    <p class="text-sm text-gray-500">Total Hours</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-900">{{ formatDuration(totalDuration) }}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Billable Hours</p>
                    <p class="mt-1 text-2xl font-semibold text-green-600">{{ formatDuration(billableDuration) }}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Non-billable Hours</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-600">{{ formatDuration(nonBillableDuration) }}</p>
                </div>
            </div>
        </template>
    </ThreeColumnLayout>
</template>
