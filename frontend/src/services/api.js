import axios from "axios";

// ─── DEPLOYMENT FIX: use env variable instead of hardcoded localhost ─────────
// Set REACT_APP_API_URL in your .env file.
// Development:  REACT_APP_API_URL=http://localhost:5100/api
// Production:   REACT_APP_API_URL=https://your-backend.railway.app/api
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5100/api";

const api = axios.create({
  baseURL: API_URL,
});

// ─── REQUEST INTERCEPTOR: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: global 401 handling ───────────────────────────────
// If the server returns 401 (expired/invalid token), clear storage and
// redirect to login automatically instead of silently failing.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear and redirect if we actually had a token (not on login page)
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Use window.location so it works outside React Router context too
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
