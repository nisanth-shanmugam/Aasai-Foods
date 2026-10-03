import { useState, useEffect, useRef } from "react";
import { useOrders } from "../../context/OrderContext";
import AdminLayout   from "./AdminLayout";
import "./admin.css";

const STATUSES     = ["All Status", "Payment Verification Pending", "Paid", "Pending", "Shipped", "Delivered", "Cancelled"];
const STATUS_CLASS = {
  "Payment Verification Pending": "badge-orange",
  "Paid": "badge-blue",
  "Pending": "badge-yellow",
  "Shipped": "badge-blue",
  "Delivered": "badge-green",
  "Cancelled": "badge-red",
};

export default function AdminOrders() {
  const { orders, updateOrderStatus, loading, fetchAllOrders } = useOrders();
  const [filter, setFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [newId, setNewId]   = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const prevLen             = useRef(orders.length);

  useEffect(() => { fetchAllOrders(); }, [fetchAllOrders]);

  useEffect(() => {
    if (orders.length > prevLen.current) {
      setNewId(orders[0]?.id);
      const t = setTimeout(() => setNewId(null), 2000);
      prevLen.current = orders.length;
      return () => clearTimeout(t);
    }
    prevLen.current = orders.length;
  }, [orders]);

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "All Status" || o.status === filter;
    const matchSearch =
      (o.customer || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.utrNumber || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalRevenue    = orders.filter(o => o.status === "Delivered" || o.status === "Paid").reduce((s, o) => s + (o.amount || 0), 0);
  const verifyPending   = orders.filter(o => o.status === "Payment Verification Pending").length;
  const pending         = orders.filter(o => o.status === "Pending").length;
  const delivered       = orders.filter(o => o.status === "Delivered").length;

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Orders & Payment Verification</h2>
          <p>Track customer orders, verify UPI payments, and manage order statuses</p>
        </div>
        <div className="admin-topbar-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--color-success-text)", background: "var(--color-success-bg)", padding: "5px 10px", borderRadius: 20, border: "0.5px solid var(--color-border)", letterSpacing: "0.04em" }}>
            <span className="live-dot" style={{ margin: 0 }} /> LIVE
          </div>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card" style={{ borderColor: verifyPending > 0 ? "#f59e0b" : undefined }}>
          <div className="stat-label">Verify Pending</div>
          <div className="stat-value" style={{ color: "#d97706" }}>{verifyPending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value" style={{ color: "var(--color-success-text)" }}>{delivered}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h3>All Orders <span style={{ color: "var(--color-text-secondary)", fontWeight: 400, fontSize: 12 }}>({filtered.length})</span></h3>
          <div className="controls">
            <input
              className="admin-search"
              placeholder="Search ID, customer or UTR…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="status-select"
              style={{ width: 190 }}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No orders found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Details</th>
                <th>Payment & UTR</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className={o.id === newId ? "row-new" : ""}>
                  <td style={{ fontWeight: 600 }}>{o.id}</td>
                  <td>
                    <div><strong>{o.customer}</strong></div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{o.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      {o.paymentMethod === "upi" ? "📱 UPI QR Code" : "💵 Cash on Delivery"}
                    </div>
                    {o.utrNumber && (
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 4, marginTop: 4, display: "inline-block" }}>
                        UTR: {o.utrNumber}
                      </div>
                    )}
                    {o.paymentScreenshotUrl && (
                      <div style={{ marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setPreviewImg(o.paymentScreenshotUrl)}
                          style={{ fontSize: 11, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                        >
                          🖼️ View Receipt
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>{o.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{o.amount?.toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[o.status] || "badge-gray"}`} style={o.status === "Payment Verification Pending" ? { background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" } : {}}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.pk, e.target.value)}
                      style={{ fontSize: 12 }}
                    >
                      {["Payment Verification Pending", "Paid", "Pending", "Shipped", "Delivered", "Cancelled"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImg && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}
          onClick={() => setPreviewImg(null)}
        >
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, maxWidth: 500, width: "100%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: "0 0 12px 0" }}>Payment Receipt Screenshot</h4>
            <img src={previewImg} alt="Payment Receipt" style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 10 }} />
            <div style={{ marginTop: 16 }}>
              <button
                className="cust-btn-primary"
                onClick={() => setPreviewImg(null)}
                style={{ padding: "8px 20px" }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

