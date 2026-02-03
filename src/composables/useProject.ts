import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'

export function useProject() {
    const store = useProjectStore()

    const projects = computed(() => store.projects)
    const currentProject = computed(() => store.currentProject)
    const comments = computed(() => store.comments)
    const worklogs = computed(() => store.worklogs)
    const loading = computed(() => store.loading)
    const error = computed(() => store.error)

    const fetchProjects = (params?: { month?: string; status?: string; author?: string }) =>
        store.fetchProjects(params)

    const fetchProject = (id: string) => store.fetchProject(id)

    const fetchComments = (id: string, excludeBots?: boolean) =>
        store.fetchComments(id, excludeBots)

    const fetchWorklogs = (epicKey: string) => store.fetchWorklogs(epicKey)

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
}
