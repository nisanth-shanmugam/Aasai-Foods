import { useState } from "react";
import { useProducts } from "../../context/ProductContext";
import AdminLayout from "./AdminLayout";
import "./admin.css";

export default function AdminCategories() {
  const { products, categoryObjects, addCategory, updateCategory, deleteCategory } = useProducts();

  // ── Create form state ──
  const [newName, setNewName]   = useState("");
  const [saving,  setSaving]    = useState(false);
  const [createErr, setCreateErr] = useState("");

  // ── Edit state ──
  const [editId,   setEditId]   = useState(null);
  const [editName, setEditName] = useState("");
  const [editErr,  setEditErr]  = useState("");

  // ── Delete confirm ──
  const [confirmId, setConfirmId] = useState(null);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Build stats per category
  const catStats = categoryObjects.map((cat) => {
    const items      = products.filter((p) => p.category === cat.name);
    const inStock    = items.filter((p) => p.stock > 0).length;
    const outOfStock = items.filter((p) => p.stock === 0).length;
    return { ...cat, total: items.length, inStock, outOfStock };
  });

  // ── Handlers ──
  const handleCreate = async () => {
    setCreateErr("");
    if (!newName.trim()) { setCreateErr("Category name is required."); return; }
    setSaving(true);
    try {
      await addCategory(newName.trim());
      setNewName("");
      showToast("Category created successfully.");
    } catch (e) {
      setCreateErr(e?.response?.data?.error || "Failed to create category.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditErr("");
  };

  const handleEdit = async (id) => {
    setEditErr("");
    if (!editName.trim()) { setEditErr("Name cannot be empty."); return; }
    try {
      await updateCategory(id, editName.trim());
      setEditId(null);
      showToast("Category renamed successfully.");
    } catch (e) {
      setEditErr(e?.response?.data?.error || "Failed to update.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      setConfirmId(null);
      showToast("Category deleted.", "danger");
    } catch {
      showToast("Failed to delete category.", "danger");
    }
  };

  return (
    <AdminLayout>
      {/* Top bar */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Categories</h2>
          <p>Create, rename, or remove product categories</p>
        </div>
      </div>

      {/* Stat row */}
      <div className="stat-cards" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Total Categories</div>
          <div className="stat-value">{categoryObjects.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value green">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value red">{products.filter((p) => p.stock === 0).length}</div>
        </div>
      </div>

      {/* Split layout */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>

        {/* ── LEFT: Create form ── */}
        <div className="admin-table-wrap" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#d4d4d4", marginBottom: 16 }}>
            Create New Category
          </h3>

          <div className="modal-form" style={{ gap: 10 }}>
            <div className="form-field">
              <label>Category Name</label>
              <input
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setCreateErr(""); }}
                placeholder="e.g. Organic Grains"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              {createErr && (
                <span style={{ fontSize: 11, color: "#f87171", marginTop: 3 }}>{createErr}</span>
              )}
            </div>

            <button
              className="btn-green"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Creating…" : "+ Create Category"}
            </button>
          </div>

          <div style={{ marginTop: 20, padding: "14px 0 0", borderTop: "1px solid #252525" }}>
            <div style={{ fontSize: 11, color: "#454545", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Tips
            </div>
            <ul style={{ fontSize: 12, color: "#555", lineHeight: 1.9, paddingLeft: 16 }}>
              <li>Keep names short and descriptive</li>
              <li>Deleting removes the category — products become uncategorised</li>
              <li>Rename updates all linked products instantly</li>
            </ul>
          </div>
        </div>

        {/* ── RIGHT: Category table ── */}
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <h3>
              All Categories
              <span style={{ color: "#454545", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                ({catStats.length})
              </span>
            </h3>
          </div>

          {catStats.length === 0 ? (
            <div className="empty-state">No categories yet — create one on the left.</div>
          ) : (
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
                {catStats.map((c) => (
                  <tr key={c.id}>
                    {/* Name / inline edit */}
                    <td style={{ fontWeight: 600, color: "#e5e5e5", minWidth: 160 }}>
                      {editId === c.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <input
                            className="inline-input"
                            value={editName}
                            autoFocus
                            onChange={(e) => { setEditName(e.target.value); setEditErr(""); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")  handleEdit(c.id);
                              if (e.key === "Escape") setEditId(null);
                            }}
                            style={{ width: 170 }}
                          />
                          {editErr && (
                            <span style={{ fontSize: 11, color: "#f87171" }}>{editErr}</span>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>🏷️</span>
                          {c.name}
                        </div>
                      )}
                    </td>

                    <td style={{ color: "#aaa" }}>{c.total}</td>

                    <td>
                      <span className="badge badge-green">{c.inStock}</span>
                    </td>

                    <td>
                      {c.outOfStock > 0
                        ? <span className="badge badge-red">{c.outOfStock}</span>
                        : <span className="badge badge-gray">0</span>}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-btns">
                        {editId === c.id ? (
                          <>
                            <button
                              className="btn-green"
                              style={{ padding: "5px 11px", fontSize: 12 }}
                              onClick={() => handleEdit(c.id)}
                            >
                              Save
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => setEditId(null)}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="action-btn"
                              title="Rename"
                              onClick={() => startEdit(c)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="action-btn danger"
                              title="Delete"
                              onClick={() => setConfirmId(c.id)}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmId !== null && (() => {
        const cat = catStats.find((c) => c.id === confirmId);
        return (
          <div className="modal-overlay" onClick={() => setConfirmId(null)}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Category</h3>
                <button className="modal-close" onClick={() => setConfirmId(null)}>✕</button>
              </div>
              <div style={{ padding: "6px 0 18px", fontSize: 13.5, color: "#aaa", lineHeight: 1.6 }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: "#e5e5e5" }}>{cat?.name}</strong>?
                {cat?.total > 0 && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 8, fontSize: 12.5, color: "#f87171" }}>
                    ⚠ This category has <strong>{cat.total}</strong> product{cat.total !== 1 ? "s" : ""}.
                    They will become uncategorised.
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
                <button
                  style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
                  onClick={() => handleDelete(confirmId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Toast ── */}
      {toast && (
        <div className="admin-toast" style={{ borderLeftColor: toast.type === "danger" ? "#f87171" : "#4ade80" }}>
          {toast.type === "danger" ? "🗑️" : "✅"} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}
