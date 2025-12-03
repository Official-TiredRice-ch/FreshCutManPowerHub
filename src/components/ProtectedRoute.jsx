import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If route requires certain roles and user doesn't have it, redirect to their home
  if (roles && !roles.includes(profile?.role)) {
    const home = profile?.role === "employee" ? "/employee-dashboard" : "/dashboard";
    return <Navigate to={home} replace />;
  }

  return children;
}
