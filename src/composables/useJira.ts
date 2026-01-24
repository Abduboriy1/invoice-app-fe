import { ref } from 'vue'

// Placeholder for Jira integration
// This would connect to your backend's Jira endpoints when implemented
export function useJira() {
    const loading = ref(false)
    const error = ref<string | null>(null)

    /**
     * Pull worklogs from Jira for a date range
     */
    const pullWorklogs = async (
        startDate: string,
        endDate: string,
        issueKeys?: string[]
    ) => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/jira/pull-worklogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                    issue_keys: issueKeys,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to pull worklogs')
            }

            const data = await response.json()
            return data
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'An error occurred'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Pull worklogs for a specific Jira issue
     */
    const pullIssueWorklogs = async (issueKey: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/jira/pull-issue-worklogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    issue_key: issueKey,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to pull issue worklogs')
            }

            const data = await response.json()
            return data
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'An error occurred'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Push a time entry to Jira as a worklog
     */
    const pushWorklog = async (timeEntryId: string, issueKey: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/jira/push-worklog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time_entry_id: timeEntryId,
                    issue_key: issueKey,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to push worklog')
            }

            const data = await response.json()
            return data
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'An error occurred'
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        pullWorklogs,
        pullIssueWorklogs,
        pushWorklog,
    }
}