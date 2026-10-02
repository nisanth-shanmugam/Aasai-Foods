import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import api from "../../api/axios";
import { useOrders }   from "../../context/OrderContext";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "./AdminLayout";
import "./admin.css";

const PIE_COLORS = ["#2d5a1b", "#c8873a", "#c87060", "#c8b838", "#6b7280", "#7b7fa2", "#0288d1"];

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

export default function AdminAnalytics() {
  const { orders, fetchAllOrders } = useOrders();
  const { products } = useProducts();
  const [stats, setStats] = useState(null);

  useEffect(() => { fetchAllOrders(); }, [fetchAllOrders]);

  useEffect(() => {
    api.get("/store/admin/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const salesByDate = orders.reduce((acc, o) => {
    const key = o.date || "Unknown";
    acc[key] = (acc[key] || 0) + (o.amount || 0);
    return acc;
  }, {});
  const salesData = Object.entries(salesByDate).slice(-14).map(([date, sales]) => ({ date, sales }));

  const statusCount = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

  const catCount = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(catCount).map(([name, value], i) => ({
    name, value, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const totalRevenue = stats
    ? parseFloat(stats.total_revenue).toLocaleString("en-IN")
    : orders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.amount, 0).toLocaleString("en-IN");

  const summary = [
    { label: "Total Revenue",   value: `₹${totalRevenue}`,                                                          icon: "ti ti-currency-rupee" },
    { label: "Total Orders",    value: stats ? stats.total_orders   : orders.length,                                icon: "ti ti-clipboard-list" },
    { label: "Pending Orders",  value: stats ? stats.pending_orders : orders.filter(o => o.status === "Pending").length, icon: "ti ti-clock" },
    { label: "Active Products", value: stats ? stats.total_products : products.filter(p => p.status === "Active").length, icon: "ti ti-package" },
  ];

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Analytics</h2>
          <p>Live overview of your store performance</p>
        </div>
        <div className="admin-topbar-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--color-success-text)", background: "var(--color-success-bg)", padding: "5px 10px", borderRadius: 20, border: "0.5px solid var(--color-border)", letterSpacing: "0.04em" }}>
            <span className="live-dot" style={{ margin: 0 }} /> LIVE
          </div>
        </div>
      </div>

      <div className="stat-cards">
        {summary.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon"><i className={s.icon} style={{ fontSize: 20, color: "var(--color-text-secondary)" }} /></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header"><h4>Sales Over Time</h4></div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={salesData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
                <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No sales data yet</div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-header"><h4>Products by Category</h4></div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {categoryData.map((p) => (
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

      <div className="chart-card">
        <div className="chart-card-header"><h4>Orders by Status</h4></div>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No orders yet</div>
        )}
      </div>
    </AdminLayout>
  );
}
