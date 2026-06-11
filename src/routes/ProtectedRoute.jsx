import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  roles = []
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (
    roles.length > 0 &&
    !roles.includes(user.profile?.nome)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}