import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import UserFormModal from "../../components/admin/UserFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/userService";

const SUPERADMIN_ROLE = "Superadministrador";

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (data?.errors) {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length) return messages.join(" ");
  }

  return data?.message || fallback;
}

function isApproved(value) {
  return value === true || value === 1 || value === "1";
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const role = currentUser?.profile?.nome;
  const isSuperadmin = role === SUPERADMIN_ROLE;
  const canViewUsers = isSuperadmin || role === "Administrador";

  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [toast, setToast] = useState({ type: "success", message: "" });

  // Carregamento inicial: a atualização de estado acontece após a resposta da API.
  useEffect(() => {
    if (!canViewUsers) return;

    let active = true;

    async function loadInitialUsers() {
      try {
        const response = await getUsers();
        if (!active) return;

        setUsers(response.users || []);
        setProfiles(response.profiles || []);
      } catch (requestError) {
        if (!active) return;

        const message = getErrorMessage(
          requestError,
          "Não foi possível carregar os usuários."
        );
        setError(message);
        setToast({ type: "error", message });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialUsers();
    return () => {
      active = false;
    };
  }, [canViewUsers]);

  const showToast = (type, message) => setToast({ type, message });

  const loadUsers = async (showSpinner = true) => {
    if (!canViewUsers) return;

    if (showSpinner) setLoading(true);
    setError("");

    try {
      const response = await getUsers();
      setUsers(response.users || []);
      setProfiles(response.profiles || []);
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Não foi possível atualizar a lista de usuários."
      );
      setError(message);
      showToast("error", message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const isProtectedAccount = (target) =>
    target?.profile?.nome === SUPERADMIN_ROLE ||
    String(target?.id) === String(currentUser?.id);

  // O Superadministrador gerencia as demais contas; o Administrador
  // pode editar e excluir somente Visitantes (nunca sua própria conta).
  const canManageTarget = (target) =>
    Boolean(target) &&
    !isProtectedAccount(target) &&
    (isSuperadmin || (role === "Administrador" && target.profile?.nome === "Visitante"));

  const openCreateModal = () => {
    if (!canViewUsers) return;
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (target) => {
    if (!canManageTarget(target)) return;
    setSelectedUser(target);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = async (payload) => {
    if (!canViewUsers || (selectedUser && !canManageTarget(selectedUser))) {
      showToast("error", "Você não tem permissão para modificar esta conta.");
      return;
    }

    // A API também bloqueia a criação/promoção de outro superadministrador.
    const selectedProfile = profiles.find(
      (profile) => String(profile.id) === String(payload.profile_id)
    );
    if (
      !selectedProfile ||
      selectedProfile.nome === SUPERADMIN_ROLE ||
      (!isSuperadmin && selectedProfile.nome !== "Visitante")
    ) {
      showToast("error", isSuperadmin
        ? "Selecione Administrador ou Visitante."
        : "Administradores podem cadastrar somente Visitantes.");
      return;
    }

    const editing = Boolean(selectedUser);
    setSaving(true);

    try {
      if (editing) {
        await updateUser(selectedUser.id, payload);
      } else {
        await createUser(payload);
      }

      setIsModalOpen(false);
      setSelectedUser(null);
      await loadUsers(false);
      showToast(
        "success",
        editing ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso."
      );
    } catch (requestError) {
      showToast(
        "error",
        getErrorMessage(requestError, "Não foi possível salvar o usuário.")
      );
    } finally {
      setSaving(false);
    }
  };

  const askDeleteUser = (target) => {
    if (!canManageTarget(target)) return;
    setUserToDelete(target);
  };

  const confirmDeleteUser = async () => {
    if (!canManageTarget(userToDelete)) return;

    setDeletingId(userToDelete.id);
    try {
      await deleteUser(userToDelete.id);
      setUsers((previous) =>
        previous.filter((item) => item.id !== userToDelete.id)
      );
      showToast("success", `Usuário "${userToDelete.name}" excluído com sucesso.`);
      setUserToDelete(null);
    } catch (requestError) {
      showToast(
        "error",
        getErrorMessage(requestError, "Não foi possível excluir o usuário.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totalSuperadmins = users.filter(
    (item) => item.profile?.nome === SUPERADMIN_ROLE
  ).length;
  const totalAdministradores = users.filter(
    (item) => item.profile?.nome === "Administrador"
  ).length;
  const totalVisitantes = users.filter(
    (item) => item.profile?.nome === "Visitante"
  ).length;

  // O Administrador só pode escolher Visitante; o Superadministrador pode
  // escolher Administrador ou Visitante. Nenhum deles pode criar um Superadmin.
  const selectableProfiles = profiles.filter((profile) =>
    isSuperadmin
      ? ["Administrador", "Visitante"].includes(profile.nome)
      : profile.nome === "Visitante"
  );

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-12 -bottom-28 h-60 w-60 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-100">
                <ShieldCheck size={15} />
                {isSuperadmin ? "Administração de contas" : "Cadastros de visitantes"}
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                {isSuperadmin ? "Gestão de usuários" : "Usuários e visitantes"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-blue-100 sm:text-base">
                {isSuperadmin
                  ? "Gerencie administradores e visitantes, acompanhe os cadastros e preserve o acesso exclusivo do Superadministrador."
                  : "Cadastre, edite e exclua Visitantes e acompanhe as solicitações. As contas administrativas permanecem protegidas."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadUsers()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                <RefreshCcw size={17} className={loading ? "animate-spin" : ""} />
                Atualizar
              </button>
              <Link
                to="/admin/requests"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <ClipboardList size={18} /> Solicitações
              </Link>
              {canViewUsers && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-amber-300"
                >
                  <Plus size={18} /> {isSuperadmin ? "Novo usuário" : "Novo visitante"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UserStatCard
            title="Total de usuários"
            value={users.length}
            icon={<UsersIcon size={22} />}
            tone="blue"
          />
          <UserStatCard
            title="Superadministrador"
            value={totalSuperadmins}
            icon={<ShieldCheck size={22} />}
            tone="amber"
          />
          <UserStatCard
            title="Administradores"
            value={totalAdministradores}
            icon={<UserCheck size={22} />}
            tone="green"
          />
          <UserStatCard
            title="Visitantes"
            value={totalVisitantes}
            icon={<UserRound size={22} />}
            tone="slate"
          />
        </section>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Usuários cadastrados</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isSuperadmin
                  ? "A conta do Superadministrador é protegida contra edição e exclusão neste painel."
                  : "Você pode cadastrar, editar e excluir Visitantes. Contas de Administradores e do Superadministrador são somente para consulta."}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {users.length} registro(s)
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 font-semibold text-blue-700">
              <RefreshCcw size={21} className="animate-spin" /> Carregando usuários...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhum usuário encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    {[
                      "Usuário",
                      "Login",
                      "Perfil",
                      "Situação",
                      ...(canViewUsers ? ["Ações"] : []),
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-6 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${label === "Ações" ? "text-right" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((target) => {
                    const protectedAccount = isProtectedAccount(target);
                    const canManage = canManageTarget(target);
                    return (
                      <tr key={target.id} className="transition hover:bg-blue-50/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-black text-blue-700">
                              {target.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800">{target.name}</p>
                              <p className="text-sm text-slate-500">{target.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{target.login}</td>
                        <td className="px-6 py-4">
                          <RoleBadge role={target.profile?.nome} />
                        </td>
                        <td className="px-6 py-4">
                          <ApprovedBadge approved={isApproved(target.approved)} />
                        </td>
                        {canViewUsers && (
                        <td className="px-6 py-4">
                          {!canManage ? (
                            <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500" title={protectedAccount ? "Conta protegida" : "Somente leitura"}>
                              <LockKeyhole size={16} /> {protectedAccount ? "Protegida" : "Somente leitura"}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(target)}
                                aria-label={`Editar ${target.name}`}
                                title="Editar usuário"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                onClick={() => askDeleteUser(target)}
                                disabled={deletingId === target.id}
                                aria-label={`Excluir ${target.name}`}
                                title="Excluir usuário"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingId === target.id ? (
                                  <RefreshCcw size={17} className="animate-spin" />
                                ) : (
                                  <Trash2 size={17} />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {canViewUsers && isModalOpen && (
        <UserFormModal
          onClose={closeModal}
          onSubmit={handleSaveUser}
          user={selectedUser}
          profiles={selectableProfiles}
          loading={saving}
        />
      )}

      {canViewUsers && (
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        title="Excluir usuário"
        message={
          userToDelete
            ? `Tem certeza que deseja excluir o usuário "${userToDelete.name}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmText="Excluir usuário"
        cancelText="Cancelar"
        loading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
      />
      )}

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "success", message: "" })}
      />
    </AdminLayout>
  );
}

function UserStatCard({ title, value, icon, tone }) {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-4xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    Superadministrador: "bg-amber-100 text-amber-800",
    Administrador: "bg-blue-100 text-blue-700",
    Visitante: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${styles[role] || "bg-slate-100 text-slate-600"}`}>
      {role || "Sem perfil"}
    </span>
  );
}

function ApprovedBadge({ approved }) {
  return approved ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
      <CheckCircle2 size={14} /> Aprovado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700">
      <XCircle size={14} /> Pendente
    </span>
  );
}
