import AdminLayout from "../../components/admin/AdminLayout";
import { Users as UsersIcon } from "lucide-react";

export default function Users() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Usuários
          </h1>

          <p className="text-slate-500 mt-1">
            Gerencie administradores, agentes e visitantes cadastrados.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
            <UsersIcon size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Módulo de usuários
          </h2>

          <p className="text-slate-500 mt-2">
            Aqui ficará a listagem de usuários, aprovação de cadastros,
            alteração de perfil e bloqueio de contas.
          </p>

          <span className="inline-flex mt-5 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
            Próximo passo
          </span>
        </div>
      </div>
    </AdminLayout>
  );
}