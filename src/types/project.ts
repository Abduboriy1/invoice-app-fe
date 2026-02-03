export enum ProjectStatus {
    READY_FOR_DEV = 'READY_FOR_DEV',
    DEV = 'DEV',
    READY_FOR_QA = 'READY_FOR_QA',
    QA = 'QA',
    DEPLOYED = 'DEPLOYED',
}

export interface Project {
    id: string
    name: string
    jira_project_key: string
    status: ProjectStatus
    approved_hours: number
    hours_spent: number
    month: string // YYYY-MM
    created_at: string
    updated_at: string
    jira_epic_key: string
    dev_hours: number
    dle_hours: number
    application: string
    priority: string
}

export interface ProjectComment {
    id: string
    author: string
    author_is_bot: boolean
    body: string
    created_at: string
}

export interface Worklog {
    id: string
    issueKey: string
    author: string
    comment: string
    started: string
    timeSpent: string
    timeSpentSeconds: number
}

export interface WorklogResponse {
    epicKey: string
    buckets: Record<string, Worklog[]>
}
