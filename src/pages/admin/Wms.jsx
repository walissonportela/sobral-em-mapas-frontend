import { useEffect, useState } from "react";
import {
  Server,
  Plus,
  RefreshCcw,
  Pencil,
  Trash2,
  Search,
  Layers,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Database,
  Eye,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import WmsFormModal from "../../components/admin/WmsFormModal";

import {
  getWmsLinks,
  createWmsLink,
  updateWmsLink,
  deleteWmsLink,
  getWmsAvailableLayers,
} from "../../services/wmsService";

export default function Wms() {
  const [wmsLinks, setWmsLinks] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState(null);

  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [testResult, setTestResult] =
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

  const loadWmsLinks = async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await getWmsLinks();

      setWmsLinks(response.wmsLinks || []);
    } catch (requestError) {
      console.error(
        "Erro ao carregar links WMS:",
        requestError
      );

      const message = getErrorMessage(
        requestError,
        "Não foi possível carregar os links WMS."
      );

      setError(message);
      showToast("error", message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialWmsLinks = async () => {
      try {
        const response = await getWmsLinks();

        if (active) {
          setWmsLinks(response.wmsLinks || []);
        }
      } catch (requestError) {
        if (active) {
          console.error(
            "Erro ao carregar links WMS:",
            requestError
          );

          const message = getErrorMessage(
            requestError,
            "Não foi possível carregar os links WMS."
          );

          setError(message);

          setToast({
            type: "error",
            message,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialWmsLinks();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (payload) => {
    try {
      setSaving(true);

      if (modal?.wmsLink) {
        await updateWmsLink(
          modal.wmsLink.id,
          payload
        );

        showToast(
          "success",
          "Link WMS atualizado com sucesso."
        );
      } else {
        await createWmsLink(payload);

        showToast(
          "success",
          "Link WMS criado com sucesso."
        );
      }

      setModal(null);

      await loadWmsLinks();
    } catch (requestError) {
      console.error(
        "Erro ao salvar WMS:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível salvar o link WMS."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteWmsLink(deleteTarget.id);

      showToast(
        "success",
        "Link WMS excluído com sucesso."
      );

      setDeleteTarget(null);

      await loadWmsLinks();
    } catch (requestError) {
      console.error(
        "Erro ao excluir WMS:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível excluir o link WMS."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleTestLayers = async (wmsLink) => {
    try {
      setTestingId(wmsLink.id);
      setTestResult(null);

      const response =
        await getWmsAvailableLayers(wmsLink.id);

      const layers = normalizeLayersResponse(response);

      setTestResult({
        wmsLink,
        layers,
        total:
          response.total ??
          layers.length ??
          0,
        capabilitiesUrl:
          response.capabilities_url || "",
        success: response.success !== false,
      });

      showToast(
        "success",
        `${layers.length} layer(s) encontrada(s) no WMS.`
      );
    } catch (requestError) {
      console.error(
        "Erro ao testar layers do WMS:",
        requestError
      );

      const message = getErrorMessage(
        requestError,
        "Não foi possível buscar layers neste WMS."
      );

      setTestResult({
        wmsLink,
        layers: [],
        total: 0,
        capabilitiesUrl: "",
        success: false,
        message,
      });

      showToast("error", message);
    } finally {
      setTestingId(null);
    }
  };

  const filteredWmsLinks = wmsLinks.filter(
    (item) => {
      const searchText = search
        .trim()
        .toLowerCase();

      if (!searchText) {
        return true;
      }

      return (
        item.name?.toLowerCase().includes(searchText) ||
        item.url?.toLowerCase().includes(searchText) ||
        item.version?.toLowerCase().includes(searchText)
      );
    }
  );

  const totalWms = wmsLinks.length;

  const totalLinkedLayers = wmsLinks.reduce(
    (total, item) =>
      total +
      Number(
        item.layers_count ||
          item.layersCount ||
          0
      ),
    0
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Links WMS
            </h1>

            <p className="text-slate-500 mt-1">
              Cadastre servidores WMS para buscar e vincular novas camadas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadWmsLinks}
              disabled={refreshing}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-60 transition flex items-center gap-2"
            >
              <RefreshCcw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Atualizar
            </button>

            <button
              type="button"
              onClick={() =>
                setModal({
                  wmsLink: null,
                })
              }
              className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition flex items-center gap-2"
            >
              <Plus size={18} />
              Novo WMS
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Links WMS"
            value={totalWms}
            description="Servidores cadastrados"
            icon={<Server size={25} />}
            iconClass="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Layers vinculadas"
            value={totalLinkedLayers}
            description="Camadas ligadas a WMS"
            icon={<Layers size={25} />}
            iconClass="bg-green-100 text-green-700"
          />

          <StatCard
            title="Busca automática"
            value="ON"
            description="Consulta via GetCapabilities"
            icon={<Database size={25} />}
            iconClass="bg-amber-100 text-amber-700"
          />
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 space-y-5">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Servidores cadastrados
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Use a ação “Testar layers” para descobrir as camadas disponíveis em cada WMS.
                </p>
              </div>

              <span className="text-sm font-bold text-slate-500">
                {filteredWmsLinks.length} de {totalWms} link(s)
              </span>
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar por nome, URL ou versão..."
                className="
                  w-full
                  pl-11
                  pr-4
                  py-3
                  rounded-2xl
                  border
                  border-slate-200
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  transition
                "
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3 text-blue-700 font-semibold">
                <RefreshCcw
                  className="animate-spin"
                  size={22}
                />
                Carregando links WMS...
              </div>
            </div>
          ) : filteredWmsLinks.length === 0 ? (
            <EmptyWms
              hasWms={wmsLinks.length > 0}
              onCreate={() =>
                setModal({
                  wmsLink: null,
                })
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredWmsLinks.map((wmsLink) => (
                <WmsRow
                  key={wmsLink.id}
                  wmsLink={wmsLink}
                  testing={
                    testingId === wmsLink.id
                  }
                  onTest={() =>
                    handleTestLayers(wmsLink)
                  }
                  onEdit={() =>
                    setModal({
                      wmsLink,
                    })
                  }
                  onDelete={() =>
                    setDeleteTarget(wmsLink)
                  }
                />
              ))}
            </div>
          )}
        </section>

        {testResult && (
          <TestResultPanel
            result={testResult}
            onClose={() => setTestResult(null)}
          />
        )}
      </div>

      {modal && (
        <WmsFormModal
          wmsLink={modal.wmsLink}
          loading={saving}
          onClose={() => {
            if (!saving) {
              setModal(null);
            }
          }}
          onSubmit={handleSave}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir link WMS"
        message={
          deleteTarget
            ? `Tem certeza que deseja excluir o link WMS "${deleteTarget.name}"? Links com camadas vinculadas não poderão ser excluídos.`
            : ""
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
      />

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />
    </AdminLayout>
  );
}

function WmsRow({
  wmsLink,
  testing,
  onTest,
  onEdit,
  onDelete,
}) {
  const layersCount = Number(
    wmsLink.layers_count ||
      wmsLink.layersCount ||
      0
  );

  return (
    <article className="p-6 hover:bg-slate-50 transition">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Server size={26} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black text-slate-800">
                {wmsLink.name}
              </h3>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                v{wmsLink.version || "1.1.1"}
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-2 break-all flex items-center gap-2">
              <LinkIcon
                size={15}
                className="shrink-0"
              />
              {wmsLink.url}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-black">
                <CheckCircle2 size={13} />
                Cadastrado
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                <Layers size={13} />
                {layersCount} layer(s) vinculada(s)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={onTest}
            disabled={testing}
            className="px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 disabled:opacity-60 transition flex items-center gap-2"
          >
            {testing ? (
              <RefreshCcw
                size={17}
                className="animate-spin"
              />
            ) : (
              <Eye size={17} />
            )}

            Testar layers
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center"
            title="Editar WMS"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition flex items-center justify-center"
            title="Excluir WMS"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function TestResultPanel({ result, onClose }) {
  const layers = result.layers || [];

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2
                size={20}
                className="text-green-600"
              />
            ) : (
              <XCircle
                size={20}
                className="text-red-600"
              />
            )}

            <h2 className="text-xl font-black text-slate-800">
              Resultado do teste WMS
            </h2>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            {result.wmsLink.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
        >
          Fechar
        </button>
      </div>

      <div className="p-6 space-y-4">
        {result.message && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4">
            {result.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniInfo
            label="Total encontrado"
            value={result.total || layers.length}
          />

          <MiniInfo
            label="URL base"
            value={result.wmsLink.url}
            small
          />

          <MiniInfo
            label="Versão"
            value={result.wmsLink.version || "1.1.1"}
          />
        </div>

        {result.capabilitiesUrl && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-black text-slate-500 uppercase">
              GetCapabilities
            </p>

            <p className="text-sm text-slate-700 mt-1 break-all">
              {result.capabilitiesUrl}
            </p>
          </div>
        )}

        {layers.length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-black text-slate-800">
                Primeiras layers encontradas
              </h3>

              <p className="text-sm text-slate-500">
                Use o nome técnico no cadastro da camada.
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {layers.slice(0, 80).map((layer) => (
                <div
                  key={layer.name}
                  className="p-4 hover:bg-slate-50 transition"
                >
                  <p className="font-black text-slate-800">
                    {layer.title || layer.name}
                  </p>

                  <p className="text-sm text-blue-700 font-semibold mt-1">
                    {layer.name}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {layer.crs && (
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        {layer.crs}
                      </span>
                    )}

                    {layer.legend_url && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        Legenda disponível
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
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

      <div className="min-w-0">
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

function EmptyWms({ hasWms, onCreate }) {
  return (
    <div className="p-12 text-center">
      <div className="h-20 w-20 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
        <Server size={38} />
      </div>

      <h3 className="text-xl font-black text-slate-800 mt-5">
        {hasWms
          ? "Nenhum WMS encontrado"
          : "Nenhum WMS cadastrado"}
      </h3>

      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        Cadastre um servidor WMS para buscar layers disponíveis no GeoServer.
      </p>

      {!hasWms && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition inline-flex items-center gap-2"
        >
          <Plus size={18} />
          Criar WMS
        </button>
      )}
    </div>
  );
}

function MiniInfo({ label, value, small = false }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 min-w-0">
      <p className="text-xs font-black text-slate-500 uppercase">
        {label}
      </p>

      <p
        className={`
          mt-1
          font-black
          text-slate-800
          break-all
          ${small ? "text-sm" : "text-2xl"}
        `}
      >
        {value}
      </p>
    </div>
  );
}

function normalizeLayersResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.layers)) {
    return response.layers;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function getErrorMessage(requestError, fallback) {
  const data = requestError.response?.data;

  if (data?.errors) {
    const messages = Object.values(data.errors)
      .flat()
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return data?.message || data?.error || fallback;
}