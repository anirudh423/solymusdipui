import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/solymus-branches.css";
import { Link } from "react-router-dom";

const STORAGE_KEY = "solymus_branches_v1";

function uid(prefix = "b") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const sampleBranches = [
    {
        id: uid(),
        name: "Solymus — Corporate HQ",
        code: "HQ-01",
        address: "12, Merchant Row",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "+91 22 1234 5678",
        email: "hq@solymus.example",
        status: "active",
        createdAt: new Date().toISOString(),
    },
    {
        id: uid(),
        name: "Solymus — Pune Branch",
        code: "PN-02",
        address: "42, Tech Park",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        phone: "+91 20 9988 7766",
        email: "pune@solymus.example",
        status: "active",
        createdAt: new Date().toISOString(),
    },
];



export default function AdminBranches() {
    const [branches, setBranches] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : sampleBranches;
        } catch {
            return sampleBranches;
        }
    });

    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [sortBy, setSortBy] = useState("createdDesc");
    const [viewMode, setViewMode] = useState("table");

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [importText, setImportText] = useState("");
    const [compact] = useState(false);
    const [editingTab, setEditingTab] = useState("details");

    const [exportOpen, setExportOpen] = useState(false);

    const nameRef = useRef();
    const searchRef = useRef();
    const exportRef = useRef();

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
        } catch (e) {
            console.error("save fail", e);
        }
    }, [branches]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        function onDoc(e) {
            if (exportOpen && exportRef.current && !exportRef.current.contains(e.target)) {
                setExportOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [exportOpen]);

    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
                return;
            }
            if (e.key === "N" || e.key === "n") {
                openCreate();
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

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return branches.filter((b) => {
            if (statusFilter !== "all" && b.status !== statusFilter) return false;
            if (!q) return true;
            return (
                b.name.toLowerCase().includes(q) ||
                (b.city || "").toLowerCase().includes(q) ||
                (b.state || "").toLowerCase().includes(q) ||
                (b.code || "").toLowerCase().includes(q) ||
                (b.phone || "").toLowerCase().includes(q) ||
                (b.email || "").toLowerCase().includes(q)
            );
        });
    }, [branches, query, statusFilter]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortBy) {
            case "nameAsc":
                arr.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "nameDesc":
                arr.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "createdAsc":
                arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            default:
                arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return arr;
    }, [filtered, sortBy]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page, perPage]);

    const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

    function openCreate() {
        setEditing({
            id: null,
            name: "",
            code: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            phone: "",
            email: "",
            status: "active",
        });
        setEditingTab("details");
        setDrawerOpen(true);
        setTimeout(() => nameRef.current?.focus(), 120);
    }

    function openEdit(b) {
        setEditing({ ...b });
        setEditingTab("details");
        setDrawerOpen(true);
        setTimeout(() => nameRef.current?.focus(), 120);
    }

    function duplicateBranch(b) {
        const copy = { ...b, id: uid(), name: `${b.name} (copy)`, createdAt: new Date().toISOString() };
        setBranches((s) => [copy, ...s]);
        setToast({ type: "success", text: "Branch duplicated" });
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text || "");
            setToast({ type: "success", text: "Copied to clipboard" });
        } catch {
            setToast({ type: "error", text: "Copy failed" });
        }
    }

    function saveEditing() {
        if (!editing) return;
        if (!editing.name.trim()) return setToast({ type: "error", text: "Branch name is required" });
        if (!editing.code.trim()) return setToast({ type: "error", text: "Branch code is required" });

        if (editing.id) {
            setBranches((s) => s.map((r) => (r.id === editing.id ? { ...r, ...editing } : r)));
            setToast({ type: "success", text: "Branch updated" });
        } else {
            const newB = { ...editing, id: uid(), createdAt: new Date().toISOString() };
            setBranches((s) => [newB, ...s]);
            setToast({ type: "success", text: "Branch created" });
        }
        setDrawerOpen(false);
        setEditing(null);
    }

    function toggleStatus(id) {
        setBranches((s) => s.map((b) => (b.id === id ? { ...b, status: b.status === "active" ? "inactive" : "active" } : b)));
        setToast({ type: "success", text: "Status toggled" });
    }

    function confirmDelete(id) {
        setConfirm({ type: "single", id });
    }

    function doDelete(id) {
        setBranches((s) => s.filter((b) => b.id !== id));
        setConfirm(null);
        setToast({ type: "success", text: "Branch deleted" });
        setSelected(new Set());
    }

    function bulkDelete() {
        if (selected.size === 0) return setToast({ type: "error", text: "No branches selected" });
        setConfirm({ type: "bulk", ids: Array.from(selected) });
    }

    function doBulkDelete(ids) {
        const idSet = new Set(ids);
        setBranches((s) => s.filter((b) => !idSet.has(b.id)));
        setConfirm(null);
        setSelected(new Set());
        setToast({ type: "success", text: `${ids.length} branches removed` });
    }

    function toggleSelect(id) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function selectAllOnPage(e) {
        const checked = e.target.checked;
        setSelected((prev) => {
            const next = new Set(prev);
            pageItems.forEach((b) => {
                if (checked) next.add(b.id);
                else next.delete(b.id);
            });
            return next;
        });
    }

    function exportJSON() {
        const dataStr = JSON.stringify(branches, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solymus-branches-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: "Export started" });
    }

    function exportCSV(ids = null) {
        const source = ids ? branches.filter((b) => ids.includes(b.id)) : branches;
        const header = ["id", "name", "code", "address", "city", "state", "pincode", "phone", "email", "status", "createdAt"];
        const rows = source.map((b) => header.map((h) => `"${String(b[h] ?? "").replace(/"/g, '""')}"`).join(","));
        const csv = [header.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solymus-branches-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: "CSV export started" });
    }

    function importJSON(raw) {
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error("Not an array");
            const now = new Date().toISOString();
            const sanitized = parsed.map((p) => ({
                id: p.id || uid(),
                name: p.name || "Untitled branch",
                code: p.code || "-",
                address: p.address || "",
                city: p.city || "",
                state: p.state || "",
                pincode: p.pincode || "",
                phone: p.phone || "",
                email: p.email || "",
                status: p.status === "inactive" ? "inactive" : "active",
                createdAt: p.createdAt || now,
            }));
            setBranches((s) => [...sanitized, ...s]);
            setToast({ type: "success", text: `${sanitized.length} branches imported` });
            setImportText("");
        } catch {
            setToast({ type: "error", text: "Invalid JSON" });
        }
    }

    function fmt(dt) {
        try {
            return new Date(dt).toLocaleString();
        } catch {
            return dt;
        }
    }

    const newest = useMemo(() => {
        if (!branches || branches.length === 0) return null;
        return [...branches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }, [branches]);

    const insights = useMemo(() => {
        const now = Date.now();
        const oneDay = 1000 * 60 * 60 * 24;
        const oneWeek = oneDay * 7;
        let today = 0,
            week = 0;
        branches.forEach((b) => {
            const t = new Date(b.createdAt).getTime();
            if (now - t < oneDay) today++;
            if (now - t < oneWeek) week++;
        });
        return { today, week };
    }, [branches]);


    const IconExport = ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 3v10h4l-5 8-5-8h4V3zM4 20h16v2H4z" /></svg>
    );
    const IconNew = ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
    );
    const IconTrash = ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
    );
    const IconSpark = ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 2l1.8 4.6L18.9 8l-4.6 1.8L12 14l-1.8-4.2L5.5 8l4.6-1.4L12 2z" /></svg>
    );



    function BulkActionBar({ count }) {
        return (
            <div style={{
                position: "sticky",
                bottom: 18,
                zIndex: 100,
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 12,
                background: "linear-gradient(180deg, rgba(255,250,245,0.95), rgba(255,255,255,0.9))",
                boxShadow: "0 10px 30px rgba(10,14,15,0.06)",
                border: "1px solid rgba(10,12,14,0.04)"
            }}>
                <div style={{ padding: "8px 12px", borderRadius: 10, background: "linear-gradient(90deg,#fffef9,#fff)", fontWeight: 700 }}>{count} selected</div>
                <button className="btn-outline" onClick={() => exportCSV(Array.from(selected))}>Export selected</button>
                <button className="btn-ghost" onClick={() => { const ids = Array.from(selected); ids.forEach(id => toggleStatus(id)); setSelected(new Set()); }}>Toggle status</button>
                <button className="btn-primary" onClick={bulkDelete} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><IconTrash /> Delete</button>
            </div>
        );
    }



    return (
        <div className="dash-root branch-luxe" style={{ minHeight: "100vh", background: "linear-gradient(180deg,#fbfaf8,#fff)" }}>
            <aside className="left-nav" style={{ borderRight: "1px solid rgba(10,12,14,0.04)" }}>
                <div className="nav-brand" style={{ padding: "20px 18px" }}>
                    <div className="nav-crest" style={{ background: "linear-gradient(180deg,#caa24a,#8b5a1a)", color: "#071211", fontWeight: 900, boxShadow: "0 6px 24px rgba(167,126,45,0.12)" }}>SB</div>
                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Branch Manager</div>
                    </div>
                </div>

                <nav className="nav-links" style={{ padding: 12 }}>
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link active">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/claims" className="nav-link">Claims</Link>
                    <Link to="/admin/leads" className="nav-link">Leads</Link>
                    <Link to='/admin/quote-pricing' className="nav-link">Quote Pricing</Link>

                    <Link to="/admin/settings" className="nav-link">Settings</Link>

                </nav>

                <div className="nav-foot" style={{ padding: 12, fontSize: 12, color: "var(--muted)" }}>
                    Local storage: {STORAGE_KEY}
                </div>
            </aside>

            <main className="main-area" style={{ padding: 20 }}>
                <header className="header-luxe header-hero" style={{
                    display: "grid",
                    gridTemplateColumns: "260px 1fr 320px",
                    gap: 18,
                    alignItems: "start",
                    marginBottom: 18,
                    position: "relative",
                    padding: 18,
                    borderRadius: 16,
                    background: "linear-gradient(90deg, rgba(234,225,202,0.08), rgba(255,255,255,0.02))",
                    boxShadow: "0 18px 80px rgba(10,14,15,0.06)",
                    border: "1px solid rgba(10,12,14,0.03)"
                }}>
                    <div style={{ pointerEvents: "none", position: "absolute", right: 18, top: -10, opacity: 0.06 }}>
                        <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0" stopColor="#caa24a" stopOpacity="0.25" />
                                    <stop offset="1" stopColor="#a77e2d" stopOpacity="0.08" />
                                </linearGradient>
                            </defs>
                            <rect x="0" y="0" width="220" height="120" rx="12" fill="url(#g1)" />
                        </svg>
                    </div>

                    <div className="hero-left">
                        <h1 className="hero-title" style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>Branches</h1>
                        <p className="hero-sub" style={{ marginTop: 8, color: "var(--muted)", maxWidth: 420 }}>
                            Crafted presence — curate locations, refine contacts, and govern status with confidence.
                            <span className="muted small" style={{ display: "block", marginTop: 8 }}>Shortcuts: <strong>N</strong> · <strong>/</strong> · <strong>⌘/Ctrl+K</strong></span>
                        </p>

                        <div className="filter-row" style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                            <div className="chip clickable" onClick={() => { setStatusFilter("all"); setPage(1); }} data-active={statusFilter === "all"} style={{ padding: "8px 12px" }}>All</div>
                            <div className="chip clickable" onClick={() => { setStatusFilter("active"); setPage(1); }} data-active={statusFilter === "active"} style={{ padding: "8px 12px" }}>Active</div>
                            <div className="chip clickable" onClick={() => { setStatusFilter("inactive"); setPage(1); }} data-active={statusFilter === "inactive"} style={{ padding: "8px 12px" }}>Inactive</div>
                            <div className="chip" style={{ marginLeft: 8, padding: "8px 12px", background: "linear-gradient(180deg,#fffef9,#fff)", boxShadow: "0 6px 16px rgba(10,14,15,0.03)" }}>{filtered.length} results</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div className="search-luxe" style={{ flex: 1 }}>
                                <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14z" /></svg>
                                <input
                                    ref={searchRef}
                                    placeholder="Search branches, city, code, contact... (press /)"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                    aria-label="Search branches"
                                />
                                <button className="search-clear" onClick={() => setQuery("")} title="Clear search">✕</button>
                            </div>

                            <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8 }}>
                                <button className="btn-primary" onClick={openCreate} title="New Branch" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}><IconNew />New</button>

                                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }} ref={exportRef}>
                                    <div style={{ position: "relative" }}>
                                        <button className="btn-outline" onClick={() => setExportOpen((s) => !s)} aria-haspopup="true" aria-expanded={exportOpen}><IconExport /></button>
                                        {exportOpen && (
                                            <div style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 8px)",
                                                minWidth: 180,
                                                borderRadius: 10,
                                                padding: 10,
                                                background: "#fff",
                                                boxShadow: "0 12px 40px rgba(10,14,15,0.08)",
                                                border: "1px solid rgba(10,12,14,0.04)",
                                                zIndex: 40
                                            }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                    <button className="action" onClick={() => { exportCSV(); setExportOpen(false); }}>Export All CSV</button>
                                                    <button className="action" onClick={() => { exportJSON(); setExportOpen(false); }}>Export All JSON</button>
                                                    <button className="action" onClick={() => { exportCSV(Array.from(selected)); setExportOpen(false); }}>Export Selected CSV</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button className="btn-ghost" title="More actions" onClick={() => setToast({ type: "info", text: "Try export or create a branch" })}>⋯</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div className="bento-card" style={{ padding: 14, borderRadius: 12, display: "flex", gap: 12, alignItems: "center", boxShadow: "0 10px 30px rgba(10,14,15,0.04)" }}>
                                    <div style={{ width: 76, height: 76, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(90deg,#caa24a,#a77e2d)", fontFamily: "Georgia, serif", fontWeight: 900, color: "#071211", fontSize: 20 }}>
                                        {newest ? newest.name.split(" ").slice(0, 2).map((s) => s[0]).join("") : "SB"}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 900, fontSize: 16 }}>{newest ? newest.name : "No spotlight yet"}</div>
                                        <div className="muted small" style={{ marginTop: 6 }}>{newest ? `${newest.city}, ${newest.state} · ${newest.code}` : "Create a branch to spotlight it here"}</div>
                                        {newest && (
                                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                                <button className="btn-outline" onClick={() => openEdit(newest)}>Open</button>
                                                <button className="btn-ghost" onClick={() => copyToClipboard(newest.email)}>Copy email</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ width: 260 }}>
                                <div className="bento-card" style={{ padding: 12, borderRadius: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: "var(--muted)" }}>Insights</div>
                                            <div style={{ fontWeight: 900, fontSize: 18 }}>{insights.week} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>this week</span></div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 12, color: "var(--muted)" }}>Today</div>
                                            <div style={{ fontWeight: 900, fontSize: 18 }}>{insights.today}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 12, textAlign: "center" }}>
                                        <div style={{ fontWeight: 900, fontSize: 18 }}>{branches.length}</div>
                                        <div className="muted small">Total branches</div>
                                        <div style={{ marginTop: 8 }}>
                                            <button className="btn-outline" onClick={() => { setToast({ type: "info", text: "Open insights in Analytics (coming soon)" }); }}>Open Insights</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <div className="kpi-chip luxe" style={{ background: "linear-gradient(180deg,#fff,#fffef8)", padding: 12, borderRadius: 12, boxShadow: "0 10px 30px rgba(10,14,15,0.04)" }}>
                                <div className="kpi-val" style={{ fontWeight: 900, fontSize: 18 }}>{branches.length}</div>
                                <div className="kpi-sub muted small">Total</div>
                            </div>
                            <div className="kpi-chip luxe" style={{ background: "linear-gradient(180deg,#fff,#fffef8)", padding: 12, borderRadius: 12, boxShadow: "0 10px 30px rgba(10,14,15,0.04)" }}>
                                <div className="kpi-val" style={{ fontWeight: 900, fontSize: 18 }}>{branches.filter((b) => b.status === "active").length}</div>
                                <div className="kpi-sub muted small">Active</div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select className="small-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sort" style={{ padding: "8px 10px", borderRadius: 10 }}>
                                <option value="createdDesc">Newest</option>
                                <option value="createdAsc">Oldest</option>
                                <option value="nameAsc">Name A → Z</option>
                                <option value="nameDesc">Name Z → A</option>
                            </select>

                            <select className="small-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} title="Rows per page" style={{ padding: "8px 10px", borderRadius: 10 }}>
                                <option value={5}>5 / page</option>
                                <option value={8}>8 / page</option>
                                <option value={12}>12 / page</option>
                                <option value={24}>24 / page</option>
                            </select>
                        </div>
                    </div>
                </header>

                <section className="bento-card table-card" style={{ padding: 16, borderRadius: 12 }}>
                    <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <input type="checkbox" onChange={selectAllOnPage} title="Select all on page" />
                            <div className="card-title" style={{ fontSize: 18, fontWeight: 800 }}>Branch directory</div>
                            <div className="chip" style={{ padding: "6px 10px" }}>{filtered.length} found</div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn-ghost" onClick={() => { setSelected(new Set()); setToast({ type: "success", text: "Selection cleared" }); }}>Clear</button>
                                <button className="btn-outline" onClick={bulkDelete} title="Delete selected">Delete selected</button>
                            </div>

                            <div className="view-info" style={{ color: "var(--muted)" }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} / {filtered.length}</div>
                        </div>
                    </div>

                    <div className="card-body" style={{ marginTop: 12 }}>
                        {selected.size > 0 && <BulkActionBar count={selected.size} />}

                        {viewMode === "table" && (
                            <div className={`table-wrap ${compact ? "compact" : ""}`} style={{ overflowX: "auto", borderRadius: 10 }}>
                                <table className="hosp-table luxe-table" role="table" aria-label="Branches table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 28 }}></th>
                                            <th>Name</th>
                                            <th>Code</th>
                                            <th>Location</th>
                                            <th>Contact</th>
                                            <th>Status</th>
                                            <th style={{ width: 240 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="empty-row">
                                                    <div style={{ padding: 18, textAlign: "center" }}>
                                                        <strong>No branches found</strong>
                                                        <div className="muted">Create a new branch to get started, or try resetting filters.</div>
                                                        <div style={{ marginTop: 10 }}>
                                                            <button className="btn-primary" onClick={openCreate}>Create branch</button>
                                                            <button className="btn-ghost" onClick={() => { setStatusFilter("all"); setQuery(""); }}>Reset filters</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {pageItems.map((b) => (
                                            <tr key={b.id} className="hosp-row" title={`Created: ${fmt(b.createdAt)}`} style={{
                                                transition: "transform .18s ease, box-shadow .18s ease",
                                            }}>
                                                <td>
                                                    <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} aria-label={`Select ${b.name}`} />
                                                </td>

                                                <td>
                                                    <div className="row-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                        <div className="avatar" title={b.name} style={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: 10,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            background: "linear-gradient(90deg,#f7efe0,#f3e6c7)",
                                                            fontFamily: "Georgia, serif",
                                                            fontWeight: 800,
                                                            color: "#4b3a1a"
                                                        }}>
                                                            {(b.name || "").split(" ").slice(0, 2).map((s) => s[0]).join("")}
                                                        </div>
                                                        <div>
                                                            <div className="row-title" style={{ fontWeight: 800 }}>{b.name}</div>
                                                            <div className="row-sub muted small">{b.address}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td><div className="muted strong">{b.code}</div></td>

                                                <td><div className="muted">{b.city}, {b.state} <span className="muted small">· {b.pincode}</span></div></td>

                                                <td>
                                                    <div className="muted">{b.phone}</div>
                                                    <div className="muted small">{b.email}</div>
                                                </td>

                                                <td>
                                                    <span className={`badge ${b.status === "active" ? "status-active" : "status-inactive"}`} style={{
                                                        padding: "6px 10px",
                                                        borderRadius: 999,
                                                        background: b.status === "active" ? "linear-gradient(90deg,#e6f9f0,#e6fff6)" : "linear-gradient(90deg,#fff6f6,#fff0f0)",
                                                        color: b.status === "active" ? "#0b6b4f" : "#8b2a2a",
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 8
                                                    }}>
                                                        {b.status === "active" ? "Active" : "Inactive"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="post-actions" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                                                        <button className="action" onClick={() => openEdit(b)} title="Edit branch">Edit</button>
                                                        <button className="action" onClick={() => duplicateBranch(b)} title="Duplicate">Copy</button>
                                                        <button className="action" onClick={() => copyToClipboard(b.email)} title="Copy email">Email</button>
                                                        <button className="action" onClick={() => toggleStatus(b.id)} title={b.status === "active" ? "Disable branch" : "Activate branch"}>{b.status === "active" ? "Disable" : "Activate"}</button>
                                                        <div className="divider" />
                                                        <button className="action danger" onClick={() => confirmDelete(b.id)} title="Delete branch">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {viewMode === "cards" && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                {pageItems.length === 0 && (
                                    <div style={{ gridColumn: "1 / -1", padding: 18, borderRadius: 12, textAlign: "center" }}>
                                        <strong>No branches found</strong>
                                        <div className="muted">Create a new branch to get started, or try resetting filters.</div>
                                        <div style={{ marginTop: 10 }}>
                                            <button className="btn-primary" onClick={openCreate}>Create branch</button>
                                            <button className="btn-ghost" onClick={() => { setStatusFilter("all"); setQuery(""); }}>Reset filters</button>
                                        </div>
                                    </div>
                                )}

                                {pageItems.map((b) => (
                                    <article key={b.id} className="article-card" style={{
                                        borderRadius: 12,
                                        padding: 16,
                                        background: "linear-gradient(180deg,#fffefb,#fff)",
                                        boxShadow: "0 20px 60px rgba(10,14,15,0.06)",
                                        border: "1px solid rgba(15,20,24,0.03)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 12,
                                        transition: "transform .14s ease, box-shadow .14s ease"
                                    }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <div style={{ width: 64, height: 64, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(90deg,#caa24a,#a77e2d)", fontFamily: "Georgia, serif", fontWeight: 900, color: "#071211", fontSize: 18 }}>
                                                {(b.name || "").split(" ").slice(0, 2).map((s) => s[0]).join("")}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 900 }}>{b.name}</div>
                                                <div className="muted small" style={{ marginTop: 6 }}>{b.address}</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 900 }}>{b.code}</div>
                                                <div className="muted small">{fmt(b.createdAt)}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div className="muted">Contact</div>
                                                <div style={{ fontWeight: 800 }}>{b.phone} · {b.email}</div>
                                                <div className="muted small" style={{ marginTop: 6 }}>{b.city}, {b.state} · {b.pincode}</div>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                                                <span className={`badge ${b.status === "active" ? "status-active" : "status-inactive"}`} style={{ marginBottom: 6, padding: "6px 10px", borderRadius: 999 }}>{b.status}</span>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button className="btn-outline" onClick={() => openEdit(b)}>Open</button>
                                                    <button className="btn-ghost" onClick={() => duplicateBranch(b)}>Duplicate</button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        <div className="pagination-row" role="navigation" aria-label="Pagination" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div className="muted small">{(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button className="btn-outline" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">Prev</button>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <input className="page-input" value={page} onChange={(e) => setPage(Number(e.target.value || 1))} aria-label="Page number" style={{ width: 56, textAlign: "center" }} />
                                    <small className="muted small"> / {totalPages}</small>
                                </div>
                                <button className="btn-primary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">Next</button>
                            </div>
                        </div>
                    </div>
                </section>

                {drawerOpen && (
                    <div className={`detail-drawer panel-drop`} role="dialog" aria-modal style={{ zIndex: 120 }}>
                        <div className="drawer-head drawer-head-foil" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
                            <div>
                                <div className="drawer-title" style={{ fontWeight: 900 }}>{editing?.id ? "Edit Branch" : "New Branch"}</div>
                                <div className="muted small">{editing?.id ? `Created ${fmt(editing.createdAt)}` : "Create a new branch record"}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="action" onClick={() => { setDrawerOpen(false); setEditing(null); }} aria-label="Close drawer">Close</button>
                            </div>
                        </div>

                        <div className="drawer-body" style={{ padding: 16 }}>
                            <div className="drawer-tabs" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                                <button className={`tab ${editingTab === "details" ? "active" : ""}`} onClick={() => setEditingTab("details")}>Details</button>
                                <button className={`tab ${editingTab === "map" ? "active" : ""}`} onClick={() => setEditingTab("map")}>Map</button>
                                <button className={`tab ${editingTab === "activity" ? "active" : ""}`} onClick={() => setEditingTab("activity")}>Activity</button>
                            </div>

                            {editingTab === "details" && (
                                <>
                                    <div className="drawer-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <label style={{ display: "block" }}>
                                            <div className="field-label">Name</div>
                                            <input ref={nameRef} value={editing?.name || ""} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
                                        </label>

                                        <label style={{ display: "block" }}>
                                            <div className="field-label">Code</div>
                                            <input value={editing?.code || ""} onChange={(e) => setEditing((s) => ({ ...s, code: e.target.value }))} />
                                        </label>

                                        <label className="full" style={{ gridColumn: "1 / -1" }}>
                                            <div className="field-label">Address</div>
                                            <input value={editing?.address || ""} onChange={(e) => setEditing((s) => ({ ...s, address: e.target.value }))} />
                                        </label>

                                        <label>
                                            <div className="field-label">City</div>
                                            <input value={editing?.city || ""} onChange={(e) => setEditing((s) => ({ ...s, city: e.target.value }))} />
                                        </label>

                                        <label>
                                            <div className="field-label">State</div>
                                            <input value={editing?.state || ""} onChange={(e) => setEditing((s) => ({ ...s, state: e.target.value }))} />
                                        </label>

                                        <label>
                                            <div className="field-label">Pincode</div>
                                            <input value={editing?.pincode || ""} onChange={(e) => setEditing((s) => ({ ...s, pincode: e.target.value }))} />
                                        </label>

                                        <label>
                                            <div className="field-label">Phone</div>
                                            <input value={editing?.phone || ""} onChange={(e) => setEditing((s) => ({ ...s, phone: e.target.value }))} />
                                        </label>

                                        <label>
                                            <div className="field-label">Email</div>
                                            <input value={editing?.email || ""} onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} />
                                        </label>

                                        <label className="full" style={{ gridColumn: "1 / -1" }}>
                                            <div className="field-label">Status</div>
                                            <select value={editing?.status || "active"} onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))}>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="drawer-actions" style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                                        <div>
                                            <button className="btn-ghost" onClick={() => { setDrawerOpen(false); setEditing(null); }}>Cancel</button>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button className="btn-outline" onClick={() => { setImportText(""); setToast({ type: "info", text: "Import area cleared" }); }}>Clear import</button>
                                            <button className="btn-primary" onClick={saveEditing}>Save branch</button>
                                        </div>
                                    </div>

                                    <hr style={{ margin: "18px 0" }} />

                                    <div>
                                        <div className="field-label">Import branches (paste JSON)</div>
                                        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[ { "name": "X", "code": "C" } ]' />
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                                            <button className="btn-ghost" onClick={() => setImportText("")}>Clear</button>
                                            <button className="btn-outline" onClick={() => importJSON(importText)}>Import JSON</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {editingTab === "map" && (
                                <div style={{ padding: 12 }}>
                                    <div style={{ marginBottom: 8, fontWeight: 800 }}>Map preview</div>
                                    <div style={{ height: 240, borderRadius: 12, background: "linear-gradient(180deg,#f7f5f0,#fff)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", border: "1px solid rgba(15,20,24,0.04)" }}>
                                        Map placeholder — integrate Leaflet/Google Maps when ready
                                    </div>
                                </div>
                            )}

                            {editingTab === "activity" && (
                                <div style={{ padding: 12 }}>
                                    <div style={{ marginBottom: 8, fontWeight: 800 }}>Recent activity</div>
                                    <div className="insights-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div className="insight-item">Created branch record • {editing?.createdAt ? fmt(editing.createdAt) : "—"}</div>
                                        <div className="insight-item">No recent updates</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {confirm && (
                    <div className="preview-overlay" style={{ zIndex: 200 }}>
                        <div className="preview-card bento-card confirm-modal" style={{ padding: 18, borderRadius: 12 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ fontSize: 22 }}>⚠️</div>
                                <div>
                                    <div style={{ fontWeight: 900 }}>{confirm.type === "single" ? "Delete branch?" : `Delete ${confirm.ids.length} branches?`}</div>
                                    <div className="muted">This action permanently removes the selected branch records.</div>
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
                    <div className={`toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`} role="status" style={{
                        position: "fixed",
                        right: 20,
                        bottom: 20,
                        padding: "12px 16px",
                        borderRadius: 10,
                        boxShadow: "0 8px 32px rgba(10,14,15,0.08)",
                        zIndex: 400
                    }}>
                        <span style={{ marginRight: 8 }}>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}</span>
                        {toast.text}
                    </div>
                )}

                <div className="fab-wrap" style={{ position: "fixed", right: 22, bottom: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                    <button className="fab-new" onClick={openCreate} title="New branch" style={{ padding: "12px 16px", borderRadius: 999, boxShadow: "0 12px 40px rgba(10,14,15,0.12)" }}>+ New</button>
                    <button className="fab-mini" onClick={() => exportCSV()} title="Export CSV" style={{ padding: 10, borderRadius: 10 }}>CSV</button>
                </div>
            </main>
        </div>
    );
}
