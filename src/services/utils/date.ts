import {format, formatDistanceToNow, parseISO} from 'date-fns'

export const dateUtils = {
    format(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return format(dateObj, formatString)
    },

    formatTime(date: string | Date): string {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return format(dateObj, 'h:mm a')
    },

    formatDateTime(date: string | Date): string {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return format(dateObj, 'MMM dd, yyyy h:mm a')
    },

    timeAgo(date: string | Date): string {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return formatDistanceToNow(dateObj, {addSuffix: true})
    },

    toISODate(date: Date): string {
        return format(date, 'yyyy-MM-dd')
    },

    today(): string {
        return this.toISODate(new Date())
    },
}