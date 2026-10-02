import { useState } from "react";
import { useUsers } from "../../context/UserContext";
import AdminLayout from "./AdminLayout";
import "./admin.css";

export default function AdminUsers() {
  const { users, toggleBlock, loading } = useUsers();
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeCount  = users.filter((u) => u.status === "Active").length;
  const blockedCount = users.filter((u) => u.status === "Blocked").length;

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Users</h2>
          <p>All registered accounts across all roles</p>
        </div>
        <div className="admin-topbar-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--color-success-text)", background: "var(--color-success-bg)", padding: "5px 10px", borderRadius: 20, border: "0.5px solid var(--color-border)", letterSpacing: "0.04em" }}>
            <span className="live-dot" style={{ margin: 0 }} /> LIVE
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="status-select"
          >
            {["All", "customer", "admin"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.length}</div>
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
          <h3>All Users <span style={{ color: "var(--color-text-secondary)", fontWeight: 400, fontSize: 12 }}>({filtered.length})</span></h3>
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
          <div className="empty-state">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th>
                <th>Role</th><th>Joined</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{u.email}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{u.phone || "—"}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-blue" : "badge-green"}`}>
                      {u.role}
                    </span>
                  </td>
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
