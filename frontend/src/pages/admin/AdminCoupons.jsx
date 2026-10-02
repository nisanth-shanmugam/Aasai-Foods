import { useState } from "react";
import { useLiveStorage } from "../../hooks/useLiveStorage";
import { COUPONS }        from "../../data/mockData";
import AdminLayout         from "./AdminLayout";
import "./admin.css";

const empty = { code: "", discount: "", type: "percent", minOrder: "", active: true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useLiveStorage("aasai_coupons", COUPONS);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);

  const saveCoupon = () => {
    if (!form.code.trim() || !form.discount) return;
    setCoupons((prev) => [
      ...prev,
      { ...form, id: Date.now(), uses: 0, discount: +form.discount, minOrder: +form.minOrder },
    ]);
    setModal(false);
    setForm(empty);
  };

  const toggleActive = (id) =>
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));

  const deleteCoupon = (id) =>
    setCoupons((prev) => prev.filter((c) => c.id !== id));

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Coupons</h2>
          <p>Create and manage discount codes for your customers</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-primary" onClick={() => { setForm(empty); setModal(true); }}>
            <span className="btn-icon-box">+</span>
            New Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total Coupons</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{coupons.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value green" style={{ fontSize: 26 }}>{coupons.filter(c => c.active).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Uses</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{coupons.reduce((s, c) => s + (c.uses || 0), 0)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h3>All Coupons</h3>
        </div>
        {coupons.length === 0 ? (
          <div className="empty-state">No coupons yet. Create your first one!</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Discount</th><th>Type</th>
                <th>Min Order</th><th>Uses</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: "#e5e5e5", letterSpacing: "0.05em", fontFamily: "monospace", fontSize: 13 }}>
                    {c.code}
                  </td>
                  <td style={{ fontWeight: 600, color: "#a3c585" }}>
                    {c.type === "percent" ? `${c.discount}%` : `₹${c.discount}`}
                  </td>
                  <td style={{ color: "#777" }}>{c.type === "percent" ? "Percentage" : "Flat"}</td>
                  <td style={{ color: "#777" }}>₹{c.minOrder}</td>
                  <td style={{ color: "#777" }}>{c.uses || 0}</td>
                  <td>
                    <span className={`badge ${c.active ? "badge-green" : "badge-gray"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" onClick={() => toggleActive(c.id)}>
                        {c.active ? "⏸ Pause" : "▶ Enable"}
                      </button>
                      <button className="action-btn danger" onClick={() => deleteCoupon(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Coupon</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-field">
                <label>Coupon Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME10"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-field">
                  <label>Discount</label>
                  <input type="number" value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 10" />
                </div>
                <div className="form-field">
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Min Order Amount (₹)</label>
                <input type="number" value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="e.g. 200" />
              </div>
              <div className="modal-actions">
                <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn-green"   onClick={saveCoupon}>Create Coupon</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
