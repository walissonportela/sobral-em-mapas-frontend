import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  CheckCircle2,
  XCircle,
  Globe2,
  Lock,
  UserPlus,
  Database,
  Server,
  FolderPlus,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import { getDashboardStats } from "../../services/dashboardService";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadInitialStats = async () => {
      try {
        const response =
          await getDashboardStats();

        if (active) {
          setStats(response.data);
        }
      } catch (requestError) {
        if (active) {
          console.error(
            "Erro dashboard:",
            requestError
          );

          setError(
            requestError.response?.data?.message ||
              "Não foi possível carregar os dados da dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialStats();

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await getDashboardStats();

      setStats(response.data);
    } catch (requestError) {
      console.error(
        "Erro dashboard:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "Não foi possível atualizar os dados da dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-blue-700 font-semibold">
            <RefreshCcw
              className="animate-spin"
              size={22}
            />
            Carregando dashboard...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !stats) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
          {error}
        </div>
      </AdminLayout>
    );
  }

  const users = stats?.users || {};
  const maps = stats?.maps || {};
  const categories = maps.categories || {};
  const subcategories = maps.subcategories || {};
  const layers = maps.layers || {};
  const wms = stats?.wms || {};

  const publishedLayersPercent = getPercent(
    layers.public,
    layers.total
  );

  const activeLayersPercent = getPercent(
    layers.active,
    layers.total
  );

  const activeStructureTotal =
    number(categories.active) +
    number(subcategories.active) +
    number(layers.active);

  const inactiveStructureTotal =
    number(categories.inactive) +
    number(subcategories.inactive) +
    number(layers.inactive);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-64 w-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-20 -bottom-24 h-52 w-52 bg-amber-300/20 rounded-full blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
                <Activity size={16} />
                Visão geral operacional
              </div>

              <h1 className="text-3xl lg:text-4xl font-black">
                Dashboard Administrativa
              </h1>

              <p className="text-blue-100 mt-2 max-w-2xl">
                Acompanhe usuários, aprovação de contas, estrutura de mapas,
                camadas públicas e vínculos WMS do Sobral em Mapas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="
                bg-amber-400
                text-blue-950
                px-5
                py-3
                rounded-2xl
                font-bold
                hover:bg-amber-300
                disabled:opacity-60
                transition
                flex
                items-center
                gap-2
                shadow-md
              "
            >
              <RefreshCcw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Atualizar dados
            </button>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <DashboardCard
            title="Usuários"
            value={number(users.total)}
            subtitle={`${number(users.approved)} aprovado(s), ${number(users.pending)} pendente(s)`}
            icon={<Users size={24} />}
            tone="blue"
          />

          <DashboardCard
            title="Solicitações"
            value={number(users.pending)}
            subtitle="Contas aguardando aprovação"
            icon={<UserPlus size={24} />}
            tone={
              number(users.pending) > 0
                ? "amber"
                : "green"
            }
          />

          <DashboardCard
            title="Camadas ativas"
            value={number(layers.active)}
            subtitle={`${activeLayersPercent}% das camadas cadastradas`}
            icon={<Layers size={24} />}
            tone="green"
          />

          <DashboardCard
            title="Camadas públicas"
            value={number(layers.public)}
            subtitle={`${publishedLayersPercent}% visíveis no mapa público`}
            icon={<Globe2 size={24} />}
            tone="amber"
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Estrutura do mapa
                </h2>

                <p className="text-sm text-slate-500">
                  Status das categorias, subcategorias e camadas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  icon={<CheckCircle2 size={14} />}
                  label={`${activeStructureTotal} ativos`}
                  className="bg-green-100 text-green-700"
                />

                <Badge
                  icon={<XCircle size={14} />}
                  label={`${inactiveStructureTotal} inativos`}
                  className="bg-red-100 text-red-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StructureCard
                title="Categorias"
                total={categories.total}
                active={categories.active}
                inactive={categories.inactive}
                icon={<FolderTree size={22} />}
              />

              <StructureCard
                title="Subcategorias"
                total={subcategories.total}
                active={subcategories.active}
                inactive={subcategories.inactive}
                icon={<FolderPlus size={22} />}
              />

              <StructureCard
                title="Camadas"
                total={layers.total}
                active={layers.active}
                inactive={layers.inactive}
                icon={<Layers size={22} />}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Publicação
                </h2>

                <p className="text-sm text-slate-500">
                  Visibilidade das camadas.
                </p>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Globe2 size={24} />
              </div>
            </div>

            <div className="space-y-5">
              <ProgressMetric
                label="Camadas públicas"
                value={number(layers.public)}
                total={number(layers.total)}
                percent={publishedLayersPercent}
              />

              <ProgressMetric
                label="Camadas ativas"
                value={number(layers.active)}
                total={number(layers.total)}
                percent={activeLayersPercent}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <MiniMetric
                  icon={<Globe2 size={17} />}
                  label="Públicas"
                  value={number(layers.public)}
                  className="bg-amber-50 text-amber-700"
                />

                <MiniMetric
                  icon={<Lock size={17} />}
                  label="Privadas"
                  value={number(layers.private)}
                  className="bg-slate-100 text-slate-700"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-800 mb-5">
              Usuários por perfil
            </h2>

            <div className="space-y-3">
              <ProfileItem
                icon={<ShieldCheck size={18} />}
                label="Administradores"
                value={number(users.administradores)}
                className="bg-blue-100 text-blue-700"
              />

              <ProfileItem
                icon={<UserCheck size={18} />}
                label="Agentes"
                value={number(users.agentes)}
                className="bg-green-100 text-green-700"
              />

              <ProfileItem
                icon={<Users size={18} />}
                label="Visitantes"
                value={number(users.visitantes)}
                className="bg-amber-100 text-amber-700"
              />

              <ProfileItem
                icon={<UserPlus size={18} />}
                label="Pendentes"
                value={number(users.pending)}
                className="bg-red-100 text-red-700"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-800 mb-5">
              Origem WMS
            </h2>

            <div className="space-y-4">
              <StatusItem
                icon={<Server size={18} />}
                label="Links WMS cadastrados"
                value={number(wms.total)}
              />

              <StatusItem
                icon={<Database size={18} />}
                label="Layers com WMS vinculado"
                value={number(wms.layers_with_wms)}
              />

              <StatusItem
                icon={<Layers size={18} />}
                label="Layers antigas sem WMS"
                value={number(wms.layers_without_wms)}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
              As layers antigas podem continuar sem WMS vinculado, pois usam o proxy padrão do GeoServer.
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-800 mb-5">
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
                label="Atualizado em"
                value={formatDate(stats?.generated_at)}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Atalhos administrativos
              </h2>

              <p className="text-sm text-slate-500">
                Acesse rapidamente os principais módulos do painel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <QuickAction
              to="/admin/users"
              title="Usuários"
              description="Gerenciar perfis, permissões e contas."
              icon={<Users size={21} />}
            />

            <QuickAction
              to="/admin/requests"
              title="Solicitações"
              description="Aprovar ou rejeitar novos cadastros."
              icon={<UserPlus size={21} />}
            />

            <QuickAction
              to="/admin/categories"
              title="Categorias"
              description="Organizar categorias e subcategorias."
              icon={<FolderTree size={21} />}
            />

            <QuickAction
              to="/admin/layers"
              title="Camadas"
              description="Criar, ativar, desativar e publicar layers."
              icon={<Layers size={21} />}
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  tone = "blue",
}) {
  const toneClass = getToneClass(tone);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div
          className={`
            h-14
            w-14
            rounded-2xl
            flex
            items-center
            justify-center
            ${toneClass.icon}
          `}
        >
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

function StructureCard({
  title,
  total,
  active,
  inactive,
  icon,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
      <div className="flex items-center justify-between mb-5">
        <div className="h-11 w-11 rounded-2xl bg-white text-blue-700 flex items-center justify-center">
          {icon}
        </div>

        <span className="text-3xl font-black text-slate-900">
          {number(total)}
        </span>
      </div>

      <h3 className="font-black text-slate-800">
        {title}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-green-100 text-green-700 px-3 py-2">
          <p className="text-xs font-bold">
            Ativas
          </p>

          <p className="text-lg font-black">
            {number(active)}
          </p>
        </div>

        <div className="rounded-2xl bg-red-100 text-red-700 px-3 py-2">
          <p className="text-xs font-bold">
            Inativas
          </p>

          <p className="text-lg font-black">
            {number(inactive)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  total,
  percent,
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-bold text-slate-700">
          {label}
        </span>

        <span className="text-slate-500">
          {value}/{total}
        </span>
      </div>

      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-700"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <p className="text-xs text-slate-400 mt-1">
        {percent}% do total
      </p>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  className,
}) {
  return (
    <div
      className={`
        rounded-2xl
        p-4
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {icon}

        <span className="text-xs font-bold">
          {label}
        </span>
      </div>

      <p className="text-2xl font-black mt-2">
        {value}
      </p>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  className,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`
            h-10
            w-10
            rounded-xl
            flex
            items-center
            justify-center
            ${className}
          `}
        >
          {icon}
        </div>

        <span className="font-bold text-slate-700">
          {label}
        </span>
      </div>

      <span className="text-xl font-black text-slate-900">
        {value}
      </span>
    </div>
  );
}

function QuickAction({
  to,
  title,
  description,
  icon,
}) {
  return (
    <Link
      to={to}
      className="text-left rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:bg-blue-50 transition group"
    >
      <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-700 group-hover:text-white transition">
        {icon}
      </div>

      <h3 className="font-black text-slate-800">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>

      <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-blue-700">
        Acessar
        <ArrowUpRight size={14} />
      </span>
    </Link>
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

      <span className="text-sm font-black text-slate-800">
        {value}
      </span>
    </div>
  );
}

function Badge({ icon, label, className }) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1
        rounded-full
        text-xs
        font-black
        ${className}
      `}
    >
      {icon}
      {label}
    </span>
  );
}

function getPercent(value, total) {
  const safeTotal = number(total);

  if (safeTotal === 0) {
    return 0;
  }

  return Math.round(
    (number(value) / safeTotal) * 100
  );
}

function number(value) {
  return Number(value || 0);
}

function formatDate(value) {
  if (!value) {
    return "Agora";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function getToneClass(tone) {
  const tones = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
    },
    green: {
      icon: "bg-green-100 text-green-700",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
    },
    red: {
      icon: "bg-red-100 text-red-700",
    },
  };

  return tones[tone] || tones.blue;
}