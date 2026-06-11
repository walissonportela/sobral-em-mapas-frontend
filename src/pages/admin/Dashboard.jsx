import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserCheck,
  Layers,
  FolderTree,
  RefreshCcw,
  Map,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import { getDashboardStats } from "../../services/dashboardService";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDashboardStats();

      setStats(response.data);
    } catch (err) {
      console.error("Erro dashboard:", err);

      setError(
        err.response?.data?.message ||
          "Não foi possível carregar os dados da dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-blue-700 font-semibold">
            <RefreshCcw className="animate-spin" size={22} />
            Carregando dashboard...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 rounded-3xl p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
                <Activity size={16} />
                Visão geral em tempo real
              </div>

              <h1 className="text-3xl lg:text-4xl font-black">
                Dashboard Administrativa
              </h1>

              <p className="text-blue-100 mt-2 max-w-2xl">
                Acompanhe usuários, camadas, categorias e indicadores principais do WebGIS Sobral em Mapas.
              </p>
            </div>

            <button
              onClick={loadStats}
              className="
                bg-amber-400
                text-blue-950
                px-5
                py-3
                rounded-2xl
                font-bold
                hover:bg-amber-300
                transition
                flex
                items-center
                gap-2
                shadow-md
              "
            >
              <RefreshCcw size={18} />
              Atualizar dados
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <DashboardCard
            title="Usuários"
            value={stats.users.total}
            subtitle="Total cadastrados"
            icon={<Users size={24} />}
          />

          <DashboardCard
            title="Administradores"
            value={stats.users.administradores}
            subtitle="Gestão completa"
            icon={<ShieldCheck size={24} />}
          />

          <DashboardCard
            title="Agentes"
            value={stats.users.agentes}
            subtitle="Operação e edição"
            icon={<UserCheck size={24} />}
          />

          <DashboardCard
            title="Visitantes"
            value={stats.users.visitantes}
            subtitle="Acesso público"
            icon={<Users size={24} />}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <DashboardCard
            title="Categorias"
            value={stats.maps.categories}
            subtitle="Grupos temáticos"
            icon={<FolderTree size={24} />}
          />

          <DashboardCard
            title="Subcategorias"
            value={stats.maps.subcategories}
            subtitle="Organização das camadas"
            icon={<Map size={24} />}
          />

          <DashboardCard
            title="Camadas"
            value={stats.maps.layers}
            subtitle="Dados geográficos"
            icon={<Layers size={24} />}
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Atalhos administrativos
                </h2>

                <p className="text-sm text-slate-500">
                  Próximos módulos do painel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickAction
                title="Gerenciar usuários"
                description="Aprovar, editar e remover usuários."
              />

              <QuickAction
                title="Gerenciar camadas"
                description="Adicionar e atualizar dados do mapa."
              />

              <QuickAction
                title="Solicitações"
                description="Acompanhar pedidos pendentes."
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              Status do sistema
            </h2>

            <div className="space-y-4">
              <StatusItem
                icon={<CheckCircle2 size={18} />}
                label="API Laravel"
                value="Online"
              />

              <StatusItem
                icon={<CheckCircle2 size={18} />}
                label="Autenticação"
                value="Ativa"
              />

              <StatusItem
                icon={<Clock size={18} />}
                label="Última atualização"
                value="Agora"
              />
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function DashboardCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
          {icon}
        </div>

        <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <ArrowUpRight size={18} />
        </div>
      </div>

      <p className="text-sm text-slate-500 mt-5">
        {title}
      </p>

      <h3 className="text-4xl font-black text-slate-900 mt-1">
        {value}
      </h3>

      <p className="text-xs text-slate-400 mt-2">
        {subtitle}
      </p>
    </div>
  );
}

function QuickAction({ title, description }) {
  return (
    <button className="text-left rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:bg-blue-50 transition">
      <h3 className="font-bold text-slate-800">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>

      <span className="inline-flex mt-4 text-xs font-bold text-blue-700">
        Em breve
      </span>
    </button>
  );
}

function StatusItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="text-green-600">
          {icon}
        </span>

        <span className="text-sm">
          {label}
        </span>
      </div>

      <span className="text-sm font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}