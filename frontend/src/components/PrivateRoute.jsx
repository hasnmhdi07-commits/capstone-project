import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * PrivateRoute – wraps routes that require authentication and/or a specific role.
 *
 * Usage in App.jsx:
 *   <Route path="/owner/dashboard" element={
 *     <PrivateRoute roles={["owner"]}><OwnerDashboard /></PrivateRoute>
 *   } />
 *
 * @param {React.ReactNode} children  – the page to render if authorised
 * @param {string[]}        roles     – allowed roles; if omitted, any authenticated user passes
 */
const PrivateRoute = ({ children, roles = [] }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Not logged in → redirect to /login, preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to home with a message
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" state={{ unauthorized: true }} replace />;
  }

  return children;
};

export default PrivateRoute;
