import { apiClient } from '@/services/api/client'
import type { Project, ProjectComment, WorklogResponse } from '@/types/project'

interface ListParams {
    month?: string
    status?: string
    author?: string
}

export const projectService = {
    async list(params?: ListParams): Promise<Project[]> {
        const response = await apiClient.get<Project[]>('/projects', { params })
        return response.data
    },

    async get(id: string): Promise<Project> {
        const response = await apiClient.get<Project>(`/projects/${id}`)
        return response.data
    },

    async getComments(id: string, excludeBots?: boolean): Promise<ProjectComment[]> {
        const params = excludeBots ? { exclude_bots: true } : undefined
        const response = await apiClient.get<ProjectComment[]>(`/projects/${id}/comments`, { params })
        return response.data
    },

    async getWorklogs(epicKey: string, month?: string): Promise<WorklogResponse> {
        const params = month ? { month } : undefined
        const response = await apiClient.get<WorklogResponse>(`/jira/epic/${epicKey}/worklogs`, { params })
        return response.data
    },
}
