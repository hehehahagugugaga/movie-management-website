import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// wrap a page with this to require login, or login + admin role
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}
