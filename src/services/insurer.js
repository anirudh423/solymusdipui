export async function createPolicy({ paymentId, plan = 'personal', financing = null, holder = null, product = 'Policy' }) {
    const serverUrl = import.meta.env.VITE_PAYMENT_SERVER || 'http://localhost:4242'
    try {
        const resp = await fetch(`${serverUrl.replace(/\/$/, '')}/policies`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paymentId, plan, financing, holder, product }) })
        if (!resp.ok) throw new Error('Insurer server error')
        const data = await resp.json()
        return { success: true, policyId: data.policy.policyId, policy: data.policy }
    } catch (e) {
        await new Promise((r) => setTimeout(r, 500))
        const policyId = 'POL_' + Math.random().toString(36).slice(2, 10)
        return { success: true, policyId, plan, financing }
    }
}

export default { createPolicy }
