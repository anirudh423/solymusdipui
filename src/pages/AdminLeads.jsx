import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/solymus-leads.css";

const STORAGE_KEY = "solymus_leads_v1";
const VIEW_KEY = "solymus_leads_view_v1";

function uid(prefix = "l") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const sampleLeads = [
  {
    id: uid(),
    name: "Neha Patel",
    email: "neha.patel@example.com",
    phone: "+91 98765 43210",
    source: "Contact form",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "new",
    assignedTo: "",
    tags: ["downloaded-brochure"],
    notes: "Downloaded family plan brochure.",
    attachments: [],
  },
  {
    id: uid(),
    name: "Sourav Das",
    email: "sourav.das@example.com",
    phone: "+91 91234 56789",
    source: "Download",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    status: "contacted",
    assignedTo: "Rohit",
    tags: ["high-intent"],
    notes: "Interested in hospital cash add-on. Called on 2025-10-17.",
    attachments: [],
  },
  {
    id: uid(),
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    phone: "+91 99887 66554",
    source: "Contact form",
    submittedAt: new Date().toISOString(),
    status: "new",
    assignedTo: "",
    tags: [],
    notes: "Requested quote for single premium.",
    attachments: [],
  },
];

export default function AdminLeads() {
  const [leads, setLeads] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : sampleLeads;
    } catch (e) {
      return sampleLeads;
    }
  });

  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_KEY) || "table");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const [freshIds, setFreshIds] = useState(new Set());
  const [compact, setCompact] = useState(false);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState([]);
  const [kpiPulse, setKpiPulse] = useState(false);

  const searchRef = useRef();
  const exportRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error("save fail", e);
    }
  }, [leads]);

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
    setKpiPulse(true);
    const id = setTimeout(() => setKpiPulse(false), 650);
    return () => clearTimeout(id);
  }, [leads.length]);

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
        setExportPreviewOpen(false);
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
      if (exportOpen && exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [exportOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (l.name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.tags || []).join(" ").toLowerCase().includes(q) ||
        (l.notes || "").toLowerCase().includes(q)
      );
    });
  }, [leads, query, sourceFilter, statusFilter]);

  const insights = useMemo(() => {
    const counts = { new: 0, contacted: 0, archived: 0 };
    let total = 0;
    for (const l of leads) {
      counts[l.status] = (counts[l.status] || 0) + 1;
      total++;
    }
    return { counts, total };
  }, [leads]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "oldest":
        arr.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
        break;
      case "nameAsc":
        arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "nameDesc":
        arr.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
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

  function startExportCSV(ids = null) {
    if (!ids) {
      const preview = leads.slice(0, 6).map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: r.status,
      }));
      setExportPreviewRows(preview);
      setExportPreviewOpen(true);
      return;
    }
    confirmExportCSV(ids);
  }

  function confirmExportCSV(ids) {
    const source = ids ? leads.filter((s) => ids.includes(s.id)) : leads;
    const header = ["id", "name", "email", "phone", "source", "submittedAt", "status", "assignedTo", "tags", "notes"];
    const rows = source.map((s) =>
      header.map((h) => `"${String(h === "tags" ? (s.tags || []).join("|") : s[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solymus-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportPreviewOpen(false);
    setToast({ type: "success", text: "CSV export started", time: Date.now() });
  }

  function exportJSON() {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solymus-leads-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", text: "Export started", time: Date.now() });
  }

  function openLead(lead) {
    setActiveLead({ ...lead });
    setDrawerOpen(true);
    setTimeout(() => {
      const el = document.querySelector(".detail-drawer .drawer-body textarea");
      el?.focus();
    }, 120);
  }

  function saveActiveLead(close = false) {
    if (!activeLead) return;
    setLeads((s) => s.map((r) => (r.id === activeLead.id ? { ...r, ...activeLead } : r)));
    setToast({ type: "success", text: "Lead saved", time: Date.now() });
    if (close) {
      setDrawerOpen(false);
      setActiveLead(null);
    }
  }

  function markContacted(id) {
    setLeads((s) => s.map((x) => (x.id === id ? { ...x, status: "contacted" } : x)));
    setToast({ type: "success", text: "Marked contacted", time: Date.now() });
  }

  function bulkMarkContacted() {
    if (selected.size === 0) return setToast({ type: "error", text: "No leads selected" });
    const ids = Array.from(selected);
    setLeads((s) => s.map((x) => (ids.includes(x.id) ? { ...x, status: "contacted" } : x)));
    setSelected(new Set());
    setToast({ type: "success", text: `${ids.length} leads marked contacted`, time: Date.now() });
  }

  function confirmDelete(id) {
    setConfirm({ type: "single", id });
  }

  function doDelete(id) {
    setLeads((s) => s.filter((x) => x.id !== id));
    setConfirm(null);
    setSelected(new Set());
    setToast({ type: "success", text: "Lead removed", time: Date.now() });
  }

  function bulkDelete() {
    if (selected.size === 0) return setToast({ type: "error", text: "No leads selected" });
    setConfirm({ type: "bulk", ids: Array.from(selected) });
  }

  function doBulkDelete(ids) {
    const idSet = new Set(ids);
    setLeads((s) => s.filter((x) => !idSet.has(x.id)));
    setConfirm(null);
    setSelected(new Set());
    setToast({ type: "success", text: `${ids.length} leads removed`, time: Date.now() });
  }

  function importJSON(text) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Invalid format");
      const normalized = parsed.map((p) => ({ id: p.id || uid(), ...p }));
      setLeads((s) => [...normalized, ...s]);
      const ids = normalized.map((n) => n.id);
      setFreshIds((prev) => {
        const next = new Set(prev);
        ids.forEach((i) => next.add(i));
        return next;
      });
      setTimeout(() => {
        setFreshIds((prev) => {
          const next = new Set(prev);
          ids.forEach((i) => next.delete(i));
          return next;
        });
      }, 4000);
      setToast({ type: "success", text: `${normalized.length} leads imported`, time: Date.now() });
    } catch (e) {
      setToast({ type: "error", text: "Import failed" });
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (activeLead) {
        const att = {
          id: uid("a"),
          filename: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl,
        };
        setActiveLead((s) => ({ ...s, attachments: [...(s.attachments || []), att] }));
        setToast({ type: "success", text: "File attached", time: Date.now() });
      } else {
        setToast({ type: "error", text: "Open a lead to attach" });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  function quickAssign(agent) {
    if (selected.size === 0) return setToast({ type: "error", text: "No leads selected" });
    const ids = Array.from(selected);
    setLeads((s) => s.map((x) => (ids.includes(x.id) ? { ...x, assignedTo: agent } : x)));
    setSelected(new Set());
    setToast({ type: "success", text: `${ids.length} assigned to ${agent}`, time: Date.now() });
  }

  function createNewLead() {
    const id = uid();
    const now = new Date().toISOString();
    const newLead = {
      id,
      name: "",
      email: "",
      phone: "",
      source: "Contact form",
      submittedAt: now,
      status: "new",
      assignedTo: "",
      tags: [],
      notes: "",
      attachments: [],
    };
    setLeads((s) => [newLead, ...s]);
    setFreshIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 4200);
    setActiveLead(newLead);
    setDrawerOpen(true);
    setToast({ type: "success", text: "New lead created (edit & save)", time: Date.now() });
  }

  function BulkActionBar({ count }) {
    return (
      <div className="bulk-bar" role="region" aria-label="Bulk actions">
        <div className="bulk-left">
          <div className="bulk-count">{count} selected</div>
          <div className="bulk-quick">
            <button className="btn-ghost" onClick={() => { setSelected(new Set()); setToast({ type: "success", text: "Selection cleared" }); }}>Clear</button>
            <button className="btn-outline" onClick={() => { startExportCSV(Array.from(selected)); setExportOpen(false); }}>Export</button>
            <button className="btn-ghost" onClick={() => bulkMarkContacted()}>Mark contacted</button>
            <div className="assign-menu">
              <button className="btn-ghost" onClick={() => quickAssign("Rohit")}>Assign Rohit</button>
              <button className="btn-ghost" onClick={() => quickAssign("Priya")}>Assign Priya</button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={bulkDelete}>Delete</button>
        </div>
      </div>
    );
  }

  const IconList = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect><rect x="3" y="11" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect><rect x="3" y="17" width="18" height="2" rx="1" opacity={active ? 1 : 0.6}></rect></svg>
  );
  const IconGrid = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="13" y="3" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="3" y="13" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect><rect x="13" y="13" width="8" height="8" rx="2" opacity={active ? 1 : 0.6}></rect></svg>
  );

  return (
    <div className={`dash-root insurers-luxe luxe-theme leads-page ${compact ? "compact" : ""}`}>
      <aside className="left-nav">
        <div className="nav-brand">
          <div className="nav-crest">SC</div>
          <div>
            <div className="nav-name">Solymus</div>
            <div className="nav-sub">Leads</div>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/admin/dashboard" className="nav-link">Overview</Link>
          <Link to="/admin/content" className="nav-link">Content</Link>
          <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
          <Link to="/admin/blogs" className="nav-link ">Blogs</Link>
          <Link to="/admin/insurers" className="nav-link">Insurers</Link>
          <Link to="/admin/claims" className="nav-link">Claims</Link>
          <Link to="/admin/leads" className="nav-link active">Leads</Link>
          <Link to="/admin/settings" className="nav-link">Settings</Link>
        </nav>

        <div className="nav-foot">Local storage: {STORAGE_KEY}</div>
      </aside>

      <main className="main-area">
        <header className="header-hero luxe-hero hero-leads" role="region" aria-label="Leads overview">
          <div className="hero-left">
            <div className="hero-badge">Leads</div>
            <div className="hero-title-wrap">
              <h1 className="hero-title">Captured Leads</h1>
              <div className="hero-subtle">A curated inbox of inbound interest — triage, contact, convert.</div>
            </div>

            <p className="hero-sub">View and manage leads collected from contact forms, downloads and campaigns.</p>

            <div className="filter-row">
              <div className={`chip clickable`} onClick={() => { setStatusFilter("all"); setPage(1); }} data-active={statusFilter === "all"}>All</div>
              <div className={`chip clickable`} onClick={() => { setStatusFilter("new"); setPage(1); }} data-active={statusFilter === "new"}>New</div>
              <div className={`chip clickable`} onClick={() => { setStatusFilter("contacted"); setPage(1); }} data-active={statusFilter === "contacted"}>Contacted</div>
              <div className={`chip clickable`} onClick={() => { setStatusFilter("archived"); setPage(1); }} data-active={statusFilter === "archived"}>Archived</div>

              <div style={{ width: 12 }} />

              <div className="chip small">
                <label style={{ fontWeight: 800, marginRight: 8 }}>Source</label>
                <select className="tiny-select" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="Contact form">Contact form</option>
                  <option value="Download">Download</option>
                </select>
              </div>

              <div style={{ marginLeft: "auto" }} />
              <div className="chip result-chip">{filtered.length} results</div>
            </div>
          </div>

          <div className="hero-right">
            <div className="kpi-tiles" aria-hidden>
              <div className={`kpi-tile ${kpiPulse ? "pulse" : ""}`}>
                <div className="kpi-label">Inbox</div>
                <div className="kpi-number">{insights.total}</div>
                <div className="kpi-sub muted">Total leads</div>
              </div>
              <div className={`kpi-tile ${kpiPulse ? "pulse" : ""}`}>
                <div className="kpi-label">New</div>
                <div className="kpi-number">{insights.counts.new || 0}</div>
                <div className="kpi-sub muted">Uncontacted</div>
              </div>
              <div className={`kpi-tile ${kpiPulse ? "pulse" : ""}`}>
                <div className="kpi-label">Contacted</div>
                <div className="kpi-number">{insights.counts.contacted || 0}</div>
                <div className="kpi-sub muted">Reached out</div>
              </div>
            </div>

            <div className="controls-top">
              <div className="search-luxe search-rich">
                <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14z" /></svg>
                <input
                  ref={searchRef}
                  placeholder="Search name, email, phone, tags... ( / or ⌘/Ctrl+K )"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  aria-label="Search leads"
                />
                <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
              </div>

              <div className="controls-row">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn-ghost new-lead" onClick={createNewLead} title="Create lead">＋ New lead</button>

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
                      <button className="action" onClick={() => { setExportOpen(false); startExportCSV(null); }}>Export CSV (preview)</button>
                      <button className="action" onClick={() => { setExportOpen(false); exportJSON(); }}>Export JSON</button>
                      <button className="action" onClick={() => { setExportOpen(false); startExportCSV(Array.from(selected)); }}>Export Selected CSV</button>
                      <div className="divider" />
                      <button className="action" onClick={() => { const text = prompt("Paste JSON array of leads to import:"); if (text) importJSON(text); }}>Import JSON</button>
                    </div>
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

              <button className="btn-ghost compact-toggle" title="Toggle compact" onClick={() => setCompact(c => !c)}>{compact ? "Comfort" : "Compact"}</button>
            </div>
          </div>
        </header>

        <section className="bento-card table-card powerful" aria-live="polite">
          <div className="card-head">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input type="checkbox" onChange={(e) => {
                const checked = e.target.checked;
                setSelected(prev => {
                  const next = new Set(prev);
                  pageItems.forEach(i => { if (checked) next.add(i.id); else next.delete(i.id); });
                  return next;
                });
              }} title="Select all on page" />
              <div className="card-title">Captured leads</div>
              <div className="chip subtle">{filtered.length} found</div>
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
                <table className={`hosp-table ${compact ? "compact" : ""}`} role="table" aria-label="Leads table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Lead</th>
                      <th>Contact</th>
                      <th>Source</th>
                      <th>Tags</th>
                      <th>Status</th>
                      <th style={{ width: 220 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 && (
                      <tr><td colSpan={7} className="empty-row"><div style={{ padding: 18, textAlign: "center" }}><strong>No leads found</strong><div className="muted">Try adjusting filters</div></div></td></tr>
                    )}

                    {pageItems.map((l) => (
                      <tr
                        key={l.id}
                        className={`hosp-row ${freshIds.has(l.id) ? "row-new" : ""}`}
                        title={`Submitted: ${fmt(l.submittedAt)}`}
                        aria-selected={selected.has(l.id)}
                      >
                        <td><input type="checkbox" checked={selected.has(l.id)} onChange={() => setSelected(prev => { const next = new Set(prev); if (next.has(l.id)) next.delete(l.id); else next.add(l.id); return next; })} aria-label={`Select ${l.name}`} /></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="avatar" title={l.name}>{(l.name || "").split(" ").slice(0, 2).map((x) => x[0]).join("")}</div>
                            <div>
                              <div className="row-title">{l.name || <em className="muted">No name</em>} <span className="muted small">· {new Date(l.submittedAt).toLocaleDateString()}</span></div>
                              <div className="row-sub muted small">{l.notes?.slice(0, 80)}</div>
                            </div>
                          </div>
                        </td>
                        <td><div className="muted small contact-block">{l.email}<br />{l.phone}</div></td>
                        <td><div className="muted small">{l.source}</div></td>
                        <td>{(l.tags || []).map((t) => <span key={t} className="tag pill">{t}</span>)}</td>
                        <td><span className={`badge ${l.status === "contacted" ? "status-active" : l.status === "archived" ? "status-muted" : "status-new"}`}>{l.status}</span></td>
                        <td>
                          <div className="post-actions">
                            <button className="action" onClick={() => openLead(l)}><span className="label">View</span></button>
                            <button className="action" onClick={() => markContacted(l.id)}><span className="label">Mark<br />contacted</span></button>
                            <button className="action" onClick={() => { setSelected(new Set([l.id])); confirmExportCSV([l.id]); }}><span className="label">Export</span></button>
                            <div className="divider" />
                            <button className="action danger" onClick={() => confirmDelete(l.id)}><span className="label">Delete</span></button>
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
                {pageItems.length === 0 && <div className="muted">No leads to show</div>}
                {pageItems.map((l) => (
                  <article key={l.id} className={`insurer-card fancy-card ${freshIds.has(l.id) ? "card-new" : ""}`}>
                    <div className="card-top">
                      <div className="card-left">
                        <div className="avatar large">{(l.name || "").split(" ").slice(0, 2).map(x => x[0]).join("")}</div>
                        <div>
                          <div className="card-title-strong">{l.name}</div>
                          <div className="muted small">{l.email} · {l.phone}</div>
                        </div>
                      </div>
                      <div className="card-right">
                        <div className="muted small">{fmt(l.submittedAt)}</div>
                        <span className={`badge ${l.status === "contacted" ? "status-active" : l.status === "archived" ? "status-muted" : "status-new"}`}>{l.status}</span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="muted">{l.notes}</div>
                      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ fontWeight: 700 }}>{l.source}</div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                          <button className="btn-outline" onClick={() => openLead(l)}>Open</button>
                          <button className="btn-ghost" onClick={() => markContacted(l.id)}>Contact</button>
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

        {drawerOpen && activeLead && (
          <div className="detail-drawer panel-drop" role="dialog" aria-modal>
            <div className="drawer-head">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="avatar large drawer-avatar">{(activeLead.name || "").split(" ").slice(0, 2).map(x => x[0]).join("")}</div>
                <div>
                  <div className="drawer-title">{activeLead.name || "New lead"} <span className="muted small">· {new Date(activeLead.submittedAt).toLocaleString()}</span></div>
                  <div className="muted small">{activeLead.email} · {activeLead.phone}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="action" onClick={() => { setDrawerOpen(false); setActiveLead(null); }}>Close</button>
              </div>
            </div>

            <div className="drawer-body">
              <div className="drawer-grid">
                <div>
                  <div className="field-label">Name</div>
                  <input value={activeLead.name} onChange={(e) => setActiveLead((s) => ({ ...s, name: e.target.value }))} />
                </div>

                <div>
                  <div className="field-label">Email</div>
                  <input value={activeLead.email} onChange={(e) => setActiveLead((s) => ({ ...s, email: e.target.value }))} />
                </div>

                <div>
                  <div className="field-label">Phone</div>
                  <input value={activeLead.phone} onChange={(e) => setActiveLead((s) => ({ ...s, phone: e.target.value }))} />
                </div>

                <div>
                  <div className="field-label">Status</div>
                  <select value={activeLead.status} onChange={(e) => setActiveLead((s) => ({ ...s, status: e.target.value }))}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <div className="field-label">Assigned to</div>
                  <input value={activeLead.assignedTo || ""} onChange={(e) => setActiveLead((s) => ({ ...s, assignedTo: e.target.value }))} placeholder="Agent name" />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="field-label">Tags (comma separated)</div>
                  <input value={(activeLead.tags || []).join(",")} onChange={(e) => setActiveLead((s) => ({ ...s, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="field-label">Notes</div>
                  <textarea value={activeLead.notes} onChange={(e) => setActiveLead((s) => ({ ...s, notes: e.target.value }))} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="field-label">Attachments</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} />
                    <button className="btn-ghost" onClick={() => { fileInputRef.current?.click(); }}>Attach file</button>
                  </div>

                  {(activeLead.attachments || []).length === 0 && <div className="muted" style={{ marginTop: 8 }}>No attachments</div>}
                  {(activeLead.attachments || []).map((a) => (
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
                    <button className="btn-ghost" onClick={() => { setDrawerOpen(false); setActiveLead(null); }}>Cancel</button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-outline" onClick={() => saveActiveLead(false)}>Save</button>
                    <button className="btn-primary" onClick={() => saveActiveLead(true)}>Save & Close</button>
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
                  <div style={{ fontWeight: 900 }}>{confirm.type === "single" ? "Delete lead?" : `Delete ${confirm.ids.length} leads?`}</div>
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

        {exportPreviewOpen && (
          <div className="preview-overlay">
            <div className="preview-card bento-card confirm-modal">
              <div style={{ fontWeight: 900, marginBottom: 8 }}>CSV export preview</div>
              <div className="muted small" style={{ marginBottom: 12 }}>You are about to export the full dataset. Below are 6 sample rows from the export.</div>
              <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#666", fontWeight: 800 }}>
                      <th style={{ padding: 8 }}>Name</th>
                      <th style={{ padding: 8 }}>Email</th>
                      <th style={{ padding: 8 }}>Phone</th>
                      <th style={{ padding: 8 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportPreviewRows.map(r => (
                      <tr key={r.id} style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <td style={{ padding: 8 }}>{r.name}</td>
                        <td style={{ padding: 8 }}>{r.email}</td>
                        <td style={{ padding: 8 }}>{r.phone}</td>
                        <td style={{ padding: 8 }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn-outline" onClick={() => setExportPreviewOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => confirmExportCSV(null)}>Export full CSV</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`} role="status">
            <span style={{ marginRight: 8 }}>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>{toast.text}</div>
              {toast.time && <small className="muted small">{new Date(toast.time).toLocaleTimeString()}</small>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
