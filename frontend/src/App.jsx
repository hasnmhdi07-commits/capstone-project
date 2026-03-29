import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HouseDetails from "./pages/HouseDetails";
import HousesPage from "./pages/HousesPage";
import Home from "./pages/Home";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerMessages from "./pages/OwnerMessages";
import AdminDashboard from "./pages/AdminDashboard";

// Shows a friendly message when someone tries to access a page for a role they don't have
function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
        <a href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          Go Home
        </a>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Show unauthorized banner if redirected here without permission
  const unauthorized = location.state?.unauthorized;

  return (
    <>
      <Navbar />
      {unauthorized && (
        <div className="bg-red-100 text-red-700 text-center py-2 px-4">
          You don't have permission to access that page.
        </div>
      )}
      <Routes>
        {/* ── Public routes ─────────────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/houses" element={<HousesPage />} />
        <Route path="/houses/:id" element={<HouseDetails />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Redirect logged-in users away from login/register */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />

        {/* ── Owner-only routes ──────────────────────────────────── */}
        <Route
          path="/owner/dashboard"
          element={
            <PrivateRoute roles={["owner"]}>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/messages"
          element={
            <PrivateRoute roles={["owner"]}>
              <OwnerMessages />
            </PrivateRoute>
          }
        />

        {/* ── Admin-only routes ──────────────────────────────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* ── 404 fallback ───────────────────────────────────────── */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
                <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
                <a href="/" className="text-indigo-600 underline">Go Home</a>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
