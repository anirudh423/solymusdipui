

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/solymus-settings.css";

const STORAGE_KEY = "solymus_settings_v1";
const VIEW_KEY = "solymus_settings_view_v1";

const seed = {
    seo: {
        title: "Your site title here — Solymus",
        description: "Crafted insurance policies and thoughtful experiences.",
        canonical: "https://www.example.com/",
        noindex: false,
        ogTitle: "Solymus — Insurance elevated",
        ogDescription: "Experience the craft of a perfectly tailored policy.",
        ogImage: "",
        jsonLd: "",
    },
    sitemap: {
        urls: [
            { loc: "/", priority: 1.0 },
            { loc: "/quote-summary", priority: 0.9 },
            { loc: "/policy-purchase", priority: 0.8 },
        ],
    },
    robots: {
        content: `User-agent: *\nAllow: /\nSitemap: https://www.example.com/sitemap.xml\n`,
    },
    analytics: { gaId: "", enabled: false },
    publishedAt: null,
    updatedAt: new Date().toISOString(),
};

function computeSeoScore(seo) {
    let score = 0;
    if (seo.title && seo.title.length >= 40 && seo.title.length <= 70) score += 32;
    else if (seo.title && seo.title.length > 0) score += 14;
    if (seo.description && seo.description.length >= 70 && seo.description.length <= 160) score += 32;
    else if (seo.description && seo.description.length > 0) score += 12;
    if (seo.canonical && seo.canonical.startsWith("http")) score += 12;
    if (seo.ogImage) score += 8;
    if (seo.jsonLd && seo.jsonLd.trim().length > 20) score += 4;
    return Math.min(100, score);
}

function isValidUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === "https:" || u.protocol === "http:";
    } catch {
        return false;
    }
}

function Crest({ size = 48 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
                <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0" stopColor="#d39a2f" />
                    <stop offset="1" stopColor="#f6d89b" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="10" fill="url(#g1)" />
            <path d="M14 30c0-6 10-10 10-14s10 0 10 4v8" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconButton({ children, title, onClick, className = "" }) {
    return (
        <button className={`icon-btn ${className}`} title={title} onClick={onClick} aria-label={title}>
            {children}
        </button>
    );
}

function OGImageUploader({ value, onChange }) {
    const [hover, setHover] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(value || "");
    const fileRef = useRef();

    useEffect(() => setPreview(value || ""), [value]);

    function handleFiles(file) {
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = ev.target.result;
            setPreview(data);
            onChange && onChange(data);
            setLoading(false);
        };
        reader.onerror = () => setLoading(false);
        reader.readAsDataURL(file);
    }

    function onDrop(e) {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        handleFiles(f);
    }

    function onPaste(e) {
        const items = e.clipboardData?.items || [];
        for (const it of items) {
            if (it.type?.startsWith("image/")) {
                const file = it.getAsFile();
                handleFiles(file);
                return;
            }
        }
    }

    return (
        <div
            className={`og-uploader dropzone ${hover ? "hover" : ""}`}
            onDrop={onDrop}
            onDragOver={(e) => {
                e.preventDefault();
                setHover(true);
            }}
            onDragLeave={() => setHover(false)}
            onPaste={onPaste}
            aria-label="Open Graph image uploader"
        >
            {preview ? (
                <div className="og-thumb">
                    <img src={preview} alt="OG preview" />
                </div>
            ) : (
                <div className="og-empty">
                    <div className="og-empty-title">Drop image or click to upload</div>
                    <div className="og-empty-sub">PNG / JPG — Paste or choose file. Recommended 1200×630px.</div>
                </div>
            )}

            <div className="og-actions">
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files?.[0])} />
                <button className="btn-ghost" onClick={() => fileRef.current?.click()} aria-label="Upload OG image">
                    {preview ? "Replace" : "Upload"}
                </button>
                {preview && (
                    <>
                        <button
                            className="btn-outline"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard?.writeText(preview);
                                } catch { }
                            }}
                            title="Copy data URL"
                        >
                            Copy URL
                        </button>
                        <button
                            className="btn-danger"
                            onClick={() => {
                                setPreview("");
                                onChange && onChange("");
                            }}
                        >
                            Remove
                        </button>
                    </>
                )}
            </div>
            {loading && <div className="uploading">Uploading…</div>}
        </div>
    );
}

function Modal({ open, onClose, children, title }) {
    if (!open) return null;
    return (
        <div className="preview-overlay" role="dialog" aria-modal="true" aria-label={title || "Dialog"}>
            <div className="preview-card modal-glass">
                <div className="drawer-head" style={{ borderBottom: "none" }}>
                    <div style={{ fontWeight: 900 }}>{title}</div>
                    <button className="btn-ghost" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>
                <div className="drawer-body">{children}</div>
            </div>
        </div>
    );
}

export default function AdminSettings() {
    const [data, setData] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed;
        } catch {
            return seed;
        }
    });

    const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_KEY) || "forms");
    const [toast, setToast] = useState(null);
    const [previewPanel, setPreviewPanel] = useState("search");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const fileRef = useRef();

    useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data]);
    useEffect(() => localStorage.setItem(VIEW_KEY, viewMode), [viewMode]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3800);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                setToast({ type: "success", text: "Saved" });
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [data]);

    function setPatch(path, value) {
        setData((s) => {
            const next = { ...s };
            const keys = path.split(".");
            let cur = next;
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                cur[k] = { ...(cur[k] || {}) };
                cur = cur[k];
            }
            cur[keys[keys.length - 1]] = value;
            next.updatedAt = new Date().toISOString();
            return next;
        });
    }

    function addSitemapUrl() {
        const url = { loc: "/new-page", priority: 0.5 };
        setData((s) => ({ ...s, sitemap: { urls: [url, ...(s.sitemap?.urls || [])] } }));
        setToast({
            type: "success", text: "Added sitemap entry", undo: () => {
                setData((s) => ({ ...s, sitemap: { urls: s.sitemap.urls.slice(1) } }));
                setToast({ type: "info", text: "Undo: entry removed" });
            }
        });
    }

    function removeSitemapUrl(idx) {
        setData((s) => ({ ...s, sitemap: { urls: s.sitemap.urls.filter((_, i) => i !== idx) } }));
        setToast({ type: "success", text: "Removed" });
    }

    function updateSitemapUrl(idx, patchObj) {
        setData((s) => ({ ...s, sitemap: { urls: s.sitemap.urls.map((u, i) => (i === idx ? { ...u, ...patchObj } : u)) } }));
    }

    function downloadFile(filename, content, type = "text/plain") {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: `Downloaded ${filename}` });
    }

    function generateSitemapXml() {
        const host = (new URL(data.seo.canonical || window.location.origin)).origin;
        const urls = (data.sitemap?.urls || [])
            .map((u) => {
                const loc = u.loc.startsWith("http") ? u.loc : `${host.replace(/\/$/, "")}${u.loc.startsWith("/") ? "" : "/"}${u.loc}`;
                const lastmod = new Date().toISOString();
                const changefreq = u.changefreq || "weekly";
                const priority = typeof u.priority === "number" ? u.priority.toFixed(1) : (u.priority || 0.5);
                return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
            })
            .join("\n");
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    }

    function handleDownloadSitemap() {
        const xml = generateSitemapXml();
        downloadFile("sitemap.xml", xml, "application/xml");
    }

    function handleDownloadRobots() {
        downloadFile("robots.txt", data.robots.content, "text/plain");
    }

    function exportJSON() {
        const blob = JSON.stringify(data, null, 2);
        downloadFile(`solymus-settings-${new Date().toISOString().slice(0, 10)}.json`, blob, "application/json");
    }

    function importJSON(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                setData(parsed);
                setToast({ type: "success", text: "Imported settings" });
            } catch {
                setToast({ type: "error", text: "Invalid JSON" });
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    }

    function handleReset() {
        if (!confirm("Reset settings to defaults?")) return;
        setData(seed);
        setToast({ type: "success", text: "Reset" });
    }

    function handlePublish() {
        setConfirmOpen(true);
    }

    function confirmPublish() {
        setData((d) => ({ ...d, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
        setConfirmOpen(false);
        setToast({ type: "success", text: "Published" });
    }

    const seoScore = useMemo(() => computeSeoScore(data.seo || {}), [data.seo]);
    const titleLen = (data.seo?.title || "").length;
    const descLen = (data.seo?.description || "").length;
    const canonicalValid = useMemo(() => isValidUrl(data.seo?.canonical || ""), [data.seo?.canonical]);

    async function copyMeta() {
        const meta = [
            `<title>${data.seo?.title || ""}</title>`,
            `<meta name="description" content="${(data.seo?.description || "").replace(/\"/g, "&quot;")}" />`,
            `<link rel="canonical" href="${data.seo?.canonical || ""}" />`,
        ].join("\n");
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(meta);
            setToast({ type: "success", text: "Meta tags copied" });
        } else {
            setToast({ type: "error", text: "Clipboard not available" });
        }
    }

    function openOgImage() {
        if (!data.seo?.ogImage) return setToast({ type: "error", text: "No OG image set" });
        setImageOpen(true);
    }

    return (
        <div className="dash-root insurers-luxe luxe-theme settings-page luxe-king">
            <aside className="left-nav">
                <div className="nav-brand">
                    <div className="nav-crest-wrap">
                        <Crest size={44} />
                    </div>
                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Site Settings</div>
                    </div>
                </div>

                <nav className="nav-links" aria-label="Admin navigation">
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link ">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/claims" className="nav-link">Claims</Link>
                    <Link to="/admin/leads" className="nav-link ">Leads</Link>
                    <Link to='/admin/quote-pricing' className="nav-link ">Quote Pricing</Link>
                    <Link to="/admin/chatbot" className="nav-link">Chatbot</Link>
                    <Link to="/admin/settings" className="nav-link active">Settings</Link>
                                        <Link to= "/admin/logout" className="nav-link">Logout</Link>
                    
                </nav>

                <div className="nav-foot small muted">Local storage: {STORAGE_KEY}</div>
            </aside>

            <main className="main-area">
                <div className="header-hero hero-luxe" role="region" aria-labelledby="settings-title">
                    <div className="hero-left">
                        <div className="hero-badge">Site</div>
                        <div className="hero-title-wrap">
                            <h1 id="settings-title" className="hero-title">Site settings & SEO</h1>
                            <div className="hero-subtle">Craft the public face — metadata, sitemaps, robots and analytics.</div>
                        </div>
                        <p className="hero-sub">Don Draper thought in stories. Make your site's story clear at a glance.</p>

                        <div className="filter-row">
                            <div className={`chip clickable`} onClick={() => setViewMode("forms")} data-active={viewMode === "forms"}>Forms</div>
                            <div className={`chip clickable`} onClick={() => setViewMode("preview")} data-active={viewMode === "preview"}>Preview</div>
                            <div style={{ marginLeft: "auto" }} />
                            <div className="chip result-chip">Updated: {new Date(data.updatedAt).toLocaleString()}</div>
                        </div>

                        <div className="hero-meta-row">
                            <div className="seo-score">
                                <div className="score-ring" aria-hidden>
                                    <svg viewBox="0 0 36 36">
                                        <path className="bg" d="M18 2a16 16 0 1 0 0 32"></path>
                                        <path className="meter" d="M18 2a16 16 0 1 0 0 32" style={{ strokeDasharray: `${seoScore},100` }}></path>
                                    </svg>
                                </div>
                                <div className="score-label">{seoScore}%</div>
                            </div>

                            <div className="status-block">
                                <div className="muted small">Status</div>
                                <div className="status-row">
                                    <div className={`badge ${data.publishedAt ? "status-active" : "status-muted"}`}>{data.publishedAt ? "Published" : "Draft"}</div>
                                    <div className="small muted" aria-live="polite" style={{ marginLeft: 8 }}>
                                        {JSON.stringify(data) !== JSON.stringify(seed) ? "Customised" : "Default"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="kpi-tiles" aria-hidden>
                            <div className="kpi-tile">
                                <div className="kpi-label">Pages</div>
                                <div className="kpi-number">{data.sitemap?.urls?.length || 0}</div>
                                <div className="kpi-sub muted">Sitemap entries</div>
                            </div>

                            <div className="kpi-tile">
                                <div className="kpi-label">Analytics</div>
                                <div className="kpi-number">{data.analytics?.enabled ? "Active" : "Off"}</div>
                                <div className="kpi-sub muted">Google analytics</div>
                            </div>

                            <div className="kpi-tile kpi-note">
                                <div className="kpi-label">Tone</div>
                                <div className="kpi-number">Luxe</div>
                                <div className="kpi-sub muted">Don Draper palette</div>
                            </div>
                        </div>

                        <div className="action-row">
                            <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
                            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>＋ Import</button>
                            <button className="btn-outline" onClick={exportJSON}>Export</button>
                            <button className="btn-outline" onClick={handleDownloadSitemap}>Download sitemap</button>
                            <button className="btn-outline" onClick={handleDownloadRobots}>Download robots</button>
                        </div>

                        <div className="controls-bottom">
                            <select className="small-select" value={data.analytics?.enabled ? "on" : "off"} onChange={(e) => setPatch("analytics.enabled", e.target.value === "on")} aria-label="Analytics toggle">
                                <option value="on">Analytics On</option>
                                <option value="off">Analytics Off</option>
                            </select>

                            <button
                                className="btn-primary"
                                onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setToast({ type: "success", text: "Saved" }); }}
                                style={{ marginLeft: 8 }}
                                aria-label="Save settings"
                            >
                                Save
                            </button>

                            <button className="btn-outline" style={{ marginLeft: 8 }} onClick={handlePublish} aria-label="Publish settings">Publish</button>
                        </div>

                        <div className="hero-foot muted small" style={{ marginTop: 12 }}>
                            Tip: aim for 50–70 chars in title and 70–160 in description for best SEO reach.
                        </div>
                    </div>
                </div>

                <div className="settings-grid">
                    <div className="bento-card panel seo-card">
                        <div className="card-head">
                            <div className="card-title">SEO & meta</div>
                            <div className="card-actions">
                                <button className="btn-outline" onClick={() => { setData((s) => ({ ...s, seo: seed.seo })); setToast({ type: "success", text: "SEO defaults restored" }); }}>Reset</button>
                                <button className="btn-primary" onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setToast({ type: "success", text: "Saved" }); }} style={{ marginLeft: 8 }}>Save</button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="seo-form">
                                <div className="form-row">
                                    <label className="field-label">Title <span className="muted small">• {titleLen} chars</span></label>
                                    <input className="input input-hero" value={data.seo?.title || ""} onChange={(e) => setPatch("seo.title", e.target.value)} maxLength={120} />
                                    <div className="charmeter">
                                        <div className={`bar ${titleLen > 70 ? "warn" : titleLen >= 40 ? "good" : "ok"}`} style={{ width: Math.min(100, (titleLen / 70) * 100) + "%" }} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <label className="field-label">Description <span className="muted small">• {descLen} chars</span></label>
                                    <textarea className="textarea" rows={3} value={data.seo?.description || ""} onChange={(e) => setPatch("seo.description", e.target.value)} maxLength={320} />
                                    <div className="charmeter">
                                        <div className={`bar ${descLen > 160 ? "warn" : descLen >= 70 ? "good" : "ok"}`} style={{ width: Math.min(100, (descLen / 160) * 100) + "%" }} />
                                    </div>
                                </div>

                                <div className="form-row two-col">
                                    <div>
                                        <label className="field-label">Canonical URL</label>
                                        <input className={`input ${data.seo?.canonical && !isValidUrl(data.seo?.canonical) ? "input-error" : ""}`} value={data.seo?.canonical || ""} onChange={(e) => setPatch("seo.canonical", e.target.value)} />
                                        <div className="small muted" style={{ marginTop: 6 }}>{data.seo?.canonical ? (canonicalValid ? "Canonical looks OK" : "Invalid URL — should start with http(s)://") : "No canonical set"}</div>
                                    </div>

                                    <div>
                                        <label className="field-label">No-index</label>
                                        <div style={{ marginTop: 8 }}>
                                            <label className="chip clickable" style={{ display: "inline-flex", gap: 8 }} data-active={data.seo?.noindex}>
                                                <input type="checkbox" checked={!!data.seo?.noindex} onChange={(e) => setPatch("seo.noindex", e.target.checked)} /> Prevent indexing
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row two-col">
                                    <div>
                                        <label className="field-label">Open Graph title</label>
                                        <input className="input" value={data.seo?.ogTitle || ""} onChange={(e) => setPatch("seo.ogTitle", e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="field-label">OG image</label>
                                        <OGImageUploader value={data.seo?.ogImage || ""} onChange={(v) => setPatch("seo.ogImage", v)} />
                                        <div className="small muted" style={{ marginTop: 8 }}>
                                            Use an evocative, high-res image — recommended 1200×630px. <button className="btn-ghost" onClick={openOgImage} style={{ marginLeft: 8 }}>Preview</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <label className="field-label">JSON-LD (structured data)</label>
                                    <textarea className="textarea mono" rows={6} value={data.seo?.jsonLd || ""} onChange={(e) => setPatch("seo.jsonLd", e.target.value)} placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Organization"\n}`} />
                                </div>
                            </div>

                            <aside className="seo-side">
                                <div className="seo-preview">
                                    <div className="preview-head">
                                        <div className="seo-label">Search preview</div>
                                        <div className="preview-actions">
                                            <button className="btn-ghost" onClick={() => setPreviewPanel("search")}>Search</button>
                                            <button className="btn-ghost" onClick={() => setPreviewPanel("og")}>OG</button>
                                            <button className="btn-ghost" onClick={() => setPreviewPanel("jsonld")}>JSON-LD</button>
                                            <button className="btn-outline" onClick={copyMeta}>Copy meta</button>
                                        </div>
                                    </div>

                                    {previewPanel === "search" && (
                                        <div className="seo-snippet bento-card">
                                            <div className="seo-title">{data.seo?.title || "—"}</div>
                                            <div className="seo-url muted small">{data.seo?.canonical || window.location.origin}</div>
                                            <div className="seo-desc muted small">{data.seo?.description || "—"}</div>
                                        </div>
                                    )}

                                    {previewPanel === "og" && (
                                        <div>
                                            <div className="muted small">Open Graph preview</div>
                                            <div className="og-card bento-card">
                                                <div className="og-media" style={{ backgroundImage: data.seo?.ogImage ? `url(${data.seo.ogImage})` : undefined }} />
                                                <div className="og-body">
                                                    <div className="og-title">{data.seo?.ogTitle || data.seo?.title}</div>
                                                    <div className="og-desc muted small">{data.seo?.ogDescription || data.seo?.description}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {previewPanel === "jsonld" && (
                                        <div>
                                            <div className="muted small">JSON-LD (preview)</div>
                                            <pre className="bento-card json-preview">{data.seo?.jsonLd || "No JSON-LD provided"}</pre>
                                        </div>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </div>

                    <div className="bento-card panel">
                        <div className="card-head">
                            <div className="card-title">Sitemap</div>
                            <div>
                                <button className="btn-ghost" onClick={addSitemapUrl}>＋ Add</button>
                                <button className="btn-outline" onClick={handleDownloadSitemap} style={{ marginLeft: 8 }}>Download</button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="sitemap-list">
                                {(data.sitemap?.urls || []).map((u, idx) => (
                                    <div key={idx} className="file-row">
                                        <div style={{ flex: 1 }}>
                                            <input className="input" value={u.loc} onChange={(e) => updateSitemapUrl(idx, { loc: e.target.value })} />
                                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                <input className="input tiny" value={u.priority} onChange={(e) => updateSitemapUrl(idx, { priority: Number(e.target.value) || 0.5 })} />
                                                <input className="input tiny" placeholder="changefreq" value={u.changefreq || "weekly"} onChange={(e) => updateSitemapUrl(idx, { changefreq: e.target.value })} />
                                            </div>
                                        </div>

                                        <div style={{ marginLeft: 8 }}>
                                            <button className="btn-ghost" onClick={() => removeSitemapUrl(idx)}>Delete</button>
                                        </div>
                                    </div>
                                ))}

                                {(!data.sitemap?.urls || data.sitemap.urls.length === 0) && <div className="muted">No sitemap entries. Add pages to publish in your sitemap.</div>}
                            </div>
                        </div>
                    </div>

                    <div className="bento-card panel" style={{ gridColumn: "1 / -1" }}>
                        <div className="card-head">
                            <div className="card-title">robots.txt</div>
                            <div>
                                <button className="btn-outline" onClick={() => { navigator.clipboard?.writeText(data.robots.content); setToast({ type: "success", text: "Copied" }); }}>Copy</button>
                                <button className="btn-primary" onClick={handleDownloadRobots} style={{ marginLeft: 8 }}>Download</button>
                            </div>
                        </div>

                        <div className="card-body">
                            <textarea className="textarea mono robots-editor" rows={6} value={data.robots?.content || ""} onChange={(e) => setPatch("robots.content", e.target.value)} />
                        </div>
                    </div>

                    <div className="bento-card panel" style={{ gridColumn: "1 / -1" }}>
                        <div className="card-head">
                            <div className="card-title">Analytics</div>
                            <div>
                                <button className="btn-outline" onClick={() => { setPatch("analytics", seed.analytics); setToast({ type: "success", text: "Analytics defaults" }); }}>Reset</button>
                                <button className="btn-primary" onClick={() => { setToast({ type: "success", text: "Analytics saved" }); localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }} style={{ marginLeft: 8 }}>Save</button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="form-row">
                                <label className="field-label">Google Analytics (GA4) Measurement ID</label>
                                <input className="input" value={data.analytics?.gaId || ""} onChange={(e) => setPatch("analytics.gaId", e.target.value)} placeholder="G-XXXXXXXXXX" />
                            </div>

                            <div className="form-row">
                                <label className="field-label">Enable (inject gtag.js)</label>
                                <div style={{ marginTop: 8 }}>
                                    <label className="chip clickable" style={{ display: "inline-flex", gap: 8 }} data-active={data.analytics?.enabled}>
                                        <input type="checkbox" checked={!!data.analytics?.enabled} onChange={(e) => setPatch("analytics.enabled", e.target.checked)} /> Inject
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginTop: 12 }} className="muted small">Note: This UI stores the analytics id and toggle. To inject GA4 script load the snippet server-side or at build-time using these settings.</div>
                        </div>
                    </div>
                </div>

                {toast && (
                    <div
                        className={`toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`}
                        role="status"
                        aria-live="polite"
                        onClick={() => {
                            if (toast.undo) toast.undo();
                            setToast(null);
                        }}
                    >
                        <span style={{ marginRight: 8 }}>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div>{toast.text}</div>
                            {toast.undo && <div className="small muted">Click to undo</div>}
                        </div>
                    </div>
                )}

                <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Publish site settings">
                    <div style={{ marginTop: 8 }}>
                        <p className="muted">Publishing will mark current settings as live. This action can be rolled back by saving previous settings manually.</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                            <button className="btn-outline" onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmPublish}>Confirm publish</button>
                        </div>
                    </div>
                </Modal>

                <Modal open={imageOpen} onClose={() => setImageOpen(false)} title="OG image preview">
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {data.seo?.ogImage ? (
                            <img src={data.seo?.ogImage} alt="OG image preview" style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 30px 80px rgba(8,10,12,0.2)" }} />
                        ) : (
                            <div className="muted">No image URL provided</div>
                        )}
                    </div>
                </Modal>
            </main>
        </div>
    );
}
