export interface WorklogEntry {
    date: string
    author: string
    hours: number
    description: string
    issue_key: string
}

export interface MonthlyInvoiceEpic {
    epic_key: string
    epic_name: string
    project_id: string
    status: string
    buckets: Record<string, WorklogEntry[]>
    total_hours: number
}

export interface MonthlyInvoiceDataResponse {
    month: string
    epics: MonthlyInvoiceEpic[]
    grand_total_hours: number
    generated_at: string
}
