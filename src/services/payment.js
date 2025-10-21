export async function initiatePayment({ amount, currency = 'USD', method = 'card', product = 'Policy', financingPct = 0 }) {
    const serverUrl = import.meta.env.VITE_PAYMENT_SERVER || 'http://localhost:4242'
    try {
        const resp = await fetch(`${serverUrl.replace(/\/$/, '')}/create-checkout-session`, {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount, currency: currency.toLowerCase(), product })
        })
        if (!resp.ok) throw new Error('Server checkout failed')
        const data = await resp.json()
        return { success: true, checkoutUrl: data.url }
    } catch (err) {
        await new Promise((r) => setTimeout(r, 600))
        const paymentId = 'PAY_' + Date.now()
        const installments = financingPct > 0 ? {
            months: 12,
            monthly: Number(((amount * (1 + financingPct / 100)) / 12).toFixed(2)),
            total: Number((amount * (1 + financingPct / 100)).toFixed(2))
        } : null
        return { success: true, paymentId, installments }
    }
}

export default { initiatePayment }
