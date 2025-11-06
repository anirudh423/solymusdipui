import React, { useState, useMemo } from "react";
import "../styles/insurers.css";
import { Link } from "react-router-dom";

const insurersData = [
  {
    id: "ins-1",
    name: "LifeGuard Assurance",
    logo: "LG",
    category: "Life",
    products: ["Term Life", "Whole Life", "Child Plans", "Pension Plans"],
    rating: 4.8,
    claims: 98.2,
    specialties: ["Quick claim settlement", "Affordable premiums", "Flexible terms"],
    claimForms: [
      { name: "Death Claim Form", url: "#" },
      { name: "Maturity Claim Form", url: "#" },
      { name: "Surrender Form", url: "#" }
    ],
    productLinks: [
      { name: "Term Insurance Plans", url: "#" },
      { name: "Investment Plans", url: "#" },
      { name: "Riders & Add-ons", url: "#" }
    ],
    contact: { phone: "1800-123-4567", email: "support@lifeguard.com" },
    color: "#4a90e2"
  },
  {
    id: "ins-2",
    name: "SecureHealth Plus",
    logo: "SH",
    category: "Health",
    products: ["Individual Health", "Family Floater", "Critical Illness", "Senior Citizen"],
    rating: 4.9,
    claims: 99.1,
    specialties: ["Cashless hospitals: 8,000+", "No claim bonus", "Instant e-card"],
    claimForms: [
      { name: "Cashless Pre-Auth Form", url: "#" },
      { name: "Reimbursement Claim Form", url: "#" },
      { name: "Grievance Form", url: "#" }
    ],
    productLinks: [
      { name: "Individual Plans", url: "#" },
      { name: "Family Plans", url: "#" },
      { name: "Top-up Plans", url: "#" }
    ],
    contact: { phone: "1800-234-5678", email: "care@securehealth.com" },
    color: "#27ae60"
  },
  {
    id: "ins-3",
    name: "AutoShield Insurance",
    logo: "AS",
    category: "Motor",
    products: ["Car Insurance", "Bike Insurance", "Commercial Vehicle"],
    rating: 4.7,
    claims: 97.5,
    specialties: ["24/7 roadside assistance", "Zero depreciation cover", "Online renewal"],
    claimForms: [
      { name: "Own Damage Claim Form", url: "#" },
      { name: "Third Party Claim Form", url: "#" },
      { name: "Survey Report Form", url: "#" }
    ],
    productLinks: [
      { name: "Car Insurance", url: "#" },
      { name: "Two Wheeler Insurance", url: "#" },
      { name: "Add-on Covers", url: "#" }
    ],
    contact: { phone: "1800-345-6789", email: "claims@autoshield.com" },
    color: "#e67e22"
  },
  {
    id: "ins-4",
    name: "PropertyPro Insurance",
    logo: "PP",
    category: "Property",
    products: ["Home Insurance", "Fire Insurance", "Tenant Insurance"],
    rating: 4.6,
    claims: 96.8,
    specialties: ["Coverage up to ₹5 Cr", "Natural calamity cover", "Contents protection"],
    claimForms: [
      { name: "Property Damage Claim", url: "#" },
      { name: "Theft Claim Form", url: "#" },
      { name: "Fire Incident Form", url: "#" }
    ],
    productLinks: [
      { name: "Home Insurance", url: "#" },
      { name: "Fire & Allied Perils", url: "#" },
      { name: "Jewellery Insurance", url: "#" }
    ],
    contact: { phone: "1800-456-7890", email: "support@propertypro.com" },
    color: "#9b59b6"
  },
  {
    id: "ins-5",
    name: "TravelSafe Global",
    logo: "TS",
    category: "Travel",
    products: ["Domestic Travel", "International Travel", "Student Travel", "Senior Citizen"],
    rating: 4.8,
    claims: 98.5,
    specialties: ["Global coverage", "COVID-19 protection", "Adventure sports cover"],
    claimForms: [
      { name: "Medical Emergency Claim", url: "#" },
      { name: "Baggage Loss Claim", url: "#" },
      { name: "Trip Cancellation Form", url: "#" }
    ],
    productLinks: [
      { name: "International Plans", url: "#" },
      { name: "Domestic Plans", url: "#" },
      { name: "Annual Multi-trip", url: "#" }
    ],
    contact: { phone: "1800-567-8901", email: "help@travelsafe.com" },
    color: "#16a085"
  },
  {
    id: "ins-6",
    name: "WealthProtect Corp",
    logo: "WP",
    category: "Investment",
    products: ["ULIP Plans", "Guaranteed Returns", "Retirement Plans", "Child Education"],
    rating: 4.7,
    claims: 97.9,
    specialties: ["Tax benefits u/s 80C", "Fund switching", "Partial withdrawals"],
    claimForms: [
      { name: "Maturity Claim Form", url: "#" },
      { name: "Partial Withdrawal Form", url: "#" },
      { name: "Fund Switch Form", url: "#" }
    ],
    productLinks: [
      { name: "ULIP Plans", url: "#" },
      { name: "Pension Plans", url: "#" },
      { name: "Child Plans", url: "#" }
    ],
    contact: { phone: "1800-678-9012", email: "invest@wealthprotect.com" },
    color: "#c88a06"
  }
];

const categories = ["All", "Life", "Health", "Motor", "Property", "Travel", "Investment"];

function InsurersPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [expandedCard, setExpandedCard] = useState(null);

  const filteredInsurers = useMemo(() => {
    let results = insurersData;

    if (selectedCategory !== "All") {
      results = results.filter(ins => ins.category === selectedCategory);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      results = results.filter(ins =>
        ins.name.toLowerCase().includes(query) ||
        ins.products.some(p => p.toLowerCase().includes(query)) ||
        ins.specialties.some(s => s.toLowerCase().includes(query))
      );
    }

    if (sortBy === "rating") {
      results = results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "claims") {
      results = results.sort((a, b) => b.claims - a.claims);
    } else if (sortBy === "name") {
      results = results.sort((a, b) => a.name.localeCompare(b.name));
    }

    return results;
  }, [search, selectedCategory, sortBy]);

  const downloadForm = (insurerName, formName) => {
    alert(`Downloading ${formName} from ${insurerName}...`);
  };

  return (
    <div className="insurers-root">
      <div className="insurers-container">
        <header className="insurers-hero">
          <div className="hero-content">
            <h1 className="hero-title">Insurance Directory</h1>
            <p className="hero-subtitle">
              Curated partners with verified claim settlement records. Download forms, explore products, and connect instantly.
            </p>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{insurersData.length}</div>
              <div className="stat-label">Partner Insurers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">98.2%</div>
              <div className="stat-label">Avg. Claim Ratio</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support Available</div>
            </div>
          </div>
        </header>

        <div className="controls-bar">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search insurers, products, or specialties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="rating">Sort by Rating</option>
              <option value="claims">Sort by Claims %</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        <div className="categories-row">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredInsurers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No insurers found</h3>
            <p className="muted">Try adjusting your search or filters</p>
            <button className="btn-primary" onClick={() => { setSearch(""); setSelectedCategory("All"); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="insurers-grid">
            {filteredInsurers.map(insurer => (
              <div key={insurer.id} className="insurer-card">
                <div className="card-header">
                  <div className="logo-badge" style={{ background: `linear-gradient(135deg, ${insurer.color}, ${insurer.color}dd)` }}>
                    {insurer.logo}
                  </div>
                  <div className="header-info">
                    <h3 className="insurer-name">{insurer.name}</h3>
                    <span className="category-tag">{insurer.category} Insurance</span>
                  </div>
                </div>

                <div className="metrics-row">
                  <div className="metric">
                    <div className="metric-value">⭐ {insurer.rating}</div>
                    <div className="metric-label">Rating</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value">{insurer.claims}%</div>
                    <div className="metric-label">Claim Ratio</div>
                  </div>
                </div>

                <div className="products-section">
                  <h4 className="section-title">Products</h4>
                  <div className="products-tags">
                    {insurer.products.map((prod, idx) => (
                      <span key={idx} className="product-tag">{prod}</span>
                    ))}
                  </div>
                </div>

                <div className="specialties-section">
                  <h4 className="section-title">Key Features</h4>
                  <ul className="specialties-list">
                    {insurer.specialties.map((spec, idx) => (
                      <li key={idx}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="expandable-section">
                  <button
                    className="expand-btn"
                    onClick={() => setExpandedCard(expandedCard === insurer.id ? null : insurer.id)}
                  >
                    {expandedCard === insurer.id ? "Show less" : "View claim forms & links"}
                    <svg
                      className={`expand-icon ${expandedCard === insurer.id ? "rotate" : ""}`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {expandedCard === insurer.id && (
                    <div className="expanded-content">
                      <div className="forms-section">
                        <h5 className="subsection-title">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="5" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          Claim Forms
                        </h5>
                        <div className="forms-list">
                          {insurer.claimForms.map((form, idx) => (
                            <button
                              key={idx}
                              className="form-download-btn"
                              onClick={() => downloadForm(insurer.name, form.name)}
                            >
                              <span>{form.name}</span>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v9m0 0L5 8m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="links-section">
                        <h5 className="subsection-title">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6.5 9.5l3-3M10 6.5L9 8.5m-3-3L5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="5" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          Product Links
                        </h5>
                        <div className="links-list">
                          {insurer.productLinks.map((link, idx) => (
                            <a key={idx} href={link.url} className="product-link">
                              {link.name}
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 11L11 3m0 0H5m6 0v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="contact-section">
                        <h5 className="subsection-title">Contact</h5>
                        <div className="contact-info">
                          <a href={`tel:${insurer.contact.phone}`} className="contact-link">
                            📞 {insurer.contact.phone}
                          </a>
                          <a href={`mailto:${insurer.contact.email}`} className="contact-link">
                            ✉️ {insurer.contact.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <Link to={'/quote-summary'} className="btn-primary">Get Quote</Link>
                  <button className="btn-secondary">Compare</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InsurersPage;