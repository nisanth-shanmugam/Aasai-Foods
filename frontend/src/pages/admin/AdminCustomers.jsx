import { useState } from "react";
import { useUsers }  from "../../context/UserContext";
import AdminLayout   from "./AdminLayout";
import "./admin.css";

export default function AdminCustomers() {
  const { users, toggleBlock, loading } = useUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const customers = users.filter((u) => u.role === "customer");

  const filtered = customers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const activeCount  = customers.filter((u) => u.status === "Active").length;
  const blockedCount = customers.filter((u) => u.status === "Blocked").length;

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Customers</h2>
          <p>Manage registered customers and their accounts</p>
        </div>
        <div className="admin-topbar-actions">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="status-select"
          >
            {["All", "Active", "Blocked"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: "var(--color-success-text)" }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blocked</div>
          <div className="stat-value" style={{ color: "var(--color-danger-text)" }}>{blockedCount}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h3>All Customers <span style={{ color: "var(--color-text-secondary)", fontWeight: 400, fontSize: 12 }}>({filtered.length})</span></h3>
          <div className="controls">
            <input
              className="admin-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No customers found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th>
                <th>Joined</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{u.email}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{u.phone || "—"}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{u.joined}</td>
                  <td>
                    <span className={`badge ${u.status === "Active" ? "badge-green" : "badge-red"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`action-btn ${u.status === "Active" ? "danger" : ""}`}
                      onClick={() => toggleBlock(u.id)}
                    >
                      {u.status === "Active" ? "🚫 Block" : "✅ Unblock"}
                    </button>
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
