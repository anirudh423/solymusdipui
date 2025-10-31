import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/solymus-quote-pricing.css";

import * as XLSX from "xlsx";

const STORAGE_KEY = "solymus_quote_pricing_v1";
const VIEW_KEY = "solymus_quote_pricing_view_v1";

function uid(prefix = "r") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const sampleTables = [
    {
        id: uid(),
        name: "Base Rates - Individual (v1)",
        filename: "base-rates-individual.xlsx",
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        enabled: true,
        version: 1,
        tags: ["individual", "base"],
        notes: "Sample base rate table for testing",
        columns: ["age", "gender", "sumInsured", "rate"],
        rows: [
            { age: 18, gender: "M", sumInsured: 100000, rate: 0.8 },
            { age: 30, gender: "F", sumInsured: 200000, rate: 1.2 },
        ],
        versions: [],
    },
];

export default function AdminQuotePricing() {
    const [tables, setTables] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : sampleTables;
        } catch (e) {
            return sampleTables;
        }
    });

    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_KEY) || "table");
    const [activeTable, setActiveTable] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewRows, setPreviewRows] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const fileInputRef = useRef();
    const searchRef = useRef();

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }, [tables]);

    useEffect(() => {
        localStorage.setItem(VIEW_KEY, viewMode);
    }, [viewMode]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
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
                setPreviewOpen(false);
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

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tables.filter((t) => {
            if (statusFilter !== "all" && ((statusFilter === "enabled") !== !!t.enabled)) return false;
            if (!q) return true;
            return (
                (t.name || "").toLowerCase().includes(q) ||
                (t.filename || "").toLowerCase().includes(q) ||
                (t.tags || []).join(" ").toLowerCase().includes(q) ||
                (t.notes || "").toLowerCase().includes(q)
            );
        });
    }, [tables, query, statusFilter]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortBy) {
            case "oldest":
                arr.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
                break;
            case "nameAsc":
                arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case "nameDesc":
                arr.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
                break;
            default:
                arr.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
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
        } catch { return dt; }
    }

    function downloadTemplate() {
        const header = ["age,gender,sumInsured,rate"];
        const blob = new Blob([header.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rate-table-template.csv";
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: "Template downloaded" });
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        readFileAndParse(file);
        e.target.value = "";
    }

    async function readFileAndParse(file) {
        const name = file.name;
        const ext = name.split('.').pop().toLowerCase();
        try {
            if (ext === 'csv') {
                const text = await file.text();
                const rows = parseCSV(text);
                saveParsedTable({ file, name, rows, columns: inferColumns(rows) });
            } else {
                // try XLSX
                const ab = await file.arrayBuffer();
                const workbook = XLSX.read(ab, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                saveParsedTable({ file, name, rows, columns: Object.keys(rows[0] || {}) });
            }
        } catch (e) {
            console.error(e);
            setToast({ type: 'error', text: 'Failed to parse file' });
        }
    }

    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim());
            const obj = {};
            headers.forEach((h, i) => obj[h] = parseValue(cols[i] ?? ""));
            return obj;
        });
        return data;
    }

    function parseValue(v) {
        if (v === '') return '';
        if (!isNaN(Number(v))) return Number(v);
        const low = v.toLowerCase();
        if (low === 'true' || low === 'false') return low === 'true';
        return v;
    }

    function inferColumns(rows) {
        if (!rows || rows.length === 0) return [];
        return Object.keys(rows[0]);
    }

    function saveParsedTable({ file, name, rows, columns }) {
        const id = uid('rt');
        const now = new Date().toISOString();
        const newTable = {
            id,
            name: name.replace(/\.[^.]+$/, ''),
            filename: name,
            uploadedAt: now,
            enabled: true,
            version: 1,
            tags: [],
            notes: '',
            columns: columns || inferColumns(rows),
            rows: rows.slice(0, 500),
            versions: [],
        };
        setTables(s => [newTable, ...s]);
        setToast({ type: 'success', text: `Uploaded: ${name}` });
    }

    function openPreview(table) {
        setPreviewRows(table.rows.slice(0, 200));
        setPreviewOpen(true);
    }

    function toggleEnable(id) {
        setTables(s => s.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
        setToast({ type: 'success', text: 'Toggled status' });
    }

    function removeTable(id) {
        setTables(s => s.filter(t => t.id !== id));
        setConfirm(null);
        setToast({ type: 'success', text: 'Rate table removed' });
    }

    function duplicateTable(id) {
        setTables(s => {
            const found = s.find(x => x.id === id);
            if (!found) return s;
            const copy = { ...found, id: uid('rt'), name: `${found.name} (copy)`, uploadedAt: new Date().toISOString() };
            return [copy, ...s];
        });
        setToast({ type: 'success', text: 'Duplicated' });
    }

    function exportJSON(id = null) {
        const source = id ? tables.find(t => t.id === id) : tables;
        const data = JSON.stringify(source, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = id ? `${source.name || 'rate-table'}.json` : `solymus-rate-tables-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: 'success', text: 'Export started' });
    }

    function exportCSV(id) {
        const t = tables.find(x => x.id === id);
        if (!t) return setToast({ type: 'error', text: 'Not found' });
        const header = t.columns.join(',');
        const rows = t.rows.map(r => t.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: 'success', text: 'CSV export started' });
    }

    function openEditor(table) {
        setActiveTable({ ...table });
        setDrawerOpen(true);
    }

    function saveActiveTable(close = false) {
        if (!activeTable) return;
        setTables(s => s.map(t => t.id === activeTable.id ? { ...t, ...activeTable } : t));
        setToast({ type: 'success', text: 'Saved' });
        if (close) { setDrawerOpen(false); setActiveTable(null); }
    }

    function addVersion(id) {
        setTables(s => s.map(t => {
            if (t.id !== id) return t;
            const ver = { version: t.version, snapshotAt: t.uploadedAt, columns: t.columns, rows: t.rows.slice(0, 200) };
            const next = { ...t, version: t.version + 1, versions: [ver, ...(t.versions || [])], uploadedAt: new Date().toISOString() };
            return next;
        }));
        setToast({ type: 'success', text: 'New version created' });
    }

    function bulkDelete() {
        if (selected.size === 0) return setToast({ type: 'error', text: 'No tables selected' });
        setConfirm({ type: 'bulk', ids: Array.from(selected) });
    }

    function doBulkDelete(ids) {
        const setIds = new Set(ids);
        setTables(s => s.filter(t => !setIds.has(t.id)));
        setSelected(new Set());
        setConfirm(null);
        setToast({ type: 'success', text: `${ids.length} tables deleted` });
    }

    return (
        <div className="dash-root insurers-luxe luxe-theme pricing-page">
            <aside className="left-nav">
                <div className="nav-brand">
                    <div className="nav-crest">SC</div>
                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Quote pricing</div>
                    </div>
                </div>

                <nav className="nav-links">
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link ">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/claims" className="nav-link">Claims</Link>
                    <Link to="/admin/leads" className="nav-link ">Leads</Link>
                    <Link to='/admin/quote-pricing' className="nav-link active">Quote Pricing</Link>
                    <Link to="/admin/chatbot" className="nav-link">Chatbot</Link>

                    <Link to="/admin/settings" className="nav-link">Settings</Link>
                </nav>

                <div className="nav-foot">Local storage: {STORAGE_KEY}</div>
            </aside>

            <main className="main-area">
                <header className="header-hero hero-leads" role="region">
                    <div className="hero-left">
                        <div className="hero-badge">Pricing</div>
                        <div className="hero-title-wrap">
                            <h1 className="hero-title">Quote rate tables</h1>
                            <div className="hero-subtle">Upload and manage Excel/CSV tables for quotation logic.</div>
                        </div>
                        <p className="hero-sub">Manage versions, preview sample rows, download templates and export for back-office use.</p>

                        <div className="filter-row">
                            <div className={`chip clickable`} onClick={() => { setStatusFilter('all'); setPage(1); }} data-active={statusFilter === 'all'}>All</div>
                            <div className={`chip clickable`} onClick={() => { setStatusFilter('enabled'); setPage(1); }} data-active={statusFilter === 'enabled'}>Enabled</div>
                            <div className={`chip clickable`} onClick={() => { setStatusFilter('disabled'); setPage(1); }} data-active={statusFilter === 'disabled'}>Disabled</div>

                            <div style={{ marginLeft: 'auto' }} />
                            <div className="chip result-chip">{filtered.length} tables</div>
                        </div>

                    </div>

                    <div className="hero-right">
                        <div className="kpi-tiles" aria-hidden>
                            <div className="kpi-tile">
                                <div className="kpi-label">Tables</div>
                                <div className="kpi-number">{tables.length}</div>
                                <div className="kpi-sub muted">Total uploads</div>
                            </div>
                            <div className="kpi-tile">
                                <div className="kpi-label">Enabled</div>
                                <div className="kpi-number">{tables.filter(t => t.enabled).length}</div>
                                <div className="kpi-sub muted">Active rules</div>
                            </div>
                        </div>

                        <div className="controls-top">
                            <div className="search-luxe search-rich">
                                <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14z" /></svg>
                                <input ref={searchRef} placeholder="Search name, filename, tags... ( / or ⌘/Ctrl+K )" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
                                <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
                                <button className="btn-ghost new-lead" onClick={() => fileInputRef.current?.click()}>＋ Upload</button>
                                <button className="btn-outline" onClick={downloadTemplate}>Download template</button>
                                <div className="view-toggle" role="tablist" aria-label="View mode">
                                    <button className={`ghost-icon ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table view">Table</button>
                                    <button className={`ghost-icon ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Card view">Cards</button>
                                </div>
                            </div>
                        </div>

                        <div className="controls-bottom">
                            <select className="small-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="nameAsc">Name A → Z</option>
                                <option value="nameDesc">Name Z → A</option>
                            </select>

                            <select className="small-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                                <option value={5}>5 / page</option>
                                <option value={8}>8 / page</option>
                                <option value={12}>12 / page</option>
                                <option value={24}>24 / page</option>
                            </select>
                        </div>

                    </div>
                </header>

                <section className="bento-card table-card powerful" aria-live="polite">
                    <div className="card-head">
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <input type="checkbox" onChange={(e) => {
                                const checked = e.target.checked;
                                setSelected(prev => {
                                    const next = new Set(prev);
                                    pageItems.forEach(i => { if (checked) next.add(i.id); else next.delete(i.id); });
                                    return next;
                                });
                            }} title="Select all on page" />
                            <div className="card-title">Rate tables</div>
                            <div className="chip subtle">{filtered.length} found</div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn-ghost" onClick={() => { setSelected(new Set()); setToast({ type: 'success', text: 'Selection cleared' }); }}>Clear</button>
                            <button className="btn-outline" onClick={bulkDelete}>Delete selected</button>
                            <div className="view-info">{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} / {filtered.length}</div>
                        </div>
                    </div>

                    <div className="card-body">
                        {selected.size > 0 && (
                            <div className="bulk-bar">
                                <div className="bulk-left">
                                    <div className="bulk-count">{selected.size} selected</div>
                                    <div className="bulk-quick">
                                        <button className="btn-ghost" onClick={() => { setSelected(new Set()); setToast({ type: 'success', text: 'Selection cleared' }); }}>Clear</button>
                                        <button className="btn-outline" onClick={() => { exportJSON(Array.from(selected)); }}>Export</button>
                                        <button className="btn-ghost" onClick={() => { setTables(s => s.map(t => selected.has(t.id) ? { ...t, enabled: true } : t)); setSelected(new Set()); setToast({ type: 'success', text: 'Enabled selected' }); }}>Enable</button>
                                        <button className="btn-ghost" onClick={() => { setTables(s => s.map(t => selected.has(t.id) ? { ...t, enabled: false } : t)); setSelected(new Set()); setToast({ type: 'success', text: 'Disabled selected' }); }}>Disable</button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-primary" onClick={() => { setConfirm({ type: 'bulk', ids: Array.from(selected) }); }}>Delete</button>
                                </div>
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="table-wrap">
                                <table className="hosp-table" role="table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Table</th>
                                            <th>Uploaded</th>
                                            <th>Columns</th>
                                            <th>Rows</th>
                                            <th>Tags</th>
                                            <th style={{ width: 220 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageItems.length === 0 && (
                                            <tr><td colSpan={7} className="empty-row"><div style={{ padding: 18, textAlign: 'center' }}><strong>No tables</strong><div className="muted">Upload a CSV or XLSX to get started</div></div></td></tr>
                                        )}
                                        {pageItems.map(t => (
                                            <tr key={t.id} className={`hosp-row`} aria-selected={selected.has(t.id)} title={`Uploaded: ${fmt(t.uploadedAt)}`}>
                                                <td><input type="checkbox" checked={selected.has(t.id)} onChange={() => setSelected(prev => { const next = new Set(prev); if (next.has(t.id)) next.delete(t.id); else next.add(t.id); return next; })} /></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div className="avatar" title={t.name}>{(t.name || '').split(' ').slice(0, 2).map(x => x[0]).join('')}</div>
                                                        <div>
                                                            <div className="row-title">{t.name} <span className="muted small">· v{t.version}</span></div>
                                                            <div className="row-sub muted small">{t.filename}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="muted small">{fmt(t.uploadedAt)}</td>
                                                <td className="small">{(t.columns || []).length}</td>
                                                <td className="small">{t.rows?.length ?? 0}</td>
                                                <td>{(t.tags || []).map(tag => <span key={tag} className="tag pill">{tag}</span>)}</td>
                                                <td>
                                                    <div className="post-actions">
                                                        <button className="action" onClick={() => openPreview(t)}>Preview</button>
                                                        <button className="action" onClick={() => openEditor(t)}>Edit</button>
                                                        <button className="action" onClick={() => toggleEnable(t.id)}>{t.enabled ? 'Disable' : 'Enable'}</button>
                                                        <button className="action" onClick={() => exportCSV(t.id)}>Export</button>
                                                        <button className="action" onClick={() => duplicateTable(t.id)}>Duplicate</button>
                                                        <div className="divider" />
                                                        <button className="action danger" onClick={() => setConfirm({ type: 'single', id: t.id })}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {viewMode === 'cards' && (
                            <div className="cards-grid">
                                {pageItems.map(t => (
                                    <article key={t.id} className="insurer-card fancy-card">
                                        <div className="card-top">
                                            <div className="card-left">
                                                <div className="avatar large">{(t.name || '').split(' ').slice(0, 2).map(x => x[0]).join('')}</div>
                                                <div>
                                                    <div className="card-title-strong">{t.name}</div>
                                                    <div className="muted small">{t.filename} · v{t.version}</div>
                                                </div>
                                            </div>
                                            <div className="card-right">
                                                <div className="muted small">{fmt(t.uploadedAt)}</div>
                                                <span className={`badge ${t.enabled ? 'status-active' : 'status-muted'}`}>{t.enabled ? 'enabled' : 'disabled'}</span>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="muted small">Columns: {(t.columns || []).join(', ')}</div>
                                            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button className="btn-outline" onClick={() => openPreview(t)}>Preview</button>
                                                <button className="btn-ghost" onClick={() => openEditor(t)}>Edit</button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        <div className="pagination-row">
                            <div className="muted small">{(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button className="btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input className="page-input" value={page} onChange={(e) => setPage(Number(e.target.value || 1))} />
                                    <small className="muted small"> / {totalPages}</small>
                                </div>
                                <button className="btn-primary" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                            </div>
                        </div>

                    </div>
                </section>

                {drawerOpen && activeTable && (
                    <div className="detail-drawer panel-drop" role="dialog" aria-modal>
                        <div className="drawer-head">
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div className="avatar large drawer-avatar">{(activeTable.name || '').split(' ').slice(0, 2).map(x => x[0]).join('')}</div>
                                <div>
                                    <div className="drawer-title">{activeTable.name} <span className="muted small">· v{activeTable.version}</span></div>
                                    <div className="muted small">{activeTable.filename} · {fmt(activeTable.uploadedAt)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="action" onClick={() => { setDrawerOpen(false); setActiveTable(null); }}>Close</button>
                            </div>
                        </div>
                        <div className="drawer-body">
                            <div className="drawer-grid">
                                <div>
                                    <div className="field-label">Name</div>
                                    <input value={activeTable.name} onChange={(e) => setActiveTable(s => ({ ...s, name: e.target.value }))} />
                                </div>
                                <div>
                                    <div className="field-label">Enabled</div>
                                    <select value={String(activeTable.enabled)} onChange={(e) => setActiveTable(s => ({ ...s, enabled: e.target.value === 'true' }))}>
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="field-label">Tags (comma)</div>
                                    <input value={(activeTable.tags || []).join(',')} onChange={(e) => setActiveTable(s => ({ ...s, tags: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }))} />
                                </div>
                                <div>
                                    <div className="field-label">Version</div>
                                    <div style={{ padding: 8, fontWeight: 900 }}>v{activeTable.version}</div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div className="field-label">Notes</div>
                                    <textarea value={activeTable.notes} onChange={(e) => setActiveTable(s => ({ ...s, notes: e.target.value }))} />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button className="btn-outline" onClick={() => addVersion(activeTable.id)}>Create new version</button>
                                        <button className="btn-ghost" onClick={() => exportCSV(activeTable.id)}>Export CSV</button>
                                        <button className="btn-ghost" onClick={() => exportJSON(activeTable.id)}>Export JSON</button>
                                    </div>
                                </div>

                                <div className="drawer-actions" style={{ gridColumn: '1 / -1' }}>
                                    <div>
                                        <button className="btn-ghost" onClick={() => { setDrawerOpen(false); setActiveTable(null); }}>Cancel</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn-outline" onClick={() => saveActiveTable(false)}>Save</button>
                                        <button className="btn-primary" onClick={() => saveActiveTable(true)}>Save & Close</button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {previewOpen && (
                    <div className="preview-overlay">
                        <div className="preview-card bento-card confirm-modal">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 900 }}>Preview — first {previewRows.length} rows</div>
                                <div><button className="btn-ghost" onClick={() => setPreviewOpen(false)}>Close</button></div>
                            </div>
                            <div style={{ maxHeight: 420, overflow: 'auto', marginTop: 12 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#666', fontWeight: 800 }}>
                                            {Object.keys(previewRows[0] || {}).map((c) => (<th key={c} style={{ padding: 8 }}>{c}</th>))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((r, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                                                {Object.keys(previewRows[0] || {}).map((c) => (<td key={c} style={{ padding: 8 }}>{String(r[c] ?? '')}</td>))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {confirm && (
                    <div className="preview-overlay">
                        <div className="preview-card bento-card confirm-modal">
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontSize: 22 }}>⚠️</div>
                                <div>
                                    <div style={{ fontWeight: 900 }}>{confirm.type === 'single' ? 'Delete table?' : `Delete ${confirm.ids.length} tables?`}</div>
                                    <div className="muted">This will permanently remove the selected rate tables.</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                                <button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
                                <button className="btn-primary" onClick={() => { if (confirm.type === 'single') removeTable(confirm.id); else doBulkDelete(confirm.ids); }}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                {toast && (
                    <div className={`toast ${toast.type === 'success' ? 'toast-success' : toast.type === 'error' ? 'toast-error' : 'toast-info'}`} role="status">
                        <span style={{ marginRight: 8 }}>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'i'}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div>{toast.text}</div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
