import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrders } from "../../context/OrderContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import api from "../../api/axios";
import Navbar from "./Navbar";
import "./customer.css";

const STATUS_CLS = {
  Delivered: "st-delivered", Shipped: "st-shipped",
  Cancelled: "st-cancelled", Pending: "st-pending", Processing: "st-shipped",
};

const STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra", "Gujarat", "Rajasthan", "Delhi", "West Bengal"];

/* ─── helpers ─── */
function loadAddresses() {
  try { return JSON.parse(localStorage.getItem("aasai_addresses") || "[]"); } catch { return []; }
}
function saveAddresses(list) {
  localStorage.setItem("aasai_addresses", JSON.stringify(list));
}

/* ─── sub-components ─── */

function OrdersTab({ orders }) {
  const [expanded, setExpanded] = useState(null);
  const { addToCart } = useCart();
  const steps = ["Order Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

  const getProgress = (status) => {
    if (status === "Cancelled") return 0;
    if (status === "Pending") return 2;
    if (status === "Shipped") return 4;
    if (status === "Delivered") return 5;
    return 2;
  };

  const etaText = (status) => {
    if (status === "Delivered") return "Delivered";
    if (status === "Shipped") return "20-35 mins";
    if (status === "Pending") return "45-60 mins";
    return "Estimated 45-60 mins";
  };

  if (orders.length === 0)
    return (
      <div className="pf-empty">
        <div>📦</div>
        <p>No orders yet.</p>
        <Link to="/products" className="cust-btn-primary" style={{ marginTop: 14 }}>Start Shopping</Link>
      </div>
    );

  return (
    <div className="order-list">
      {orders.map((o) => {
        const activeStep = getProgress(o.status);
        return (
          <div key={o.id} className="order-card">
            <div className="order-card-header" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div>
                <div className="order-card-id">Order ID: {o.id}</div>
                <div className="order-card-date">{o.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="order-card-amount">₹{o.amount || o.total}</div>
                <span className={`order-status ${STATUS_CLS[o.status] || ""}`}>{o.status}</span>
                <span className="order-expand-indicator">{expanded === o.id ? "▲" : "▼"}</span>
              </div>
            </div>

            <div className="order-progress">
              {steps.map((step, index) => (
                <div key={step} className="order-step">
                  <div className={`order-step-dot ${index < activeStep ? "order-step-dot-active" : ""}`}>{index < activeStep ? "✔" : index + 1}</div>
                  <div className="order-step-label">{step}</div>
                </div>
              ))}
            </div>
            <div className="order-eta">{o.status === "Cancelled" ? "Order was cancelled" : `ETA: ${etaText(o.status)}`}</div>

            {expanded === o.id && (
              <div className="order-items-expand">
                <div className="order-items-head">Items Ordered</div>
                {o.items.map((item, i) => (
                  <div key={i} className="order-item-row">
                    {item.image && <img src={item.image} alt={item.name} className="order-item-img" />}
                    <div style={{ flex: 1 }}>
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-meta">Qty: {item.qty} · ₹{item.price} each</div>
                    </div>
                    <div className="order-item-total">₹{item.price * item.qty}</div>
                  </div>
                ))}
                {o.address && (
                  <div className="order-address-row">
                    📍 {o.address.address}, {o.address.city}, {o.address.state} – {o.address.pincode}
                  </div>
                )}
                <button className="cust-btn-outline" type="button" onClick={() => o.items.forEach((item) => addToCart({ ...item, qty: item.qty, id: item.product_id || item.id }))}>
                  Reorder
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddressesTab() {
  const [addresses, setAddresses] = useState(loadAddresses);
  const [editing, setEditing] = useState(null); // index or "new"
  const blank = { name: "", phone: "", address: "", city: "", state: "Tamil Nadu", pincode: "" };
  const [form, setForm] = useState(blank);

  const commit = () => {
    let updated;
    if (editing === "new") {
      updated = [...addresses, form];
    } else {
      updated = addresses.map((a, i) => (i === editing ? form : a));
    }
    saveAddresses(updated);
    setAddresses(updated);
    setEditing(null);
    setForm(blank);
  };

  const remove = (i) => {
    const updated = addresses.filter((_, idx) => idx !== i);
    saveAddresses(updated);
    setAddresses(updated);
  };

  const startEdit = (i) => {
    setForm(addresses[i]);
    setEditing(i);
  };

  if (editing !== null)
    return (
      <div>
        <div className="pf-tab-header">
          <h3 className="profile-content-title" style={{ margin: 0 }}>
            {editing === "new" ? "Add New Address" : "Edit Address"}
          </h3>
          <button className="pf-text-btn" onClick={() => { setEditing(null); setForm(blank); }}>← Back</button>
        </div>
        <div className="form-grid" style={{ marginTop: 20 }}>
          {[
            { label: "Full Name",     key: "name",     placeholder: "Karthik Raja" },
            { label: "Phone",         key: "phone",    placeholder: "+91 98765 43210" },
          ].map(({ label, key, placeholder }) => (
            <div className="form-field" key={key}>
              <label>{label}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
            </div>
          ))}
          <div className="form-field" style={{ gridColumn: "1/-1" }}>
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="12, Anna Nagar" />
          </div>
          <div className="form-field">
            <label>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Chennai" />
          </div>
          <div className="form-field">
            <label>Pincode</label>
            <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="641040" />
          </div>
          <div className="form-field" style={{ gridColumn: "1/-1" }}>
            <label>State</label>
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button className="cust-btn-primary" style={{ marginTop: 20 }} onClick={commit}>
          {editing === "new" ? "Save Address" : "Update Address"}
        </button>
      </div>
    );

  return (
    <div>
      <div className="pf-tab-header">
        <h3 className="profile-content-title" style={{ margin: 0 }}>My Addresses</h3>
        <button className="cust-btn-primary" onClick={() => { setForm(blank); setEditing("new"); }}>+ Add Address</button>
      </div>
      {addresses.length === 0 ? (
        <div className="pf-empty"><div>📍</div><p>No saved addresses yet.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {addresses.map((a, i) => (
            <div key={i} className="addr-card">
              <div className="addr-icon">🏠</div>
              <div style={{ flex: 1 }}>
                <div className="addr-name">{a.name} · <span className="addr-phone">{a.phone}</span></div>
                <div className="addr-line">{a.address}, {a.city}, {a.state} – {a.pincode}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="addr-edit-btn" onClick={() => startEdit(i)}>Edit</button>
                <button className="addr-del-btn" onClick={() => remove(i)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistTab() {
  const { items, remove } = useWishlist();
  const { addToCart } = useCart();

  if (items.length === 0)
    return <div className="pf-empty"><div>♡</div><p>Your wishlist is empty.</p></div>;

  return (
    <div>
      <h3 className="profile-content-title">Wishlist</h3>
      <div className="wl-grid">
        {items.map((p) => (
          <div key={p.id} className="wl-card">
            <div className="wl-img-wrap">
              <img src={p.image} alt={p.name} />
            </div>
            <div className="wl-body">
              <div className="wl-name">{p.name}</div>
              <div className="wl-price">₹{p.price}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="cust-btn-primary" style={{ flex: 1, padding: "8px", fontSize: 12, justifyContent: "center" }}
                  onClick={() => { addToCart(p); remove(p.id); }}>
                  Add to Cart
                </button>
                <button className="addr-del-btn" onClick={() => remove(p.id)}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ user, setUser }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [pwd, setPwd]   = useState({ current: "", new_password: "", confirm: "" });
  const [saving, setSaving]   = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [msg, setMsg]   = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);

  const flash = (setter, text, ok) => {
    setter({ text, ok });
    setTimeout(() => setter(null), 3500);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me/", form);
      setUser(data);
      flash(setMsg, "Profile updated successfully.", true);
    } catch {
      flash(setMsg, "Failed to update profile.", false);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) {
      flash(setPwdMsg, "New passwords do not match.", false);
      return;
    }
    if (pwd.new_password.length < 8) {
      flash(setPwdMsg, "Password must be at least 8 characters.", false);
      return;
    }
    setPwdSaving(true);
    try {
      await api.post("/auth/me/password/", { current_password: pwd.current, new_password: pwd.new_password });
      setPwd({ current: "", new_password: "", confirm: "" });
      flash(setPwdMsg, "Password changed successfully.", true);
    } catch (err) {
      flash(setPwdMsg, err?.response?.data?.error || "Failed to change password.", false);
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div>
      {/* ── Profile Info ── */}
      <h3 className="profile-content-title">Account Settings</h3>
      <form onSubmit={saveProfile}>
        <div className="settings-form">
          <div className="form-field">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
          </div>
          <div className="form-field">
            <label>Email <span style={{ color: "#9ca3af", fontWeight: 400 }}>(cannot change)</span></label>
            <input value={user?.email || ""} disabled style={{ background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }} />
          </div>
          <div className="form-field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
        </div>
        {msg && <div className={`pf-alert ${msg.ok ? "pf-alert-ok" : "pf-alert-err"}`}>{msg.text}</div>}
        <button type="submit" className="cust-btn-primary" style={{ marginTop: 18 }} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <div style={{ borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />

      {/* ── Change Password ── */}
      <h3 className="profile-content-title">Change Password</h3>
      <form onSubmit={changePassword}>
        <div className="settings-form">
          <div className="form-field">
            <label>Current Password</label>
            <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="••••••••" required />
          </div>
          <div className="form-field">
            <label>New Password</label>
            <input type="password" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} placeholder="Min 8 characters" required />
          </div>
          <div className="form-field">
            <label>Confirm New Password</label>
            <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Repeat new password" required />
          </div>
        </div>
        {pwdMsg && <div className={`pf-alert ${pwdMsg.ok ? "pf-alert-ok" : "pf-alert-err"}`}>{pwdMsg.text}</div>}
        <button type="submit" className="cust-btn-primary" style={{ marginTop: 18 }} disabled={pwdSaving}>
          {pwdSaving ? "Changing…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}

/* ─── Main Profile Page ─── */
export default function Profile() {
  const [tab, setTab] = useState("orders");
  const { orders, fetchMyOrders } = useOrders();
  const { user, logout, setUser } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);

  // deep-link support: /profile?tab=wishlist
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t);
  }, [searchParams]);

  const menu = [
    { id: "orders",    icon: OrderIcon,   label: "My Orders"    },
    { id: "addresses", icon: AddrIcon,    label: "My Addresses" },
    { id: "wishlist",  icon: HeartIcon,   label: "Wishlist"     },
    { id: "settings",  icon: SettingsIcon,label: "Settings"     },
  ];

  return (
    <div className="cust-root">
      <Navbar />
      <div className="cust-page">
        <div className="profile-wrap">

          {/* Sidebar */}
          <aside className="profile-side">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-circle">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="profile-name">{user?.name || "User"}</div>
                <div className="profile-phone">{user?.phone || user?.email}</div>
              </div>
            </div>

            <nav className="profile-nav">
              {menu.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  className={`profile-nav-item ${tab === id ? "profile-nav-active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  <span className="profile-nav-icon"><Icon /></span>
                  {label}
                </button>
              ))}
              <button className="profile-nav-item profile-logout" onClick={logout}>
                <span className="profile-nav-icon"><LogoutIcon /></span>
                Logout
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="profile-content">
            {tab === "orders"    && <OrdersTab   orders={orders} />}
            {tab === "addresses" && <AddressesTab />}
            {tab === "wishlist"  && <WishlistTab />}
            {tab === "settings"  && <SettingsTab user={user} setUser={setUser} />}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Icons ─── */
function OrderIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function AddrIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function HeartIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function LogoutIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
