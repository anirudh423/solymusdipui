import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/solymus-insurers.css";

const STORAGE_KEY = "solymus_insurers_v1";
const VIEW_KEY = "solymus_insurers_view_v1";

function uid(prefix = "i") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const sampleInsurers = [
  {
    id: uid(),
    name: "Aureus Life Insurance",
    code: "AL-001",
    contact: "+91 22 5555 0001",
    email: "support@aureus.example",
    status: "active",
    createdAt: new Date().toISOString(),
    forms: [],
  },
  {
    id: uid(),
    name: "Pioneer General",
    code: "PG-203",
    contact: "+91 22 5555 0203",
    email: "hello@pioneer.example",
    status: "inactive",
    createdAt: new Date().toISOString(),
    forms: [],
  },
];

export default function AdminInsurers() {
  const [insurers, setInsurers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : sampleInsurers;
    } catch {
      return sampleInsurers;
    }
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState("createdDesc");
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || "table";
    } catch {
      return "table";
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingTab, setEditingTab] = useState("details");
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [importText, setImportText] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const fileRef = useRef();
  const nameRef = useRef();
  const searchRef = useRef();
  const exportRef = useRef();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(insurers));
    } catch (e) {
      console.error("save fail", e);
    }
  }, [insurers]);

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
      if (e.key === "N" || e.key === "n") openCreate();
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
    return insurers.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.contact || "").toLowerCase().includes(q)
      );
    });
  }, [insurers, query, statusFilter]);

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
  }, [totalPages, page]);

  const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

  function fmt(dt) {
    try {
      return new Date(dt).toLocaleString();
    } catch {
      return dt;
    }
  }

  function openCreate() {
    setEditing({ id: null, name: "", code: "", contact: "", email: "", status: "active", forms: [] });
    setEditingTab("details");
    setDrawerOpen(true);
    setTimeout(() => nameRef.current?.focus(), 120);
  }

  function openEdit(i) {
    setEditing(JSON.parse(JSON.stringify(i)));
    setEditingTab("details");
    setDrawerOpen(true);
    setTimeout(() => nameRef.current?.focus(), 120);
  }

  function duplicateInsurer(i) {
    const copy = { ...i, id: uid(), name: `${i.name} (copy)`, createdAt: new Date().toISOString() };
    setInsurers((s) => [copy, ...s]);
    setToast({ type: "success", text: "Insurer duplicated" });
  }

  function toggleStatus(id) {
    setInsurers((s) => s.map((x) => (x.id === id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x)));
    setToast({ type: "success", text: "Status toggled" });
  }

  function saveEditing() {
    if (!editing) return;
    if (!editing.name.trim()) return setToast({ type: "error", text: "Name is required" });
    if (!editing.code.trim()) return setToast({ type: "error", text: "Code is required" });

    if (editing.id) {
      setInsurers((s) => s.map((r) => (r.id === editing.id ? { ...r, ...editing } : r)));
      setToast({ type: "success", text: "Insurer updated" });
    } else {
      const newI = { ...editing, id: uid(), createdAt: new Date().toISOString() };
      setInsurers((s) => [newI, ...s]);
      setToast({ type: "success", text: "Insurer created" });
    }
    setDrawerOpen(false);
    setEditing(null);
  }

  function confirmDelete(id) {
    setConfirm({ type: "single", id });
  }

  function doDelete(id) {
    setInsurers((s) => s.filter((x) => x.id !== id));
    setConfirm(null);
    setSelected(new Set());
    setToast({ type: "success", text: "Insurer removed" });
  }

  function bulkDelete() {
    if (selected.size === 0) return setToast({ type: "error", text: "No insurers selected" });
    setConfirm({ type: "bulk", ids: Array.from(selected) });
  }

  function doBulkDelete(ids) {
    const idSet = new Set(ids);
    setInsurers((s) => s.filter((x) => !idSet.has(x.id)));
    setConfirm(null);
    setSelected(new Set());
    setToast({ type: "success", text: `${ids.length} insurers removed` });
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
      pageItems.forEach((i) => {
        if (checked) next.add(i.id);
        else next.delete(i.id);
      });
      return next;
    });
  }

  function exportJSON() {
    const dataStr = JSON.stringify(insurers, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solymus-insurers-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", text: "Export started" });
  }

  function exportCSV(ids = null) {
    const source = ids ? insurers.filter((s) => ids.includes(s.id)) : insurers;
    const header = ["id", "name", "code", "contact", "email", "status", "createdAt", "formsCount"];
    const rows = source.map((s) => header.map((h) => `"${String(h === "formsCount" ? (s.forms || []).length : s[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solymus-insurers-${new Date().toISOString().slice(0, 10)}.csv`;
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
        name: p.name || "Untitled",
        code: p.code || "-",
        contact: p.contact || "",
        email: p.email || "",
        status: p.status === "inactive" ? "inactive" : "active",
        createdAt: p.createdAt || now,
        forms: Array.isArray(p.forms) ? p.forms : [],
      }));
      setInsurers((s) => [...sanitized, ...s]);
      setToast({ type: "success", text: `${sanitized.length} insurers imported` });
      setImportText("");
    } catch {
      setToast({ type: "error", text: "Invalid JSON" });
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = () => rej(new Error("readfail"));
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files) {
    if (!editing) return setToast({ type: "error", text: "Open an insurer to upload forms" });
    const arr = Array.from(files || []);
    const mapped = [];
    for (const f of arr) {
      try {
        const dataUrl = await readFileAsDataUrl(f);
        mapped.push({ id: uid("f"), name: f.name, filename: f.name, size: f.size, type: f.type, dataUrl, uploadedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("file read failed", f.name);
      }
    }
    setEditing((s) => ({ ...s, forms: [...(s.forms || []), ...mapped] }));
    setToast({ type: "success", text: `${mapped.length} file(s) attached` });
    if (fileRef.current) fileRef.current.value = null;
  }

  function removeForm(formId) {
    setEditing((s) => ({ ...s, forms: (s.forms || []).filter((f) => f.id !== formId) }));
  }

  function saveFormsToInsurer() {
    if (!editing) return;
    if (!editing.id) {
      const newI = { ...editing, id: uid(), createdAt: new Date().toISOString() };
      setInsurers((s) => [newI, ...s]);
      setToast({ type: "success", text: "Insurer and forms saved" });
    } else {
      setInsurers((s) => s.map((r) => (r.id === editing.id ? { ...r, ...editing } : r)));
      setToast({ type: "success", text: "Forms saved" });
    }
    setDrawerOpen(false);
    setEditing(null);
  }

  function downloadForm(form) {
    try {
      const arr = form.dataUrl.split(",");
      const mimePart = arr[0].match(/:(.*?);/);
      const mime = mimePart ? mimePart[1] : form.type || "application/octet-stream";
      const b64 = arr[1];
      const byteChars = atob(b64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = form.filename || "download";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setToast({ type: "error", text: "Download failed" });
    }
  }

  function viewForm(form) {
    window.open(form.dataUrl, "_blank", "noopener");
  }

  const IconGrid = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="13" y="3" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="3" y="13" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="13" y="13" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect></svg>
  );

  const IconList = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect><rect x="3" y="11" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect><rect x="3" y="17" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect></svg>
  );

  function BulkActionBar({ count }) {
    return (
      <div className="bulk-bar">
        <div className="bulk-count">{count} selected</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-outline" onClick={() => { setExportOpen(false); exportCSV(Array.from(selected)); }}>Export selected</button>
          <button className="btn-ghost" onClick={() => { Array.from(selected).forEach((id) => toggleStatus(id)); setSelected(new Set()); }}>Toggle status</button>
          <button className="btn-primary" onClick={bulkDelete}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-root insurers-luxe luxe-theme">
      <aside className="left-nav">
        <div className="nav-brand">
          <div className="nav-crest">SI</div>
          <div>
            <div className="nav-name">Solymus</div>
            <div className="nav-sub">Insurers</div>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/admin/dashboard" className="nav-link">Overview</Link>
          <Link to="/admin/content" className="nav-link">Content</Link>
          <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
          <Link to="/admin/blogs" className="nav-link ">Blogs</Link>
          <Link to="/admin/insurers" className="nav-link active">Insurers</Link>
          <Link to="/admin/claims" className="nav-link">Claims</Link>
          <Link to="/admin/leads" className="nav-link">Leads</Link>
          <Link to='/admin/quote-pricing' className="nav-link">Quote Pricing</Link>
          <Link to="/admin/chatbot" className="nav-link">Chatbot</Link>

          <Link to="/admin/settings" className="nav-link">Settings</Link>
        </nav>

        <div className="nav-foot">Local storage: {STORAGE_KEY}</div>
      </aside>

      <main className="main-area">
        <header className="header-hero luxe-hero">
          <div className="hero-left">
            <div className="hero-badge">Manage</div>

            <div className="hero-title-wrap">
              <h1 className="hero-title">Manage Insurers &amp; Forms</h1>
              <svg className="gold-flourish" viewBox="0 0 120 24" aria-hidden>
                <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#d39a2f" /><stop offset="1" stopColor="#f6d89b" /></linearGradient></defs>
                <path d="M2 18 C28 4, 92 4, 118 18" stroke="url(#g)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="30" cy="12" r="1.6" fill="#f6d89b"><animate attributeName="r" values="1.6;3.2;1.6" dur="2.6s" repeatCount="indefinite" /></circle>
              </svg>
            </div>

            <p className="hero-sub">Add insurers, maintain contact details and upload policy/consent forms. This demo stores files locally (base64) — great for prototyping.</p>

            <div className="filter-row">
              <div className={`chip clickable`} onClick={() => { setStatusFilter("all"); setPage(1); }} data-active={statusFilter === "all"}>All</div>
              <div className={`chip clickable`} onClick={() => { setStatusFilter("active"); setPage(1); }} data-active={statusFilter === "active"}>Active</div>
              <div className={`chip clickable`} onClick={() => { setStatusFilter("inactive"); setPage(1); }} data-active={statusFilter === "inactive"}>Inactive</div>
              <div className="chip result-chip">{filtered.length} results</div>
            </div>
          </div>

          <div className="hero-right">
            <div className="controls-top">
              <div className="search-luxe">
                <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14z" /></svg>
                <input
                  ref={searchRef}
                  placeholder="Search insurers, code, contact... ( / or ⌘/Ctrl+K )"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  aria-label="Search insurers"
                />
                <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
              </div>

              <div className="controls-row">
                <button className="btn-primary" onClick={openCreate} title="Create insurer">+ New</button>

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
                  <button className={`ghost-icon ${viewMode === "compact" ? "active" : ""}`} onClick={() => setViewMode("compact")} title="Compact view">C</button>
                </div>
              </div>
            </div>

            <div className="controls-bottom">
              <select className="small-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
                <option value="createdDesc">Newest</option>
                <option value="createdAsc">Oldest</option>
                <option value="nameAsc">Name A → Z</option>
                <option value="nameDesc">Name Z → A</option>
              </select>

              <select className="small-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
                <option value={5}>5 / page</option>
                <option value={8}>8 / page</option>
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
              </select>

              <div className="kpi-mini">
                <div className="kpi-num">{insurers.length}</div>
                <div className="kpi-label">Total</div>
              </div>
            </div>
          </div>
        </header>

        <section className="bento-card table-card">
          <div className="card-head">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input type="checkbox" onChange={selectAllOnPage} title="Select all on page" />
              <div className="card-title">Insurer directory</div>
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
                <table className="hosp-table" role="table" aria-label="Insurers table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Insurer</th>
                      <th>Code</th>
                      <th>Contact</th>
                      <th>Forms</th>
                      <th>Status</th>
                      <th style={{ width: 260 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 && (
                      <tr><td colSpan={7} className="empty-row"><div style={{ padding: 18, textAlign: "center" }}><strong>No insurers found</strong><div className="muted">Create one to get started</div><div style={{ marginTop: 10 }}><button className="btn-primary" onClick={openCreate}>Create insurer</button></div></div></td></tr>
                    )}

                    {pageItems.map((s) => (
                      <tr key={s.id} className="hosp-row" title={`Created: ${fmt(s.createdAt)}`}>
                        <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} aria-label={`Select ${s.name}`} /></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="avatar" title={s.name}>{(s.name || "").split(" ").slice(0, 2).map((x) => x[0]).join("")}</div>
                            <div>
                              <div className="row-title">{s.name}</div>
                              <div className="row-sub">{s.email} · {s.contact}</div>
                            </div>
                          </div>
                        </td>
                        <td><div className="muted strong code-pill">{s.code}</div></td>
                        <td><div className="muted">{s.contact}</div><div className="muted small">{s.email}</div></td>
                        <td>
                          <div className="forms-count">
                            <span className="file-dot" /> {(s.forms || []).length} file(s)
                          </div>
                        </td>
                        <td><span className={`badge ${s.status === "active" ? "status-active" : "status-inactive"}`}>{s.status === "active" ? "Active" : "Inactive"}</span></td>
                        <td>
                          <div className="post-actions">
                            <button className="action" onClick={() => openEdit(s)}>Edit</button>
                            <button className="action" onClick={() => duplicateInsurer(s)}>Copy</button>
                            <button className="action" onClick={() => toggleStatus(s.id)}>{s.status === "active" ? "Disable" : "Activate"}</button>
                            <div className="divider" />
                            <button className="action danger" onClick={() => confirmDelete(s.id)}>Delete</button>
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
                {pageItems.length === 0 && <div className="muted">No insurers to show</div>}
                {pageItems.map((s) => (
                  <article key={s.id} className="insurer-card">
                    <div className="card-top">
                      <div className="card-left">
                        <div className="avatar large">{(s.name || "").split(" ").slice(0, 2).map((x) => x[0]).join("")}</div>
                        <div>
                          <div className="card-title-strong">{s.name}</div>
                          <div className="muted small">{s.code} · {s.contact}</div>
                        </div>
                      </div>
                      <div className="card-right">
                        <div className="muted small">{fmt(s.createdAt)}</div>
                        <span className={`badge ${s.status === "active" ? "status-active" : "status-inactive"}`}>{s.status}</span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="muted">Attachments</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                        <div className="file-preview">{(s.forms || []).slice(0, 3).map(f => <div key={f.id} className="file-chip" title={f.filename}>{f.filename.split(".")[0]}</div>)}</div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                          <button className="btn-outline" onClick={() => openEdit(s)}>Open</button>
                          <button className="btn-ghost" onClick={() => duplicateInsurer(s)}>Duplicate</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {viewMode === "compact" && (
              <div className="compact-list">
                {pageItems.map(s => (
                  <div key={s.id} className="compact-row">
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="avatar tiny">{s.name.split(" ").map(x => x[0]).slice(0, 2).join("")}</div>
                      <div>
                        <div className="row-title">{s.name}</div>
                        <div className="muted small">{s.code} · {(s.forms || []).length} files</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="action" onClick={() => openEdit(s)}>Edit</button>
                      <button className="action danger" onClick={() => confirmDelete(s.id)}>Delete</button>
                    </div>
                  </div>
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

        {drawerOpen && (
          <div className="detail-drawer panel-drop" role="dialog" aria-modal>
            <div className="drawer-head">
              <div>
                <div className="drawer-title">{editing?.id ? "Edit Insurer" : "New Insurer"}</div>
                <div className="muted small">{editing?.id ? `Created ${fmt(editing.createdAt)}` : "Create a new insurer record"}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="action" onClick={() => { setDrawerOpen(false); setEditing(null); }}>Close</button>
              </div>
            </div>

            <div className="drawer-body">
              <div className="drawer-tabs">
                <button className={`tab ${editingTab === "details" ? "active" : ""}`} onClick={() => setEditingTab("details")}>Details</button>
                <button className={`tab ${editingTab === "forms" ? "active" : ""}`} onClick={() => setEditingTab("forms")}>Forms</button>
                <button className={`tab ${editingTab === "activity" ? "active" : ""}`} onClick={() => setEditingTab("activity")}>Activity</button>
              </div>

              {editingTab === "details" && (
                <div className="drawer-grid">
                  <label>
                    <div className="field-label">Name</div>
                    <input ref={nameRef} value={editing?.name || ""} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
                  </label>

                  <label>
                    <div className="field-label">Code</div>
                    <input value={editing?.code || ""} onChange={(e) => setEditing((s) => ({ ...s, code: e.target.value }))} />
                  </label>

                  <label>
                    <div className="field-label">Contact</div>
                    <input value={editing?.contact || ""} onChange={(e) => setEditing((s) => ({ ...s, contact: e.target.value }))} />
                  </label>

                  <label>
                    <div className="field-label">Email</div>
                    <input value={editing?.email || ""} onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} />
                  </label>

                  <label style={{ gridColumn: "1 / -1" }}>
                    <div className="field-label">Status</div>
                    <select value={editing?.status || "active"} onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>

                  <div className="drawer-actions" style={{ gridColumn: "1 / -1" }}>
                    <div>
                      <button className="btn-ghost" onClick={() => { setDrawerOpen(false); setEditing(null); }}>Cancel</button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-outline" onClick={() => { setImportText(""); setToast({ type: "info", text: "Import cleared" }); }}>Clear import</button>
                      <button className="btn-primary" onClick={saveEditing}>Save</button>
                    </div>
                  </div>

                  <hr style={{ gridColumn: "1 / -1" }} />

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="field-label">Import insurers (paste JSON)</div>
                    <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[ { "name": "X", "code": "C" } ]' />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                      <button className="btn-ghost" onClick={() => setImportText("")}>Clear</button>
                      <button className="btn-outline" onClick={() => importJSON(importText)}>Import JSON</button>
                    </div>
                  </div>
                </div>
              )}

              {editingTab === "forms" && (
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
                    <button className="btn-primary" onClick={() => fileRef.current?.click()}>Upload forms</button>
                    <button className="btn-outline" onClick={() => { setEditing((s) => ({ ...s, forms: [] })); setToast({ type: "info", text: "All form attachments cleared" }); }}>Clear attachments</button>
                    <div style={{ marginLeft: "auto", color: "var(--muted)" }}>{(editing?.forms || []).length} file(s)</div>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {(editing?.forms || []).length === 0 && <div className="muted">No files attached yet — upload PDFs, images or zips.</div>}

                    {(editing?.forms || []).map((f) => (
                      <div key={f.id} className="bento-card file-row">
                        <div>
                          <div style={{ fontWeight: 900 }}>{f.filename}</div>
                          <div className="muted small">{Math.round(f.size / 1024)} KB • {new Date(f.uploadedAt).toLocaleString()}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn-outline" onClick={() => viewForm(f)}>View</button>
                          <button className="btn-ghost" onClick={() => downloadForm(f)}>Download</button>
                          <button className="action danger" onClick={() => removeForm(f.id)}>Remove</button>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button className="btn-ghost" onClick={() => { setDrawerOpen(false); setEditing(null); }}>Close</button>
                      <button className="btn-primary" onClick={saveFormsToInsurer}>Save forms</button>
                    </div>
                  </div>
                </div>
              )}

              {editingTab === "activity" && (
                <div>
                  <div className="insights-list">
                    <div>Created: {editing?.createdAt ? fmt(editing.createdAt) : "—"}</div>
                    <div>No further activity recorded in this demo.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {confirm && (
          <div className="preview-overlay">
            <div className="preview-card bento-card confirm-modal">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 22 }}>⚠️</div>
                <div>
                  <div style={{ fontWeight: 900 }}>{confirm.type === "single" ? "Delete insurer?" : `Delete ${confirm.ids.length} insurers?`}</div>
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


