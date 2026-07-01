import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  return user ? children : <Navigate to="/login" />;
}
