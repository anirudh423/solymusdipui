
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/solymus-logout.css";

export default function AdminLogout() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState("preparing");
    const [checks, setChecks] = useState([false, false, false]);
    const [removedKeys, setRemovedKeys] = useState([]);
    const [toast, setToast] = useState(null);
    const [signedAt, setSignedAt] = useState(null);
    const [serverStatus, setServerStatus] = useState("pending");
    const [confettiStyles, setConfettiStyles] = useState([]);
    const [showDetails, setShowDetails] = useState(false);

    const liveRef = useRef(null);
    const loginBtnRef = useRef(null);
    const detailCloseRef = useRef(null);
    const timers = useRef([]);

    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => (document.body.style.overflow = prev);
    }, []);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(id);
    }, [toast]);

    useEffect(() => {
        let mounted = true;
        const announce = (text) => {
            if (liveRef.current) liveRef.current.textContent = text;
        };

        function onKey(e) {
            if (e.key === "Escape") {
                if (showDetails) setShowDetails(false);
                else navigate("/admin/login?signed_out=1", { replace: true });
            }
            if (e.key.toLowerCase() === "d" && (e.ctrlKey || e.metaKey)) setShowDetails((s) => !s);
        }
        window.addEventListener("keydown", onKey);

        const fireServerLogout = async () => {
            try {
                const res = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });
                if (!mounted) return;
                setServerStatus(res.ok ? "ok" : "failed");
            } catch (e) {
                if (!mounted) return;
                setServerStatus("failed");
            }
        };

        async function doLogout() {
            if (!prefersReduced) await delay(160);
            if (!mounted) return;

            setPhase("clearing");
            announce("Signing out — clearing session and tokens.");

            const removed = [];
            try {
                const explicit = [
                    "auth_token",
                    "jwt",
                    "token",
                    "access_token",
                    "id_token",
                    "solymus_auth",
                    "solymus_jwt",
                    "solymus_token",
                    "solymus_theme",
                    "solymus_compact",
                ];
                explicit.forEach((k) => {
                    if (localStorage.getItem(k) !== null) {
                        removed.push(k);
                        localStorage.removeItem(k);
                    }
                });
                Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith("solymus_")) {
                        if (localStorage.getItem(k) !== null) removed.push(k);
                        localStorage.removeItem(k);
                    }
                });
            } catch (e) {
            }

            try {
                if (typeof sessionStorage !== "undefined") {
                    if (sessionStorage.length) removed.push("sessionStorage (cleared)");
                    sessionStorage.clear();
                }
            } catch (e) { }

            if (removed.length) setRemovedKeys(removed.slice(0, 6));

            try {
                document.cookie
                    .split(";")
                    .map((c) => c.trim())
                    .filter(Boolean)
                    .forEach((cookie) => {
                        const name = cookie.split("=")[0];
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                        try {
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`;
                        } catch (e) { }
                    });
            } catch (e) { }

            try {
                if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
                    delete window.axios.defaults.headers.common?.Authorization;
                    delete window.axios.defaults.headers.common?.authorization;
                }
            } catch (e) { }

            fireServerLogout();

            if (prefersReduced) {
                setChecks([true, true, true]);
            } else {
                timers.current.push(setTimeout(() => setChecks([true, false, false]), 220));
                timers.current.push(setTimeout(() => setChecks([true, true, false]), 460));
                timers.current.push(setTimeout(() => setChecks([true, true, true]), 740));
            }

            const successDelay = prefersReduced ? 360 : 1200;
            timers.current.push(
                setTimeout(() => {
                    if (!mounted) return;
                    setPhase("success");
                    setSignedAt(new Date());
                    setToast({ type: "success", text: "Signed out — see you soon." });
                    announce("Signed out. Redirecting to login.");

                    if (!prefersReduced) setConfettiStyles(generateConfettiStyles(28));

                    try {
                        loginBtnRef.current?.focus();
                    } catch (e) { }

                    const crest = document.querySelector(".crest");
                    crest?.classList?.add("crest-pulse");
                    setTimeout(() => crest?.classList?.remove("crest-pulse"), 900);

                    timers.current.push(
                        setTimeout(() => {
                            if (!mounted) return;
                            navigate("/admin/login?signed_out=1", { replace: true });
                        }, prefersReduced ? 280 : 1200)
                    );
                }, successDelay)
            );
        }

        doLogout();

        return () => {
            mounted = false;
            timers.current.forEach(clearTimeout);
            timers.current = [];
            window.removeEventListener("keydown", onKey);
        };
    }, [navigate, prefersReduced, showDetails]);

    const retryServerLogout = async () => {
        setServerStatus("pending");
        try {
            const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
            setServerStatus(res.ok ? "ok" : "failed");
            setToast({ type: res.ok ? "success" : "error", text: res.ok ? "Server logout confirmed." : "Server logout failed." });
        } catch (e) {
            setServerStatus("failed");
            setToast({ type: "error", text: "Server logout failed (network)." });
        }
    };

    const copyRemovedKeys = async () => {
        if (!removedKeys || removedKeys.length === 0) {
            setToast({ type: "error", text: "Nothing to copy." });
            return;
        }
        try {
            await navigator.clipboard.writeText(removedKeys.join("\n"));
            setToast({ type: "success", text: "Removed keys copied to clipboard." });
        } catch (e) {
            setToast({ type: "error", text: "Copy failed — try manually." });
        }
    };

    const formattedTime = signedAt ? signedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : null;

    return (
        <div className="logout-root luxe-king" role="region" aria-labelledby="logout-title">
            <div className="ambient-orb" aria-hidden />
            <div className="sr-only" aria-live="polite" ref={liveRef} />

            <Particles phase={phase} />

            <main className={`logout-card bento-card ${phase}`} data-phase={phase} aria-busy={phase !== "success"}>
                <div className="ribbon" aria-hidden>
                    <div className="ribbon-left" />
                    <div className="ribbon-label">Solymus</div>
                    <div className="ribbon-right" />
                </div>

                <section className="logout-body" aria-hidden={false}>
                    <div className="crest-wrap" aria-hidden>
                        <svg width="96" height="96" viewBox="0 0 48 48" className="crest" role="img" aria-hidden>
                            <defs>
                                <linearGradient id="g2" x1="0" x2="1">
                                    <stop offset="0" stopColor="var(--accent-1)" />
                                    <stop offset="1" stopColor="var(--accent-2)" />
                                </linearGradient>
                                <linearGradient id="sheen" x1="0" x2="1">
                                    <stop offset="0" stopColor="#fff8ec" stopOpacity="0.26" />
                                    <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                            <rect width="48" height="48" rx="10" fill="url(#g2)" />
                            <path d="M14 30c0-6 10-10 10-14s10 0 10 4v8" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="0" y="0" width="48" height="48" rx="10" fill="url(#sheen)" className="sheen" />
                        </svg>
                    </div>

                    <div className="logout-text">
                        <div className="luxury-hero">
                            <h1 id="logout-title" className="logout-title">Signing you out</h1>
                            <div className={`gold-underline ${phase === "success" ? "shimmer" : ""}`} aria-hidden />
                            <div className="hero-sub">A moment of care. Privacy preserved.</div>
                        </div>

                        <p className="logout-sub muted">Privacy-first — clearing session data, expiring cookies, removing tokens.</p>

                        <ul className="logout-list" aria-hidden>
                            <li className={`li-anim ${checks[0] ? "done" : ""}`}>
                                <span className="li-check" aria-hidden>
                                    <svg viewBox="0 0 24 24" width="16" height="16" className="tick"><path className="tick-path" d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                                </span>
                                <span className="li-text">Local session cleared</span>
                            </li>

                            <li className={`li-anim ${checks[1] ? "done" : ""}`}>
                                <span className="li-check" aria-hidden>
                                    <svg viewBox="0 0 24 24" width="16" height="16" className="tick"><path className="tick-path" d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                                </span>
                                <span className="li-text">Cookies expired (best-effort)</span>
                            </li>

                            <li className={`li-anim ${checks[2] ? "done" : ""}`}>
                                <span className="li-check" aria-hidden>
                                    <svg viewBox="0 0 24 24" width="16" height="16" className="tick"><path className="tick-path" d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                                </span>
                                <span className="li-text">Server logout attempted <ServerBadge status={serverStatus} /></span>
                            </li>
                        </ul>

                        {removedKeys.length > 0 && (
                            <div className="removed-panel" aria-hidden>
                                <div className="removed-title small muted">Removed (sample)</div>
                                <div className="removed-list">
                                    {removedKeys.map((k) => (
                                        <span key={k} className="chip-key">{k}</span>
                                    ))}
                                    {removedKeys.length >= 6 && <span className="chip-key">…</span>}
                                </div>

                                <div className="removed-actions">
                                    <button className="btn-ghost" onClick={() => setShowDetails(true)} aria-label="Show removed keys details">View details</button>
                                    <button className="btn-ghost" onClick={copyRemovedKeys} aria-label="Copy removed keys">Copy keys</button>
                                </div>
                            </div>
                        )}

                        <div className="logout-actions">
                            <Link ref={loginBtnRef} to="/admin/login" className="btn-gold" aria-label="Go to admin login">Return to login</Link>
                            <Link to="/" className="btn-ghost" aria-label="Back to site" style={{ marginLeft: 12 }}>Back to site</Link>
                            {serverStatus === "failed" && (
                                <button className="btn-retry" onClick={retryServerLogout} aria-label="Retry server logout" style={{ marginLeft: 12 }}>Retry server logout</button>
                            )}
                        </div>

                        {formattedTimePreview(formattedTime)}
                    </div>

                    <div className="logout-stage" aria-hidden>
                        <ProgressSVG phase={phase} />
                        <div className="stage-caption">{phase === "preparing" ? "Preparing…" : phase === "clearing" ? "Clearing…" : "Signed out ✓"}</div>
                    </div>
                </section>

                <footer className="dramatic-footer muted small">“Great advertising is the art of understanding people — make them feel safe.” — Solymus</footer>

                <SuccessGlints show={phase === "success"} styles={confettiStyles} />

                {showDetails && (
                    <div role="dialog" aria-modal="true" className="details-drawer">
                        <div className="details-head">
                            <strong>Logout details</strong>
                            <div className="details-actions">
                                <button className="btn-ghost" onClick={copyRemovedKeys}>Copy</button>
                                <button ref={detailCloseRef} className="btn-ghost" onClick={() => setShowDetails(false)}>Close</button>
                            </div>
                        </div>

                        <div className="details-meta">Server: <strong>{serverStatus}</strong></div>

                        <div className="details-list">
                            {removedKeys.length ? (
                                removedKeys.map((k) => <div key={k} className="details-item">{k}</div>)
                            ) : (
                                <div className="muted">No keys to show.</div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {toast && (
                <div role="status" aria-live="polite" className={`logout-toast ${toast.type === "success" ? "toast-success" : "toast-error"}`} onAnimationEnd={() => setToast(null)}>
                    <div className="toast-inner">{toast.text}</div>
                </div>
            )}
        </div>
    );
}

function delay(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
}
function formattedTimePreview(time) {
    if (!time) return null;
    return <div className="signed-time muted small" aria-hidden>{`Signed out • ${time}`}</div>;
}
function ServerBadge({ status = "pending" }) {
    return <span className={`server-badge server-${status}`} aria-hidden title={`Server logout: ${status}`}>{status === "ok" ? " ✓" : status === "failed" ? " ✕" : " …"}</span>;
}
function Particles({ phase }) {
    const count = 12;
    const arr = Array.from({ length: count });
    return <div aria-hidden className={`particles ${phase === "clearing" ? "active" : ""}`}>{arr.map((_, i) => <span key={i} className={`particle p-${i}`} />)}</div>;
}
function ProgressSVG({ phase = "preparing" }) {
    return (
        <div className={`ring-wrap ${phase}`}>
            <svg viewBox="0 0 120 120" className="progress-ring" aria-hidden>
                <defs>
                    <linearGradient id="rg" x1="0" x2="1"><stop offset="0" stopColor="var(--accent-1)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient>
                </defs>

                <circle className="ring-bg" cx="60" cy="60" r="48" strokeWidth="8" fill="none" />
                <circle className="ring-arc" cx="60" cy="60" r="48" strokeWidth="8" fill="none" stroke="url(#rg)" strokeLinecap="round" />
                <g className="ring-center">
                    <circle className="ring-center-fill" cx="60" cy="60" r="24" />
                    {phase === "success" ? (
                        <g className="center-check" aria-hidden>
                            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </g>
                    ) : (
                        <g className="center-lock" aria-hidden>
                            <path d="M6 10v-2a6 6 0 0112 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <rect x="6" y="10" width="12" height="8" rx="2.2" stroke="white" strokeWidth="1.6" fill="none" />
                        </g>
                    )}
                </g>
            </svg>
        </div>
    );
}
function SuccessGlints({ show = false, styles = [] }) {
    const items = new Array(18).fill(0);
    return (
        <div aria-hidden className={`glints ${show ? "show" : ""}`}>
            {items.map((_, i) => <span key={i} className={`glint glint-${i}`} />)}
            {show && <div className="confetti" aria-hidden>{Array.from({ length: 28 }).map((_, i) => <b key={i} className={`cf cf-${i}`} style={styles[i] || undefined} />)}</div>}
        </div>
    );
}
function generateConfettiStyles(n = 20) {
    const colors = ["#ffd28a", "#f6d89b", "#d39a2f", "#c28b2c", "#fff6e8", "#e9cf9a"];
    return Array.from({ length: n }).map(() => {
        const x = Math.round(8 + Math.random() * 84);
        const y = Math.round(6 + Math.random() * 26);
        const s = (0.75 + Math.random() * 1.1).toFixed(2);
        const r = Math.round(Math.random() * 360);
        const bg = colors[Math.floor(Math.random() * colors.length)];
        return { left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg) scale(${s})`, background: bg };
    });
}



