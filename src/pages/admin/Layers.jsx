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
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Camada
                    </th>

                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Agrupamento
                    </th>

                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                      Tipo
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
                  {filteredLayers.map((layer) => (
                    <LayerRow
                      key={layer.id}
                      layer={layer}
                      statusLoadingId={
                        statusLoadingId
                      }
                      onEdit={() =>
                        setLayerModal({
                          layer,
                        })
                      }
                      onToggleStatus={() =>
                        handleToggleLayerStatus(layer)
                      }
                      onDelete={() =>
                        setDeleteTarget(layer)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
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

function LayerRow({
  layer,
  statusLoadingId,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const isStatusLoading =
    statusLoadingId === layer.id;

  return (
    <tr
      className={`
        transition
        ${
          layer.is_active
            ? "hover:bg-slate-50"
            : "bg-slate-50/70 hover:bg-slate-100"
        }
      `}
    >
      <td className="px-6 py-4 min-w-[320px]">
        <div className="flex items-center gap-3">
          <div
            className={`
              h-11
              w-11
              rounded-2xl
              flex
              items-center
              justify-center
              shrink-0
              ${
                layer.is_active
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-500"
              }
            `}
          >
            <Map size={21} />
          </div>

          <div className="min-w-0">
            <p
              className={`
                font-black
                truncate
                ${
                  layer.is_active
                    ? "text-slate-800"
                    : "text-slate-500"
                }
              `}
            >
              {layer.name}
            </p>

            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {layer.layer_name}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 min-w-[260px]">
        <p className="font-bold text-slate-700">
          {getLayerSubcategoryLabel(layer)}
        </p>

        <p className="text-xs text-slate-400 mt-0.5">
          {getLayerWmsLabel(layer)}
        </p>
      </td>

      <td className="px-6 py-4">
        <div className="space-y-1">
          <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
            {layer.type || "WMS"}
          </span>

          <p className="text-xs text-slate-500">
            {layer.crs || "EPSG:4326"}
          </p>
        </div>
      </td>

      <td className="px-6 py-4 min-w-[180px]">
        <div className="flex flex-wrap gap-2">
          <StatusBadge active={layer.is_active} />
          <PublicBadge isPublic={layer.isPublic} />
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={isStatusLoading}
            className={`
              h-10
              w-10
              rounded-xl
              transition
              disabled:opacity-60
              flex
              items-center
              justify-center
              ${
                layer.is_active
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }
            `}
            title={
              layer.is_active
                ? "Desativar camada"
                : "Reativar camada"
            }
          >
            {isStatusLoading ? (
              <RefreshCcw
                size={17}
                className="animate-spin"
              />
            ) : layer.is_active ? (
              <PowerOff size={17} />
            ) : (
              <Power size={17} />
            )}
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center"
            title="Editar camada"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition flex items-center justify-center"
            title="Excluir definitivamente"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </tr>
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