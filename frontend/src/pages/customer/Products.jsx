import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import Navbar from "./Navbar";
import "./customer.css";

function StarRow({ rating }) {
  return (
    <span className="star-row">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 24 24"
          fill={s <= Math.floor(rating || 0) ? "#f59e0b" : "#e5e7eb"}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </span>
  );
}

function ProductSkeleton() {
  return (
    <div className="prod-card" style={{ pointerEvents: "none" }}>
      <div className="prod-img-wrap skeleton" style={{ height: 150 }} />
      <div className="prod-body">
        <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: "50%", marginBottom: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton" style={{ height: 12, width: "35%" }} />
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { addToCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const { products, categories } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch]       = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [maxPrice, setMaxPrice]   = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [addedId, setAddedId]     = useState(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    const q   = searchParams.get("search");
    if (cat) setSelectedCats([cat]);
    if (q)   setSearch(q);
  }, []);

  const toggleCat = (cat) => {
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
    setSearchParams({});
  };

  const handleAddToCart = (p) => {
    addToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const active = products.filter((p) => p.status === "Active");
  const maxP   = active.length ? Math.max(...active.map((p) => p.price)) : 1000;

  const filtered = active.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedCats.length === 0 || selectedCats.includes(p.category)) &&
    p.price <= maxPrice &&
    (p.rating || 0) >= minRating
  );

  const hasFilters = selectedCats.length > 0 || minRating > 0;

  return (
    <div className="cust-root">
      <Navbar />
      <div className="cust-page">
        <div className="shop-layout" style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* Sidebar Filter */}
          <aside className="shop-filter">
            <div className="sf-head">Filters</div>

            <div className="sf-group">
              <div className="sf-label">Category</div>
              {categories.map((cat) => (
                <label key={cat} className="sf-check">
                  <input type="checkbox" checked={selectedCats.includes(cat)} onChange={() => toggleCat(cat)} />
                  {cat}
                </label>
              ))}
            </div>

            <div className="sf-group">
              <div className="sf-label">Max Price: ₹{maxPrice.toLocaleString("en-IN")}</div>
              <input type="range" min={0} max={maxP || 1000} value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)} className="sf-range" />
              <div className="sf-price-row"><span>₹0</span><span>₹{maxP.toLocaleString("en-IN")}</span></div>
            </div>

            <div className="sf-group">
              <div className="sf-label">Min Rating</div>
              {[5,4,3,2,1].map((r) => (
                <label key={r} className="sf-check">
                  <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} />
                  {"★".repeat(r)} & above
                </label>
              ))}
              <label className="sf-check">
                <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} />
                All ratings
              </label>
            </div>

            {hasFilters && (
              <button className="sf-clear" onClick={() => { setSelectedCats([]); setMinRating(0); setSearchParams({}); }}>
                Clear Filters
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <div className="shop-main">
            <div className="shop-toolbar">
              <h2 className="shop-title">
                {selectedCats.length === 1 ? selectedCats[0] : "All Products"}
                <span className="shop-count">({filtered.length})</span>
              </h2>
              <div className="shop-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shop-search"
                  aria-label="Search products"
                />
              </div>
            </div>

            {products.length === 0 ? (
              /* Skeleton loading */
              <div className="prod-grid">
                {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="shop-empty">
                <div style={{ fontSize: 48 }}>🔍</div>
                <p style={{ marginTop: 12 }}>No products found. Try adjusting your filters.</p>
                {hasFilters && (
                  <button className="cust-btn-outline" style={{ marginTop: 16 }}
                    onClick={() => { setSelectedCats([]); setMinRating(0); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="prod-grid">
                {filtered.map((p) => {
                  const wished = isWished(p.id);
                  const justAdded = addedId === p.id;
                  return (
                    <div className="prod-card" key={p.id}>
                      <div className="prod-img-wrap" style={{ position: "relative" }}>
                        <img src={p.image} alt={p.name}
                          onError={(e) => { e.target.src = "https://placehold.co/200x150/f0fdf4/16a34a?text=🌿"; }} />
                        <button
                          onClick={() => toggle(p)}
                          style={{
                            position: "absolute", top: 8, right: 8,
                            background: "rgba(255,255,255,0.92)", border: "1px solid #e5e7eb",
                            borderRadius: "50%", width: 28, height: 28,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", transition: "transform 0.15s",
                          }}
                          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24"
                            fill={wished ? "#ef4444" : "none"}
                            stroke={wished ? "#ef4444" : "#9ca3af"} strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="prod-body">
                        <div className="prod-name">{p.name}</div>
                        {p.weight && <div className="prod-weight">⚖ {p.weight}</div>}
                        <div className="prod-price">₹{p.price.toLocaleString("en-IN")}</div>
                        <div className="prod-bottom">
                          <div className="prod-rating">
                            <StarRow rating={p.rating} />
                            <span className="prod-rating-val">{(p.rating || 0).toFixed(1)}</span>
                            <span className="prod-reviews">({p.reviews || 0})</span>
                          </div>
                          <button
                            className="prod-add-btn"
                            onClick={() => handleAddToCart(p)}
                            aria-label={`Add ${p.name} to cart`}
                            style={justAdded ? { background: "#16a34a", color: "#fff", borderColor: "#16a34a" } : {}}
                          >
                            {justAdded ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
