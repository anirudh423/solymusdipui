import jsPDF from 'jspdf'

export function generateReceiptPDF({ policyId, holder, product, premium, date }) {
    const doc = new jsPDF({ orientation: 'portrait' })
    doc.setFont('Times', 'Normal')
    doc.setFontSize(20)
    doc.text('Solymus Insurance', 20, 30)
    doc.setFontSize(12)
    doc.text(`Policy ID: ${policyId}`, 20, 50)
    doc.text(`Holder: ${holder}`, 20, 60)
    doc.text(`Product: ${product}`, 20, 70)
    doc.text(`Premium: $${premium}`, 20, 80)
    doc.text(`Issued: ${new Date(date).toLocaleString()}`, 20, 90)
    return doc
}
