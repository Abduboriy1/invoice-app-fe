// src/types/timeEntry.ts
export interface TimeEntry {
    id: string
    user_id: string
    invoice_id?: string
    description: string
    hours: number // Backend uses hours as float (e.g., 1.5 = 1h 30m)
    hourly_rate?: number
    date: string // Backend returns YYYY-MM-DD format
    jira_issue_key?: string
    jira_worklog_id?: string
    is_billable: boolean // Note: backend uses is_billable not billable
    is_invoiced: boolean
    created_at: string // ISO 8601 datetime string
    updated_at: string // ISO 8601 datetime string
}

export interface TimeEntryCreateRequest {
    description: string
    hours: number // Decimal hours (e.g., 1.5 for 1h 30m)
    date: Date // Will be converted to YYYY-MM-DD when sent
    jira_issue_key?: string
    is_billable: boolean
}

export interface TimeEntryUpdateRequest extends TimeEntryCreateRequest {
    id: string
}