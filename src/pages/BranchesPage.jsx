import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/hospital-details.css";
import "../styles/branches.css";


const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M21 21l-4.35-4.35" />
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);
const IconStar = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        <path fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2"
            d="M12 .587l3.668 7.431L23 9.748l-5.5 5.36L18.335 24 12 20.02 5.665 24 7.5 15.108 2 9.748l7.332-1.73z" />
    </svg>
);

function escV(s = "") { return String(s).replace(/[,;\n]/g, m => "\\" + m); }

export default function BranchesPage() {
    const navigate = useNavigate?.() || (() => { });
    const toastRef = useRef(null);
    const listRef = useRef(null);
    const suggestionRef = useRef(null);

    const sampleBranches = useMemo(() => ([
        {
            id: "b-nyc-1",
            name: "Central Plaza Branch",
            address: "120 Central St",
            city: "Mumbai",
            pincode: "400001",
            lat: 19.015, lng: 72.825,
            phone: "+91-22-1234-0001",
            services: ["Accounts", "Loans", "Wealth"],
            hours: { mon: "09:30–18:00", tue: "09:30–18:00", wed: "09:30–18:00", thu: "09:30–18:00", fri: "09:30–18:00", sat: "10:00–13:00", sun: "Closed" },
            rating: 4.5,
            note: "Premium lounge available"
        },
        {
            id: "b-pty-2",
            name: "Harbour View Branch",
            address: "4 Harbour Rd",
            city: "Kolkata",
            pincode: "700001",
            lat: 22.5726, lng: 88.3639,
            phone: "+91-33-1122-2200",
            services: ["Retail", "SME"],
            hours: { mon: "10:00–17:00", tue: "10:00–17:00", wed: "10:00–17:00", thu: "10:00–17:00", fri: "10:00–17:00", sat: "Closed", sun: "Closed" },
            rating: 4.3,
            note: "Drive-up counter"
        },
        {
            id: "b-pun-3",
            name: "Green Park Branch",
            address: "88 Green Park",
            city: "Pune",
            pincode: "411001",
            lat: 18.5204, lng: 73.8567,
            phone: "+91-20-9988-7700",
            services: ["Accounts", "Investments", "Wealth"],
            hours: { mon: "09:00–19:00", tue: "09:00–19:00", wed: "09:00–19:00", thu: "09:00–19:00", fri: "09:00–19:00", sat: "09:00–14:00", sun: "Closed" },
            rating: 4.7,
            note: "Wealth advisors on site"
        }
    ]), []);

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);

    const [cityFilter, setCityFilter] = useState("All");
    const [serviceFilter, setServiceFilter] = useState("All");
    const [openNow, setOpenNow] = useState(false);
    const [sortBy, setSortBy] = useState("relevance");
    const [viewMode, setViewMode] = useState("list");
    const [selection, setSelection] = useState(null);
    const [branches, setBranches] = useState(sampleBranches);
    const [loading, setLoading] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem("branch_favs") || "[]"); } catch { return []; }
    });

    const toast = useCallback((msg = "Done") => {
        if (toastRef.current) toastRef.current.remove();
        const el = document.createElement("div");
        el.className = "td-toast td-toast--gold";
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add("td-toast--visible"));
        toastRef.current = el;
        setTimeout(() => el.classList.remove("td-toast--visible"), 1200);
        setTimeout(() => el.remove(), 1800);
    }, []);

    const exportVCard = useCallback((b) => {
        const lines = [
            "BEGIN:VCARD", "VERSION:3.0",
            `FN:${escV(b.name)}`,
            `ORG:${escV("Company - Branch")}`,
            `TEL;TYPE=WORK,VOICE:${b.phone}`,
            `ADR;TYPE=WORK:;;${escV(b.address)};${escV(b.city)};;${escV(b.pincode)};`,
            `NOTE:${escV("Services: " + (b.services || []).join(", "))}`,
            "END:VCARD"
        ].join("\r\n");
        const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
        const u = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = u; a.download = `${b.name.replace(/\s+/g, "_")}.vcf`; a.click(); URL.revokeObjectURL(u);
        toast("vCard exported");
    }, [toast]);

    const callBranch = useCallback((phone) => { window.location.href = `tel:${phone}`; }, []);
    const copyPhone = useCallback(async (phone) => { try { await navigator.clipboard?.writeText(phone); toast("Phone copied"); } catch { toast("Copy failed"); } }, [toast]);
    const shareBranch = useCallback(async (b) => {
        const url = `${window.location.origin}/branches/${encodeURIComponent(b.id)}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: b.name, text: `${b.name}\n${b.address}`, url });
                toast("Shared");
            } else {
                await navigator.clipboard?.writeText(url);
                toast("Link copied");
            }
        } catch { toast("Unable to share"); }
    }, [toast]);

    const toggleFavorite = useCallback((id) => {
        setFavorites(prev => {
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            try { localStorage.setItem("branch_favs", JSON.stringify(next)); } catch { }
            toast(prev.includes(id) ? "Removed from saved" : "Saved to favorites");
            return next;
        });
    }, [toast]);

    const cities = useMemo(() => ["All", ...Array.from(new Set(sampleBranches.map(b => b.city)))], [sampleBranches]);
    const services = useMemo(() => ["All", ...Array.from(new Set(sampleBranches.flatMap(b => b.services || [])))], [sampleBranches]);

    function dayKeyFromIST() {
        const now = new Date();
        const dayName = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(now);
        const map = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };
        return map[dayName] || "mon";
    }
    function getISTParts() {
        const now = new Date();
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit" }).formatToParts(now);
        const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
        return { hour: parseInt(m.hour || "0", 10), minute: parseInt(m.minute || "0", 10) };
    }
    function parseRange(range) {
        if (!range || /closed/i.test(range)) return null;
        const parts = range.split(/[–-—]/).map(s => s.trim());
        if (parts.length !== 2) return null;
        return parts.map(p => p.replace(/\./g, ":"));
    }
    function timeToMinutes(hhmm) {
        const [h, m] = hhmm.split(":");
        return parseInt(h, 10) * 60 + parseInt(m || "0", 10);
    }
    function isOpenNow(branch) {
        const key = dayKeyFromIST();
        const range = parseRange(branch.hours?.[key]);
        if (!range) return false;
        const { hour, minute } = getISTParts();
        const nowMin = hour * 60 + minute;
        const start = timeToMinutes(range[0]);
        const end = timeToMinutes(range[1]);
        return nowMin >= start && nowMin <= end;
    }

    const mapBounds = useMemo(() => {
        const lats = sampleBranches.map(b => b.lat);
        const lngs = sampleBranches.map(b => b.lng);
        return {
            minLat: Math.min(...lats) - 0.5,
            maxLat: Math.max(...lats) + 0.5,
            minLng: Math.min(...lngs) - 0.5,
            maxLng: Math.max(...lngs) + 0.5
        };
    }, [sampleBranches]);

    const toMapPoint = useCallback((lat, lng) => {
        const { minLat, maxLat, minLng, maxLng } = mapBounds;
        const x = ((lng - minLng) / (maxLng - minLng)) * 100;
        const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
        return { x: Math.max(6, Math.min(94, x)), y: Math.max(6, Math.min(94, y)) };
    }, [mapBounds]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 240);
        return () => clearTimeout(t);
    }, [query]);

    const filtered = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        let list = sampleBranches.filter(b => {
            if (cityFilter !== "All" && b.city !== cityFilter) return false;
            if (serviceFilter !== "All" && !(b.services || []).includes(serviceFilter)) return false;
            if (q && !(b.name + " " + b.address + " " + b.city + " " + (b.pincode || "")).toLowerCase().includes(q)) return false;
            if (openNow && !isOpenNow(b)) return false;
            return true;
        });
        if (sortBy === "rating") list = list.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (sortBy === "name") list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [sampleBranches, debouncedQuery, cityFilter, serviceFilter, openNow, sortBy]);

    useEffect(() => {
        setLoading(true);
        const t = setTimeout(() => { setBranches(filtered); setLoading(false); }, 220);
        return () => clearTimeout(t);
    }, [filtered]);

    useEffect(() => {
        if (branches.length) {
            setSelection(prev => prev && branches.find(b => b.id === prev.id) ? prev : branches[0]);
            setHighlightIndex(0);
        } else {
            setSelection(null);
            setHighlightIndex(-1);
        }
        requestAnimationFrame(() => {
            const el = listRef.current?.querySelector(".branch-card.active");
            el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
    }, [branches]);

    useEffect(() => {
        if (!debouncedQuery) { setSuggestions([]); setSuggestionIndex(-1); return; }
        const q = debouncedQuery.toLowerCase();
        const s = sampleBranches
            .map(b => ({ id: b.id, label: `${b.name} — ${b.city}`, name: b.name }))
            .filter(x => x.label.toLowerCase().includes(q) || x.name.toLowerCase().includes(q))
            .slice(0, 6);
        setSuggestions(s);
        setSuggestionIndex(-1);
    }, [debouncedQuery, sampleBranches]);

    const openCount = useMemo(() => sampleBranches.filter(isOpenNow).length, [sampleBranches]);
    const topRated = useMemo(() => [...sampleBranches].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0], [sampleBranches]);

    const openDirections = useCallback((b) => {
        const dest = encodeURIComponent(`${b.lat},${b.lng}`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank");
    }, []);

    useEffect(() => {
        function onKey(e) {
            const activeEl = document.activeElement;
            if (suggestions.length > 0 && suggestionRef.current?.contains(activeEl)) {
                if (e.key === "ArrowDown") { e.preventDefault(); setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setSuggestionIndex(i => Math.max(i - 1, 0)); }
                if (e.key === "Enter" && suggestionIndex >= 0) {
                    const s = suggestions[suggestionIndex];
                    if (s) { setQuery(s.name); setSuggestions([]); setDebouncedQuery(s.name); }
                }
            }

            if (document.activeElement?.closest?.(".branch-list")) {
                if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, branches.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)); }
                if (e.key === "Enter") { if (highlightIndex >= 0 && branches[highlightIndex]) setSelection(branches[highlightIndex]); }
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [branches, highlightIndex, suggestions, suggestionIndex]);

    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const items = Array.from(listRef.current.querySelectorAll(".branch-card"));
            const el = items[highlightIndex];
            if (el) {
                items.forEach(it => it.classList.remove("keyboard-highlight"));
                el.classList.add("keyboard-highlight");
                el.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        }
    }, [highlightIndex]);

    useEffect(() => {
        if (suggestionIndex >= 0 && suggestionRef.current) {
            const nodes = Array.from(suggestionRef.current.querySelectorAll(".suggestion"));
            const n = nodes[suggestionIndex];
            nodes.forEach(x => x.classList.remove("suggestion--active"));
            n?.classList?.add("suggestion--active");
            n?.scrollIntoView?.({ block: "nearest" });
        }
    }, [suggestionIndex]);

    return (
        <div className="draper-root draper-luxury branches-page">
            <div className="draper-shell">

                <header className="hero-rose hero-branches-ld hero-parallax" role="banner" aria-label="Branches hero">
                    <div className="hero-left">
                        <div className="hero-topbar">
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button className="btn ghost back" onClick={() => navigate(-1)} aria-label="Go back">← Back</button>
                                <div className="muted tiny">Directory / Branches</div>
                            </div>
                            <div className="hero-actions">
                                <button className="btn ghost" onClick={() => { setQuery(""); setCityFilter("All"); setServiceFilter("All"); setOpenNow(false); toast("Filters cleared"); }}>Reset</button>
                            </div>
                        </div>

                        <div className="hero-visual">
                            <div className="eyebrow">BRANCH LOCATOR</div>
                            <h1 className="hero-title-lg">Find a nearby branch — <span className="playful">elegance in service</span></h1>
                            <p className="hero-sub muted">Luxury, reliability — find the nearest branch, confirm working hours and get there fast.</p>

                            <div className="hero-chips">
                                <div className="chip gold"><div className="chip-val">{branches.length}</div><div className="chip-label">Branches</div></div>
                                <div className="chip soft"><div className="chip-val">{openCount}</div><div className="chip-label">Open now</div></div>
                                <div className="chip soft"><div className="chip-val">{topRated?.rating?.toFixed(1) ?? "—"}</div><div className="chip-label">Top rating</div></div>
                            </div>
                        </div>

                        <div className="controls-row">
                            <div className="search-row" style={{ position: "relative" }}>
                                <div className="search-input" role="search" aria-label="Search branches">
                                    <IconSearch />
                                    <input
                                        aria-label="Search branches"
                                        className="branch-search"
                                        placeholder="Search branches, address, or pincode"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onFocus={() => { }}
                                    />
                                </div>

                                <div className="view-toggle" role="tablist" aria-label="View mode">
                                    <button className={`vt-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"}>List</button>
                                    <button className={`vt-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"}>Grid</button>
                                </div>

                                <button className="btn primary" onClick={() => toast('Search applied')} aria-label="Apply search">Find</button>

                                {suggestions.length > 0 && debouncedQuery && (
                                    <div ref={suggestionRef} className="suggestions" role="listbox" aria-label="Search suggestions">
                                        {suggestions.map((s, i) => (
                                            <button key={s.id} role="option" className="suggestion" onClick={() => { setQuery(s.name); setSuggestions([]); setDebouncedQuery(s.name); }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div className="muted tiny" style={{ fontWeight: 800 }}>{s.name}</div>
                                                    <div className="muted tiny">{s.label.split("—").pop().trim()}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="filters-row">
                                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} aria-label="Filter by city">
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} aria-label="Filter by service">
                                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                <label className=" fancy-switch" title="Open now">
                                    <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
                                    <span>Open now</span>
                                </label>

                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort by">
                                    <option value="relevance">Relevance</option>
                                    <option value="rating">Top rated</option>
                                    <option value="name">Name</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right hero-map-card" aria-hidden>
                        <div className="map-card luxury-map">
                            <div className="map-head">
                                <div>
                                    <div className="muted tiny">Map preview</div>
                                    <div className="map-title">Live map (plug Mapbox/Leaflet)</div>
                                </div>
                                <div className="map-actions">
                                    <button className="btn ghost" onClick={() => toast("Map toggled")}>Toggle</button>
                                </div>
                            </div>

                            <div className="map-canvas" role="img" aria-label="Map preview">
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="fauxmap" aria-hidden>
                                    <rect x="0" y="0" width="100" height="100" rx="6" ry="6" fill="url(#mgrad)"></rect>
                                    <defs>
                                        <linearGradient id="mgrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0" stopColor="#fff7ef" />
                                            <stop offset="1" stopColor="#fffbf6" />
                                        </linearGradient>
                                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="2.2" result="b" />
                                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>

                                    {sampleBranches.map(sb => {
                                        const p = toMapPoint(sb.lat, sb.lng);
                                        const selected = selection?.id === sb.id;
                                        return (
                                            <g key={sb.id} transform={`translate(${p.x}, ${p.y})`} aria-hidden>
                                                <circle r={selected ? 4.6 : 3.6} fill={selected ? "url(#selgrad)" : "#c88a06"} stroke="#fff" strokeWidth="0.6" filter={selected ? "url(#glow)" : ""} />
                                                {selected && <text x="8" y="-8" fontSize="7" fontWeight="700" fill="#222">{sb.name.split(" ")[0]}</text>}
                                            </g>
                                        );
                                    })}
                                    <defs>
                                        <linearGradient id="selgrad" x1="0" x2="1">
                                            <stop offset="0" stopColor="#e8b85a" />
                                            <stop offset="1" stopColor="#c88a06" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    </div>
                </header>

                <main className={`detail-main ${viewMode === "grid" ? "grid-mode" : "list-mode"}`} role="main" aria-label="Branch results and details">
                    <section className="detail-left">
                        <div className="card list-card">
                            <div className="list-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 className="card-title luxury-title">{branches.length} branches</h2>
                                    <div className="muted tiny">Refined & verified locations</div>
                                </div>
                                <div className="list-actions muted tiny" aria-live="polite">Showing {branches.length} results</div>
                            </div>

                            <div className="branch-list-wrapper">
                                <div className={`branch-list ${viewMode}`} ref={listRef} role="list" aria-label="Branch list">
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="branch-skeleton" role="status" aria-hidden>
                                                <div className="sk-header" />
                                                <div className="sk-line short" />
                                                <div className="sk-line" />
                                            </div>
                                        ))
                                    ) : (
                                        branches.map((b, idx) => {
                                            const active = selection?.id === b.id;
                                            const fav = favorites.includes(b.id);
                                            return (
                                                <Link
                                                    to={'/hospitals/h-1'}
                                                    key={b.id}
                                                    role="listitem"
                                                    tabIndex={0}
                                                    className={`branch-card fancy ${active ? "active" : ""}`}
                                                    onClick={() => { setSelection(b); setHighlightIndex(idx); }}
                                                    onKeyDown={(e) => { if (e.key === "Enter") { setSelection(b); setHighlightIndex(idx); } }}
                                                    aria-label={`Branch ${b.name}`}
                                                >
                                                    {b.rating === topRated?.rating && <div className="ribbon" aria-hidden><span>Top rated</span></div>}

                                                    <div className="branch-left">
                                                        <div className="branch-title" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                                            <div>
                                                                <div className="title-main">{b.name}</div>
                                                                <div className="title-sub muted tiny">{b.city} • {b.pincode}</div>
                                                            </div>
                                                            <div style={{ display: "flex", gap: 8 }}>
                                                                <button className="btn ghost tiny-like" aria-pressed={fav} onClick={(e) => { e.stopPropagation(); toggleFavorite(b.id); }}>
                                                                    <IconStar filled={fav} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="address muted tiny">{b.address}</div>

                                                        <div className="chip-row">
                                                            {(b.services || []).map((s, i) => <span key={i} className="tag luxury-tag">{s}</span>)}
                                                        </div>
                                                    </div>

                                                    <div className="branch-right">
                                                        <div className={`open-badge ${isOpenNow(b) ? "open" : "closed"}`}>{isOpenNow(b) ? "Open now" : "Closed"}</div>

                                                        <div className="rating">
                                                            <div className="rating-val">{b.rating?.toFixed(1) ?? "—"}</div>
                                                            <div className="muted tiny">Rating</div>
                                                        </div>

                                                        <div className="card-actions">
                                                            <button className="btn primary" onClick={(e) => { e.stopPropagation(); callBranch(b.phone); }}>Call</button>
                                                            <button className="btn ghost" onClick={(e) => { e.stopPropagation(); copyPhone(b.phone); }}>Copy</button>
                                                            <button className="btn ghost" onClick={(e) => { e.stopPropagation(); exportVCard(b); }}>vCard</button>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card hours-card" style={{ marginTop: 18 }}>
                            <h3 className="card-title">Working hours quick view</h3>
                            <table className="hours" role="table" aria-label="Working hours">
                                <tbody>
                                    {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(d => (
                                        <tr key={d}><td className="day">{d.charAt(0).toUpperCase() + d.slice(1)}</td><td className="val muted">{selection?.hours?.[d] || "—"}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="detail-right" aria-label="Detail column">
                        <div className="sticky-column">
                            <div className="card contact-card luxury-card">
                                <div className="contact-head">
                                    <div>
                                        <h4 className="card-title">Quick contact</h4>
                                        <div className="muted tiny">Direct lines & quick actions</div>
                                    </div>
                                </div>

                                {selection ? (
                                    <>
                                        <div className="selection-info">
                                            <div className="selection-name">{selection.name}</div>
                                            <div className="muted tiny">{selection.address} • {selection.city}</div>
                                            {selection.note && <div className="muted tiny" style={{ marginTop: 6 }}>{selection.note}</div>}
                                        </div>

                                        <div className="selection-phone" style={{ marginTop: 12 }}>
                                            <div className="muted tiny">Phone</div>
                                            <div className="phone-bold">{selection.phone}</div>
                                            <div className="detail-actions" style={{ marginTop: 10 }}>
                                                <button className="btn primary" onClick={() => callBranch(selection.phone)}>Call</button>
                                                <button className="btn ghost" onClick={() => shareBranch(selection)}>Share</button>
                                                <button className="btn ghost" onClick={() => openDirections(selection)}>Directions</button>
                                            </div>
                                        </div>

                                        <div className="card sub-card meta" style={{ marginTop: 14 }}>
                                            <div className="muted tiny">Services</div>
                                            <div style={{ marginTop: 8 }} className="chip-row">{(selection.services || []).map((s, i) =>
                                                <span key={i} className="tag luxury-tag">{s}</span>
                                            )}</div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="muted tiny">Select a branch to view contact details.</div>
                                )}
                            </div>

                            <div className="card map-card luxury-card" style={{ marginTop: 18 }}>
                                <h4 className="card-title">Map preview</h4>
                                <div className="map-viewport" role="img" aria-label="Map preview">
                                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="fauxmap" aria-hidden>
                                        <rect width="100" height="60" fill="#fff7ef" />
                                        {sampleBranches.map(sb => {
                                            const p = toMapPoint(sb.lat, sb.lng);
                                            const selected = selection?.id === sb.id;
                                            return <circle key={sb.id} cx={(p.x).toString()} cy={(p.y * 0.6 + 4).toString()} r={selected ? 3.6 : 2.8} fill={selected ? "#c88a06" : "#b77a02"} stroke="#fff" strokeWidth="0.5" />;
                                        })}
                                    </svg>
                                </div>
                            </div>

                            <div className="card snapshot-card luxury-card" style={{ marginTop: 18 }}>
                                <h4 className="card-title">Filters snapshot</h4>
                                <div className="muted tiny">City: <strong>{cityFilter}</strong></div>
                                <div className="muted tiny">Service: <strong>{serviceFilter}</strong></div>
                                <div className="muted tiny">Open now: <strong>{openNow ? "Yes" : "No"}</strong></div>
                                <div style={{ marginTop: 12 }}>
                                    <button className="btn ghost" onClick={() => { setQuery(""); setCityFilter("All"); setServiceFilter("All"); setOpenNow(false); toast("Filters reset"); }}>Reset filters</button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </main>

                <div className="sticky-cta fixed-cta luxury-cta" role="toolbar" aria-label="Primary actions">
                    <div className="cta-left">
                        <div className="logo-mini mini-lux">B</div>
                        <div style={{ marginLeft: 12 }}>
                            <div className="cta-title">Branch Locator</div>
                            <div className="muted tiny">{branches.length} results</div>
                        </div>
                    </div>

                    <div className="cta-actions">
                        <button className="btn primary" onClick={() => toast('Contact center dialed')}>Contact center</button>
                        <button className="btn ghost" onClick={() => { setQuery(""); toast("Search cleared"); }}>Reset search</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
