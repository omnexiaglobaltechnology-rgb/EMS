import { createBrowserRouter, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import { ROLES } from "./auth/roles";

/* Admin Pages */
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminSettings from "./pages/AdminSettings";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  /* ================= ADMIN ================= */
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <AdminUserManagement /> },
      { path: "settings", element: <AdminSettings /> },
    ],
  },
  
  // Catch all - redirect to login or admin dashboard
  { path: "*", element: <Navigate to="/" /> }
]);
