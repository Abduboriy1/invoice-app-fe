<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProject } from '@/composables/useProject'
import { ProjectStatus } from '@/types/project'
import { format } from 'date-fns'
import ThreeColumnLayout from '@/layouts/ThreeColumnLayout.vue'

const router = useRouter()
const { projects, loading, error, fetchProjects } = useProject()

const filters = ref({
    month: format(new Date(), 'yyyy-MM'),
    status: '',
    author: '',
})

const totalApprovedHours = computed(() =>
    projects.value.reduce((sum, p) => sum + p.dle_hours, 0)
)

const totalSpentHours = computed(() =>
    projects.value.reduce((sum, p) => sum + p.dev_hours, 0)
)

const statusOptions = [
    { value: '', label: 'All' },
    { value: ProjectStatus.READY_FOR_DEV, label: 'Ready for Dev' },
    { value: ProjectStatus.DEV, label: 'Dev' },
    { value: ProjectStatus.READY_FOR_QA, label: 'Ready for QA' },
    { value: ProjectStatus.QA, label: 'QA' },
    { value: ProjectStatus.DEPLOYED, label: 'Deployed' },
]

function statusColor(status: ProjectStatus): string {
    switch (status) {
        case ProjectStatus.READY_FOR_DEV:
            return 'bg-yellow-100 text-yellow-800'
        case ProjectStatus.DEV:
            return 'bg-blue-100 text-blue-800'
        case ProjectStatus.READY_FOR_QA:
            return 'bg-orange-100 text-orange-800'
        case ProjectStatus.QA:
            return 'bg-purple-100 text-purple-800'
        case ProjectStatus.DEPLOYED:
            return 'bg-green-100 text-green-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

function statusLabel(status: ProjectStatus): string {
    return statusOptions.find((o) => o.value === status)?.label ?? status
}

function progressPercent(project: { approved_hours: number; hours_spent: number, dev_hours: number, dle_hours: number }): number {
    if (project.dev_hours <= 0) return 0
    return Math.min(100, Math.round((project.dev_hours / project.dle_hours) * 100))
}

function progressColor(project: { approved_hours: number; hours_spent: number, dev_hours: number, dle_hours: number }): string {
    const pct = progressPercent(project)
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
}

function parsePriority(val: string): number | null {
    if (!val || val === '<nil>') return null
    const n = Number(val)
    return isNaN(n) ? null : n
}

const sortedProjects = computed(() => {
    return [...projects.value].sort((a, b) => {
        const pa = parsePriority(a.priority)
        const pb = parsePriority(b.priority)
        if (pa === null && pb === null) return 0
        if (pa === null) return 1
        if (pb === null) return -1
        return pa - pb
    })
})

function applyFilters() {
    const params: any = {}
    if (filters.value.month) params.month = filters.value.month
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.author) params.author = filters.value.author
    fetchProjects(params)
}

function viewProject(id: string) {
    router.push({ name: 'project-detail', params: { id } })
}

onMounted(() => {
    applyFilters()
})
</script>

<template>
    <ThreeColumnLayout>
        <template #left></template>

        <template #center>
            <div class="px-4 sm:px-0">
                <!-- Filters -->
                <div class="bg-white shadow-sm rounded-lg p-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="month-filter">Month</label>
                            <input
                                id="month-filter"
                                v-model="filters.month"
                                type="month"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="status-filter">Status</label>
                            <select
                                id="status-filter"
                                v-model="filters.status"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="author-filter">Comment Author</label>
                            <input
                                id="author-filter"
                                v-model="filters.author"
                                type="text"
                                placeholder="Filter by author"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                        <div class="flex items-end">
                            <button
                                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                                @click="applyFilters"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="loading" class="mt-8 text-center">
                    <p class="text-gray-500">Loading projects...</p>
                </div>

                <!-- Error -->
                <div v-else-if="error" class="mt-8 rounded-md bg-red-50 p-4">
                    <p class="text-sm text-red-800">{{ error }}</p>
                </div>

                <!-- Projects Table -->
                <div v-else class="mt-8 flex flex-col">
                    <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6" scope="col">Prio</th>
                                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Name</th>
                                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Application</th>
                                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Jira Key</th>
                                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Status</th>
                                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Hours</th>
                                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" scope="col">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                        <tr
                                            v-for="project in sortedProjects"
                                            :key="project.id"
                                            class="cursor-pointer hover:bg-gray-50"
                                            @click="viewProject(project.id)"
                                        >
                                            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                                                {{ parsePriority(project.priority) ?? '-' }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                {{ project.name }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {{ project.application || '-' }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {{ project.jira_epic_key }}
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm">
                                                <span
                                                    :class="statusColor(project.status)"
                                                    class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                                                >
                                                    {{ statusLabel(project.status) }}
                                                </span>
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {{ project.dev_hours }} / {{ project.dle_hours }}h
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-24 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            :class="progressColor(project)"
                                                            :style="{ width: progressPercent(project) + '%' }"
                                                            class="h-2 rounded-full"
                                                        ></div>
                                                    </div>
                                                    <span class="text-xs">{{ progressPercent(project) }}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div v-if="projects.length === 0" class="text-center py-12">
                                    <p class="text-sm text-gray-500">No projects found for this period.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #right>
            <div v-if="projects.length > 0" class="bg-white shadow-sm rounded-lg p-6 flex-col">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div>
                    <p class="text-sm text-gray-500">Total Projects</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-900">{{ projects.length }}</p>
                </div>
                <div class="mt-4">
                    <p class="text-sm text-gray-500">Approved Hours</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-900">{{ totalApprovedHours }}h</p>
                </div>
                <div class="mt-4">
                    <p class="text-sm text-gray-500">Hours Spent</p>
                    <p class="mt-1 text-2xl font-semibold text-primary-600">{{ totalSpentHours }}h</p>
                </div>
            </div>
        </template>
    </ThreeColumnLayout>
</template>
