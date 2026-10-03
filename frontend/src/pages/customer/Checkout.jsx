import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrderContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Navbar from "./Navbar";
import "./customer.css";

const STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "Maharashtra", "Gujarat", "Rajasthan", "Delhi", "West Bengal"
];

const PAYMENT_OPTIONS = [
  { id: "upi", label: "UPI / QR Code Pay", icon: "📱", desc: "Google Pay, PhonePe, Paytm, BHIM QR", tag: "Recommended" },
  { id: "cod", label: "Cash on Delivery",   icon: "💵", desc: "Pay with cash when delivered" },
];

function getSavedAddresses() {
  try { return JSON.parse(localStorage.getItem("aasai_addresses") || "[]"); } catch { return []; }
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const saved = getSavedAddresses();
  const [payment, setPayment]         = useState("upi");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  // Delivery details state
  const [addr, setAddr] = useState(
    saved[0] || {
      name: user?.name || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
    }
  );

  // OTP State
  const [otpSent, setOtpSent]         = useState(false);
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [otpCode, setOtpCode]         = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(Boolean(user?.phone));
  const [otpNotice, setOtpNotice]     = useState("");

  // UPI Payment State
  const [utr, setUtr]                 = useState("");
  const [screenshot, setScreenshot]   = useState(null);
  const [ssPreview, setSsPreview]     = useState("");
  const [copiedUpi, setCopiedUpi]     = useState(false);

  const shipping = total >= 499 ? 0 : 40;
  const grandTotal = total + shipping;

  if (items.length === 0 && !placedOrder) {
    navigate("/products", { replace: true });
    return null;
  }

  // Handle Copy UPI ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText("nisanthshri143@okicici");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handle Send Phone OTP
  const handleSendOtp = async () => {
    if (!addr.phone || addr.phone.length < 10) {
      setError("Please enter a valid 10-digit phone number first.");
      return;
    }
    setError("");
    setSendingOtp(true);
    try {
      const { data } = await api.post("/accounts/send-otp/", { phone: addr.phone });
      setOtpSent(true);
      setOtpNotice(`📩 OTP sent to ${addr.phone}. (Demo code: ${data.otp})`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify Phone OTP
  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    setError("");
    setVerifyingOtp(true);
    try {
      await api.post("/accounts/verify-otp/", { phone: addr.phone, code: otpCode });
      setPhoneVerified(true);
      setOtpNotice("✅ Phone number verified successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP code. Please check and try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Screenshot file change
  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setSsPreview(URL.createObjectURL(file));
    }
  };

  // Handle Submit Payment / Place Order
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phoneVerified) {
      setError("Please verify your phone number with OTP before submitting payment.");
      return;
    }

    if (payment === "upi" && !utr.trim()) {
      setError("Please enter your 12-digit UPI Transaction ID / UTR after completing payment.");
      return;
    }

    setSubmitting(true);

    // Save address if new
    const exists = saved.find((a) => a.address === addr.address && a.pincode === addr.pincode);
    if (!exists) {
      const updated = [addr, ...saved].slice(0, 5);
      localStorage.setItem("aasai_addresses", JSON.stringify(updated));
    }

    const addressString = `${addr.name} | ${addr.phone} | ${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`;

    try {
      const payload = {
        customer_name: addr.name || user?.name || user?.email,
        phone: addr.phone,
        address: addressString,
        payment_method: payment,
        utr_number: utr.trim(),
        items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
      };

      const newOrder = await addOrder(payload, screenshot);
      clearCart();
      setPlacedOrder(newOrder);
    } catch (err) {
      console.error(err);
      setError("Unable to process payment & order. Please check all details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SUCCESS VIEW: Displayed after customer submits UPI / Order
  // ─────────────────────────────────────────────────────────────
  if (placedOrder) {
    return (
      <>
        <Navbar />
        <div className="customer-page" style={{ maxWidth: 800, margin: "40px auto" }}>
          <div className="order-success-card">
            <div className="success-icon-wrap">
              <span className="success-icon">✓</span>
            </div>
            
            <h2 className="success-title">Payment Submitted Successfully!</h2>
            
            <div className="success-msg-box">
              <span style={{ fontSize: 24 }}>⏳</span>
              <div>
                <strong style={{ fontSize: 16 }}>Payment submitted. Your order will be confirmed after admin verification.</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, opacity: 0.9 }}>
                  Our team is verifying your payment UTR code. You will receive an update shortly.
                </p>
              </div>
            </div>

            <div className="order-summary-box">
              <div className="os-row">
                <span className="os-lbl">Order ID:</span>
                <strong className="os-val" style={{ color: "#16a34a" }}>{placedOrder.id}</strong>
              </div>
              <div className="os-row">
                <span className="os-lbl">Order Status:</span>
                <span className="status-pill status-verification-pending">
                  Payment Verification Pending
                </span>
              </div>
              <div className="os-row">
                <span className="os-lbl">Amount Paid:</span>
                <strong className="os-val">₹{placedOrder.amount?.toLocaleString("en-IN")}</strong>
              </div>
              {placedOrder.utrNumber && (
                <div className="os-row">
                  <span className="os-lbl">UPI UTR / Trans ID:</span>
                  <span className="utr-code-badge">{placedOrder.utrNumber}</span>
                </div>
              )}
              <div className="os-row">
                <span className="os-lbl">Customer Name:</span>
                <span className="os-val">{placedOrder.customer}</span>
              </div>
              <div className="os-row">
                <span className="os-lbl">Delivery Phone:</span>
                <span className="os-val">{placedOrder.phone}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 24, justifyContent: "center" }}>
              <button
                className="cust-btn-primary"
                onClick={() => navigate("/profile?tab=orders")}
                style={{ padding: "12px 24px" }}
              >
                Track My Orders 📦
              </button>
              <button
                className="cust-btn-outline"
                onClick={() => navigate("/products")}
                style={{ padding: "12px 24px" }}
              >
                Continue Shopping 🛍️
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN CHECKOUT FORM
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="customer-page">
        <div style={{ marginBottom: 24 }}>
          <h2 className="page-heading">Checkout</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Complete your order with secure UPI QR payment</p>
        </div>

        {error && (
          <div className="pf-alert pf-alert-err" style={{ marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {otpNotice && (
          <div className="pf-alert pf-alert-info" style={{ marginBottom: 20, background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}>
            {otpNotice}
          </div>
        )}

        <form onSubmit={handleOrderSubmit}>
          <div className="checkout-layout">
            <div>
              {/* SAVED ADDRESSES */}
              {saved.length > 0 && (
                <div className="checkout-section">
                  <h3>📍 Saved Delivery Addresses</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {saved.map((a, i) => (
                      <label
                        key={i}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "12px 14px",
                          border: `1.5px solid ${addr.address === a.address && addr.pincode === a.pincode ? "#16a34a" : "#e5e7eb"}`,
                          borderRadius: 10, cursor: "pointer",
                          background: addr.address === a.address && addr.pincode === a.pincode ? "#f0fdf4" : "#fff",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="radio" name="saved_addr" style={{ accentColor: "#16a34a", marginTop: 3 }}
                          checked={addr.address === a.address && addr.pincode === a.pincode}
                          onChange={() => setAddr(a)}
                        />
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                          <strong style={{ color: "#111827" }}>{a.name}</strong> · {a.phone}<br />
                          {a.address}, {a.city}, {a.state} – {a.pincode}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. DELIVERY & PHONE OTP VERIFICATION */}
              <div className="checkout-section">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3>📍 1. Delivery Details & Phone OTP</h3>
                  {phoneVerified && (
                    <span className="verified-badge">✓ Phone Verified</span>
                  )}
                </div>

                <div className="form-grid" style={{ marginTop: 14 }}>
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input
                      value={addr.name}
                      onChange={(e) => setAddr({ ...addr, name: e.target.value })}
                      placeholder="Nisanth Shanmugam" required
                    />
                  </div>

                  <div className="form-field">
                    <label>Phone Number * {phoneVerified && <span style={{ color: "#16a34a" }}>(Verified)</span>}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={addr.phone}
                        onChange={(e) => {
                          setAddr({ ...addr, phone: e.target.value });
                          setPhoneVerified(false);
                          setOtpSent(false);
                        }}
                        placeholder="9876543210"
                        required
                        maxLength={15}
                        style={{ flex: 1 }}
                      />
                      {!phoneVerified && (
                        <button
                          type="button"
                          className="cust-btn-outline"
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                          style={{ padding: "0 12px", fontSize: 12, whiteSpace: "nowrap" }}
                        >
                          {sendingOtp ? "Sending…" : otpSent ? "Resend OTP" : "Verify OTP"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* OTP INPUT SECTION */}
                  {otpSent && !phoneVerified && (
                    <div className="form-field" style={{ gridColumn: "1/-1", background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px dashed #cbd5e1" }}>
                      <label style={{ color: "#1e293b", fontWeight: 600 }}>Enter 6-Digit OTP Code *</label>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <input
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          style={{ flex: 1, letterSpacing: 4, fontWeight: 700, fontSize: 16 }}
                        />
                        <button
                          type="button"
                          className="cust-btn-primary"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp}
                          style={{ padding: "0 16px" }}
                        >
                          {verifyingOtp ? "Verifying…" : "Confirm OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-field" style={{ gridColumn: "1/-1" }}>
                    <label>Street Address *</label>
                    <input
                      value={addr.address}
                      onChange={(e) => setAddr({ ...addr, address: e.target.value })}
                      placeholder="Door No, Street Name, Landmark" required
                    />
                  </div>

                  <div className="form-field">
                    <label>City *</label>
                    <input
                      value={addr.city}
                      onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                      placeholder="Coimbatore" required
                    />
                  </div>

                  <div className="form-field">
                    <label>Pincode *</label>
                    <input
                      value={addr.pincode}
                      onChange={(e) => setAddr({ ...addr, pincode: e.target.value })}
                      placeholder="641040" required maxLength={6}
                    />
                  </div>

                  <div className="form-field" style={{ gridColumn: "1/-1" }}>
                    <label>State *</label>
                    <select
                      value={addr.state}
                      onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                      required
                    >
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. PAYMENT METHOD SELECTION */}
              <div className="checkout-section">
                <h3>💳 2. Select Payment Method</h3>
                <div className="payment-options">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label key={opt.id} className={`payment-option ${payment === opt.id ? "selected" : ""}`}>
                      <input
                        type="radio" name="payment" value={opt.id}
                        checked={payment === opt.id} onChange={() => setPayment(opt.id)}
                      />
                      <span className="payment-icon">{opt.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                          {opt.tag && <span className="tag-recommended">{opt.tag}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* 3. UPI QR PAYMENT CARD */}
                {payment === "upi" && (
                  <div className="upi-payment-container">
                    <div className="upi-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="upi-logo-icon">✨</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Aasai Foods Official UPI QR Code</h4>
                          <span style={{ fontSize: 12, color: "#64748b" }}>Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
                        </div>
                      </div>
                      <span className="upi-verified-badge">🛡️ Verified Business</span>
                    </div>

                    <div className="upi-card-body">
                      {/* Left: QR Code Display */}
                      <div className="upi-qr-column">
                        <div className="qr-frame">
                          <img
                            src="/aasai_upi_qr.jpg"
                            alt="Aasai Foods UPI QR Code"
                            className="qr-img"
                          />
                        </div>
                        <div className="qr-caption">
                          <strong>Nisanth Shanmugam</strong>
                          <span>Scan to pay with any UPI app</span>
                        </div>
                      </div>

                      {/* Right: UPI Details & Copy */}
                      <div className="upi-details-column">
                        <div className="pay-amount-box">
                          <span style={{ fontSize: 12, color: "#475569" }}>Total Amount to Pay</span>
                          <h3 className="pay-amount">₹{grandTotal.toLocaleString("en-IN")}</h3>
                        </div>

                        <div className="upi-id-box">
                          <span className="upi-id-lbl">Aasai Foods UPI ID:</span>
                          <div className="upi-id-val-wrap">
                            <code className="upi-id-val">nisanthshri143@okicici</code>
                            <button
                              type="button"
                              className="copy-btn"
                              onClick={handleCopyUpi}
                            >
                              {copiedUpi ? "Copied! ✓" : "Copy ID 📋"}
                            </button>
                          </div>
                        </div>

                        <div className="upi-apps-icons">
                          <span>Accepted Apps:</span>
                          <div className="app-pills">
                            <span className="app-pill gpay">GPay</span>
                            <span className="app-pill phonepe">PhonePe</span>
                            <span className="app-pill paytm">Paytm</span>
                            <span className="app-pill bhim">BHIM UPI</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Step-by-Step Payment Instructions */}
                    <div className="upi-steps-box">
                      <h5 style={{ margin: "0 0 10px 0", fontSize: 13, color: "#1e293b", fontWeight: 700 }}>
                        📲 How to Complete Payment:
                      </h5>
                      <ol className="upi-steps-list">
                        <li>Open <strong>Google Pay / PhonePe / Paytm / BHIM</strong> on your phone.</li>
                        <li>Scan the QR code above or send payment directly to <code>nisanthshri143@okicici</code>.</li>
                        <li>Pay exact total amount <strong>₹{grandTotal.toLocaleString("en-IN")}</strong>.</li>
                        <li>Copy the <strong>12-digit UPI Transaction ID / UTR</strong> from your app receipt.</li>
                        <li>Enter the UTR below and click <strong>Submit Payment</strong>.</li>
                      </ol>
                    </div>

                    {/* Customer UTR & Screenshot Input */}
                    <div className="upi-inputs-box">
                      <div className="form-field">
                        <label className="req-label" style={{ fontWeight: 700, color: "#0f172a" }}>
                          Enter UPI Transaction ID / UTR *
                        </label>
                        <input
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="e.g. 428910293847 (12 digits)"
                          required={payment === "upi"}
                          className="utr-input"
                        />
                        <span className="field-hint">You can find the 12-digit UTR number in your UPI app transaction history.</span>
                      </div>

                      <div className="form-field" style={{ marginTop: 14 }}>
                        <label style={{ fontWeight: 600, color: "#334155" }}>
                          Upload Payment Screenshot (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="file-input"
                        />
                        {ssPreview && (
                          <div className="ss-preview-box">
                            <img src={ssPreview} alt="Payment Screenshot Preview" className="ss-img" />
                            <button
                              type="button"
                              className="remove-ss-btn"
                              onClick={() => { setScreenshot(null); setSsPreview(""); }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ORDER SUMMARY SIDEBAR */}
            <div className="cart-summary sticky-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-items-list">
                {items.map((i) => (
                  <div className="summary-row" key={i.id}>
                    <span className="item-name-qty">
                      {i.name} × {i.qty}
                    </span>
                    <span>₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span style={{ color: shipping === 0 ? "#16a34a" : undefined, fontWeight: 600 }}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>

              {shipping === 0 && (
                <div className="free-shipping-msg">
                  🎉 Free shipping unlocked on orders above ₹499!
                </div>
              )}

              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="payment-security-note">
                🔒 Secure 256-bit Encrypted Transaction
              </div>

              <button
                type="submit"
                className="cust-btn-primary place-order-btn"
                disabled={submitting}
              >
                {submitting ? "Processing Payment…" : payment === "upi" ? "Submit Payment & Place Order" : "Place Order (COD)"}
              </button>

              <button
                type="button"
                className="cust-btn-outline"
                style={{ width: "100%", marginTop: 10, justifyContent: "center" }}
                onClick={() => navigate("/cart")}
              >
                ← Return to Cart
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
