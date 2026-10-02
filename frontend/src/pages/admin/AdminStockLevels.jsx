import { useState } from "react";
import { useProducts } from "../../context/ProductContext";
import AdminLayout      from "./AdminLayout";
import "./admin.css";

const LOW = 15;

export default function AdminStockLevels() {
  const { products, updateProduct } = useProducts();
  const [restockQty, setRestockQty] = useState({});
  const [toast, setToast] = useState(null);

  const byStatus = {
    out:  products.filter((p) => p.stock === 0),
    low:  products.filter((p) => p.stock > 0 && p.stock <= LOW),
    ok:   products.filter((p) => p.stock > LOW),
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestock = (p) => {
    const qty = parseInt(restockQty[p.id] || "50", 10);
    if (!isNaN(qty) && qty > 0) {
      updateProduct({ ...p, stock: p.stock + qty });
      setRestockQty((prev) => ({ ...prev, [p.id]: "" }));
      showToast(`Restocked "${p.name}" by ${qty} units.`);
    }
  };

  const Section = ({ title, items, badge, emptyMsg }) => (
    <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
      <div className="admin-table-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3>{title}</h3>
          <span className={`badge ${badge}`}>{items.length}</span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">{emptyMsg}</div>
      ) : (
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Weight</th><th>Stock</th><th>Restock</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <img src={p.image} alt={p.name} className="product-thumb" />
                    <div>
                      <div className="product-name">{p.name}</div>
                      {p.description && <div className="product-desc">{p.description.slice(0, 48)}…</div>}
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--color-text-secondary)" }}>{p.category}</td>
                <td style={{ color: "var(--color-text-secondary)" }}>{p.weight || "—"}</td>
                <td>
                  <span className={p.stock === 0 ? "stock-zero" : "stock-low"} style={{ fontWeight: 600 }}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="number"
                      className="inline-input"
                      value={restockQty[p.id] || ""}
                      onChange={(e) => setRestockQty((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="50"
                      min="1"
                      style={{ width: 60 }}
                      aria-label={`Restock quantity for ${p.name}`}
                    />
                    <button
                      className="btn-green"
                      style={{ padding: "5px 12px", fontSize: 12 }}
                      onClick={() => handleRestock(p)}
                    >
                      + Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Stock Levels</h2>
          <p>Monitor inventory and restock low or empty products</p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Stock</div>
          <div className="stat-value" style={{ color: "var(--color-success-text)" }}>{byStatus.ok.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value" style={{ color: "var(--color-warning-text)" }}>{byStatus.low.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value" style={{ color: "var(--color-danger-text)" }}>{byStatus.out.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Section title="Out of Stock" items={byStatus.out} badge="badge-red"    emptyMsg="🎉 No out-of-stock products" />
        <Section title="Low Stock"    items={byStatus.low} badge="badge-yellow" emptyMsg="🎉 No low-stock products"    />
        <Section title="Well Stocked" items={byStatus.ok}  badge="badge-green"  emptyMsg="No products in stock"        />
      </div>

      {toast && (
        <div className="admin-toast">
          <i className="ti ti-check" /> {toast}
          <button onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
    </AdminLayout>
  );
}
