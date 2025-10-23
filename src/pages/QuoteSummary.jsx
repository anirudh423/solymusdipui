import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import '../styles/QuoteSummary.css'

function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

const sampleQuote = {
  policyNumber: 'QS-2025-0001',
  holder: 'Jonathan Sterling',
  product: 'Bespoke Classic Auto — Platinum',
  premium: 1298.5,
  coverages: [
    { name: 'Collision', amount: 50000, description: 'Covers damage to your vehicle from collisions with other vehicles or objects.' },
    { name: 'Comprehensive', amount: 30000, description: 'Covers non-collision events such as theft, fire, or natural disasters.' },
    { name: 'Liability', amount: 1000000, description: 'Protects you against claims from third parties for bodily injury or property damage.' },
  ],
  term: '12 months',
  summary: 'A curated policy designed for drivers who demand discretion and exceptional service.'
}

export default function QuoteSummary() {
  let quote = sampleQuote
  try {
    const raw = localStorage.getItem('quote')
    if (raw) quote = JSON.parse(raw)
  } catch (e) {
  }

  const [openDetails, setOpenDetails] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [expanded, setExpanded] = useState(-1)
  const [liveMessage, setLiveMessage] = useState('')
  const highlights = ['Fast quote', '24/7 Support', 'Tailored Coverage']
  const modalRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 180)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const items = document.querySelectorAll('.coverage-item')
    if (!items || items.length === 0) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    items.forEach((it) => obs.observe(it))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const node = document.querySelector('.qs-hero-art')
    if (!node) return
    function onScroll() {
      const rect = node.getBoundingClientRect()
      const val = (window.innerHeight / 2 - rect.top) * 0.04
      node.style.transform = `translateY(${val}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!showModal) return
    const node = modalRef.current
    const focusable = node ? node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') : []
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const prevActive = document.activeElement
    if (first) first.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        setShowModal(false)
        return
      }
      if (e.key === 'Tab') {
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prevActive && prevActive.focus) prevActive.focus()
    }
  }, [showModal])

  const navigate = useNavigate()

  function goToPurchase() {
    navigate('/policy-purchase', { state: { cart: quote } })
  }

  return (
    <div className="qs-root">
      <div className="film-grain" aria-hidden="true" />
      <nav className="qs-topbar">
        <div className="qs-logo foil">
          <span className="wordmark" aria-hidden>
            <svg width="156" height="28" viewBox="0 0 260 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false"><defs><linearGradient id="gword" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#f6e3b8" /><stop offset="48%" stop-color="#b78628" /><stop offset="100%" stop-color="#f2d78a" /></linearGradient></defs><text x="0" y="34" font-family="Playfair Display, serif" font-weight="700" font-size="36" fill="url(#gword)">Solymus</text></svg>
          </span>
          <span className="top-monogram" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="17" stroke="rgba(183,134,40,0.12)" strokeWidth="1.6" fill="none" /><text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="14" fill="rgba(183,134,40,0.9)">S</text></svg>
          </span>
        </div>

        <div className="qs-nav-actions">
          <Link to="/" className="qs-link">Home</Link>

          <Link to="/admin/login" className="qs-admin-btn" title="Admin sign in" aria-label="Admin sign in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" className="admin-lock-icon">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z" fill="currentColor" />
            </svg>
            Admin
          </Link>
        </div>
      </nav>

      <div className="qs-corner-ornament" aria-hidden>
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="80" cy="80" r="78" stroke="rgba(46,196,182,0.04)" stroke-width="2" /></svg>
      </div>

      <section className="qs-hero">
        <div className="qs-hero-inner">
          <div className="qs-hero-grid">
            <div className="qs-hero-copy">
              <div className="badge">Quote</div>
              <h1 className="qs-title foil">Quote Summary
                <span className="title-flair" aria-hidden>
                  <svg width="84" height="12" viewBox="0 0 84 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="4" width="84" height="4" rx="2" fill="url(#g)" /></svg>
                </span>
              </h1>
              <blockquote className="hero-pull">"Elegance is not about being noticed, it's about being remembered."</blockquote>
              <p className="qs-sub">A distilled review of your policy — precision, clarity, and elegance. Crafted for those who appreciate restraint and impact.</p>
              <div className="qs-highlights" aria-hidden>
                {highlights.map((h, idx) => (
                  <span key={idx} className="highlight-chip">{h}</span>
                ))}
              </div>
              <nav className="qs-breadcrumb" aria-label="Breadcrumb">
                <ol>
                  <li><Link to="/">Home</Link></li>
                  <li>Quotes</li>
                  <li aria-current="page">Summary</li>
                </ol>
              </nav>
              <div className="hero-cta">
                <button className="btn-primary" onClick={() => window.scrollTo({ top: 420, behavior: 'smooth' })}>Review Coverages</button>
                <button className="btn-outline" onClick={() => window.print()}>Print Summary</button>
              </div>
            </div>
            <div className="qs-hero-art" aria-hidden>
              <div className="hero-photo" role="img" aria-label="Hero background image" />
            </div>
          </div>
        </div>
      </section>

      <main className="qs-content">
        <div className="qs-panel" role="region" aria-labelledby="qs-title">
          <svg className="panel-watermark" aria-hidden="true" width="340" height="340" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="200" fill="rgba(183,134,40,0.04)">S</text></svg>
          <svg className="panel-filigree" aria-hidden="true" width="220" height="46" viewBox="0 0 220 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 22c34-18 64-18 108-2 24 10 48 14 72 4" stroke="rgba(183,134,40,0.08)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>

          <div className="qs-ribbon">Recommended</div>
          <div className="qs-monogram" aria-hidden="true">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="120" fill="rgba(183,134,40,0.07)">S</text></svg>
          </div>
          <header className="panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="policy-stamp" aria-hidden>Approved</div>
                <svg className="gold-seal" aria-hidden width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="rgba(183,134,40,0.12)" /><circle cx="22" cy="22" r="12" fill="rgba(183,134,40,0.18)" /><text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="12" fill="rgba(183,134,40,0.95)">✓</text></svg>
              </div>
              <div className="muted">Policy</div>
              <div className="policy-id">{quote.policyNumber}</div>
              <div className="product">{quote.product}</div>
              <div className="meta-row">
                <div className="meta-item"><span className="meta-key">Term:</span> {quote.term}</div>
                <div className="meta-item"><span className="meta-key">Holder:</span> {quote.holder}</div>
                <div className="meta-item"><span className="meta-key">Ref:</span> {quote.policyNumber.split('-').pop()}</div>
                <div className="meta-item"><span className="meta-key">Prepared:</span> {new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="premium">
              <div className="muted">Estimated Premium</div>
              <div className="price">
                {formatCurrency(quote.premium)}
                <button className="price-info" aria-describedby="price-tooltip-header" aria-label="What this premium includes">ⓘ</button>
                <div id="price-tooltip-header" role="tooltip" className="tooltip">Includes coverages listed, applicable taxes and fees, and standard service charges. Final amount shown at purchase.</div>
              </div>
            </div>
          </header>

          <section className="panel-body">
            <h3 className="section-title">Holder</h3>
            <p className="holder">{quote.holder}</p>

            <div className="exec-note" role="note">
              <strong>Executive note:</strong> This package balances comprehensive third-party protection with discretionary coverages — ideal for clients seeking peace of mind without excess.
            </div>

            <h3 className="section-title">Coverages</h3>
            <ul className="coverages">
              {quote.coverages.map((c, i) => (
                <li key={i} className={`coverage-item ${revealed ? 'revealed' : ''} ${expanded === i ? 'open' : ''}`} onClick={() => { setExpanded(expanded === i ? -1 : i); setLiveMessage(expanded === i ? `${c.name} collapsed` : `${c.name} expanded`) }} role="button" tabIndex={0} aria-expanded={expanded === i} aria-controls={`coverage-desc-${i}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setExpanded(expanded === i ? -1 : i); setLiveMessage(expanded === i ? `${c.name} collapsed` : `${c.name} expanded`) } }}>
                  <div className="cov-left">
                    {c.name.toLowerCase().includes('collision') && (
                      <svg className="cov-icon" width="28" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13l2-5h11l2 5" stroke="#2ec4b6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 18h14v2H5z" fill="#2ec4b6" opacity="0.12" /></svg>
                    )}
                    {c.name.toLowerCase().includes('comprehensive') && (
                      <svg className="cov-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="#2ec4b6" strokeWidth="1.6" /><path d="M8 12h8" stroke="#2ec4b6" strokeWidth="1.6" strokeLinecap="round" /></svg>
                    )}
                    {c.name.toLowerCase().includes('liability') && (
                      <svg className="cov-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 6 6 .5-4.5 3.8L18 20l-6-3-6 3 .5-7.7L2 8.5 8 8 12 2z" stroke="#2ec4b6" strokeWidth="1" fill="none" /></svg>
                    )}
                  </div>
                  <div className="cov-main">
                    <div className="cov-name">{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="cov-amt">{formatCurrency(c.amount)}</div>
                      <svg className={`cov-chevron ${expanded === i ? 'rot' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="#0b6b66" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  <div id={`coverage-desc-${i}`} className="cov-desc">{c.description}</div>
                </li>
              ))}
            </ul>

            <h3 className="section-title">Summary</h3>
            <p className="summary">{quote.summary}</p>
            <button className="details-toggle" onClick={() => setOpenDetails((s) => !s)} aria-expanded={openDetails} aria-controls="details">Why this quote?</button>
            <div id="details" className={`details-content ${openDetails ? 'open' : ''}`}>
              <p>This quote reflects the selected limits and the underwriting factors provided. It balances comprehensive protection with competitive pricing — curated for discerning clients seeking clarity and minimal friction.</p>
            </div>
          </section>

          <footer className="panel-footer">
            <div className="term">Term: {quote.term}</div>
            <div className="actions">
              <button className="btn-outline" onClick={() => window.print()}>Download / Print</button>
              <button className="btn-outline" onClick={() => setShowModal(true)}>Proceed to Purchase</button>
            </div>
          </footer>
        </div>
      </main>
      {showModal && (
        <div className="qs-modal" role="dialog" aria-modal="true">
          <div className="qs-modal-inner" ref={modalRef}>
            <h3>Confirm Purchase</h3>
            <p>You're about to purchase the policy for {quote.holder} at {formatCurrency(quote.premium)}.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <div className="btn-primary" onClick={() => { setShowModal(false); goToPurchase(); }}>
                Confirm & Pay
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="qs-signature">
        <div className="sig-left">
          <div className="sig-name">Solymus Insurance</div>
          <div className="sig-title">Client Services</div>
        </div>
        <div className="sig-right">
          <div className="sig-sig">Jonathan Sterling</div>
          <div className="sig-role">Policyholder</div>
        </div>
        <svg className="sig-flourish" width="160" height="36" viewBox="0 0 160 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 24c28-18 60-18 92-2 20 10 40 14 60 4" stroke="#2ec4b6" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.12" />
        </svg>
      </div>
      <div className="qs-sticky" aria-hidden>
        <div className="qs-sticky-inner">
          <div className="sticky-price">{formatCurrency(quote.premium)} <button className="price-info" aria-describedby="price-tooltip-sticky" aria-label="What this premium includes">ⓘ</button>
            <div id="price-tooltip-sticky" role="tooltip" className="tooltip">Includes coverages listed, applicable taxes and fees, and standard service charges. Final amount shown at purchase.</div>
          </div>
          <div className="sticky-actions">
            <button className="btn-outline" onClick={() => window.print()}>Print</button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>Buy Now</button>
          </div>
        </div>
      </div>
      <div aria-live="polite" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>{liveMessage}</div>
    </div>
  )
}
