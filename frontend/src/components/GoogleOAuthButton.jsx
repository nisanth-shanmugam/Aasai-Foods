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
      await login(data);
      // Default navigation based on role (can be overridden via prop)
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (data.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/account", { replace: true });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
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
