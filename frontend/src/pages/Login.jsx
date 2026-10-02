import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";
import GoogleOAuthButton from "../components/GoogleOAuthButton";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setFieldError({ email: false, password: false });
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login/", form);
      const user = await login(data);
      navigate(user.role === "admin" ? "/admin" : "/home", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      if (status === 401) {
        setError(msg || "Incorrect email or password.");
        setFieldError({ email: true, password: true });
      } else if (status === 403) {
        setError("Your account has been disabled. Contact support.");
        setFieldError({ email: true, password: false });
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setFieldError({ email: false, password: false });
    setError("");
  };



  return (
    <div className="auth-page">
      <div className={`auth-card ${shake ? "form-shake" : ""}`}>
        <div className="auth-brand">
          <h1 className="auth-logo-name">
            <span className="auth-logo-aasai">Aasai</span>
            <span className="auth-logo-foods"> Foods</span>
          </h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <hr style={{ borderColor: "#2d2d2d", borderStyle: "solid", borderWidth: "0 0 1px 0", margin: "0 -32px" }} />

        <div className="auth-tabs">
          <button type="button" className="auth-tab active">
            Sign in
          </button>
          <button type="button" className="auth-tab" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>

        <div className="auth-demo-box">
          <div className="auth-demo-title">Try demo:</div>
          <div className="auth-demo-line" onClick={() => fillDemo("admin@aasai.com", "admin123")}>
            Admin — admin@aasai.com / admin123
          </div>
          <div className="auth-demo-line" onClick={() => fillDemo("priya@gmail.com", "customer123")}>
            Customer — priya@gmail.com / customer123
          </div>
        </div>

        {error && (
          <div className="auth-alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label>Email address</label>
            <div className="input-wrap">
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setFieldError((f) => ({ ...f, email: false }));
                  setError("");
                }}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="field-group">
            <label>Password</label>
            <div className="input-wrap">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setFieldError((f) => ({ ...f, password: false }));
                  setError("");
                }}
                required
                autoComplete="current-password"
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

          <div className="forgot-password-wrap">
            <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <GoogleOAuthButton />
      </div>
    </div>
  );
}
