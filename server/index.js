import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import PDFDocument from 'pdfkit'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' }) : null

app.post('/create-checkout-session', async (req, res) => {
    const { amount = 1000, currency = 'usd', product = 'Policy' } = req.body || {}
    if (!stripe) return res.status(200).json({ url: null, message: 'Stripe not configured' })
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price_data: { currency, product_data: { name: product }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?checkout=success`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?checkout=cancel`,
        })
        res.json({ url: session.url })
    } catch (err) {
        res.status(500).json({ error: String(err) })
    }
})

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const payload = req.body
    const sig = req.headers['stripe-signature']
    if (stripe && process.env.STRIPE_WEBHOOK_SECRET && sig) {
        try {
            const event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object
                const policy = { policyId: 'POL_' + Math.random().toString(36).slice(2, 10), sessionId: session.id, created: new Date().toISOString() }
                const file = path.join(process.cwd(), 'server', 'issued_policies.json')
                let current = []
                try { current = JSON.parse(fs.readFileSync(file, 'utf8') || '[]') } catch (e) { }
                current.push(policy)
                fs.writeFileSync(file, JSON.stringify(current, null, 2))
            }
            res.json({ received: true })
        } catch (err) {
            console.error('Webhook signature verification failed', err.message)
            res.status(400).send(`Webhook Error: ${err.message}`)
        }
    } else {
        try { fs.writeFileSync(path.join(process.cwd(), 'server', 'last_webhook.json'), payload ? payload.toString() : '{}') } catch (e) { }
        res.json({ received: true, note: 'signature not verified (dev mode)' })
    }
})

app.post('/policies', (req, res) => {
    const { paymentId, plan = 'personal', holder = 'Unknown', product = 'Policy', financing = null } = req.body || {}
    const policy = { policyId: 'POL_' + Math.random().toString(36).slice(2, 10), paymentId, plan, holder, product, financing, issuedAt: new Date().toISOString() }
    const file = path.join(process.cwd(), 'server', 'issued_policies.json')
    let current = []
    try { current = JSON.parse(fs.readFileSync(file, 'utf8') || '[]') } catch (e) { }
    current.push(policy)
    fs.writeFileSync(file, JSON.stringify(current, null, 2))
    res.json({ success: true, policy })
})

app.get('/receipt/:policyId', (req, res) => {
    const { policyId } = req.params
    const file = path.join(process.cwd(), 'server', 'issued_policies.json')
    let current = []
    try { current = JSON.parse(fs.readFileSync(file, 'utf8') || '[]') } catch (e) { }
    const policy = current.find(p => p.policyId === policyId) || { policyId, issuedAt: new Date().toISOString(), product: 'Policy' }
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${policyId}.pdf`)
    doc.fontSize(22).fillColor('#0b8f8b').text('Solymus', { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(12).fillColor('#233333').text(`Receipt — Policy ${policy.policyId}`)
    doc.moveDown()
    doc.fontSize(10).fillColor('#556').text(`Issued: ${policy.issuedAt}`)
    doc.moveDown()
    doc.fontSize(12).fillColor('#000').text(`Product: ${policy.product || 'Policy'}`)
    if (policy.holder) doc.text(`Holder: ${policy.holder}`)
    doc.moveDown()
    if (policy.financing) {
        doc.fontSize(11).fillColor('#0b6b58').text('Financing')
        doc.fontSize(10).fillColor('#333').text(`Months: ${policy.financing.months || 12}`)
        doc.text(`Monthly: $${policy.financing.monthly}`)
        doc.text(`Total: $${policy.financing.total}`)
        doc.moveDown()
    }
    doc.moveDown()
    doc.fontSize(11).text('Coverages', { underline: true })
    if (policy.coverages && policy.coverages.length) {
        policy.coverages.forEach(c => {
            doc.text(`${c.name} — $${c.amount}`)
        })
    } else {
        doc.text('Standard coverage package')
    }
    doc.moveDown(2)
    doc.text('Thank you for choosing Solymus. For policy details visit your account or contact support.')
    doc.end()
    doc.pipe(res)
})

const PORT = process.env.PORT || 4242
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
