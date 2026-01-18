// src/stores/timeEntry.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { timeEntryService } from '@/services/api/timeEntry.service'
import { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '@/types/timeEntry'

export const useTimeEntryStore = defineStore('timeEntry', () => {
    const timeEntries = ref<TimeEntry[]>([])
    const currentTimeEntry = ref<TimeEntry | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchTimeEntries(params?: {
        page?: number
        limit?: number
        start_date?: string
        end_date?: string
        is_billable?: boolean // Changed from billable to is_billable
    }) {
        loading.value = true
        error.value = null
        try {
            timeEntries.value = await timeEntryService.list(params)
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchTimeEntry(id: string) {
        loading.value = true
        error.value = null
        try {
            currentTimeEntry.value = await timeEntryService.get(id)
            return currentTimeEntry.value
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function createTimeEntry(data: TimeEntryCreateRequest) {
        loading.value = true
        error.value = null
        try {
            const entry = await timeEntryService.create(data)
            timeEntries.value.unshift(entry) // Add to beginning for newest first
            return entry
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateTimeEntry(id: string, data: TimeEntryUpdateRequest) {
        loading.value = true
        error.value = null
        try {
            const updated = await timeEntryService.update(id, data)
            const index = timeEntries.value.findIndex((entry) => entry.id === id)
            if (index !== -1) {
                timeEntries.value[index] = updated
            }
            if (currentTimeEntry.value?.id === id) {
                currentTimeEntry.value = updated
            }
            return updated
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function deleteTimeEntry(id: string) {
        loading.value = true
        error.value = null
        try {
            await timeEntryService.delete(id)
            timeEntries.value = timeEntries.value.filter((entry) => entry.id !== id)
            if (currentTimeEntry.value?.id === id) {
                currentTimeEntry.value = null
            }
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function syncToJira(id: string, issueKey: string) {
        loading.value = true
        error.value = null
        try {
            await timeEntryService.syncToJira(id, issueKey)
            // Refresh to get updated sync status
            await fetchTimeEntry(id)
            // Also update in the list
            const index = timeEntries.value.findIndex((entry) => entry.id === id)
            if (index !== -1 && currentTimeEntry.value) {
                timeEntries.value[index] = currentTimeEntry.value
            }
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        timeEntries,
        currentTimeEntry,
        loading,
        error,
        fetchTimeEntries,
        fetchTimeEntry,
        createTimeEntry,
        updateTimeEntry,
        deleteTimeEntry,
        syncToJira,
    }
})