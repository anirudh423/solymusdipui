import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "../styles/blog-single.css";

function slugify(str = "") {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function fmtDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return iso;
    }
}
function estimateReadTime(content, explicit) {
    if (explicit) return explicit;
    if (!content) return "5 min";
    const words = content.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min`;
}


const samplePosts = [
    {
        id: "p-1",
        title: "Designing for Trust: The New Luxury of Care",
        excerpt: "How thoughtful details and service rituals redefine premium experiences.",
        category: "Design",
        tags: ["ux", "branding", "service"],
        publishedAt: "2025-10-07",
        author: "A. Kapoor",
        readingTime: "6 min",
        content: `<p>Trust is not a checklist. It's a tapestry of small moments — language, light, and follow-through. In premium care settings, these small moments add up to a feeling of being known and protected.</p>
    <h2>Service rituals</h2>
    <p>Rituals frame expectations. Exhaustive details matter — from greeting scripts to handoff patterns between staff.</p>
    <blockquote>Hospitality is not an act; it's a condition.</blockquote>
    <h3>Language & microcopy</h3>
    <p>The words you choose before and after an appointment can reduce friction and build calm.</p>
    <p>... (full article content would go here)</p>`
    },
    {
        id: "p-2",
        title: "Modern Branches: Mapping Human-Centered Locations",
        excerpt: "A case study on spatial design and wayfinding for premium branches.",
        category: "Product",
        tags: ["maps", "architecture"],
        publishedAt: "2025-09-15",
        author: "S. Rao",
        readingTime: "8 min",
        content: `<p>Branches are more than addresses; they are curated moments of brand experience.</p><h2>Wayfinding</h2><p>... (article body)</p>`
    },
    {
        id: "p-3",
        title: "Service Ops: Balancing Efficiency & Warmth",
        excerpt: "Operational patterns that scale without losing hospitality.",
        category: "Operations",
        tags: ["service", "ops"],
        publishedAt: "2025-11-01",
        author: "M. Singh",
        readingTime: "5 min",
        content: `<p>Operational excellence and warmth are not mutually exclusive. Start with role clarity.</p>`
    },
    {
        id: "p-4",
        title: "The Little Things: Microcopy that Reassures",
        excerpt: "Why small language choices change trust and conversion.",
        category: "Content",
        tags: ["copy", "ux"],
        publishedAt: "2025-08-02",
        author: "L. Mehta",
        readingTime: "4 min",
        content: `<p>Microcopy is often the handshake between user and brand; a gentle tone reassures.</p>`
    }
];

export default function BlogPostPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const articleRef = useRef(null);
    const sharePopRef = useRef(null);

    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(0);
    const [shareOpen, setShareOpen] = useState(false);
    const [clapAnim, setClapAnim] = useState(false);
    const [saveAnim, setSaveAnim] = useState(false);
    const [activeId, setActiveId] = useState(null);

    const [claps, setClaps] = useState(() => {
        try { const raw = localStorage.getItem("blog_claps_v3"); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
    });
    const addClap = useCallback((postId) => {
        setClaps(prev => {
            const next = { ...prev, [postId]: (prev[postId] || 0) + 1 };
            try { localStorage.setItem("blog_claps_v3", JSON.stringify(next)); } catch { }
            return next;
        });
        setClapAnim(true);
        setTimeout(() => setClapAnim(false), 650);
    }, []);

    const [saved, setSaved] = useState(() => {
        try { const raw = localStorage.getItem("blog_saved_v3"); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
    });
    const toggleSave = useCallback((postId) => {
        setSaved(prev => {
            const next = { ...prev, [postId]: !prev[postId] };
            try { localStorage.setItem("blog_saved_v3", JSON.stringify(next)); } catch { }
            return next;
        });
        setSaveAnim(true);
        setTimeout(() => setSaveAnim(false), 600);
    }, []);

    const postsWithSlugs = useMemo(() => samplePosts.map(p => ({ ...p, slug: p.id.startsWith("p-") ? slugify(p.title) : slugify(p.id) })), []);
    const post = useMemo(() => postsWithSlugs.find(p => p.slug === slug) || null, [postsWithSlugs, slug]);

    useEffect(() => {
        if (!post) {
            const byId = samplePosts.find(s => s.id === slug);
            if (byId) navigate(`/blogs/${slugify(byId.title)}`, { replace: true });
        }
    }, [post, slug, navigate]);

    const processedHTML = useMemo(() => {
        if (!post || typeof window === "undefined") return post?.content || "";
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(post.content, "text/html");
            const headings = doc.querySelectorAll("h2, h3");
            headings.forEach((h, i) => {
                if (!h.id) h.id = slugify(h.textContent || `heading-${i}`);
                const anchor = doc.createElement("a");
                anchor.className = "heading-anchor";
                anchor.href = `#${h.id}`;
                anchor.innerHTML = "¶";
                anchor.setAttribute("aria-hidden", "true");
                h.appendChild(anchor);
            });
            const p0 = doc.querySelector("p");
            if (p0) p0.classList.add("dropcap");
            doc.querySelectorAll("blockquote").forEach(bq => bq.classList.add("pullquote"));
            return doc.body.innerHTML;
        } catch {
            return post.content;
        }
    }, [post]);

    const toc = useMemo(() => {
        if (!processedHTML || typeof window === "undefined") return [];
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(processedHTML, "text/html");
            const nodes = Array.from(doc.querySelectorAll("h2, h3"));
            return nodes.map(n => ({ id: n.id, text: n.textContent.replace("¶", "").trim(), tag: n.tagName.toLowerCase() }));
        } catch {
            return [];
        }
    }, [processedHTML]);

    const related = useMemo(() => {
        if (!post) return [];
        const others = postsWithSlugs.filter(p => p.id !== post.id);
        const scored = others.map(p => {
            const tagOverlap = (p.tags || []).filter(t => (post.tags || []).includes(t)).length || 0;
            const sameCategory = p.category === post.category ? 1 : 0;
            return { p, score: tagOverlap * 3 + sameCategory };
        }).sort((a, b) => b.score - a.score || new Date(b.p.publishedAt) - new Date(a.p.publishedAt));
        return scored.slice(0, 3).map(s => s.p);
    }, [post, postsWithSlugs]);

    const { prevPost, nextPost } = useMemo(() => {
        const ordered = postsWithSlugs
            .filter(Boolean)
            .slice()
            .sort((a, b) => {
                const ta = a && a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const tb = b && b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return ta - tb;
            });

        const idx = ordered.findIndex((p) => p.id === post?.id);
        return {
            prevPost: idx > 0 ? ordered[idx - 1] : null,
            nextPost: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
        };
    }, [postsWithSlugs, post]);


    const shareUrl = typeof window !== "undefined" ? window.location.href : `https://your-site.example/blogs/${slug}`;
    const pageTitle = post ? `${post.title} — Thoughtful Writing` : "Article not found";

    const shareTo = useCallback((provider) => {
        if (!post) return;
        const url = encodeURIComponent(shareUrl);
        const text = encodeURIComponent(`${post.title} — ${post.excerpt || ""}`);
        let shareLink = "";
        if (provider === "twitter") shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        else if (provider === "linkedin") shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        else if (provider === "whatsapp") shareLink = `https://wa.me/?text=${text}%20${url}`;
        else if (provider === "mail") shareLink = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(post.excerpt + "\n\n" + shareUrl)}`;
        window.open(shareLink, "_blank", "noopener,noreferrer,width=700,height=500");
        setShareOpen(false);
    }, [post, shareUrl]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            setShareOpen(false);
        } catch {
            setCopied(false);
        }
    }, [shareUrl]);

    const printPage = useCallback(() => { if (typeof window !== "undefined") window.print(); }, []);

    useEffect(() => {
        function onKey(e) { if (e.key === "Escape") setShareOpen(false); }
        function onDocClick(e) { if (shareOpen && sharePopRef.current && !sharePopRef.current.contains(e.target)) setShareOpen(false); }
        document.addEventListener("keydown", onKey);
        document.addEventListener("click", onDocClick);
        return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onDocClick); };
    }, [shareOpen]);

    useEffect(() => {
        const el = articleRef.current;
        if (!el) return;
        const onScroll = () => {
            const rect = el.getBoundingClientRect();
            const winH = window.innerHeight || document.documentElement.clientHeight;
            const articleHeight = Math.max(el.scrollHeight, rect.height);
            const top = Math.min(Math.max(0, -rect.top), articleHeight);
            const pct = Math.min(100, Math.round((top / Math.max(1, articleHeight - winH)) * 100));
            setProgress(isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct)));
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
    }, [post, processedHTML]);

    useEffect(() => {
        if (!articleRef.current) return;
        const root = document;
        const headingEls = Array.from(articleRef.current.querySelectorAll("h2[id], h3[id]"));
        if (!headingEls.length) return;
        const observer = new IntersectionObserver(entries => {
            const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visible.length) {
                setActiveId(visible[0].target.id);
            }
        }, { root: null, rootMargin: "0px 0px -40% 0px", threshold: [0.15, 0.4, 0.7] });
        headingEls.forEach(h => observer.observe(h));
        return () => observer.disconnect();
    }, [processedHTML]);

    if (!post) {
        return (
            <div className="blog-single-root missing">
                <div className="centered card">
                    <h2>Article not found</h2>
                    <p className="muted">We couldn't find that post. Try browsing the feed instead.</p>
                    <Link to="/blogs" className="btn ghost">Back to blog</Link>
                </div>
            </div>
        );
    }

    const readTime = estimateReadTime(post.content, post.readingTime);
    const wordCount = post.content.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+/).length;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        author: { "@type": "Person", name: post.author || "Editorial" },
        datePublished: post.publishedAt,
        mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
        publisher: { "@type": "Organization", name: "Your Brand" }
    };

    return (
        <div className="blog-single-root lux-true">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={post.excerpt} />
                <meta name="author" content={post.author} />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
                <meta property="og:url" content={shareUrl} />
                <meta property="article:published_time" content={post.publishedAt} />
                <meta property="article:author" content={post.author} />
                <meta name="twitter:card" content="summary_large_image" />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Helmet>

            <div className="reading-progress" style={{ width: `${progress}%` }} aria-hidden />

            <main className="page container">
                <header className="hero hero--lux card-hero" role="banner">
                    <div className="hero-left">
                        <div className="hero-top">
                            <Link to="/blogs" className="btn back subtle">← Back</Link>
                            <div className="meta-badges">
                                <span className="category-badge">{post.category}</span>
                                <span className="read-badge">{readTime}</span>
                            </div>
                        </div>

                        <h1 className="hero-title">{post.title}</h1>
                        <p className="hero-sub">{post.excerpt}</p>

                        <div className="hero-meta">
                            <div className="author">
                                <div className="avatar">{String(post.author || "E").split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                <div>
                                    <div className="author-name">{post.author}</div>
                                    <div className="meta-sub muted">{fmtDate(post.publishedAt)} • {wordCount} words</div>
                                </div>
                            </div>

                            <div className="hero-actions">
                                <div className="share-inline" ref={sharePopRef}>
                                    <button className="btn ghost small" onClick={() => shareTo("twitter")} aria-label="Share to Twitter">Twitter</button>
                                    <button className="btn ghost small" onClick={() => shareTo("linkedin")} aria-label="Share to LinkedIn">LinkedIn</button>
                                    <button className="btn ghost small" onClick={() => setShareOpen(s => !s)} aria-expanded={shareOpen} aria-controls="share-pop" aria-haspopup="dialog">More</button>

                                    <div id="share-pop" className={`share-pop ${shareOpen ? "open" : ""}`} role="dialog" aria-hidden={!shareOpen}>
                                        <button onClick={() => shareTo("whatsapp")} className="pop-item">WhatsApp</button>
                                        <button onClick={() => shareTo("mail")} className="pop-item">Email</button>
                                        <button onClick={copyLink} className="pop-item">{copied ? "Copied" : "Copy link"}</button>
                                        <button onClick={printPage} className="pop-item">Print → PDF</button>
                                        <button onClick={() => { toggleSave(post.id); }} className="pop-item">{saved[post.id] ? "Remove Save" : "Save for later"}</button>
                                    </div>
                                </div>

                                <div className="cta-clap">
                                    <button
                                        className={`btn primary small clap-btn ${clapAnim ? "pulse" : ""}`}
                                        onClick={() => addClap(post.id)}
                                        aria-label="Appreciate article"
                                        title="Appreciate"
                                    >
                                        👏 {claps[post.id] || 0}
                                    </button>

                                    <button
                                        className={`btn ghost small save-btn ${saved[post.id] ? "saved" : ""} ${saveAnim ? "pop" : ""}`}
                                        onClick={() => toggleSave(post.id)}
                                        aria-pressed={!!saved[post.id]}
                                        title={saved[post.id] ? "Saved" : "Save for later"}
                                    >
                                        {saved[post.id] ? "Saved" : "Save"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="tag-row">
                            {post.tags.map(t => <Link key={t} to={`/blogs?tag=${encodeURIComponent(t)}`} className="tag-chip">{t}</Link>)}
                        </div>
                    </div>

                    <div className="hero-right" aria-hidden>
                        <div className="cover-portrait">
                            <svg viewBox="0 0 640 360" className="cover-svg" role="img" aria-label={post.category}>
                                <defs>
                                    <linearGradient id="lg2" x1="0" x2="1">
                                        <stop offset="0" stopColor="#f8e9c9" />
                                        <stop offset="1" stopColor="#fff7ef" />
                                    </linearGradient>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#lg2)" />
                                <text x="28" y="56" fontFamily="Playfair Display" fontSize="28" fill="#c88a06">{post.category}</text>
                                <text x="28" y="118" fontFamily="Inter" fontSize="13" fill="#6b6b6b">{fmtDate(post.publishedAt)} • {readTime}</text>
                            </svg>
                        </div>

                        <div className="share-rail" aria-hidden>
                            <div className="rail-progress" title={`${progress}% read`} aria-hidden>
                                <svg viewBox="0 0 36 36" className="progress-ring" aria-hidden>
                                    <path className="ring-bg" d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32z" />
                                    <path className="ring" strokeDasharray={`${Math.max(0, Math.min(100, progress))},100`} d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32z" />
                                </svg>
                                <div className="rail-percent">{progress}%</div>
                            </div>

                            <button onClick={() => shareTo("twitter")} className="rail-btn" title="Share to Twitter">T</button>
                            <button onClick={() => shareTo("linkedin")} className="rail-btn" title="Share to LinkedIn">in</button>
                            <button onClick={() => shareTo("whatsapp")} className="rail-btn" title="Share to WhatsApp">W</button>
                            <button onClick={copyLink} className="rail-btn" title="Copy link">{copied ? "✓" : "⧉"}</button>
                        </div>
                    </div>
                </header>

                <div className="layout">
                    <article className="article card" ref={articleRef}>
                        <div className="article-content" dangerouslySetInnerHTML={{ __html: processedHTML }} />

                        <div className="article-footer">
                            <div className="author-block">
                                <div className="avatar large">{String(post.author || "E").split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                <div>
                                    <div className="author-name">{post.author}</div>
                                    <p className="muted">Author & contributor</p>
                                </div>
                            </div>

                            <div className="article-ctas">
                                <Link to="/blogs" className="btn ghost">Back to feed</Link>
                                <div className="share-inline">
                                    <button className="btn primary" onClick={() => shareTo("twitter")}>Share</button>
                                    <button className="btn ghost" onClick={printPage}>Print</button>
                                </div>
                            </div>
                        </div>

                        <nav className="nav-articles" aria-label="Next & previous articles">
                            {prevPost && <Link to={`/blogs/${prevPost.slug}`} className="nav-prev"><small>Previous</small><div className="nav-title">← {prevPost.title}</div></Link>}
                            {nextPost && <Link to={`/blogs/${nextPost.slug}`} className="nav-next"><small>Next</small><div className="nav-title">{nextPost.title} →</div></Link>}
                        </nav>

                        <div className="newsletter-cta">
                            <div>
                                <h4>Essays & Notes</h4>
                                <p className="muted">Short letters about craft and design. No spam.</p>
                            </div>
                            <div className="subscribe-row">
                                <input className="date-input" placeholder="your@email.com" type="email" />
                                <button className="btn primary">Subscribe</button>
                            </div>
                        </div>

                        <div className="comments card">
                            <h4>Comments</h4>
                            <p className="muted">Comments are disabled here — add your provider (Disqus/Commento/etc.)</p>
                        </div>
                    </article>

                    <aside className="aside" aria-labelledby="toc-title">
                        <div className="toc card">
                            <h4 id="toc-title">On this page</h4>
                            {toc.length ? (
                                <nav>
                                    <ul>
                                        {toc.map(t => (
                                            <li key={t.id} className={`toc-item ${t.tag} ${activeId === t.id ? "active" : ""}`}>
                                                <a
                                                    href={`#${t.id}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const el = document.getElementById(t.id);
                                                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                                    }}
                                                >
                                                    {t.text}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            ) : <p className="muted">No sections</p>}
                        </div>

                        <div className="card related">
                            <h4>Related</h4>
                            <div className="related-list">
                                {related.length ? related.map(r => (
                                    <Link key={r.id} to={`/blogs/${r.slug}`} className="related-row">
                                        <div>
                                            <div className="r-title">{r.title}</div>
                                            <div className="muted small">{fmtDate(r.publishedAt)} • {estimateReadTime(r.content, r.readingTime)}</div>
                                        </div>
                                        <div className="r-badge">{r.category}</div>
                                    </Link>
                                )) : <p className="muted">No related posts</p>}
                            </div>
                        </div>

                        <div className="card subscribe-sticky">
                            <h4>Stay in the loop</h4>
                            <p className="muted">Short notes & essays once a month.</p>
                            <div className="subscribe-row">
                                <input className="date-input" placeholder="your@email.com" type="email" />
                                <button className="btn primary">Subscribe</button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <button className="fab" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">↑</button>
        </div>
    );
}
