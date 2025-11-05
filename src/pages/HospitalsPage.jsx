

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function HospitalsPage() {
    const [pincode, setPincode] = useState("");
    const [city, setCity] = useState("");
    const [useLocation, setUseLocation] = useState(false);
    const [radiusKm, setRadiusKm] = useState(25);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [coords, setCoords] = useState(null);
    const [sortBy, setSortBy] = useState("distance");
    const [page, setPage] = useState(1);
    const perPage = 8;
    const rafRef = useRef(null);
    const [selected, setSelected] = useState(null);
    const [specialtyFilter, setSpecialtyFilter] = useState("");
    const [minRating, setMinRating] = useState(0);
    const [queryDebounce, setQueryDebounce] = useState(null);

    const [filterOpenMobile, setFilterOpenMobile] = useState(false);
    const [animatedCount, setAnimatedCount] = useState(0);
    const countRef = useRef(null);

    useEffect(() => {
        const id = "hosp-locator-styles-draper-fixed-x";
        if (!document.getElementById(id)) {
            const s = document.createElement("style");
            s.id = id;
            s.innerHTML = styles;
            document.head.appendChild(s);
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const sampleHospitals = useMemo(() => [
        { id: "h-1", name: "Apex City Hospital", address: "12 MG Road", city: "Mumbai", pincode: "400001", lat: 19.015, lng: 72.825, phone: "+91-22-1234-5678", cashless: true, specialties: ["Cardiology", "Orthopedics"], rating: 4.6 },
        { id: "h-2", name: "Care & Cure Medical", address: "7 Central Ave", city: "Pune", pincode: "411001", lat: 18.5204, lng: 73.8567, phone: "+91-20-9988-7766", cashless: true, specialties: ["Maternity", "Pediatrics"], rating: 4.2 },
        { id: "h-3", name: "Green Valley Hospital", address: "Sector 5", city: "Bengaluru", pincode: "560001", lat: 12.9716, lng: 77.5946, phone: "+91-80-3344-8899", cashless: false, specialties: ["Neurology"], rating: 3.9 },
        { id: "h-4", name: "Lifeline Health Centre", address: "Baker Street", city: "Delhi", pincode: "110001", lat: 28.6139, lng: 77.209, phone: "+91-11-2233-4455", cashless: true, specialties: ["Emergency", "Trauma"], rating: 4.8 },
        { id: "h-5", name: "Southside Clinic", address: "22 Palm Grove", city: "Hyderabad", pincode: "500001", lat: 17.385, lng: 78.4867, phone: "+91-40-5566-7788", cashless: true, specialties: ["OPD"], rating: 4.0 },
        { id: "h-6", name: "North General Hospital", address: "45 Hill Rd", city: "Mumbai", pincode: "400002", lat: 19.02, lng: 72.83, phone: "+91-22-4455-6677", cashless: true, specialties: ["ICU", "Cardiology"], rating: 4.4 },
        { id: "h-7", name: "Seaside Medical", address: "Pier 9", city: "Chennai", pincode: "600001", lat: 13.0827, lng: 80.2707, phone: "+91-44-7788-9900", cashless: false, specialties: ["ENT"], rating: 3.7 },
        { id: "h-8", name: "Metro Heart Institute", address: "88 Club St", city: "Kolkata", pincode: "700001", lat: 22.5726, lng: 88.3639, phone: "+91-33-1122-3344", cashless: true, specialties: ["Cardiology"], rating: 4.7 }
    ], []);

    function toRad(x) { return (x * Math.PI) / 180; }
    function distanceKm(a, b) {
        if (!a || !b) return Infinity;
        const R = 6371;
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
        const aa = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
        return R * c;
    }

    async function fetchHospitalsFromServer() {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (pincode) q.set("pincode", pincode);
            if (city) q.set("city", city);
            if (coords) { q.set("lat", coords.lat); q.set("lng", coords.lng); q.set("radiusKm", String(radiusKm)); }
            const res = await fetch("/api/hospitals?" + q.toString());
            if (!res.ok) throw new Error("Server returned " + res.status);
            const json = await res.json();
            if (!Array.isArray(json)) throw new Error("Invalid data from server");
            setHospitals(json);
        } catch (err) {
            console.warn("Hospital fetch failed — using local dataset", err);
            setHospitals(sampleHospitals);
            setError("Using offline data (server unavailable)");
        } finally {
            setLoading(false);
        }
    }

    function locateMe() {
        if (!navigator.geolocation) return setError("Geolocation not supported");
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition((pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setUseLocation(true);
            setLoading(false);
        }, (err) => {
            setError("Unable to get your location: " + (err.message || err.code));
            setLoading(false);
        }, { enableHighAccuracy: true, timeout: 15000 });
    }

    function scheduleSearch() {
        if (queryDebounce) clearTimeout(queryDebounce);
        const id = setTimeout(() => { fetchHospitalsFromServer(); setQueryDebounce(null); }, 420);
        setQueryDebounce(id);
    }

    useEffect(() => {
        const list = hospitals.map(h => ({ ...h }));
        if (coords) list.forEach(h => { h._distanceKm = distanceKm(coords, { lat: h.lat, lng: h.lng }); });
        else list.forEach(h => { h._distanceKm = Infinity; });

        let out = list.filter(h => {
            if (pincode && pincode.trim() && !String(h.pincode).trim().startsWith(String(pincode).trim())) return false;
            if (city && city.trim() && !h.city.toLowerCase().includes(city.trim().toLowerCase())) return false;
            if (specialtyFilter && specialtyFilter.trim()) {
                const sf = specialtyFilter.trim().toLowerCase();
                if (!h.specialties || !h.specialties.join(' ').toLowerCase().includes(sf)) return false;
            }
            if (minRating > 0 && (h.rating ?? 0) < minRating) return false;
            return true;
        });

        if (useLocation && coords) out = out.filter(h => typeof h._distanceKm === 'number' && h._distanceKm <= radiusKm);
        out = out.filter(h => !!h.cashless);

        if (sortBy === 'distance') out.sort((a, b) => (a._distanceKm || Infinity) - (b._distanceKm || Infinity));
        if (sortBy === 'rating') out.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (sortBy === 'name') out.sort((a, b) => a.name.localeCompare(b.name));

        setFiltered(out);
        setPage(1);
    }, [hospitals, pincode, city, coords, radiusKm, useLocation, sortBy, specialtyFilter, minRating, sampleHospitals]);

    useEffect(() => {
        const target = filtered.length;
        cancelAnimationFrame(countRef.current);
        const start = performance.now();
        const duration = 360;
        function step(ts) {
            const t = Math.min(1, (ts - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimatedCount(Math.round(eased * target));
            if (t < 1) countRef.current = requestAnimationFrame(step);
        }
        countRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(countRef.current);
    }, [filtered.length]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPageItems = filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage);

    function handleSearch(e) { if (e && e.preventDefault) e.preventDefault(); fetchHospitalsFromServer(); }
    function clearFilters() { setPincode(''); setCity(''); setCoords(null); setUseLocation(false); setRadiusKm(25); setError(null); setSortBy('distance'); setSpecialtyFilter(''); setMinRating(0); fetchHospitalsFromServer(); }
    function openDirections(h) { const destination = encodeURIComponent(`${h.lat},${h.lng}`); const q = `${h.name} ${h.address} ${h.city}`; window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&destination_place_id=${encodeURIComponent(q)}`, '_blank'); }

    function exportJSON() {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'hospitals.json'; a.click(); URL.revokeObjectURL(url);
    }
    function exportCSV() {
        if (!filtered?.length) return;
        const keys = ["id", "name", "address", "city", "pincode", "lat", "lng", "phone", "cashless", "specialties", "rating"];
        const rows = [
            keys.join(","),
            ...filtered.map(h => keys.map(k => {
                let v = h[k];
                if (Array.isArray(v)) v = v.join(" | ");
                if (v === undefined || v === null) v = "";
                return `"${String(v).replace(/"/g, '""')}"`;
            }).join(","))
        ].join("\n");
        const blob = new Blob([rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'hospitals.csv'; a.click(); URL.revokeObjectURL(url);
    }

    async function copyPhone(phone) {
        try {
            await navigator.clipboard?.writeText(phone);
            const el = document.createElement("div");
            el.textContent = "Copied";
            el.style.position = "fixed";
            el.style.right = "18px";
            el.style.top = "18px";
            el.style.background = "rgba(7,9,11,0.85)";
            el.style.color = "white";
            el.style.padding = "8px 12px";
            el.style.borderRadius = "8px";
            el.style.zIndex = 1600;
            el.style.fontSize = "13px";
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 900);
        } catch (err) { console.warn("copy failed", err); }
    }

    function openDetails(h) {
        setSelected(h);
        setTimeout(() => {
            const node = document.getElementById(`h-${h.id}-name`);
            if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
    }
    function closeDetails() { setSelected(null); }

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") {
                if (selected) closeDetails();
                if (filterOpenMobile) setFilterOpenMobile(false);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selected, filterOpenMobile]);

    function starElements(rating) {
        const full = Math.floor(rating || 0);
        const frac = (rating || 0) - full;
        const stars = [];
        for (let i = 0; i < 5; i++) {
            if (i < full) stars.push("full");
            else if (i === full && frac >= 0.5) stars.push("half");
            else stars.push("empty");
        }
        return stars;
    }

    useEffect(() => { fetchHospitalsFromServer(); }, []);

    return (
        <div className="draper-root fixed">
            <div className="draper-shell">
                <header className="d-header">
                    <div className="brand">
                        <div className="logo">H</div>
                        <div className="brand-text">
                            <div className="brand-name">Solymus</div>
                            <div className="brand-sub muted">Cashless Hospital Locator</div>
                        </div>
                    </div>

                    <nav className="nav" aria-label="Primary">
                        <a href="/" className="nav-link">Home</a>
                        <a href="/quote" className="nav-link">Full Quote</a>
                        <a href="/hospitals" className="nav-link active">Hospitals</a>
                    </nav>
                </header>

                <section className="hero">
                    <div className="hero-left">
                        <div className="eyebrow">CASHLESS • VERIFIED</div>
                        <h1 id="hospitals-title" className="hero-title">Find cashless hospitals near you</h1>
                        <p className="hero-sub">Fast lookup by pincode, city or your current location. Luxurious UI, fast outcomes.</p>
                    </div>

                    <div className="hero-ctas">
                        <button className="btn primary" onClick={() => { document.getElementById("search-panel")?.scrollIntoView({ behavior: "smooth" }); }}>Start search</button>
                        <button className="btn ghost" onClick={() => locateMe()}>Use my location</button>
                        <button className="btn ghost mobile-filter" onClick={() => setFilterOpenMobile(v => !v)} aria-expanded={filterOpenMobile} aria-controls="search-panel">Filters</button>
                    </div>
                </section>

                <main className="main" id="hospitals-page">
                    <aside id="search-panel" className={`panel ${filterOpenMobile ? 'open-mobile' : ''}`}>
                        <div className="panel-inner">
                            <div className="panel-head">
                                <div className="panel-title">Locator</div>
                                <div className="panel-sub muted">Public cashless lookup</div>
                            </div>

                            <form className="search-form" onSubmit={handleSearch}>
                                <label className="label">Pincode</label>
                                <input inputMode="numeric" value={pincode} onChange={(e) => { setPincode(e.target.value); scheduleSearch(); }} placeholder="400001" />

                                <label className="label">City</label>
                                <input value={city} onChange={(e) => { setCity(e.target.value); scheduleSearch(); }} placeholder="Mumbai" />

                                <div className="row range-row">
                                    <div className="col">
                                        <label className="label">Radius</label>
                                        <div className="range-meta"><strong>{radiusKm} km</strong></div>
                                        <input type="range" min={5} max={250} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
                                    </div>

                                    <div className="col sort-col">
                                        <label className="label">Sort</label>
                                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                            <option value="distance">Nearest</option>
                                            <option value="rating">Top rated</option>
                                            <option value="name">Name</option>
                                        </select>
                                    </div>
                                </div>

                                <label className="label">Specialty</label>
                                <input value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} placeholder="Cardiology, Maternity..." />

                                <label className="label">Minimum rating</label>
                                <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} />
                                <div className="muted tiny">Showing {minRating}+ stars</div>

                                <div className="actions">
                                    <button type="button" className="btn primary" onClick={handleSearch} disabled={loading}>{loading ? "Searching…" : "Search"}</button>
                                    <button type="button" className="btn ghost" onClick={clearFilters}>Reset</button>
                                </div>

                                <div className="help">
                                    <div className="muted tiny"><strong className="count">{animatedCount}</strong> results — cashless</div>
                                    <div className="muted tiny">{error ? "Offline dataset" : "/api/hospitals"}</div>
                                </div>
                            </form>

                            <div className="features">
                                <div className="feature"><span className="ico">📍</span><div><strong>Find nearby</strong><div className="muted tiny">Radius & geolocation</div></div></div>
                                <div className="feature"><span className="ico">⚖️</span><div><strong>Transparent</strong><div className="muted tiny">Address, phone, specialties</div></div></div>
                                <div className="feature"><span className="ico">📦</span><div><strong>Offline safe</strong><div className="muted tiny">Resilient fallback</div></div></div>
                            </div>
                        </div>
                    </aside>

                    <section className="content">
                        <div className="map-row">
                            <div className="map-card">
                                <div className="map-head">
                                    <div className="map-title">Map preview</div>
                                    <div className="map-tag muted">Replace with Mapbox/Leaflet</div>
                                </div>

                                <div className="map-viewport" role="img" aria-label="Map preview">
                                    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="fauxmap" aria-hidden>
                                        <defs><linearGradient id="g2" x1="0" x2="1"><stop offset="0" stopColor="#fff9f1" /><stop offset="1" stopColor="#fff7ec" /></linearGradient></defs>
                                        <rect x="0" y="0" width="100" height="60" fill="url(#g2)" />
                                        <g transform="translate(8,10)" fill="none" stroke="#e6d6b0" strokeWidth="0.6">
                                            <path d="M0 10 C10 0, 30 0, 40 10 S 70 30, 90 20" />
                                            <path d="M0 20 C12 30, 30 40, 50 30 S 80 20, 90 30" />
                                        </g>
                                        <g transform="translate(16,6)">
                                            {coords ? <g transform="translate(40,24)"><circle r="3" fill="#f59e0b" stroke="#fff" strokeWidth="0.6" /></g> : <>
                                                <g transform="translate(24,18)"><circle r="2.6" fill="#f6b73c" /></g>
                                                <g transform="translate(64,34)"><circle r="2.2" fill="#f59e0b" /></g>
                                            </>}
                                        </g>
                                    </svg>

                                    <div className="map-tools">
                                        <button className="btn ghost" onClick={() => locateMe()}>Find me</button>
                                        <div className="export-group">
                                            <button className="btn ghost" onClick={() => exportJSON()}>JSON</button>
                                            <button className="btn ghost" onClick={() => exportCSV()}>CSV</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="results-card">
                            <div className="results-head">
                                <div>
                                    <div className="muted small">Results</div>
                                    <div className="results-title">Cashless hospitals</div>
                                </div>

                                <div className="results-controls">
                                    <div className="muted tiny">{filtered.length} listings</div>
                                    <div className="actions-inline">
                                        <button className="btn ghost" onClick={() => exportCSV()}>Export CSV</button>
                                        <button className="btn ghost" onClick={() => exportJSON()}>Export JSON</button>
                                    </div>
                                </div>
                            </div>

                            <div className="results-body">
                                {loading && (
                                    <div className="skeletons">
                                        {Array.from({ length: perPage }).map((_, i) => (
                                            <div className="skeleton" key={i}><div className="s-left" /><div className="s-right" /></div>
                                        ))}
                                    </div>
                                )}

                                {!loading && filtered.length === 0 && (
                                    <div className="empty">
                                        <div className="empty-emoji">🏥</div>
                                        <div className="empty-title">No cashless hospitals found</div>
                                        <div className="muted tiny">Try a larger radius or different city/pincode.</div>
                                    </div>
                                )}

                                {!loading && filtered.length > 0 && (
                                    <>
                                        <div className="grid-list">
                                            {currentPageItems.map(h => (
                                                <Link to={'/hospitals/h-1'} key={'h-1'} className={`card ${selected?.id === h.id ? 'active' : ''}`} aria-labelledby={`h-${h.id}-name`}>
                                                    <div className="card-left">
                                                        <div id={`h-${h.id}-name`} className="name" title={h.name}>{h.name}</div>
                                                        <div className="meta" title={`${h.address} • ${h.city} • ${h.pincode}`}>{h.address} • {h.city} • {h.pincode}</div>

                                                        <div className="tags">
                                                            {h.specialties?.slice(0, 4).map((s, idx) => <span key={idx} className="tag">{s}</span>)}
                                                        </div>

                                                        <div className="card-actions">
                                                            <button className="btn tiny ghost" onClick={() => openDirections(h)}>Directions</button>
                                                            <a className="btn tiny ghost" href={`tel:${h.phone}`} rel="noopener noreferrer">Call</a>
                                                            <button className="btn tiny ghost" onClick={() => copyPhone(h.phone)}>Copy</button>
                                                            <button className="btn tiny ghost" onClick={() => openDetails(h)}>Details</button>
                                                        </div>
                                                    </div>

                                                    <div className="card-right">
                                                        <div className="r-badge">CASHLESS</div>
                                                        <div className="distance">{coords && isFinite(h._distanceKm) ? `${h._distanceKm.toFixed(1)} km` : "—"}</div>
                                                        <div className="rating">
                                                            {starElements(h.rating).map((t, i) => <svg key={i} className={`star ${t}`} viewBox="0 0 24 24" aria-hidden><path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.87 1.402-8.168L.132 9.211l8.2-1.193z" /></svg>)}
                                                            <div className="muted tiny">{h.rating ?? "—"}</div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="pager">
                                            <button className="btn ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                                            <div className="muted tiny">Page {page} / {totalPages}</div>
                                            <button className="btn ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="footer">
                    <div>
                        <div className="ft-name">Solymus</div>
                        <div className="ft-sub muted">© {new Date().getFullYear()} Solymus</div>
                    </div>
                    <div className="ft-links">
                        <a href="/terms">Terms</a>
                        <a href="/privacy">Privacy</a>
                    </div>
                </footer>
            </div>

            <aside className={`drawer ${selected ? 'open' : ''}`} role="dialog" aria-hidden={!selected}>
                {selected && (
                    <div className="drawer-inner">
                        <div className="drawer-top">
                            <div>
                                <div className="drawer-title">{selected.name}</div>
                                <div className="muted tiny">{selected.address} • {selected.city} • {selected.pincode}</div>
                            </div>
                            <div className="drawer-acts">
                                <button className="btn ghost" onClick={() => openDirections(selected)}>Directions</button>
                                <button className="btn ghost" onClick={() => { window.location.href = `tel:${selected.phone}`; }}>Call</button>
                                <button className="btn ghost" onClick={closeDetails}>Close</button>
                            </div>
                        </div>

                        <div className="drawer-body">
                            <div className="drawer-left">
                                <h4>Specialties</h4>
                                <div className="chip-row">
                                    {selected.specialties?.map((s, i) => <span key={i} className="tag">{s}</span>)}
                                </div>

                                <h4 style={{ marginTop: 12 }}>Rating</h4>
                                <div className="muted tiny">{selected.rating ?? "—"}</div>

                                <h4 style={{ marginTop: 12 }}>Notes</h4>
                                <div className="muted tiny">This listing is for public cashless lookup. Verify approvals at hospital prior to admission.</div>
                            </div>

                            <div className="drawer-right">
                                <div className="image-placeholder">Hospital</div>
                                <div style={{ marginTop: 12 }}>
                                    <div className="muted tiny">Contact</div>
                                    <div style={{ marginTop: 6, fontWeight: 800 }}>{selected.phone}</div>
                                    <div style={{ marginTop: 8 }}><button className="btn ghost" onClick={() => copyPhone(selected.phone)}>Copy phone</button></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:wght@400;700&display=swap');

:root{
  --bg: #fff8f1;
  --panel: rgba(255,255,255,0.92);
  --text: #071022;
  --muted: #6b6f78;
  --accent-1: #f6b73c;
  --accent-2: #f59e0b;
  --gold: #b77a02;
  --shadow-strong: 0 36px 110px rgba(8,10,12,0.12);
  --shadow-soft: 0 14px 40px rgba(9,11,12,0.06);
  --radius: 14px;
  --container: 1200px;
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0;background:radial-gradient(1200px 600px at 10% 10%, rgba(246,183,60,0.03), transparent 6%), var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.muted{color:var(--muted)}
.tiny{font-size:12px}

.draper-root{min-height:100vh}
.draper-shell{max-width:var(--container);margin:0 auto;padding:30px;display:flex;flex-direction:column;gap:18px}

.d-header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:14px;min-width:0}
.logo{width:70px;height:70px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,var(--gold),var(--accent-1));color:white;font-weight:800;font-family:Playfair Display,serif;font-size:26px;box-shadow:var(--shadow-soft)}
.brand-text{display:flex;flex-direction:column}
.brand-name{font-family:Playfair Display,serif;font-size:18px;font-weight:700}
.brand-sub{font-size:12px;color:var(--muted)}

.nav{display:flex;gap:10px;align-items:center;max-width:60%;overflow:auto}
.nav-link{padding:8px 12px;border-radius:10px;font-weight:700;color:var(--muted);white-space:nowrap}
.nav-link.active{background:linear-gradient(90deg,var(--accent-1),var(--accent-2));color:white;box-shadow:0 10px 36px rgba(245,158,11,0.12)}

.hero{display:flex;align-items:center;justify-content:space-between;padding:24px;border-radius:14px;background:linear-gradient(180deg, rgba(255,252,245,1), rgba(255,249,243,1));box-shadow:var(--shadow-soft);gap:18px;flex-wrap:wrap;border:1px solid rgba(8,10,12,0.03)}
.eyebrow{font-weight:700;color:var(--accent-2);letter-spacing:0.06em}
.hero-title{font-family:Playfair Display,serif;font-size:clamp(22px, 2.9vw, 36px);margin:6px 0 0;line-height:1.08}
.hero-sub{margin:8px 0 0;color:var(--muted)}
.btn{border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;border:0;background:transparent}
.btn.primary{background:linear-gradient(90deg,var(--accent-1),var(--accent-2));color:white;box-shadow:0 14px 44px rgba(245,158,11,0.12)}
.btn.ghost{background:white;border:1px solid rgba(8,10,12,0.06);color:var(--muted)}
.mobile-filter{display:none}

.main{display:grid;grid-template-columns: 360px 1fr; gap:24px;align-items:start}
@media (max-width:980px) { .main { grid-template-columns:1fr; } .mobile-filter{display:inline-flex} }

.panel{min-width:0}
.panel-inner{background:var(--panel);backdrop-filter: blur(6px);padding:16px;border-radius:12px;border:1px solid rgba(8,10,12,0.04);box-shadow:var(--shadow-strong);display:flex;flex-direction:column;gap:12px}
.panel.open-mobile{position:fixed;left:16px;right:16px;top:88px;z-index:1400;padding:14px}

.search-form{display:flex;flex-direction:column;gap:10px}
.label{font-size:12px;color:var(--muted);font-weight:700}
.search-form input, .search-form select, .search-form input[type="range"]{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(8,10,12,0.04);background:white;font-size:14px;outline:none}
.search-form input:focus, .search-form select:focus{box-shadow:0 6px 28px rgba(246,183,60,0.12)}
.range-row{display:flex;gap:12px}
.range-row .col{flex:1;min-width:0}
.sort-col{width:150px;flex-shrink:0}
.actions{display:flex;gap:10px;flex-wrap:wrap}
.help{display:flex;justify-content:space-between;align-items:center;margin-top:8px}

.content{display:flex;flex-direction:column;gap:14px}
.map-card{border-radius:12px;overflow:hidden;border:1px solid rgba(8,10,12,0.03);box-shadow:var(--shadow-soft);background:linear-gradient(180deg,#fff,#fff);padding:12px}
.map-viewport{position:relative;height:min(44vh,380px);border-radius:10px;overflow:hidden;background:linear-gradient(180deg,#fff7ef,#fffbf6);display:flex;align-items:center;justify-content:center}
.map-tools{position:absolute;top:14px;right:14px;display:flex;gap:8px;z-index:2}
.export-group{display:flex;gap:8px}

.results-card{}
.results-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.results-body{background:linear-gradient(180deg,#fff,#fff);border-radius:12px;padding:16px;border:1px solid rgba(8,10,12,0.03);box-shadow:var(--shadow-strong);max-height:calc(100vh - 260px);overflow:auto;padding-right:18px}

.results-body::-webkit-scrollbar{width:10px}
.results-body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(7,9,11,0.06),rgba(7,9,11,0.1));border-radius:10px}
.results-body::-webkit-scrollbar-track{background:transparent}

.skeletons{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.skeleton{display:flex;gap:12px;padding:12px;border-radius:10px;background:linear-gradient(90deg,rgba(8,10,12,0.03),rgba(8,10,12,0.06))}
.s-left{width:60%;height:64px;border-radius:8px;background:linear-gradient(90deg,rgba(8,10,12,0.04),rgba(8,10,12,0.06))}
.s-right{width:40%;height:64px;border-radius:8px;background:linear-gradient(90deg,rgba(8,10,12,0.04),rgba(8,10,12,0.06))}

.grid-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
@media (max-width:980px){ .grid-list{grid-template-columns:1fr} }

.card{
  display:grid;
  grid-template-columns: 1fr 120px; 
  gap:14px;
  align-items:start;
  padding:14px;
  border-radius:12px;
  border:1px solid rgba(8,10,12,0.03);
  background:linear-gradient(180deg,#fff,#fff);
  transition:transform .16s ease, box-shadow .16s ease;
  min-width:0;
}
.card:hover{transform:translateY(-6px);box-shadow:0 28px 80px rgba(9,11,12,0.06)}
.card.active{outline:3px solid rgba(245,158,11,0.08)}

.card-left{min-width:0}
.name{
  font-weight:800;
  font-size:16px;
  line-height:1.12;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
  word-break:break-word;
}
.meta{
  font-size:13px;color:var(--muted);margin-top:6px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;
}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.tag{padding:6px 8px;border-radius:999px;background:linear-gradient(90deg,rgba(246,183,60,0.06),rgba(245,158,11,0.02));font-weight:700;color:var(--accent-2);border:1px solid rgba(245,158,11,0.06);font-size:12px}
.card-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}


.card-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.r-badge{background:linear-gradient(90deg,var(--accent-1),var(--accent-2));color:white;padding:6px 10px;border-radius:8px;font-weight:900;font-size:12px}
.distance{font-weight:800}

.rating{display:flex;flex-direction:row;align-items:center;gap:6px}
.star{width:16px;height:16px;stroke:rgba(7,10,20,0.75);fill:transparent}
.star.full{fill:currentColor;color:#f59e0b}
.star.half{fill:currentColor;color:#f6b73c}
.star.empty{fill:none;opacity:0.22}

.pager{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:12px}
.empty{display:flex;flex-direction:column;align-items:center;padding:26px;border-radius:12px}
.empty-emoji{font-size:36px}
.empty-title{font-weight:800;margin-top:6px}

.footer{display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid rgba(8,10,12,0.03)}
.ft-name{font-weight:800}
.ft-sub{color:var(--muted);font-size:13px}

.drawer{position:fixed;right:0;top:0;height:100%;width:0;pointer-events:none;z-index:1500;transition:width .28s ease}
.drawer.open{width:460px;pointer-events:auto;background:linear-gradient(90deg, rgba(7,9,11,0.02), rgba(7,9,11,0.02))}
.drawer-inner{height:100%;background:rgba(255,255,255,0.92);backdrop-filter: blur(6px);padding:18px;border-left:1px solid rgba(8,10,12,0.03);box-shadow:-40px 40px 140px rgba(8,10,12,0.12);display:flex;flex-direction:column}
.drawer-top{display:flex;justify-content:space-between;align-items:center}
.drawer-body{display:flex;gap:16px;flex:1;overflow:auto;padding-top:12px}
.drawer-left{flex:1}
.drawer-right{width:180px}
.image-placeholder{height:140px;border-radius:10px;background:linear-gradient(120deg, rgba(183,122,2,0.06), rgba(245,158,11,0.06));display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:800}

@media (max-width:720px){
  .draper-shell{padding:18px}
  .hero{padding:12px}
  .main{grid-template-columns:1fr}
  .panel{order:2}
  .content{order:1}
  .mobile-filter{display:inline-flex}
  .drawer.open{width:100%}
  .drawer-right{display:none}
  .results-body{max-height:none}
  .map-viewport{height:220px}
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; transform: none !important; }
}
`;

