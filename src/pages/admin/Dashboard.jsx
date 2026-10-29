import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FolderPlus,
  FolderTree,
  Globe2,
  Layers3,
  LockKeyhole,
  MapPinned,
  RefreshCcw,
  Server,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../services/dashboardService";

export default function Dashboard() {
  const { user } = useAuth();
  const isSuperadmin = user?.profile?.nome === "Superadministrador";
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "bem-vindo";

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInitialStats() {
      try {
        const response = await getDashboardStats();
        if (active) {
          setStats(response.data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          console.error("Erro ao carregar dashboard:", requestError);
          setError(
            requestError.response?.data?.message ||
              "Não foi possível carregar os indicadores do painel."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialStats();
    return () => {
      active = false;
    };
  }, []);

  async function handleRefresh() {
    if (refreshing) return;

    try {
      setRefreshing(true);
      setError("");
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (requestError) {
      console.error("Erro ao atualizar dashboard:", requestError);
      setError(
        requestError.response?.data?.message ||
          "Não foi possível atualizar os indicadores. Os dados anteriores continuam visíveis."
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-sm">
            <RefreshCcw size={20} className="animate-spin text-blue-700" />
            Carregando visão geral...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Não foi possível abrir o painel</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {error || "Os indicadores não estão disponíveis no momento."}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
            Tentar novamente
          </button>
        </div>
      </AdminLayout>
    );
  }

  const users = stats.users || {};
  const maps = stats.maps || {};
  const categories = maps.categories || {};
  const subcategories = maps.subcategories || {};
  const layers = maps.layers || {};
  const wms = stats.wms || {};

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
      <div className="mx-auto max-w-[1600px] space-y-6 lg:space-y-7">
        {/* Cabeçalho principal: mais leve, com hierarquia e ações claras. */}
        <header className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-white shadow-[0_22px_55px_-30px_rgba(12,52,116,0.65)]">
          {/* Textura cartográfica sutil, sem imagens externas. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.055]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div
            className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[54px] border-white/[0.06]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7 lg:px-9 lg:pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-blue-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <MapPinned size={18} strokeWidth={2} />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
                  Sobral em Mapas
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-blue-200/70 sm:block" />
                <span className="hidden text-xs text-blue-200 sm:block">Painel de gestão</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                <ShieldCheck size={14} />
                {isSuperadmin ? "Superadministrador" : "Administrador"}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:mt-9 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-2 text-sm font-medium text-blue-200">
                  Olá, {firstName}!
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[42px] lg:leading-tight">
                  Visão geral do sistema
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
                  {isSuperadmin
                    ? "Acompanhe a estrutura cartográfica, a publicação de camadas e a administração de usuários em um só lugar."
                    : "Acompanhe a estrutura cartográfica, as camadas publicadas e os serviços de mapas do município."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={17} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Atualizando..." : "Atualizar dados"}
                </button>
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-blue-950 shadow-sm transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <MapPinned size={17} />
                  Abrir mapa
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 border-t border-white/15 pt-5 sm:grid-cols-3 sm:gap-4">
              <HeroMetric icon={<FolderTree size={18} />} label="Categorias" value={categories.total} />
              <HeroMetric icon={<Layers3 size={18} />} label="Camadas ativas" value={layers.active} />
              <HeroMetric icon={<Globe2 size={18} />} label="Camadas públicas" value={layers.public} />
            </div>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Indicadores que respeitam o perfil do usuário. */}
        <section aria-label="Indicadores principais" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isSuperadmin && (
            <>
              <DashboardCard
                title="Usuários cadastrados"
                value={users.total}
                subtitle={`${number(users.approved)} aprovados · ${number(users.pending)} pendentes`}
                icon={<Users size={22} />}
                tone="blue"
              />
              <DashboardCard
                title="Solicitações pendentes"
                value={users.pending}
                subtitle={number(users.pending) > 0 ? "Aguardando análise" : "Nenhuma solicitação pendente"}
                icon={<UserPlus size={22} />}
                tone={number(users.pending) > 0 ? "amber" : "green"}
              />
            </>
          )}
          <DashboardCard
            title="Camadas ativas"
            value={layers.active}
            subtitle={`${percent(layers.active, layers.total)}% das camadas cadastradas`}
            icon={<Layers3 size={22} />}
            tone="green"
          />
          <DashboardCard
            title="Camadas públicas"
            value={layers.public}
            subtitle={`${percent(layers.public, layers.total)}% disponíveis no mapa público`}
            icon={<Globe2 size={22} />}
            tone="amber"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Panel className="xl:col-span-2">
            <SectionTitle
              icon={<FolderTree size={19} />}
              eyebrow="Organização"
              title="Estrutura do mapa"
              description="Distribuição das categorias, subcategorias e camadas cadastradas."
              trailing={
                <div className="flex flex-wrap gap-2">
                  <Badge tone="green" icon={<CheckCircle2 size={13} />}>
                    {activeStructureTotal} ativos
                  </Badge>
                  <Badge tone="red" icon={<XCircle size={13} />}>
                    {inactiveStructureTotal} inativos
                  </Badge>
                </div>
              }
            />
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StructureCard title="Categorias" total={categories.total} active={categories.active} inactive={categories.inactive} icon={<FolderTree size={19} />} />
              <StructureCard title="Subcategorias" total={subcategories.total} active={subcategories.active} inactive={subcategories.inactive} icon={<FolderPlus size={19} />} />
              <StructureCard title="Camadas" total={layers.total} active={layers.active} inactive={layers.inactive} icon={<Layers3 size={19} />} />
            </div>
          </Panel>

          <Panel>
            <SectionTitle
              icon={<Globe2 size={19} />}
              eyebrow="Visibilidade"
              title="Publicação"
              description="Como as camadas estão disponíveis na plataforma."
            />
            <div className="mt-6 space-y-5">
              <ProgressMetric label="Camadas públicas" value={layers.public} total={layers.total} />
              <ProgressMetric label="Camadas ativas" value={layers.active} total={layers.total} />
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <MiniMetric icon={<Globe2 size={17} />} label="Públicas" value={layers.public} className="bg-amber-50 text-amber-800" />
                <MiniMetric icon={<LockKeyhole size={17} />} label="Privadas" value={layers.private} className="bg-slate-100 text-slate-700" />
              </div>
            </div>
          </Panel>
        </section>

        <section className={`grid grid-cols-1 gap-5 ${isSuperadmin ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
          {isSuperadmin && (
            <Panel>
              <SectionTitle icon={<Users size={19} />} eyebrow="Acessos" title="Usuários por perfil" />
              <div className="mt-6 space-y-2.5">
                <ProfileItem icon={<ShieldCheck size={18} />} label="Superadministradores" value={users.superadministradores} tone="blue" />
                <ProfileItem icon={<UserCheck size={18} />} label="Administradores" value={users.administradores} tone="green" />
                <ProfileItem icon={<Users size={18} />} label="Visitantes" value={users.visitantes} tone="amber" />
                <ProfileItem icon={<UserPlus size={18} />} label="Pendentes" value={users.pending} tone="red" />
              </div>
            </Panel>
          )}

          <Panel>
            <SectionTitle icon={<Server size={19} />} eyebrow="Integrações" title="Vínculos WMS" />
            <div className="mt-6 space-y-4">
              <StatusItem icon={<Server size={17} />} label="Links cadastrados" value={number(wms.total)} />
              <StatusItem icon={<Database size={17} />} label="Camadas com vínculo WMS" value={number(wms.layers_with_wms)} />
              <StatusItem icon={<Layers3 size={17} />} label="Camadas sem vínculo WMS" value={number(wms.layers_without_wms)} />
            </div>
            <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
              Camadas GeoJSON podem funcionar normalmente sem vínculo WMS. Estes números não representam a disponibilidade do GeoServer.
            </p>
          </Panel>

          <Panel>
            <SectionTitle icon={<Activity size={19} />} eyebrow="Monitoramento" title="Estado do painel" />
            <div className="mt-6 space-y-4">
              <StatusItem icon={<CheckCircle2 size={17} />} label="API de indicadores" value="Respondendo" />
              <StatusItem icon={<ShieldCheck size={17} />} label="Área administrativa" value="Autenticada" />
              <StatusItem icon={<Clock3 size={17} />} label="Atualizado em" value={formatDate(stats.generated_at)} />
            </div>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              O status indica apenas que os dados do painel foram carregados, não a disponibilidade de todos os serviços externos.
            </p>
          </Panel>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Navegação</span>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">Acesso rápido</h2>
              <p className="mt-1 text-sm text-slate-500">Continue trabalhando nos principais módulos do sistema.</p>
            </div>
            <ArrowRight size={19} className="hidden text-slate-300 sm:block" />
          </div>
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${isSuperadmin ? "xl:grid-cols-4" : "xl:grid-cols-2"}`}>
            {isSuperadmin && (
              <>
                <QuickAction to="/admin/users" title="Usuários" description="Perfis, contas e permissões." icon={<Users size={21} />} />
                <QuickAction to="/admin/requests" title="Solicitações" description="Aprovar ou recusar cadastros." icon={<UserPlus size={21} />} />
              </>
            )}
            <QuickAction to="/admin/categories" title="Categorias" description="Organize a estrutura dos mapas." icon={<FolderTree size={21} />} />
            <QuickAction to="/admin/layers" title="Camadas" description="Gerencie e publique os dados." icon={<Layers3 size={21} />} />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function HeroMetric({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 sm:px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-100">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-blue-200">{label}</p>
        <p className="text-lg font-extrabold leading-snug text-white">{number(value)}</p>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, eyebrow, title, description, trailing }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-blue-700">{eyebrow}</p>
          <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>}
        </div>
      </div>
      {trailing}
    </div>
  );
}

function DashboardCard({ title, value, subtitle, icon, tone = "blue" }) {
  const tones = {
    blue: { icon: "bg-blue-50 text-blue-700", detail: "bg-blue-500" },
    green: { icon: "bg-emerald-50 text-emerald-700", detail: "bg-emerald-500" },
    amber: { icon: "bg-amber-50 text-amber-700", detail: "bg-amber-400" },
    red: { icon: "bg-red-50 text-red-700", detail: "bg-red-500" },
  };
  const color = tones[tone] || tones.blue;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className={`absolute left-0 top-0 h-1 w-full ${color.detail}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color.icon}`}>
          {icon}
        </div>
        <Activity size={17} className="text-slate-300" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{number(value)}</p>
      <p className="mt-2 min-h-4 text-xs leading-snug text-slate-500">{subtitle}</p>
    </div>
  );
}

function StructureCard({ title, total, active, inactive, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">{icon}</span>
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">{number(total)}</span>
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-emerald-50 px-2.5 py-2 text-emerald-800">
          <p className="text-[11px] font-medium">Ativas</p>
          <p className="text-lg font-extrabold">{number(active)}</p>
        </div>
        <div className="rounded-xl bg-slate-200/70 px-2.5 py-2 text-slate-700">
          <p className="text-[11px] font-medium">Inativas</p>
          <p className="text-lg font-extrabold">{number(inactive)}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressMetric({ label, value, total }) {
  const valuePercent = percent(value, total);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold tabular-nums text-slate-500">{number(value)}/{number(total)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valuePercent}
        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${valuePercent}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{valuePercent}% do total</p>
    </div>
  );
}

function MiniMetric({ icon, label, value, className }) {
  return (
    <div className={`rounded-xl p-3.5 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold">{icon}<span>{label}</span></div>
      <p className="mt-2 text-2xl font-extrabold">{number(value)}</p>
    </div>
  );
}

function ProfileItem({ icon, label, value, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone] || tones.blue}`}>
          {icon}
        </span>
        <span className="truncate text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <span className="text-lg font-extrabold tabular-nums text-slate-900">{number(value)}</span>
    </div>
  );
}

function StatusItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2.5 text-slate-600">
        <span className="shrink-0 text-blue-600">{icon}</span>
        <span className="text-xs leading-snug sm:text-sm">{label}</span>
      </div>
      <span className="text-right text-xs font-bold text-slate-900 sm:text-sm">{value}</span>
    </div>
  );
}

function QuickAction({ to, title, description, icon }) {
  return (
    <Link
      to={to}
      className="group flex min-h-[132px] flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
          {icon}
        </span>
        <ExternalLink size={16} className="text-slate-300 transition group-hover:text-blue-600" />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function Badge({ children, icon, tone = "green" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles[tone] || styles.green}`}>
      {icon}
      {children}
    </span>
  );
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(value, total) {
  const safeTotal = number(total);
  if (safeTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((number(value) / safeTotal) * 100)));
}

function formatDate(value) {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleString("pt-BR");
}
