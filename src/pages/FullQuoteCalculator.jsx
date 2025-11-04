

import React, { useEffect, useRef, useState } from 'react';

export default function FullQuoteCalculator() {
    const [form, setForm] = useState({
        fullName: '',
        age: '',
        gender: 'female',
        sumInsured: '500000',
        plan: 'gold',
        deductible: '0',
        smoker: false,
        preExistingYears: 0,
        addons: {
            maternity: false,
            criticalIllness: false,
            opd: false,
        },
        startDate: '',
    });

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [lastFetchFailed, setLastFetchFailed] = useState(false);
    const rafRef = useRef(null);
    const [animatedValue, setAnimatedValue] = useState(0);
    const [pricingFile, setPricingFile] = useState(null);
    const [excelStatus, setExcelStatus] = useState('No pricing file loaded');

    useEffect(() => {
        const id = 'full-quote-calculator-styles';
        if (!document.getElementById(id)) {
            const s = document.createElement('style');
            s.id = id;
            s.innerHTML = styles;
            document.head.appendChild(s);
        }
        return () => {
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    function formatINR(n) {
        try { return Number(n).toLocaleString('en-IN'); } catch { return n; }
    }

    function animateNumber(to, duration = 900) {
        cancelAnimationFrame(rafRef.current);
        const start = performance.now();
        const from = animatedValue || 0;
        function step(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = Math.round(from + (to - from) * eased);
            setAnimatedValue(val);
            if (t < 1) rafRef.current = requestAnimationFrame(step);
        }
        rafRef.current = requestAnimationFrame(step);
    }

    function validate() {
        setError(null);
        if (!form.fullName.trim()) return 'Enter your full name';
        const age = parseInt(form.age, 10);
        if (!age || age < 18 || age > 100) return 'Enter an age between 18 and 100';
        if (!['500000', '1000000', '2000000', '5000000'].includes(form.sumInsured)) return 'Choose a valid sum insured';
        return null;
    }

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const v = validate();
        if (v) { setError(v); return; }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setLastFetchFailed(false);

        const payload = {
            applicant: {
                name: form.fullName,
                age: Number(form.age),
                gender: form.gender,
                smoker: !!form.smoker,
                preExistingYears: Number(form.preExistingYears),
            },
            plan: form.plan,
            sumInsured: Number(form.sumInsured),
            deductible: Number(form.deductible),
            addons: form.addons,
            startDate: form.startDate,
            meta: { source: 'ui-v5' }
        };

        try {
            const res = await fetch('/api/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setResult(data);
            animateNumber(data.premium || 0, 1000);
            setIsLoading(false);
        } catch (err) {
            console.warn('Primary fetch failed:', err);
            setLastFetchFailed(true);
            try {
                const fallback = await fallbackEngine(payload);
                setResult(fallback);
                animateNumber(fallback.premium || 0, 1000);
            } catch (err2) {
                setError('Unable to compute quote: ' + (err2.message || err2));
            }
            setIsLoading(false);
        }
    }

    async function fallbackEngine(payload) {
        if (pricingFile) {
            try {
                setExcelStatus('Parsing pricing file...');
                const XLSX = await import('xlsx');
                const arrayBuffer = await pricingFile.arrayBuffer();
                const wb = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = wb.SheetNames[0];
                const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                setExcelStatus('Pricing file loaded (' + sheetName + ')');
                const age = payload.applicant.age;
                const si = payload.sumInsured;
                const baseRow = json.find(r => age >= (r.ageMin || 0) && age <= (r.ageMax || 200)) || json[0];
                const base = Number(baseRow.base || 2000);
                const siMult = Number(baseRow.siMultiplier || 1) * (si / 100000);
                const smokerAdd = payload.applicant.smoker ? (Number(baseRow.smoker || 1.2)) : 1;
                const planMult = Number(baseRow[`${payload.plan}Multiplier`] || baseRow.planMultiplier || 1);
                let premium = Math.round(base * siMult * smokerAdd * planMult);

                const addons = [];
                if (payload.addons.maternity) { premium += 500; addons.push({ label: 'Maternity rider', amount: 500 }); }
                if (payload.addons.criticalIllness) { premium += 850; addons.push({ label: 'Critical Illness', amount: 850 }); }
                if (payload.addons.opd) { premium += 150; addons.push({ label: 'OPD cover', amount: 150 }); }

                const breakdown = [
                    { label: 'Base premium', amount: Math.round(base * siMult * planMult) },
                    ...(payload.applicant.smoker ? [{ label: 'Smoker load', amount: Math.round((premium - (base * siMult * planMult))) }] : []),
                    ...addons
                ];

                return { premium, breakdown, notes: 'Calculated from uploaded pricing sheet' };
            } catch (err) {
                console.warn('Excel fallback failed', err);
                throw err;
            }
        }

        const age = payload.applicant.age;
        const base = 2200;
        const ageFactor = Math.max(0, (age - 25) * 30);
        const siFactor = Math.max(1, payload.sumInsured / 100000);
        let premium = Math.round((base + ageFactor) * siFactor);
        const planMults = { silver: 0.95, gold: 1, platinum: 1.28 };
        premium = Math.round(premium * (planMults[payload.plan] || 1));
        if (payload.applicant.smoker) premium = Math.round(premium * 1.18);
        if (payload.deductible >= 5000) premium = Math.round(premium * 0.88);

        const breakdown = [
            { label: 'Base calculation', amount: Math.round(base + ageFactor) },
            { label: `Sum insured factor x${siFactor.toFixed(2)}`, amount: Math.round((base + ageFactor) * siFactor) },
            ...(payload.applicant.smoker ? [{ label: 'Smoker loading', amount: Math.round(Math.round((base + ageFactor) * siFactor) * 0.18) }] : []),
            (payload.deductible >= 5000) ? [{ label: 'High deductible adjustment', amount: Math.round(-premium * 0.12) }] : []
        ].flat();

        if (payload.addons.maternity) { premium += 600; breakdown.push({ label: 'Maternity rider', amount: 600 }); }
        if (payload.addons.criticalIllness) { premium += 900; breakdown.push({ label: 'Critical illness rider', amount: 900 }); }
        if (payload.addons.opd) { premium += 200; breakdown.push({ label: 'OPD rider', amount: 200 }); }

        return { premium, breakdown, notes: 'Calculated with client fallback rules' };
    }

    function handleFile(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return setPricingFile(null);
        setPricingFile(file);
        setExcelStatus('File selected: ' + file.name);
    }

    return (
        <div className="lp-root full-quote-root" aria-labelledby="quote-page-title">
            <div className="lp-wrap">
                <header className="site-header">
                    <div className="brand">
                        <div className="logo-crest" aria-hidden> S </div>
                        <div>
                            <div className="brand-title">Solymus — Full quote</div>
                            <div className="brand-sub">Deep quote engine • upload pricing sheet as fallback</div>
                        </div>
                    </div>
                    <nav className="top-nav" aria-label="primary navigation">
                        <a href="/">Home</a>
                        <a href="/quote" className="buy">Full Quote</a>
                        <a href="/hospitals">Hospitals</a>
                    </nav>
                </header>

                <main className="main-content" id="quote-page">
                    <section className="hero-section">
                        <div className="hero-left">
                            <div className="strap">FULL CALCULATOR</div>
                            <h1 id="quote-page-title" className="headline">Get an exact premium — powered by your pricing rules.</h1>
                            <p className="lead">This calculator will call your backend pricing engine (recommended). If your backend is unavailable, upload an Excel pricing sheet or use client fallback rules.</p>

                            <form className="quote-form" onSubmit={handleSubmit} noValidate>
                                <div className="form-field">
                                    <label className="label">Full name</label>
                                    <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" aria-label="Full name" />
                                </div>

                                <div className="two-col">
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label className="label">Age</label>
                                        <input type="number" min="18" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" />
                                    </div>

                                    <div className="form-field" style={{ width: 160 }}>
                                        <label className="label">Gender</label>
                                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                            <option value="female">Female</option>
                                            <option value="male">Male</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="two-col" style={{ marginTop: 12 }}>
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label className="label">Sum insured</label>
                                        <select value={form.sumInsured} onChange={(e) => setForm({ ...form, sumInsured: e.target.value })}>
                                            <option value="500000">₹5,00,000</option>
                                            <option value="1000000">₹10,00,000</option>
                                            <option value="2000000">₹20,00,000</option>
                                            <option value="5000000">₹50,00,000</option>
                                        </select>
                                    </div>

                                    <div className="form-field" style={{ width: 160 }}>
                                        <label className="label">Plan</label>
                                        <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                                            <option value="silver">Silver</option>
                                            <option value="gold">Gold</option>
                                            <option value="platinum">Platinum</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="two-col" style={{ marginTop: 12 }}>
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label className="label">Deductible (optional)</label>
                                        <select value={form.deductible} onChange={(e) => setForm({ ...form, deductible: e.target.value })}>
                                            <option value="0">No deductible</option>
                                            <option value="5000">₹5,000</option>
                                            <option value="10000">₹10,000</option>
                                        </select>
                                    </div>

                                    <div className="form-field" style={{ width: 160 }}>
                                        <label className="label">Smoker</label>
                                        <div>
                                            <label style={{ fontWeight: 800 }}>
                                                <input type="checkbox" checked={form.smoker} onChange={(e) => setForm({ ...form, smoker: e.target.checked })} /> Smoker
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12 }} className="label">Add-ons</div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                    <label style={{ fontWeight: 800 }}><input type="checkbox" checked={form.addons.maternity} onChange={(e) => setForm({ ...form, addons: { ...form.addons, maternity: e.target.checked } })} /> Maternity</label>
                                    <label style={{ fontWeight: 800 }}><input type="checkbox" checked={form.addons.criticalIllness} onChange={(e) => setForm({ ...form, addons: { ...form.addons, criticalIllness: e.target.checked } })} /> Critical Illness</label>
                                    <label style={{ fontWeight: 800 }}><input type="checkbox" checked={form.addons.opd} onChange={(e) => setForm({ ...form, addons: { ...form.addons, opd: e.target.checked } })} /> OPD</label>
                                </div>

                                <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <button className="btn-cta" type="submit" disabled={isLoading} aria-busy={isLoading}>{isLoading ? 'Calculating…' : 'Calculate premium'}</button>
                                    <button type="button" className="btn-ghost" onClick={() => { setForm({ fullName: '', age: '', gender: 'female', sumInsured: '500000', plan: 'gold', deductible: '0', smoker: false, preExistingYears: 0, addons: { maternity: false, criticalIllness: false, opd: false }, startDate: '' }); setResult(null); setError(null); }}>Reset</button>
                                </div>

                                {error && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}

                                <div className="help-strip" style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Backend status: {lastFetchFailed ? 'Unavailable — using fallback' : 'Using /api/quote'}</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
                                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{excelStatus}</div>
                                    </div>
                                </div>
                            </form>

                            <div style={{ marginTop: 20 }}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>Notes</h3>
                            </div>
                        </div>

                        <aside className="hero-right">
                            <div className="quote-card">
                                <div className="quote-head">
                                    <div>
                                        <div className="small muted">Full calculation</div>
                                        <div className="quote-title">Detailed premium & breakdown</div>
                                    </div>
                                    <div className="pill">No obligation</div>
                                </div>

                                <div className="result-area" aria-live="polite">
                                    {isLoading && (
                                        <div className="skeleton-result"><div className="skeleton-line" /></div>
                                    )}

                                    {!isLoading && result && (
                                        <div className="result">
                                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Approx.</div>
                                            <div className="price" style={{ fontSize: 24 }}>₹{formatINR(animatedValue)}</div>
                                            <div className="period"> / month (approx)</div>
                                        </div>
                                    )}

                                    {!isLoading && !result && (
                                        <div className="muted small" style={{ marginTop: 8 }}>Enter details and click Calculate to see premium and breakdown.</div>
                                    )}

                                    {result && (
                                        <div style={{ marginTop: 12 }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    {Array.isArray(result.breakdown) && result.breakdown.map((b, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(8,10,12,0.03)' }}>
                                                            <td style={{ padding: '8px 6px', fontWeight: 800 }}>{b.label}</td>
                                                            <td style={{ padding: '8px 6px', textAlign: 'right' }}>₹{formatINR(b.amount)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td style={{ padding: '10px 6px', fontWeight: 900 }}>Estimated Premium</td>
                                                        <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 900 }}>₹{formatINR(result.premium)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            {result.notes && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>{result.notes}</div>}
                                        </div>
                                    )}

                                </div>

                                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Download</div>
                                    <div>
                                        <button className="btn-ghost" onClick={() => { if (!result) return; const payload = { inputs: form, result }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'quote.json'; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button>
                                    </div>
                                </div>

                            </div>

                            <div className="help-strip" style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Need a server sample? See the server code in this page (bottom).</div>
                            </div>
                        </aside>
                    </section>

                    <section className="features" style={{ marginTop: 40 }}>
                        <div className="feature">
                            <div className="feature-icon">🔍</div>
                            <div className="feature-title">Transparent breakdown</div>
                            <div className="feature-desc">Every load and multiplier appears in the breakdown — ideal for QA and compliance.</div>
                        </div>

                        <div className="feature">
                            <div className="feature-icon">🧾</div>
                            <div className="feature-title">Excel-driven rules</div>
                            <div className="feature-desc">Drop in a pricing workbook with age bands and multipliers; the client/server engine will use it as a source of truth.</div>
                        </div>

                        <div className="feature">
                            <div className="feature-icon">🛡️</div>
                            <div className="feature-title">Fallback safe rules</div>
                            <div className="feature-desc">If your backend is down, the UI will gracefully compute a reasonable estimate so sales ops don't stall.</div>
                        </div>
                    </section>

                    <hr style={{ marginTop: 40, border: 'none', borderTop: '1px solid rgba(8,10,12,0.03)' }} />

                    <section style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 900 }}>Server example</h3>


                        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Sample Excel schema: sheet with columns: ageMin, ageMax, base, siMultiplier, smoker, silverMultiplier, goldMultiplier, platinumMultiplier</div>
                    </section>

                </main>

                <footer className="site-footer" style={{ marginTop: 40 }}>
                    <div>
                        <div className="ft-name">Solymus</div>
                        <div className="ft-sub muted">© {new Date().getFullYear()} Solymus</div>
                    </div>
                    <div className="ft-links">
                        <a href="/terms">Terms</a>
                        <a href="/privacy">Privacy</a>
                    </div>
                </footer>

            </div>
        </div>
    );
}

const styles = `
:root{ --bg:#fffaf6; --text:#071022; --muted:#6b7280; --accent-1:#f6b73c; --accent-2:#f59e0b; --glass:rgba(10,12,14,0.04); --card-shadow:0 24px 60px rgba(9,11,12,0.06); --soft-shadow:0 12px 34px rgba(10,12,14,0.04); --radius:14px; --focus:0 0 0 4px rgba(246,183,60,0.12); --mono:ui-monospace,SFMono-Regular,Menlo,Monaco,"Roboto Mono","Segoe UI Mono" }
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial;background:var(--bg);color:var(--text)}
.lp-root{min-height:100vh;position:relative}
.lp-wrap{max-width:var(--maxw,1200px);margin:0 auto;padding:44px 28px}
.site-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.brand{display:flex;gap:12px;align-items:center}
.logo-crest{width:56px;height:56px;border-radius:12px;background:linear-gradient(90deg,var(--accent-1),var(--accent-2));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;box-shadow:var(--soft-shadow)}
.brand-title{font-weight:900}
.brand-sub{font-size:12px;color:var(--muted)}
.top-nav{display:flex;gap:16px;align-items:center}
.top-nav a{color:var(--muted);text-decoration:none;font-weight:700}
.top-nav .buy{padding:8px 12px;border-radius:12px;background:linear-gradient(90deg,var(--accent-1),var(--accent-2));color:#fff}
.hero-section{display:grid;grid-template-columns:1fr 420px;gap:40px;align-items:start;margin-top:18px}
.strap{display:inline-block;padding:6px 12px;border-radius:999px;background:linear-gradient(90deg,rgba(246,183,60,0.10),rgba(245,158,11,0.03));font-weight:800;color:var(--accent-1);font-size:12px;margin-bottom:12px}
.headline{font-size:40px;line-height:1.02;margin:6px 0 12px;font-weight:900;color:var(--text)}
.lead{color:var(--muted);font-size:15px;max-width:64ch;margin-bottom:18px}
.quote-card{border-radius:14px;padding:18px;background:linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.94));border:1px solid var(--glass);box-shadow:var(--card-shadow)}
.quote-head{display:flex;justify-content:space-between;align-items:center}
.pill{padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.04);font-weight:800;color:var(--muted)}
.quote-form .form-field{margin-top:12px}
.label{display:block;font-size:12px;color:var(--muted);font-weight:800;margin-bottom:6px}
.quote-form input, .quote-form select{width:100%;padding:12px;border-radius:10px;border:1px solid #eef2f6;background:#fff;font-size:14px}
.two-col{display:flex;gap:10px}
.form-error{margin-top:10px;padding:8px;border-radius:8px;background:rgba(139,31,31,0.04);color:#8b1f1f;font-weight:700}
.term-switch{display:flex;gap:8px;margin-top:12px}
.btn-cta{flex:1;padding:12px;border-radius:10px;font-weight:900;background:linear-gradient(90deg,var(--accent-1),var(--accent-2));color:#fff;border:none;cursor:pointer}
.btn-ghost{padding:12px;border-radius:10px;border:1px solid #eef2f6;background:white;color:var(--muted)}
.result-area{margin-top:12px;min-height:52px}
.result{display:inline-flex;align-items:baseline;gap:8px;padding:12px 14px;border-radius:12px;background:linear-gradient(90deg,rgba(246,183,60,0.06),rgba(245,158,11,0.02));border:1px solid rgba(245,158,11,0.06);font-weight:900}
.price{font-family:var(--mono);font-weight:900}
.period{font-weight:700;color:var(--muted);font-size:13px}
.help-strip{margin-top:10px;padding:12px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.86));border:1px solid rgba(8,10,12,0.04);display:flex;justify-content:space-between;align-items:center}
.feature{padding:22px;border-radius:12px;background:linear-gradient(180deg,#fff,#fff);border:1px solid var(--glass);box-shadow:var(--soft-shadow)}
@media(max-width:1000px){.hero-section{grid-template-columns:1fr;gap:22px}.hero-right{order:2}.hero-left{order:1}}
`;
