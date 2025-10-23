import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import "../styles/NotFound.css";


function Confetti({ burst = 18 }) {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: burst }).map((_, i) => (
        <span key={i} className={`c-piece c-${i % 8}`} />
      ))}
    </div>
  );
}

function Modal({ open, onClose, title = "Report issue", children }) {
  const dialogRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const t = setTimeout(() => (first ? first.focus() : el.focus()), prefersReduced ? 0 : 12);

    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && focusable.length) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, prefersReduced]);

  if (!open) return null;

  return (
    <div
      className="nf-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nf-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        className="nf-modal"
        role="document"
        initial={prefersReduced ? {} : { opacity: 0, y: 8, scale: 0.996 }}
        animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        tabIndex={-1}
      >
        <div className="nf-modal-header">
          <h3 id="nf-modal-title">{title}</h3>
          <button className="nf-modal-close" aria-label="Close dialog" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="nf-modal-body">{children}</div>

        <div className="nf-modal-actions">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Spinner({ size = 14 }) {
  return (
    <svg className="nf-spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle className="spinner-track" cx="12" cy="12" r="8" strokeWidth="2" fill="none" />
      <path className="spinner-head" d="M20 12a8 8 0 0 1-8 8" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function NotFound() {
  const canvasRef = useRef(null);
  const auroraRef = useRef(null);
  const shimmerRef = useRef(null);
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [motionEnabled, setMotionEnabled] = useState(() => {
    try {
      return localStorage.getItem("nf_motion") !== "off";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("nf_motion", motionEnabled ? "on" : "off");
    } catch {}
  }, [motionEnabled]);

  const allowMotion = !(prefersReduced || !motionEnabled);

  const [hasQuote, setHasQuote] = useState(false);
  const [quotePreview, setQuotePreview] = useState(null);

  const [toast, setToast] = useState(null);
  const [copiedTooltip, setCopiedTooltip] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState("");
  const [continueLoading, setContinueLoading] = useState(false);

  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [carRun, setCarRun] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("nf_theme") || "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {




    document.documentElement.setAttribute("data-theme", "light");
    try {
      localStorage.setItem("nf_theme", "light");
    } catch {}
  }, [theme]);

  const studioLines = [
    "Wrong turn? Consider it a detour to something better.",
    "Elegance is in the details — and in the detours.",
    "A good plan invites flexibility.",
    "Even a scenic route deserves an elegant arrival.",
  ];
  const [lineIndex, setLineIndex] = useState(0);
  useEffect(() => {
    if (!allowMotion) return;
    const t = setInterval(() => setLineIndex((i) => (i + 1) % studioLines.length), 5400);
    return () => clearInterval(t);
  }, [allowMotion]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quote");
      if (raw) {
        const q = JSON.parse(raw);
        setHasQuote(true);
        setQuotePreview({
          product: q.product || "Saved policy",
          holder: q.holder || "Policyholder",
          premium: q.premium ?? null,
          id: q.policyNumber || q.policyId || null,
        });
      } else {
        setHasQuote(false);
        setQuotePreview(null);
      }
    } catch {
      setHasQuote(false);
      setQuotePreview(null);
    }
  }, []);

  useEffect(() => {
    if (!allowMotion) {
      setCurtainsOpen(true);
      setCarRun(true);
      return;
    }
    const t = setTimeout(() => {
      setCurtainsOpen(true);
      setTimeout(() => setCarRun(true), 500);
    }, 220);
    return () => clearTimeout(t);
  }, [allowMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let particles = Array.from({ length: Math.max(42, Math.round(w / 20)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.4,
      dx: (Math.random() - 0.5) * 0.26,
      dy: (Math.random() - 0.5) * 0.26,
      alpha: Math.random() * 0.36 + 0.06,
    }));

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = Array.from({ length: Math.max(42, Math.round(w / 20)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        dx: (Math.random() - 0.5) * 0.26,
        dy: (Math.random() - 0.5) * 0.26,
        alpha: Math.random() * 0.36 + 0.06,
      }));
    }
    window.addEventListener("resize", resize);

    let raf = null;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "rgba(255,242,210,0.82)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const aurora = auroraRef.current;
    const shimmer = shimmerRef.current;
    if (!aurora || !shimmer) return;
    function onMove(e) {
      const x = ((e.clientX ?? window.innerWidth / 2) / window.innerWidth - 0.5) * 2;
      const y = ((e.clientY ?? window.innerHeight / 2) / window.innerHeight - 0.5) * 2;
      aurora.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 0) scale(1.02)`;
      shimmer.style.transform = `translate3d(${x * 22}px, ${y * 6}px, 0) rotate(-6deg)`;
    }
    function onTilt(e) {
      const gamma = e.gamma || 0;
      const beta = e.beta || 0;
      const x = Math.max(-1, Math.min(1, gamma / 20));
      const y = Math.max(-1, Math.min(1, beta / 30));
      aurora.style.transform = `translate3d(${x * 8}px, ${y * 6}px, 0) scale(1.02)`;
      shimmer.style.transform = `translate3d(${x * 22}px, ${y * 6}px, 0) rotate(-6deg)`;
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (!e.key) return;
      const k = e.key.toLowerCase();
      if (k === "h") navigate("/");
      if (k === "r") restoreQuote();
      if (k === "d") setTheme((t) => (t === "light" ? "light" : t === "light" ? "light" : "light"));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  function showToast(msg = "", ms = 2400) {
    setToast(msg);
    clearTimeout(window.__nf_toast_timer__);
    window.__nf_toast_timer__ = setTimeout(() => setToast(null), ms);
  }

  function restoreQuote() {
    try {
      const raw = localStorage.getItem("quote");
      if (!raw) {
        showToast("No saved quote found.");
        return;
      }
      const cart = JSON.parse(raw);
      showToast("Restoring last quote…");
      setTimeout(() => navigate("/policy-purchase", { state: { cart } }), 420);
    } catch {
      showToast("Could not restore quote.");
    }
  }

  function continueCheckout() {
    try {
      const raw = localStorage.getItem("quote");
      if (!raw) {
        showToast("No saved quote to continue.");
        return;
      }
      const cart = JSON.parse(raw);
      setContinueLoading(true);
      setTimeout(() => {
        setContinueLoading(false);
        navigate("/policy-purchase", { state: { cart } });
      }, 560);
    } catch {
      showToast("Could not continue to checkout.");
      setContinueLoading(false);
    }
  }

  async function copyRefToClipboard() {
    if (!quotePreview?.id) {
      showToast("No reference to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(String(quotePreview.id));
      setCopiedTooltip(true);
      setTimeout(() => setCopiedTooltip(false), 1400);
      showToast("Quote reference copied.");
    } catch {
      showToast("Couldn’t copy — try manual copy.");
    }
  }

  function submitReport(e) {
    e.preventDefault();
    if (!reportText.trim()) {
      setReportError("Please describe the issue so we can investigate.");
      return;
    }
    setReportError("");
    setReportSent(true);
    showToast("Thanks — we've received your report.");
    setTimeout(() => {
      setReportOpen(false);
      setReportText("");
      setReportEmail("");
      setTimeout(() => setReportSent(false), 700);
    }, 900);
  }

  return (
    <div className="notfound-root" role="document" aria-labelledby="nf-title">
      <canvas ref={canvasRef} className="bg-canvas" aria-hidden />
      <div className="aurora-layer" ref={auroraRef} aria-hidden />
      <div className="shimmer-layer" ref={shimmerRef} aria-hidden />
      <div className="film-grain" aria-hidden />
      <div className="smoke-layer" aria-hidden />

      <div className={`curtain-left ${curtainsOpen ? "open" : ""}`} aria-hidden />
      <div className={`curtain-right ${curtainsOpen ? "open" : ""}`} aria-hidden />
      <div className={`spotlight ${curtainsOpen ? "on" : ""}`} aria-hidden />

      <div className="big-404" aria-hidden>
        <motion.span
          initial={allowMotion ? { opacity: 0.06, y: -6 } : {}}
          animate={allowMotion ? { opacity: 0.04, y: 0 } : {}}
          transition={{ duration: 6, yoyo: Infinity }}
        >
          404
        </motion.span>
      </div>

      <svg className="foil-ornament" aria-hidden viewBox="0 0 240 240">
        <defs>
          <radialGradient id="gF" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#fff7e9" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#f1db9a" stopOpacity="0.22" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="100" fill="url(#gF)" opacity="0.18" />
      </svg>

      <motion.main
        className="notfound-inner"
        initial={allowMotion ? { opacity: 0, y: 36, scale: 0.996 } : {}}
        animate={allowMotion ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="brand-row">
          <motion.svg
            className="crest"
            viewBox="0 0 36 36"
            aria-hidden
            focusable="false"
            animate={allowMotion ? { rotate: [0, -6, 6, 0] } : {}}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d5ad5a" />
                <stop offset="1" stopColor="#f7e3b0" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill="url(#g1)" />
            <path
              d="M10 20c2-3 6-6 8-6s6 2 8 6"
              stroke="#2b3b36"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>

          <h1 id="nf-title" className="brand">
            Solymus <span className="brand-sub">— insurance, elegantly</span>
          </h1>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className={`theme-toggle light`}
              onClick={() => setTheme((t) => (t === "light" ? "light" : t === "light" ? "light" : "light"))}
              aria-label="Cycle theme"
              title="Cycle theme (D)"
            >
              {theme === "light" ? "🌤" : theme === "light" ? "🌙" : "🕴"}
            </button>

            <div className="motion-toggle" title="Toggle motion/animation" aria-hidden={false}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={motionEnabled}
                  onChange={(e) => setMotionEnabled(Boolean(e.target.checked))}
                  aria-label="Toggle UI animations"
                />
                <span className="slider" />
              </label>
              <span className="motion-label">{motionEnabled ? "Motion: On" : "Motion: Off"}</span>
            </div>
          </div>
        </div>

        <h2 className="notfound-title">Welcome to Solymus.</h2>

        <motion.p
          key={lineIndex}
          className="notfound-sub"
          initial={allowMotion ? { opacity: 0, y: 6 } : {}}
          animate={allowMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.36 }}
        >
          {studioLines[lineIndex]}
        </motion.p>

        <div className="hero-wrap" aria-hidden>
          <motion.svg
            className="hero-illustration"
            viewBox="0 0 640 240"
            preserveAspectRatio="xMidYMid meet"
            initial={allowMotion ? { opacity: 0, y: 10 } : {}}
            animate={allowMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.64 }}
            role="img"
            aria-hidden
          >
            <defs>
              <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>
              <radialGradient id="head" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,230,170,0.95)" />
                <stop offset="100%" stopColor="rgba(255,230,170,0)" />
              </radialGradient>
              <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feBlend in="SourceGraphic" in2="b" />
              </filter>
            </defs>

            <rect x="16" y="12" rx="12" ry="12" width="608" height="216" fill="url(#road)" stroke="rgba(255,255,255,0.02)" />

            <g transform="translate(36,26)">
              <text x="12" y="40" fontFamily="Merriweather, serif" fontWeight="600" fontSize="26" fill="var(--muted)">
                Solymus Presents
              </text>
              <text x="12" y="92" fontFamily="Merriweather, serif" fontWeight="800" fontSize="48" fill="var(--accent)">
                Cashless Insurance
              </text>
              <text x="12" y="200" fontFamily="Inter, sans-serif" fontSize="14" fill="var(--muted)">
                Take a breath. We'll get you back on course.
              </text>

              <path d="M0 160 C120 100 260 100 360 130 C440 154 540 160 604 140" stroke="var(--accent)" strokeWidth="3" fill="none" opacity="0.95" />

              <g transform="translate(36,100) scale(0.9)">
                <g className={`car ${carRun && allowMotion ? "drive" : ""}`} aria-hidden>
                  <path className="car-body" d="M10 34 L32 20 L130 20 L180 34 L200 34 L210 44 L12 46 Z" fill="var(--panel)" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="60" cy="58" r="12" stroke="var(--accent)" strokeWidth="2" fill="var(--accent-2)" />
                  <circle cx="160" cy="58" r="12" stroke="var(--accent)" strokeWidth="2" fill="var(--accent-2)" />
                  <g className="headlights" aria-hidden>
                    <circle cx="190" cy="36" r="10" fill="url(#head)" filter="url(#soft)" opacity="0.95" />
                    <circle cx="196" cy="36" r="36" fill="url(#head)" opacity="0.18" />
                  </g>
                </g>
              </g>
            </g>
          </motion.svg>
        </div>

        <div className="actions">
          <Link to="/" className="btn-primary" aria-label="Return home">
            🏠 Return Home
          </Link>

          <Link to="/policies" className="btn-ghost" aria-label="Browse policies">
            🔍 Explore Policies
          </Link>

          <button
            className="btn-outline"
            onClick={restoreQuote}
            disabled={!hasQuote}
            aria-disabled={!hasQuote}
            title={hasQuote ? "Restore your last saved quote (R)" : "No saved quote found"}
          >
            ⤺ Restore last quote
          </button>

          <button className="btn-minor" onClick={() => setReportOpen(true)} aria-haspopup="dialog">
            ⚠️ Report issue
          </button>
        </div>

        {hasQuote && quotePreview && (
          <div className="quote-preview" aria-live="polite">
            <div className="qp-left">
              <div className="qp-product">{quotePreview.product}</div>
              <div className="qp-holder">{quotePreview.holder}</div>
            </div>

            <div className="qp-right">
              {quotePreview.premium != null && (
                <div className="qp-price">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(quotePreview.premium)}
                </div>
              )}
              {quotePreview.id && <div className="qp-id">Ref: {quotePreview.id}</div>}

              <div className="qp-actions">
                <div className="copy-wrap">
                  <button className="btn-outline small" onClick={copyRefToClipboard} aria-label="Copy reference">
                    📋 Copy ref
                  </button>
                  {copiedTooltip && (
                    <div className="copy-tooltip" role="status" aria-live="polite">
                      Copied ✓
                    </div>
                  )}
                </div>

                <button className="btn-outline small" onClick={continueCheckout} aria-busy={continueLoading}>
                  {continueLoading ? (
                    <>
                      <Spinner size={14} /> &nbsp;Loading…
                    </>
                  ) : (
                    "Continue to checkout"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="suggestions">
          <div className="suggestion">
            <div className="s-title">Need a hand?</div>
            <div className="s-desc">Return home, view policies, or reach our support team — we'll make it effortless.</div>
            <div className="s-actions">
              <Link to="/" className="btn-ghost small">Home</Link>
              <Link to="/policies" className="btn-outline small">Policies</Link>
              <a href="mailto:support@solymus.example" className="btn-minor small">Contact</a>
            </div>
          </div>

          <div className="suggestion help-card" aria-hidden>
            <div className="s-title">Shortcuts</div>
            <div className="s-desc">H → home · R → restore quote · D → toggle theme</div>
          </div>
        </div>

        <div className="keyboard-hint">
          Tip: Press <kbd>H</kbd> for Home • <kbd>R</kbd> to restore • <kbd>D</kbd> to cycle theme
        </div>

        <div className="panel-footer">
          <small>© {new Date().getFullYear()} Solymus — Crafted with care</small>
        </div>

        {reportSent && allowMotion && <Confetti burst={18} />}
      </motion.main>

      <div className={`nf-toast ${toast ? "show" : ""}`} role="status" aria-live="polite" aria-atomic="true">
        <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }} aria-hidden focusable="false">
          <path
            d="M12 2l3.2 6.5L22 10l-5 4.6L18 22l-6-3.4L6 22l1-7.4L2 10l6.8-1.5L12 2z"
            fill="var(--accent-2)"
            stroke="var(--accent)"
            strokeWidth="0.5"
          />
        </svg>
        <span>{toast}</span>
      </div>

      <Modal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportSent(false);
          setReportError("");
        }}
        title="Report a broken link"
      >
        {reportSent ? (
          <div className="report-success">
            <svg viewBox="0 0 52 52" className="check-anim" aria-hidden>
              <circle cx="26" cy="26" r="25" fill="none" className="check-circle" />
              <path d="M14 27l7 7 17-17" fill="none" className="check-tick" />
            </svg>
            <h4>Thanks — report received</h4>
            <p className="muted">We’ll review this and follow up if you left an email.</p>
          </div>
        ) : (
          <form onSubmit={submitReport} noValidate>
            <label className="label">Describe the issue</label>
            <textarea
              className="nf-textarea"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Where did the link take you? Any extra details..."
              required
            />
            <div className="field-row">
              <label className="label small">Your email (optional)</label>
              <input
                className="nf-input"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
              />
            </div>
            {reportError && (
              <div className="form-error" role="alert">
                {reportError}
              </div>
            )}
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setReportOpen(false);
                  setReportError("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Send report
              </button>
            </div>
          </form>
        )}
      </Modal>

      <a
        className="help-fab"
        href="mailto:support@solymus.example?subject=Help%20with%20404"
        aria-label="Contact support"
        title="Contact support"
      >
        <span className="fab-inner" aria-hidden>
          ✉️
        </span>
        <span className="fab-hint">Need help?</span>
      </a>
    </div>
  );
}
