import { useState } from "react";
import {
  X,
  UserPlus,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

function getInitialForm(user, profiles) {
  if (user) {
    return {
      name: user.name || "",
      email: user.email || "",
      login: user.login || "",
      password: "",
      profile_id: user.profile_id || user.profile?.id || "",
      approved: Boolean(user.approved),
    };
  }

  const visitanteProfile = profiles.find(
    (profile) => profile.nome === "Visitante"
  );

  return {
    name: "",
    email: "",
    login: "",
    password: "",
    profile_id: visitanteProfile?.id || profiles[0]?.id || "",
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

  const [form, setForm] = useState(() =>
    getInitialForm(user, profiles)
  );

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      name: form.name,
      email: form.email,
      login: form.login,
      profile_id: form.profile_id,
      approved: form.approved,
    };

    if (!isEditing || form.password.trim()) {
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserPlus size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {isEditing ? "Editar usuário" : "Novo usuário"}
              </h2>

              <p className="text-sm text-slate-500">
                {isEditing
                  ? "Atualize os dados do usuário selecionado."
                  : "Cadastre um novo usuário no sistema."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nome
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                disabled={loading}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:bg-slate-100"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Login
              </label>

              <input
                type="text"
                value={form.login}
                onChange={(e) =>
                  handleChange("login", e.target.value)
                }
                disabled={loading}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:bg-slate-100"
                placeholder="login.usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              E-mail
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                handleChange("email", e.target.value)
              }
              disabled={loading}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:bg-slate-100"
              placeholder="usuario@sobral.ce.gov.br"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Senha{" "}
              {isEditing && (
                <span className="font-normal text-slate-400">
                  (opcional)
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  handleChange("password", e.target.value)
                }
                disabled={loading}
                required={!isEditing}
                minLength={6}
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:bg-slate-100"
                placeholder={
                  isEditing
                    ? "Deixe vazio para manter a senha atual"
                    : "Mínimo 6 caracteres"
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Perfil
              </label>

              <select
                value={form.profile_id}
                onChange={(e) =>
                  handleChange("profile_id", e.target.value)
                }
                disabled={loading}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:bg-slate-100"
              >
                <option value="">Selecione um perfil</option>

                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Status
              </label>

              <select
                value={form.approved ? "1" : "0"}
                onChange={(e) =>
                  handleChange(
                    "approved",
                    e.target.value === "1"
                  )
                }
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:bg-slate-100"
              >
                <option value="1">Aprovado</option>
                <option value="0">Pendente</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition disabled:opacity-60 flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? "Salvando..." : "Salvar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}