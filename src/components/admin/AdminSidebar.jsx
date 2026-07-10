import { useEffect, useMemo, useState } from "react";
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

import { useAuth } from "../../context/AuthContext";
import { getPendingUsers } from "../../services/userService";

export default function AdminSidebar() {
  const { user } = useAuth();

  const [pendingCount, setPendingCount] =
    useState(0);

  const role = user?.profile?.nome;

  const isAdministrador =
    role === "Administrador";

  useEffect(() => {
    if (!isAdministrador) return;

    let active = true;

    const loadPendingCount = async () => {
      try {
        const response = await getPendingUsers();

        if (!active) return;

        setPendingCount(response.total || 0);
      } catch (error) {
        console.error(
          "Erro ao carregar solicitações pendentes:",
          error
        );
      }
    };

    const handlePendingUsersChanged = () => {
      loadPendingCount();
    };

    loadPendingCount();

    window.addEventListener(
      "pendingUsersChanged",
      handlePendingUsersChanged
    );

    return () => {
      active = false;

      window.removeEventListener(
        "pendingUsersChanged",
        handlePendingUsersChanged
      );
    };
  }, [isAdministrador]);

  const menuItems = useMemo(
    () => [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/admin/dashboard",
        roles: ["Administrador", "Agente"],
      },
      {
        label: "Usuários",
        icon: Users,
        to: "/admin/users",
        roles: ["Administrador"],
      },
      {
        label: "Solicitações",
        icon: ClipboardList,
        to: "/admin/requests",
        roles: ["Administrador"],
        badge: pendingCount,
      },
      {
        label: "Camadas",
        icon: Layers,
        to: "/admin/layers",
        roles: ["Administrador", "Agente"],
      },
      {
        label: "Categorias",
        icon: FolderTree,
        to: "/admin/categories",
        roles: ["Administrador", "Agente"],
      },
    ],
    [pendingCount]
  );

  const visibleMenuItems = menuItems.filter(
    (item) => item.roles.includes(role)
  );

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

        {user && (
          <div className="mt-5 rounded-2xl bg-white/10 border border-white/10 p-4">
            <p className="text-xs text-blue-200">
              Usuário logado
            </p>

            <p className="font-bold text-sm mt-1 truncate">
              {user.name}
            </p>

            <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-amber-400 text-blue-950 text-xs font-black">
              {role}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  justify-between
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
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon size={20} />
                    {item.label}
                  </span>

                  {item.badge > 0 && (
                    <span
                      className={`
                        min-w-6
                        h-6
                        px-2
                        rounded-full
                        text-xs
                        font-black
                        flex
                        items-center
                        justify-center
                        ${
                          isActive
                            ? "bg-blue-950 text-white"
                            : "bg-amber-400 text-blue-950"
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
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