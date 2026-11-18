import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, authReady } = useAuth();

  // Não exibe o painel até revalidar a sessão no Laravel.
  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600" role="status">
        Validando sua sessão...
      </div>
    );
  }

  if (!user || user.approved === false) {
    return <Navigate to="/" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.profile?.nome)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
