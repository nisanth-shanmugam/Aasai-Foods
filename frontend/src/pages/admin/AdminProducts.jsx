import { useState, useRef } from "react";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "./AdminLayout";
import "./admin.css";

const WEIGHT_UNITS = ["g", "kg", "ml", "L", "pcs"];
const LOW_STOCK_THRESHOLD = 15;

const empty = {
  name: "", description: "", category: "Millet",
  price: "", stock: "", weightValue: "", weightUnit: "g",
  status: "Active", image: "",
};

function parseWeight(product) {
  if (product.weightValue !== undefined) return product;
  const match = (product.weight || "").match(/^(\d+\.?\d*)\s*(\w+)$/);
  return {
    ...product,
    weightValue: match ? match[1] : "",
    weightUnit:  match ? match[2] : "g",
  };
}

function getStockStatus(stock) {
  if (stock === 0)                    return { label: "Out of stock", cls: "badge-red",    valCls: "stock-zero" };
  if (stock <= LOW_STOCK_THRESHOLD)   return { label: "Low stock",    cls: "badge-yellow", valCls: "stock-low"  };
  return                                     { label: "In stock",     cls: "badge-green",  valCls: "stock-ok"   };
}

export default function AdminProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useProducts();

  // ── Add modal ──
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);
  const [preview, setPreview] = useState("");
  const fileRef               = useRef();

  // ── Inline edit ──
  const [editId, setEditId]         = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [editPreview, setEditPreview] = useState("");
  const editFileRef                 = useRef();

  // ── Filters ──
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("All");

  // ── Add handlers ──
  const openAdd  = () => { setForm(empty); setPreview(""); setModal(true); };
  const closeAdd = () => { setModal(false); setPreview(""); };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setForm((f) => ({ ...f, image: ev.target.result })); };
    reader.readAsDataURL(file);
  };

  const saveAdd = () => {
    if (!form.name.trim()) return;
    const weight = form.weightValue ? `${form.weightValue}${form.weightUnit}` : "";
    addProduct({ ...form, weight });
    closeAdd();
  };

  // ── Inline edit handlers ──
  const startEdit  = (p) => { setEditId(p.id); setEditForm(parseWeight(p)); setEditPreview(p.image || ""); };
  const cancelEdit = ()  => { setEditId(null); setEditForm({}); setEditPreview(""); };

  const handleEditImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setEditPreview(ev.target.result); setEditForm((f) => ({ ...f, image: ev.target.result })); };
    reader.readAsDataURL(file);
  };

  const saveEdit = () => {
    const weight = editForm.weightValue ? `${editForm.weightValue}${editForm.weightUnit}` : "";
    updateProduct({ ...editForm, weight });
    cancelEdit();
  };

  // ── Stats ──
  const totalProducts  = products.length;
  const inStockCount   = products.filter((p) => p.stock > LOW_STOCK_THRESHOLD).length;
  const lowStockCount  = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStock     = products.filter((p) => p.stock === 0).length;
  const lowStockItems  = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);

  // ── Filter categories for pills ──
  const allCats = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchSearch  = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat     = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <AdminLayout>
      {/* ── Top bar ── */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Product management</h2>
          <p>Manage all Aasai Foods products, stock &amp; details</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="btn-primary" onClick={openAdd}>
            <span className="btn-icon-box">+</span>
            Add new product
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Total products</div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-sub">across {Array.from(new Set(products.map((p) => p.category))).length} categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In stock</div>
          <div className="stat-value green">{inStockCount}</div>
          <div className="stat-sub">ready to sell</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low stock</div>
          <div className="stat-value yellow">{lowStockCount}</div>
          <div className="stat-sub">needs restock</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Out of stock</div>
          <div className="stat-value red">{outOfStock}</div>
          <div className="stat-sub">unavailable</div>
        </div>
      </div>

      {/* ── Low stock alert banner ── */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner">
          <span className="alert-icon-box" />
          <span>
            <strong>{lowStockItems[0].name}</strong> is running low ({lowStockItems[0].stock} units left).
            Consider restocking soon.
            {lowStockItems.length > 1 && ` (+${lowStockItems.length - 1} more)`}
          </span>
        </div>
      )}

      {/* ── Products table ── */}
      <div className="admin-table-wrap">
        {/* Header + filters */}
        <div className="admin-table-header">
          <div className="admin-table-header-left">
            <span className="deco-checkbox" />
            <span className="deco-checkbox" />
            <h3>All products</h3>
            <div className="filter-pills">
              {allCats.map((cat) => (
                <button
                  key={cat}
                  className={`filter-pill ${catFilter === cat ? "active" : ""}`}
                  onClick={() => setCatFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="controls">
            <input
              className="admin-search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Weight</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const stockStatus = getStockStatus(p.stock);
              return editId === p.id ? (
                /* ── Inline Edit Row ── */
                <tr key={p.id} className="edit-row">
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="thumb-upload" onClick={() => editFileRef.current.click()} title="Change image">
                        <img src={editPreview || p.image} alt="thumb" className="product-thumb" />
                        <span className="thumb-overlay">📷</span>
                      </div>
                      <div>
                        <input
                          className="inline-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ width: 140, marginBottom: 4, display: "block" }}
                          placeholder="Product name"
                        />
                        <input
                          className="inline-input"
                          value={editForm.description || ""}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          style={{ width: 200, fontSize: 11.5 }}
                          placeholder="Short description"
                        />
                      </div>
                      <input ref={editFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleEditImage} />
                    </div>
                  </td>
                  <td>
                    <select className="inline-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="inline-input" type="number" value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: +e.target.value })} style={{ width: 70 }} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input className="inline-input" type="number" value={editForm.weightValue}
                        onChange={(e) => setEditForm({ ...editForm, weightValue: e.target.value })} style={{ width: 52 }} placeholder="qty" />
                      <select className="inline-input" value={editForm.weightUnit}
                        onChange={(e) => setEditForm({ ...editForm, weightUnit: e.target.value })} style={{ width: 52 }}>
                        {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </td>
                  <td>
                    <input className="inline-input" type="number" value={editForm.stock}
                      onChange={(e) => setEditForm({ ...editForm, stock: +e.target.value })} style={{ width: 60 }} />
                  </td>
                  <td>
                    <select className="inline-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-green" style={{ padding: "5px 11px", fontSize: 12 }} onClick={saveEdit}>Save</button>
                      <button className="action-btn" onClick={cancelEdit}>✕</button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ── Normal Row ── */
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <img src={p.image} alt={p.name} className="product-thumb" style={{ marginTop: 1 }} />
                      <div>
                        <div className="product-name">{p.name}</div>
                        {p.description && (
                          <div className="product-desc">
                            {p.description.length > 55 ? p.description.slice(0, 55) + "…" : p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#777" }}>{p.category}</td>
                  <td style={{ color: "#d4d4d4", fontWeight: 600 }}>₹{p.price}</td>
                  <td style={{ color: "#777" }}>{p.weight || "—"}</td>
                  <td>
                    <span className={stockStatus.valCls}>{p.stock}</span>
                  </td>
                  <td>
                    <div className="badge-stack">
                      <span className={`badge ${stockStatus.cls}`}>{stockStatus.label}</span>
                      <span className={`badge ${p.status === "Active" ? "badge-olive" : "badge-gray"}`}>
                        {p.status === "Active" ? "active" : "draft"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" onClick={() => startEdit(p)}>✏️ Edit</button>
                      <button className="action-btn danger" onClick={() => deleteProduct(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && <div className="empty-state">No products found</div>}
      </div>

      {/* ── Add Product Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeAdd}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add new product</h3>
              <button className="modal-close" onClick={closeAdd}>✕</button>
            </div>
            <div className="modal-form">
              {/* Image upload */}
              <div className="form-field">
                <label>Product Image</label>
                <div className="img-upload-wrap" onClick={() => fileRef.current.click()}>
                  {preview
                    ? <img src={preview} alt="preview" className="img-preview" />
                    : <div className="img-placeholder">
                        <span>📷</span>
                        <span>Click to upload image</span>
                        <span className="img-hint">JPG, PNG, WEBP — max 5 MB</span>
                      </div>}
                  {preview && <div className="img-overlay"><span>📷 Change</span></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAddImage} />
              </div>

              <div className="form-field">
                <label>Product Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Millet Porridge Mix" />
              </div>

              <div className="form-field">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short product description…" />
              </div>

              <div className="form-field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Weight / Size</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" placeholder="e.g. 500" value={form.weightValue}
                    onChange={(e) => setForm({ ...form, weightValue: e.target.value })} style={{ flex: 1 }} />
                  <select value={form.weightUnit} onChange={(e) => setForm({ ...form, weightUnit: e.target.value })} style={{ width: 72 }}>
                    {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-field">
                  <label>Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Stock (units)</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
                </div>
              </div>

              <div className="form-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button className="btn-outline" onClick={closeAdd}>Cancel</button>
                <button className="btn-green"   onClick={saveAdd}>Save Product</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
