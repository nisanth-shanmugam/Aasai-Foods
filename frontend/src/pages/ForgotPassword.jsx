import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ code: "", new_password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/", { email });
      setMessage(data.message);
      setStep("reset");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password/", { email, ...form });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Please try again.");
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
          <p className="auth-subtitle" style={{ fontWeight: 600 }}>Reset Password</p>
          <p className="auth-subtitle" style={{ fontSize: "13px", color: "#8e8e8e", marginTop: "4px" }}>
            {step === "request"
              ? "Enter your email and we'll send you an OTP."
              : "Enter the OTP and your new password."}
          </p>
        </div>

        <hr style={{ borderColor: "#2d2d2d", borderStyle: "solid", borderWidth: "0 0 1px 0", margin: "0 -32px" }} />

        {step === "reset" && (
          <div className="step-indicator">
            <span className="step done">1</span>
            <span className="step-line done" />
            <span className="step active">2</span>
          </div>
        )}

        {error && (
          <div className="auth-alert">
            <span>⚠️</span> {error}
          </div>
        )}
        {message && (
          <div className="auth-success">
            <span>✅</span> {message}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequest} className="auth-form">
            <div className="field-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="auth-form">
            <div className="field-group">
              <label>OTP Code</label>
              <div className="input-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/, "") })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field-group">
              <label>New Password</label>
              <div className="input-wrap">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  required
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

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Reset Password"}
            </button>
            <button
              type="button"
              className="auth-submit-btn"
              style={{ backgroundColor: "transparent", border: "1px dashed #444", color: "#a3a3a3", marginTop: "4px" }}
              onClick={() => setStep("request")}
            >
              ← Back
            </button>
          </form>
        )}

        <p className="auth-subtitle" style={{ fontSize: "13.5px", marginTop: "12px", textAlign: "center" }}>
          Remember your password? <Link to="/login" className="forgot-password-link" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
