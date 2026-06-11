import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  UserRound,
  CheckCircle2,
  XCircle,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import UserFormModal from "../../components/admin/UserFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/userService";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

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

  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (data?.errors) {
      const messages = Object.values(data.errors)
        .flat()
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    return data?.message || fallback;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getUsers();

      setUsers(response.users || []);
      setProfiles(response.profiles || []);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);

      const message = getErrorMessage(
        err,
        "Não foi possível carregar os usuários."
      );

      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = async (payload) => {
    const isEditing = Boolean(selectedUser);

    try {
      setSaving(true);

      if (isEditing) {
        await updateUser(selectedUser.id, payload);
      } else {
        await createUser(payload);
      }

      await loadUsers();

      setSelectedUser(null);
      setIsModalOpen(false);

      showToast(
        "success",
        isEditing
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso."
      );
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);

      const message = getErrorMessage(
        err,
        "Não foi possível salvar o usuário."
      );

      showToast("error", message);
    } finally {
      setSaving(false);
    }
  };

  const askDeleteUser = (user) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingId(userToDelete.id);

      await deleteUser(userToDelete.id);

      setUsers((prev) =>
        prev.filter((item) => item.id !== userToDelete.id)
      );

      showToast(
        "success",
        `Usuário "${userToDelete.name}" excluído com sucesso.`
      );

      setUserToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);

      const message = getErrorMessage(
        err,
        "Não foi possível excluir o usuário."
      );

      showToast("error", message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const totalUsers = users.length;

  const totalAdministradores = users.filter(
    (user) => user.profile?.nome === "Administrador"
  ).length;

  const totalAgentes = users.filter(
    (user) => user.profile?.nome === "Agente"
  ).length;

  const totalVisitantes = users.filter(
    (user) => user.profile?.nome === "Visitante"
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Usuários
            </h1>

            <p className="text-slate-500 mt-1">
              Gerencie administradores, agentes e visitantes do Sobral em Mapas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-60 transition flex items-center gap-2"
            >
              <RefreshCcw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
              Atualizar
            </button>

            <button
              onClick={openCreateModal}
              className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition flex items-center gap-2"
            >
              <Plus size={18} />
              Novo usuário
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <UserStatCard
            title="Total"
            value={totalUsers}
            icon={<UsersIcon size={24} />}
          />

          <UserStatCard
            title="Administradores"
            value={totalAdministradores}
            icon={<ShieldCheck size={24} />}
          />

          <UserStatCard
            title="Agentes"
            value={totalAgentes}
            icon={<UserCheck size={24} />}
          />

          <UserStatCard
            title="Visitantes"
            value={totalVisitantes}
            icon={<UserRound size={24} />}
          />
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Lista de usuários
              </h2>

              <p className="text-sm text-slate-500">
                Usuários cadastrados no sistema.
              </p>
            </div>

            <span className="text-sm font-bold text-slate-500">
              {users.length} registro(s)
            </span>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="flex items-center gap-3 text-blue-700 font-semibold">
                <RefreshCcw className="animate-spin" size={22} />
                Carregando usuários...
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Usuário
                    </th>

                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Login
                    </th>

                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Perfil
                    </th>

                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                            {getInitial(user.name)}
                          </div>

                          <div>
                            <p className="font-bold text-slate-800">
                              {user.name}
                            </p>

                            <p className="text-sm text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {user.login}
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={user.profile?.nome} />
                      </td>

                      <td className="px-6 py-4">
                        <ApprovedBadge approved={user.approved} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center"
                            title="Editar usuário"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => askDeleteUser(user)}
                            disabled={deletingId === user.id}
                            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition flex items-center justify-center"
                            title="Excluir usuário"
                          >
                            {deletingId === user.id ? (
                              <RefreshCcw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <UserFormModal
          onClose={closeModal}
          onSubmit={handleSaveUser}
          user={selectedUser}
          profiles={profiles}
          loading={saving}
        />
      )}

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
        onCancel={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
      />

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />
    </AdminLayout>
  );
}

function UserStatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="h-13 w-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
        {icon}
      </div>

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="text-4xl font-black text-slate-900 mt-1">
        {value}
      </h3>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    Administrador: "bg-blue-100 text-blue-700",
    Agente: "bg-amber-100 text-amber-700",
    Visitante: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`
        inline-flex
        px-3
        py-1.5
        rounded-full
        text-xs
        font-black
        ${styles[role] || "bg-slate-100 text-slate-600"}
      `}
    >
      {role || "Sem perfil"}
    </span>
  );
}

function ApprovedBadge({ approved }) {
  return approved ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-black">
      <CheckCircle2 size={14} />
      Aprovado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-black">
      <XCircle size={14} />
      Pendente
    </span>
  );
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "U";
}