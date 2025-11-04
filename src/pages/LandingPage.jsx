import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";



export default function SolymusLandingLuxeV5() {
  const [quote, setQuote] = useState({ name: "", age: "", sumInsured: "500000" });
  const [quoteError, setQuoteError] = useState(null);
  const [quoteResult, setQuoteResult] = useState(null);
  const [term, setTerm] = useState("monthly");
  const [isCalculating, setIsCalculating] = useState(false);
  const rafRef = useRef(null);
  const pulseTimeout = useRef(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonialTick = useRef(null);
  const [testimonialAuto, setTestimonialAuto] = useState(true);
  const decorRef = useRef(null);

  const partners = [
    { id: 1, name: "Aureus Life", logo: "/images/partner-aureus.svg" },
    { id: 2, name: "Pioneer Gen", logo: "/images/partner-pioneer.svg" },
    { id: 3, name: "MediSure", logo: "/images/partner-medisure.svg" },
    { id: 4, name: "CareNet", logo: "/images/partner-carenet.svg" },
  ];

  const blogs = [
    { id: 1, title: "Understanding Health Insurance Basics", excerpt: "What a policy covers, what it doesn't, and what to watch for.", href: "/blog/understanding-health-insurance-basics" },
    { id: 2, title: "Top 10 Hospitals in Your City", excerpt: "A quick guide to network hospitals and cashless claims.", href: "/blog/top-hospitals" },
    { id: 3, title: "How to File a Claim", excerpt: "Step-by-step claim filing for faster settlements.", href: "/blog/how-to-file-a-claim" },
  ];

  const testimonials = [
    { id: 1, name: "Rina P.", text: "Solymus made buying a policy simple — fast quotes and friendly support.", role: "Product Designer" },
    { id: 2, name: "Aman K.", text: "Claims were settled quickly when needed most. Highly recommend.", role: "Teacher" },
    { id: 3, name: "Divya S.", text: "The claims concierge helped our family through a difficult time — empathetic and fast.", role: "Engineer" },
  ];

  useEffect(() => {
    const id = "solymus-landing-luxe-v5-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.innerHTML = styles;
      document.head.appendChild(s);
    }

    testimonialTick.current = setInterval(() => {
      if (testimonialAuto) setTestimonialIndex(i => (i + 1) % testimonials.length);
    }, 5000);

    function onKey(e) {
      if (e.key === "ArrowLeft") setTerm("monthly");
      if (e.key === "ArrowRight") setTerm("annual");
      if (e.key.toLowerCase() === "t") setTestimonialAuto(a => !a);
    }
    window.addEventListener("keydown", onKey);

    function onMove(e) {
      const el = decorRef.current;
      if (!el) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(pulseTimeout.current);
      clearInterval(testimonialTick.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  function animateNumber(target, duration = 900, onFrame) {
    const start = performance.now();
    const from = 0;
    function step(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (target - from) * eased);
      onFrame(val);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }

  function formatINR(n) {
    return n.toLocaleString("en-IN");
  }

  function handleQuoteSubmit(e) {
    e.preventDefault();
    setQuoteError(null);
    setQuoteResult(null);

    if (!quote.name.trim()) {
      setQuoteError("Please enter your name.");
      document.querySelector('input[aria-label="Full name"]')?.focus();
      return;
    }
    const age = parseInt(quote.age, 10);
    if (!age || age < 18 || age > 100) {
      setQuoteError("Enter a valid age (18–100).");
      document.querySelector('input[aria-label="Age"]')?.focus();
      return;
    }

    setIsCalculating(true);
    setQuoteResult(null);

    setTimeout(() => {
      const base = 2500;
      const ageFactor = Math.max(0, (age - 25) * 25);
      const siFactor = Math.max(1, parseInt(quote.sumInsured, 10) / 100000);
      let premium = Math.round((base + ageFactor) * siFactor);
      if (term === "annual") premium = Math.round(premium * 10);

      animateNumber(premium, 1100, (val) => setQuoteResult({ premium: val }));
      setIsCalculating(false);

      pulseTimeout.current = setTimeout(() => {
        const el = document.querySelector(".luxe-result");
        if (el) {
          const shimmer = el.querySelector(".price-shimmer");
          if (shimmer) {
            shimmer.style.opacity = "1";
            shimmer.style.animation = "priceShine 1.1s ease .12s 1";
            setTimeout(() => {
              shimmer.style.opacity = "0";
              shimmer.style.animation = "";
            }, 1500);
          }
          el.classList.add("luxe-result-pulse");
          setTimeout(() => el.classList.remove("luxe-result-pulse"), 1200);
        }
      }, 700);
    }, 520);
  }

  function scrollToQuote() {
    const el = document.getElementById("quote-panel") || document.querySelector("#quote");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="luxe-root v5" aria-labelledby="luxe-hero-title">

      <div className="hero-foil" aria-hidden>
        <svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" className="foil-svg" ref={decorRef}>
          <defs>
            <linearGradient id="gGold" x1="0" x2="1">
              <stop offset="0" stopColor="#f9d48a" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" result="b"/>
              <feBlend in="SourceGraphic" in2="b"/>
            </filter>
          </defs>
          <g filter="url(#softBlur)" opacity="0.9">
            <path d="M0 120 C180 20, 360 10, 600 70 C840 130, 980 220, 1200 160 L1200 360 L0 360 Z" fill="url(#gGold)" opacity="0.14"/>
            <path d="M0 180 C160 120, 360 60, 600 110 C840 160, 980 260, 1200 220 L1200 360 L0 360 Z" fill="url(#gGold)" opacity="0.06"/>
          </g>
        </svg>
      </div>

      <div className="luxe-container" id="main">
        <TopBar />

        <main className="luxe-main">
          <section className="luxe-hero">
            <div className="lh-left">
              <div className="lh-strap" aria-hidden>CONFIDENCE · CLARITY · CARE</div>

              <h1 id="luxe-hero-title" className="lh-title">
                Protect what matters — <span className="lh-accent">intentional, elegant protection</span>.
              </h1>

              <p className="lh-lead">A modern underwriting engine paired with concierge support and a nationwide cashless network. Instant-ish quotes, curated plans, and claims handled like people — not processes.</p>

              <div className="lh-ctas" role="region" aria-label="Primary actions">
                <a className="btn-primary" href="/quote-summary">Buy Policy</a>
                <a className="btn-ghost" href="#quote">Get Quote</a>
                <a className="btn-ghost" href="/hospitals">Find Hospital</a>
              </div>

              <div className="lh-trust" aria-hidden>
                <div className="trust-label">Trusted by</div>
                <PartnerMarquee partners={partners} />
                <div className="trust-badges">
                  <span className="trust-pill">IRDAI registered</span>
                  <span className="trust-pill">ISO 27001</span>
                  <span className="trust-pill">24/7 claims</span>
                </div>
              </div>
            </div>

            <aside className="lh-right" id="quote" aria-labelledby="quote-title">
              <div id="quote-panel" className="quote-card" role="region" aria-labelledby="quote-title">
                <div className="quote-head">
                  <div>
                    <div className="muted small">Quick Quote</div>
                    <div id="quote-title" className="quote-title">Estimate in seconds</div>
                  </div>
                  <div className="pill">No obligation</div>
                </div>

                <form className="quote-form" onSubmit={handleQuoteSubmit} noValidate>
                  <label className="field">
                    <span className="label">Full name</span>
                    <input
                      aria-label="Full name"
                      value={quote.name}
                      onChange={(e) => setQuote({ ...quote, name: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </label>

                  <div className="two-up">
                    <label className="field">
                      <span className="label">Age</span>
                      <input
                        type="number"
                        min="18"
                        max="100"
                        aria-label="Age"
                        value={quote.age}
                        onChange={(e) => setQuote({ ...quote, age: e.target.value })}
                        placeholder="Age"
                        required
                      />
                    </label>

                    <label className="field">
                      <span className="label">Sum insured</span>
                      <select aria-label="Sum insured" value={quote.sumInsured} onChange={(e) => setQuote({ ...quote, sumInsured: e.target.value })}>
                        <option value="500000">₹5,00,000</option>
                        <option value="1000000">₹10,00,000</option>
                        <option value="2000000">₹20,00,000</option>
                      </select>
                    </label>
                  </div>

                  {quoteError && <div className="form-error" role="alert">{quoteError}</div>}

                  <div className="term-row" role="tablist" aria-label="Payment term">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={term === "monthly"}
                      className={`term ${term === "monthly" ? "active" : ""}`}
                      onClick={() => setTerm("monthly")}
                    >Monthly</button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={term === "annual"}
                      className={`term ${term === "annual" ? "active" : ""}`}
                      onClick={() => setTerm("annual")}
                    >Annual</button>
                  </div>

                  <div className="actions-row">
                    <button className="estimate-btn" type="submit" disabled={isCalculating} aria-busy={isCalculating}>
                      {isCalculating ? "Calculating…" : "Estimate"}
                    </button>
                    <a className="buy-small" href="/buy">Buy now</a>
                  </div>

                  

                  <div className="result-area" aria-live="polite" aria-atomic="true">
                    {isCalculating && !quoteResult && (
                      <div className="skeleton-result" aria-hidden>
                        <div className="skeleton-line" />
                      </div>
                    )}

                    {!isCalculating && quoteResult && (
                      <div className="luxe-result" role="status" aria-live="polite">
                        Approx.
                        <div className="price-wrap">
                          <span className="luxe-price">₹{formatINR(quoteResult.premium)}</span>
                          <span className="luxe-period">{term === "monthly" ? " / month" : " / year (approx)"}</span>
                        </div>
                        <span className="price-shimmer" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="disclaimer muted">We never share your details — sample estimate only.</div>
                </form>
              </div>

              <div className="contact-strip">
                <div className="contact-ask">Prefer to speak with an advisor?</div>
                <a className="contact-phone" href="tel:+911234567890">+91 12345 67890</a>
              </div>
            </aside>
          </section>

          <section id="features" className="features">
            <Feature icon="🏥" title="Cashless Hospitalisation" desc="Access our nationwide cashless network across thousands of hospitals." />
            <Feature icon="⚡" title="Fast Claims" desc="Concierge-led claims with transparent timelines and status updates." />
            <Feature icon="🧩" title="Custom Plans" desc="Add maternity, OPD, critical illness and more to your base cover." />
          </section>

          <section id="blogs" className="blogs">
            <div className="blogs-main">
              <div className="section-head">
                <h2>Latest from our blog</h2>
                <a className="view-all" href="/blog">View all</a>
              </div>
              <div className="blogs-grid">
                {blogs.map(b => (
                  <article className="article-card" key={b.id}>
                    <div className="thumb" aria-hidden />
                    <a className="article-title" href={b.href}>{b.title}</a>
                    <p className="article-excerpt">{b.excerpt}</p>
                    <a className="read-link" href={b.href}>Read →</a>
                  </article>
                ))}
              </div>
            </div>

            <aside className="side-col" aria-label="Social proof">
              <div className="testimonial-card">
                <h3>Customer spotlight</h3>
                <div className="testimonial-rotator" aria-live="polite">
                  <div className="testimonial-copy">“{testimonials[testimonialIndex].text}”</div>
                  <div className="testimonial-meta"><strong>{testimonials[testimonialIndex].name}</strong> — {testimonials[testimonialIndex].role}</div>
                  <div className="rotator-controls" aria-hidden>
                    {testimonials.map((t, i) => (
                      <button key={t.id} className={`dot ${i === testimonialIndex ? "on" : ""}`} onClick={() => { setTestimonialIndex(i); setTestimonialAuto(false); }} aria-label={`Show testimonial ${i + 1}`} />
                    ))}
                  </div>
                </div>
                <div className="rotator-ctrls-visual">
                  <button className="rot-ctrl" onClick={() => { setTestimonialIndex((testimonialIndex - 1 + testimonials.length) % testimonials.length); setTestimonialAuto(false); }} aria-label="Previous testimonial">‹</button>
                  <button className="rot-ctrl" onClick={() => { setTestimonialIndex((testimonialIndex + 1) % testimonials.length); setTestimonialAuto(false); }} aria-label="Next testimonial">›</button>
                </div>
              </div>

              <div className="certs">
                <h3>Partners & Certifications</h3>
                <div className="cert-grid">
                  <div>IRDAI Registered</div>
                  <div>ISO 27001</div>
                  <div>PCI-DSS</div>
                  <div>GDPR Ready</div>
                </div>
              </div>
            </aside>
          </section>
        </main>

        <Footer />
      </div>

      <button className="fab-quote" aria-label="Get quote" onClick={scrollToQuote}>
        <span className="fab-icon" aria-hidden>✦</span> Get Quote
      </button>
    </div>
  );
}

function TopBar() {
  return (
    <div className="topbar" role="navigation" aria-label="Top bar">
      <div className="brand">
        <div className="crest" aria-hidden>S</div>
        <div className="brand-text">
          <div className="brand-title">Solymus</div>
          <div className="brand-sub">Insurance, human-first</div>
        </div>
      </div>

      <div className="top-actions">
        <a href="#features" className="link muted">Features</a>
        <a href="#quote" className="link muted">Quick quote</a>
        <a href="/buy" className="link cta">Buy Policy</a>
        <a href = '/admin/login' className="link cta">Login </a>
      </div>
    </div>
  );
}

function PartnerMarquee({ partners }) {
  return (
    <div className="partner-marquee" aria-hidden>
      <div className="marquee-track" role="presentation">
        <div className="marquee-group">
          {partners.concat(partners).map((p, i) => (
            <div key={`${p.id}-${i}`} className="marquee-item" title={p.name}><img src={p.logo} alt={p.name} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}
PartnerMarquee.propTypes = { partners: PropTypes.array };

function Feature({ icon, title, desc }) {
  return (
    <div className="feature" tabIndex={0} aria-label={title}>
      <div className="feature-icon" aria-hidden>{icon}</div>
      <div className="feature-title">{title}</div>
      <div className="feature-desc">{desc}</div>
    </div>
  );
}
Feature.propTypes = { icon: PropTypes.node, title: PropTypes.string, desc: PropTypes.string };

function Footer() {
  return (
    <footer className="luxe-footer" role="contentinfo">
      <div>
        <div className="footer-name">Solymus</div>
        <div className="footer-sub muted">© {new Date().getFullYear()} Solymus</div>
      </div>

      <div className="footer-links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
      </div>
    </footer>
  );
}

const styles = `
html, body { width: 100%; overflow-x: hidden; }

:root{
  --bg: #fff8f3;
  --text: #071022;
  --muted: #6b7280;
  --gold-1: #f8cf7a;
  --gold-2: #f59e0b;
  --glass: rgba(10,12,14,0.04);
  --card-shadow: 0 48px 140px rgba(9,11,12,0.06);
  --soft-shadow: 0 18px 54px rgba(10,12,14,0.04);
  --radius: 20px;
  --max: 1220px;
  --focus: 0 0 0 4px rgba(246,183,60,0.12);
  --paper: repeating-linear-gradient(0deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 1px, transparent 1px, transparent 6px);
}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}

.skip-link{position:fixed;left:12px;top:12px;background:#071022;color:#fff;padding:8px 10px;border-radius:8px;z-index:200;opacity:0.98;font-weight:700}
.skip-link:focus{outline:none;box-shadow:var(--focus);transform:none}

.luxe-root{position:relative;padding:64px 20px 120px;min-height:100vh;background-image:var(--paper)}
.hero-foil{position:absolute;left:50%;top:-30px;transform:translateX(-50%);width:calc(100% - 120px);max-width:1200px;height:360px;pointer-events:none;z-index:0;overflow:hidden;border-radius:18px}
.foil-svg{width:100%;height:100%;display:block}

.luxe-container{max-width:var(--max);margin:0 auto;position:relative;padding:0 18px;z-index:2}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
.brand{display:flex;gap:14px;align-items:center}
.crest{width:64px;height:64px;border-radius:14px;background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:white;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:var(--soft-shadow);font-size:22px}
.brand-title{font-weight:900}
.brand-sub{font-size:12px;color:var(--muted)}
.top-actions{display:flex;gap:12px;align-items:center}
.top-actions .link{font-weight:700;color:var(--muted)}
.top-actions .link.cta{padding:8px 12px;border-radius:12px;background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:white;box-shadow:0 18px 44px rgba(245,158,11,0.12)}

.luxe-main{position:relative;z-index:2}
.luxe-hero{display:grid;grid-template-columns:1fr 460px;gap:44px;align-items:start;margin-top:6px}
.lh-left{padding-right:6px}
.lh-strap{display:inline-block;padding:8px 14px;border-radius:999px;background:linear-gradient(90deg,rgba(246,183,60,0.08),rgba(245,158,11,0.02));font-weight:800;color:var(--gold-2);font-size:12px;margin-bottom:12px}
.lh-title{font-family:Georgia, 'Times New Roman', serif;font-weight:900;font-size:68px;margin:8px 0 14px;line-height:1.02;letter-spacing:-0.6px;color:var(--text)}
.lh-accent{background:linear-gradient(90deg,var(--gold-1),var(--gold-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lh-lead{color:var(--muted);font-size:17px;max-width:66ch;margin-bottom:18px}

.lh-ctas{display:flex;gap:12px;margin-top:8px;flex-wrap:wrap}
.btn-primary{background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:white;padding:14px 26px;border-radius:14px;font-weight:900;box-shadow:0 54px 160px rgba(245,158,11,0.14);transition:transform .14s,box-shadow .14s}
.btn-primary:hover{transform:translateY(-6px);box-shadow:0 72px 200px rgba(245,158,11,0.18)}
.btn-ghost{background:linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.95));border:1px solid var(--glass);padding:12px 16px;border-radius:12px;font-weight:800}
.btn-outline{background:transparent;border:1px solid rgba(10,12,14,0.06);padding:12px 16px;border-radius:12px;font-weight:800}

.lh-trust{margin-top:22px}
.trust-label{font-weight:900;color:var(--muted);margin-bottom:10px}
.partner-marquee{overflow:hidden;padding:6px 0}
.marquee-track{display:block;white-space:nowrap}
.marquee-group{display:flex;gap:28px;align-items:center;animation:marquee 20s linear infinite}
.partner-marquee:hover .marquee-group,
.partner-marquee:focus-within .marquee-group { animation-play-state: paused; }
.marquee-item img{height:36px;filter:grayscale(78%);opacity:0.94;transition:transform .18s,filter .18s}
.marquee-item img:hover{filter:none;transform:translateY(-4px)}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.trust-badges{display:flex;gap:10px;margin-top:12px}
.trust-pill{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.96);border:1px solid rgba(10,12,14,0.04);font-weight:800;color:var(--muted)}

.lh-right{display:flex;flex-direction:column;gap:14px}
.quote-card{border-radius:18px;padding:22px;background:linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,255,255,0.94));border:1px solid rgba(255,255,255,0.6);box-shadow:var(--card-shadow);backdrop-filter:blur(6px);position:sticky;top:28px}
.quote-head{display:flex;justify-content:space-between;align-items:center}
.quote-title{font-weight:900;font-size:16px}
.pill{padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.04);font-weight:800;color:var(--muted)}

.quote-form{margin-top:12px}
.field{display:block;margin-top:10px}
.label{display:block;font-size:12px;color:var(--muted);font-weight:800;margin-bottom:6px}
.quote-form input, .quote-form select{width:100%;padding:12px;border-radius:12px;border:1px solid #eef2f6;background:#fff;font-size:15px;transition:box-shadow .12s,transform .08s}
.quote-form input:focus, .quote-form select:focus{box-shadow:var(--focus);outline:none;transform:translateY(-2px)}
.quote-form input:focus-visible{outline:none;box-shadow:var(--focus)}

.two-up{display:flex;gap:12px}
.form-error{margin-top:10px;padding:10px;border-radius:10px;background:rgba(139,31,31,0.04);color:#8b1f1f;font-weight:700}

.term-row{display:flex;gap:10px;margin-top:12px}
.term{flex:1;padding:10px;border-radius:12px;border:1px solid #eef2f6;background:transparent;font-weight:800;cursor:pointer;transition:transform .08s}
.term:focus{outline:none;box-shadow:var(--focus)}
.term.active{background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:white;box-shadow:0 14px 36px rgba(245,158,11,0.09);transform:translateY(-4px)}

.actions-row{display:flex;gap:12px;margin-top:14px;align-items:center}
.estimate-btn{flex:1;padding:12px;border-radius:12px;background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:#fff;border:none;font-weight:900;cursor:pointer;transition:transform .12s}
.estimate-btn:active{transform:translateY(1px)}
.buy-small{padding:10px 12px;border-radius:12px;border:1px solid #eef2f6;background:white;color:var(--muted);text-decoration:none;display:inline-flex;align-items:center;justify-content:center}

.skeleton-result{display:inline-flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:#fff;border:1px solid #f1e9d8;box-shadow:0 6px 28px rgba(0,0,0,0.03)}
.skeleton-line{width:190px;height:18px;border-radius:8px;background:linear-gradient(90deg,#eee,#f4eadf,#eee);background-size:200% 100%;animation:shimmer 1.2s linear infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

.result-area{min-height:72px;margin-top:14px;position:relative}
.luxe-result{display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;background:linear-gradient(90deg,rgba(246,183,60,0.06),rgba(245,158,11,0.02));border:1px solid rgba(245,158,11,0.06);font-weight:900;position:relative;overflow:hidden;box-shadow:inset 0 -6px 18px rgba(255,255,255,0.08)}
.price-wrap{display:flex;flex-direction:row;align-items:baseline;gap:10px;margin-left:6px}
.luxe-price{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco,'Roboto Mono';font-size:26px;letter-spacing:0.4px}
.luxe-period{font-weight:700;color:var(--muted);font-size:13px}
.price-shimmer{position:absolute;right:-40%;top:0;width:180%;height:100%;transform:skewX(-16deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent);opacity:0;pointer-events:none}
.luxe-result-pulse{animation:luxepulse .95s ease-in-out}
@keyframes luxepulse{0%{transform:translateY(0)}40%{transform:translateY(-6px);box-shadow:0 36px 90px rgba(245,158,11,0.12)}100%{transform:translateY(0)}}

.features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:42px}
.feature{padding:26px;border-radius:14px;background:linear-gradient(180deg,#fff,#fff);border:1px solid var(--glass);box-shadow:var(--soft-shadow);transition:transform .16s}
.feature:hover{transform:translateY(-8px)}
.feature-icon{font-size:30px}
.feature-title{font-weight:900;margin-top:10px}
.feature-desc{color:var(--muted);margin-top:8px}

.blogs{display:grid;grid-template-columns:2fr 1fr;gap:26px;margin-top:44px}
.blogs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:14px}
.article-card{padding:16px;border-radius:12px;background:linear-gradient(180deg,#fff,#fff);border:1px solid var(--glass);box-shadow:var(--soft-shadow);transition:transform .12s}
.article-card:hover{transform:translateY(-6px)}
.thumb{height:130px;border-radius:10px;background:#f7f5f2}
.article-title{display:block;font-weight:900;margin-top:12px}
.article-excerpt{color:var(--muted);margin-top:8px}
.read-link{margin-top:10px;display:inline-block;color:var(--gold-2);font-weight:900}

.side-col{display:flex;flex-direction:column;gap:14px}
.testimonial-card{padding:16px;border-radius:12px;background:linear-gradient(180deg,#fff,#fff);border:1px solid var(--glass);box-shadow:var(--soft-shadow)}
.testimonial-rotator{min-height:110px;display:flex;flex-direction:column;gap:8px}
.testimonial-copy{color:var(--muted);font-size:15px}
.testimonial-meta{font-weight:800}
.rotator-controls{display:flex;gap:8px;margin-top:8px}
.dot{width:10px;height:10px;border-radius:50%;background:#e6e6e6;border:none;cursor:pointer}
.dot.on{background:var(--gold-2);box-shadow:0 6px 18px rgba(240,180,60,0.12)}
.rotator-ctrls-visual{display:flex;gap:8px;margin-top:10px}
.rot-ctrl{background:transparent;border:1px solid rgba(0,0,0,0.06);padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:900}

.certs{padding:12px;border-radius:12px;background:#fff;border:1px solid var(--glass);box-shadow:var(--soft-shadow)}
.cert-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;color:var(--muted);font-weight:800}
.luxe-footer{display:flex;justify-content:space-between;align-items:center;padding-top:40px;border-top:1px solid rgba(8,10,12,0.03);margin-top:54px}
.footer-links a{margin-left:14px;color:var(--muted);text-decoration:none;font-weight:700}

.fab-quote{position:fixed;right:20px;bottom:24px;background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:white;border:none;padding:12px 18px;border-radius:999px;box-shadow:0 40px 120px rgba(245,158,11,0.16);font-weight:900;cursor:pointer;z-index:60;display:flex;align-items:center;gap:10px}
.fab-icon{font-size:14px;transform:translateY(-1px)}

@media (max-width:1100px){
  .lh-title { font-size:48px; }
  .luxe-hero { grid-template-columns:1fr 420px; gap:28px; }
  .luxe-container { padding: 0 16px; }
}
@media (max-width:880px){
  .luxe-hero{grid-template-columns:1fr;gap:28px}
  .lh-title{font-size:36px}
  .fab-quote{right:14px;bottom:16px;padding:10px 14px}
  .quote-card{position:relative;top:0}
}
@media (max-width:480px){
  .lh-title{font-size:26px}
  .luxe-price{font-size:20px}
  .marquee-group{animation-duration:30s}
}
`;

