import { useState } from "react";
import { useAuth }  from "../../context/AuthContext";
import api          from "../../api/axios";
import AdminLayout  from "./AdminLayout";
import "./admin.css";

export default function AdminSettings() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({
    name:  user?.name  || "",
    phone: user?.phone || "",
  });
  const [pwd, setPwd] = useState({ current: "", new: "", confirm: "" });
  const [msg, setMsg] = useState({ profile: "", pwd: "" });
  const [err, setErr] = useState({ profile: "", pwd: "" });
  const [saving, setSaving]   = useState({ profile: false, pwd: false });

  const flash = (field, type, text) => {
    if (type === "ok") setMsg((m) => ({ ...m, [field]: text }));
    else               setErr((e) => ({ ...e, [field]: text }));
    setTimeout(() => {
      setMsg((m) => ({ ...m, [field]: "" }));
      setErr((e) => ({ ...e, [field]: "" }));
    }, 3000);
  };

  const saveProfile = async () => {
    setSaving((s) => ({ ...s, profile: true }));
    try {
      const { data } = await api.patch("/auth/me/", profile);
      setUser(data);
      flash("profile", "ok", "Profile saved.");
    } catch (e) {
      flash("profile", "err", e.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving((s) => ({ ...s, profile: false }));
    }
  };

  const savePassword = async () => {
    if (pwd.new !== pwd.confirm) return flash("pwd", "err", "Passwords do not match.");
    if (pwd.new.length < 8)      return flash("pwd", "err", "Password must be at least 8 characters.");
    setSaving((s) => ({ ...s, pwd: true }));
    try {
      await api.post("/auth/me/password/", { current_password: pwd.current, new_password: pwd.new });
      setPwd({ current: "", new: "", confirm: "" });
      flash("pwd", "ok", "Password changed.");
    } catch (e) {
      flash("pwd", "err", e.response?.data?.error || "Failed to change password.");
    } finally {
      setSaving((s) => ({ ...s, pwd: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <h2>Settings</h2>
          <p>Manage your admin account</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Profile */}
        <div className="admin-table-wrap" style={{ padding: 22 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 14, marginBottom: 3 }}>Account Profile</div>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>Update your name and phone number</div>
          </div>
          <div className="modal-form">
            <div className="form-field">
              <label>Email</label>
              <input value={user?.email || ""} disabled style={{ opacity: 0.55, cursor: "not-allowed" }} />
            </div>
            <div className="form-field">
              <label>Display Name</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="form-field">
              <label>Phone</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <button className="btn-primary" onClick={saveProfile} disabled={saving.profile}>
                {saving.profile ? "Saving…" : "Save Profile"}
              </button>
              {msg.profile && <span style={{ color: "var(--color-success-text)", fontSize: 12, fontWeight: 500 }}>✓ {msg.profile}</span>}
              {err.profile && <span style={{ color: "var(--color-danger-text)", fontSize: 12, fontWeight: 500 }}>⚠ {err.profile}</span>}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="admin-table-wrap" style={{ padding: 22 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 14, marginBottom: 3 }}>Change Password</div>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>Must be at least 8 characters</div>
          </div>
          <div className="modal-form">
            <div className="form-field">
              <label>Current Password</label>
              <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="form-field">
              <label>New Password</label>
              <input type="password" value={pwd.new} onChange={(e) => setPwd({ ...pwd, new: e.target.value })} placeholder="Min 8 characters" />
            </div>
            <div className="form-field">
              <label>Confirm New Password</label>
              <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Repeat new password" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <button className="btn-primary" onClick={savePassword} disabled={saving.pwd}>
                {saving.pwd ? "Changing…" : "Change Password"}
              </button>
              {msg.pwd && <span style={{ color: "var(--color-success-text)", fontSize: 12, fontWeight: 500 }}>✓ {msg.pwd}</span>}
              {err.pwd && <span style={{ color: "var(--color-danger-text)", fontSize: 12, fontWeight: 500 }}>⚠ {err.pwd}</span>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
