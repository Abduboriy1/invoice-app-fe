export interface TimeEntry {
    id?: string
    user_id?: string
    description: string
    duration: number // in minutes
    date: string
    jira_issue_key?: string
    jira_worklog_id?: string
    billable: boolean
    invoiced: boolean
    invoice_id?: string
    created_at?: string
    updated_at?: string
}

export interface TimeEntryCreateRequest {
    description: string
    duration: number
    date: string
    jira_issue_key?: string
    billable?: boolean
}