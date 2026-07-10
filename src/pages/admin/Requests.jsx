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
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";

import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../../services/userService";

export default function Requests() {
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] = useState("");
  const [userToReject, setUserToReject] =
    useState(null);

  const [toast, setToast] = useState({
    type: "success",
    message: "",
  });

  const showToast = (type, message) => {
    setToast({
      type,
      message,
    });
  };

  const closeToast = () => {
    setToast({
      type: "success",
      message: "",
    });
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPendingUsers();

      setRequests(response.requests || []);
    } catch (requestError) {
      console.error(
        "Erro ao carregar solicitações:",
        requestError
      );

      const message = getErrorMessage(
        requestError,
        "Não foi possível carregar as solicitações."
      );

      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user) => {
    try {
      setProcessingId(user.id);

      const response = await approveUser(
        user.id
      );

      setRequests((previous) =>
        previous.filter(
          (item) => item.id !== user.id
        )
      );

      window.dispatchEvent(
        new Event("pendingUsersChanged")
      );

      showToast(
        "success",
        response.message ||
          `A solicitação de "${user.name}" foi aprovada.`
      );
    } catch (requestError) {
      console.error(
        "Erro ao aprovar solicitação:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível aprovar a solicitação."
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  const askReject = (user) => {
    setUserToReject(user);
  };

  const confirmReject = async () => {
    if (!userToReject) return;

    try {
      setProcessingId(userToReject.id);

      const response = await rejectUser(
        userToReject.id
      );

      setRequests((previous) =>
        previous.filter(
          (item) =>
            item.id !== userToReject.id
        )
      );

      window.dispatchEvent(
        new Event("pendingUsersChanged")
      );

      showToast(
        "success",
        response.message ||
          `A solicitação de "${userToReject.name}" foi recusada.`
      );

      setUserToReject(null);
    } catch (requestError) {
      console.error(
        "Erro ao recusar solicitação:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível recusar a solicitação."
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadInitialRequests = async () => {
      try {
        const response = await getPendingUsers();

        if (!isActive) return;

        setRequests(response.requests || []);
      } catch (requestError) {
        if (!isActive) return;

        console.error(
          "Erro ao carregar solicitações:",
          requestError
        );

        const message = getErrorMessage(
          requestError,
          "Não foi possível carregar as solicitações."
        );

        setError(message);

        setToast({
          type: "error",
          message,
        });
      } finally {
        if (!isActive) 
        setLoading(false);
      }
    };

    loadInitialRequests();

    return () => {
      isActive = false;
    };
  }, []);

  const totalPending = requests.length;

  const totalVisitors = requests.filter(
    (user) =>
      user.profile?.nome === "Visitante"
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Solicitações
            </h1>

            <p className="text-slate-500 mt-1">
              Analise e aprove novos cadastros do
              Sobral em Mapas.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="
              px-5
              py-3
              rounded-2xl
              bg-white
              border
              border-slate-200
              text-slate-700
              font-bold
              hover:bg-slate-50
              disabled:opacity-60
              transition
              flex
              items-center
              gap-2
            "
          >
            <RefreshCcw
              size={18}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Atualizar
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RequestStatCard
            title="Aguardando análise"
            value={totalPending}
            description="Cadastros ainda não analisados"
            icon={<Clock3 size={25} />}
            iconClass="bg-amber-100 text-amber-700"
          />

          <RequestStatCard
            title="Visitantes pendentes"
            value={totalVisitors}
            description="Solicitações do cadastro público"
            icon={<UserRoundPlus size={25} />}
            iconClass="bg-blue-100 text-blue-700"
          />
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Cadastros pendentes
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Aprove somente usuários
                reconhecidos e autorizados.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              <Inbox size={17} />

              {totalPending} solicitação(ões)
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3 text-blue-700 font-semibold">
                <RefreshCcw
                  className="animate-spin"
                  size={22}
                />

                Carregando solicitações...
              </div>
            </div>
          ) : requests.length === 0 ? (
            <EmptyRequests />
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((user) => {
                const isProcessing =
                  processingId === user.id;

                return (
                  <article
                    key={user.id}
                    className="
                      p-6
                      hover:bg-slate-50
                      transition
                    "
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xl shrink-0">
                          {getInitial(user.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-800">
                              {user.name}
                            </h3>

                            <ProfileBadge
                              profile={
                                user.profile?.nome
                              }
                            />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span className="flex items-center gap-2">
                              <Mail size={16} />
                              {user.email}
                            </span>

                            <span className="flex items-center gap-2">
                              <AtSign size={16} />
                              {user.login}
                            </span>

                            <span className="flex items-center gap-2">
                              <CalendarDays
                                size={16}
                              />

                              Solicitado em{" "}
                              {formatDate(
                                user.created_at
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(user)
                          }
                          disabled={
                            isProcessing ||
                            Boolean(processingId)
                          }
                          className="
                            px-5
                            py-3
                            rounded-2xl
                            bg-green-600
                            text-white
                            font-bold
                            hover:bg-green-700
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            transition
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          {isProcessing ? (
                            <RefreshCcw
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={18}
                            />
                          )}

                          Aprovar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            askReject(user)
                          }
                          disabled={
                            isProcessing ||
                            Boolean(processingId)
                          }
                          className="
                            px-5
                            py-3
                            rounded-2xl
                            bg-red-50
                            border
                            border-red-200
                            text-red-700
                            font-bold
                            hover:bg-red-100
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            transition
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          <XCircle size={18} />
                          Recusar
                        </button>
                      </div>
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
            ? `Tem certeza que deseja recusar o cadastro de "${userToReject.name}"? O cadastro será removido do sistema e essa ação não poderá ser desfeita.`
            : ""
        }
        confirmText="Recusar cadastro"
        cancelText="Cancelar"
        loading={Boolean(processingId)}
        onCancel={() => {
          if (!processingId) {
            setUserToReject(null);
          }
        }}
        onConfirm={confirmReject}
      />

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />
    </AdminLayout>
  );
}

function RequestStatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
      <div
        className={`
          h-14
          w-14
          rounded-2xl
          flex
          items-center
          justify-center
          shrink-0
          ${iconClass}
        `}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <h3 className="text-4xl font-black text-slate-900 mt-1">
          {value}
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
}

function EmptyRequests() {
  return (
    <div className="p-12 text-center">
      <div className="h-20 w-20 rounded-3xl bg-green-100 text-green-700 flex items-center justify-center mx-auto">
        <ShieldCheck size={38} />
      </div>

      <h3 className="text-xl font-black text-slate-800 mt-5">
        Nenhuma solicitação pendente
      </h3>

      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        Todos os cadastros foram analisados.
        Novas solicitações aparecerão aqui
        automaticamente.
      </p>
    </div>
  );
}

function ProfileBadge({ profile }) {
  const styles = {
    Administrador:
      "bg-blue-100 text-blue-700",
    Agente:
      "bg-amber-100 text-amber-700",
    Visitante:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`
        inline-flex
        px-3
        py-1
        rounded-full
        text-xs
        font-black
        ${
          styles[profile] ||
          "bg-slate-100 text-slate-600"
        }
      `}
    >
      {profile || "Sem perfil"}
    </span>
  );
}

function getInitial(name) {
  return name
    ? name.charAt(0).toUpperCase()
    : "U";
}

function formatDate(date) {
  if (!date) {
    return "data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getErrorMessage(
  requestError,
  fallback
) {
  const data = requestError.response?.data;

  if (data?.errors) {
    const messages = Object.values(data.errors)
      .flat()
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return data?.message || fallback;
}