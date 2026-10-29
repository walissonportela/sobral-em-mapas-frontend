import { useEffect, useState } from "react";
import {
  RefreshCcw,
  UserRoundPlus,
  CheckCircle2,
  XCircle,
  Clock3,
  Mail,
  AtSign,
  ShieldCheck,
  CalendarDays,
  Inbox,
  ClipboardCheck,
  Info,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../../services/userService";

export default function Requests() {
  const { user: currentUser } = useAuth();
  const role = currentUser?.profile?.nome;
  const isSuperadmin = role === "Superadministrador";
  const isAdministrator = role === "Administrador";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [userToReject, setUserToReject] = useState(null);
  const [toast, setToast] = useState({ type: "success", message: "" });

  useEffect(() => {
    let active = true;

    const loadInitialRequests = async () => {
      try {
        const response = await getPendingUsers();
        if (!active) return;
        setRequests(response.requests || []);
      } catch (requestError) {
        if (!active) return;
        console.error("Erro ao carregar solicitações:", requestError);
        const message = getErrorMessage(
          requestError,
          "Não foi possível carregar as solicitações."
        );
        setError(message);
        setToast({ type: "error", message });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialRequests();
    return () => {
      active = false;
    };
  }, []);

  const visibleRequests = isSuperadmin
    ? requests
    : requests.filter((request) => request.profile?.nome === "Visitante");

  const totalPending = visibleRequests.length;
  const totalVisitors = visibleRequests.filter(
    (request) => request.profile?.nome === "Visitante"
  ).length;

  const showToast = (type, message) => setToast({ type, message });
  const closeToast = () => setToast({ type: "success", message: "" });

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPendingUsers();
      setRequests(response.requests || []);
    } catch (requestError) {
      console.error("Erro ao atualizar solicitações:", requestError);
      const message = getErrorMessage(
        requestError,
        "Não foi possível atualizar as solicitações."
      );
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const canReview = (request) =>
    isSuperadmin ||
    (isAdministrator && request.profile?.nome === "Visitante");

  const handleApprove = async (request) => {
    if (processingId !== null || !canReview(request)) return;

    try {
      setProcessingId(request.id);
      const response = await approveUser(request.id);
      setRequests((previous) =>
        previous.filter((item) => item.id !== request.id)
      );
      window.dispatchEvent(new Event("pendingUsersChanged"));
      showToast(
        "success",
        response.message || `A solicitação de "${request.name}" foi aprovada.`
      );
    } catch (requestError) {
      console.error("Erro ao aprovar solicitação:", requestError);
      showToast(
        "error",
        getErrorMessage(requestError, "Não foi possível aprovar a solicitação.")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const askReject = (request) => {
    if (!canReview(request) || processingId !== null) return;
    setUserToReject(request);
  };

  const confirmReject = async () => {
    if (!userToReject || processingId !== null || !canReview(userToReject)) {
      return;
    }

    try {
      setProcessingId(userToReject.id);
      const response = await rejectUser(userToReject.id);
      setRequests((previous) =>
        previous.filter((item) => item.id !== userToReject.id)
      );
      window.dispatchEvent(new Event("pendingUsersChanged"));
      showToast(
        "success",
        response.message ||
          `A solicitação de "${userToReject.name}" foi recusada.`
      );
      setUserToReject(null);
    } catch (requestError) {
      console.error("Erro ao recusar solicitação:", requestError);
      showToast(
        "error",
        getErrorMessage(requestError, "Não foi possível recusar a solicitação.")
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/15 bg-white/5" />
          <div className="pointer-events-none absolute -bottom-24 right-28 h-44 w-44 rounded-full border border-amber-300/20 bg-amber-300/5" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-50">
                <ClipboardCheck size={15} />
                Administração de contas
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Solicitações de cadastro
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
                {isSuperadmin
                  ? "Analise os novos cadastros e gerencie as solicitações de acesso ao Sobral em Mapas."
                  : "Analise e aprove ou recuse solicitações de cadastro de Visitantes."}
              </p>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              disabled={loading || processingId !== null}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-blue-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              Atualizar solicitações
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RequestStatCard
            title="Aguardando análise"
            value={totalPending}
            description="Cadastros pendentes disponíveis para análise"
            icon={<Clock3 size={25} />}
            iconClass="bg-amber-100 text-amber-700"
          />
          <RequestStatCard
            title="Visitantes pendentes"
            value={totalVisitors}
            description="Solicitações realizadas pelo cadastro público"
            icon={<UserRoundPlus size={25} />}
            iconClass="bg-blue-100 text-blue-700"
          />
        </section>

        {!isSuperadmin && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Info size={19} className="mt-0.5 shrink-0" />
            <p>
              Como Administrador, você pode aprovar ou recusar somente cadastros
              de <strong>Visitantes</strong>. O gerenciamento de perfis e contas
              existentes é exclusivo do Superadministrador.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800">Cadastros pendentes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Confira as informações antes de aprovar ou recusar uma conta.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
              <Inbox size={16} />
              {totalPending} {totalPending === 1 ? "solicitação" : "solicitações"}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 font-semibold text-blue-700">
              <RefreshCcw size={22} className="animate-spin" />
              Carregando solicitações...
            </div>
          ) : error && requests.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Não foi possível exibir as solicitações. Tente atualizar novamente.
            </div>
          ) : visibleRequests.length === 0 ? (
            <EmptyRequests />
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleRequests.map((request) => {
                const isProcessing = processingId === request.id;
                const canAct = canReview(request);

                return (
                  <article key={request.id} className="p-5 transition hover:bg-slate-50/70 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-black text-blue-700 sm:h-14 sm:w-14">
                          {getInitial(request.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-lg font-black text-slate-800">
                              {request.name}
                            </h3>
                            <ProfileBadge profile={request.profile?.nome} />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span className="inline-flex min-w-0 items-center gap-2 break-all">
                              <Mail size={16} className="shrink-0" />
                              {request.email}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <AtSign size={16} />
                              {request.login}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays size={16} />
                              Solicitado em {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canAct ? (
                        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleApprove(request)}
                            disabled={processingId !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <RefreshCcw size={18} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => askReject(request)}
                            disabled={processingId !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={18} />
                            Recusar
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">
                          Sem permissão para analisar este cadastro
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={Boolean(userToReject)}
        title="Recusar solicitação"
        message={
          userToReject
            ? `Tem certeza que deseja recusar o cadastro de "${userToReject.name}"? O cadastro será removido do sistema e esta ação não poderá ser desfeita.`
            : ""
        }
        confirmText="Recusar cadastro"
        cancelText="Cancelar"
        loading={processingId !== null}
        onCancel={() => {
          if (processingId === null) setUserToReject(null);
        }}
        onConfirm={confirmReject}
      />

      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
    </AdminLayout>
  );
}

function RequestStatCard({ title, value, description, icon, iconClass }) {
  return (
    <div className="flex items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <h3 className="mt-1 text-4xl font-black text-slate-900">{value}</h3>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function EmptyRequests() {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 text-green-700">
        <ShieldCheck size={38} />
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-800">
        Nenhuma solicitação pendente
      </h3>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        Não há cadastros aguardando análise no momento. Use o botão
        "Atualizar solicitações" para consultar novamente.
      </p>
    </div>
  );
}

function ProfileBadge({ profile }) {
  const styles = {
    Superadministrador: "bg-indigo-100 text-indigo-700",
    Administrador: "bg-blue-100 text-blue-700",
    Visitante: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[profile] || "bg-slate-100 text-slate-600"}`}>
      {profile || "Sem perfil"}
    </span>
  );
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "U";
}

function formatDate(value) {
  if (!value) return "data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(requestError, fallback) {
  const data = requestError.response?.data;
  if (data?.errors) {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  return data?.message || fallback;
}
