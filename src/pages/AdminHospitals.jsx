import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigation } from "react-router-dom";
import "../styles/solymus-hospitals.css";

const STORAGE_KEY = "solymus_hospitals_v1";
const THEME_KEY = "solymus_theme_v1";

function uid(prefix = "h") {
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


function parseCSV(text) {
    const rows = [];
    let i = 0,
        cur = "",
        row = [],
        inQuotes = false;
    while (i < text.length) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    cur += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i++;
                continue;
            } else {
                cur += ch;
                i++;
                continue;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
                i++;
                continue;
            }
            if (ch === "," || ch === "\t" || ch === ";") {
                row.push(cur);
                cur = "";
                i++;
                continue;
            }
            if (ch === "\r") {
                i++;
                continue;
            }
            if (ch === "\n") {
                row.push(cur);
                rows.push(row);
                row = [];
                cur = "";
                i++;
                continue;
            }
            cur += ch;
            i++;
        }
    }
    if (cur !== "" || row.length) {
        row.push(cur);
        rows.push(row);
    }
    return rows;
}


async function tryParseFile(file) {
    const name = (file.name || "").toLowerCase();
    if (/\.(xls|xlsx|xlsm)$/.test(name)) {
        try {
            const XLSX = await import("xlsx");
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data);
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            return { type: "excel", rows: json };
        } catch (err) {
            console.warn("SheetJS not available — falling back to CSV", err);
            const txt = await file.text();
            const rows = parseCSV(txt);
            return { type: "csv", rows };
        }
    } else {
        const txt = await file.text();
        const rows = parseCSV(txt);
        return { type: "csv", rows };
    }
}


function exportCSV(rows) {
    if (!rows?.length) return "";
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];
    for (const r of rows) {
        const line = headers
            .map((h) => {
                const v = r[h] == null ? "" : String(r[h]);
                return `"${v.replace(/"/g, '""')}"`;
            })
            .join(",");
        lines.push(line);
    }
    return lines.join("\n");
}


const sampleHospitals = [
    {
        id: "h_1001",
        name: "Green Valley General Hospital",
        code: "GVGH",
        address: "12 Healthway Ave",
        city: "Bengaluru",
        state: "Karnataka",
        phone: "+91 80 2345 6789",
        email: "info@gvgh.example",
        beds: 220,
        status: "active",
        rating: 4.3,
        logo: null,
        notes: "Large multispeciality hospital",
        createdAt: "2025-08-04",
    },
    {
        id: "h_1002",
        name: "Seaside Care Clinic",
        code: "SCC",
        address: "88 Marine Drive",
        city: "Goa",
        state: "Goa",
        phone: "+91 832 9988 443",
        email: "contact@seaside.example",
        beds: 34,
        status: "active",
        rating: 3.9,
        logo: null,
        notes: "Small community clinic near the beach",
        createdAt: "2025-09-01",
    },
];


function loadFromStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return sampleHospitals;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return sampleHospitals;
        return parsed;
    } catch (e) {
        console.warn("Failed to load hospitals", e);
        return sampleHospitals;
    }
}
function saveToStore(arr) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
        console.warn("Failed to save hospitals", e);
    }
}


function useToast() {
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 2600);
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

function Avatar({ name = "H", size = 36, className = "" }) {
    const initials = (name || "H")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const hue =
        Math.abs((name || "").split("").reduce((s, c) => s + (c.charCodeAt?.(0) || 0), 0)) % 360;
    const bg = `linear-gradient(135deg, hsl(${hue} 55% 58%), hsl(${(hue + 35) % 360} 55% 68%))`;
    return (
        <div
            className={`avatar ${className}`}
            title={name}
            style={{
                width: size,
                height: size,
                background: bg,
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
            }}
        >
            {initials}
        </div>
    );
}


function IconBell({ className = "", badge = 0 }) {
    return (
        <div className={`icon-bell ${className}`} style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 17H9a2 2 0 0 1-2-2v-3c0-3 2-5 3-6a4 4 0 1 1 6 0c1 1 3 3 3 6v3a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {badge > 0 && <div className="bell-badge" aria-hidden>{badge}</div>}
        </div>
    );
}
function IconSearch() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconPlus() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconButton({ title, children, onClick, className = "" }) {
    return (
        <button className={`icon-btn ${className}`} title={title} onClick={onClick} aria-label={title}>
            {children}
        </button>
    );
}

function FoilHeader() {
    return (
        <svg className="foil-deco" viewBox="0 0 400 80" aria-hidden>
            <defs>
                <linearGradient id="foilGrad" x1="0" x2="1">
                    <stop offset="0" stopColor="#fff7eb" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="80" rx="12" fill="url(#foilGrad)" />
            <g transform="translate(20,10)" opacity="0.06">
                <path d="M0 20c30-18 120-22 180-8 80 20 120 46 200 8" stroke="#caa24a" strokeWidth="2" fill="none" />
            </g>
        </svg>
    );
}


function EditorDrawer({ open, hospital, onClose, onSave }) {
    const [form, setForm] = useState(hospital || null);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasSavedDraft, setHasSavedDraft] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        setForm(hospital ? { ...hospital } : null);
        setLastSaved(null);
        setHasSavedDraft(false);
    }, [hospital]);

    useEffect(() => {
        const el = dropRef.current;
        if (!el) return;
        function onDrag(e) {
            e.preventDefault();
            e.stopPropagation();
            el.classList.add("dragging");
        }
        function onLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            el.classList.remove("dragging");
        }
        function onDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            el.classList.remove("dragging");
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("image/")) pickImage(f);
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
        const key = `solymus_hospital_autosave_${form.id}`;
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
        const key = `solymus_hospital_autosave_${form.id}`;
        const t = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(form));
                setLastSaved(Date.now());
            } catch (e) { }
        }, 600);
        return () => clearTimeout(t);
    }, [form]);

    function restoreAutosave() {
        if (!form) return;
        const key = `solymus_hospital_autosave_${form.id}`;
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
        setForm((f) => ({ ...(f || {}), [path]: value }));
    }

    function pickImage(file) {
        if (!file) return;
        const r = new FileReader();
        r.onload = (e) => setForm((f) => ({ ...(f || {}), logo: e.target.result }));
        r.readAsDataURL(file);
    }

    function formatSaved(ts) {
        if (!ts) return "Not saved";
        const s = Math.round((Date.now() - ts) / 1000);
        if (s < 5) return "Saved just now";
        if (s < 60) return `Saved ${s}s ago`;
        const m = Math.round(s / 60);
        return `Saved ${m}m ago`;
    }

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} aria-hidden />
            <aside className="detail-drawer open compact slide-in" aria-hidden={!open}>
                <div className="drawer-head">
                    <div>
                        <div className="drawer-title">{form.name || "New hospital"}</div>
                        <div className="muted small drawer-meta">
                            {hasSavedDraft ? (
                                <span>
                                    Unsaved local draft —{" "}
                                    <button className="btn-outline small" onClick={restoreAutosave}>
                                        Restore
                                    </button>
                                </span>
                            ) : null}
                            <span style={{ marginLeft: 10 }}>{formatSaved(lastSaved)}</span>
                        </div>
                    </div>
                    <div className="drawer-actions">
                        <button className="btn-ghost" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                <div className="drawer-body editor-2pane">
                    <div className="editor-grid" style={{ gap: 12 }}>
                        <div className="editor-main">
                            <label className="muted">Name</label>
                            <input className="wide-input large" value={form.name || ""} onChange={(e) => update("name", e.target.value)} />

                            <div className="row-split" style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <label className="muted">Code</label>
                                    <input className="wide-input" value={form.code || ""} onChange={(e) => update("code", e.target.value)} />
                                </div>
                                <div style={{ width: 160 }}>
                                    <label className="muted">Beds</label>
                                    <input type="number" className="wide-input" value={form.beds || 0} onChange={(e) => update("beds", parseInt(e.target.value || 0))} />
                                </div>
                            </div>

                            <label className="muted" style={{ marginTop: 8 }}>
                                Address
                            </label>
                            <input className="wide-input" value={form.address || ""} onChange={(e) => update("address", e.target.value)} />

                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <input className="wide-input" placeholder="City" value={form.city || ""} onChange={(e) => update("city", e.target.value)} />
                                <input className="wide-input" placeholder="State" value={form.state || ""} onChange={(e) => update("state", e.target.value)} />
                            </div>

                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <input className="wide-input" placeholder="Phone" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} />
                                <input className="wide-input" placeholder="Email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
                            </div>

                            <label className="muted" style={{ marginTop: 8 }}>
                                Notes / Description
                            </label>
                            <textarea className="wide-input content-input" value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} />

                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        const next = { ...(form || {}) };
                                        if (!next.id) next.id = uid();
                                        if (!next.code) next.code = (slugify(next.name || "hospital").slice(0, 8) || "H").toUpperCase();
                                        if (!next.createdAt) next.createdAt = new Date().toISOString().slice(0, 10);
                                        onSave(next);
                                    }}
                                >
                                    Save hospital
                                </button>

                                <button className="btn-outline" onClick={() => onSave({ ...(form || {}), status: "inactive" })}>
                                    Save & disable
                                </button>
                                <button className="btn-ghost" onClick={() => setForm((f) => ({ ...(f || {}), notes: "" }))}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="editor-side" style={{ width: 320 }}>
                            <div>
                                <label className="muted">Logo</label>
                                <div ref={dropRef} className={`image-drop`} aria-label="Drop logo here" style={{ borderRadius: 8, padding: 8 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                const r = new FileReader();
                                                r.onload = (ev) => setForm((s) => ({ ...(s || {}), logo: ev.target.result }));
                                                r.readAsDataURL(f);
                                            }
                                        }}
                                    />
                                    <div className="drop-instructions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <button className="btn-outline small" onClick={() => document.querySelector('.detail-drawer input[type=file]')?.click()}>
                                            Upload
                                        </button>
                                        <span className="muted small"> or drag</span>
                                    </div>
                                    {form.logo && (
                                        <div className="img-preview" style={{ marginTop: 8 }}>
                                            <img src={form.logo} alt="logo" style={{ width: "100%", borderRadius: 6 }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <div className="muted">Status</div>
                                <select className="wide-input" value={form.status || "active"} onChange={(e) => update("status", e.target.value)}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <div className="muted">Rating</div>
                                <input type="number" step="0.1" min="0" max="5" className="wide-input" value={form.rating || 0} onChange={(e) => update("rating", parseFloat(e.target.value || 0))} />
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <div className="muted">Meta</div>
                                <div className="muted small" style={{ marginTop: 6 }}>
                                    Code: <strong>{form.code || "—"}</strong>
                                </div>
                                <div className="muted small">Created: <strong>{form.createdAt || "—"}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="editor-preview bento-card compact" style={{ marginTop: 12 }}>
                        <div className="preview-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div className="title small muted">Live Preview</div>
                                <div className="muted small">Reader view</div>
                            </div>
                            <div className="muted small">{form.status === "active" ? "Active" : form.status}</div>
                        </div>
                        <div className="preview-content" style={{ marginTop: 10 }}>
                            {form.logo && <img className="preview-hero" src={form.logo} alt="logo" />}
                            <div className="preview-body">
                                <div style={{ fontWeight: 900, fontSize: 16 }}>{form.name}</div>
                                <div className="muted" style={{ marginTop: 6 }}>
                                    {form.address} {form.city ? `, ${form.city}` : ""} {form.state ? `• ${form.state}` : ""}
                                </div>
                                <div style={{ marginTop: 8 }} className="muted small">
                                    Beds: {form.beds || 0} • Rating: {form.rating || 0}
                                </div>
                                <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: form.notes || "<em>(no notes)</em>" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}


function PreviewModal({ open, onClose, h }) {
    if (!open || !h) return null;
    return (
        <div className="preview-overlay" role="dialog" aria-modal>
            <div className="preview-card bento-card compact animate-pop">
                <div className="preview-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div className="title">{h.name}</div>
                        <div className="muted small">{h.code} • {h.city || "—"}</div>
                    </div>
                    <div>
                        <button className="btn-ghost" onClick={onClose}>Close</button>
                    </div>
                </div>
                <div className="preview-body" style={{ marginTop: 10 }}>
                    {h.logo && <img className="preview-hero" src={h.logo} alt="logo" />}
                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 800 }}>{h.address}</div>
                        <div className="muted small" style={{ marginTop: 6 }}>Phone: {h.phone} • Email: {h.email}</div>
                        <div style={{ marginTop: 10 }}>{h.notes}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function TableView({ items, onEdit, onPreview, onDuplicate, onDelete, selected, toggleSelect }) {
    return (
        <div className="table-wrap">
            <table className="hosp-table">
                <thead>
                    <tr>
                        <th style={{ width: 36 }}></th>
                        <th>Hospital</th>
                        <th>Location</th>
                        <th>Beds</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th style={{ width: 150 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((h) => (
                        <tr key={h.id} className="hosp-row">
                            <td>
                                <input type="checkbox" checked={selected.has(h.id)} onChange={() => toggleSelect(h.id)} />
                            </td>
                            <td className="hosp-name">
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <Avatar name={h.name} size={40} />
                                    <div>
                                        <div style={{ fontWeight: 900 }}>{h.name}</div>
                                        <div className="muted small">{h.code} • {h.address}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{h.city ? `${h.city}${h.state ? `, ${h.state}` : ""}` : "-"}</td>
                            <td>{h.beds || 0}</td>
                            <td>
                                <div className="rating-cell">
                                    <span className="rating-val">★ {h.rating || 0}</span>
                                    <div className="rating-bar">
                                        <div className="rating-fill" style={{ width: `${Math.min(100, (h.rating || 0) * 20)}%` }} />
                                    </div>
                                </div>
                            </td>
                            <td><span className={`badge status-${h.status}`}>{h.status}</span></td>
                            <td>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                    <button className="action" title="Edit" onClick={() => onEdit(h)}>✎</button>
                                    <button className="action" title="Preview" onClick={() => onPreview(h)}>🔍</button>
                                    <button className="action" title="Duplicate" onClick={() => onDuplicate(h)}>⎘</button>
                                    <button className="action danger" title="Delete" onClick={() => onDelete(h)}>🗑</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export default function AdminHospitals() {

    const [hospitals, setHospitals] = useState(() => loadFromStore());
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorHospital, setEditorHospital] = useState(null);
    const [confirm, setConfirm] = useState({ open: false, cb: null, title: "", message: "" });
    const [toast, showToast] = useToast();
    const [preview, setPreview] = useState(null);
    const fileRef = useRef(null);
    const csvRef = useRef(null);
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
    const [viewMode, setViewMode] = useState("grid");
    const [importPreview, setImportPreview] = useState(null);

    useEffect(() => {
        document.documentElement.classList.toggle("theme-warm", theme === "warm");
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch { }
    }, [theme]);

    useEffect(() => saveToStore(hospitals), [hospitals]);
    const totalBeds = useMemo(() => hospitals.reduce((s, h) => s + (Number(h.beds) || 0), 0), [hospitals]);
    const totalHospitals = hospitals.length;
    const active = hospitals.filter((h) => h.status === "active").length;
    const avgRating = useMemo(() => {
        if (!hospitals.length) return 0;
        return (hospitals.reduce((s, h) => s + (h.rating || 0), 0) / hospitals.length).toFixed(1);
    }, [hospitals]);
    const topRated = useMemo(() => [...hospitals].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3), [hospitals]);

    const filtered = useMemo(() => {
        const q = (query || "").toLowerCase().trim();
        return hospitals
            .filter((h) => (statusFilter === "all" ? true : h.status === statusFilter))
            .filter((h) => {
                if (!q) return true;
                return `${h.name} ${h.city} ${h.state} ${h.code} ${(h.notes || "")}`.toLowerCase().includes(q);
            })
            .sort((a, b) => {
                if (sortBy === "createdAt") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                if (sortBy === "beds") return (b.beds || 0) - (a.beds || 0);
                if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
                return 0;
            });
    }, [hospitals, query, statusFilter, sortBy]);

    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    useEffect(() => {
        if (page > pages) setPage(pages);
    }, [pages]);

    useEffect(() => {
        if (!selectAll) return;
        const ids = filtered.slice((page - 1) * perPage, page * perPage).map((x) => x.id);
        setSelected((prev) => {
            const n = new Set(prev);
            ids.forEach((id) => n.add(id));
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
                setPreview(null);
                setConfirm({ open: false });
                setHelpOpen(false);
                setFabOpen(false);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    function openNew() {
        setEditorHospital({
            id: uid(),
            name: "",
            code: "",
            address: "",
            city: "",
            state: "",
            phone: "",
            email: "",
            beds: 0,
            status: "active",
            rating: 0,
            notes: "",
            logo: null,
        });
        setEditorOpen(true);
    }
    function openEdit(h) {
        setEditorHospital({ ...h });
        setEditorOpen(true);
    }
    function saveHospital(h) {
        setHospitals((prev) => {
            const idx = prev.findIndex((p) => p.id === h.id);
            let next = [];
            if (idx === -1) next = [h, ...prev];
            else next = prev.map((p) => (p.id === h.id ? h : p));
            showToast({ type: "success", text: "Saved" });
            return next;
        });
        setEditorOpen(false);
    }
    function duplicateHospital(h) {
        const copy = { ...h, id: uid(), name: `Copy of ${h.name}`, code: `${h.code || "CP"}${Math.random().toString(36).slice(2, 5)}`, createdAt: new Date().toISOString().slice(0, 10) };
        setHospitals((prev) => [copy, ...prev]);
        showToast({ type: "success", text: "Duplicated" });
    }
    function removeHospital(id) {
        setHospitals((prev) => prev.filter((h) => h.id !== id));
        setSelected((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
        });
        showToast({ type: "info", text: "Deleted" });
    }
    function quickToggleStatus(h) {
        setHospitals((prev) => prev.map((p) => (p.id === h.id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p)));
        showToast({ type: "success", text: "Toggled" });
    }
    function bulkAction(action) {
        const sel = Array.from(selected);
        if (!sel.length) {
            showToast({ type: "info", text: "No selection" });
            return;
        }
        if (action === "activate") {
            setHospitals((prev) => prev.map((h) => (selected.has(h.id) ? { ...h, status: "active" } : h)));
            showToast({ type: "success", text: "Activated" });
        }
        if (action === "deactivate") {
            setHospitals((prev) => prev.map((h) => (selected.has(h.id) ? { ...h, status: "inactive" } : h)));
            showToast({ type: "success", text: "Deactivated" });
        }
        if (action === "delete") {
            setConfirm({
                open: true,
                title: "Delete hospitals?",
                message: `Delete ${sel.length} selected hospitals? This can't be undone.`,
                cb: () => {
                    setHospitals((prev) => prev.filter((h) => !selected.has(h.id)));
                    setSelected(new Set());
                    showToast({ type: "info", text: "Deleted" });
                },
            });
        }
    }
    function toggleSelect(id) {
        setSelected((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    }

    function exportJson() {
        const blob = new Blob([JSON.stringify(hospitals, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hospitals-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast({ type: "success", text: "Exported" });
    }
    function importJsonFile(file) {
        if (!file) return;
        const r = new FileReader();
        r.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) throw new Error("Invalid file");
                setHospitals(parsed);
                showToast({ type: "success", text: "Imported" });
            } catch (err) {
                showToast({ type: "info", text: "Import failed" });
            }
        };
        r.readAsText(file);
    }
    function copyPermalink(h) {
        const p = `${window.location.origin}/admin/hospitals/${h.id}`;
        navigator.clipboard.writeText(p).then(() => showToast({ type: "success", text: "Copied" }), () => showToast({ type: "info", text: "Copy failed" }));
    }
    function openPreview(h) {
        setPreview(h);
    }

    async function handleCSVFile(file) {
        if (!file) return;
        try {
            const { type, rows } = await tryParseFile(file);
            let normalized = [];
            if (Array.isArray(rows) && rows.length && Array.isArray(rows[0])) {
                const headers = rows[0].map((h) => String(h || "").toLowerCase().trim());
                const dataRows = rows.slice(1);
                normalized = dataRows.map((r) => {
                    const obj = {};
                    headers.forEach((h, i) => {
                        obj[h || `col${i}`] = r[i] ?? "";
                    });
                    return {
                        id: uid(),
                        name: obj.name || obj["hospital name"] || obj.hospital || "",
                        code: obj.code || obj.id || "",
                        address: obj.address || "",
                        city: obj.city || "",
                        state: obj.state || "",
                        phone: obj.phone || obj.contact || "",
                        email: obj.email || "",
                        beds: parseInt(obj.beds || obj.bed || 0) || 0,
                        status: obj.status || "active",
                        rating: parseFloat(obj.rating || 0) || 0,
                        logo: null,
                        notes: obj.notes || "",
                        createdAt: new Date().toISOString().slice(0, 10),
                    };
                });
            } else if (Array.isArray(rows)) {
                normalized = rows.map((r) => {
                    const obj = {};
                    Object.keys(r).forEach((k) => {
                        obj[k.toLowerCase().trim()] = r[k];
                    });
                    return {
                        id: uid(),
                        name: obj.name || obj["hospital name"] || obj.hospital || "",
                        code: obj.code || obj.id || "",
                        address: obj.address || "",
                        city: obj.city || "",
                        state: obj.state || "",
                        phone: obj.phone || obj.contact || "",
                        email: obj.email || "",
                        beds: parseInt(obj.beds || obj.bed || 0) || 0,
                        status: obj.status || "active",
                        rating: parseFloat(obj.rating || 0) || 0,
                        logo: null,
                        notes: obj.notes || "",
                        createdAt: new Date().toISOString().slice(0, 10),
                    };
                });
            }
            if (normalized.length) {
                setImportPreview(normalized.slice(0, 120));
                setConfirm({
                    open: true,
                    title: "Import preview",
                    message: `Imported ${normalized.length} rows — add them to the registry?`,
                    cb: () => {
                        setHospitals((prev) => [...normalized, ...prev]);
                        setImportPreview(null);
                        showToast({ type: "success", text: `Imported ${normalized.length} hospitals` });
                    },
                });
            } else {
                showToast({ type: "info", text: "No rows found" });
            }
        } catch (err) {
            console.error(err);
            showToast({ type: "info", text: "Import failed" });
        }
    }

    function exportSelectionCSV() {
        const sel = Array.from(selected)
            .map((id) => hospitals.find((h) => h.id === id))
            .filter(Boolean);
        if (!sel.length) {
            showToast({ type: "info", text: "No selection" });
            return;
        }
        const csv = exportCSV(
            sel.map((s) => ({ name: s.name, code: s.code, address: s.address, city: s.city, state: s.state, phone: s.phone, email: s.email, beds: s.beds, status: s.status, rating: s.rating })),
        );
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hospitals-selected-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast({ type: "success", text: "CSV exported" });
    }

    const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

    useEffect(() => {
        const timer = setTimeout(() => {
            document.querySelectorAll(".post-card").forEach((el, i) => {
                el.style.transitionDelay = `${i * 18}ms`;
                el.classList.add("enter");
            });
        }, 40);
        return () => clearTimeout(timer);
    }, [pageItems.length]);

    const StatusChip = ({ id, label, count }) => (
        <button
            className={`chip ${statusFilter === id ? "active" : ""}`}
            onClick={() => {
                setStatusFilter(id);
                setPage(1);
            }}
            title={`Filter ${label}`}
        >
            <span className="chip-label">{label}</span>
            <span className="chip-count">{count}</span>
        </button>
    );

    const notificationCount = hospitals.filter(h => h.status !== "active").length;

    return (
        <div className="dash-root bento polished luxe-page" role="application" aria-label="Admin — Hospitals">
            <aside className="left-nav" aria-hidden>
                <div className="nav-brand" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div className="nav-crest" aria-hidden>
                        <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden>
                            <defs>
                                <linearGradient id="lgHx" x1="0" x2="1">
                                    <stop offset="0" stopColor="#caa24a" />
                                    <stop offset="1" stopColor="#f7e3b0" />
                                </linearGradient>
                            </defs>
                            <circle cx="18" cy="18" r="16" fill="url(#lgHx)" />
                            <path d="M10 20c2-3 6-6 8-6s6 2 8 6" stroke="#1b2623" strokeWidth="1.2" fill="none" />
                        </svg>
                    </div>

                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Hospitals</div>
                    </div>
                </div>

                <nav className="nav-links" role="navigation" aria-label="Primary">
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link active">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link ">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/claims" className="nav-link">Claims</Link>
                    <Link to="/admin/leads" className="nav-link">Leads</Link>
                    <Link to='/admin/quote-pricing' className="nav-link">Quote Pricing</Link>
                    <Link to="/admin/chatbot" className="nav-link">Chatbot</Link>

                    <Link to="/admin/settings" className="nav-link">Settings</Link>
                                        <Link to= "/admin/logout" className="nav-link">Logout</Link>
                    
                </nav>

                <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-outline" onClick={() => setTheme((t) => (t === "light" ? "warm" : "light"))} aria-pressed={theme === "warm"} title="Toggle theme">
                            {theme === "warm" ? "Warm" : "Light"}
                        </button>
                        <button className="btn-outline" onClick={() => setHelpOpen(true)}>
                            Help
                        </button>
                    </div>
                </div>

                <div className="nav-foot small muted" style={{ marginTop: "auto" }}>
                    Signed in as <strong>Demo Admin</strong>
                </div>
            </aside>

            <div className="main-area">
                <header className="dash-topbar header-luxe" role="banner" style={{ position: "relative", overflow: "visible" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ position: "relative" }}>
                            <FoilHeader />
                            <div style={{ position: "absolute", left: 18, top: 12 }}>
                                <div className="brand-crumbs">
                                    <div className="brand-mini">Solymus</div>
                                    <div className="crumbs">/ Hospitals</div>
                                </div>
                                <div className="last-updated small muted" style={{ marginTop: 4 }}>Manage network hospitals — add, import, and keep the registry up to date</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="search search-luxe" role="search" title="Press / to focus" style={{ minWidth: 340 }}>
                            <input
                                ref={searchRef}
                                placeholder="Search name, city, code or notes... (press /)"
                                aria-label="Search"
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                value={query}
                            />
                            <button className="search-btn" aria-hidden title="Search"><IconSearch /></button>
                            <button className="search-clear" onClick={() => setQuery("")} title="Clear search">✕</button>
                        </div>

                        <div className="kpi-row">
                            <KPI label="Hospitals" value={totalHospitals} sub="total" />
                            <KPI label="Active" value={active} sub="online" />
                            <KPI label="Beds" value={totalBeds} sub="capacity" />
                        </div>

                        <div className="top-actions" role="toolbar" aria-label="Top actions">
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <IconButton title="Import JSON" className="btn-alt" onClick={() => document.getElementById("import-json")?.click()}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 12l7-9 7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </IconButton>
                                <input id="import-json" type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importJsonFile(e.target.files?.[0])} />

                                <button className="btn-outline" onClick={() => csvRef.current?.click()}>
                                    Import CSV/Excel
                                </button>
                                <input
                                    ref={csvRef}
                                    type="file"
                                    accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    style={{ display: "none" }}
                                    onChange={(e) => handleCSVFile(e.target.files?.[0])}
                                />

                                <button className="btn-outline" onClick={exportJson}>
                                    Export JSON
                                </button>
                                <button className="btn-outline" onClick={exportSelectionCSV}>
                                    Export selected CSV
                                </button>

                                <div className="view-toggle" role="toolbar" aria-label="View">
                                    <button className={`btn-ghost small ${viewMode === "grid" ? "active" : ""}`} title="Grid view" onClick={() => setViewMode("grid")}>
                                        ▦
                                    </button>
                                    <button className={`btn-ghost small ${viewMode === "table" ? "active" : ""}`} title="Table view" onClick={() => setViewMode("table")}>
                                        ≣
                                    </button>
                                </div>

                                <button className="btn-primary" onClick={openNew} title="New hospital (N)">
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><IconPlus /> New hospital</span>
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <IconBell badge={notificationCount} />
                                        <button className="btn-ghost" onClick={() => showToast({ type: "info", text: `${notificationCount} items need review` })}>Notifications</button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <div style={{ fontSize: 13, color: "var(--muted)" }}>Demo Admin</div>
                                        <Avatar name="Demo Admin" size={34} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="hero-spotlight">
                    <div className="hero-left">
                        <h1 className="hero-title">Hospital Network</h1>
                        <p className="hero-sub">Curate, monitor and scale your healthcare network. Every clinical partner — aligned.</p>

                        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                            <button className="btn-primary" onClick={openNew}>
                                Add hospital
                            </button>
                            <button className="btn-outline" onClick={() => { setQuery(""); setStatusFilter("all"); showToast({ type: "info", text: "Filters cleared" }); }}>
                                Clear filters
                            </button>
                            <div className="muted small">Pro tip: press <strong>/</strong> to search</div>
                        </div>

                        <div className="filter-row" style={{ marginTop: 12 }}>
                            <StatusChip id="all" label="All" count={hospitals.length} />
                            <StatusChip id="active" label="Active" count={hospitals.filter(h => h.status === "active").length} />
                            <StatusChip id="inactive" label="Inactive" count={hospitals.filter(h => h.status === "inactive").length} />
                            <StatusChip id="closed" label="Closed" count={hospitals.filter(h => h.status === "closed").length} />
                            <div style={{ marginLeft: 8 }}>
                                <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="createdAt">Sort: Newest</option>
                                    <option value="beds">Sort: Beds</option>
                                    <option value="rating">Sort: Rating</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="spot-card luxury">
                            <div className="spot-title">Operational summary</div>
                            <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
                                <div className="spot-stat">
                                    <div className="spot-val">{active}</div>
                                    <div className="muted small">Active hospitals</div>
                                </div>
                                <div className="spot-stat">
                                    <div className="spot-val">{totalBeds}</div>
                                    <div className="muted small">Beds total</div>
                                </div>

                                <div className="rating-visual">
                                    <div className="radial">
                                        <svg viewBox="0 0 36 36" className="radial-ring"><path d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" /></svg>
                                        <div className="radial-val">{avgRating}</div>
                                    </div>
                                    <div className="muted small" style={{ marginLeft: 8 }}>Avg rating</div>
                                </div>
                            </div>

                            <div className="mini-analytics" style={{ marginTop: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div className="muted small">Top hospital</div>
                                    <div style={{ fontWeight: 900 }}>{topRated[0]?.name || "—"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <main role="main" style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "1fr 320px" : "1fr", gap: 12, alignItems: "start" }}>
                    <section>
                        <div className="bento-card" style={{ marginTop: 4 }}>
                            <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div className="title">Hospitals</div>
                                    <div className="sub muted" style={{ fontSize: 13 }}>
                                        Sorted: {sortBy} • View: {viewMode}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <label className="select-all" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <input type="checkbox" checked={selectAll} onChange={(e) => { setSelectAll(e.target.checked); if (!e.target.checked) setSelected(new Set()); }} />
                                        <span className="muted small">Select page</span>
                                    </label>

                                    <select onChange={(e) => bulkAction(e.target.value)} defaultValue="">
                                        <option value="">Bulk…</option>
                                        <option value="activate">Activate selected</option>
                                        <option value="deactivate">Deactivate selected</option>
                                        <option value="delete">Delete selected</option>
                                    </select>

                                    <div className="muted small">Selected: {selected.size}</div>
                                </div>
                            </div>

                            <div className="card-body posts-grid" style={{ marginTop: 12 }}>
                                {viewMode === "table" ? (
                                    <TableView
                                        items={pageItems}
                                        onEdit={openEdit}
                                        onPreview={openPreview}
                                        onDuplicate={duplicateHospital}
                                        onDelete={(h) => setConfirm({ open: true, title: "Delete hospital?", message: `Delete “${h.name}”?`, cb: () => removeHospital(h.id) })}
                                        selected={selected}
                                        toggleSelect={toggleSelect}
                                    />
                                ) : (
                                    <Link to={'/admin/branches'} className="posts-grid">
                                        {pageItems.map((h, idx) => {
                                            const isTop = (h.rating || 0) >= 4.2;
                                            return (
                                                <article key={h.id} className={`post-card card-glow ${isTop ? "top-rated" : ""}`} aria-labelledby={`hospital-${h.id}`} style={{ transitionDelay: `${idx * 16}ms` }}>
                                                    <div className="post-media" aria-hidden>
                                                        {isTop && <div className="ribbon-gold">ELITE</div>}
                                                        {h.logo ? <img src={h.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="post-media-blank">{(h.name || "").slice(0, 2).toUpperCase()}</div>}
                                                    </div>

                                                    <div className="post-body">
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div id={`hospital-${h.id}`} className="post-title" title={h.name}>
                                                                    {h.name}
                                                                </div>
                                                                <div className="post-excerpt" style={{ marginTop: 6 }}>
                                                                    {h.address} {h.city ? `• ${h.city}` : ""}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                                                                <div className={`badge status-${h.status}`}>{h.status}</div>
                                                                <div className="meta-stats muted small" aria-hidden>
                                                                    <span style={{ marginRight: 8 }}>★ {h.rating || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="post-tags" style={{ marginTop: 8 }}>
                                                            <span className="tag-pill muted">Beds: {h.beds || 0}</span>
                                                            <span className="tag-pill muted">Code: {h.code || "—"}</span>
                                                            <span className="tag-pill muted">{h.city || "—"}</span>
                                                        </div>

                                                        <div className="post-foot" style={{ marginTop: 10, alignItems: "center" }}>
                                                            <div className="post-author muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <Avatar name={h.name} size={22} /> <span style={{ marginLeft: 4, fontSize: 13 }}>{h.city || ""}</span>
                                                            </div>

                                                            <div className="post-actions">
                                                                <label className="select-row" aria-label={`Select ${h.name}`}>
                                                                    <input type="checkbox" checked={selected.has(h.id)} onChange={() => toggleSelect(h.id)} />
                                                                </label>

                                                                <button className="action" onClick={() => quickToggleStatus(h)} title={h.status === "active" ? "Disable" : "Enable"} aria-pressed={h.status === "active"}>
                                                                    {h.status === "active" ? "⬇" : "⬆"}
                                                                </button>

                                                                <div className="divider" />
                                                                <div className="action-menu">
                                                                    <button className="action" title="Edit" onClick={() => openEdit(h)}>✎</button>
                                                                    <button className="action" title="Preview" onClick={() => openPreview(h)}>🔍</button>
                                                                    <button className="action" title="Duplicate" onClick={() => duplicateHospital(h)}>⎘</button>
                                                                    <button className="action" title="Permalink" onClick={() => copyPermalink(h)}>🔗</button>
                                                                    <button className="action danger" title="Delete" onClick={() => setConfirm({ open: true, title: "Delete hospital?", message: `Delete “${h.name}”?`, cb: () => removeHospital(h.id) })}>🗑</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </Link>
                                )}

                                {pageItems.length === 0 && <div className="muted center" style={{ padding: 20 }}>No hospitals</div>}
                            </div>

                            <div className="card-foot pagination-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                <div className="muted small">{filtered.length} hospitals</div>
                                <div className="pagination-controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <button className="btn-outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                                    <div className="muted small">{page} / {pages}</div>
                                    <button className="btn-outline" onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {viewMode === "grid" && (
                        <aside style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div className="bento-card compact">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div className="title" style={{ fontFamily: "var(--serif)", fontSize: 15 }}>Top hospitals</div>
                                        <div className="muted small" style={{ marginTop: 4 }}>By rating</div>
                                    </div>
                                    <div className="muted small">Last 30d</div>
                                </div>

                                <div className="insights-list" style={{ marginTop: 8 }}>
                                    {topRated.length === 0 && <div className="muted small">No hospitals yet</div>}
                                    {topRated.map((s) => (
                                        <div key={s.id} className="insight-item" style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 200 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#f3f0ea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{(s.name || "").slice(0, 2).toUpperCase()}</div>
                                                <div style={{ maxWidth: 140 }}>
                                                    <div style={{ fontWeight: 800, fontSize: 13, fontFamily: "var(--serif)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                                                    <div className="muted small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.address}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 900 }}>{s.rating || 0}</div>
                                                <div className="muted small">rating</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bento-card compact">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div className="title">Quick actions</div>
                                    <div className="muted small">Shortcuts</div>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button className="btn-outline" onClick={() => { setQuery(""); setStatusFilter("all"); showToast({ type: "info", text: "Filters cleared" }); }}>Reset</button>
                                        <button className="btn-primary" onClick={() => setHelpOpen(true)}>Shortcuts</button>
                                    </div>

                                    <div style={{ marginTop: 12 }} className="muted small">Import CSV/Excel columns accepted: name, code, address, city, state, phone, email, beds, status, rating, notes</div>
                                </div>
                            </div>
                        </aside>
                    )}
                </main>
            </div>

            <div className="fab-wrap" role="toolbar" aria-label="Quick actions">
                {fabOpen && (
                    <>
                        <button className="fab-mini" title="Import CSV" onClick={() => csvRef.current?.click()}>Import</button>
                        <button className="fab-mini" title="Export JSON" onClick={exportJson}>Export</button>
                        <button className="fab-mini" title="New hospital" onClick={openNew}>New</button>
                    </>
                )}
                <button className="fab-new" title="Write a new hospital" onClick={() => { setFabOpen((s) => !s); }}>
                    <span style={{ transform: fabOpen ? "rotate(45deg)" : "none", transition: "transform .12s" }}>✦</span>
                    <span style={{ opacity: fabOpen ? 0.85 : 1, marginLeft: 6 }}>{fabOpen ? "Actions" : "Add"}</span>
                </button>
            </div>

            <EditorDrawer open={editorOpen} hospital={editorHospital} onClose={() => setEditorOpen(false)} onSave={saveHospital} />

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

            <PreviewModal open={!!preview} onClose={() => setPreview(null)} h={preview} />

            {importPreview && (
                <div className="detail-drawer open compact" role="dialog" aria-modal>
                    <div className="drawer-head">
                        <div className="drawer-title">Import preview</div>
                        <button className="drawer-close" onClick={() => { setImportPreview(null); setConfirm({ open: false }); }}>✕</button>
                    </div>
                    <div className="drawer-body">
                        <div className="muted small">Preview of rows to be imported (first 120)</div>
                        <div style={{ marginTop: 10, maxHeight: 320, overflow: "auto" }}>
                            <table className="hosp-table" style={{ width: "100%" }}>
                                <thead><tr><th>Name</th><th>City</th><th>Beds</th><th>Rating</th></tr></thead>
                                <tbody>
                                    {importPreview.map(r => (<tr key={r.id}><td>{r.name}</td><td>{r.city}</td><td>{r.beds}</td><td>{r.rating}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                            <button className="btn-outline" onClick={() => { setImportPreview(null); setConfirm({ open: false }); }}>Cancel</button>
                            <button className="btn-primary" onClick={() => { setHospitals(prev => [...importPreview, ...prev]); setImportPreview(null); setConfirm({ open: false }); showToast({ type: "success", text: "Imported" }); }}>Confirm import</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className={`toast toast-${toast.type || "info"}`} role="status" aria-live="polite">{toast.text}</div>}
        </div>
    );
}
