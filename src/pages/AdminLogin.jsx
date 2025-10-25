import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AdminLogin.css";

const AUTH_BYPASS = true;

function fauxJwtForDemo(email = "admin@solymus.example") {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
        JSON.stringify({
            iss: "solymus-demo",
            sub: email,
            name: "Demo Admin",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
            role: "admin",
        })
    );
    const signature = btoa("demo-signature");
    return `${header}.${payload}.${signature}`;
}

function parseJwtPayload(token) {
    try {
        const parts = (token || "").split(".");
        if (parts.length < 2) return null;
        return JSON.parse(atob(parts[1]));
    } catch {
        return null;
    }
}

export default function AdminLogin() {
    const navigate = useNavigate();
    const emailRef = useRef(null);
    const tokenRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [demoMode, setDemoMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pwStrength, setPwStrength] = useState(0);
    const [successPulse, setSuccessPulse] = useState(false);
    const [revealedToken, setRevealedToken] = useState("");
    const [copied, setCopied] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem("admin_theme") || "light");

    const [tokenExpiresIn, setTokenExpiresIn] = useState(null);

    const [lastLogin, setLastLogin] = useState(null);

    useEffect(() => {
        emailRef.current?.focus?.();
        try {
            const last = localStorage.getItem("admin_last_login");
            if (last) setLastLogin(new Date(Number(last)));
        } catch { }
        document.documentElement.setAttribute("data-theme", theme);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("admin_theme", theme);
    }, [theme]);

    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
                e.preventDefault();
                emailRef.current?.focus?.();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        let score = 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        setPwStrength(score);
    }, [password]);

    useEffect(() => {
        if (!revealedToken) {
            setTokenExpiresIn(null);
            return;
        }
        const p = parseJwtPayload(revealedToken);
        if (!p || !p.exp) {
            setTokenExpiresIn(null);
            return;
        }
        function tick() {
            const now = Math.floor(Date.now() / 1000);
            const ttl = p.exp - now;
            setTokenExpiresIn(ttl > 0 ? ttl : 0);
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [revealedToken]);

    function formatSeconds(s) {
        if (s == null) return "—";
        if (s <= 0) return "Expired";
        if (s < 60) return `${s}s`;
        if (s < 3600) {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}m ${sec}s`;
        }
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setRevealedToken("");
        setCopied(false);

        if (!email.trim() || !password) {
            setError("Please provide both email and password.");
            return;
        }

        if (AUTH_BYPASS) {
            setLoading(true);
            const token = fauxJwtForDemo(email || "admin@solymus.example");
            try {
                if (remember) localStorage.setItem("admin_jwt", token);
                else sessionStorage.setItem("admin_jwt", token);
                localStorage.setItem("admin_last_login", String(Date.now()));
            } catch { }
            setTimeout(() => {
                setLoading(false);
                setSuccessPulse(true);
                setTimeout(() => {
                    setSuccessPulse(false);
                    navigate("/admin/dashboard");
                }, 400);
            }, 350);
            return;
        }

        if (demoMode) {
            setLoading(true);
            setTimeout(() => {
                const token = fauxJwtForDemo(email);
                try {
                    if (remember) localStorage.setItem("admin_jwt", token);
                    else sessionStorage.setItem("admin_jwt", token);
                    localStorage.setItem("admin_last_login", String(Date.now()));
                } catch { }
                setLoading(false);
                setSuccessPulse(true);
                setRevealedToken(token);
                setTimeout(() => {
                    setSuccessPulse(false);
                    navigate("/admin");
                }, 850);
            }, 520);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                credentials: "omit",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                let msg = "Authentication failed — check credentials.";
                try {
                    const j = await res.json();
                    msg = j?.message || msg;
                } catch { }
                setError(msg);
                setLoading(false);
                return;
            }

            const j = await res.json();
            const token = j?.token;
            if (!token) {
                setError("Malformed server response (no token).");
                setLoading(false);
                return;
            }

            try {
                if (remember) localStorage.setItem("admin_jwt", token);
                else sessionStorage.setItem("admin_jwt", token);
                localStorage.setItem("admin_last_login", String(Date.now()));
            } catch { }

            setLoading(false);
            setSuccessPulse(true);
            setTimeout(() => {
                setSuccessPulse(false);
                navigate("/admin");
            }, 750);
        } catch (err) {
            console.error(err);
            setError("Network error — try again.");
            setLoading(false);
        }
    }

    function revealDemoToken() {
        if (!demoMode) {
            setError("Enable demo mode to generate a demo token.");
            setTimeout(() => setError(""), 1600);
            return;
        }
        const token = fauxJwtForDemo(email || "admin@solymus.example");
        setRevealedToken(token);
        try {
            navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { }
        setTimeout(() => tokenRef.current?.focus?.(), 120);
    }

    function copyStoredToken() {
        try {
            const t = localStorage.getItem("admin_jwt") || sessionStorage.getItem("admin_jwt") || "";
            if (!t) {
                setError("No token in storage.");
                setTimeout(() => setError(""), 1400);
                return;
            }
            navigator.clipboard.writeText(t);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        } catch {
            setError("Could not copy token.");
            setTimeout(() => setError(""), 1400);
        }
    }

    return (
        <div className={`admin-root ${successPulse ? "success-mode" : ""}`} role="main" aria-labelledby="admin-heading">
            <div className="admin-backdrop" aria-hidden />
            <div className="paper-crease" aria-hidden />

            <div className={`admin-card ${successPulse ? "pulse" : ""}`} role="region" aria-label="Admin authentication">
                <aside className="left-panel" aria-hidden>
                    <div className="left-inner">
                        <div className="crest" aria-hidden>
                            <svg viewBox="0 0 36 36" width="72" height="72" aria-hidden>
                                <defs>
                                    <linearGradient id="lgA" x1="0" x2="1" y1="0" y2="1">
                                        <stop offset="0" stopColor="#caa24a" />
                                        <stop offset="1" stopColor="#f7e3b0" />
                                    </linearGradient>
                                    <filter id="gblur"><feGaussianBlur stdDeviation="6" result="b" /><feBlend in="SourceGraphic" in2="b" /></filter>
                                </defs>
                                <circle cx="18" cy="18" r="16" fill="url(#lgA)" filter="url(#gblur)" />
                                <path d="M10 20c2-3 6-6 8-6s6 2 8 6" stroke="#1b2623" strokeWidth="1.2" fill="none" />
                            </svg>
                        </div>

                        <div className="brand">
                            <div className="brand-name">Solymus</div>
                            <div className="brand-sub">Administrative Portal</div>
                        </div>

                        <div className="tagline">Discretion. Service. Resolve.</div>

                        <div className="security-note" role="note">
                            <strong>Security guidance</strong>
                            <p className="muted">Prefer HttpOnly cookies and server refresh tokens in production. This demo stores tokens client-side.</p>
                        </div>

                        <div className="meta">
                            <div className="meta-row">
                                <div className="meta-item">
                                    <div className="meta-key">Last sign-in</div>
                                    <div className="meta-val">{lastLogin ? lastLogin.toLocaleString() : "—"}</div>
                                </div>
                                <div className="meta-item">
                                    <div className="meta-key">Mode</div>
                                    <div className="meta-val">{demoMode ? "Demo" : "Production"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="left-cta">
                            <button
                                type="button"
                                className={`btn-toggle ${demoMode ? "on" : ""}`}
                                onClick={() => setDemoMode((d) => !d)}
                                aria-pressed={demoMode}
                                aria-label="Toggle demo mode"
                            >
                                {demoMode ? "Demo: ON" : "Enable Demo"}
                            </button>
                        </div>

                        <div className="hint">
                            <small>Try demo credentials:<br /><strong>admin@solymus.example / Password123!</strong></small>
                        </div>

                        <div className="theme-row">
                            <label className="theme-toggle">
                                <input
                                    type="checkbox"
                                    checked={theme === "dark"}
                                    onChange={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                                />
                                <span>{theme === "dark" ? "Dark" : "Light"} theme</span>
                            </label>
                        </div>

                        <div className="left-foot">Admin actions are auditable. Use credentials responsibly.</div>
                    </div>
                </aside>

                <main className="right-main">
                    <header className="head">
                        <h1 id="admin-heading">Administrator sign in</h1>
                        <p className="lead">Privileged access — enter your credentials to continue.</p>
                    </header>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <label className="field">
                            <span className="field-label">Email</span>
                            <div className="input-wrap">
                                <span className="left-icon" aria-hidden>✉️</span>
                                <input
                                    ref={emailRef}
                                    type="email"
                                    className="input"
                                    placeholder="admin@solymus.example"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="username"
                                    required
                                    aria-label="Admin email"
                                />
                            </div>
                        </label>

                        <label className="field">
                            <div className="field-top">
                                <span className="field-label">Password</span>
                                <div className="tiny-links">
                                    <button
                                        type="button"
                                        className="linkish"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-pressed={showPassword}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                    <Link to="/admin/forgot" className="linkish">Forgot?</Link>
                                </div>
                            </div>

                            <div className="input-wrap">
                                <span className="left-icon" aria-hidden>🔒</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input"
                                    placeholder="●●●●●●●●"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    aria-label="Admin password"
                                />

                                <div className={`pw-meter pw-${pwStrength}`} aria-hidden>
                                    <span /><span /><span /><span />
                                </div>
                            </div>

                            <div className="pw-hint">{password ? `Strength: ${["Too weak", "Weak", "Fair", "Strong", "Excellent"][pwStrength]}` : "Use 8+ characters, include numbers & symbols."}</div>
                        </label>

                        <div className="toggles">
                            <label className="chk">
                                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} aria-label="Remember me" />
                                <span>Remember me</span>
                            </label>

                            <label className="chk">
                                <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} aria-label="Demo mode" />
                                <span>Demo mode</span>
                            </label>
                        </div>

                        {error && <div className="form-error" role="alert" aria-live="assertive">{error}</div>}

                        <div className="actions">
                            <button className="btn-primary" type="submit" disabled={loading} aria-busy={loading}>
                                <span className="emoji" aria-hidden>🕴</span>
                                <span>{loading ? "Signing in…" : "Sign in"}</span>
                            </button>

                            <Link to="/" className="btn-ghost" aria-label="Return to site">Back to site</Link>

                            <button
                                type="button"
                                className="btn-sso"
                                onClick={() => setError("SSO is not configured in this demo.")}
                                title="Sign in with SSO (placeholder)"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M12 2v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                <span>Sign in with SSO</span>
                            </button>
                        </div>

                        <div className="form-note">
                            <small>This demo stores tokens client-side. Harden authentication in production (HttpOnly cookies, refresh tokens).</small>
                        </div>

                        {demoMode && (
                            <div className="demo-token">
                                <div className="token-actions">
                                    <button type="button" className="btn-outline small" onClick={revealDemoToken}>
                                        Reveal demo token
                                    </button>

                                    <button type="button" className="btn-outline small" onClick={copyStoredToken}>
                                        Copy stored token
                                    </button>

                                    <div className={`copy-badge ${copied ? "visible" : ""}`} aria-hidden>{copied ? "Copied" : ""}</div>
                                </div>

                                {revealedToken && (
                                    <div className="token-area">
                                        <textarea
                                            ref={tokenRef}
                                            className="token-box"
                                            value={revealedToken}
                                            readOnly
                                            aria-label="Demo token"
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <div className="token-meta">
                                            <div className="token-exp">Expires in: <strong>{formatSeconds(tokenExpiresIn)}</strong></div>
                                            <button
                                                type="button"
                                                className="btn-outline small"
                                                onClick={() => { navigator.clipboard.writeText(revealedToken); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                            >
                                                Copy token
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </main>
            </div>

            <div className={`success-overlay ${successPulse ? "show" : ""}`} aria-hidden>
                <div className="success-card" role="presentation">
                    <svg width="72" height="72" viewBox="0 0 24 24" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="#f7e3b0" opacity="0.14"></circle>
                        <path d="M7 13l2.5 2L17 8" stroke="#b78628" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                    <div className="success-text">Signed in</div>
                </div>

            </div>

            <footer className="admin-footer">© {new Date().getFullYear()} Solymus — Crafted with care</footer>
        </div>
    );
}
