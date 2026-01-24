<template>
    <div class="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

            <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div
                class="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <form @submit.prevent="handleSubmit">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">
                            {{ entry ? 'Edit Time Entry' : 'Add Time Entry' }}
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label for="modal-description" class="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    v-model="formData.description"
                                    type="text"
                                    id="modal-description"
                                    required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label for="modal-date" class="block text-sm font-medium text-gray-700">Date</label>
                                    <input
                                        v-model="formData.date"
                                        type="date"
                                        id="modal-date"
                                        required
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label for="modal-hours"
                                           class="block text-sm font-medium text-gray-700">Hours</label>
                                    <input
                                        v-model.number="formData.hours"
                                        type="number"
                                        id="modal-hours"
                                        required
                                        min="0.25"
                                        step="0.25"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label for="modal-jira" class="block text-sm font-medium text-gray-700">Jira Issue
                                    (Optional)</label>
                                <input
                                    v-model="formData.jira_issue_key"
                                    type="text"
                                    id="modal-jira"
                                    placeholder="PROJ-123"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label class="flex items-center">
                                    <input
                                        v-model="formData.is_billable"
                                        type="checkbox"
                                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span class="ml-2 text-sm text-gray-700">Billable</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="submit"
                            class="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {{ entry ? 'Update' : 'Create' }}
                        </button>
                        <button
                            type="button"
                            @click="$emit('close')"
                            class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {reactive, watch} from 'vue'
import {useTimeEntry} from '@/composables/useTimeEntry'
import type {TimeEntry, TimeEntryCreateRequest} from '@/types/timeEntry'

interface Props {
    entry?: TimeEntry | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
    close: []
    submit: []
}>()

const {createTimeEntry, updateTimeEntry} = useTimeEntry()

const formData = reactive({
    description: props.entry?.description || '',
    hours: props.entry?.hours || 1,
    date: props.entry?.date || new Date().toISOString().split('T')[0],
    jira_issue_key: props.entry?.jira_issue_key || '',
    is_billable: props.entry?.is_billable ?? true,
})

watch(() => props.entry, (newEntry) => {
    if (newEntry) {
        formData.description = newEntry.description
        formData.hours = newEntry.hours
        formData.date = newEntry.date
        formData.jira_issue_key = newEntry.jira_issue_key || ''
        formData.is_billable = newEntry.is_billable
    }
})

async function handleSubmit() {
    try {
        if (props.entry?.id) {
            await updateTimeEntry(props.entry.id, formData)
        } else {
            await createTimeEntry(formData)
        }
        emit('submit')
    } catch (e: any) {
        console.error('Failed to save time entry:', e)
    }
}
</script>
