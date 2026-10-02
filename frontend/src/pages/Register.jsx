import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import GoogleOAuthButton from "../components/GoogleOAuthButton";
import "../styles/auth.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", password2: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/", form);
      const user = await login(data);
      navigate(user.role === "admin" ? "/admin" : "/home", { replace: true });
    } catch (err) {
      const errs = err.response?.data;
      setError(errs?.error || Object.values(errs || {}).flat().join(" ") || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-logo-name">
            <span className="auth-logo-aasai">Aasai</span>
            <span className="auth-logo-foods"> Foods</span>
          </h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        <hr style={{ borderColor: "#2d2d2d", borderStyle: "solid", borderWidth: "0 0 1px 0", margin: "0 -32px" }} />

        <div className="auth-tabs">
          <button type="button" className="auth-tab" onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button type="button" className="auth-tab active">
            Register
          </button>
        </div>

        {error && (
          <div className="auth-alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <input
                type="text"
                placeholder="Karthik Raja"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="field-group">
            <label>Email address</label>
            <div className="input-wrap">
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Phone <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <div className="input-wrap">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2-col">
            <div className="field-group">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 8 chars"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="toggle-pwd" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="field-group">
              <label>Confirm</label>
              <div className="input-wrap">
                <input
                  type="password"
                  placeholder="Re-enter"
                  value={form.password2}
                  onChange={(e) => setForm({ ...form, password2: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" style={{ marginTop: "10px" }} disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <GoogleOAuthButton />

          
      </div>
    </div>
  );
}
