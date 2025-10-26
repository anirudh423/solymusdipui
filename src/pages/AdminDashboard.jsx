import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../styles/AdminDashboard.css";


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

function useCountUp(value, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    const from = 0;
    const to = +value;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      if (!cancelled) setN(Math.floor(from + (to - from) * eased));
      if (t < 1 && !cancelled) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return () => {
      cancelled = true;
    };
  }, [value, duration]);
  return n;
}

function sparkPath(data = [], w = 72, h = 22) {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = w / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => {
    const x = i * step;
    const y = h - ((d - min) / range) * h;
    return [x, y];
  });
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");
}

function formatTTL(s) {
  if (s == null) return "—";
  if (s <= 0) return "Expired";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
function fmtNumber(n) {
  return new Intl.NumberFormat().format(n);
}

const baseSample = {
  cards: [
    { key: "blogs", label: "Blogs", value: 128, change: 6, spark: [6, 8, 7, 10, 12, 9, 11, 12, 13, 14] },
    { key: "leads", label: "Leads", value: 1456, change: 12, spark: [90, 120, 200, 180, 210, 230, 240, 260, 300, 320] },
    { key: "hospitals", label: "Hospitals", value: 72, change: -3, spark: [2, 2, 3, 4, 4, 4, 5, 5, 5, 5] },
    { key: "policies", label: "Policies", value: 4321, change: 4, spark: [300, 320, 330, 340, 360, 370, 380, 410, 420, 450] },
    { key: "revenue", label: "Revenue", value: 128600, prefix: "$", change: 9, spark: [8000, 9000, 11000, 9000, 12000, 13000, 14000, 15000, 16000, 17000] },
    { key: "admins", label: "Active Admins", value: 8, change: 0, spark: [5, 6, 6, 7, 7, 8, 8, 8, 8, 8] },
  ],
  traffic: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [320, 420, 510, 470, 560, 640, 720],
  },
  conversions: [
    { label: "Quote → Lead", value: 24 },
    { label: "Lead → Policy", value: 8 },
    { label: "Visits → Quote", value: 3 },
    { label: "Retention", value: 58 },
  ],
  leadsTable: [
    { id: "L-1001", name: "Maris D.", email: "maris.d@example.com", status: "New", source: "Website", date: "2025-10-22", notes: "Interested in premium plan" },
    { id: "L-1002", name: "Asha P.", email: "asha.p@example.com", status: "Contacted", source: "Campaign", date: "2025-10-21", notes: "Call scheduled" },
    { id: "L-1003", name: "Carlos R.", email: "carlos.r@example.com", status: "Quoted", source: "Referral", date: "2025-10-21", notes: "Requested multi-year quote" },
    { id: "L-1004", name: "Nina K.", email: "nina.k@example.com", status: "Converted", source: "Website", date: "2025-10-20", notes: "Converted via self-serve" },
  ],
  activity: [
    { id: 1, text: "New lead from website — Maris D.", time: "2m" },
    { id: 2, text: "Policy #P-221 created", time: "40m" },
    { id: 3, text: "Campaign 'Autumn' launched", time: "3h" },
  ],
};

function useUniqueId(prefix = "id") {
  return useMemo(() => `${prefix}_${Math.random().toString(36).slice(2, 9)}`, []);
}

const Donut = ({ percent = 50, size = 92, stroke = 14 }) => {
  const gradId = useUniqueId("donutG");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0" stopColor="#d39a2f" />
          <stop offset="1" stopColor="#f6d89b" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={`url(#${gradId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        fill="none"
        style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.9,.2,1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="donut-text">
        {percent}%
      </text>
    </svg>
  );
};

const Spark = ({ points, w = 86, h = 22 }) => {
  const gradId = useUniqueId("sparkG");
  const d = sparkPath(points, w, h);
  return (
    <svg className="spark-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0" stopColor="#d39a2f" />
          <stop offset="1" stopColor="#f6d89b" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

function TrafficChart({ values, labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }) {
  const w = 760,
    h = 220,
    pad = 18;
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const max = Math.max(...values) || 1;
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const step = (w - pad * 2) / Math.max(1, values.length - 1);
  const points = values.map((v, i) => [pad + i * step, pad + (1 - (v - min) / range) * (h - pad * 2)]);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `M ${pad} ${h - pad} L ${points.map((p) => `${p[0]} ${p[1]}`).join(" L ")} L ${w - pad} ${h - pad} Z`;

  function onMove(e) {
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    let idx = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dx = Math.abs(p[0] - mouseX);
      if (dx < best) {
        best = dx;
        idx = i;
      }
    });
    const [px, py] = points[idx];
    const localX = (px / w) * rect.width;
    const localY = (py / h) * rect.height;
    setTooltip({
      x: localX,
      y: localY,
      val: values[idx],
      label: labels[idx] || `#${idx + 1}`,
    });
  }

  function onLeave() {
    setTooltip(null);
  }

  return (
    <div className="traffic-wrapper" ref={containerRef} onMouseMove={onMove} onMouseLeave={onLeave}>
      <svg viewBox={`0 0 ${w} ${h}`} className="traffic-chart" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <linearGradient id="areaGoldX" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(212,154,79,0.14)" />
            <stop offset="1" stopColor="rgba(212,154,79,0.02)" />
          </linearGradient>
        </defs>

        <path className="area-path" d={area} fill="url(#areaGoldX)" stroke="none" />
        <path className="line-path" d={d} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke="var(--accent)" strokeWidth="1.2" />
        ))}
      </svg>

      {tooltip && (
        <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tt-label">{tooltip.label}</div>
          <div className="tt-value">{tooltip.val}</div>
        </div>
      )}
    </div>
  );
}

const ProgressRing = ({ value = 0, size = 72, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, value) / 100) * c;
  return (
    <svg width="72" height="72" viewBox={`0 0 ${size} ${size}`} className="progress-ring" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        fill="none"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="ring-text">
        {value}%
      </text>
    </svg>
  );
};

function ActivityFeed({ items = [] }) {
  return (
    <div className="activity-feed">
      {items.map((it) => (
        <div className="activity-row" key={it.id}>
          <div className="activity-dot" aria-hidden />
          <div className="activity-text">{it.text}</div>
          <div className="activity-time small muted">{it.time}</div>
        </div>
      ))}
    </div>
  );
}

function DetailDrawer({ open, onClose, kind, payload }) {
  return (
    <aside className={`detail-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="drawer-head">
        <div className="drawer-title">{kind === "lead" ? "Lead details" : kind === "tile" ? "Metric details" : "Details"}</div>
        <button className="drawer-close" onClick={onClose} aria-label="Close details">✕</button>
      </div>

      <div className="drawer-body">
        {kind === "lead" && payload && (
          <>
            <div className="lead-meta">
              <div className="lead-name">{payload.name}</div>
              <div className="lead-sub muted">{payload.email} • {payload.source}</div>
            </div>

            <div className="lead-grid">
              <div><div className="muted">ID</div><div className="mono">{payload.id}</div></div>
              <div><div className="muted">Status</div><div className="strong">{payload.status}</div></div>
              <div><div className="muted">Date</div><div>{payload.date}</div></div>
              <div><div className="muted">Notes</div><div>{payload.notes || "—"}</div></div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn-primary" onClick={() => alert(`Contacting ${payload.name} (demo)`)}>Contact lead</button>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={() => alert("Open CRM (demo)")}>Open CRM</button>
            </div>

            <hr style={{ margin: "12px 0", borderColor: "rgba(0,0,0,0.04)" }} />

            <div className="muted small">Recent activity</div>
            <div style={{ marginTop: 8 }}>
              <div className="activity-row small muted"><div style={{ width: 8, height: 8, background: "#e6c07a", borderRadius: 8, marginRight: 8 }} />Lead created • 2d ago</div>
              <div className="activity-row small muted" style={{ marginTop: 8 }}><div style={{ width: 8, height: 8, background: "#c9a24a", borderRadius: 8, marginRight: 8 }} />Last contact • 1d ago</div>
            </div>
          </>
        )}

        {kind === "tile" && payload && (
          <>
            <div className="lead-meta">
              <div className="lead-name">{payload.label}</div>
              <div className="lead-sub muted">Quick trend & details</div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div className="muted">Current</div>
              <div className="strong" style={{ marginTop: 6 }}>{payload.prefix || ""}{payload.value.toLocaleString()}</div>
            </div>

            <div style={{ marginTop: 12 }}><Spark points={payload.spark} w={260} h={60} /></div>

            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button className="btn-outline" onClick={() => alert("Drill in (demo)")}>Drill in</button>
              <button className="btn-primary" onClick={() => alert("Create alert (demo)")}>Create alert</button>
            </div>
          </>
        )}

        {!kind && <div className="muted">No item selected</div>}
      </div>
    </aside>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(baseSample);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("7d");
  const [demoToken, setDemoToken] = useState("");
  const [tokenTTL, setTokenTTL] = useState(null);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("solymus_theme") || (document.documentElement.dataset.theme || "light"));
  const [compact, setCompact] = useState(() => (localStorage.getItem("solymus_compact") === "1"));
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [tileTip, setTileTip] = useState(null); // {x,y,key,val,points}
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKind, setDrawerKind] = useState(null); // "lead" | "tile"
  const [drawerPayload, setDrawerPayload] = useState(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    setToast({ type: "info", text: "Welcome back, Demo Admin" });
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    localStorage.setItem("solymus_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("solymus_compact", compact ? "1" : "0");
    document.documentElement.dataset.compact = compact ? "1" : "0";
  }, [compact]);

  useEffect(() => {
    const factor = range === "7d" ? 0.08 : range === "30d" ? 0.18 : 0.32;
    const mutate = (arr) => arr.map((v) => Math.max(1, Math.round(v * (1 + (Math.random() - 0.4) * factor))));
    const newCards = baseSample.cards.map((c) => ({ ...c, value: Math.max(1, Math.round(c.value * (1 + (Math.random() - 0.28) * factor))), spark: mutate(c.spark) }));
    const newTraffic = { ...baseSample.traffic, values: mutate(baseSample.traffic.values) };
    setData((prev) => ({ ...prev, cards: newCards, traffic: newTraffic }));
  }, [range]);

  async function refreshData() {
    setLoading(true);
    setToast(null);
    await new Promise((r) => setTimeout(r, 550));
    const mutate = (arr, scale = 0.12) => arr.map((v) => Math.max(1, Math.round(v * (1 + (Math.random() - 0.45) * scale))));
    setData((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => ({ ...c, value: Math.max(1, Math.round(c.value * (1 + (Math.random() - 0.25) * 0.18))), spark: mutate(c.spark || []) })),
      traffic: { ...prev.traffic, values: mutate(prev.traffic.values, 0.18) },
    }));
    setLoading(false);
    setToast({ type: "info", text: "Data refreshed" });
    setLastUpdated(new Date());
    setTimeout(() => setToast(null), 1200);
  }

  function exportLeadsCsv() {
    const rows = [["ID", "Name", "Email", "Status", "Source", "Date"], ...data.leadsTable.map((r) => [r.id, r.name, r.email, r.status, r.source, r.date])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", text: "Export started" });
    setTimeout(() => setToast(null), 1400);
  }

  function revealDemoToken() {
    const t = fauxJwtForDemo("admin@solymus.example");
    setDemoToken(t);
    try {
      navigator.clipboard.writeText(t);
      setToast({ type: "success", text: "Token copied" });
      setTimeout(() => setToast(null), 1200);
    } catch { }
  }

  useEffect(() => {
    if (!demoToken) {
      setTokenTTL(null);
      return;
    }
    let id = null;
    try {
      const payload = JSON.parse(atob(demoToken.split(".")[1]));
      if (!payload?.exp) {
        setTokenTTL(null);
        return;
      }
      function tick() {
        const now = Math.floor(Date.now() / 1000);
        const ttl = payload.exp - now;
        setTokenTTL(ttl > 0 ? ttl : 0);
      }
      tick();
      id = setInterval(tick, 1000);
    } catch {
      setTokenTTL(null);
    }
    return () => clearInterval(id);
  }, [demoToken]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function clearSearch() {
    setQuery("");
    if (searchRef.current) {
      searchRef.current.value = "";
      searchRef.current.focus();
    }
  }

  function showTileTip(e, c) {
    const rect = e.currentTarget.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const top = rect.top;
    setTileTip({
      x: left,
      y: top,
      key: c.key,
      val: c.value,
      points: c.spark,
    });
  }
  function hideTileTip() {
    setTileTip(null);
  }

  function openDrawerForLead(lead) {
    setDrawerKind("lead");
    setDrawerPayload(lead);
    setDrawerOpen(true);
  }
  function openDrawerForTile(tile) {
    setDrawerKind("tile");
    setDrawerPayload(tile);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setDrawerKind(null);
      setDrawerPayload(null);
    }, 260);
  }

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.leadsTable;
    return data.leadsTable.filter((r) => `${r.id} ${r.name} ${r.email} ${r.status} ${r.source}`.toLowerCase().includes(q));
  }, [query, data.leadsTable]);

  return (
    <div className="dash-root bento polished" role="application" aria-label="Admin dashboard">
      <aside className="left-nav" aria-hidden>
        <div className="nav-brand">
          <div className="nav-crest" aria-hidden>
            <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden>
              <defs>
                <linearGradient id="lgNavX" x1="0" x2="1">
                  <stop offset="0" stopColor="#caa24a" />
                  <stop offset="1" stopColor="#f7e3b0" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="16" fill="url(#lgNavX)" />
              <path d="M10 20c2-3 6-6 8-6s6 2 8 6" stroke="#1b2623" strokeWidth="1.2" fill="none" />
            </svg>
          </div>

          <div className="nav-title">
            <div className="nav-name">Solymus</div>
            <div className="nav-sub">Executive</div>
          </div>
        </div>

        <nav className="nav-links" role="navigation" aria-label="Primary">
          <Link to="/admin/dashboard" className="nav-link active">Overview</Link>
          <Link to="/admin/content" className="nav-link">Content</Link>
          <Link to="/admin/blogs" className="nav-link">Blogs</Link>
          <Link to="/admin/leads" className="nav-link">Leads</Link>
          <Link to="/admin/settings" className="nav-link">Settings</Link>
        </nav>

        <div className="nav-foot small muted">Signed in as <strong>Demo Admin</strong></div>
      </aside>

      <div className="main-area">
        <header className="dash-topbar" role="banner">
          <div className="left">
            <div className="brand-crumbs">
              <div className="brand-mini">Solymus</div>
              <div className="crumbs">/ Overview</div>
            </div>
            <div className="last-updated small muted">Updated {lastUpdated.toLocaleTimeString()}</div>
          </div>

          <div className="center" role="search">
            <div className="search">
              <input ref={searchRef} placeholder="Search leads, campaigns, policies..." aria-label="Search" onChange={(e) => setQuery(e.target.value)} />
              <button className="search-btn" aria-hidden title="Search">⌕</button>
              <button className="search-clear" onClick={clearSearch} title="Clear search">✕</button>
            </div>
          </div>

          <div className="right">
            <div className="range-controls" aria-hidden>
              <button className={`range-btn ${range === "7d" ? "active" : ""}`} onClick={() => setRange("7d")}>7d</button>
              <button className={`range-btn ${range === "30d" ? "active" : ""}`} onClick={() => setRange("30d")}>30d</button>
              <button className={`range-btn ${range === "90d" ? "active" : ""}`} onClick={() => setRange("90d")}>90d</button>
            </div>

            <div className="top-actions">
              <div className="notice" aria-live="polite">{toast?.text || ""}</div>
              <button className={`btn-outline refresh-btn ${loading ? "loading" : ""}`} onClick={refreshData} aria-busy={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
              <button className="btn-outline" onClick={exportLeadsCsv}>Export</button>
              <Link to="/admin/login" className="btn-ghost">Login</Link>

              <button className="icon-btn" title="Toggle theme" onClick={toggleTheme}>{theme === "dark" ? "☀️" : "🌙"}</button>

              <button className="icon-btn" title="Toggle compact" onClick={() => setCompact(prev => !prev)}>{compact ? "🧭" : "🗂️"}</button>

              <button className="icon-btn notif" title="Notifications" onClick={() => setToast({ type: "info", text: "No new notifications" })}>🔔<span className="notif-dot" /></button>

              <div className="profile" title="Account"><div className="avatar">SD</div><div className="profile-name">Demo Admin</div></div>
            </div>
          </div>
        </header>

        <main className={`dash-grid bento-grid ${compact ? "compact" : ""}`} role="main">
          <div className="bento-card summary card-entrance" style={{ gridColumn: "span 12" }}>
            <div className="card-head">
              <div>
                <div className="title">Executive summary</div>
                <div className="sub">High level view — quick wins & flags</div>
              </div>
              <div className="summary-actions">
                <button className="btn-outline" onClick={() => alert("Downloading summary (demo)")}>Download</button>
                <button className="btn-primary" onClick={() => alert("Share (demo)")}>Share</button>
              </div>
            </div>

            <div className="card-body summary-body">
              <div className="summary-left">
                <div className="summary-kpis">
                  <div className="sum-kpi"><div className="sum-label">Visits</div><div className="sum-val">7,232</div></div>
                  <div className="sum-kpi"><div className="sum-label">Conversion</div><div className="sum-val">24%</div></div>
                  <div className="sum-kpi"><div className="sum-label">Revenue</div><div className="sum-val">$128.6k</div></div>
                </div>

                <div className="summary-insights">
                  <div className="impacted small muted">Top insight</div>
                  <div className="insight-text strong">Leads are up 12% — invest in campaign to capitalise.</div>
                </div>
              </div>

              <div className="summary-right">
                <div style={{ width: 140, height: 140 }}><Donut percent={24} /></div>
                <div className="muted small center">Primary funnel</div>
              </div>
            </div>
          </div>

          <div className="bento-card hero card-entrance">
            <div className="card-head">
              <div>
                <div className="title">Traffic — This week</div>
                <div className="sub">Trends & comparison</div>
              </div>
              <div className="hero-kpis">
                <div className="hero-kpi"><div className="kpi-label">Visits</div><div className="kpi-val">7,232</div></div>
                <div className="hero-kpi"><div className="kpi-label">Conversion</div><div className="kpi-val">24%</div></div>
                <div className="hero-kpi"><div className="kpi-label">Revenue</div><div className="kpi-val">$128.6k</div></div>
              </div>
            </div>

            <div className="card-body"><TrafficChart values={data.traffic.values} labels={data.traffic.labels} /></div>
            <div className="card-foot small muted">Compared to last week — subtle gains across channels.</div>
          </div>

          <div className="bento-card small tall conversions-bento card-entrance">
            <div className="card-head"><div className="title">Conversion mix</div><div className="sub">Snapshot</div></div>

            <div className="card-body conv-bento-body">
              <div className="conv-list">
                {data.conversions.map((c, i) => (
                  <div className="conv-row" key={i}>
                    <div className="conv-label">{c.label}</div>
                    <div className="conv-bar" aria-hidden title={`${c.value}%`}><div className="conv-fill" style={{ width: `${Math.min(100, c.value)}%` }} /></div>
                    <div className="conv-val">{c.value}%</div>
                  </div>
                ))}
                <div className="muted small">Performance by funnel step</div>
              </div>

              <div className="conv-donut">
                <div style={{ width: 110, height: 110 }}><Donut percent={data.conversions[0].value} /></div>
                <div className="muted small center">Primary funnel</div>
                <div style={{ height: 14 }} />
                <div className="progress-row"><ProgressRing value={64} /><div className="progress-meta"><div className="muted small">Revenue target</div><div className="strong">$260k / $400k</div></div></div>
              </div>
            </div>
          </div>

          <div className="bento-card tiles card-entrance">
            <div className="tiles-grid">
              {data.cards.map(c => {
                const v = useCountUp(c.value);
                const p = Math.min(100, Math.round((c.value % (c.key === "revenue" ? 20000 : 800)) / (c.key === "revenue" ? 200 : 80) * 100));
                return (
                  <div
                    className="tile"
                    key={c.key}
                    tabIndex={0}
                    onMouseEnter={(e) => showTileTip(e, c)}
                    onFocus={(e) => showTileTip(e, c)}
                    onMouseLeave={hideTileTip}
                    onBlur={hideTileTip}
                    role="button"
                    aria-label={`${c.label} — ${c.value}`}
                    onClick={() => openDrawerForTile({ ...c, value: v })}
                  >
                    <div className="tile-top">
                      <div className="tile-label">{c.label}</div>
                      <div className={`tile-change ${c.change >= 0 ? "up" : "down"}`}>{c.change >= 0 ? `+${c.change}%` : `${c.change}%`}</div>
                    </div>

                    <div className="tile-main">
                      <div className="tile-left">
                        <div className="tile-value">{c.prefix || ""}<strong>{c.prefix ? fmtNumber(v) : v.toLocaleString()}</strong></div>
                        <div className="tile-foot small muted">Last 10 intervals</div>
                      </div>
                      <div className="tile-right">
                        <div className="mini-progress" aria-hidden>
                          <div className="mini-track"><div className="mini-fill" style={{ width: `${p}%` }} /></div>
                        </div>
                        <div className="tile-spark"><Spark points={c.spark} /></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bento-card leads-wide card-entrance">
            <div className="card-head">
              <div><div className="title">Recent leads</div><div className="sub">Latest activity</div></div>
              <div className="card-actions"><button className="btn-outline" onClick={exportLeadsCsv}>Export CSV</button></div>
            </div>

            <div className="card-body table-scroll">
              <table className="leads-table" role="table" aria-label="Recent leads">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Source</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {filteredLeads.map(r => (
                    <tr key={r.id} tabIndex={0} className="lead-row" onClick={() => openDrawerForLead(r)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDrawerForLead(r) }}>
                      <td className="mono">{r.id}</td><td>{r.name}</td><td className="mono small">{r.email}</td><td>{r.source}</td>
                      <td><span className={`badge status-${r.status.toLowerCase()}`}>{r.status}</span></td><td className="mono small">{r.date}</td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && <tr><td colSpan={6} className="muted center">No leads match your search</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="card-foot">
              <div className="foot-left"><button className="btn-outline" onClick={() => alert("Open lead manager (demo)")}>Open lead manager</button></div>
              <div className="foot-right"><button className="btn-primary" onClick={() => alert("Create campaign (demo)")}>Create campaign</button></div>
            </div>
          </div>

          <div className="bento-card right-stack card-entrance">
            <div className="card token-mini">
              <div className="card-head"><div className="title">Demo token</div></div>
              <div className="card-body token-body compact">
                <div className="token-actions">
                  <button className="btn-outline small" onClick={revealDemoToken}>Reveal</button>
                  <button className="btn-outline small" onClick={() => { navigator.clipboard.writeText(demoToken || ""); setToast({ type: "success", text: "Copied" }); setTimeout(() => setToast(null), 900); }}>Copy</button>
                </div>
                <textarea readOnly value={demoToken} placeholder="No demo token revealed" className="token-text compact" />
                <div className="token-meta"><div className="muted">Expires: <strong>{formatTTL(tokenTTL)}</strong></div></div>
              </div>
            </div>

            <div className="card actions-mini">
              <div className="card-head"><div className="title">Quick actions</div></div>
              <div className="card-body actions-grid compact">
                <button className="btn-primary" onClick={() => alert("New blog (demo)")}>New blog</button>
                <button className="btn-outline" onClick={() => alert("Invite admin (demo)")}>Invite admin</button>
                <button className="btn-outline" onClick={() => alert("Run backup (demo)")}>Run backup</button>
              </div>
            </div>

            <div className="card activity-mini">
              <div className="card-head"><div className="title">Activity</div></div>
              <div className="card-body small"><ActivityFeed items={data.activity} /></div>
            </div>
          </div>
        </main>
      </div>

      {tileTip && (
        <div className="tile-tooltip" style={{ left: tileTip.x, top: tileTip.y }}>
          <div className="tt-strong">{tileTip.key.toUpperCase()} — {tileTip.val}</div>
          <div className="tt-mini-spark"><Spark points={tileTip.points} w={120} h={36} /></div>
        </div>
      )}
      {
        drawerOpen && <DetailDrawer open={drawerOpen} onClose={closeDrawer} kind={drawerKind} payload={drawerPayload} />

      }


      {toast && <div className={`toast toast-${toast.type || "info"}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  );
}
