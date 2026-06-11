import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ShieldCheck
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function AdminTopbar() {
  const { user } = useAuth();

  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="lg:hidden h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h2 className="text-xl font-black text-slate-800">
              Painel Administrativo
            </h2>

            <p className="text-sm text-slate-500">
              Gerencie dados e recursos do Sobral em Mapas.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-3 py-2">
          <div className="h-10 w-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">
            {initial}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {user?.name || "Usuário"}
            </p>

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck size={12} />
              {user?.profile?.nome || "Perfil"}
            </p>
          </div>

          <ChevronDown size={16} className="text-slate-500" />
        </div>
      </div>
    </header>
  );
}