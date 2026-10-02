import { useState, useEffect, useRef } from "react";
import { useOrders } from "../../context/OrderContext";
import AdminLayout   from "./AdminLayout";
import "./admin.css";

const STATUSES     = ["All Status", "Pending", "Shipped", "Delivered", "Cancelled"];
const STATUS_CLASS = { Delivered: "badge-green", Shipped: "badge-blue", Cancelled: "badge-red", Pending: "badge-yellow" };

export default function AdminOrders() {
  const { orders, updateOrderStatus, loading, fetchAllOrders } = useOrders();
  const [filter, setFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [newId, setNewId]   = useState(null);
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
      (o.id || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalRevenue = orders.filter(o => o.status === "Delivered").reduce((s, o) => s + (o.amount || 0), 0);
  const pending      = orders.filter(o => o.status === "Pending").length;
  const delivered    = orders.filter(o => o.status === "Delivered").length;

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Orders</h2>
          <p>Track and manage all customer orders</p>
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
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: "var(--color-warning-text)" }}>{pending}</div>
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
              placeholder="Search by ID or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="status-select"
              style={{ width: 130 }}
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
                <th>Order ID</th><th>Customer</th><th>Date</th>
                <th>Amount</th><th>Status</th><th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className={o.id === newId ? "row-new" : ""}>
                  <td style={{ fontWeight: 600 }}>{o.id}</td>
                  <td>{o.customer}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{o.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{o.amount?.toLocaleString("en-IN")}</td>
                  <td><span className={`badge ${STATUS_CLASS[o.status] || "badge-gray"}`}>{o.status}</span></td>
                  <td>
                    <select
                      className="status-select"
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.pk, e.target.value)}
                    >
                      {["Pending", "Shipped", "Delivered", "Cancelled"].map((s) => (
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
    </AdminLayout>
  );
}
