import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getPendingUsers } from "../../services/userService";

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const role = user?.profile?.nome || "Usuário";
  const canReviewRegistrations = ["Superadministrador", "Administrador"].includes(role);
  const initial = (user?.name || "U").charAt(0).toUpperCase();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState("");

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const fetchSequenceRef = useRef(0);

  // As solicitações são consultadas na API Laravel; nenhum serviço de e-mail é necessário.
  const loadPendingRequests = useCallback(async () => {
    if (!canReviewRegistrations) return;

    const sequence = ++fetchSequenceRef.current;
    setLoadingRequests(true);
    setRequestsError("");

    try {
      const response = await getPendingUsers();
      if (sequence !== fetchSequenceRef.current) return;

      const requests = Array.isArray(response?.requests)
        ? response.requests
        : [];

      setPendingRequests(requests);
      setPendingCount(Number(response?.total ?? requests.length) || 0);
    } catch (error) {
      if (sequence !== fetchSequenceRef.current) return;

      console.error("Erro ao carregar solicitações:", error);
      setRequestsError("Não foi possível consultar as solicitações.");
    } finally {
      if (sequence === fetchSequenceRef.current) {
        setLoadingRequests(false);
      }
    }
  }, [canReviewRegistrations]);

  useEffect(() => {
    if (!canReviewRegistrations) return;

    loadPendingRequests();

    // Atualiza ao retornar para a aba e após aprovações/rejeições na aplicação.
    window.addEventListener("focus", loadPendingRequests);
    window.addEventListener("pendingUsersChanged", loadPendingRequests);

    return () => {
      fetchSequenceRef.current += 1;
      window.removeEventListener("focus", loadPendingRequests);
      window.removeEventListener("pendingUsersChanged", loadPendingRequests);
    };
  }, [canReviewRegistrations, loadPendingRequests]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    logout();
  }

  function toggleNotifications() {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);
    setIsProfileOpen(false);

    if (willOpen) loadPendingRequests();
  }

  return (
    <header className="relative z-30 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-[88px] lg:px-8">
        {/* Identidade do painel */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link
            to="/"
            title="Voltar ao mapa público"
            aria-label="Voltar ao mapa público"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 p-1.5 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
          >
            <img
              src="/images/icone_sobral_em_mapas.png"
              alt=""
              className="h-full w-full object-contain"
            />
          </Link>

          <div className="min-w-0">
            <div className="mb-0.5 hidden items-center gap-2 sm:flex">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
                Sobral em Mapas
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administração
              </span>
            </div>

            <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">
              Painel de gestão
            </h1>

            <p className="hidden truncate text-xs text-slate-500 lg:block">
              Gestão de informações cartográficas e recursos da plataforma
            </p>
          </div>
        </div>

        {/* Ações do painel */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 xl:inline-flex"
          >
            <ArrowLeft size={16} />
            Voltar ao mapa
          </Link>

          {/* Superadministrador e Administrador: solicitações de cadastro */}
          {canReviewRegistrations && (
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label={
                  pendingCount > 0
                    ? `${pendingCount} solicitações de cadastro pendentes`
                    : "Consultar solicitações de cadastro"
                }
                aria-expanded={isNotificationsOpen}
                aria-haspopup="true"
                title="Solicitações de cadastro"
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isNotificationsOpen
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Bell size={20} />
                {pendingCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 px-1 text-[10px] font-black text-blue-950">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <ClipboardList size={18} className="text-blue-700" />
                        <h2 className="font-extrabold text-slate-900">
                          Solicitações
                        </h2>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {pendingCount === 1
                          ? "1 cadastro aguardando aprovação"
                          : `${pendingCount} cadastros aguardando aprovação`}
                        {role === "Administrador" && (
                          <span className="mt-1 block text-blue-700">
                            Apenas solicitações de Visitantes
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadPendingRequests}
                      disabled={loadingRequests}
                      title="Atualizar solicitações"
                      aria-label="Atualizar solicitações"
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
                    >
                      <RefreshCcw
                        size={17}
                        className={loadingRequests ? "animate-spin" : ""}
                      />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {requestsError ? (
                      <div className="px-4 py-7 text-center text-sm text-red-600">
                        {requestsError}
                      </div>
                    ) : loadingRequests && pendingRequests.length === 0 ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                        <RefreshCcw size={16} className="animate-spin" />
                        Carregando solicitações...
                      </div>
                    ) : pendingRequests.length === 0 ? (
                      <div className="flex flex-col items-center px-5 py-9 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          Tudo em dia!
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Nenhuma solicitação pendente no momento.
                        </p>
                      </div>
                    ) : (
                      pendingRequests.slice(0, 5).map((request) => (
                        <Link
                          key={request.id}
                          to="/admin/requests"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 transition last:border-b-0 hover:bg-blue-50/70"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <Users size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {request.name || "Novo cadastro"}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {request.email || "Aguardando aprovação"}
                            </p>
                          </div>
                          <ChevronDown
                            size={15}
                            className="mt-2 shrink-0 -rotate-90 text-slate-400"
                          />
                        </Link>
                      ))
                    )}
                  </div>

                  <Link
                    to="/admin/requests"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                  >
                    Ver todas as solicitações
                    <ExternalLink size={15} />
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

          {/* Perfil e opções da conta */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((open) => !open);
                setIsNotificationsOpen(false);
              }}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              className={`flex items-center gap-2 rounded-2xl border p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:gap-3 sm:py-2 sm:pl-2 sm:pr-3 ${
                isProfileOpen
                  ? "border-blue-200 bg-blue-50"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-sm font-black text-white shadow-sm sm:h-10 sm:w-10">
                {initial}
              </div>

              <div className="hidden max-w-36 min-w-0 text-left sm:block">
                <p className="truncate text-sm font-extrabold leading-tight text-slate-800">
                  {user?.name || "Usuário"}
                </p>
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-blue-700">
                  <ShieldCheck size={12} className="shrink-0" />
                  <span className="truncate">{role}</span>
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 py-3 sm:hidden">
                  <p className="truncate text-sm font-extrabold text-slate-800">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="mt-1 truncate text-xs text-blue-700">{role}</p>
                </div>

                <Link
                  to="/minha-conta"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <UserCircle size={18} />
                  Minha conta
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sair do sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linha de identidade visual, sem competir com o cabeçalho do dashboard. */}
      <div className="h-0.5 bg-gradient-to-r from-blue-900 via-blue-600 to-amber-400" />
    </header>
  );
}
