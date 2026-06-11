import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  roles = [],
}) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const userRole = user?.profile?.nome;

  if (
    roles.length > 0 &&
    !roles.includes(userRole)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}