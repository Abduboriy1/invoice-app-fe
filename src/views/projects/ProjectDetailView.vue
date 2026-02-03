<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProject } from '@/composables/useProject'
import { ProjectStatus, type Worklog } from '@/types/project'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import ThreeColumnLayout from '@/layouts/ThreeColumnLayout.vue'

const route = useRoute()
const router = useRouter()
const { currentProject, comments, worklogs, loading, error, fetchProject, fetchComments, fetchWorklogs } = useProject()

const excludeBots = ref(false)
const projectId = route.params.id as string
const selectedMonth = ref(format(new Date(), 'yyyy-MM'))
const authorFilter = ref('Bory Abdurakhmonov')

const statusOptions: Record<string, string> = {
    [ProjectStatus.READY_FOR_DEV]: 'Ready for Dev',
    [ProjectStatus.DEV]: 'Dev',
    [ProjectStatus.READY_FOR_QA]: 'Ready for QA',
    [ProjectStatus.QA]: 'QA',
    [ProjectStatus.DEPLOYED]: 'Deployed',
}

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

function progressPercent(approved: number, spent: number): number {
    if (approved <= 0) return 0
    return Math.min(100, Math.round((spent / approved) * 100))
}

function progressBarColor(approved: number, spent: number): string {
    const pct = progressPercent(approved, spent)
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
}

function formatCommentDate(dateStr: string): string {
    return format(new Date(dateStr), 'MMM dd, yyyy h:mm a')
}

function formatWorklogDate(dateStr: string): string {
    return format(parseISO(dateStr), 'MMM dd, yyyy')
}

const filteredWorklogs = computed(() => {
    if (!worklogs.value?.buckets) return {}

    const [year, month] = selectedMonth.value.split('-').map(Number)
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))

    const filtered: Record<string, Worklog[]> = {}

    for (const [bucket, logs] of Object.entries(worklogs.value.buckets)) {
        const bucketLogs = logs.filter((log) => {
            const logDate = parseISO(log.started)
            const inMonth = isWithinInterval(logDate, { start: monthStart, end: monthEnd })
            const byAuthor = !authorFilter.value || log.author === authorFilter.value
            return inMonth && byAuthor
        })
        if (bucketLogs.length > 0) {
            filtered[bucket] = bucketLogs
        }
    }

    return filtered
})

const totalFilteredSeconds = computed(() => {
    return Object.values(filteredWorklogs.value).flat().reduce((sum, log) => sum + log.timeSpentSeconds, 0)
})

function formatTotalTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

const uniqueAuthors = computed(() => {
    if (!worklogs.value?.buckets) return []
    const authors = new Set<string>()
    for (const logs of Object.values(worklogs.value.buckets)) {
        for (const log of logs) {
            authors.add(log.author)
        }
    }
    return Array.from(authors).sort()
})

async function toggleBotFilter() {
    excludeBots.value = !excludeBots.value
    await fetchComments(projectId, excludeBots.value)
}

onMounted(async () => {
    const project = await fetchProject(projectId)
    await fetchComments(projectId, excludeBots.value)
    if (project?.jira_epic_key) {
        await fetchWorklogs(project.jira_epic_key)
    }
})
</script>

<template>
    <ThreeColumnLayout>
        <template #left>
            <button
                class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                @click="router.push({ name: 'projects' })"
            >
                &larr; Back to Projects
            </button>
        </template>

        <template #center>
            <div class="px-4 sm:px-0">
                <!-- Loading -->
                <div v-if="loading" class="text-center py-12">
                    <p class="text-gray-500">Loading project...</p>
                </div>

                <!-- Error -->
                <div v-else-if="error" class="rounded-md bg-red-50 p-4">
                    <p class="text-sm text-red-800">{{ error }}</p>
                </div>

                <template v-else-if="currentProject">
                    <!-- Project Header -->
                    <div class="bg-white shadow-sm rounded-lg p-6">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900">{{ currentProject.name }}</h2>
                            <span
                                :class="statusColor(currentProject.status)"
                                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5"
                            >
                                {{ statusOptions[currentProject.status] ?? currentProject.status }}
                            </span>
                        </div>
                        <p class="mt-1 text-sm text-gray-500">{{ currentProject.jira_project_key }}</p>

                        <!-- Hours Progress -->
                        <div class="mt-4">
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{{ currentProject.dev_hours }}h spent</span>
                                <span>{{ currentProject.dle_hours }}h approved</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    :class="progressBarColor(currentProject.dle_hours, currentProject.dev_hours)"
                                    :style="{ width: progressPercent(currentProject.dle_hours, currentProject.dev_hours) + '%' }"
                                    class="h-3 rounded-full transition-all"
                                ></div>
                            </div>
                            <p class="mt-1 text-xs text-gray-500 text-right">
                                {{ progressPercent(currentProject.approved_hours, currentProject.hours_spent) }}% used
                            </p>
                        </div>
                    </div>

                    <!-- Worklogs Section -->
                    <div class="mt-6 bg-white shadow-sm rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Worklogs</h3>
                            <div class="flex items-center gap-4">
                                <div class="flex items-center gap-2">
                                    <label class="text-sm text-gray-600">Month:</label>
                                    <input
                                        v-model="selectedMonth"
                                        type="month"
                                        class="rounded border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div class="flex items-center gap-2">
                                    <label class="text-sm text-gray-600">Author:</label>
                                    <select
                                        v-model="authorFilter"
                                        class="rounded border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">All Authors</option>
                                        <option v-for="author in uniqueAuthors" :key="author" :value="author">
                                            {{ author }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Total time -->
                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm text-gray-600">Total time: </span>
                            <span class="text-sm font-semibold text-gray-900">{{ formatTotalTime(totalFilteredSeconds) }}</span>
                        </div>

                        <div v-if="Object.keys(filteredWorklogs).length === 0" class="text-center py-8">
                            <p class="text-sm text-gray-500">No worklogs found for the selected filters.</p>
                        </div>

                        <div v-else class="space-y-6">
                            <div v-for="(logs, bucket) in filteredWorklogs" :key="bucket">
                                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <span class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                                        {{ bucket }}
                                    </span>
                                    <span class="text-gray-400 text-xs">
                                        ({{ logs.length }} {{ logs.length === 1 ? 'entry' : 'entries' }})
                                    </span>
                                </h4>
                                <div class="space-y-2">
                                    <div
                                        v-for="log in logs"
                                        :key="log.id"
                                        class="border-l-4 border-primary-300 pl-4 py-2 bg-gray-50 rounded-r"
                                    >
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm font-medium text-gray-900">{{ log.author }}</span>
                                                <span class="text-xs text-gray-400">{{ formatWorklogDate(log.started) }}</span>
                                                <span class="text-xs text-gray-500 font-mono">{{ log.issueKey }}</span>
                                            </div>
                                            <span class="text-sm font-semibold text-primary-600">{{ log.timeSpent }}</span>
                                        </div>
                                        <p v-if="log.comment" class="mt-1 text-sm text-gray-600">{{ log.comment }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comments Section -->
                    <div class="mt-6 bg-white shadow-sm rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Notes &amp; Comments</h3>
                            <label class="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="excludeBots"
                                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    @change="toggleBotFilter"
                                />
                                <span class="ml-2 text-sm text-gray-600">Hide bot comments</span>
                            </label>
                        </div>

                        <div v-if="comments.length === 0" class="text-center py-8">
                            <p class="text-sm text-gray-500">No comments found.</p>
                        </div>

                        <div v-else class="space-y-4">
                            <template v-for="comment in comments" :key="comment.id">
                            <div
                                v-if="comment.author !== 'Fast Track'"
                                class="border-l-4 pl-4 py-2"
                                :class="comment.author_is_bot ? 'border-gray-300' : 'border-primary-400'"
                            >

                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium text-gray-900">{{ comment.author }}</span>
                                    <span
                                        v-if="comment.author_is_bot"
                                        class="inline-flex rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-600"
                                    >
                                        bot
                                    </span>
                                    <span class="text-xs text-gray-400">{{ formatCommentDate(comment.created_at) }}</span>
                                </div>
                                <p class="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{{ comment.body }}</p>
                            </div>
                            </template>
                        </div>
                    </div>
                </template>
            </div>
        </template>

        <template #right></template>
    </ThreeColumnLayout>
</template>
