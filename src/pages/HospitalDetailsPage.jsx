import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/hospital-details.css";



export default function HospitalDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toastRef = useRef(null);

    const sampleHospitals = useMemo(() => ([
        {
            id: "h-1",
            name: "Apex City Hospital",
            address: "12 MG Road",
            city: "Mumbai",
            pincode: "400001",
            lat: 19.015, lng: 72.825,
            phone: "+91-22-1234-5678",
            cashless: true,
            specialties: ["Cardiology", "Orthopedics"],
            rating: 4.6,
            services: ["24/7 Emergency", "Cardiac Care", "ICU", "Diagnostics"],
            images: ["/images/h1-1.jpg", "/images/h1-2.jpg", "/images/h1-3.jpg"],
            hours: { mon: "24 hrs", tue: "24 hrs", wed: "24 hrs", thu: "24 hrs", fri: "24 hrs", sat: "24 hrs", sun: "24 hrs" },
            partners: ["Insurance A", "Insurance B", "Insurance C"],
            faq: [{ q: "Do you accept cashless claims?", a: "Yes — most major insurers. Verify at admission." }]
        },
        { id: "h-2", name: "Care & Cure Medical", address: "7 Central Ave", city: "Pune", pincode: "411001", lat: 18.5204, lng: 73.8567, phone: "+91-20-9988-7766", cashless: true, specialties: ["Maternity", "Pediatrics"], rating: 4.2, services: ["Maternity Suite", "Pediatrics"], images: [], hours: { mon: "8:00–20:00", sat: "9:00–14:00", sun: "Closed" }, partners: ["Insurance A"], faq: [] },
        { id: "h-4", name: "Lifeline Health Centre", address: "Baker Street", city: "Delhi", pincode: "110001", lat: 28.6139, lng: 77.209, phone: "+91-11-2233-4455", cashless: true, specialties: ["Emergency", "Trauma"], rating: 4.8, services: ["Trauma Center", "Radiology"], images: [], hours: { mon: "24 hrs" }, partners: ["Insurance Z"], faq: [] },
        { id: "h-6", name: "North General Hospital", address: "45 Hill Rd", city: "Mumbai", pincode: "400002", lat: 19.02, lng: 72.83, phone: "+91-22-4455-6677", cashless: true, specialties: ["ICU", "Cardiology"], rating: 4.4, services: ["ICU", "Diagnostics"], images: [], hours: { mon: "8:00–22:00" }, partners: ["Insurance A"], faq: [] },
        { id: "h-8", name: "Metro Heart Institute", address: "88 Club St", city: "Kolkata", pincode: "700001", lat: 22.5726, lng: 88.3639, phone: "+91-33-1122-3344", cashless: true, specialties: ["Cardiology"], rating: 4.7, services: ["Cath Lab", "Cardiac Rehab"], images: [], hours: { mon: "9:00–18:00" }, partners: ["Insurance Y"], faq: [] }
    ]), []);

    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        setLoading(true);
        const t = setTimeout(() => {
            const found = sampleHospitals.find(s => String(s.id) === String(id));
            if (found) { setHospital(found); setError(null); } else { setHospital(null); setError("Hospital not found"); }
            setLoading(false);
        }, 90);
        return () => clearTimeout(t);
    }, [id, sampleHospitals]);

    const toast = useCallback((msg = "Done") => {
        if (toastRef.current) toastRef.current.remove();
        const el = document.createElement("div");
        el.className = "td-toast";
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add("td-toast--visible"));
        toastRef.current = el;
        setTimeout(() => el.classList.remove("td-toast--visible"), 1000);
        setTimeout(() => el.remove(), 1600);
    }, []);

    const callHospital = useCallback((phone) => { window.location.href = `tel:${phone}`; }, []);
    const copyPhone = useCallback(async (phone) => { try { await navigator.clipboard?.writeText(phone); toast("Phone copied"); } catch { toast("Copy failed"); } }, [toast]);
    const openDirections = useCallback((h) => { const dest = encodeURIComponent(`${h.lat},${h.lng}`); window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank"); }, []);
    const shareHospital = useCallback(async (h) => { const url = `${window.location.origin}/hospitals/${encodeURIComponent(h.id)}`; try { if (navigator.share) { await navigator.share({ title: h.name, text: `${h.name}\n${h.address}`, url }); toast("Shared"); } else { await navigator.clipboard?.writeText(url); toast("Link copied"); } } catch { toast("Unable to share"); } }, [toast]);
    const exportVCard = useCallback((h) => {
        const esc = (s = "") => String(s).replace(/[,;\\n]/g, m => "\\" + m);
        const lines = [
            "BEGIN:VCARD", "VERSION:3.0",
            `FN:${esc(h.name)}`,
            `ORG:${esc("Solymus - Cashless Locator")}`,
            `TEL;TYPE=WORK,VOICE:${h.phone}`,
            `ADR;TYPE=WORK:;;${esc(h.address)};${esc(h.city)};;${esc(h.pincode)};`,
            `NOTE:${esc("Cashless: " + (h.cashless ? "Yes" : "No") + (h.services ? " • " + h.services.join(", ") : ""))}`,
            "END:VCARD"
        ].join("\r\n");
        const b = new Blob([lines], { type: "text/vcard;charset=utf-8" });
        const u = URL.createObjectURL(b);
        const a = document.createElement("a"); a.href = u; a.download = `${h.name.replace(/\s+/g, "_")}.vcf`; a.click(); URL.revokeObjectURL(u);
        toast("vCard exported");
    }, [toast]);

    const [index, setIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    useEffect(() => setIndex(0), [hospital?.id]);

    function prev() { setIndex(i => Math.max(0, i - 1)); }
    function next() { setIndex(i => { const len = (hospital?.images?.length || 0); return Math.min(len - 1, i + 1); }); }
    function openLightbox(i) { setIndex(i); setLightboxOpen(true); }
    function closeLightbox() { setLightboxOpen(false); }

    useEffect(() => {
        if (!hospital?.images?.length) return;
        let t = null;
        if ((hospital.images || []).length > 1) t = setInterval(() => setIndex(i => (i + 1) % hospital.images.length), 4500);
        return () => clearInterval(t);
    }, [hospital?.images]);

    useEffect(() => {
        function onKey(e) {
            if (!hospital) return;
            if (e.key === "ArrowLeft") { if (lightboxOpen) setIndex(i => (i - 1 + (hospital.images?.length || 1)) % (hospital.images?.length || 1)); else prev(); }
            if (e.key === "ArrowRight") { if (lightboxOpen) setIndex(i => (i + 1) % (hospital.images?.length || 1)); else next(); }
            if (e.key === "Escape") { if (lightboxOpen) closeLightbox(); else navigate(-1); }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [hospital, lightboxOpen, navigate]);

    const [apptOpen, setApptOpen] = useState(false);
    const [appt, setAppt] = useState({ name: "", phone: "", date: "", time: "" });
    function openAppt() { setAppt({ name: "", phone: "", date: "", time: "" }); setApptOpen(true); }
    function submitAppt(e) { e.preventDefault(); if (!appt.name || !appt.phone) { toast("Name & phone required"); return; } toast("Appointment requested"); setApptOpen(false); }

    const [openFaq, setOpenFaq] = useState(null);
    function toggleFaq(i) { setOpenFaq(openFaq === i ? null : i); }

    const galleryCount = hospital?.images?.length || 0;
    const servicesCount = hospital?.services?.length || 0;
    const specialtiesCount = hospital?.specialties?.length || 0;

    if (loading) {
        return (
            <div className="draper-root draper-luxury detail-page">
                <div className="draper-shell">
                    <button className="btn ghost back" onClick={() => navigate(-1)}>← Back</button>
                    <div className="skeleton-detail">
                        <div className="s-left" />
                        <div className="s-right" />
                    </div>
                </div>
            </div>
        );
    }

    if (!hospital || error === "Hospital not found") {
        return (
            <div className="draper-root draper-luxury detail-page">
                <div className="draper-shell">
                    <button className="btn ghost back" onClick={() => navigate(-1)}>← Back</button>
                    <div className="empty large">
                        <div className="empty-emoji">🔍</div>
                        <div className="empty-title">Hospital not found</div>
                        <div className="muted tiny">Check the URL or return to the Hospitals list.</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="draper-root draper-luxury detail-page">
            <div className="draper-shell">

                <header className="hero-rose" role="banner" aria-label={`${hospital.name} hero`}>
                    <div className="hero-left">
                        <div className="hero-topbar">
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button className="btn ghost back" onClick={() => navigate(-1)} aria-label="Go back">← Back</button>
                                <div className="muted tiny">Hospitals / Details</div>
                            </div>
                            <div className="hero-actions">
                                <button className="btn ghost" onClick={() => exportVCard(hospital)} aria-label="Save contact">vCard</button>
                                <button className="btn ghost" onClick={() => shareHospital(hospital)} aria-label="Share">Share</button>
                            </div>
                        </div>

                        <div className="eyebrow">CASHLESS • VERIFIED</div>
                        <h1 className="hero-title">{hospital.name}</h1>
                        <div className="hero-sub muted">{hospital.address} • {hospital.city} • {hospital.pincode}</div>

                        <div className="hero-stats">
                            <div className="stat"><div className="stat-val">{hospital.rating?.toFixed(1) ?? "—"}</div><div className="stat-label">Rating</div></div>
                            <div className="stat"><div className="stat-val">{servicesCount}</div><div className="stat-label">Services</div></div>
                            <div className="stat"><div className="stat-val">{specialtiesCount}</div><div className="stat-label">Specialties</div></div>
                            <div className="stat"><div className="stat-val">{hospital.cashless ? "Yes" : "No"}</div><div className="stat-label">Cashless</div></div>
                        </div>

                        <div className="hero-ctas">
                            <button className="btn primary" onClick={() => callHospital(hospital.phone)} aria-label="Call hospital">Call</button>
                            <button className="btn ghost" onClick={() => openDirections(hospital)} aria-label="Open directions">Directions</button>
                            <button className="btn ghost" onClick={() => exportVCard(hospital)} aria-label="Save contact">Save</button>
                            <button className="btn ghost" onClick={() => shareHospital(hospital)} aria-label="Share hospital">Share</button>
                            <button className="btn ghost" onClick={openAppt} aria-label="Request appointment">Request appt</button>
                        </div>
                    </div>

                    <div className="hero-right" aria-hidden={galleryCount === 0}>
                        <div className="gallery" aria-live="polite">
                            {galleryCount > 0 ? (
                                <>
                                    <div className="gallery-track" style={{ transform: `translateX(-${index * 100}%)` }}>
                                        {hospital.images.map((src, i) => (
                                            <div key={i} className="gallery-slide">
                                                <button className="gallery-thumb" onClick={() => openLightbox(i)} aria-label={`Open image ${i + 1}`}>
                                                    <div className="gallery-image" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02)), url(${src})` }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="gallery-controls">
                                        <button className="btn ghost" onClick={prev} aria-label="Previous image" disabled={index <= 0}>‹</button>
                                        <div className="gallery-counter" aria-hidden>{index + 1} / {galleryCount}</div>
                                        <button className="btn ghost" onClick={next} aria-label="Next image" disabled={index >= galleryCount - 1}>›</button>
                                    </div>

                                    <div className="gallery-dots">
                                        {hospital.images.map((_, i) => (
                                            <button key={i} className={`dot ${i === index ? "active" : ""}`} onClick={() => setIndex(i)} aria-label={`Go to image ${i + 1}`}></button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="gallery-empty">
                                    <div className="image-placeholder">Hospital image</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="detail-main">
                    <section className="detail-left" aria-label="Details column">
                        <div className="card">
                            <h2 className="card-title">Overview</h2>
                            <div className="p"><strong>{hospital.name}</strong> is a {hospital.specialties?.join(", ") || "multi-specialty"} facility. It provides care including {hospital.services?.slice(0, 3).join(", ")}.</div>

                            <div className="quick-meta">
                                <div className="meta-block"><div className="meta-label">Phone</div><div className="meta-value"><a className="link-strong" href={`tel:${hospital.phone}`}>{hospital.phone}</a></div></div>
                                <div className="meta-block"><div className="meta-label">Address</div><div className="meta-value muted">{hospital.address} • {hospital.city} • {hospital.pincode}</div></div>
                                <div className="meta-block"><div className="meta-label">Cashless</div><div className="meta-value">{hospital.cashless ? "Yes" : "No"}</div></div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="card-title">Operating hours</h3>
                            <table className="hours" role="table" aria-label="Operating hours">
                                <tbody>
                                    {Object.entries(hospital.hours || {}).map(([d, v]) => (
                                        <tr key={d}><td className="day">{d.charAt(0).toUpperCase() + d.slice(1)}</td><td className="val muted">{v}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card">
                            <h3 className="card-title">Services & Specialties</h3>
                            <div className="chip-row" style={{ marginBottom: 12 }}>{hospital.specialties?.map((s, i) => <span key={i} className="tag">{s}</span>)}</div>
                            <h4 style={{ marginTop: 8 }}>Available Services</h4>
                            <ul className="services">{(hospital.services || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>

                        <div className="card">
                            <h3 className="card-title">FAQ</h3>
                            <div className="faq">{(hospital.faq || []).map((f, i) => (
                                <div key={i} className="faq-item">
                                    <button className="faq-q" onClick={() => toggleFaq(i)} aria-expanded={openFaq === i}>{f.q}<span className={`faq-chev ${openFaq === i ? "open" : ""}`}>▸</span></button>
                                    <div className={`faq-a ${openFaq === i ? "open" : ""}`}>{f.a}</div>
                                </div>
                            ))}</div>
                        </div>

                        <div className="card">
                            <h3 className="card-title">Patient reviews</h3>
                            <div className="reviews">
                                {[{ id: 1, author: "A. Sharma", text: "Quick admission, efficient staff.", rating: 5 }, { id: 2, author: "P. Mehta", text: "Good ICU care. Rooms could be cleaner.", rating: 4 }].map(r => (
                                    <div key={r.id} className="review">
                                        <div className="review-head">
                                            <div className="review-author">{r.author}</div>
                                            <div className="review-rating">{Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}</div>
                                        </div>
                                        <div className="muted tiny">{r.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <aside className="detail-right" aria-label="Aside column">
                        <div className="card map-card">
                            <div className="map-head"><div className="map-title">Location</div><div className="map-tag muted">Map: integrate Mapbox/Leaflet</div></div>
                            <div className="map-viewport" role="img" aria-label="Map preview">
                                <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="fauxmap" aria-hidden><rect width="100" height="60" fill="#fff7ef" /><g transform="translate(16,6)"><g transform="translate(48,26)"><circle r="3.6" fill="#c88a06" stroke="#fff" strokeWidth="0.6" /></g></g></svg>
                            </div>
                            <div className="map-actions"><button className="btn ghost" onClick={() => openDirections(hospital)}>Open directions</button><button className="btn ghost" onClick={() => exportVCard(hospital)}>Save contact</button></div>
                        </div>

                        <div className="card contact-card">
                            <h4>Quick contacts</h4>
                            <div style={{ marginTop: 8 }}>
                                <div className="muted tiny">Phone</div>
                                <div style={{ fontWeight: 800, marginTop: 6 }}>{hospital.phone}</div>
                                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                    <button className="btn primary" onClick={() => callHospital(hospital.phone)}>Call</button>
                                    <button className="btn ghost" onClick={() => copyPhone(hospital.phone)}>Copy</button>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h4 className="card-title">Insurance partners</h4>
                            <div className="partners">{(hospital.partners || []).length ? hospital.partners.map((p, i) => <div key={i} className="partner-chip">{p}</div>) : <div className="muted tiny">No partners listed</div>}</div>
                        </div>

                        <div className="card notes"><h4>Important</h4><div className="muted tiny">Verify cashless approvals at admission. Call ahead for ETA.</div></div>
                    </aside>
                </main>

                {lightboxOpen && galleryCount > 0 && (
                    <div className="lightbox-backdrop" role="dialog" aria-modal="true" onClick={closeLightbox}>
                        <div className="lightbox" onClick={(e) => e.stopPropagation()}>
                            <button className="btn ghost lb-close" onClick={closeLightbox} aria-label="Close">✕</button>
                            <button className="btn ghost lb-prev" onClick={() => setIndex(i => (i - 1 + galleryCount) % galleryCount)} aria-label="Previous">‹</button>
                            <div className="lightbox-image" style={{ backgroundImage: `url(${hospital.images[index]})` }} />
                            <button className="btn ghost lb-next" onClick={() => setIndex(i => (i + 1) % galleryCount)} aria-label="Next">›</button>
                        </div>
                    </div>
                )}

                {apptOpen && (
                    <div className="modal-backdrop" role="dialog" aria-modal="true">
                        <div className="modal">
                            <div className="modal-head"><h3>Request appointment — {hospital.name}</h3><button className="btn ghost" onClick={() => setApptOpen(false)}>Close</button></div>
                            <form className="modal-body" onSubmit={submitAppt}>
                                <label className="label">Full name</label>
                                <input value={appt.name} onChange={(e) => setAppt(s => ({ ...s, name: e.target.value }))} placeholder="Your name" required />
                                <label className="label">Phone</label>
                                <input inputMode="tel" value={appt.phone} onChange={(e) => setAppt(s => ({ ...s, phone: e.target.value }))} placeholder="+91..." required />
                                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                    <div style={{ flex: 1 }}><label className="label">Date</label><input type="date" value={appt.date} onChange={(e) => setAppt(s => ({ ...s, date: e.target.value }))} /></div>
                                    <div style={{ width: 120 }}><label className="label">Time</label><input type="time" value={appt.time} onChange={(e) => setAppt(s => ({ ...s, time: e.target.value }))} /></div>
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button className="btn primary" type="submit">Request</button><button type="button" className="btn ghost" onClick={() => setApptOpen(false)}>Cancel</button></div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="sticky-cta" role="toolbar" aria-label="Primary actions">
                    <div className="cta-left">
                        <div className="cta-brand">
                            <div className="logo-mini">H</div>
                            <div>
                                <div className="cta-title">{hospital.name}</div>
                                <div className="muted tiny">{hospital.city} • {hospital.pincode}</div>
                            </div>
                        </div>
                    </div>
                    <div className="cta-actions">
                        <button className="btn primary cta-btn" onClick={() => callHospital(hospital.phone)}>Call</button>
                        <button className="btn ghost cta-btn" onClick={() => openDirections(hospital)}>Directions</button>
                        <button className="btn ghost cta-btn" onClick={() => exportVCard(hospital)}>Save</button>
                        <button className="btn ghost cta-btn" onClick={openAppt}>Request appt</button>
                    </div>
                </div>

                <div className="fab-group" role="toolbar" aria-label="Quick actions">
                    <button className="fab call" title="Call" onClick={() => callHospital(hospital.phone)}>📞</button>
                    <button className="fab directions" title="Directions" onClick={() => openDirections(hospital)}>🧭</button>
                    <button className="fab share" title="Share" onClick={() => shareHospital(hospital)}>🔗</button>
                </div>
            </div>
        </div>
    );
}
