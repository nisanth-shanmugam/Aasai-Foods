import React, { useState } from "react";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "./AdminLayout";
import "./aasai_admin.css";
import "./admin.css";

/* ── Products tab ──────────────────────────────────────────── */
function ProductsTab() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useProducts();

  const [activeCat, setActiveCat] = useState("all");
  const [searchVal, setSearchVal] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx]     = useState("");
  const [form, setForm] = useState({ name: "", desc: "", cat: "", price: "", weight: "", stock: "", lowat: "10", status: "active" });
  const [toastMsg, setToastMsg]   = useState("");
  const [toastShow, setToastShow] = useState(false);
  let toastTimer;

  function stockBadge(s, low) {
    if (s === 0)    return <span className="badge b-out">Out of stock</span>;
    if (s <= low)   return <span className="badge b-low">Low stock</span>;
    return                 <span className="badge b-in">In stock</span>;
  }

  function showToast(msg) {
    setToastMsg(msg); setToastShow(true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToastShow(false), 2500);
  }

  const filtered = products.filter((p) => {
    const catOk = activeCat === "all" || (p.category || "").toLowerCase() === activeCat;
    const qOk   = !searchVal || (p.name || "").toLowerCase().includes(searchVal.toLowerCase()) || (p.category || "").toLowerCase().includes(searchVal.toLowerCase());
    return catOk && qOk;
  });

  function openModal(reset = true) {
    if (reset) { setEditIdx(""); setForm({ name: "", desc: "", cat: "", price: "", weight: "", stock: "", lowat: "10", status: "active" }); }
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); }

  async function saveProduct() {
    const n  = (form.name || "").trim();
    const c  = form.cat;
    const pr = parseInt(form.price) || 0;
    const st = parseInt(form.stock) || 0;
    if (!n || !c || !pr) return alert("Please fill in name, category and price.");
    const obj = { name: n, description: form.desc, category: c, price: pr, weight: form.weight, stock: st, lowat: parseInt(form.lowat) || 10, status: form.status === "active" ? "Active" : "Inactive" };
    try {
      if (editIdx === "") { await addProduct(obj); showToast("Product added!"); }
      else                { await updateProduct({ ...obj, id: editIdx }); showToast("Product updated!"); }
      closeModal();
    } catch (err) { console.error(err); alert("Save failed"); }
  }

  function edit(p) {
    setEditIdx(p.id);
    setForm({ name: p.name, desc: p.description || "", cat: p.category || "", price: String(p.price), weight: p.weight || "", stock: String(p.stock || 0), lowat: String(p.lowat || 10), status: p.status === "Active" ? "active" : "draft" });
    openModal(false);
  }

  function quickStock(p) {
    const val = prompt(`Update stock for "${p.name}"\nCurrent: ${p.stock} units\n\nEnter new quantity:`, p.stock);
    if (val !== null && val.trim() !== "") {
      const n = parseInt(val);
      if (!isNaN(n) && n >= 0) { updateProduct({ ...p, stock: n }); showToast("Stock updated!"); }
    }
  }

  function toggleStatus(p) {
    const s = p.status === "Active" ? "Inactive" : "Active";
    updateProduct({ ...p, status: s });
    showToast(`Set to ${s.toLowerCase()}.`);
  }

  async function del(p) {
    if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
      try { await deleteProduct(p.id); showToast("Product deleted."); } catch (err) { console.error(err); }
    }
  }

  const lowStockItems  = products.filter(p => p.stock > 0 && p.stock <= (p.lowat || 10));
  const outOfStockItems = products.filter(p => p.stock === 0);
  const warnItems = outOfStockItems.length ? outOfStockItems : lowStockItems;
  const warnBg    = outOfStockItems.length ? "#FCEBEB" : "#FAEEDA";
  const warnColor = outOfStockItems.length ? "#791F1F" : "#633806";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Stats */}
      <div className="stats">
        <div className="stat"><div className="lbl">Total products</div><div className="val">{products.length}</div><div className="sub">in catalogue</div></div>
        <div className="stat"><div className="lbl">In stock</div><div className="val" style={{ color: "var(--color-success-text)" }}>{products.filter(p => p.stock > (p.lowat || 10)).length}</div><div className="sub">ready to sell</div></div>
        <div className="stat"><div className="lbl">Low stock</div><div className="val" style={{ color: "var(--color-warning-text)" }}>{lowStockItems.length}</div><div className="sub">needs restock</div></div>
        <div className="stat"><div className="lbl">Out of stock</div><div className="val" style={{ color: "var(--color-danger-text)" }}>{outOfStockItems.length}</div><div className="sub">unavailable</div></div>
      </div>

      {/* Warning banner */}
      {warnItems.length > 0 && (
        <div className="warn-bar" style={{ background: warnBg, color: warnColor }}>
          <i className="ti ti-alert-triangle" />
          <span>{warnItems.map(p => p.name).join(", ")} {warnItems.length > 1 ? "are" : "is"} {outOfStockItems.length ? "out of stock" : "running low"}.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <i className="ti ti-search" />
          <input type="text" placeholder="Search by name or category..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
        </div>
        <button className={`flt ${activeCat === "all" ? "on" : ""}`} onClick={() => setActiveCat("all")}>All</button>
        {Array.from(new Set(products.map(p => p.category))).filter(c => c).map((c) => (
          <button key={c} className={`flt ${activeCat === c.toLowerCase() ? "on" : ""}`} onClick={() => setActiveCat(c.toLowerCase())}>{c}</button>
        ))}
        <button className="btn-add" style={{ marginLeft: "auto" }} onClick={() => openModal()}><i className="ti ti-plus" /> Add product</button>
      </div>

      {/* Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: "26%" }}>Product</th>
              <th style={{ width: "13%" }}>Category</th>
              <th style={{ width: "9%" }}>Price</th>
              <th style={{ width: "9%" }}>Weight</th>
              <th style={{ width: "9%" }}>Stock</th>
              <th style={{ width: "16%" }}>Status</th>
              <th style={{ width: "18%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7"><div className="empty"><i className="ti ti-package" style={{ fontSize: "28px", display: "block", marginBottom: "8px" }} />No products found</div></td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td><div className="pname">{p.name}</div><div className="psub">{(p.description || "").substring(0, 42)}…</div></td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>{p.category}</td>
                  <td style={{ fontWeight: "500" }}>₹{p.price}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{p.weight}</td>
                  <td><span style={{ fontWeight: "500", color: p.stock === 0 ? "var(--color-danger-text)" : p.stock <= (p.lowat || 10) ? "var(--color-warning-text)" : "var(--color-text-primary)" }}>{p.stock}</span></td>
                  <td>{stockBadge(p.stock, p.lowat || 10)} <span className={`badge ${p.status === "Active" ? "b-active" : "b-draft"}`} style={{ marginLeft: "4px" }}>{(p.status || "active").toLowerCase()}</span></td>
                  <td><div className="acts">
                    <button className="act" onClick={() => edit(p)}><i className="ti ti-edit" /></button>
                    <button className="act" onClick={() => quickStock(p)} title="Update stock"><i className="ti ti-stack" /></button>
                    <button className="act" onClick={() => toggleStatus(p)} title={p.status === "Active" ? "Set draft" : "Set active"}><i className={`ti ti-${p.status === "Active" ? "eye-off" : "eye"}`} /></button>
                    <button className="act danger" onClick={() => del(p)}><i className="ti ti-trash" /></button>
                  </div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <div className={`modal-bg ${modalOpen ? "open" : ""}`}>
        <div className="modal">
          <div className="mhead">
            <h3>{editIdx === "" ? "Add product" : "Edit product"}</h3>
            <button className="mclose" onClick={closeModal}><i className="ti ti-x" /></button>
          </div>
          <div className="mbody">
            <div className="fg full"><label>Product name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Millet Porridge Mix" /></div>
            <div className="fg full"><label>Description</label><textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Short product description..." /></div>
            <div className="fg"><label>Category *</label>
              <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                <option value="">Select...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg"><label>Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="249" min="0" /></div>
            <div className="fg"><label>Weight / Volume</label><input type="text" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="400g or 500ml" /></div>
            <div className="fg"><label>Stock quantity *</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" min="0" /></div>
            <div className="fg"><label>Low stock alert at</label><input type="number" value={form.lowat} onChange={(e) => setForm({ ...form, lowat: e.target.value })} placeholder="10" min="0" /></div>
            <div className="fg"><label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active — visible on site</option>
                <option value="draft">Draft — hidden</option>
              </select>
            </div>
          </div>
          <div className="mfoot">
            <button className="btn-cancel" onClick={closeModal}>Cancel</button>
            <button className="btn-save" onClick={saveProduct}>Save product</button>
          </div>
        </div>
      </div>

      <div className={`toast ${toastShow ? "show" : ""}`}><i className="ti ti-check" /><span>{toastMsg}</span></div>
    </div>
  );
}

/* ── Categories tab ────────────────────────────────────────── */
function CategoriesTab() {
  const { products, categoryObjects, addCategory, updateCategory, deleteCategory } = useProducts();

  const [newName,   setNewName]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [editId,    setEditId]    = useState(null);
  const [editName,  setEditName]  = useState("");
  const [editErr,   setEditErr]   = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const catStats = categoryObjects.map((cat) => {
    const items = products.filter((p) => p.category === cat.name);
    return { ...cat, total: items.length, inStock: items.filter(p => p.stock > 0).length, outOfStock: items.filter(p => p.stock === 0).length };
  });

  const handleCreate = async () => {
    setCreateErr("");
    if (!newName.trim()) { setCreateErr("Category name is required."); return; }
    setSaving(true);
    try { await addCategory(newName.trim()); setNewName(""); showToast("Category created."); }
    catch (e) { setCreateErr(e?.response?.data?.error || "Failed to create category."); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id) => {
    setEditErr("");
    if (!editName.trim()) { setEditErr("Name cannot be empty."); return; }
    try { await updateCategory(id, editName.trim()); setEditId(null); showToast("Category renamed."); }
    catch (e) { setEditErr(e?.response?.data?.error || "Failed to update."); }
  };

  const handleDelete = async (id) => {
    try { await deleteCategory(id); setConfirmId(null); showToast("Category deleted.", "danger"); }
    catch { showToast("Failed to delete category.", "danger"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Stats */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat"><div className="lbl">Total Categories</div><div className="val">{categoryObjects.length}</div></div>
        <div className="stat"><div className="lbl">Total Products</div><div className="val" style={{ color: "var(--color-success-text)" }}>{products.length}</div></div>
        <div className="stat"><div className="lbl">Out of Stock</div><div className="val" style={{ color: "var(--color-danger-text)" }}>{products.filter(p => p.stock === 0).length}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>
        {/* Create form */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 14 }}>New Category</div>
          <div className="fg full" style={{ marginBottom: 8 }}>
            <label>Category Name</label>
            <input value={newName} onChange={(e) => { setNewName(e.target.value); setCreateErr(""); }} placeholder="e.g. Organic Grains" onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            {createErr && <span style={{ fontSize: 11, color: "var(--color-danger-text)", marginTop: 3, display: "block" }}>{createErr}</span>}
          </div>
          <button className="btn-save" style={{ width: "100%", justifyContent: "center" }} onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "+ Create Category"}
          </button>
          <ul style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.9, paddingLeft: 16, marginTop: 16, borderTop: "0.5px solid var(--color-border)", paddingTop: 14 }}>
            <li>Keep names short and descriptive</li>
            <li>Deleting uncategorises linked products</li>
            <li>Rename updates all linked products</li>
          </ul>
        </div>

        {/* Categories table */}
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>In Stock</th>
                <th>Out of Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {catStats.length === 0 ? (
                <tr><td colSpan="5"><div className="empty">No categories yet — create one.</div></td></tr>
              ) : catStats.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text-primary)", minWidth: 160 }}>
                    {editId === c.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input className="inline-input" value={editName} autoFocus
                          onChange={(e) => { setEditName(e.target.value); setEditErr(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleEdit(c.id); if (e.key === "Escape") setEditId(null); }}
                          style={{ width: 170 }} />
                        {editErr && <span style={{ fontSize: 11, color: "var(--color-danger-text)" }}>{editErr}</span>}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>🏷️ {c.name}</div>
                    )}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{c.total}</td>
                  <td><span className="badge b-in">{c.inStock}</span></td>
                  <td>{c.outOfStock > 0 ? <span className="badge b-out">{c.outOfStock}</span> : <span className="badge b-draft">0</span>}</td>
                  <td>
                    <div className="acts">
                      {editId === c.id ? (
                        <>
                          <button className="act" style={{ color: "var(--color-success-text)" }} onClick={() => handleEdit(c.id)}><i className="ti ti-check" /></button>
                          <button className="act" onClick={() => setEditId(null)}><i className="ti ti-x" /></button>
                        </>
                      ) : (
                        <>
                          <button className="act" onClick={() => { setEditId(c.id); setEditName(c.name); setEditErr(""); }}><i className="ti ti-edit" /></button>
                          <button className="act danger" onClick={() => setConfirmId(c.id)}><i className="ti ti-trash" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmId !== null && (() => {
        const cat = catStats.find((c) => c.id === confirmId);
        return (
          <div className="modal-bg open" onClick={() => setConfirmId(null)}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
              <div className="mhead">
                <h3>Delete Category</h3>
                <button className="mclose" onClick={() => setConfirmId(null)}><i className="ti ti-x" /></button>
              </div>
              <div style={{ padding: "6px 0 18px", fontSize: 13.5, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Delete <strong style={{ color: "var(--color-text-primary)" }}>{cat?.name}</strong>?
                {cat?.total > 0 && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--color-danger-bg)", border: "0.5px solid var(--color-border)", borderRadius: 8, fontSize: 12.5, color: "var(--color-danger-text)" }}>
                    ⚠ {cat.total} product{cat.total !== 1 ? "s" : ""} will become uncategorised.
                  </div>
                )}
              </div>
              <div className="mfoot">
                <button className="btn-cancel" onClick={() => setConfirmId(null)}>Cancel</button>
                <button style={{ padding: "8px 18px", borderRadius: 8, background: "var(--color-danger-bg)", border: "0.5px solid var(--color-danger-text)", color: "var(--color-danger-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-admin)" }} onClick={() => handleDelete(confirmId)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div className="admin-toast" style={{ borderLeftColor: toast.type === "danger" ? "var(--color-danger-text)" : "var(--color-primary)" }}>
          {toast.type === "danger" ? "🗑️" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function AdminProductsUI() {
  const [tab, setTab] = useState("products");

  return (
    <AdminLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Top bar */}
        <div className="topbar">
          <div>
            <div className="page-title">Product &amp; Category Management</div>
            <div className="page-sub">Manage your Aasai Foods catalogue and categories</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid var(--color-border)", paddingBottom: 0 }}>
          {[{ key: "products", icon: "ti-package", label: "Products" }, { key: "categories", icon: "ti-category", label: "Categories" }].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "none", border: "none", fontFamily: "inherit",
                color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                borderBottom: tab === key ? "2px solid var(--color-primary)" : "2px solid transparent",
                marginBottom: -1, display: "flex", alignItems: "center", gap: 7, transition: "color .15s",
              }}
            >
              <i className={`ti ${icon}`} />
              {label}
            </button>
          ))}
        </div>

        {tab === "products"   ? <ProductsTab />   : <CategoriesTab />}
      </div>
    </AdminLayout>
  );
}
