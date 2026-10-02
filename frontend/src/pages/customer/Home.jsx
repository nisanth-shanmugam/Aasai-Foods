import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import Navbar from "./Navbar";
import "./customer.css";

// Category list matching design
const DEMO_CATEGORIES = [
  {
    id: "cat-1",
    name: "Health Mix & Millets",
    active: true,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round"/>
        <path d="M12 4l3 3M12 8l-3 3M12 12l3 3M12 16l-3 3"/>
      </svg>
    ),
  },
  {
    id: "cat-2",
    name: "Masala Products",
    active: false,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a4 4 0 0 0-4 4c0 6 8 16 8 16s8-10 8-16a4 4 0 0 0-4-4c-2 0-3 1-4 2-1-1-2-2-4-2z" fill="#ef4444"/>
      </svg>
    ),
  },
  {
    id: "cat-3",
    name: "Soup Varieties",
    active: false,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
        <path d="M4 11h16v3a8 8 0 0 1-16 0v-3z"/>
        <path d="M6 19h12M9 4c0 2-1 3-1 5M12 4c0 2-1 3-1 5M15 4c0 2-1 3-1 5"/>
      </svg>
    ),
  },
  {
    id: "cat-4",
    name: "Traditional Rice",
    active: false,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v10M8 12h8"/>
      </svg>
    ),
  },
  {
    id: "cat-5",
    name: "Pickles",
    active: false,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8">
        <rect x="6" y="8" width="12" height="13" rx="2"/>
        <path d="M8 5h8v3H8zM10 2h4v3h-4z"/>
      </svg>
    ),
  },
];

// Popular products items matching screenshot
const DEMO_PRODUCTS = [
  {
    id: "p1",
    name: "Ragi Health Mix",
    weight: "500g · Millet blend",
    price: 180,
    originalPrice: 220,
    badge: "Best seller",
    illustration: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v18M12 4c3 2 5 5 5 8s-2 6-5 8M12 4c-3 2-5 5-5 8s2 6 5 8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="2" fill="#f59e0b"/>
      </svg>
    ),
  },
  {
    id: "p2",
    name: "Kodo Millet",
    weight: "1kg · Whole grain",
    price: 135,
    originalPrice: 160,
    badge: "Organic",
    illustration: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="none"/>
        <path d="M12 3c-4.97 0-9 4.03-9 9 0 4.5 3.3 8.2 7.7 8.9L12 12V3z" fill="#22c55e"/>
        <path d="M12 12l1.3 8.9c4.4-.7 7.7-4.4 7.7-8.9 0-4.97-4.03-9-9-9v9z" fill="#16a34a"/>
      </svg>
    ),
  },
  {
    id: "p3",
    name: "Sambar Masala",
    weight: "200g · Ground spice",
    price: 95,
    originalPrice: 120,
    badge: "New",
    illustration: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a4 4 0 0 0-4 4c0 6 8 16 8 16s8-10 8-16a4 4 0 0 0-4-4c-2 0-3 1-4 2-1-1-2-2-4-2z" fill="#ef4444"/>
      </svg>
    ),
  },
  {
    id: "p4",
    name: "Mango Pickle",
    weight: "300g · Traditional",
    price: 120,
    originalPrice: 150,
    badge: null,
    illustration: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <rect x="6" y="8" width="12" height="13" rx="3" fill="#374151" stroke="#9ca3af" strokeWidth="1.5"/>
        <path d="M8 5h8v3H8z" fill="#4b5563"/>
        <path d="M10 2h4v3h-4z" fill="#6b7280"/>
      </svg>
    ),
  },
];

export default function Home() {
  const { addToCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const { products } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState("Health Mix & Millets");

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 120);
    }
  }, [location]);

  // Combine real store products or default demo products if needed
  const displayProducts = products && products.length >= 4 
    ? products.slice(0, 4).map((p, idx) => ({
        id: p.id,
        name: p.name,
        weight: p.description ? (p.description.length > 25 ? p.description.substring(0, 22) + "..." : p.description) : "500g · Organic",
        price: p.price,
        originalPrice: p.originalPrice || Math.round(p.price * 1.25),
        badge: idx === 0 ? "Best seller" : idx === 1 ? "Organic" : idx === 2 ? "New" : null,
        illustration: DEMO_PRODUCTS[idx % DEMO_PRODUCTS.length].illustration,
        rawProduct: p
      }))
    : DEMO_PRODUCTS;

  return (
    <div className="h-root-dark">
      <Navbar />

      <main className="h-content-wrap">
        {/* HERO SECTION */}
        <section className="h-hero-card">
          <div className="h-hero-left">
            <div className="h-badge-pill">
              <span className="h-leaf-icon">🍃</span>
              <span>100% Natural &amp; Organic</span>
            </div>

            <h1 className="h-hero-heading">
              Pure taste <br />
              from <br />
              <span className="h-highlight">Tamil Nadu's</span> <br />
              heart
            </h1>

            <p className="h-hero-subtext">
              Handpicked organic millets, masalas, soups, and pickles — crafted with tradition and delivered fresh to your door.
            </p>

            <div className="h-hero-buttons">
              <button onClick={() => navigate("/products")} className="h-btn-primary">
                Shop now
              </button>
              <button onClick={() => navigate("/products")} className="h-btn-ghost">
                View all products
              </button>
            </div>
          </div>

          <div className="h-hero-right">
            <div className="h-hero-cards-stack">
              <div className="h-preview-card" onClick={() => navigate("/products?search=Ragi")}>
                <div className="h-preview-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v18M12 4c3 2 5 5 5 8s-2 6-5 8M12 4c-3 2-5 5-5 8s2 6 5 8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="h-preview-title">Ragi Health Mix</div>
                <div className="h-preview-price">₹180</div>
              </div>

              <div className="h-preview-card" onClick={() => navigate("/products?search=Pickle")}>
                <div className="h-preview-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                    <rect x="6" y="8" width="12" height="13" rx="2"/>
                    <path d="M8 5h8v3H8zM10 2h4v3h-4z"/>
                  </svg>
                </div>
                <div className="h-preview-title">Mango Pickle</div>
                <div className="h-preview-price">₹120</div>
              </div>

              <div className="h-preview-card" onClick={() => navigate("/products?search=Masala")}>
                <div className="h-preview-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a4 4 0 0 0-4 4c0 6 8 16 8 16s8-10 8-16a4 4 0 0 0-4-4c-2 0-3 1-4 2-1-1-2-2-4-2z" fill="#ef4444"/>
                  </svg>
                </div>
                <div className="h-preview-title">Sambar Masala</div>
                <div className="h-preview-price">₹95</div>
              </div>
            </div>
          </div>
        </section>

        {/* BROWSE BY CATEGORY */}
        <section className="h-section">
          <div className="h-section-header">
            <h2 className="h-section-title">Browse by category</h2>
            <Link to="/products" className="h-section-link">View all &rarr;</Link>
          </div>

          <div className="h-category-grid">
            {DEMO_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <div
                  key={cat.id}
                  className={`h-cat-card ${isSelected ? "h-cat-card-active" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    navigate(`/products?category=${encodeURIComponent(cat.name)}`);
                  }}
                >
                  <div className="h-cat-icon">{cat.icon}</div>
                  <div className="h-cat-name">{cat.name}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* POPULAR PRODUCTS */}
        <section className="h-section">
          <div className="h-section-header">
            <h2 className="h-section-title">Popular products</h2>
            <Link to="/products" className="h-section-link">See all &rarr;</Link>
          </div>

          <div className="h-product-grid">
            {displayProducts.map((p) => {
              const wished = isWished(p.id);
              return (
                <div className="h-dark-prod-card" key={p.id}>
                  <div className="h-dark-prod-top">
                    {p.badge ? (
                      <span className={`h-dark-badge ${p.badge.toLowerCase().replace(/\s+/g, '-')}`}>
                        {p.badge}
                      </span>
                    ) : <div />}

                    <button
                      className={`h-dark-wish-btn ${wished ? "wished" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(p.rawProduct || p);
                      }}
                      aria-label="Wishlist"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? "#ef4444" : "none"} stroke={wished ? "#ef4444" : "#9ca3af"} strokeWidth="1.8">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="h-dark-prod-icon-area">
                    {p.illustration}
                  </div>

                  <div className="h-dark-prod-body">
                    <div className="h-dark-prod-title">{p.name}</div>
                    <div className="h-dark-prod-weight">{p.weight}</div>

                    <div className="h-dark-prod-footer">
                      <div className="h-dark-prod-prices">
                        {p.originalPrice && <span className="h-dark-orig-price">₹{p.originalPrice}</span>}
                        <span className="h-dark-price">₹{p.price}</span>
                      </div>
                      <button
                        className="h-dark-add-btn"
                        onClick={() => addToCart(p.rawProduct || p)}
                        aria-label={`Add ${p.name} to cart`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FREE DELIVERY BANNER */}
        <section className="h-banner-section">
          <div className="h-delivery-banner">
            <div className="h-delivery-left">
              <div className="h-delivery-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="3" width="15" height="13" rx="2" fill="#ef4444"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" fill="#ef4444"/>
                  <circle cx="5.5" cy="18.5" r="2.5" fill="#1f2937"/>
                  <circle cx="18.5" cy="18.5" r="2.5" fill="#1f2937"/>
                </svg>
              </div>
              <div className="h-delivery-meta">
                <h3>Free delivery on orders above ₹499</h3>
                <p>Ships within 2–3 business days across Tamil Nadu</p>
              </div>
            </div>
            <button onClick={() => navigate("/products")} className="h-delivery-btn">
              Shop now
            </button>
          </div>
        </section>

        {/* VALUE PROPOSITIONS */}
        <section className="h-features-section">
          <div className="h-features-grid">
            <div className="h-feature-card">
              <div className="h-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="none"/>
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 4.5 3.3 8.2 7.7 8.9L12 12V3z"/>
                </svg>
              </div>
              <h4 className="h-feat-title">100% organic</h4>
              <p className="h-feat-sub">No preservatives or additives</p>
            </div>

            <div className="h-feature-card">
              <div className="h-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                </svg>
              </div>
              <h4 className="h-feat-title">Farm to table</h4>
              <p className="h-feat-sub">Sourced directly from farmers</p>
            </div>

            <div className="h-feature-card">
              <div className="h-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4 className="h-feat-title">Secure packaging</h4>
              <p className="h-feat-sub">Freshness sealed &amp; safe delivery</p>
            </div>

            <div className="h-feature-card">
              <div className="h-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>
              <h4 className="h-feat-title">Easy returns</h4>
              <p className="h-feat-sub">Hassle-free 7-day returns</p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="h-footer-dark">
        <div className="h-footer-inner">
          <p>&copy; {new Date().getFullYear()} Aasai Foods. Pure taste from Tamil Nadu's heart.</p>
        </div>
      </footer>
    </div>
  );
}
