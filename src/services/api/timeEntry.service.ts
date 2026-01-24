// src/services/api/timeEntry.service.ts
import { apiClient } from '@/services/api/client'
import type { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '@/types/timeEntry'

interface ListParams {
    page?: number
    limit?: number
    start_date?: string
    end_date?: string
    is_billable?: boolean
}

export const timeEntryService = {
    async list(params?: ListParams): Promise<TimeEntry[]> {
        const response = await apiClient.get<TimeEntry[]>('/time-entries', { params })
        return response.data
    },

    async get(id: string): Promise<TimeEntry> {
        const response = await apiClient.get<TimeEntry>(`/time-entries/${id}`)
        return response.data
    },

    async create(data: TimeEntryCreateRequest): Promise<TimeEntry> {
        // Convert Date to YYYY-MM-DD format for backend
        const payload = {
            description: data.description,
            hours: data.hours,
            date: data.date.toISOString().split('T')[0],
            is_billable: data.is_billable,
            ...(data.jira_issue_key && { jira_issue_key: data.jira_issue_key })
        }

        const response = await apiClient.post<TimeEntry>('/time-entries', payload)
        return response.data
    },

    async update(id: string, data: TimeEntryUpdateRequest): Promise<TimeEntry> {
        // Convert Date to YYYY-MM-DD format for backend
        const payload = {
            description: data.description,
            hours: data.hours,
            date: data.date,
            is_billable: data.is_billable,
            ...(data.jira_issue_key && { jira_issue_key: data.jira_issue_key })
        }

        const response = await apiClient.put<TimeEntry>(`/time-entries/${id}`, payload)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/time-entries/${id}`)
    },

    async syncToJira(id: string): Promise<void> {
        await apiClient.post(`/time-entries/${id}/sync-jira`)
    }
}