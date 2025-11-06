import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import IntentList from "../components/chatbot/IntentList";
import IntentEditorDrawer from "../components/chatbot/IntentEditorDrawer";
import TestConsole from "../components/chatbot/TestConsole";
import "../styles/solymus-chatbot.css";

const STORAGE_KEY = "solymus_chatbot_v1";
const VIEW_KEY = "solymus_chatbot_view_v1";

function uid(prefix = "cb") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const seed = [
    {
        id: uid(),
        name: "General FAQs",
        triggers: ["hello", "hi", "hey", "help"],
        quickReplies: [
            { id: uid("qr"), title: "How to buy a policy", payload: "/buy_policy" },
            { id: uid("qr"), title: "Claim status", payload: "/claim_status" },
            { id: uid("qr"), title: "Talk to human", payload: "/human" },
        ],
        enabled: true,
        notes: "Catch-all greetings and quick links",
        createdAt: new Date().toISOString(),
    },
    {
        id: uid(),
        name: "Premium Calculator",
        triggers: ["premium", "rate", "calculate"],
        quickReplies: [
            { id: uid("qr"), title: "Show premium for age 30", payload: "/calc?age=30" },
            { id: uid("qr"), title: "Show premium for age 45", payload: "/calc?age=45" },
        ],
        enabled: false,
        notes: "Quick samples for pricing flows",
        createdAt: new Date().toISOString(),
    },
];

export default function AdminChatbot() {
    const [intents, setIntents] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : seed;
        } catch {
            return seed;
        }
    });

    const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_KEY) || "table");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [sortBy, setSortBy] = useState("newest");
    const [active, setActive] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const fileRef = useRef();

    useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(intents)), [intents]);
    useEffect(() => localStorage.setItem(VIEW_KEY, viewMode), [viewMode]);
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        return intents.filter((it) => {
            if (!q) return true;
            if (q === "enabled") return it.enabled;
            if (q === "disabled") return !it.enabled;
            return (
                (it.name || "").toLowerCase().includes(q) ||
                (it.triggers || []).join(" ").toLowerCase().includes(q) ||
                (it.notes || "").toLowerCase().includes(q) ||
                (it.quickReplies || []).map((r) => r.title).join(" ").toLowerCase().includes(q)
            );
        });
    }, [intents, query]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortBy) {
            case "oldest":
                arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case "nameAsc":
                arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case "nameDesc":
                arr.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
                break;
            default:
                arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return arr;
    }, [filtered, sortBy]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
    const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

    function createIntent() {
        const i = { id: uid("it"), name: "New intent", triggers: [], quickReplies: [], enabled: true, notes: "", createdAt: new Date().toISOString() };
        setIntents((s) => [i, ...s]);
        setActive(i);
        setDrawerOpen(true);
        setToast({ type: "success", text: "Intent created" });
    }

    function openEditor(it) {
        setActive({ ...it });
        setDrawerOpen(true);
    }

    function saveIntent(patched) {
        setIntents((s) => s.map((i) => (i.id === patched.id ? { ...i, ...patched } : i)));
        setToast({ type: "success", text: "Saved" });
    }

    function duplicateIntent(id) {
        setIntents((s) => {
            const f = s.find((x) => x.id === id);
            if (!f) return s;
            const copy = { ...f, id: uid("it"), name: `${f.name} (copy)`, createdAt: new Date().toISOString() };
            return [copy, ...s];
        });
        setToast({ type: "success", text: "Duplicated" });
    }

    function toggleEnable(id) {
        setIntents((s) => s.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)));
        setToast({ type: "success", text: "Toggled" });
    }

    function removeIntent(id) {
        setIntents((s) => s.filter((i) => i.id !== id));
        setToast({ type: "success", text: "Removed" });
    }

    function exportJSON(id = null) {
        const source = id ? intents.find((i) => i.id === id) : intents;
        const data = JSON.stringify(source, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = id ? `${(source.name || "intent").replace(/\s+/g, "-")}.json` : `solymus-chatbot-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ type: "success", text: "Export started" });
    }

    function importJSON(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (Array.isArray(parsed)) setIntents((s) => [...parsed, ...s]);
                else setIntents((s) => [parsed, ...s]);
                setToast({ type: "success", text: "Import complete" });
            } catch {
                setToast({ type: "error", text: "Invalid JSON" });
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    }


    return (
        <div className="dash-root insurers-luxe luxe-theme chatbot-page">
            <aside className="left-nav">
                <div className="nav-brand">
                    <div className="nav-crest">SC</div>
                    <div>
                        <div className="nav-name">Solymus</div>
                        <div className="nav-sub">Chatbot</div>
                    </div>
                </div>
                <nav className="nav-links">
                    <Link to="/admin/dashboard" className="nav-link">Overview</Link>
                    <Link to="/admin/content" className="nav-link">Content</Link>
                    <Link to="/admin/hospitals" className="nav-link">Hospitals</Link>
                    <Link to="/admin/blogs" className="nav-link ">Blogs</Link>
                    <Link to="/admin/insurers" className="nav-link">Insurers</Link>
                    <Link to="/admin/claims" className="nav-link">Claims</Link>
                    <Link to="/admin/leads" className="nav-link">Leads</Link>
                    <Link to='/admin/quote-pricing' className="nav-link">Quote Pricing</Link>
                    <Link to="/admin/chatbot" className="nav-link active">Chatbot</Link>

                    <Link to="/admin/settings" className="nav-link">Settings</Link>
                                        <Link to= "/admin/logout" className="nav-link">Logout</Link>
                    
                </nav>
                <div className="nav-foot">Local storage: {STORAGE_KEY}</div>
            </aside>

            <main className="main-area">
                <header className="header-hero hero-leads" role="region">
                    <div className="hero-left">
                        <div className="hero-badge">Bot</div>
                        <div className="hero-title">
                            <h1 className="hero-title">Chatbot configuration</h1>
                            <div className="hero-sub">Edit intents, map quick replies and test interaction flow.</div>
                        </div>
                        <p className="hero-sub">Keep conversational flows small and predictable — quick replies are surfaced as buttons in chat UI.</p>

                        <div className="filter-row">
                            <div className={`chip clickable`} onClick={() => { setQuery(""); setPage(1); }} data-active={query === ""}>All</div>
                            <div className={`chip clickable`} onClick={() => { setQuery("enabled"); setPage(1); }} data-active={query === "enabled"}>Enabled</div>
                            <div className={`chip clickable`} onClick={() => { setQuery("disabled"); setPage(1); }} data-active={query === "disabled"}>Disabled</div>
                            <div style={{ marginLeft: "auto" }} />
                            <div className="chip result-chip">{intents.length} intents</div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="kpi-tiles" aria-hidden>
                            <div className="kpi-tile"><div className="kpi-label">Intents</div><div className="kpi-number">{intents.length}</div><div className="kpi-sub muted">Configured intents</div></div>
                            <div className="kpi-tile"><div className="kpi-label">Enabled</div><div className="kpi-number">{intents.filter(i => i.enabled).length}</div><div className="kpi-sub muted">Active</div></div>
                        </div>

                        <div className="controls-top">
                            <div className="search-luxe search-rich">
                                <svg className="search-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 20.49 21.49 19 15.5 14z" /></svg>
                                <input placeholder="Search intents, triggers or replies... ( / or ⌘/Ctrl+K )" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
                                <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
                                <button className="btn-ghost new-lead" onClick={() => fileRef.current?.click()}>＋ Import</button>
                                <button className="btn-outline" onClick={() => exportJSON()}>Export all</button>
                                <div className="view-toggle" role="tablist" aria-label="View mode">
                                    <button className={`ghost-icon ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>Table</button>
                                    <button className={`ghost-icon ${viewMode === "cards" ? "active" : ""}`} onClick={() => setViewMode("cards")}>Cards</button>
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

                <IntentList
                    pageItems={pageItems}
                    viewMode={viewMode}
                    onOpenEditor={openEditor}
                    onCreate={createIntent}
                    onDuplicate={duplicateIntent}
                    onToggleEnable={toggleEnable}
                    onRemove={(id) => setConfirm({ type: "single", id })}
                    onExport={exportJSON}
                />

                <TestConsole intents={intents} />

                {drawerOpen && active && (
                    <IntentEditorDrawer
                        intent={active}
                        onClose={() => { setDrawerOpen(false); setActive(null); }}
                        onSave={(it) => { saveIntent(it); setDrawerOpen(false); setActive(null); }}
                        onRemoveQuickReply={(parentId, replyId) => {
                            setIntents((s) => s.map((it) => (it.id === parentId ? { ...it, quickReplies: (it.quickReplies || []).filter((q) => q.id !== replyId) } : it)));
                        }}
                        onAddQuickReply={(parentId, title, payload) => {
                            setIntents((s) => s.map((it) => (it.id === parentId ? { ...it, quickReplies: [{ id: uid("qr"), title, payload }, ...(it.quickReplies || [])] } : it)));
                        }}
                        onUpdateQuickReply={(parentId, replyId, patch) => {
                            setIntents((s) => s.map((it) => (it.id === parentId ? { ...it, quickReplies: (it.quickReplies || []).map((q) => q.id === replyId ? { ...q, ...patch } : q) } : it)));
                        }}
                        onMoveReply={(parentId, idx, dir) => {
                            setIntents((s) => s.map((it) => {
                                if (it.id !== parentId) return it;
                                const arr = [...(it.quickReplies || [])];
                                const to = idx + dir;
                                if (to < 0 || to >= arr.length) return it;
                                const [item] = arr.splice(idx, 1);
                                arr.splice(to, 0, item);
                                return { ...it, quickReplies: arr };
                            }));
                        }}
                    />
                )}

                {confirm && (
                    <div className="preview-overlay">
                        <div className="preview-card bento-card confirm-modal">
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ fontSize: 22 }}>⚠️</div>
                                <div>
                                    <div style={{ fontWeight: 900 }}>{confirm.type === "single" ? "Delete intent?" : `Delete ${confirm.ids.length} intents?`}</div>
                                    <div className="muted">This will permanently remove the selected items.</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                                <button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button>
                                <button className="btn-primary" onClick={() => { if (confirm.type === "single") { removeIntent(confirm.id); } else { /* bulk delete handler if used */ } }}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                {toast && (
                    <div className={`toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`} role="status">
                        <span style={{ marginRight: 8 }}>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "i"}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div>{toast.text}</div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
