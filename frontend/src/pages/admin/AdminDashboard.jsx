import { useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useOrders }   from "../../context/OrderContext";
import { useProducts } from "../../context/ProductContext";
import { useUsers }    from "../../context/UserContext";
import { Link }        from "react-router-dom";
import AdminLayout     from "./AdminLayout";
import "./admin.css";

const STATUS_CLASS = {
  Delivered: "badge-green",
  Shipped:   "badge-blue",
  Cancelled: "badge-red",
  Pending:   "badge-yellow",
};

const PIE_COLORS = ["#2d5a1b", "#c8873a", "#c87060", "#c8b838", "#6b7280"];

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--color-text-primary)",
    boxShadow: "0 4px 12px rgba(45,90,27,0.08)",
  },
  labelStyle: { color: "var(--color-text-secondary)" },
};

export default function AdminDashboard() {
  const { orders, fetchAllOrders } = useOrders();
  const { products } = useProducts();
  const { users }    = useUsers();

  useEffect(() => { fetchAllOrders(); }, [fetchAllOrders]);

  const totalRevenue = orders
    .filter((o) => o.status === "Delivered")
    .reduce((s, o) => s + (o.amount || 0), 0);

  const totalSales = orders.reduce((s, o) => s + (o.amount || 0), 0);

  const salesByDate = orders.reduce((acc, o) => {
    const key = o.date || "Unknown";
    acc[key] = (acc[key] || 0) + (o.amount || 0);
    return acc;
  }, {});
  const salesData = Object.entries(salesByDate)
    .slice(-7)
    .map(([date, sales]) => ({ date, sales }));

  const catCount = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(catCount).map(([name, value], i) => ({
    name, value, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const stats = [
    { label: "Total Sales",   value: `₹${totalSales.toLocaleString("en-IN")}`,   sub: `${orders.length} orders`           },
    { label: "Total Orders",  value: orders.length,                                sub: `${orders.filter(o => o.status === "Pending").length} pending` },
    { label: "Customers",     value: users.length,                                 sub: "registered users"                 },
    { label: "Revenue",       value: `₹${totalRevenue.toLocaleString("en-IN")}`,  sub: "from delivered orders"            },
  ];

  return (
    <AdminLayout>
      {/* Top bar */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Dashboard</h2>
          <p>Welcome back — here's what's happening with Aasai Foods today.</p>
        </div>
        <div className="admin-topbar-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--color-success-text)", background: "var(--color-success-bg)", padding: "5px 10px", borderRadius: 20, border: "0.5px solid var(--color-border)", letterSpacing: "0.04em" }}>
            <span className="live-dot" style={{ margin: 0 }} /> LIVE
          </div>
          <div className="admin-user">👤 Admin ▾</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <h4>Sales Overview</h4>
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
                <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No order data yet</div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-header"><h4>Products by Category</h4></div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={155}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {pieData.map((p) => (
                  <div className="legend-item" key={p.name}>
                    <div className="legend-dot" style={{ background: p.color }} />
                    <span>{p.name}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--color-text-secondary)" }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No products yet</div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <h3>Recent Orders</h3>
          <Link to="/admin/orders" className="section-link">View all →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">No orders placed yet</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Date</th>
                <th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{o.id}</td>
                  <td>{o.customer}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{o.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{o.amount?.toLocaleString("en-IN")}</td>
                  <td><span className={`badge ${STATUS_CLASS[o.status] || "badge-gray"}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
