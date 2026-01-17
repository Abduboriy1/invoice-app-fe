export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

export interface InvoiceLineItem {
    id?: string
    description: string
    quantity: number
    rate: number
    amount: number
}

export interface Invoice {
    id?: string
    invoice_number?: string
    client_name: string
    client_email: string
    client_address?: string
    issue_date: string
    due_date: string
    status: InvoiceStatus
    line_items: InvoiceLineItem[]
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    notes?: string
    created_at?: string
    updated_at?: string
}

export interface InvoiceCreateRequest {
    client_name: string
    client_email: string
    client_address?: string
    issue_date: string
    due_date: string
    line_items: InvoiceLineItem[]
    tax_rate: number
    notes?: string
}