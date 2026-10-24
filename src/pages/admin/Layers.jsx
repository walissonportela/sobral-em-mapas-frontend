import { useEffect, useState } from "react";
import {
  Layers as LayersIcon,
  RefreshCcw,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  Globe2,
  Lock,
  Search,
  Map,
  Link as LinkIcon,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import LayerFormModal from "../../components/admin/LayerFormModal";
import GeoJSONDownloadButton from "../../components/admin/GeoJSONDownloadButton";

import {
  getLayers,
  createLayer,
  updateLayer,
  updateLayerStatus,
  deleteLayer,
} from "../../services/layerService";

export default function Layers() {
  const [layers, setLayers] = useState([]);
  const [subcategories, setSubcategories] =
    useState([]);
  const [wmsLinks, setWmsLinks] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] =
    useState(null);

  const [error, setError] = useState("");
  const [layerModal, setLayerModal] =
    useState(null);
  const [deleteTarget, setDeleteTarget] =
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

  const loadLayers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getLayers();

      setLayers(response.layers || []);
      setSubcategories(response.subcategories || []);
      setWmsLinks(response.wmsLinks || []);
    } catch (requestError) {
      console.error(
        "Erro ao carregar camadas:",
        requestError
      );

      const message = getErrorMessage(
        requestError,
        "Não foi possível carregar as camadas."
      );

      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialLayers = async () => {
      try {
        const response = await getLayers();

        if (active) {
          setLayers(response.layers || []);
          setSubcategories(
            response.subcategories || []
          );
          setWmsLinks(response.wmsLinks || []);
        }
      } catch (requestError) {
        if (active) {
          console.error(
            "Erro ao carregar camadas:",
            requestError
          );

          const message = getErrorMessage(
            requestError,
            "Não foi possível carregar as camadas."
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

    loadInitialLayers();

    return () => {
      active = false;
    };
  }, []);

  const handleSaveLayer = async (payload) => {
    try {
      setSaving(true);

      if (layerModal?.layer) {
        await updateLayer(
          layerModal.layer.id,
          payload
        );

        showToast(
          "success",
          "Camada atualizada com sucesso."
        );
      } else {
        await createLayer(payload);

        showToast(
          "success",
          "Camada criada com sucesso."
        );
      }

      setLayerModal(null);

      await loadLayers();
    } catch (requestError) {
      console.error(
        "Erro ao salvar camada:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível salvar a camada."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLayerStatus = async (layer) => {
    const nextStatus = !layer.is_active;

    try {
      setStatusLoadingId(layer.id);

      const response = await updateLayerStatus(
        layer.id,
        nextStatus
      );

      showToast(
        "success",
        response.message ||
          (nextStatus
            ? "Camada ativada com sucesso."
            : "Camada desativada com sucesso.")
      );

      await loadLayers();
    } catch (requestError) {
      console.error(
        "Erro ao alterar status da camada:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível alterar o status da camada."
        )
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteLayer(deleteTarget.id);

      showToast(
        "success",
        "Camada excluída definitivamente com sucesso."
      );

      setDeleteTarget(null);

      await loadLayers();
    } catch (requestError) {
      console.error(
        "Erro ao excluir camada:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível excluir definitivamente a camada."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredLayers = layers.filter((layer) => {
    const searchText = search
      .trim()
      .toLowerCase();

    const matchesSearch =
      !searchText ||
      layer.name?.toLowerCase().includes(searchText) ||
      layer.layer_name
        ?.toLowerCase()
        .includes(searchText) ||
      getLayerSubcategoryLabel(layer)
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" &&
        layer.is_active) ||
      (statusFilter === "inactive" &&
        !layer.is_active) ||
      (statusFilter === "public" &&
        layer.isPublic) ||
      (statusFilter === "private" &&
        !layer.isPublic);

    return matchesSearch && matchesStatus;
  });

  const totalLayers = layers.length;

  const totalActive = layers.filter(
    (layer) => layer.is_active
  ).length;

  const totalInactive = totalLayers - totalActive;

  const totalPublic = layers.filter(
    (layer) => layer.isPublic
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Camadas
            </h1>

            <p className="text-slate-500 mt-1">
              Gerencie as camadas exibidas no Sobral em Mapas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadLayers}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-60 transition flex items-center gap-2"
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

            <button
              type="button"
              onClick={() =>
                setLayerModal({
                  layer: null,
                })
              }
              className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition flex items-center gap-2"
            >
              <Plus size={18} />
              Nova camada
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Total"
            value={totalLayers}
            description="Camadas cadastradas"
            icon={<LayersIcon size={25} />}
            iconClass="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Ativas"
            value={totalActive}
            description="Disponíveis para uso"
            icon={<CheckCircle2 size={25} />}
            iconClass="bg-green-100 text-green-700"
          />

          <StatCard
            title="Inativas"
            value={totalInactive}
            description="Ocultas temporariamente"
            icon={<XCircle size={25} />}
            iconClass="bg-red-100 text-red-700"
          />

          <StatCard
            title="Públicas"
            value={totalPublic}
            description="Visíveis no mapa público"
            icon={<Globe2 size={25} />}
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
                  Lista de camadas
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Use desativação para ocultar temporariamente e exclusão definitiva apenas quando tiver certeza.
                </p>
              </div>

              <span className="text-sm font-bold text-slate-500">
                {filteredLayers.length} de {totalLayers} camada(s)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
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
                  placeholder="Buscar por nome, nome técnico ou subcategoria..."
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

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="
                  w-full
                  px-4
                  py-3
                  rounded-2xl
                  border
                  border-slate-200
                  outline-none
                  bg-white
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  transition
                "
              >
                <option value="all">
                  Todas
                </option>

                <option value="active">
                  Ativas
                </option>

                <option value="inactive">
                  Inativas
                </option>

                <option value="public">
                  Públicas
                </option>

                <option value="private">
                  Privadas
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3 text-blue-700 font-semibold">
                <RefreshCcw
                  className="animate-spin"
                  size={22}
                />

                Carregando camadas...
              </div>
            </div>
          ) : filteredLayers.length === 0 ? (
            <EmptyLayers
              hasLayers={layers.length > 0}
              onCreate={() =>
                setLayerModal({
                  layer: null,
                })
              }
            />
          ) : (
            <>
              {/* Cartões responsivos: melhor leitura em celulares e tablets. */}
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:hidden sm:p-5">
                {filteredLayers.map((layer) => (
                  <LayerCard
                    key={layer.id}
                    layer={layer}
                    statusLoadingId={statusLoadingId}
                    onEdit={() => setLayerModal({ layer })}
                    onToggleStatus={() => handleToggleLayerStatus(layer)}
                    onDelete={() => setDeleteTarget(layer)}
                    onNotify={showToast}
                  />
                ))}
              </div>

              {/* Tabela com proporções estáveis em telas grandes. */}
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1060px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[29%]" />
                    <col className="w-[23%]" />
                    <col className="w-[12%]" />
                    <col className="w-[15%]" />
                    <col className="w-[21%]" />
                  </colgroup>
                  <thead className="border-b border-blue-100 bg-blue-50/60">
                    <tr>
                      {[
                        "Camada",
                        "Categoria e subcategoria",
                        "Formato",
                        "Visibilidade",
                        "Ações",
                      ].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className={`px-4 py-4 text-[11px] font-black uppercase tracking-wider text-slate-600 ${heading === "Ações" ? "text-right" : ""}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLayers.map((layer) => (
                      <LayerRow
                        key={layer.id}
                        layer={layer}
                        statusLoadingId={statusLoadingId}
                        onEdit={() => setLayerModal({ layer })}
                        onToggleStatus={() => handleToggleLayerStatus(layer)}
                        onDelete={() => setDeleteTarget(layer)}
                        onNotify={showToast}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {layerModal && (
        <LayerFormModal
          layer={layerModal.layer}
          subcategories={subcategories}
          wmsLinks={wmsLinks}
          loading={saving}
          onClose={() => {
            if (!saving) {
              setLayerModal(null);
            }
          }}
          onSubmit={handleSaveLayer}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir camada definitivamente"
        message={
          deleteTarget
            ? `Tem certeza que deseja excluir definitivamente a camada "${deleteTarget.name}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmText="Excluir definitivamente"
        cancelText="Cancelar"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
      />

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={closeToast}
      />
    </AdminLayout>
  );
}

/** Ações compartilhadas entre a tabela e os cartões responsivos. */
function LayerActions({
  layer,
  statusLoadingId,
  onEdit,
  onToggleStatus,
  onDelete,
  onNotify,
}) {
  const isStatusLoading = statusLoadingId === layer.id;

  return (
    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
      <button
        type="button"
        onClick={onToggleStatus}
        disabled={isStatusLoading}
        aria-label={layer.is_active ? "Desativar camada" : "Reativar camada"}
        title={layer.is_active ? "Desativar camada" : "Reativar camada"}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          layer.is_active
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-green-50 text-green-700 hover:bg-green-100"
        }`}
      >
        {isStatusLoading ? (
          <RefreshCcw size={17} className="animate-spin" />
        ) : layer.is_active ? (
          <PowerOff size={17} />
        ) : (
          <Power size={17} />
        )}
      </button>

      <GeoJSONDownloadButton layer={layer} onNotify={onNotify} />

      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${layer.name}`}
        title="Editar camada"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Pencil size={17} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir ${layer.name}`}
        title="Excluir definitivamente"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function LayerFormat({ layer }) {
  const isGeojson = layer.source_format === "GEOJSON";
  const label = isGeojson ? "GeoJSON" : layer.type || "WMS";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span
        className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-extrabold ${
          isGeojson
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-blue-200 bg-blue-50 text-blue-700"
        }`}
      >
        {label}
      </span>
      <span className="text-xs font-medium text-slate-500">
        {layer.crs || "EPSG:4326"}
      </span>
    </div>
  );
}

function LayerIdentity({ layer }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          layer.is_active
            ? "bg-blue-100 text-blue-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        <Map size={21} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          title={layer.name}
          className={`line-clamp-3 break-words text-sm font-extrabold leading-snug [overflow-wrap:anywhere] ${
            layer.is_active ? "text-slate-800" : "text-slate-500"
          }`}
        >
          {layer.name}
        </p>
        <p
          title={layer.layer_name}
          className="mt-1 truncate text-xs font-medium text-slate-400"
        >
          {layer.layer_name}
        </p>
      </div>
    </div>
  );
}

function LayerGrouping({ layer }) {
  const category = layer.subcategory?.category?.name || "Sem categoria";
  const subcategory = layer.subcategory?.name || "Sem subcategoria";

  return (
    <div className="min-w-0 space-y-1">
      <p className="break-words text-sm font-bold leading-snug text-slate-700 [overflow-wrap:anywhere]">
        {category}
      </p>
      <p className="break-words text-xs leading-snug text-slate-500 [overflow-wrap:anywhere]">
        {subcategory}
      </p>
      {layer.source_format === "GEOJSON" ? (
        <p className="text-xs text-emerald-700">Arquivo geográfico</p>
      ) : (
        <div className="min-w-0 truncate text-xs text-slate-400" title="Fonte WMS">
          {getLayerWmsLabel(layer)}
        </div>
      )}
    </div>
  );
}

function LayerRow({
  layer,
  statusLoadingId,
  onEdit,
  onToggleStatus,
  onDelete,
  onNotify,
}) {
  return (
    <tr
      className={`align-top transition-colors ${
        layer.is_active ? "hover:bg-blue-50/40" : "bg-slate-50/60 hover:bg-slate-100"
      }`}
    >
      <td className="px-4 py-5"><LayerIdentity layer={layer} /></td>
      <td className="px-4 py-5"><LayerGrouping layer={layer} /></td>
      <td className="px-4 py-5"><LayerFormat layer={layer} /></td>
      <td className="px-4 py-5">
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge active={layer.is_active} />
          <PublicBadge isPublic={layer.isPublic} />
        </div>
      </td>
      <td className="px-4 py-5">
        <LayerActions
          layer={layer}
          statusLoadingId={statusLoadingId}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onNotify={onNotify}
        />
      </td>
    </tr>
  );
}

function LayerCard({
  layer,
  statusLoadingId,
  onEdit,
  onToggleStatus,
  onDelete,
  onNotify,
}) {
  return (
    <article
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 shadow-sm ${
        layer.is_active
          ? "border-slate-200 bg-white"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <LayerIdentity layer={layer} />
      <div className="rounded-xl bg-slate-50 p-3">
        <LayerGrouping layer={layer} />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LayerFormat layer={layer} />
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge active={layer.is_active} />
          <PublicBadge isPublic={layer.isPublic} />
        </div>
      </div>
      <div className="mt-auto border-t border-slate-100 pt-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Ações da camada
        </div>
        <LayerActions
          layer={layer}
          statusLoadingId={statusLoadingId}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onNotify={onNotify}
        />
      </div>
    </article>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-black">
      <CheckCircle2 size={13} />
      Ativa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black">
      <XCircle size={13} />
      Inativa
    </span>
  );
}

function PublicBadge({ isPublic }) {
  return isPublic ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-black">
      <Globe2 size={13} />
      Pública
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">
      <Lock size={13} />
      Privada
    </span>
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

function EmptyLayers({ hasLayers, onCreate }) {
  return (
    <div className="p-12 text-center">
      <div className="h-20 w-20 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
        <LayersIcon size={38} />
      </div>

      <h3 className="text-xl font-black text-slate-800 mt-5">
        {hasLayers
          ? "Nenhuma camada encontrada"
          : "Nenhuma camada cadastrada"}
      </h3>

      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        {hasLayers
          ? "Altere os filtros ou limpe a busca para visualizar as camadas."
          : "Crie a primeira camada para começar a gerenciar os mapas disponíveis."}
      </p>

      {!hasLayers && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition inline-flex items-center gap-2"
        >
          <Plus size={18} />
          Criar camada
        </button>
      )}
    </div>
  );
}

function getLayerSubcategoryLabel(layer) {
  if (
    typeof layer.subcategory === "object" &&
    layer.subcategory !== null
  ) {
    const categoryName =
      layer.subcategory.category?.name ||
      "Sem categoria";

    return `${categoryName} / ${layer.subcategory.name}`;
  }

  return "Sem subcategoria";
}

function getLayerWmsLabel(layer) {
  const wmsLink = layer.wms_link || layer.wmsLink;

  if (!wmsLink) {
    return "Sem link WMS";
  }

  const label =
    wmsLink.name ||
    wmsLink.title ||
    wmsLink.url ||
    wmsLink.base_url ||
    wmsLink.link ||
    `WMS #${wmsLink.id}`;

  return (
    <span className="inline-flex items-center gap-1">
      <LinkIcon size={13} />
      {label}
    </span>
  );
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

  return data?.message || fallback;
}