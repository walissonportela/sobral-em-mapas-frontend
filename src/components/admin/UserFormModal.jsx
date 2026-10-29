import { useState } from "react";
import {
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";

const ALLOWED_ROLES = ["Administrador", "Visitante"];

function getInitialForm(user, profiles) {
  if (user) {
    return {
      name: user.name || "",
      email: user.email || "",
      login: user.login || "",
      password: "",
      profile_id: String(user.profile_id || user.profile?.id || ""),
      approved: Boolean(user.approved),
    };
  }

  const defaultProfile =
    profiles.find((profile) => profile.nome === "Visitante") ||
    profiles.find((profile) => profile.nome === "Administrador");

  return {
    name: "",
    email: "",
    login: "",
    password: "",
    profile_id: defaultProfile ? String(defaultProfile.id) : "",
    approved: true,
  };
}

export default function UserFormModal({
  onClose,
  onSubmit,
  user,
  profiles = [],
  loading = false,
}) {
  const isEditing = Boolean(user);
  const allowedProfiles = profiles.filter((profile) =>
    ALLOWED_ROLES.includes(profile.nome)
  );

  const [form, setForm] = useState(() =>
    getInitialForm(user, allowedProfiles)
  );
  const [showPassword, setShowPassword] = useState(false);

  const isProtectedAccount = user?.profile?.nome === "Superadministrador";
  const validProfile = allowedProfiles.some(
    (profile) => String(profile.id) === String(form.profile_id)
  );

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading || isProtectedAccount || !validProfile) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      login: form.login.trim(),
      profile_id: Number(form.profile_id),
      approved: form.approved,
    };

    // Na edição, senha vazia significa manter a senha atual.
    if (!isEditing || form.password.trim() !== "") {
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <UserPlus size={24} />
            </div>

            <div>
              <h2 id="user-form-title" className="text-xl font-black text-slate-900">
                {isEditing ? "Editar usuário" : "Novo usuário"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? "Atualize os dados e as permissões desta conta."
                  : "Cadastre uma conta de Administrador ou Visitante."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar formulário"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {isProtectedAccount ? (
          <div className="space-y-4 p-6">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Esta conta de Superadministrador é protegida e não pode ser editada neste formulário.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="user-name" className="mb-2 block text-sm font-bold text-slate-700">
                  Nome completo
                </label>
                <input
                  id="user-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  disabled={loading}
                  required
                  maxLength={255}
                  placeholder="Nome do usuário"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="user-login" className="mb-2 block text-sm font-bold text-slate-700">
                  Login
                </label>
                <input
                  id="user-login"
                  type="text"
                  autoComplete="username"
                  value={form.login}
                  onChange={(event) => handleChange("login", event.target.value)}
                  disabled={loading}
                  required
                  maxLength={100}
                  placeholder="login.usuario"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-email" className="mb-2 block text-sm font-bold text-slate-700">
                E-mail
              </label>
              <input
                id="user-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                disabled={loading}
                required
                maxLength={255}
                placeholder="usuario@exemplo.com"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label htmlFor="user-password" className="mb-2 block text-sm font-bold text-slate-700">
                Senha
                {isEditing && (
                  <span className="ml-2 font-normal text-slate-400">(opcional)</span>
                )}
              </label>

              <div className="relative">
                <input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  disabled={loading}
                  required={!isEditing}
                  minLength={6}
                  placeholder={
                    isEditing
                      ? "Deixe em branco para manter a senha atual"
                      : "Defina uma senha para a nova conta"
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Mínimo de 6 caracteres exigido pela API; prefira uma senha longa e exclusiva.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="user-profile" className="mb-2 block text-sm font-bold text-slate-700">
                  Perfil de acesso
                </label>
                <select
                  id="user-profile"
                  value={form.profile_id}
                  onChange={(event) => handleChange("profile_id", event.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">Selecione um perfil</option>
                  {allowedProfiles.map((profile) => (
                    <option key={profile.id} value={String(profile.id)}>
                      {profile.nome}
                    </option>
                  ))}
                </select>
                {allowedProfiles.length === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    Nenhum perfil disponível. Confira os seeders e atualize a lista de usuários.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="user-approved" className="mb-2 block text-sm font-bold text-slate-700">
                  Status da conta
                </label>
                <select
                  id="user-approved"
                  value={form.approved ? "1" : "0"}
                  onChange={(event) => handleChange("approved", event.target.value === "1")}
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="1">Aprovado</option>
                  <option value="0">Pendente</option>
                </select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <ShieldCheck size={20} className="mt-0.5 shrink-0" />
              <p>
                O perfil Superadministrador é exclusivo e não pode ser atribuído a outras contas.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !validProfile}
                className="flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar usuário"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
