import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  if (!user && !token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
