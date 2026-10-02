import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrderContext";
import { useProducts } from "../../context/ProductContext";
import { useConnectionState } from "../../hooks/useConnectionState";
import "./admin.css";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { to: "/admin",            label: "Dashboard",           end: true,  icon: "ti ti-layout-dashboard" },
      { to: "/admin/products",   label: "Product Management",  icon: "ti ti-package" },
      { to: "/admin/orders",     label: "Order Management",    icon: "ti ti-shopping-cart", badge: true },
      { to: "/admin/customers",  label: "Customer Database",   icon: "ti ti-users" },
      { to: "/admin/stock",      label: "Inventory Alerts",    icon: "ti ti-alert-triangle" },
      { to: "/admin/analytics",  label: "Analytics",           icon: "ti ti-chart-line" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { to: "/admin/settings",  label: "Settings",             icon: "ti ti-settings" },
    ],
  },
];

function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext may be blocked before user interaction — silently skip
  }
}

const CONN_LABEL = { connected: "LIVE", connecting: "CONNECTING…", disconnected: "OFFLINE" };
const CONN_COLOR = { connected: "#27500A", connecting: "#633806", disconnected: "#791F1F" };
const CONN_BG    = { connected: "var(--color-success-bg)", connecting: "var(--color-warning-bg)", disconnected: "var(--color-danger-bg)" };

export default function AdminLayout({ children }) {
  const { logout }     = useAuth();
  const navigate       = useNavigate();
  const { orders }     = useOrders();
  const connState      = useConnectionState();
  const prevCount      = useRef(orders.length);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [navigate]);

  useEffect(() => {
    if (orders.length > prevCount.current) {
      const newest = orders[0];
      playNewOrderSound();
      setToast({ msg: `New order ${newest?.id} — ₹${newest?.amount || newest?.total}`, type: "order" });
      const t = setTimeout(() => setToast(null), 5000);
      prevCount.current = orders.length;
      return () => clearTimeout(t);
    }
    prevCount.current = orders.length;
  }, [orders]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const color  = CONN_COLOR[connState];
  const bgConn = CONN_BG[connState];

  return (
    <div className="admin-shell">
      {/* ── Mobile top bar ── */}
      <div className="admin-mobile-bar">
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <i className="ti ti-menu-2" />
        </button>
        <div className="admin-brand-title" style={{ fontSize: 16 }}>
          <span className="brand-aasai">Aasai</span>{" "}
          <span className="brand-foods">Foods</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-title">
            <span className="brand-aasai">Aasai</span>{" "}
            <span className="brand-foods">Foods</span>
          </div>
          <div className="admin-brand-subtitle">Admin panel</div>
          {/* Mobile close */}
          <button
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="admin-nav-section">
            <div className="admin-nav-section-label">{section.label}</div>
            <nav className="admin-nav">
              {section.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`${n.icon} nav-icon`} />
                  {n.label}
                  {n.badge && pendingCount > 0 && (
                    <span className="nav-badge">{pendingCount}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <div className="admin-sidebar-bottom">
          {/* Connection pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, color,
            background: bgConn, padding: "5px 10px",
            borderRadius: 20, border: `0.5px solid var(--color-border)`,
            marginBottom: 10, letterSpacing: "0.04em",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0,
              animation: connState === "connected" ? "live-pulse 2s ease-in-out infinite" : "none",
            }} />
            {CONN_LABEL[connState]}
          </div>

          <button className="admin-logout-btn" onClick={handleLogout}>
            <i className="ti ti-logout nav-icon" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">{children}</main>

      {/* ── Offline banner ── */}
      {connState === "disconnected" && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "var(--color-danger-bg)", color: "var(--color-danger-text)",
          textAlign: "center", fontSize: 13, fontWeight: 600, padding: "8px",
          fontFamily: "var(--font-admin)", borderBottom: "1px solid rgba(121,31,31,0.2)",
        }}>
          ⚠ Real-time connection lost — attempting to reconnect…
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="admin-toast">
          <span className="live-dot" />
          🛒 {toast.msg}
          <button onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
    </div>
  );
}
