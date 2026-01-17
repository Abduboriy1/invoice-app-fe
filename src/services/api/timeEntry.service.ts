import { apiClient } from './client'
import { TimeEntry, TimeEntryCreateRequest } from '@/types/timeEntry'

export const timeEntryService = {
    async list(params?: {
        page?: number
        limit?: number
        start_date?: string
        end_date?: string
        billable?: boolean
    }): Promise<TimeEntry[]> {
        const { data } = await apiClient.get('/time-entries', { params })
        return data
    },

    async get(id: string): Promise<TimeEntry> {
        const { data } = await apiClient.get(`/time-entries/${id}`)
        return data
    },

    async create(entry: TimeEntryCreateRequest): Promise<TimeEntry> {
        const { data } = await apiClient.post('/time-entries', entry)
        return data
    },

    async update(id: string, entry: Partial<TimeEntryCreateRequest>): Promise<TimeEntry> {
        const { data } = await apiClient.put(`/time-entries/${id}`, entry)
        return data
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/time-entries/${id}`)
    },

    async syncToJira(id: string): Promise<void> {
        await apiClient.post(`/time-entries/${id}/sync-jira`)
    },
}