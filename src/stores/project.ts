import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectService } from '@/services/api/project.service'
import type { Project, ProjectComment, WorklogResponse } from '@/types/project'

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Project[]>([])
    const currentProject = ref<Project | null>(null)
    const comments = ref<ProjectComment[]>([])
    const worklogs = ref<WorklogResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchProjects(params?: { month?: string; status?: string; author?: string }) {
        loading.value = true
        error.value = null
        try {
            projects.value = await projectService.list(params)
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchProject(id: string) {
        loading.value = true
        error.value = null
        try {
            currentProject.value = await projectService.get(id)
            return currentProject.value
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchComments(id: string, excludeBots?: boolean) {
        error.value = null
        try {
            comments.value = await projectService.getComments(id, excludeBots)
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        }
    }

    async function fetchWorklogs(epicKey: string, month?: string) {
        error.value = null
        try {
            worklogs.value = await projectService.getWorklogs(epicKey, month)
        } catch (e: any) {
            error.value = e.response?.data?.error || e.message
            throw e
        }
    }

    return {
        projects,
        currentProject,
        comments,
        worklogs,
        loading,
        error,
        fetchProjects,
        fetchProject,
        fetchComments,
        fetchWorklogs,
    }
})
