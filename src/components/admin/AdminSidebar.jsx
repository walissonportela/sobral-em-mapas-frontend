import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  FolderTree,
  Layers,
  LayoutDashboard,
  Menu,
  Server,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getPendingUsers } from "../../services/userService";

const MAP_ROLES = ["Superadministrador", "Administrador"];

export default function AdminSidebar() {
  const { user } = useAuth();
  const role = user?.profile?.nome;
  const canReviewRegistrations = MAP_ROLES.includes(role);

  const [pendingCount, setPendingCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Superadministrador e Administrador consultam solicitações de cadastro.
  useEffect(() => {
    // Sem permissão, não faz a requisição. O menu de solicitações
    // também fica oculto pelas regras de perfil.
    if (!canReviewRegistrations) return;

    let active = true;

    const loadPendingCount = async () => {
      try {
        const response = await getPendingUsers();

        if (active) {
          setPendingCount(Number(response?.total) || 0);
        }
      } catch (error) {
        if (active) {
          console.error("Erro ao consultar solicitações pendentes:", error);
        }
      }
    };

    loadPendingCount();

    window.addEventListener("pendingUsersChanged", loadPendingCount);
    window.addEventListener("focus", loadPendingCount);

    return () => {
      active = false;
      window.removeEventListener("pendingUsersChanged", loadPendingCount);
      window.removeEventListener("focus", loadPendingCount);
    };
  }, [canReviewRegistrations]);

  // A navegação mobile é fechada diretamente pelos handlers
  // dos links e botões (onNavigate), sem sincronizar state no efeito.

  // Permite fechar o menu mobile com Esc.
  useEffect(() => {
    if (!mobileOpen) return;

    const onEscape = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileOpen]);

  const sections = useMemo(() => {
    const groups = [
      {
        title: "VISÃO GERAL",
        items: [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            to: "/admin/dashboard",
            roles: MAP_ROLES,
          },
        ],
      },
      {
        title: "GESTÃO CARTOGRÁFICA",
        items: [
          {
            label: "Categorias",
            icon: FolderTree,
            to: "/admin/categories",
            roles: MAP_ROLES,
          },
          {
            label: "Camadas",
            icon: Layers,
            to: "/admin/layers",
            roles: MAP_ROLES,
          },
          {
            label: "Links WMS",
            icon: Server,
            to: "/admin/wms",
            roles: MAP_ROLES,
          },
        ],
      },
      {
        title: "CONTAS E CADASTROS",
        items: [
          {
            label: "Usuários",
            icon: Users,
            to: "/admin/users",
            roles: MAP_ROLES,
          },
          {
            label: "Solicitações",
            icon: ClipboardList,
            to: "/admin/requests",
            roles: MAP_ROLES,
            badge: pendingCount,
          },
        ],
      },
    ];

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.roles.includes(role)),
      }))
      .filter((group) => group.items.length > 0);
  }, [role, pendingCount]);

  return (
    <>
      {/* Menu lateral para telas grandes. */}
      <aside className="hidden lg:flex w-[284px] xl:w-[292px] h-screen shrink-0 bg-[#0B1F49] text-white flex-col border-r border-white/10">
        <SidebarContent
          user={user}
          role={role}
          sections={sections}
        />
      </aside>

      {/* Atalho para a navegação administrativa em celulares e tablets. */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu administrativo"
          aria-expanded={false}
          className="lg:hidden fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-800 text-white shadow-xl shadow-blue-950/20 ring-4 ring-white/80 hover:bg-blue-700 transition-colors"
        >
          <Menu size={24} />
        </button>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label="Fechar menu administrativo"
            onClick={() => setMobileOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navegação administrativa"
            className="relative h-full w-[min(320px,88vw)] bg-[#0B1F49] text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar navegação"
              className="absolute top-5 right-4 z-10 rounded-xl p-2 text-blue-100 hover:bg-white/10"
            >
              <X size={21} />
            </button>

            <SidebarContent
              user={user}
              role={role}
              sections={sections}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({ user, role, sections, onNavigate }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Identidade visual da plataforma. */}
      <div className="px-5 pt-7 pb-5 border-b border-white/10 bg-gradient-to-b from-blue-900/40 to-transparent">
        <div className="flex items-center gap-3 pr-9">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-white/20">
            <img
              src="/images/icone_sobral_em_mapas.png"
              alt="Ícone Sobral em Mapas"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-black tracking-tight text-white">
              Sobral em Mapas
            </p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
              Painel de gestão
            </p>
          </div>
        </div>

        {user && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-blue-200/80">
              Conta conectada
            </p>
            <p className="mt-1.5 truncate text-sm font-bold text-white" title={user.name}>
              {user.name}
            </p>
            <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-amber-400/15 px-2.5 py-1.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/20">
              <ShieldCheck size={14} className="shrink-0" />
              <span className="truncate">{role || "Perfil indisponível"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grupos exibidos conforme o perfil do usuário. */}
      <nav
        aria-label="Menu administrativo"
        className="min-h-0 flex-1 overflow-y-auto px-3 pt-5 pb-6"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="mb-2 px-3 text-[10px] font-extrabold tracking-[0.16em] text-blue-300/70">
              {section.title}
            </h2>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex min-h-12 items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                        isActive
                          ? "bg-amber-400 text-blue-950 shadow-sm shadow-amber-400/15"
                          : "text-blue-100/90 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="flex min-w-0 items-center gap-3">
                          <Icon size={19} className="shrink-0" strokeWidth={2} />
                          <span className="truncate text-sm font-semibold">
                            {item.label}
                          </span>
                        </span>

                        {item.badge > 0 ? (
                          <span
                            className={`flex min-w-6 h-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
                              isActive
                                ? "bg-blue-950 text-white"
                                : "bg-amber-400 text-blue-950"
                            }`}
                          >
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        ) : (
                          <ChevronRight
                            size={16}
                            className={isActive ? "text-blue-950/70" : "text-blue-300/50 group-hover:text-blue-100"}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Acesso ao mapa público. */}
      <div className="border-t border-white/10 px-4 py-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 text-sm font-semibold text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="flex items-center gap-3">
            <ArrowLeft size={18} />
            Voltar ao mapa
          </span>
          <ChevronRight size={15} className="text-blue-300/70" />
        </Link>
        <p className="mt-3 text-center text-[10px] tracking-[0.12em] text-blue-300/50">
          SOBRAL EM MAPAS
        </p>
      </div>
    </div>
  );
}
