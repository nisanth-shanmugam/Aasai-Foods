import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";
import { UserProvider } from "./context/UserContext";
import { WishlistProvider } from "./context/WishlistContext";

import Login    from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import Home     from "./pages/customer/Home";
import Products from "./pages/customer/Products";
import Cart     from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Profile  from "./pages/customer/Profile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProductsUI from "./pages/admin/AdminProductsUI";
import AdminOrders    from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminStockLevels from "./pages/admin/AdminStockLevels";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings  from "./pages/admin/AdminSettings";

import "./styles/theme.css";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/home"} replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/home"} replace />;
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 16, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 72 }}>🌿</div>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 36, color: "var(--text-2)", margin: 0 }}>Page Not Found</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 360 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" style={{ background: "var(--primary)", color: "#fff", padding: "12px 28px", borderRadius: "var(--r-full)", textDecoration: "none", fontWeight: 600, fontSize: 14, transition: "background 0.2s" }}>Go Home</a>
    </div>
  );
}

export default function App() {
  return (
      <AuthProvider>
        <ProductProvider>
        <OrderProvider>
        <UserProvider>
        <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"         element={<RootRedirect />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Customer routes */}
              <Route path="/home"     element={<ProtectedRoute role="customer"><Home /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute role="customer"><Products /></ProtectedRoute>} />
              <Route path="/cart"     element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
              <Route path="/profile"  element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin"           element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products"  element={<ProtectedRoute role="admin"><AdminProductsUI /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<Navigate to="/admin/products" replace />} />
              <Route path="/admin/orders"    element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute role="admin"><AdminCustomers /></ProtectedRoute>} />
              <Route path="/admin/stock" element={<ProtectedRoute role="admin"><AdminStockLevels /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin/settings"  element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WishlistProvider>
        </CartProvider>
        </UserProvider>
        </OrderProvider>
        </ProductProvider>
      </AuthProvider>
  );
}
