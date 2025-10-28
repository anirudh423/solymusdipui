import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/solymus-claims.css";



const STORAGE_KEY = "solymus_claims_v1";
const VIEW_KEY = "solymus_claims_view_v1";

function uid(prefix = "c") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const sampleClaims = [
    {
        id: uid(),
        claimId: "CL-1001",
        claimantName: "Rohit Sharma",
        policyNumber: "PL-2345",
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        status: "rejected",
        amount: 45200,
        severity: "medium",
        reason: "Documentation mismatch — missing consent form",
        notes: "Customer provided scanned copy of hospital bill only.",
        attachments: [],
    },
    {
        id: uid(),
        claimId: "CL-1002",
        claimantName: "Priya Nair",
        policyNumber: "PL-9982",
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        status: "escalated",
        amount: 120000,
        severity: "high",
        reason: "High-value claim — requires underwriter review",
        notes: "Escalated by claims officer on 2025-10-18.",
        attachments: [],
    },
    {
        id: uid(),
        claimId: "CL-1003",
        claimantName: "Anjali Rao",
        policyNumber: "PL-4451",
        submittedAt: new Date().toISOString(),
        status: "rejected",
        amount: 15000,
        severity: "low",
        reason: "Pre-existing condition not disclosed",
        notes: "Insurer rejected due to policy terms.",
        attachments: [],
    },
    {
        id: uid(),
        claimId: "CL-1004",
        claimantName: "Vikram Singh",
        policyNumber: "PL-2233",
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        status: "reviewed",
        amount: 32000,
        severity: "medium",
        reason: "Insufficient documentation — resolved after follow-up",
        notes: "Customer provided missing receipts; claim adjusted.",
        attachments: [],
    },
];

function MiniSparkline({ values = [], stroke = "#b67f2a", width = 96, height = 22 }) {
    if (!values || values.length === 0) return <svg width={width} height={height}></svg>;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / Math.max(values.length - 1, 1);
    const points = values.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(" ");
    const last = values[values.length - 1];
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className="sparkline">
            <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={width - (values.length - 1) * step} cy={height - ((last - min) / range) * (height - 4) - 2} r="2.4" fill={stroke} />
        </svg>
    );
}

export default function AdminClaims() {
    const [claims, setClaims] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : sampleClaims;
        } catch {
            return sampleClaims;
        }
    });

    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [sortBy, setSortBy] = useState("submittedDesc");
    const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_KEY) || "table");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeClaim, setActiveClaim] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);

    const searchRef = useRef();
    const exportRef = useRef();

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
        } catch (e) {
            console.error("save fail", e);
        }
    }, [claims]);

    useEffect(() => {
        try {
            localStorage.setItem(VIEW_KEY, viewMode);
        } catch { }
    }, [viewMode]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
                return;
            }
            if (e.key === "Escape") {
                setExportOpen(false);
                setDrawerOpen(false);
            }
            if (e.key === "/") {
                if (
                    document.activeElement?.tagName !== "INPUT" &&
                    document.activeElement?.tagName !== "TEXTAREA"
                ) {
                    e.preventDefault();
                    searchRef.current?.focus();
                }
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        function onDoc(e) {
            if (exportOpen && exportRef.current && !exportRef.current.contains(e.target)) {
                setExportOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [exportOpen]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        return claims.filter((c) => {
            if (statusFilter !== "all" && c.status !== statusFilter) return false;
            if (severityFilter !== "all" && (c.severity || "low") !== severityFilter) return false;
            if (from && new Date(c.submittedAt) < from) return false;
            if (to) {
                const end = new Date(to); end.setHours(23, 59, 59, 999);
                if (new Date(c.submittedAt) > end) return false;
            }
            if (!q) return true;
            return (
                c.claimantName.toLowerCase().includes(q) ||
                (c.claimId || "").toLowerCase().includes(q) ||
                (c.policyNumber || "").toLowerCase().includes(q) ||
                (c.reason || "").toLowerCase().includes(q)
            );
        });
    }, [claims, query, statusFilter, severityFilter, dateFrom, dateTo]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortBy) {
            case "submittedAsc":
                arr.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
                break;
            case "claimantAsc":
                arr.sort((a, b) => a.claimantName.localeCompare(b.claimantName));
                break;
            case "claimantDesc":
                arr.sort((a, b) => b.claimantName.localeCompare(a.claimantName));
                break;
            default:
                arr.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        }
        return arr;
    }, [filtered, sortBy]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

    function fmt(dt) {
        try {
            return new Date(dt).toLocaleString();
        } catch {
            return dt;
        }
    }

    function exportJSON() {
        const dataStr = JSON.stringify(claims, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solymus-claims-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: "Export started" });
    }

    function exportCSV(ids = null) {
        const source = ids ? claims.filter((s) => ids.includes(s.id)) : claims;
        const header = ["id", "claimId", "claimantName", "policyNumber", "submittedAt", "status", "amount", "reason", "notes", "attachmentsCount"];
        const rows = source.map((s) => header.map((h) => `"${String(h === "attachmentsCount" ? (s.attachments || []).length : s[h] ?? "").replace(/"/g, '""')}"`).join(","));
        const csv = [header.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solymus-claims-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: "CSV export started" });
    }

    function markReviewed(id) {
        setClaims((s) => s.map((x) => (x.id === id ? { ...x, status: "reviewed" } : x)));
        setToast({ type: "success", text: "Marked reviewed" });
    }

    function bulkMarkReviewed() {
        if (selected.size === 0) return setToast({ type: "error", text: "No claims selected" });
        const ids = Array.from(selected);
        setClaims((s) => s.map((x) => (ids.includes(x.id) ? { ...x, status: "reviewed" } : x)));
        setSelected(new Set());
        setToast({ type: "success", text: `${ids.length} claims marked reviewed` });
    }
    function openView(claim) {
        setActiveClaim(claim);
        setDrawerOpen(true);
        setTimeout(() => {
            const el = document.querySelector(".detail-drawer .drawer-body textarea");
            el?.focus();
        }, 120);
    }

    function downloadAttachment(att) {
        try {
            const arr = att.dataUrl.split(",");
            const mimePart = arr[0].match(/:(.*?);/);
            const mime = mimePart ? mimePart[1] : att.type || "application/octet-stream";
            const b64 = arr[1];
            const byteChars = atob(b64);
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = att.filename || "attachment";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            setToast({ type: "error", text: "Download failed" });
        }
    }

    function severityPill(sev) {
        if (sev === "high") return <span className="severity high">HIGH</span>;
        if (sev === "medium") return <span className="severity medium">MED</span>;
        return <span className="severity low">LOW</span>;
    }
    function confirmDelete(id) {
        setConfirm({ type: "single", id });
    }

    function doDelete(id) {
        setClaims((s) => s.filter((x) => x.id !== id));
        setConfirm(null);
        setSelected(new Set());
        setToast({ type: "success", text: "Claim removed" });
    }

    function bulkDelete() {
        if (selected.size === 0) {
            return setToast({ type: "error", text: "No claims selected" });
        }
        setConfirm({ type: "bulk", ids: Array.from(selected) });
    }

    function doBulkDelete(ids) {
        const idSet = new Set(ids);
        setClaims((s) => s.filter((x) => !idSet.has(x.id)));
        setConfirm(null);
        setSelected(new Set());
        setToast({ type: "success", text: `${ids.length} claims removed` });
    }


    const insights = useMemo(() => {
        const counts = { rejected: 0, escalated: 0, reviewed: 0 };
        let totalAmount = 0;
        const byDay = {};
        for (const c of claims) {
            counts[c.status] = (counts[c.status] || 0) + 1;
            totalAmount += Number(c.amount || 0);
            const day = new Date(c.submittedAt).toISOString().slice(0, 10);
            byDay[day] = (byDay[day] || 0) + 1;
        }
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push(byDay[key] || 0);
        }
        return { counts, totalAmount, trend: days };
    }, [claims]);

    const IconList = ({ active }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect><rect x="3" y="11" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect><rect x="3" y="17" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect></svg>
    );
    const IconGrid = ({ active }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="13" y="3" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="3" y="13" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="13" y="13" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect></svg>
    );

    function BulkActionBar({ count }) {
        return (
            <div className="bulk-bar">
                <div className="bulk-left">
                    <div className="bulk-count">{count} selected</div>
                    <div className="bulk-quick">
                        <button className="btn-ghost" onClick={() => { setSelected(new Set()); setToast({ type: "success", text: "Selection cleared" }); }}>Clear</button>
                        <button className="btn-outline" onClick={() => { setExportOpen(false); exportCSV(Array.from(selected)); }}>Export</button>
                        <button className="btn-ghost" onClick={() => bulkMarkReviewed()}>Mark reviewed</button>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" onClick={bulkDelete}>Delete</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-root insurers-luxe luxe-theme">
            <aside className="left-nav">
                <div className="nav-brand">
                    <div className="nav-crest">SC</div>
                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Claims</div>
                    </div>
                </div>

                <nav className="nav-links">
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/claims" className="nav-link active">Claims</Link>
                    <Link to="/admin/leads" className="nav-link">Leads</Link>
                    <Link to="/admin/settings" className="nav-link">Settings</Link>
                </nav>

                <div className="nav-foot">Local storage: {STORAGE_KEY}</div>
            </aside>

            <main className="main-area">
                <header className="header-hero luxe-hero">
                    <div className="hero-left">
                        <div className="hero-badge">Claims</div>
                        <div className="hero-title-wrap">
                            <h1 className="hero-title">Claim Rejection Records</h1>
                        </div>
                        <p className="hero-sub">View and export rejected claim submissions. Filters, severity and smart exports help triage quickly.</p>

                        <div className="filter-row">
                            <div className={`chip clickable`} onClick={() => { setStatusFilter("all"); setPage(1); }} data-active={statusFilter === "all"}>All</div>
                            <div className={`chip clickable`} onClick={() => { setStatusFilter("rejected"); setPage(1); }} data-active={statusFilter === "rejected"}>Rejected</div>
                            <div className={`chip clickable`} onClick={() => { setStatusFilter("escalated"); setPage(1); }} data-active={statusFilter === "escalated"}>Escalated</div>
                            <div className={`chip clickable`} onClick={() => { setStatusFilter("reviewed"); setPage(1); }} data-active={statusFilter === "reviewed"}>Reviewed</div>

                            <div style={{ width: 12 }} />

                            <div className="chip small">
                                <label style={{ fontWeight: 800, marginRight: 8 }}>Severity</label>
                                <select className="tiny-select" value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}>
                                    <option value="all">All</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            <div style={{ width: 6 }} />

                            <div className="chip small date-chip">
                                <label className="muted small">From</label>
                                <input type="date" className="tiny-date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                            </div>

                            <div className="chip small date-chip">
                                <label className="muted small">To</label>
                                <input type="date" className="tiny-date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                            </div>

                            <div style={{ marginLeft: "auto" }} />
                            <div className="chip result-chip">{filtered.length} results</div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="controls-top">
                            <div className="search-luxe">
                                <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14z" /></svg>
                                <input
                                    ref={searchRef}
                                    placeholder="Search claimants, claim id, policy... ( / or ⌘/Ctrl+K )"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                    aria-label="Search claims"
                                />
                                <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
                            </div>

                            <div className="controls-row">
                                <div className={`export-wrap ${exportOpen ? "open" : ""}`} ref={exportRef} aria-haspopup="true">
                                    <button
                                        className="btn-outline export-btn"
                                        onClick={() => setExportOpen((s) => !s)}
                                        aria-expanded={exportOpen}
                                        aria-controls="export-menu"
                                        title="Export"
                                    >
                                        <span className="gold-dot" aria-hidden />
                                        Export ▾
                                    </button>

                                    <div id="export-menu" className="export-pop" role="menu" aria-hidden={!exportOpen}>
                                        <button className="action" onClick={() => { setExportOpen(false); exportCSV(); }}>Export CSV</button>
                                        <button className="action" onClick={() => { setExportOpen(false); exportJSON(); }}>Export JSON</button>
                                        <button className="action" onClick={() => { setExportOpen(false); exportCSV(Array.from(selected)); }}>Export Selected CSV</button>
                                    </div>
                                </div>

                                <div className="view-toggle" role="tablist" aria-label="View mode">
                                    <button className={`ghost-icon ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table view"><IconList active={viewMode === "table"} /></button>
                                    <button className={`ghost-icon ${viewMode === "cards" ? "active" : ""}`} onClick={() => setViewMode("cards")} title="Card view"><IconGrid active={viewMode === "cards"} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="controls-bottom">
                            <select className="small-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
                                <option value="submittedDesc">Newest</option>
                                <option value="submittedAsc">Oldest</option>
                                <option value="claimantAsc">Claimant A → Z</option>
                                <option value="claimantDesc">Claimant Z → A</option>
                            </select>

                            <select className="small-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                                <option value={5}>5 / page</option>
                                <option value={8}>8 / page</option>
                                <option value={12}>12 / page</option>
                                <option value={24}>24 / page</option>
                            </select>

                            <div className="kpi-row">
                                <div className="kpi-card">
                                    <div className="kpi-label muted">Rejected</div>
                                    <div className="kpi-value">{insights.counts.rejected}</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-label muted">Escalated</div>
                                    <div className="kpi-value">{insights.counts.escalated}</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-label muted">Reviewed</div>
                                    <div className="kpi-value">{insights.counts.reviewed}</div>
                                </div>
                                <div className="kpi-card wide">
                                    <div className="kpi-label muted">Total amount</div>
                                    <div className="kpi-value">₹{Number(insights.totalAmount).toLocaleString()}</div>
                                    <div className="kpi-trend">
                                        <MiniSparkline values={insights.trend} stroke="#b67f2a" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="bento-card table-card powerful">
                    <div className="card-head">
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <input type="checkbox" onChange={(e) => {
                                const checked = e.target.checked;
                                setSelected(prev => {
                                    const next = new Set(prev);
                                    pageItems.forEach(i => {
                                        if (checked) next.add(i.id);
                                        else next.delete(i.id);
                                    });
                                    return next;
                                });
                            }} title="Select all on page" />
                            <div className="card-title">Rejected claims</div>
                            <div className="chip">{filtered.length} found</div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button className="btn-ghost" onClick={() => { setSelected(new Set()); setToast({ type: "success", text: "Selection cleared" }); }}>Clear</button>
                            <button className="btn-outline" onClick={bulkDelete}>Delete selected</button>
                            <div className="view-info">{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} / {filtered.length}</div>
                        </div>
                    </div>

                    <div className="card-body">
                        {selected.size > 0 && <BulkActionBar count={selected.size} />}

                        {viewMode === "table" && (
                            <div className="table-wrap">
                                <table className="hosp-table" role="table" aria-label="Claims table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Claim</th>
                                            <th>Policy</th>
                                            <th>Amount</th>
                                            <th>Reason</th>
                                            <th>Severity</th>
                                            <th>Status</th>
                                            <th style={{ width: 240 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.length === 0 && (
                                            <tr><td colSpan={8} className="empty-row"><div style={{ padding: 18, textAlign: "center" }}><strong>No claims found</strong><div className="muted">Nothing to review</div></div></td></tr>
                                        )}

                                        {pageItems.map((c) => (
                                            <tr key={c.id} className="hosp-row" title={`Submitted: ${fmt(c.submittedAt)}`}>
                                                <td><input type="checkbox" checked={selected.has(c.id)} onChange={() => {
                                                    setSelected(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(c.id)) next.delete(c.id);
                                                        else next.add(c.id);
                                                        return next;
                                                    });
                                                }} aria-label={`Select ${c.claimId}`} /></td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                        <div className="avatar" title={c.claimantName}>{(c.claimantName || "").split(" ").slice(0, 2).map((x) => x[0]).join("")}</div>
                                                        <div>
                                                            <div className="row-title">{c.claimantName} <span className="muted small">· {c.claimId}</span></div>
                                                            <div className="row-sub">Submitted {fmt(c.submittedAt)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><div className="muted strong code-pill">{c.policyNumber}</div></td>
                                                <td><div className="amount">₹{c.amount.toLocaleString()}</div></td>
                                                <td><div className="muted small" title={c.reason}>{c.reason}</div></td>
                                                <td>{severityPill(c.severity)}</td>
                                                <td><span className={`badge ${c.status === "reviewed" ? "status-active" : c.status === "escalated" ? "status-escalated" : "status-rejected"}`}>{c.status}</span></td>
                                                <td>
                                                    <div className="post-actions">
                                                        <button className="action" onClick={() => openView(c)}><span className="label">View</span></button>
                                                        <button className="action" onClick={() => markReviewed(c.id)}><span className="label">Mark<br />reviewed</span></button>
                                                        <button className="action" onClick={() => { setSelected(new Set([c.id])); exportCSV([c.id]); }}><span className="label">Export</span></button>
                                                        <div className="divider" />
                                                        <button className="action danger" onClick={() => confirmDelete(c.id)}><span className="label">Delete</span></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {viewMode === "cards" && (
                            <div className="cards-grid">
                                {pageItems.length === 0 && <div className="muted">No claims to show</div>}
                                {pageItems.map((c) => (
                                    <article key={c.id} className="insurer-card">
                                        <div className="card-top">
                                            <div className="card-left">
                                                <div className="avatar large">{(c.claimantName || "").split(" ").slice(0, 2).map(x => x[0]).join("")}</div>
                                                <div>
                                                    <div className="card-title-strong">{c.claimantName}</div>
                                                    <div className="muted small">{c.claimId} · {c.policyNumber}</div>
                                                </div>
                                            </div>
                                            <div className="card-right">
                                                <div className="muted small">{fmt(c.submittedAt)}</div>
                                                <span className={`badge ${c.status === "reviewed" ? "status-active" : c.status === "escalated" ? "status-escalated" : "status-rejected"}`}>{c.status}</span>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <div className="muted">{c.reason}</div>
                                            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                                                <div style={{ fontWeight: 900, fontSize: 16 }}>₹{c.amount.toLocaleString()}</div>
                                                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                                                    <button className="btn-outline" onClick={() => openView(c)}>Open</button>
                                                    <button className="btn-ghost" onClick={() => markReviewed(c.id)}>Review</button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        <div className="pagination-row">
                            <div className="muted small">{(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button className="btn-outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <input className="page-input" value={page} onChange={(e) => setPage(Number(e.target.value || 1))} />
                                    <small className="muted small"> / {totalPages}</small>
                                </div>
                                <button className="btn-primary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                            </div>
                        </div>
                    </div>
                </section>

                {drawerOpen && activeClaim && (
                    <div className="detail-drawer panel-drop" role="dialog" aria-modal>
                        <div className="drawer-head">
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div className="avatar large drawer-avatar">{(activeClaim.claimantName || "").split(" ").slice(0, 2).map(x => x[0]).join("")}</div>
                                <div>
                                    <div className="drawer-title">{activeClaim.claimantName} <span className="muted small">· {activeClaim.claimId}</span></div>
                                    <div className="muted small">Submitted {fmt(activeClaim.submittedAt)}</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="action" onClick={() => { setDrawerOpen(false); setActiveClaim(null); }}>Close</button>
                            </div>
                        </div>

                        <div className="drawer-body">
                            <div className="drawer-grid">
                                <div>
                                    <div className="field-label">Claimant</div>
                                    <div style={{ fontWeight: 900 }}>{activeClaim.claimantName}</div>
                                </div>

                                <div>
                                    <div className="field-label">Policy</div>
                                    <div className="muted">{activeClaim.policyNumber}</div>
                                </div>

                                <div>
                                    <div className="field-label">Amount</div>
                                    <div style={{ fontWeight: 900 }}>₹{activeClaim.amount.toLocaleString()}</div>
                                </div>

                                <div>
                                    <div className="field-label">Status</div>
                                    <select value={activeClaim.status} onChange={(e) => setActiveClaim((s) => ({ ...s, status: e.target.value }))}>
                                        <option value="rejected">Rejected</option>
                                        <option value="escalated">Escalated</option>
                                        <option value="reviewed">Reviewed</option>
                                    </select>
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div className="field-label">Reason</div>
                                    <textarea value={activeClaim.reason} onChange={(e) => setActiveClaim((s) => ({ ...s, reason: e.target.value }))} />
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div className="field-label">Notes</div>
                                    <textarea value={activeClaim.notes} onChange={(e) => setActiveClaim((s) => ({ ...s, notes: e.target.value }))} />
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div className="field-label">Attachments</div>
                                    {(activeClaim.attachments || []).length === 0 && <div className="muted">No attachments</div>}
                                    {(activeClaim.attachments || []).map((a) => (
                                        <div key={a.id} className="file-row" style={{ marginTop: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 900 }}>{a.filename}</div>
                                                <div className="muted small">{Math.round(a.size / 1024)} KB • {new Date(a.uploadedAt).toLocaleString()}</div>
                                            </div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button className="btn-outline" onClick={() => window.open(a.dataUrl, "_blank", "noopener")}>View</button>
                                                <button className="btn-ghost" onClick={() => downloadAttachment(a)}>Download</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="drawer-actions" style={{ gridColumn: "1 / -1" }}>
                                    <div>
                                        <button className="btn-ghost" onClick={() => { setDrawerOpen(false); setActiveClaim(null); }}>Cancel</button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button className="btn-outline" onClick={() => { /* save local changes only */ setClaims((s) => s.map((r) => (r.id === activeClaim.id ? { ...r, ...activeClaim } : r))); setToast({ type: "success", text: "Claim saved" }); }}>Save</button>
                                        <button className="btn-primary" onClick={() => { setClaims((s) => s.map((r) => (r.id === activeClaim.id ? { ...r, ...activeClaim } : r))); setToast({ type: "success", text: "Claim updated" }); setDrawerOpen(false); setActiveClaim(null); }}>Save & Close</button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {confirm && (
                    <div className="preview-overlay">
                        <div className="preview-card bento-card confirm-modal">
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ fontSize: 22 }}>⚠️</div>
                                <div>
                                    <div style={{ fontWeight: 900 }}>{confirm.type === "single" ? "Delete claim?" : `Delete ${confirm.ids.length} claims?`}</div>
                                    <div className="muted">This will permanently remove the selected records and attachments.</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                                <button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
                                <button className="btn-primary" onClick={() => { if (confirm.type === "single") doDelete(confirm.id); else doBulkDelete(confirm.ids); }}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                {toast && (
                    <div className={`toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`}>
                        <span style={{ marginRight: 8 }}>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}</span>
                        {toast.text}
                    </div>
                )}

            </main>
        </div>
    );
}
