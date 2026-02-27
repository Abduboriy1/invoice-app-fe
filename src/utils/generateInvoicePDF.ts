import {jsPDF} from 'jspdf'
import type {InvoiceLineItem} from '@/types/invoice'

export interface InvoicePDFData {
    invoice_number: string
    issuer_name: string
    issuer_address: string
    issuer_phone: string
    client_name: string
    client_email: string
    client_address?: string
    client_phone?: string
    client_company?: string
    issue_date: string
    due_date: string
    service_date: string
    line_items: InvoiceLineItem[]
    tax_rate: number
    notes?: string
    subtotal: number
    taxAmount: number
    total: number
}

function formatInvoiceNumber(num: string): string {
    const n = parseInt(num, 10)
    if (!isNaN(n)) {
        return `#${String(n).padStart(6, '0')}`
    }
    return num.startsWith('#') ? num : `#${num}`
}

function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
}

const MARGIN = 20
const HEADER_HEIGHT = 38

function drawHeader(doc: jsPDF, data: InvoicePDFData) {
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 15

    // Invoice number
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(formatInvoiceNumber(data.invoice_number), MARGIN, y)

    // Issue date next to invoice number
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Issue Date: ${formatDate(data.issue_date)}`, MARGIN + 2, y + 6)
    doc.setTextColor(0, 0, 0)

    // Issuer info on the right
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(data.issuer_name, pageWidth - MARGIN, y, {align: 'right'})
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    const issuerLines: string[] = []
    if (data.issuer_address) issuerLines.push(data.issuer_address)
    if (data.issuer_phone) issuerLines.push(data.issuer_phone)
    let issuerY = y + 5
    for (const line of issuerLines) {
        doc.text(line, pageWidth - MARGIN, issuerY, {align: 'right'})
        issuerY += 4
    }
    doc.setTextColor(0, 0, 0)

    // Thick separator line
    const lineY = HEADER_HEIGHT
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(1.5)
    doc.line(MARGIN, lineY, pageWidth - MARGIN, lineY)
    doc.setLineWidth(0.2)

    // Reset font state so callers aren't affected
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, data: InvoicePDFData): number {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + needed > pageHeight - MARGIN) {
        doc.addPage()
        drawHeader(doc, data)
        return HEADER_HEIGHT + 10
    }
    return y
}

export function generateInvoicePDF(data: InvoicePDFData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const contentWidth = pageWidth - MARGIN * 2

    // --- Page 1 Header ---
    drawHeader(doc, data)
    let y = HEADER_HEIGHT + 12

    // --- Customer Section ---
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To', MARGIN, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (data.client_company) {
        doc.setFont('helvetica', 'bold')
        doc.text(data.client_company, MARGIN, y)
        doc.setFont('helvetica', 'normal')
        y += 5
    }
    doc.text(data.client_name, MARGIN, y)
    y += 5
    if (data.client_email) {
        doc.text(data.client_email, MARGIN, y)
        y += 5
    }
    if (data.client_phone) {
        doc.text(data.client_phone, MARGIN, y)
        y += 5
    }
    if (data.client_address) {
        const addrLines = doc.splitTextToSize(data.client_address, contentWidth / 2)
        doc.text(addrLines, MARGIN, y)
        y += addrLines.length * 5
    }

    // --- Invoice Detail & Payment (side by side) ---
    y += 8
    const halfWidth = contentWidth / 2
    const rightCol = MARGIN + halfWidth + 10

    // Invoice Detail box
    doc.setFillColor(248, 248, 248)
    doc.roundedRect(MARGIN, y - 4, halfWidth - 5, 36, 2, 2, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Invoice Details', MARGIN + 5, y + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Generated: ${formatDate(new Date().toISOString().split('T')[0])}`, MARGIN + 5, y + 11)
    doc.text(`Service Date: ${formatDate(data.service_date)}`, MARGIN + 5, y + 19)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: $${data.total.toFixed(2)}`, MARGIN + 5, y + 27)
    doc.setFont('helvetica', 'normal')

    // Payment box
    doc.setFillColor(248, 248, 248)
    doc.roundedRect(rightCol, y - 4, halfWidth - 5, 36, 2, 2, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment', rightCol + 5, y + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Due Date: ${formatDate(data.due_date)}`, rightCol + 5, y + 11)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Amount Due: $${data.total.toFixed(2)}`, rightCol + 5, y + 23)
    doc.setFont('helvetica', 'normal')

    y += 42

    // --- Line Items Table ---
    y = checkPageBreak(doc, y, 20, data)

    const colX = {
        desc: MARGIN,
        qty: pageWidth - MARGIN - 70,
        rate: pageWidth - MARGIN - 40,
        amount: pageWidth - MARGIN,
    }

    // Table header
    doc.setFillColor(40, 40, 40)
    doc.rect(MARGIN, y - 5, contentWidth, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('Description', colX.desc + 3, y)
    doc.text('Qty', colX.qty, y, {align: 'right'})
    doc.text('Rate', colX.rate, y, {align: 'right'})
    doc.text('Amount', colX.amount - 3, y, {align: 'right'})
    doc.setTextColor(0, 0, 0)

    // Group line items by application
    const groups: Record<string, InvoiceLineItem[]> = {}
    for (const item of data.line_items) {
        const key = item.application || 'Other'
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
    }

    y += 8
    for (const [appName, items] of Object.entries(groups)) {
        y = checkPageBreak(doc, y, 12, data)

        // Application header row
        doc.setFillColor(230, 237, 247)
        doc.rect(MARGIN, y - 5, contentWidth, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(appName, colX.desc + 3, y)
        y += 10

        // Items
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        let groupTotal = 0
        for (const item of items) {
            y = checkPageBreak(doc, y, 12, data)

            const descLines = doc.splitTextToSize(item.description || '', colX.qty - colX.desc - 20)
            doc.text(descLines, colX.desc + 3, y)
            doc.text(String(item.quantity), colX.qty, y, {align: 'right'})
            doc.text(item.rate.toFixed(2), colX.rate, y, {align: 'right'})
            doc.text(item.amount.toFixed(2), colX.amount - 3, y, {align: 'right'})
            groupTotal += item.amount
            y += Math.max(descLines.length, 1) * 6

            doc.setDrawColor(230, 230, 230)
            doc.line(MARGIN, y - 3, pageWidth - MARGIN, y - 3)
            y += 4
        }

        // Group subtotal
        y = checkPageBreak(doc, y, 10, data)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(`${appName} Subtotal:`, colX.rate, y, {align: 'right'})
        doc.text(groupTotal.toFixed(2), colX.amount - 3, y, {align: 'right'})
        doc.setFont('helvetica', 'normal')
        y += 10
    }

    // --- Totals ---
    y = checkPageBreak(doc, y, 30, data)
    y += 4
    const totalsX = pageWidth - MARGIN - 3
    const labelsX = pageWidth - MARGIN - 45

    doc.setFontSize(10)
    doc.text('Subtotal:', labelsX, y, {align: 'right'})
    doc.text(`$${data.subtotal.toFixed(2)}`, totalsX, y, {align: 'right'})

    y += 6
    doc.text(`Tax (${data.tax_rate}%):`, labelsX, y, {align: 'right'})
    doc.text(`$${data.taxAmount.toFixed(2)}`, totalsX, y, {align: 'right'})

    y += 3
    doc.setDrawColor(200, 200, 200)
    doc.line(labelsX - 15, y, pageWidth - MARGIN, y)

    y += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Total:', labelsX, y, {align: 'right'})
    doc.text(`$${data.total.toFixed(2)}`, totalsX, y, {align: 'right'})

    // --- Notes ---
    if (data.notes) {
        y += 16
        y = checkPageBreak(doc, y, 20, data)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes', MARGIN, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const noteLines = doc.splitTextToSize(data.notes, contentWidth)
        doc.text(noteLines, MARGIN, y)
    }

    doc.save(`invoice-${data.invoice_number || 'draft'}.pdf`)
}