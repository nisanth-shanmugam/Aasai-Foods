import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useOrders } from "../../context/OrderContext";
import { useAuth } from "../../context/AuthContext";
import Navbar from "./Navbar";
import "./customer.css";

const STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra", "Gujarat", "Rajasthan", "Delhi", "West Bengal"];

const PAYMENT_OPTIONS = [
  { id: "cod",  label: "Cash on Delivery",      icon: "💵", desc: "Pay when your order arrives" },
  { id: "upi",  label: "UPI / GPay / PhonePe",  icon: "📱", desc: "Instant secure payment" },
  { id: "card", label: "Credit / Debit Card",   icon: "💳", desc: "Visa, Mastercard, RuPay" },
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
  const [payment, setPayment]   = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");
  const [addr, setAddr] = useState(
    saved[0] || { name: user?.name || "", phone: user?.phone || "", address: "", city: "", state: "Tamil Nadu", pincode: "" }
  );

  const shipping = total >= 499 ? 0 : 40;

  if (items.length === 0) {
    navigate("/products", { replace: true });
    return null;
  }

  const handleOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Save address if new
    const exists = saved.find((a) => a.address === addr.address && a.pincode === addr.pincode);
    if (!exists) {
      const updated = [addr, ...saved].slice(0, 5);
      localStorage.setItem("aasai_addresses", JSON.stringify(updated));
    }

    try {
      await addOrder({
        customer_name: user?.name || user?.email,
        phone: addr.phone,
        address: { ...addr },
        items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
      });
      clearCart();
      navigate("/profile?tab=orders");
    } catch {
      setError("Unable to place order right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="customer-page">
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#111827" }}>Checkout</h2>

        {error && (
          <div className="pf-alert pf-alert-err" style={{ marginBottom: 16 }}>⚠ {error}</div>
        )}

        <form onSubmit={handleOrder}>
          <div className="checkout-layout">
            <div>
              {/* Saved addresses */}
              {saved.length > 0 && (
                <div className="checkout-section">
                  <h3>📍 Saved Addresses</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {saved.map((a, i) => (
                      <label
                        key={i}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "12px 14px",
                          border: `1.5px solid ${addr.address === a.address && addr.pincode === a.pincode ? "#16a34a" : "#e5e7eb"}`,
                          borderRadius: 10, cursor: "pointer",
                          background: addr.address === a.address && addr.pincode === a.pincode ? "#f0fdf4" : "#fff",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <input type="radio" name="saved_addr" style={{ accentColor: "#16a34a", marginTop: 3 }}
                          checked={addr.address === a.address && addr.pincode === a.pincode}
                          onChange={() => setAddr(a)} />
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                          <strong style={{ color: "#111827" }}>{a.name}</strong> · {a.phone}<br />
                          {a.address}, {a.city}, {a.state} – {a.pincode}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Address form */}
              <div className="checkout-section">
                <h3>📍 Delivery Address</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Full Name</label>
                    <input value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })}
                      placeholder="Karthik Raja" required />
                  </div>
                  <div className="form-field">
                    <label>Phone</label>
                    <input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                      placeholder="+91 98765 43210" required />
                  </div>
                  <div className="form-field" style={{ gridColumn: "1/-1" }}>
                    <label>Address</label>
                    <input value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })}
                      placeholder="12, Anna Nagar, Coimbatore" required />
                  </div>
                  <div className="form-field">
                    <label>City</label>
                    <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                      placeholder="Chennai" required />
                  </div>
                  <div className="form-field">
                    <label>Pincode</label>
                    <input value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })}
                      placeholder="641040" required maxLength={6} />
                  </div>
                  <div className="form-field" style={{ gridColumn: "1/-1" }}>
                    <label>State</label>
                    <select value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} required>
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="checkout-section">
                <h3>💳 Payment Method</h3>
                <div className="payment-options">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label key={opt.id} className={`payment-option ${payment === opt.id ? "selected" : ""}`}>
                      <input type="radio" name="payment" value={opt.id}
                        checked={payment === opt.id} onChange={() => setPayment(opt.id)} />
                      <span className="payment-icon">{opt.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                {items.map((i) => (
                  <div className="summary-row" key={i.id}>
                    <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.name} × {i.qty}
                    </span>
                    <span>₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="summary-row"><span>Subtotal</span><span>₹{total.toLocaleString("en-IN")}</span></div>
              <div className="summary-row">
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? "#16a34a" : undefined }}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              {shipping === 0 && (
                <div style={{ fontSize: 11, color: "#16a34a", marginBottom: 6 }}>🎉 Free shipping on orders above ₹499!</div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{(total + shipping).toLocaleString("en-IN")}</span>
              </div>
              <button
                type="submit"
                className="cust-btn-primary"
                style={{ width: "100%", marginTop: 14, justifyContent: "center", padding: "13px" }}
                disabled={submitting}
              >
                {submitting ? "Placing Order…" : "Place Order"}
              </button>
              <button
                type="button"
                className="cust-btn-outline"
                style={{ width: "100%", marginTop: 8, justifyContent: "center", padding: "11px" }}
                onClick={() => navigate("/cart")}
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
