import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from './App.jsx'

const googleClientId = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "918591275952-hlt9av64p8cqg97j28agsf0aeol64k4v.apps.googleusercontent.com"
).trim();
console.log('Google Client ID from env:', googleClientId);
createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <StrictMode>
      <App />
    </StrictMode>
  </GoogleOAuthProvider>
);
