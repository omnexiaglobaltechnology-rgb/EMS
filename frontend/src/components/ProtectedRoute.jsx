import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Wrapper component for securing application routes based on user role and authentication.
 *
 * @param {string[]} allowedRoles - Array of roles permitted to access this route
 * @param {React.ReactNode} children - The component(s) to render if access is granted
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  // Retrieve authentication status and role from Redux store
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  // Redirect unauthenticated users to login page
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Redirect users who do not hold one of the authorized roles
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
