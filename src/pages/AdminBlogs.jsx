import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";


const STORAGE_KEY = "solymus_blogs_v1";
const THEME_KEY = "solymus_theme_v1";
function uid(prefix = "b") {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
function slugify(t) {
    return (
        t
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
    ).slice(0, 120);
}

const sampleBlogs = [
    {
        id: "b_1001",
        title: "How to pick the right health policy in 2025",
        slug: "pick-right-health-policy-2025",
        author: "Demo Admin",
        status: "published",
        publishedAt: "2025-09-12",
        excerpt: "A practical guide to choosing health policies that fit your family and budget.",
        content:
            "<h2>Intro</h2><p>This is demo content for the article. Replace this with your CMS content (Markdown or HTML).</p><p><strong>Key tip:</strong> match coverage to needs, not price.</p>",
        seo: {
            title: "Pick the right health policy — Solymus",
            description: "Learn how to select the best health insurance for your needs in 2025.",
            canonical: "",
            keywords: "health insurance, policy, 2025",
        },
        tags: ["health", "guide"],
        featuredImage: null,
        views: 1320,
        likes: 18,
    },
    {
        id: "b_1002",
        title: "Policy reforms & coverage — what changed?",
        slug: "policy-reforms-coverage-changes",
        author: "Demo Admin",
        status: "draft",
        publishedAt: null,
        excerpt: "Quick summary of recent reforms affecting coverage.",
        content: "<p>Draft content here.</p>",
        seo: {
            title: "Policy reforms and coverage",
            description: "An explainer on recent changes to insurance coverage.",
            canonical: "",
            keywords: "policy, reforms",
        },
        tags: ["policy"],
        featuredImage: null,
        views: 84,
        likes: 3,
    },
];

function loadFromStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return sampleBlogs;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return sampleBlogs;
        return parsed;
    } catch (e) {
        console.warn("Failed to load blogs", e);
        return sampleBlogs;
    }
}
function saveToStore(arr) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
        console.warn("Failed to save blogs", e);
    }
}

function useToast() {
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 1800);
        return () => clearTimeout(id);
    }, [toast]);
    return [toast, setToast];
}

function KPI({ label, value, sub }) {
    return (
        <div className="kpi-chip" role="status" aria-label={`${label} ${value}`}>
            <div className="kpi-top">
                <div className="kpi-val">{value}</div>
                {sub && <div className="kpi-sub muted">{sub}</div>}
            </div>
            <div className="kpi-label muted">{label}</div>
        </div>
    );
}

function Avatar({ name = "User", size = 36 }) {
    const initials = (name || "U")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const hue =
        Math.abs(
            (name || "")
                .split("")
                .reduce((s, c) => s + (c.charCodeAt?.(0) || 0), 0)
        ) % 360;
    const bg = `linear-gradient(135deg, hsl(${hue} 55% 60%), hsl(${(hue + 35) % 360} 55% 70%))`;
    return (
        <div
            className="avatar"
            title={name}
            style={{ width: size, height: size, background: bg, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}
            aria-hidden
        >
            {initials}
        </div>
    );
}

function Sparkline({ value = 0, max = 1500 }) {
    const pts = Array.from({ length: 6 }).map((_, i) => {
        const t = i / 5;
        const jitter = Math.sin(i * 1.7) * 0.06;
        const v = Math.max(0, Math.min(1, (value / Math.max(1, max)) * (0.4 + t * 0.9) + jitter));
        return [i * 18 + 6, 36 - v * 28];
    });
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
    return (
        <svg className="sparkline" viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden style={{ width: 72, height: 28 }}>
            <defs>
                <linearGradient id="sg1" x1="0" x2="1">
                    <stop offset="0" stopColor="rgba(184,131,47,0.85)" />
                    <stop offset="1" stopColor="rgba(243,221,176,0.85)" />
                </linearGradient>
            </defs>
            <path d={path} fill="none" stroke="url(#sg1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SEOPreview({ seo }) {
    if (!seo) return null;
    const title = seo.title || "(Untitled)";
    const desc = seo.description || "No meta description set";
    const canonical = seo.canonical || "https://example.com/...";
    return (
        <div className="bento-card seo-preview compact">
            <div className="card-head">
                <div className="title">SEO preview</div>
                <div className="muted small">How it appears</div>
            </div>
            <div className="card-body" style={{ paddingTop: 10 }}>
                <div className="seo-google">
                    <div className="seo-title">{title}</div>
                    <div className="seo-url muted">{canonical}</div>
                    <div className="seo-desc muted small">{desc}</div>
                </div>
            </div>
        </div>
    );
}

function PreviewModal({ open, onClose, post }) {
    if (!open || !post) return null;
    return (
        <div className="preview-overlay" role="dialog" aria-modal>
            <div className="preview-card bento-card compact">
                <div className="preview-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div className="title">{post.title}</div>
                        <div className="muted small">{post.author} • {post.publishedAt || "Unpublished"}</div>
                    </div>
                    <div>
                        <button className="btn-ghost" onClick={onClose}>Close</button>
                    </div>
                </div>
                <div className="preview-body" style={{ marginTop: 10 }}>
                    {post.featuredImage && <img className="preview-hero" src={post.featuredImage} alt="featured" style={{ width: "100%", borderRadius: 8 }} />}
                    <div dangerouslySetInnerHTML={{ __html: post.content || "<p>(no content)</p>" }} />
                </div>
            </div>
        </div>
    );
}

function IconButton({ title, onClick, children, cls = "" }) {
    return (
        <button className={`action ${cls}`} title={title} onClick={onClick} aria-label={title}>
            {children}
        </button>
    );
}
function ActionGroup({ onEdit, onPreview, onDuplicate, onCopy, onDelete }) {
    return (
        <div className="action-menu" role="menu" aria-label="Actions" style={{ display: "flex", gap: 6 }}>
            <IconButton title="Edit" onClick={onEdit}>
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" /></svg>
            </IconButton>
            <IconButton title="Preview" onClick={onPreview}>🔍</IconButton>
            <IconButton title="Duplicate" onClick={onDuplicate}>⎘</IconButton>
            <IconButton title="Permalink" onClick={onCopy}>🔗</IconButton>
            <IconButton title="Delete" onClick={onDelete} cls="danger">🗑</IconButton>
        </div>
    );
}

function HelpModal({ open, onClose }) {
    if (!open) return null;
    return (
        <div className="preview-overlay" role="dialog" aria-modal>
            <div className="help-card bento-card compact">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div className="title">Keyboard shortcuts</div>
                        <div className="muted small" style={{ marginTop: 6 }}>Navigate quickly.</div>
                    </div>
                    <button className="btn-ghost" onClick={onClose}>Close</button>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                    <div className="muted small">Focus search</div><div className="kbd">/</div>
                    <div className="muted small">New post</div><div className="kbd">N</div>
                    <div className="muted small">Open help</div><div className="kbd">?</div>
                    <div className="muted small">Close drawers/modals</div><div className="kbd">Esc</div>
                </div>
            </div>
        </div>
    );
}

function EditorDrawer({ open, blog, onClose, onSave }) {
    const [form, setForm] = useState(blog || null);
    const fileRef = useRef(null);
    const dropRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasSavedDraft, setHasSavedDraft] = useState(false);

    useEffect(() => {
        setForm(blog ? { ...blog, seo: { ...(blog.seo || {}) }, tags: (blog.tags || []).slice() } : null);
        setLastSaved(null);
        setHasSavedDraft(false);
    }, [blog]);

    useEffect(() => {
        const el = dropRef.current;
        if (!el) return;
        function onDrag(e) { e.preventDefault(); e.stopPropagation(); setDragging(true); }
        function onLeave(e) { e.preventDefault(); e.stopPropagation(); setDragging(false); }
        function onDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pickImage(f);
        }
        el.addEventListener("dragover", onDrag);
        el.addEventListener("dragenter", onDrag);
        el.addEventListener("dragleave", onLeave);
        el.addEventListener("drop", onDrop);
        return () => {
            el.removeEventListener("dragover", onDrag);
            el.removeEventListener("dragenter", onDrag);
            el.removeEventListener("dragleave", onLeave);
            el.removeEventListener("drop", onDrop);
        };
    }, [dropRef.current]);

    useEffect(() => {
        if (!form) return;
        const key = `solymus_autosave_${form.id}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (JSON.stringify(parsed) !== JSON.stringify(form)) {
                    setHasSavedDraft(true);
                }
            }
        } catch (e) { }
    }, [form?.id]);

    useEffect(() => {
        if (!form) return;
        const key = `solymus_autosave_${form.id}`;
        let t = null;
        function doSave() {
            try {
                localStorage.setItem(key, JSON.stringify(form));
                setLastSaved(Date.now());
            } catch (e) { }
        }
        t = setTimeout(doSave, 600);
        return () => clearTimeout(t);
    }, [form]);

    function restoreAutosave() {
        if (!form) return;
        const key = `solymus_autosave_${form.id}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                setForm(parsed);
                setHasSavedDraft(false);
                setLastSaved(Date.now());
            }
        } catch (e) { }
    }

    if (!open || !form) return null;

    function update(path, value) {
        setForm((f) => {
            const next = { ...f };
            if (path.includes(".")) {
                const [a, b] = path.split(".");
                next[a] = { ...(next[a] || {}), [b]: value };
            } else next[path] = value;
            return next;
        });
    }
    function pickImage(file) {
        if (!file) return;
        const r = new FileReader();
        r.onload = (e) => update("featuredImage", e.target.result);
        r.readAsDataURL(file);
    }
    function addTagToForm(v) {
        const t = (v || "").trim();
        if (!t) return;
        setForm((f) => ({ ...f, tags: Array.from(new Set([...(f.tags || []), t])) }));
    }

    function formatSaved(ts) {
        if (!ts) return "Not saved yet";
        const s = Math.round((Date.now() - ts) / 1000);
        if (s < 5) return "Saved just now";
        if (s < 60) return `Saved ${s}s ago`;
        const m = Math.round(s / 60);
        return `Saved ${m}m ago`;
    }

    return (
        <aside className={`detail-drawer open compact`} style={{ right: 18 }} aria-hidden={!open}>
            <div className="drawer-head">
                <div>
                    <div className="drawer-title">{form.title || "New post"}</div>
                    <div style={{ fontSize: 12, color: "#8b8f98", marginTop: 4 }}>
                        {hasSavedDraft ? <span>Unsaved local draft — <button className="btn-outline small" onClick={restoreAutosave}>Restore</button></span> : null}
                        <span style={{ marginLeft: 8 }}>{formatSaved(lastSaved)}</span>
                    </div>
                </div>
                <div className="drawer-actions">
                    <button className="btn-ghost" onClick={onClose}>Close</button>
                </div>
            </div>

            <div className="drawer-body editor-2pane">
                <div className="editor-grid" style={{ gap: 12 }}>
                    <div className="editor-main">
                        <label className="muted">Title</label>
                        <input className="wide-input large" value={form.title} onChange={(e) => update("title", e.target.value)} />

                        <label className="muted" style={{ marginTop: 6 }}>Slug</label>
                        <input className="wide-input" value={form.slug || ""} onChange={(e) => update("slug", e.target.value)} placeholder="auto-generated from title" />

                        <div className="row-split" style={{ marginTop: 8 }}>
                            <div>
                                <label className="muted">Status</label>
                                <select className="wide-input" value={form.status} onChange={(e) => update("status", e.target.value)}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            <div>
                                <label className="muted">Published</label>
                                <input type="date" className="wide-input" value={form.publishedAt || ""} onChange={(e) => update("publishedAt", e.target.value)} />
                            </div>
                        </div>

                        <label className="muted" style={{ marginTop: 8 }}>Excerpt</label>
                        <textarea rows={2} className="wide-input" value={form.excerpt || ""} onChange={(e) => update("excerpt", e.target.value)} />

                        <label className="muted" style={{ marginTop: 8 }}>Content (HTML)</label>
                        <textarea rows={10} className="wide-input monospace content-input" value={form.content || ""} onChange={(e) => update("content", e.target.value)} />

                        <div className="editor-tools" style={{ marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn-primary" onClick={() => {
                                    const next = { ...form };
                                    if (!next.slug) next.slug = slugify(next.title || "untitled");
                                    if (next.status === "published" && !next.publishedAt) next.publishedAt = new Date().toISOString().slice(0, 10);
                                    onSave(next);
                                }}>Publish</button>

                                <button className="btn-outline" onClick={() => onSave({ ...form, status: "draft" })}>Save</button>
                                <button className="btn-ghost" onClick={() => update("content", "")}>Clear</button>
                            </div>
                        </div>
                    </div>

                    <div className="editor-side" style={{ width: 300 }}>
                        <div className="row small" style={{ alignItems: "center", gap: 8 }}>
                            <label className="muted">Author</label>
                            <Avatar name={form.author || "Demo Admin"} size={32} />
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <label className="muted">Tags</label>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                <input className="wide-input" placeholder="add tag and press Enter" onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault(); const v = e.target.value.trim(); if (v) { addTagToForm(v); e.target.value = ""; }
                                    }
                                }} />
                            </div>
                            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {(form.tags || []).map((t) => (
                                    <div key={t} className="badge small tag-pill">
                                        {t}
                                        <button className="tag-remove" onClick={() => update("tags", (form.tags || []).filter(x => x !== t))}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <label className="muted">Featured image</label>
                            <div ref={dropRef} className={`image-drop ${dragging ? "dragging" : ""}`} aria-label="Drop image here" style={{ borderRadius: 8, padding: 8 }}>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickImage(e.target.files?.[0])} />
                                <div className="drop-instructions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <button className="btn-outline small" onClick={() => fileRef.current?.click()}>Upload</button>
                                    <span className="muted small"> or drag</span>
                                </div>
                                {form.featuredImage && <div className="img-preview" style={{ marginTop: 8 }}><img src={form.featuredImage} alt="preview" style={{ width: "100%", borderRadius: 6 }} /></div>}
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <div className="muted">SEO</div>
                            <label className="muted" style={{ marginTop: 6 }}>Title</label>
                            <input className="wide-input" value={form.seo?.title || ""} onChange={(e) => update("seo.title", e.target.value)} />
                            <label className="muted" style={{ marginTop: 6 }}>Description</label>
                            <textarea rows={2} className="wide-input" value={form.seo?.description || ""} onChange={(e) => update("seo.description", e.target.value)} />
                            <label className="muted" style={{ marginTop: 6 }}>Canonical</label>
                            <input className="wide-input" value={form.seo?.canonical || ""} onChange={(e) => update("seo.canonical", e.target.value)} />
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <SEOPreview seo={form.seo} />
                        </div>
                    </div>
                </div>

                <div className="editor-preview bento-card compact" style={{ marginTop: 12 }}>
                    <div className="preview-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div className="title small muted">Live Preview</div>
                            <div className="muted small">Reader view</div>
                        </div>
                        <div className="muted small">{form.status === "published" ? `Published: ${form.publishedAt || "—"}` : "Draft"}</div>
                    </div>
                    <div className="preview-content" style={{ marginTop: 10 }}>
                        {form.featuredImage && <img className="preview-hero" src={form.featuredImage} alt="hero" />}
                        <div className="preview-body" dangerouslySetInnerHTML={{ __html: form.content || "<p><em>(empty)</em></p>" }} />
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default function AdminBlogs() {
    const [blogs, setBlogs] = useState(() => loadFromStore());
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("");
    const [sortBy, setSortBy] = useState("publishedAt");
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorBlog, setEditorBlog] = useState(null);
    const [confirm, setConfirm] = useState({ open: false, cb: null, title: "", message: "" });
    const [toast, showToast] = useToast();
    const [previewPost, setPreviewPost] = useState(null);
    const fileRef = useRef(null);
    const [selectAll, setSelectAll] = useState(false);
    const searchRef = useRef(null);
    const [helpOpen, setHelpOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem(THEME_KEY) || "light";
        } catch {
            return "light";
        }
    });
    const [fabOpen, setFabOpen] = useState(false);

    useEffect(() => {
        const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=Playfair+Display:wght@400;700&display=swap');
      :root{
        --bg:#f7f6f3;
        --card-bg: linear-gradient(180deg,#fff,#fbfbfb);
        --muted:#6b7280;
        --accent:#b8832f;
        --accent-2:#f3ddb0;
        --glass-border: rgba(12,15,20,0.06);
        --card-radius:10px;
        --shadow: 0 8px 28px rgba(12,15,20,0.06);
        --gold-glow: 0 10px 30px rgba(184,131,47,0.08);
        --serif: "Playfair Display", serif;
        --sans: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      }
      .theme-warm { --bg: linear-gradient(180deg,#0f1112,#121315); --card-bg: linear-gradient(180deg,#0f1112,#121314); --muted:#a7a7a7; --accent:#e4b86f; --accent-2:#f6e8c8; --glass-border: rgba(255,255,255,0.04); --shadow: 0 10px 34px rgba(0,0,0,0.6); --text: #f3efe6; }

      *{box-sizing:border-box}
      html,body,#root{height:100%}
      body { margin:0; background: var(--bg); font-family: var(--sans); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; color:var(--text, #07121a); }

      .dash-root{ min-height:100vh; padding:18px; display:flex; gap:12px; color:var(--text, #07121a); }

      .left-nav{ width:220px; background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.96)); border-radius:12px; padding:12px; border:1px solid var(--glass-border); box-shadow: var(--shadow); display:flex; flex-direction:column; gap:10px; backdrop-filter: blur(4px); }
      .nav-crest{ width:50px; height:50px; border-radius:10px; }
      .nav-name{ font-weight:900; color:var(--accent); font-size:16px; font-family:var(--serif) }
      .nav-sub{ font-size:12px; color:var(--muted) }
      .nav-links{ display:flex; flex-direction:column; gap:6px; margin-top:8px }
      .nav-link{ padding:8px 10px; border-radius:10px; text-decoration:none; color:var(--muted); font-weight:700; display:flex; align-items:center; gap:8px; font-size:13px }
      .nav-link.active{ padding:7px 10px; background: rgba(184,131,47,0.06) }

      .main-area{ flex:1; display:flex; flex-direction:column; gap:12px }
      .dash-topbar{ display:flex; align-items:center; justify-content:space-between; padding:12px; border-radius:12px; background:var(--card-bg); border:1px solid var(--glass-border); box-shadow:0 8px 28px rgba(12,15,20,0.04) }
      .brand-mini{ font-weight:900; color:var(--accent); font-family:var(--serif); font-size:13px }
      .crumbs{ font-size:12px; color:var(--muted) }

      .search-luxe{ display:flex; align-items:center; gap:8px; background:linear-gradient(180deg, rgba(255,255,255,0.88), rgba(250,248,244,0.9)); padding:8px; border-radius:10px; border:1px solid rgba(12,15,20,0.03) }
      .search-luxe input{ border:none; background:transparent; outline:none; padding:6px 4px; width:320px; font-weight:600; font-size:13px }
      .search-btn,.search-clear{ background:transparent; border:none; cursor:pointer; color:var(--muted); font-size:14px }

      .kpi-row{ display:flex; gap:8px; align-items:center }
      .kpi-chip{ padding:8px; border-radius:10px; background:linear-gradient(180deg,#fff,#fbfbfb); border:1px solid var(--glass-border); min-width:96px; box-shadow:0 6px 18px rgba(184,131,47,0.035) }
      .kpi-val{ font-weight:900; font-size:13px }
      .kpi-sub{ font-size:11px; color:var(--muted) }

      .btn-primary{ padding:8px 12px; border-radius:10px; font-weight:800; font-size:13px }
      .btn-outline{ padding:6px 10px; border-radius:9px; font-size:13px }
      .btn-ghost{ background:transparent; border:none; color:var(--muted) }

      .bento-card{ background:var(--card-bg); border-radius:12px; padding:12px; border:1px solid var(--glass-border); box-shadow:0 10px 30px rgba(12,15,20,0.04) }
      .hero-blogs .title{ font-size:18px; font-weight:900; font-family:var(--serif) }
      .hero-blogs .sub{ font-size:13px; color:var(--muted) }

      .posts-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(410px,1fr)); gap:10px }
      .post-card{ display:flex;max-height:200px;flex-direction:row gap:12px; padding:5px; border-radius:10px; border:1px solid rgba(12,15,20,0.03); background:linear-gradient(180deg,#fff,#faf9f7); transition:transform .12s ease, box-shadow .12s ease, opacity .18s ease; overflow:hidden; opacity:0; transform:translateY(6px) }
      .post-card.enter{ opacity:1; transform:none }
      .post-card:hover{ transform:translateY(-6px); box-shadow:0 14px 44px rgba(10,20,30,0.08) }

      .post-media{ width:80px; height:56px; border-radius:8px; overflow:hidden; flex-shrink:0; background:linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01)); display:flex; align-items:center; justify-content:center; color:var(--muted); font-weight:700; position:relative }
      .post-media img{ width:100%; height:100%; object-fit:cover }
      .post-media-blank{ font-size:12px; text-align:center; padding:6px }

      .post-body{ flex:1; display:flex; flex-direction:column; gap:6px; min-width:0 }
      .post-title{ font-weight:800; font-size:14px; font-family:var(--serif); line-height:1.15; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .post-excerpt{ font-size:13px; color:var(--muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }

      .post-tags{ display:flex; gap:6px; flex-wrap:wrap }
      .tag-pill{ padding:4px 8px; border-radius:999px; background:rgba(12,15,20,0.02); color:var(--muted); font-size:11px; font-weight:700 }

      .post-foot{ display:flex; justify-content:space-between; align-items:center; margin-top:6px }
      .post-author{ display:flex; align-items:center; gap:8px; color:var(--muted); font-size:13px }
      .post-actions{ display:flex; align-items:center; gap:8px }

      .ribbon{ position:absolute; left:-6px; top:6px; transform:rotate(-16deg); padding:4px 10px; font-size:11px; font-weight:900; background:linear-gradient(90deg, rgba(184,131,47,0.95), rgba(243,221,176,0.95)); color:#102018; border-radius:8px; box-shadow: 0 6px 18px rgba(184,131,47,0.06) }
      .meta-overlay{ position:absolute; right:6px; bottom:6px; padding:4px 6px; font-size:12px; background:rgba(255,255,255,0.92); border-radius:8px; box-shadow:0 6px 14px rgba(12,15,20,0.03); font-weight:700 }

      .action{ width:30px; height:28px; padding:0; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; border:none; background:transparent; cursor:pointer; font-size:14px; color:var(--muted); }
      .action:hover{ background:rgba(12,15,20,0.03) }
      .action.danger{ color:#c63a2f }
      .select-row input{ width:16px; height:16px }

      .divider{ width:1px; height:22px; background:rgba(12,15,20,0.03); border-radius:2px }

      .detail-drawer.compact{ width:860px; max-width: calc(100% - 36px); top:56px; bottom:22px; padding:10px; border-radius:12px; position:fixed; right:18px; background:var(--card-bg); border:1px solid var(--glass-border); box-shadow:var(--shadow); z-index:120 }
      .drawer-head{ padding:10px }
      .drawer-title{ font-size:15px; font-family:var(--serif) }

      .editor-side{ width:300px }

      .wide-input{ padding:8px; border-radius:8px; font-size:13px; width:100%; border:1px solid rgba(12,15,20,0.04) }

      .editor-preview.bento-card.compact{ padding:10px }

      .preview-overlay{ position:fixed; inset:0; background:rgba(255,255,255,0.95); display:flex; align-items:center; justify-content:center; z-index:100 }
      .preview-card{ width:min(860px,95%); max-height:92vh; overflow:auto; padding:14px; border-radius:10px }

      .fab-wrap { position: fixed; right: 18px; bottom: 18px; display:flex; flex-direction:column; gap:8px; align-items:flex-end; z-index:140; }
      .fab-new{ padding:10px 12px; border-radius:999px; font-weight:900; font-size:14px; display:flex; align-items:center; gap:8px }
      .fab-mini{ padding:8px 10px; border-radius:10px; font-size:13px }

      .toast{ padding:8px 14px; font-size:13px; position:fixed; right:18px; bottom:96px; border-radius:8px; background:#111; color:#fff; z-index:200 }

      .kbd{ padding:5px 7px; font-size:12px }

      .card-body.posts-grid{ padding:8px 8px 6px 8px }

      @media (max-width:1000px){
        .left-nav{ display:none }
        .detail-drawer.compact{ left:12px; right:12px; top:36px; width: calc(100% - 24px) }
        .search-luxe input{ width:200px }
        .posts-grid{ grid-template-columns:repeat(auto-fit,minmax(220px,1fr)) }
      }
    `;
        const id = "luxed-admin-compact-styles";
        if (!document.getElementById(id)) {
            const s = document.createElement("style");
            s.id = id;
            s.innerHTML = css;
            document.head.appendChild(s);
        }

        document.documentElement.classList.toggle("theme-warm", theme === "warm");
        try { localStorage.setItem(THEME_KEY, theme); } catch { }
    }, [theme]);

    useEffect(() => saveToStore(blogs), [blogs]);

    const allTags = useMemo(() => {
        const s = new Set();
        blogs.forEach(b => (b.tags || []).forEach(t => t && s.add(t)));
        return Array.from(s).sort();
    }, [blogs]);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        return blogs
            .filter(b => (statusFilter === "all" ? true : b.status === statusFilter))
            .filter(b => (tagFilter ? (b.tags || []).includes(tagFilter) : true))
            .filter(b => {
                if (!q) return true;
                return `${b.title} ${b.excerpt} ${(b.tags || []).join(" ")} ${b.author}`.toLowerCase().includes(q);
            })
            .sort((a, b) => {
                if (sortBy === "publishedAt") {
                    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                    return tb - ta;
                }
                if (sortBy === "views") return (b.views || 0) - (a.views || 0);
                return 0;
            });
    }, [blogs, query, statusFilter, sortBy, tagFilter]);

    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    useEffect(() => { if (page > pages) setPage(pages); }, [pages]);

    useEffect(() => {
        if (!selectAll) return;
        const ids = filtered.slice((page - 1) * perPage, page * perPage).map(x => x.id);
        setSelected(prev => {
            const n = new Set(prev);
            ids.forEach(id => n.add(id));
            return n;
        });
    }, [selectAll, page, filtered, perPage]);

    useEffect(() => {
        function onKey(e) {
            const tag = (document.activeElement?.tagName || "").toLowerCase();
            if (e.key === "/" && tag !== "input" && tag !== "textarea") {
                e.preventDefault();
                searchRef.current?.focus();
                return;
            }
            if ((e.key === "n" || e.key === "N") && tag === "body") {
                e.preventDefault();
                openNew();
                return;
            }
            if (e.key === "?") {
                e.preventDefault();
                setHelpOpen(true);
                return;
            }
            if (e.key === "Escape") {
                setEditorOpen(false);
                setPreviewPost(null);
                setConfirm({ open: false });
                setHelpOpen(false);
                setFabOpen(false);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    function openNew() {
        setEditorBlog({
            id: uid(),
            title: "",
            slug: "",
            author: "Demo Admin",
            status: "draft",
            publishedAt: null,
            excerpt: "",
            content: "",
            seo: { title: "", description: "", canonical: "", keywords: "" },
            tags: [],
            featuredImage: null,
            views: 0,
            likes: 0,
        });
        setEditorOpen(true);
    }
    function openEdit(b) {
        setEditorBlog({ ...b, seo: { ...(b.seo || {}) }, tags: (b.tags || []).slice() });
        setEditorOpen(true);
    }
    function saveBlog(blog) {
        setBlogs(prev => {
            const idx = prev.findIndex(p => p.id === blog.id);
            let next = [];
            if (idx === -1) next = [blog, ...prev];
            else next = prev.map(p => (p.id === blog.id ? blog : p));
            showToast({ type: "success", text: "Saved" });
            return next;
        });
        setEditorOpen(false);
    }

    function duplicatePost(b) {
        const copy = { ...b, id: uid(), title: `Copy of ${b.title}`, publishedAt: null, status: "draft", views: 0, likes: 0, slug: `${b.slug || b.id}-copy-${Math.random().toString(36).slice(2, 5)}` };
        setBlogs(prev => [copy, ...prev]);
        showToast({ type: "success", text: "Duplicated" });
    }

    function removeBlog(id) {
        setBlogs(prev => prev.filter(b => b.id !== id));
        setSelected(s => { const n = new Set(s); n.delete(id); return n; });
        showToast({ type: "info", text: "Deleted" });
    }

    function quickTogglePublish(b) {
        setBlogs(prev => prev.map(p => (p.id === b.id ? { ...p, status: p.status === "published" ? "draft" : "published", publishedAt: p.publishedAt || new Date().toISOString().slice(0, 10) } : p)));
        showToast({ type: "success", text: "Toggled" });
    }

    function bulkAction(action) {
        const sel = Array.from(selected);
        if (!sel.length) { showToast({ type: "info", text: "No selection" }); return; }
        if (action === "publish") {
            setBlogs(prev => prev.map(b => (selected.has(b.id) ? { ...b, status: "published", publishedAt: b.publishedAt || new Date().toISOString().slice(0, 10) } : b)));
            showToast({ type: "success", text: "Published" });
        }
        if (action === "unpublish") {
            setBlogs(prev => prev.map(b => (selected.has(b.id) ? { ...b, status: "draft" } : b)));
            showToast({ type: "success", text: "Unpublished" });
        }
        if (action === "delete") {
            setConfirm({
                open: true,
                title: "Delete posts?",
                message: `Delete ${sel.length} selected post(s)? This can't be undone.`,
                cb: () => { setBlogs(prev => prev.filter(b => !selected.has(b.id))); setSelected(new Set()); showToast({ type: "info", text: "Deleted" }); }
            });
        }
    }

    function toggleSelect(id) { setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }

    function exportJson() {
        const blob = new Blob([JSON.stringify(blogs, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `blogs-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
        showToast({ type: "success", text: "Exported" });
    }

    function importJsonFile(file) {
        if (!file) return;
        const r = new FileReader();
        r.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) throw new Error("Invalid file");
                setBlogs(parsed);
                showToast({ type: "success", text: "Imported" });
            } catch (err) { showToast({ type: "info", text: "Import failed" }); }
        };
        r.readAsText(file);
    }

    function copyPermalink(b) {
        const p = `${window.location.origin}/posts/${b.slug || b.id}`;
        navigator.clipboard.writeText(p).then(() => showToast({ type: "success", text: "Copied" }), () => showToast({ type: "info", text: "Copy failed" }));
    }

    function openPreview(b) { setPreviewPost(b); }

    const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

    const totalVisits = blogs.reduce((s, b) => s + (b.views || 0), 0);
    const totalPosts = blogs.length;
    const drafts = blogs.filter(b => b.status === "draft").length;
    const highestViews = Math.max(1, ...blogs.map(x => x.views || 0));

    const topStories = useMemo(() => {
        return [...blogs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    }, [blogs]);

    useEffect(() => {
        const timer = setTimeout(() => {
            document.querySelectorAll(".post-card").forEach((el, i) => {
                el.style.transitionDelay = `${i * 18}ms`;
                el.classList.add("enter");
            });
        }, 40);
        return () => clearTimeout(timer);
    }, [pageItems.length]);

    function toggleTheme() {
        setTheme(prev => (prev === "light" ? "warm" : "light"));
    }

    return (
        <div className="dash-root bento polished luxe-page" role="application" aria-label="Admin — Blogs">
            <aside className="left-nav" aria-hidden>
                <div className="nav-brand" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div className="nav-crest" aria-hidden>
                        <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden>
                            <defs><linearGradient id="lgX2" x1="0" x2="1"><stop offset="0" stopColor="#b8832f" /><stop offset="1" stopColor="#f3ddb0" /></linearGradient></defs>
                            <circle cx="18" cy="18" r="16" fill="url(#lgX2)" />
                            <path d="M10 20c2-3 6-6 8-6s6 2 8 6" stroke="#1b2623" strokeWidth="1.2" fill="none" />
                        </svg>
                    </div>

                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Editorial</div>
                    </div>
                </div>

                <nav className="nav-links" role="navigation" aria-label="Primary">
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link active">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/leads" className="nav-link">Leads</Link>
                    <Link to="/admin/settings" className="nav-link">Settings</Link>
                </nav>

                <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-outline" onClick={toggleTheme} aria-pressed={theme === "warm"} title="Toggle theme">
                            {theme === "warm" ? "Warm" : "Light"}
                        </button>
                        <button className="btn-outline" onClick={() => setHelpOpen(true)}>Help</button>
                    </div>
                </div>

                <div className="nav-foot small muted" style={{ marginTop: "auto" }}>Signed in as <strong>Demo Admin</strong></div>
            </aside>

            <div className="main-area">
                <header className="dash-topbar header-luxe" role="banner">
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div className="brand-crumbs">
                            <div className="brand-mini">Solymus</div>
                            <div className="crumbs">/ Blogs</div>
                        </div>
                        <div className="last-updated small muted">Manage premium content — craft stories that convert</div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div className="search search-luxe" role="search" title="Press / to focus">
                            <input
                                ref={searchRef}
                                placeholder="Search title, excerpt, tags or author... (press /)"
                                aria-label="Search"
                                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                value={query}
                            />
                            <button className="search-btn" aria-hidden title="Search">⌕</button>
                            <button className="search-clear" onClick={() => { setQuery(""); }} title="Clear search">✕</button>
                        </div>

                        <div className="kpi-row">
                            <KPI label="Visits" value={totalVisits.toLocaleString()} sub="all time" />
                            <KPI label="Posts" value={totalPosts} sub="published + drafts" />
                            <KPI label="Drafts" value={drafts} sub="pending" />
                        </div>

                        <div className="top-actions">
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button className="btn-outline" onClick={() => fileRef.current?.click()}>Import</button>
                                <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importJsonFile(e.target.files?.[0])} />
                                <button className="btn-outline" onClick={exportJson}>Export</button>
                                <button className="btn-primary" onClick={openNew} title="New post (N)">New post</button>
                            </div>
                        </div>
                    </div>
                </header>

                <main role="main" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, alignItems: "start" }}>
                    <section>
                        <div className="bento-card hero-blogs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div className="hero-left" style={{ flex: '1 1 100px' }}>
                                <div className="title">Manage posts</div>
                                <div className="sub">Design stories that move people. Publish with confidence.</div>
                                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                    <button className="btn-primary" onClick={openNew}>Write a post</button>

                                    <div className="bulk-select" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <label className="select-all" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={selectAll} onChange={(e) => { setSelectAll(e.target.checked); if (!e.target.checked) setSelected(new Set()); }} />
                                            <span className="muted small">Select page</span>
                                        </label>

                                        <select onChange={(e) => bulkAction(e.target.value)} defaultValue="">
                                            <option value="">Bulk…</option>
                                            <option value="publish">Publish selected</option>
                                            <option value="unpublish">Unpublish selected</option>
                                            <option value="delete">Delete selected</option>
                                        </select>
                                        <div className="muted small">Selected: {selected.size}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                                <div style={{ textAlign: "right" }} className="muted small">Overview</div>
                                <div className="mini-analytics bento-card" style={{ width: 220 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 900 }}>{totalVisits.toLocaleString()}</div>
                                            <div className="muted small">Total visits</div>
                                        </div>
                                        <Sparkline value={totalVisits} max={Math.max(2000, totalVisits)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bento-card" style={{ marginTop: 12 }}>
                            <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div className="title">Posts</div>
                                    <div className="sub muted" style={{ fontSize: 13 }}>Sorted: {sortBy}</div>
                                </div>
                                <div className="summary-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <select className="range-btn" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                                        <option value="all">All</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                    <select className="range-btn" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                        <option value="publishedAt">Newest</option>
                                        <option value="views">Most viewed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="card-body posts-grid" style={{ marginTop: 8 }}>
                                {pageItems.map((b, idx) => {
                                    const isTop = (b.views || 0) >= Math.max(100, Math.round(highestViews * 0.6));
                                    return (
                                        <article key={b.id} className="post-card" aria-labelledby={`post-${b.id}`} style={{ transitionDelay: `${idx * 18}ms` }}>
                                            <div className="post-media" aria-hidden>
                                                {isTop && <div className="ribbon" aria-hidden>TOP</div>}
                                                {b.featuredImage ? <img src={b.featuredImage} alt="feature" /> : <div className="post-media-blank">No image</div>}
                                                <div className="meta-overlay" aria-hidden>👁 {b.views || 0}</div>
                                            </div>

                                            <div className="post-body">
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div id={`post-${b.id}`} className="post-title" title={b.title}>{b.title}</div>
                                                        <div className="post-excerpt" style={{ marginTop: 6 }}>{b.excerpt}</div>
                                                    </div>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                                                        <div className={`badge status-${b.status}`} style={{ padding: "6px 8px", borderRadius: 8, fontSize: 12 }}>{b.status}</div>
                                                        <div className="meta-stats muted small" aria-hidden>
                                                            <span style={{ marginRight: 8 }}>♥ {b.likes || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="post-tags" style={{ marginTop: 6 }}>
                                                    {(b.tags || []).map(t => <span key={t} className="tag-pill muted">{t}</span>)}
                                                </div>

                                                <div className="post-foot" style={{ marginTop: 8 }}>
                                                    <div className="post-author muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <Avatar name={b.author} size={22} /> <span style={{ marginLeft: 4, fontSize: 13 }}> <span className="mono small"></span></span>
                                                    </div>

                                                    <div className="post-actions">
                                                        <label className="select-row" aria-label={`Select ${b.title}`}>
                                                            <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} />
                                                        </label>

                                                        <Sparkline value={b.views || 0} max={Math.max(1500, highestViews)} />

                                                        <button
                                                            className="action"
                                                            onClick={() => quickTogglePublish(b)}
                                                            title={b.status === "published" ? "Unpublish" : "Publish"}
                                                            aria-pressed={b.status === "published"}
                                                            style={{ fontSize: 13 }}
                                                        >
                                                            {b.status === "published" ? "⬇" : "⬆"}
                                                        </button>

                                                        <div className="divider" />
                                                        <ActionGroup
                                                            onEdit={() => openEdit(b)}
                                                            onPreview={() => openPreview(b)}
                                                            onDuplicate={() => duplicatePost(b)}
                                                            onCopy={() => copyPermalink(b)}
                                                            onDelete={() => setConfirm({ open: true, title: "Delete post?", message: `Delete “${b.title}”?`, cb: () => removeBlog(b.id) })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}

                                {pageItems.length === 0 && <div className="muted center" style={{ padding: 20 }}>No posts</div>}
                            </div>

                            <div className="card-foot pagination-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                <div className="muted small">{filtered.length} posts</div>
                                <div className="pagination-controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <button className="btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                                    <div className="muted small">{page} / {pages}</div>
                                    <button className="btn-outline" onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="bento-card compact">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div className="title" style={{ fontFamily: "var(--serif)", fontSize: 15 }}>Top stories</div>
                                    <div className="muted small" style={{ marginTop: 4 }}>By views</div>
                                </div>
                                <div className="muted small">Last 30d</div>
                            </div>

                            <div className="insights-list" style={{ marginTop: 8 }}>
                                {topStories.length === 0 && <div className="muted small">No stories yet</div>}
                                {topStories.map(s => (
                                    <div key={s.id} className="insight-item" style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 200 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#f3f0ea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{(s.title || "").slice(0, 2).toUpperCase()}</div>
                                            <div style={{ maxWidth: 140 }}>
                                                <div style={{ fontWeight: 800, fontSize: 13, fontFamily: "var(--serif)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                                                <div className="muted small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.excerpt}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 900 }}>{s.views || 0}</div>
                                            <div className="muted small">views</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bento-card compact">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div className="title">Quick filters</div>
                                <div className="muted small">Refine</div>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <div className="muted small">Tags</div>
                                <div className="tag-filter-row" style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <button className={`tag-filter ${tagFilter === "" ? "active" : ""}`} onClick={() => setTagFilter("")}>All</button>
                                    {allTags.map(t => (
                                        <button key={t} className={`tag-filter ${tagFilter === t ? "active" : ""}`} onClick={() => setTagFilter(tagFilter === t ? "" : t)}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                <button className="btn-outline" onClick={() => { setQuery(""); setTagFilter(""); setStatusFilter("all"); showToast({ type: "info", text: "Filters cleared" }); }}>Reset</button>
                                <button className="btn-primary" onClick={() => setHelpOpen(true)}>Shortcuts</button>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>

            <div className="fab-wrap" role="toolbar" aria-label="Quick actions">
                {fabOpen && (
                    <>
                        <button className="fab-mini" title="Import JSON" onClick={() => fileRef.current?.click()}>Import</button>
                        <button className="fab-mini" title="Export JSON" onClick={exportJson}>Export</button>
                        <button className="fab-mini" title="New post" onClick={openNew}>New</button>
                    </>
                )}
                <button className="fab-new" title="Write a new post" onClick={() => { setFabOpen(s => !s); }}>
                    <span style={{ transform: fabOpen ? "rotate(45deg)" : "none", transition: "transform .12s" }}>✦</span>
                    <span style={{ opacity: fabOpen ? 0.85 : 1, marginLeft: 6 }}>{fabOpen ? "Actions" : "Write"}</span>
                </button>
            </div>

            <EditorDrawer open={editorOpen} blog={editorBlog} onClose={() => setEditorOpen(false)} onSave={saveBlog} />

            {confirm.open && (
                <div className="detail-drawer open compact" role="dialog" aria-modal>
                    <div className="drawer-head">
                        <div className="drawer-title">{confirm.title}</div>
                        <button className="drawer-close" onClick={() => setConfirm({ open: false })}>✕</button>
                    </div>
                    <div className="drawer-body">
                        <div style={{ marginTop: 8 }}>{confirm.message}</div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                            <button className="btn-outline" onClick={() => setConfirm({ open: false })}>Cancel</button>
                            <button className="btn-primary" onClick={() => { confirm.cb?.(); setConfirm({ open: false }); }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <PreviewModal open={!!previewPost} onClose={() => setPreviewPost(null)} post={previewPost} />
            <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

            {toast && <div className={`toast toast-${toast.type || "info"}`} role="status" aria-live="polite">{toast.text}</div>}
        </div>
    );
}
