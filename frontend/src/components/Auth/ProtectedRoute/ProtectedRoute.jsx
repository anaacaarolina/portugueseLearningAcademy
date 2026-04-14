import { Navigate, Outlet } from "react-router-dom";
import { getDashboardPathByRole, getStoredAuth } from "../../../utils/auth";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = getStoredAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    const fallbackPath = getDashboardPathByRole(role) || "/";
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
