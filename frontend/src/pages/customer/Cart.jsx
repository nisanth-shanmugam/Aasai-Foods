import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Navbar from "./Navbar";
import "./customer.css";

export default function Cart() {
  const { items, updateQty, removeItem, total, count } = useCart();
  const navigate = useNavigate();
  const shipping = items.length > 0 ? (total >= 499 ? 0 : 40) : 0;

  return (
    <div className="cust-root">
      <Navbar />
      <div className="cust-page">
        <div className="cart-wrap">

          {/* Left — items */}
          <div className="cart-left">
            <h2 className="cart-title">
              Your Cart
              {count > 0 && <span className="cart-count-badge">{count} {count === 1 ? "item" : "items"}</span>}
            </h2>

            {items.length === 0 ? (
              <div className="cart-empty">
                <div style={{ fontSize: 64 }}>🛒</div>
                <p>Your cart is empty</p>
                <button className="cust-btn-primary" onClick={() => navigate("/products")}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {items.map((item) => (
                    <div className="cart-row" key={item.id}>
                      <img src={item.image} alt={item.name} className="cart-row-img"
                        onError={(e) => { e.target.src = "https://placehold.co/68x68/f0fdf4/16a34a?text=?"; }} />
                      <div className="cart-row-info">
                        <div className="cart-row-name">{item.name}</div>
                        {item.weight && <div className="cart-row-weight">⚖ {item.weight}</div>}
                        <div className="cart-row-price">₹{item.price.toLocaleString("en-IN")}</div>
                      </div>
                      <div className="qty-ctrl">
                        <button onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity">−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, +1)} aria-label="Increase quantity">+</button>
                      </div>
                      <div className="cart-row-total">₹{(item.price * item.qty).toLocaleString("en-IN")}</div>
                      <button className="cart-remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Free shipping progress */}
                {total < 499 && (
                  <div style={{ marginTop: 16, padding: "14px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>
                      <span>Add ₹{(499 - total).toLocaleString("en-IN")} more for FREE shipping!</span>
                      <span>{Math.round((total / 499) * 100)}%</span>
                    </div>
                    <div style={{ height: 6, background: "#dcfce7", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min((total / 499) * 100, 100)}%`, background: "#16a34a", borderRadius: 99, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right — summary */}
          {items.length > 0 && (
            <div className="cart-summary-panel">
              <h3 className="csp-title">Order Summary</h3>
              <div className="csp-items">
                {items.map((i) => (
                  <div className="csp-row" key={i.id}>
                    <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.name} × {i.qty}
                    </span>
                    <span>₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="csp-divider" />
              <div className="csp-row"><span>Subtotal</span><span>₹{total.toLocaleString("en-IN")}</span></div>
              <div className="csp-row">
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? "#16a34a" : undefined }}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              <div className="csp-divider" />
              <div className="csp-row csp-total">
                <span>Total</span>
                <span>₹{(total + shipping).toLocaleString("en-IN")}</span>
              </div>
              <button className="cust-btn-primary csp-checkout" onClick={() => navigate("/checkout")}>
                Proceed to Checkout →
              </button>
              <button className="cust-btn-outline csp-continue" onClick={() => navigate("/products")}>
                ← Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
