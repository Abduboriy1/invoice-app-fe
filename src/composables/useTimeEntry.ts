import {computed} from 'vue'
import {useTimeEntryStore} from '@/stores/timeEntry'
import {TimeEntryCreateRequest, TimeEntryUpdateRequest} from '@/types/timeEntry'

export function useTimeEntry() {
    const store = useTimeEntryStore()

    const timeEntries = computed(() => store.timeEntries)
    const currentTimeEntry = computed(() => store.currentTimeEntry)
    const loading = computed(() => store.loading)
    const error = computed(() => store.error)

    const fetchTimeEntries = (params?: {
        page?: number
        limit?: number
        start_date?: string
        end_date?: string
        billable?: boolean
    }) => store.fetchTimeEntries(params)

    const fetchTimeEntry = (id: string) => store.fetchTimeEntry(id)

    const createTimeEntry = (data: TimeEntryCreateRequest) => store.createTimeEntry(data)

    const updateTimeEntry = (id: string, data: TimeEntryUpdateRequest) =>
        store.updateTimeEntry(id, data)

    const deleteTimeEntry = (id: string) => store.deleteTimeEntry(id)

    const syncTimeEntryToJira = (id: string) => store.syncToJira(id)

    const pullWorklogs = (startDate: string, endDate: string) => store.pullWorklogs(startDate, endDate)

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
        syncTimeEntryToJira,
        pullWorklogs,
    }
}