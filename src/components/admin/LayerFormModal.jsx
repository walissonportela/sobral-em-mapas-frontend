import { useMemo, useState } from "react";
import {
  X,
  Layers,
  Loader2,
  Save,
  Map,
  FileText,
  Link as LinkIcon,
  Search,
  Wand2,
  Eye,
  EyeOff,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { getAvailableWmsLayers } from "../../services/layerService";

const PROXY_WMS_URL =
  "http://localhost:8080/api/proxy-wms";

const SOBRAL_CENTER = [-3.6892, -40.3489];

export default function LayerFormModal({
  layer,
  subcategories = [],
  wmsLinks = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() =>
    getInitialForm(layer)
  );

  const [availableLayers, setAvailableLayers] =
    useState([]);

  const [loadingWmsLayers, setLoadingWmsLayers] =
    useState(false);

  const [wmsSearch, setWmsSearch] = useState("");
  const [wmsError, setWmsError] = useState("");

  const [previewConfig, setPreviewConfig] =
    useState(null);

  const [previewError, setPreviewError] =
    useState("");

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const isEditing = Boolean(layer);

  const selectedWmsLink = useMemo(() => {
    return (
      wmsLinks.find(
        (item) =>
          String(item.id) ===
          String(form.wms_link_id)
      ) || null
    );
  }, [wmsLinks, form.wms_link_id]);

  const filteredAvailableLayers =
    availableLayers.filter((item) => {
      const searchText = wmsSearch
        .trim()
        .toLowerCase();

      if (!searchText) return true;

      return (
        item.name
          ?.toLowerCase()
          .includes(searchText) ||
        item.title
          ?.toLowerCase()
          .includes(searchText) ||
        removeWorkspacePrefix(item.name)
          .toLowerCase()
          .includes(searchText)
      );
    });

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (
      field === "layer_name" ||
      field === "wms_link_id"
    ) {
      setPreviewConfig(null);
      setPreviewError("");
    }
  };

  const handleFetchWmsLayers = async () => {
    if (!form.wms_link_id) {
      setWmsError(
        "Selecione um link WMS antes de buscar as layers."
      );
      return;
    }

    try {
      setLoadingWmsLayers(true);
      setWmsError("");

      const response = await getAvailableWmsLayers(
        form.wms_link_id
      );

      const layers = response.layers || [];

      setAvailableLayers(layers);

      if (layers.length === 0) {
        setWmsError(
          "Nenhuma layer foi encontrada nesse WMS."
        );
      }
    } catch (requestError) {
      console.error(
        "Erro ao buscar layers do WMS:",
        requestError
      );

      setWmsError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Não foi possível buscar as layers desse WMS."
      );
    } finally {
      setLoadingWmsLayers(false);
    }
  };

  const handleSelectAvailableLayer = (wmsLayer) => {
    const originalTechnicalName = wmsLayer.name || "";

    const technicalName = removeWorkspacePrefix(
      originalTechnicalName
    );

    const displayName = getFriendlyLayerName(
      wmsLayer.title,
      technicalName
    );

    setForm((previous) => ({
      ...previous,
      name: displayName || previous.name,
      layer_name: technicalName || previous.layer_name,
      crs:
        wmsLayer.crs ||
        previous.crs ||
        "EPSG:4326",
      legend_url:
        wmsLayer.legend_url ||
        previous.legend_url ||
        "",
      description:
        wmsLayer.abstract ||
        previous.description ||
        "",
      type: "WMS",
    }));

    setPreviewConfig(null);
    setPreviewError("");
  };

  const handlePreview = () => {
    if (!form.layer_name.trim()) {
      setPreviewError(
        "Informe o nome técnico da camada antes de pré-visualizar."
      );
      return;
    }

    setPreviewError("");
    setPreviewLoading(true);

    setPreviewConfig({
      key: `${form.layer_name}-${form.wms_link_id}-${Date.now()}`,
      layerName: form.layer_name.trim(),
      wmsLinkId: form.wms_link_id || "",
      version:
        selectedWmsLink?.version || "1.1.1",
    });
  };

  const handleClearPreview = () => {
    setPreviewConfig(null);
    setPreviewError("");
    setPreviewLoading(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: form.name.trim(),
      layer_name: form.layer_name.trim(),
      crs: form.crs.trim() || "EPSG:4326",
      legend_url: form.legend_url.trim() || null,
      type: form.type || "WMS",
      description:
        form.description.trim() || null,
      order:
        form.order === ""
          ? 0
          : Number(form.order),
      subcategory:
        form.subcategory === ""
          ? null
          : Number(form.subcategory),
      image_path:
        form.image_path.trim() || null,
      max_scale:
        form.max_scale === ""
          ? null
          : Number(form.max_scale),
      symbol: form.symbol.trim() || null,
      wms_link_id:
        form.wms_link_id === ""
          ? null
          : Number(form.wms_link_id),
      isPublic: Boolean(form.isPublic),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Layers size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {isEditing
                  ? "Editar camada"
                  : "Nova camada"}
              </h2>

              <p className="text-sm text-slate-500">
                Configure, busque no WMS e pré-visualize antes de salvar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-50 flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto"
        >
          <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Wand2
                    size={18}
                    className="text-blue-700"
                  />

                  <h3 className="font-black text-slate-800">
                    Buscar layers disponíveis no WMS
                  </h3>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  Escolha um link WMS, busque as camadas disponíveis e clique em uma delas para preencher o formulário.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFetchWmsLayers}
                disabled={
                  loading ||
                  loadingWmsLayers ||
                  !form.wms_link_id
                }
                className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loadingWmsLayers ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Buscar layers
                  </>
                )}
              </button>
            </div>

            {wmsError && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
                {wmsError}
              </div>
            )}

            {availableLayers.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={wmsSearch}
                    onChange={(event) =>
                      setWmsSearch(event.target.value)
                    }
                    placeholder="Filtrar layers encontradas..."
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

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {filteredAvailableLayers.map(
                    (item) => {
                      const cleanTechnicalName =
                        removeWorkspacePrefix(
                          item.name
                        );

                      const isSelected =
                        cleanTechnicalName ===
                        form.layer_name;

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() =>
                            handleSelectAvailableLayer(
                              item
                            )
                          }
                          className={`
                            w-full
                            text-left
                            p-4
                            transition
                            ${
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-blue-50"
                            }
                          `}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="font-black text-slate-800">
                                {getFriendlyLayerName(
                                  item.title,
                                  cleanTechnicalName
                                )}
                              </p>

                              <p className="text-xs text-blue-700 font-semibold mt-1">
                                Original WMS: {item.name}
                              </p>

                              <p className="text-xs text-green-700 font-black mt-1">
                                Será salvo como:{" "}
                                {cleanTechnicalName}
                              </p>
                            </div>

                            {isSelected && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-black">
                                <CheckCircle2
                                  size={13}
                                />
                                Selecionada
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.crs && (
                              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                {item.crs}
                              </span>
                            )}

                            {item.legend_url && (
                              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                Legenda disponível
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Map
                size={18}
                className="text-blue-700"
              />

              <h3 className="font-black text-slate-800">
                Identificação
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <FormField label="Nome da camada">
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  required
                  autoFocus
                  placeholder="Ex: Praças, Escolas, Bares..."
                  className={inputClass}
                />

                <HelpText>
                  Esse é o nome que aparece para o usuário no sistema.
                </HelpText>
              </FormField>

              <FormField label="Nome técnico da camada">
                <input
                  type="text"
                  value={form.layer_name}
                  onChange={(event) =>
                    handleChange(
                      "layer_name",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  required
                  placeholder="Ex: bar_map"
                  className={inputClass}
                />

                <HelpText>
                  No seu projeto, salve sem o prefixo do workspace. Exemplo: use bar_map, não Ceara:bar_map.
                </HelpText>
              </FormField>

              <FormField label="Tipo">
                <select
                  value={form.type}
                  onChange={(event) =>
                    handleChange(
                      "type",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="WMS">WMS</option>
                  <option value="GeoJSON">
                    GeoJSON
                  </option>
                  <option value="Raster">
                    Raster
                  </option>
                </select>
              </FormField>

              <FormField label="CRS">
                <input
                  type="text"
                  value={form.crs}
                  onChange={(event) =>
                    handleChange(
                      "crs",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="EPSG:4326"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Ordem">
                <input
                  type="number"
                  value={form.order}
                  onChange={(event) =>
                    handleChange(
                      "order",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="0"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Escala máxima">
                <input
                  type="number"
                  step="any"
                  value={form.max_scale}
                  onChange={(event) =>
                    handleChange(
                      "max_scale",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </FormField>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon
                size={18}
                className="text-blue-700"
              />

              <h3 className="font-black text-slate-800">
                Agrupamento e WMS
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <FormField label="Subcategoria">
                <select
                  value={form.subcategory}
                  onChange={(event) =>
                    handleChange(
                      "subcategory",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="">
                    Sem subcategoria
                  </option>

                  {subcategories.map(
                    (subcategory) => (
                      <option
                        key={subcategory.id}
                        value={subcategory.id}
                      >
                        {getSubcategoryLabel(
                          subcategory
                        )}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Link WMS">
                <select
                  value={form.wms_link_id}
                  onChange={(event) => {
                    handleChange(
                      "wms_link_id",
                      event.target.value
                    );

                    setAvailableLayers([]);
                    setWmsError("");
                    setWmsSearch("");
                    setPreviewConfig(null);
                    setPreviewError("");
                  }}
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="">
                    Nenhum link WMS
                  </option>

                  {wmsLinks.map((wmsLink) => (
                    <option
                      key={wmsLink.id}
                      value={wmsLink.id}
                    >
                      {getWmsLabel(wmsLink)}
                    </option>
                  ))}
                </select>

                {selectedWmsLink && (
                  <HelpText>
                    URL: {selectedWmsLink.url}
                  </HelpText>
                )}
              </FormField>

              <FormField label="URL da legenda">
                <input
                  type="text"
                  value={form.legend_url}
                  onChange={(event) =>
                    handleChange(
                      "legend_url",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="https://..."
                  className={inputClass}
                />
              </FormField>

              <FormField label="Caminho da imagem">
                <input
                  type="text"
                  value={form.image_path}
                  onChange={(event) =>
                    handleChange(
                      "image_path",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Símbolo">
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(event) =>
                    handleChange(
                      "symbol",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </FormField>

              <div className="flex items-end">
                <label className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-700">
                      Camada pública
                    </p>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Quando pública, poderá aparecer no mapa.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(event) =>
                      handleChange(
                        "isPublic",
                        event.target.checked
                      )
                    }
                    disabled={loading}
                    className="h-5 w-5 accent-blue-700"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Eye
                    size={18}
                    className="text-blue-700"
                  />

                  <h3 className="font-black text-slate-800">
                    Pré-visualização da camada
                  </h3>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  Veja como a camada vai aparecer no mapa antes de salvar.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={
                    loading ||
                    !form.layer_name.trim()
                  }
                  className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Eye size={18} />
                  Pré-visualizar
                </button>

                <button
                  type="button"
                  onClick={handleClearPreview}
                  disabled={!previewConfig}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <EyeOff size={18} />
                  Limpar
                </button>
              </div>
            </div>

            {previewError && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm flex gap-2">
                <AlertTriangle
                  size={18}
                  className="shrink-0 mt-0.5"
                />
                {previewError}
              </div>
            )}

            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
              <div className="h-[360px] relative">
                {!previewConfig ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                    <div>
                      <div className="h-16 w-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                        <Map size={30} />
                      </div>

                      <h4 className="font-black text-slate-800 mt-4">
                        Nenhuma pré-visualização carregada
                      </h4>

                      <p className="text-sm text-slate-500 mt-2 max-w-md">
                        Escolha uma layer ou informe o nome técnico e clique em “Pré-visualizar”.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {previewLoading && (
                      <div className="absolute inset-0 z-[500] bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex items-center gap-2 text-blue-700 font-bold">
                          <Loader2
                            size={20}
                            className="animate-spin"
                          />
                          Carregando prévia...
                        </div>
                      </div>
                    )}

                    <PreviewMap
                      key={previewConfig.key}
                      config={previewConfig}
                      onLoaded={() =>
                        setPreviewLoading(false)
                      }
                      onError={() => {
                        setPreviewLoading(false);
                        setPreviewError(
                          "A camada não carregou na prévia. Confira se o nome técnico está correto. No seu projeto, normalmente ele deve estar sem o prefixo do workspace."
                        );
                      }}
                    />
                  </>
                )}
              </div>

              {previewConfig && (
                <div className="p-4 border-t border-slate-200 bg-white">
                  <p className="text-xs font-black text-slate-500 uppercase">
                    Parâmetros da prévia
                  </p>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <InfoBox
                      label="Layer"
                      value={
                        previewConfig.layerName
                      }
                    />

                    <InfoBox
                      label="Formato"
                      value="image/png"
                    />

                    <InfoBox
                      label="WMS"
                      value={
                        selectedWmsLink?.name ||
                        "Proxy padrão"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText
                size={18}
                className="text-blue-700"
              />

              <h3 className="font-black text-slate-800">
                Descrição
              </h3>
            </div>

            <textarea
              value={form.description}
              onChange={(event) =>
                handleChange(
                  "description",
                  event.target.value
                )
              }
              disabled={loading}
              rows={4}
              placeholder="Descreva a finalidade desta camada..."
              className={`
                ${inputClass}
                resize-none
              `}
            />
          </section>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-sm text-slate-500">
              Dica: o nome técnico salvo será sempre o nome sem o prefixo do workspace.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm((previous) => ({
                    ...previous,
                    name: getFriendlyLayerName(
                      previous.name,
                      previous.layer_name
                    ),
                  }));
                }}
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition flex items-center gap-2"
              >
                <RotateCcw size={18} />
                Ajustar nome
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !form.name.trim() ||
                  !form.layer_name.trim()
                }
                className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar camada
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewMap({
  config,
  onLoaded,
  onError,
}) {
  return (
    <MapContainer
      center={SOBRAL_CENTER}
      zoom={13}
      zoomControl
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <WMSTileLayer
        url={PROXY_WMS_URL}
        params={{
          layers: config.layerName,
          transparent: true,
          format: "image/png",
          version: config.version || "1.1.1",
          wms_link_id: config.wmsLinkId || "",
        }}
        eventHandlers={{
          load: onLoaded,
          tileerror: onError,
        }}
      />
    </MapContainer>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>

      {children}
    </div>
  );
}

function HelpText({ children }) {
  return (
    <p className="text-xs text-slate-400 mt-1">
      {children}
    </p>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-700 break-all mt-1">
        {value}
      </p>
    </div>
  );
}

const inputClass = `
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
  disabled:bg-slate-100
  disabled:cursor-not-allowed
  transition
`;

function getInitialForm(layer) {
  return {
    name: layer?.name || "",
    layer_name: layer?.layer_name || "",
    crs: layer?.crs || "EPSG:4326",
    legend_url: layer?.legend_url || "",
    type: layer?.type || "WMS",
    description: layer?.description || "",
    order:
      layer?.order === null ||
      layer?.order === undefined
        ? ""
        : String(layer.order),
    subcategory: getLayerSubcategoryId(layer),
    image_path: layer?.image_path || "",
    max_scale:
      layer?.max_scale === null ||
      layer?.max_scale === undefined
        ? ""
        : String(layer.max_scale),
    symbol: layer?.symbol || "",
    wms_link_id:
      layer?.wms_link_id === null ||
      layer?.wms_link_id === undefined
        ? ""
        : String(layer.wms_link_id),
    isPublic:
      layer?.isPublic === undefined ||
      layer?.isPublic === null
        ? true
        : Boolean(layer.isPublic),
  };
}

function getLayerSubcategoryId(layer) {
  if (!layer) return "";

  if (
    typeof layer.subcategory === "object" &&
    layer.subcategory !== null
  ) {
    return String(layer.subcategory.id);
  }

  if (
    layer.subcategory !== null &&
    layer.subcategory !== undefined
  ) {
    return String(layer.subcategory);
  }

  return "";
}

function getSubcategoryLabel(subcategory) {
  const categoryName =
    subcategory.category?.name || "Sem categoria";

  const status = subcategory.is_active
    ? ""
    : " - Inativa";

  return `${categoryName} / ${subcategory.name}${status}`;
}

function getWmsLabel(wmsLink) {
  return (
    wmsLink.name ||
    wmsLink.title ||
    wmsLink.url ||
    wmsLink.base_url ||
    wmsLink.link ||
    `WMS #${wmsLink.id}`
  );
}

function removeWorkspacePrefix(value) {
  if (!value) return "";

  const parts = String(value).split(":");

  return parts[parts.length - 1];
}

function getFriendlyLayerName(title, technicalName) {
  const cleanedTitle = removeWorkspacePrefix(
    title || ""
  );

  const cleanedTechnicalName =
    removeWorkspacePrefix(technicalName || "");

  const raw =
    cleanedTitle &&
    cleanedTitle !== cleanedTechnicalName
      ? cleanedTitle
      : cleanedTechnicalName || cleanedTitle;

  if (!raw) return "";

  return String(raw)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}