export const currencyUtils = {
    format(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount)
    },

    parse(value: string): number {
        return parseFloat(value.replace(/[^0-9.-]+/g, ''))
    },

    formatCompact(amount: number, currency: string = 'USD'): string {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(amount)
        return formatted
    },
}