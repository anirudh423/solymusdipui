import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/blogs.css";

function fmtDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

function parseISODate(s) {
    return s ? new Date(s) : null;
}

export default function BlogsPage() {
    const samplePosts = useMemo(
        () => [
            {
                id: "p-1",
                title: "Designing for Trust: The New Luxury of Care",
                excerpt:
                    "How thoughtful details and service rituals redefine premium experiences.",
                category: "Design",
                tags: ["ux", "branding", "service"],
                publishedAt: "2025-10-07",
                author: "A. Kapoor",
                readingTime: "6 min",
            },
            {
                id: "p-2",
                title: "Modern Branches: Mapping Human-Centered Locations",
                excerpt:
                    "A case study on spatial design and wayfinding for premium branches.",
                category: "Product",
                tags: ["maps", "architecture"],
                publishedAt: "2025-09-15",
                author: "S. Rao",
                readingTime: "8 min",
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
            },
        ],
        []
    );

    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [selectedTags, setSelectedTags] = useState([]);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid");
    const [page, setPage] = useState(1);

    const perPage = 6;

    const categories = useMemo(
        () => ["All", ...Array.from(new Set(samplePosts.map((p) => p.category)))],
        [samplePosts]
    );
    const tags = useMemo(
        () => ["All", ...Array.from(new Set(samplePosts.flatMap((p) => p.tags)))],
        [samplePosts]
    );

    const filtered = useMemo(() => {
        let list = samplePosts.slice();
        const q = query.toLowerCase();
        if (category !== "All") list = list.filter((p) => p.category === category);
        if (selectedTags.length)
            list = list.filter((p) => selectedTags.every((t) => p.tags.includes(t)));
        if (q)
            list = list.filter((p) =>
                (p.title + " " + p.excerpt + " " + p.tags.join(" ")).toLowerCase().includes(q)
            );
        if (dateFrom) {
            const d = parseISODate(dateFrom);
            if (d) list = list.filter((p) => new Date(p.publishedAt) >= d);
        }
        if (dateTo) {
            const d = parseISODate(dateTo);
            if (d) list = list.filter((p) => new Date(p.publishedAt) <= d);
        }
        if (sortBy === "newest")
            list = list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        if (sortBy === "oldest")
            list = list.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
        if (sortBy === "alpha") list = list.sort((a, b) => a.title.localeCompare(b.title));
        return list;
    }, [samplePosts, query, category, selectedTags, dateFrom, dateTo, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paged = useMemo(
        () => filtered.slice((page - 1) * perPage, page * perPage),
        [filtered, page]
    );

    const toggleTag = useCallback((t) => {
        setSelectedTags((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
        );
    }, []);

    const clearFilters = useCallback(() => {
        setQuery("");
        setCategory("All");
        setSelectedTags([]);
        setDateFrom("");
        setDateTo("");
        setSortBy("newest");
    }, []);

    return (
        <div className="blogs-root">
            <div className="blogs-shell">
                <header className="page-hero">
                    <div className="hero-left">
                        <Link to={'/'}>Back</Link>
                        <h1>Thoughtful Writing on Design, Ops & Product</h1>
                        <p className="hero-sub">
                            A carefully curated collection — stories about service, design, and
                            leadership.
                        </p>

                        <div className="controls">
                            <div className="search-bar">
                                <input
                                    placeholder="Search by title, excerpt, or tag..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            <button
                                className="btn ghost"
                                onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
                            >
                                {viewMode === "grid" ? "Grid View" : "List View"}
                            </button>

                            <button className="btn ghost" onClick={clearFilters}>
                                Reset
                            </button>
                        </div>
                    </div>
                </header>

                <main className="blogs-main">
                    <div className="filters-top">
                        <select
                            className="sort-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <div className="filter-row">
                            {tags.slice(1).map((t) => (
                                <button
                                    key={t}
                                    className={`tag-chip ${selectedTags.includes(t) ? "selected" : ""
                                        }`}
                                    onClick={() => toggleTag(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="date-row">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>

                        <select
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="alpha">A → Z</option>
                        </select>
                    </div>

                    {paged.length === 0 ? (
                        <div className="empty-state">
                            No articles match your filters. Try resetting or broadening your search.
                        </div>
                    ) : (
                        <div className={`blog-grid ${viewMode}`}>
                            {paged.map((p) => (
                                <article key={p.id} className="blog-card">
                                    <div className="blog-cover">
                                        <svg viewBox="0 0 600 320">
                                            <rect width="600" height="320" fill="#fff8f0" />
                                            <text
                                                x="24"
                                                y="60"
                                                fontSize="28"
                                                fill="#c88a06"
                                                fontFamily="Playfair Display"
                                            >
                                                {p.category}
                                            </text>
                                        </svg>
                                    </div>
                                    <h3 className="blog-title">{p.title}</h3>
                                    <p className="blog-excerpt">{p.excerpt}</p>
                                    <div className="blog-meta">
                                        <span>{fmtDate(p.publishedAt)}</span>
                                        <span>{p.readingTime}</span>
                                    </div>
                                    <div className="blog-tags">
                                        {p.tags.map((t) => (
                                            <span key={t} className="tag-chip">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    <Link to={`/blogs/p-1`} className="btn primary">
                                        Read
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}

                    {filtered.length > perPage && (
                        <div className="pager">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </main>

                <aside className="side-column">
                    <div className="snap-card">
                        <h4>Filters Snapshot</h4>
                        <p>
                            <strong>Category:</strong> {category}
                        </p>
                        <p>
                            <strong>Tags:</strong>{" "}
                            {selectedTags.length ? selectedTags.join(", ") : "All"}
                        </p>
                        <p>
                            <strong>Date:</strong> {dateFrom || "Any"} → {dateTo || "Any"}
                        </p>
                    </div>

                    <div className="snap-card">
                        <h4>Popular Tags</h4>
                        <div className="chip-row">
                            {tags.slice(1, 8).map((t) => (
                                <button
                                    key={t}
                                    className={`tag-chip ${selectedTags.includes(t) ? "selected" : ""
                                        }`}
                                    onClick={() => toggleTag(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="snap-card">
                        <h4>About This Feed</h4>
                        <p className="muted">
                            Curated insights updated periodically. Subscribe to get new posts.
                        </p>
                        <input
                            className="date-input"
                            placeholder="your@email.com"
                            type="email"
                        />
                        <button className="btn primary">Subscribe</button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
