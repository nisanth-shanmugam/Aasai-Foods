import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useConnectionState } from "../../hooks/useConnectionState";
import { onOrderStatusChanged, offOrderStatusChanged } from "../../services/socket";
import "./customer.css";

export default function Navbar() {
  const { count }            = useCart();
  const { items: wishItems } = useWishlist();
  const { pathname }         = useLocation();
  const { logout, user }     = useAuth();
  const navigate             = useNavigate();
  const connState            = useConnectionState();

  const [query, setQuery]             = useState("");
  const [mobileMenuOpen, setMenu]     = useState(false);
  const [liveToast, setLiveToast]     = useState(null);

  useEffect(() => {
    const handler = (d) => {
      setLiveToast(`Order ${d.order_id || ""} is now ${d.status}`);
      const t = setTimeout(() => setLiveToast(null), 5000);
      return () => clearTimeout(t);
    };
    onOrderStatusChanged(handler);
    return () => offOrderStatusChanged(handler);
  }, []);

  const liveColor = connState === "connected" ? "#2d6a4f" : connState === "connecting" ? "#df8f15" : "#cb4a4a";

  const nav = [
    { label: "Home",      to: "/home" },
    { label: "Products",  to: "/products" },
    { label: "Millets",   to: "/products?category=Millets" },
    { label: "Masalas",   to: "/products?category=Masalas" },
    { label: "Pickles",   to: "/products?category=Pickles", hasDropdown: true },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) { navigate(`/products?search=${encodeURIComponent(q)}`); setQuery(""); setMenu(false); }
  };

  const handleNavClick = (to, e) => {
    if (to.includes("#")) {
      e.preventDefault();
      const id = to.split("#")[1];
      if (pathname === "/home") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(`/home#${id}`);
      }
      setMenu(false);
    } else {
      e.preventDefault();
      navigate(to);
      setMenu(false);
    }
  };

  return (
    <>
      <header className="nb">
        <div className="nb-inner">
          {/* Brand */}
          <Link to="/home" className="nb-brand">
            <div className="nb-brand-badge">A</div>
            <div className="nb-brand-meta">
              <span className="nb-brand-name">Aasai Foods</span>
              <span className="nb-brand-sub">ORGANIC &amp; HEALTHY</span>
            </div>
            <span className="nb-live" title={connState} style={{ background: liveColor, animation: connState === "connected" ? undefined : "none" }} />
          </Link>

          {/* Center nav links */}
          <nav className="nb-links-center" aria-label="Main navigation">
            {nav.map((n) => (
              <a key={n.label} href={n.to}
                onClick={(e) => handleNavClick(n.to, e)}
                className={`nb-link ${pathname === n.to.split("?")[0] && (n.label === "Home" ? pathname === "/home" : true) ? "nb-link-active" : ""}`}
              >
                {n.label}
                {n.hasDropdown && (
                  <svg className="nb-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                )}
              </a>
            ))}
          </nav>

          {/* Right section */}
          <div className="nb-right-section">
            <form className="nb-search-bar" onSubmit={handleSearch} role="search">
              <input placeholder="Search organic foods…" value={query}
                onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
              <button type="submit" className="nb-search-btn" aria-label="Submit search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </form>

            <div className="nb-actions">
              {/* Wishlist */}
              <button className="nb-icon-btn nb-desktop-only" aria-label="Wishlist"
                onClick={() => navigate("/profile?tab=wishlist")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishItems.length > 0 && <span className="nb-badge">{wishItems.length}</span>}
              </button>

              {/* Cart */}
              <Link to="/cart" className="nb-icon-btn" aria-label={`Cart, ${count || 3} items`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span className="nb-badge nb-badge-accent">{count || 3}</span>
              </Link>

              {/* User dropdown */}
              <div className="nb-profile-wrap">
                <button className="nb-icon-btn" aria-label="Profile menu" aria-haspopup="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>
                <div className="nb-dropdown" role="menu">
                  <div className="nb-dropdown-user-info">
                    <strong>{user?.name || "Customer"}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <Link to="/profile" role="menuitem">My Profile</Link>
                  <Link to="/profile?tab=orders" role="menuitem">My Orders</Link>
                  <button className="nb-logout-btn" onClick={logout} role="menuitem">Logout</button>
                </div>
              </div>

              {/* Hamburger */}
              <button className="nb-hamburger" onClick={() => setMenu(true)} aria-label="Open navigation menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`nb-drawer-overlay ${mobileMenuOpen ? "active" : ""}`}
        onClick={() => setMenu(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <nav
        className={`nb-drawer ${mobileMenuOpen ? "open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="nb-drawer-header">
          <Link to="/home" className="nb-brand" onClick={() => setMenu(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8z" fill="var(--primary)"/>
              <path d="M12 6c0 0-3 3-3 6h6c0-3-3-6-3-6z" fill="#fff"/>
            </svg>
            <span className="nb-brand-name">Aasai Foods</span>
          </Link>
          <button className="nb-drawer-close" onClick={() => setMenu(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="nb-drawer-content">
          <form className="nb-drawer-search" onSubmit={handleSearch}>
            <input placeholder="Search healthy products…" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
            <button type="submit" className="nb-drawer-search-btn">Search</button>
          </form>

          <div className="nb-drawer-links">
            {nav.map((n) => (
              <a key={n.label} href={n.to}
                onClick={(e) => handleNavClick(n.to, e)}
                className={`nb-drawer-link ${pathname === n.to.split("#")[0] ? "active" : ""}`}
              >
                {n.label}
              </a>
            ))}
            <hr />
            <Link to="/profile" className="nb-drawer-link" onClick={() => setMenu(false)}>My Profile</Link>
            <Link to="/profile?tab=wishlist" className="nb-drawer-link" onClick={() => setMenu(false)}>
              Wishlist {wishItems.length > 0 && `(${wishItems.length})`}
            </Link>
            <Link to="/profile?tab=orders" className="nb-drawer-link" onClick={() => setMenu(false)}>My Orders</Link>
            <button className="nb-drawer-logout" onClick={() => { logout(); setMenu(false); }}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Live order status toast */}
      {liveToast && (
        <div className="cust-toast" role="status" aria-live="polite">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
          📦 {liveToast}
          <button onClick={() => setLiveToast(null)} aria-label="Dismiss notification">✕</button>
        </div>
      )}
    </>
  );
}
