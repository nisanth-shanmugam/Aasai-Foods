import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

/**
 * Reusable Google OAuth button that forces the account chooser.
 * Uses GoogleLogin component (implicit flow) which provides a real ID token.
 * Props:
 *   - redirectPath: optional string to override default routing after login.
 */
export default function GoogleOAuthButton({ redirectPath }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post("/auth/google/", {
        id_token: credentialResponse.credential,
      });
      // Store JWTs via the AuthContext's login helper
      const loggedInUser = await login(data);
      const role = loggedInUser?.role || data?.role;

      // Default navigation based on role (can be overridden via prop)
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("GOOGLE LOGIN ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error("URL:", err.config?.url);

      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Google authentication failed.";

      alert(msg);
    }
  };

  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={() => alert("Google login cancelled or failed.")}
      prompt="select_account"
      useOneTap={false}
      text="continue_with"
      shape="rectangular"
      size="large"
      width="100%"
    />
  );
}