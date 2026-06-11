import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Layers,
  FolderTree,
  ClipboardList,
  ArrowLeft,
  Map,
} from "lucide-react";

export default function AdminSidebar() {
  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/admin/dashboard",
    },
    {
      label: "Usuários",
      icon: Users,
      to: "/admin/users",
    },
    {
      label: "Camadas",
      icon: Layers,
      to: "/admin/layers",
    },
    {
      label: "Categorias",
      icon: FolderTree,
      to: "/admin/categories",
    },
    {
      label: "Solicitações",
      icon: ClipboardList,
      to: "/admin/requests",
    },
  ];

  return (
    <aside className="hidden lg:flex w-72 h-screen bg-blue-950 text-white flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center">
            <Map size={24} />
          </div>

          <div>
            <h1 className="font-black text-lg leading-tight">
              Sobral em Mapas
            </h1>
            <p className="text-xs text-blue-200">
              Administração
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-2xl
                  font-medium
                  transition
                  ${
                    isActive
                      ? "bg-amber-400 text-blue-950"
                      : "text-blue-100 hover:bg-white/10"
                  }
                `
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          to="/"
          className="
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-2xl
            text-blue-100
            hover:bg-white/10
            transition
            font-medium
          "
        >
          <ArrowLeft size={20} />
          Voltar ao mapa
        </Link>
      </div>
    </aside>
  );
}