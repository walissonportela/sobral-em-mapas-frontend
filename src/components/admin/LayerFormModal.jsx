// Sobral em Mapas — modal de criação/edição de camadas.
// Compatível com o contrato atual de POST/PUT /api/admin/layers.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  Layers,
  Link2,
  Loader2,
  MapPinned,
  Save,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getAvailableWmsLayers } from "../../services/layerService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");
const PROXY_WMS_URL = `${API_BASE_URL}/proxy-wms`;
const SOBRAL_CENTER = [-3.6892, -40.3489];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function LayerFormModal({
  layer,
  subcategories = [],
  wmsLinks = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(layer);
  const [form, setForm] = useState(() => getInitialForm(layer));
  const [availableLayers, setAvailableLayers] = useState([]);
  const [loadingWmsLayers, setLoadingWmsLayers] = useState(false);
  const [wmsError, setWmsError] = useState("");
  const [wmsSearch, setWmsSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape" && !loading) onClose?.();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [loading, onClose]);

  const selectedWmsLink = useMemo(
    () =>
      wmsLinks.find((item) => String(item.id) === String(form.wms_link_id)) ||
      null,
    [wmsLinks, form.wms_link_id]
  );

  const filteredAvailableLayers = useMemo(() => {
    const term = wmsSearch.trim().toLowerCase();
    if (!term) return availableLayers;
    return availableLayers.filter((item) =>
      [item.name, item.title, removeWorkspacePrefix(item.name)]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [availableLayers, wmsSearch]);

  const canSave =
    !loading &&
    form.name.trim().length > 0 &&
    normalizeTechnicalName(form.layer_name).length > 0 &&
    form.subcategory !== "";

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "layer_name") clearPreview();
  };

  const clearPreview = () => {
    setPreview(null);
    setPreviewError("");
    setPreviewLoading(false);
  };

  const changeWmsLink = (value) => {
    requestIdRef.current += 1;
    setForm((prev) => ({ ...prev, wms_link_id: value }));
    setAvailableLayers([]);
    setWmsSearch("");
    setWmsError("");
    setLoadingWmsLayers(false);
    clearPreview();
  };

  const fetchWmsLayers = async () => {
    if (!form.wms_link_id) return;
    const requestId = ++requestIdRef.current;
    setLoadingWmsLayers(true);
    setWmsError("");
    setAvailableLayers([]);

    try {
      const response = await getAvailableWmsLayers(form.wms_link_id);
      if (requestId !== requestIdRef.current) return;
      const found = Array.isArray(response.layers) ? response.layers : [];
      setAvailableLayers(found);
      if (!found.length) {
        setWmsError("Nenhuma camada foi encontrada neste serviço WMS.");
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setWmsError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Não foi possível consultar o serviço WMS. Verifique o link cadastrado."
      );
    } finally {
      if (requestId === requestIdRef.current) setLoadingWmsLayers(false);
    }
  };

  const startPreview = (technicalName, wmsLinkId = form.wms_link_id) => {
    const normalizedName = normalizeTechnicalName(technicalName);

    if (!normalizedName) {
      setPreviewError("Informe ou selecione uma camada antes de visualizar.");
      return;
    }

    const wmsLink = wmsLinks.find((item) => String(item.id) === String(wmsLinkId));
    setPreviewError("");
    setPreviewLoading(true);
    setPreview({
      key: `${normalizedName}-${wmsLinkId}-${Date.now()}`,
      layerName: normalizedName,
      wmsLinkId: wmsLinkId || "",
      version: wmsLink?.version || "1.1.1",
    });
  };

  const selectAvailableLayer = (item) => {
    const technicalName = normalizeTechnicalName(item.name);
    setForm((prev) => ({
      ...prev,
      name: getFriendlyLayerName(item.title, technicalName) || prev.name,
      layer_name: technicalName || prev.layer_name,
      crs: item.crs || prev.crs || "EPSG:4326",
      legend_url: item.legend_url || "",
      description: item.abstract || prev.description,
      type: "WMS",
    }));
    // A escolha no GetCapabilities já atualiza automaticamente o mapa à direita.
    startPreview(technicalName);
  };

  const handlePreview = () => startPreview(form.layer_name);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;

    onSubmit?.({
      name: form.name.trim(),
      // O GeoServer utilizado neste projeto trabalha com o nome sem workspace.
      layer_name: normalizeTechnicalName(form.layer_name),
      crs: form.crs.trim() || "EPSG:4326",
      legend_url: form.legend_url.trim() || null,
      type: form.type || "WMS",
      description: form.description.trim() || null,
      order: form.order === "" ? 0 : Number(form.order),
      subcategory: Number(form.subcategory),
      max_scale: form.max_scale === "" ? null : Number(form.max_scale),
      wms_link_id: form.wms_link_id === "" ? null : Number(form.wms_link_id),
      isPublic: Boolean(form.isPublic),
      // A interface não exibe estes campos, mas preserva os valores ao editar.
      image_path: form.image_path.trim() || null,
      symbol: form.symbol.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="layer-modal-title"
        className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Layers size={21} />
            </div>
            <div className="min-w-0">
              <h2 id="layer-modal-title" className="text-lg font-bold text-slate-900 sm:text-xl">
                {isEditing ? "Editar camada" : "Cadastrar camada"}
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Escolha a fonte, organize os dados e confira no mapa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar formulário"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="space-y-6 p-5 sm:p-7">
              <section aria-labelledby="wms-section-title">
                <SectionTitle number="1" icon={<Link2 size={18} />} title="Fonte cartográfica" id="wms-section-title" />
                <p className="mb-4 text-sm text-slate-500">
                  Selecione um serviço WMS e busque suas camadas. Ao escolher uma delas, os campos e a prévia serão preenchidos automaticamente. Também é possível cadastrar manualmente.
                </p>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Field label="Serviço WMS" htmlFor="layer-wms">
                    <select
                      id="layer-wms"
                      value={form.wms_link_id}
                      onChange={(e) => changeWmsLink(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    >
                      <option value="">Fonte padrão / sem vínculo WMS</option>
                      {wmsLinks.map((item) => (
                        <option key={item.id} value={item.id}>{getWmsLabel(item)}</option>
                      ))}
                    </select>
                  </Field>
                  <button
                    type="button"
                    onClick={fetchWmsLayers}
                    disabled={loading || loadingWmsLayers || !form.wms_link_id}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingWmsLayers ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
                    {loadingWmsLayers ? "Buscando..." : "Buscar camadas"}
                  </button>
                </div>

                {selectedWmsLink?.url && (
                  <p className="mt-2 break-all text-xs text-slate-500">Origem: {selectedWmsLink.url}</p>
                )}
                {wmsError && <Feedback tone="error">{wmsError}</Feedback>}

                {availableLayers.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2 pb-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {availableLayers.length} camada(s) encontrada(s)
                        </span>
                        <span className="text-xs text-slate-500">Selecione uma para preencher</span>
                      </div>
                      <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={wmsSearch}
                          onChange={(e) => setWmsSearch(e.target.value)}
                          placeholder="Filtrar pelo nome..."
                          aria-label="Filtrar camadas WMS"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>
                    <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto">
                      {filteredAvailableLayers.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">Nenhuma camada corresponde à busca.</p>
                      ) : (
                        filteredAvailableLayers.map((item) => {
                          const technical = removeWorkspacePrefix(item.name);
                          const selected = technical === form.layer_name;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              disabled={loading}
                              onClick={() => selectAvailableLayer(item)}
                              className={`flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-blue-50 disabled:opacity-50 ${selected ? "bg-blue-50" : "bg-white"}`}
                            >
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-slate-800">
                                  {getFriendlyLayerName(item.title, technical)}
                                </span>
                                <span className="block break-all text-xs text-slate-500">{item.name}</span>
                              </span>
                              {selected && <CheckCircle2 size={19} className="shrink-0 text-green-600" aria-label="Camada selecionada" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section aria-labelledby="details-section-title">
                <SectionTitle number="2" icon={<MapPinned size={18} />} title="Identificação e organização" id="details-section-title" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome de exibição *" htmlFor="layer-name" className="sm:col-span-2" help="Nome que aparece na lista de mapas para o usuário.">
                    <input
                      id="layer-name"
                      type="text"
                      required
                      maxLength={255}
                      value={form.name}
                      onChange={(e) => change("name", e.target.value)}
                      disabled={loading}
                      placeholder="Ex.: Escolas municipais"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Nome técnico no GeoServer *" htmlFor="layer-technical" help="Pode colar Ceara:escolas_municipais; o sistema salva somente escolas_municipais.">
                    <input
                      id="layer-technical"
                      type="text"
                      required
                      maxLength={255}
                      value={form.layer_name}
                      onChange={(e) => change("layer_name", e.target.value)}
                      disabled={loading}
                      placeholder="Ex.: escolas_municipais"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Subcategoria *" htmlFor="layer-subcategory" help="Define onde a camada ficará organizada no menu.">
                    <select
                      id="layer-subcategory"
                      required
                      value={form.subcategory}
                      onChange={(e) => change("subcategory", e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {subcategories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {getSubcategoryLabel(item)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Descrição (opcional)" htmlFor="layer-description" className="mt-4">
                  <textarea
                    id="layer-description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => change("description", e.target.value)}
                    disabled={loading}
                    placeholder="Sobre o que é esta camada?"
                    className={`${inputClass} resize-y`}
                  />
                </Field>

                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Globe2 size={16} className="text-blue-700" /> Camada pública
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">Permite que a camada apareça no mapa público, se estiver ativa.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => change("isPublic", e.target.checked)}
                    disabled={loading}
                    className="h-5 w-5 shrink-0 accent-blue-700"
                  />
                </label>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200" aria-labelledby="advanced-title">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((open) => !open)}
                  aria-expanded={advancedOpen}
                  aria-controls="layer-advanced-fields"
                  disabled={loading}
                  className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-800" id="advanced-title">
                    <Settings2 size={18} className="text-slate-600" /> Configurações avançadas
                  </span>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                </button>
                {advancedOpen && (
                  <div id="layer-advanced-fields" className="grid gap-4 p-4 sm:grid-cols-2">
                    <Field label="Sistema de coordenadas (CRS)" htmlFor="layer-crs">
                      <input id="layer-crs" type="text" value={form.crs} onChange={(e) => change("crs", e.target.value)} disabled={loading} placeholder="EPSG:4326" className={inputClass} />
                    </Field>
                    <Field label="Ordem de exibição" htmlFor="layer-order">
                      <input id="layer-order" type="number" step="1" value={form.order} onChange={(e) => change("order", e.target.value)} disabled={loading} placeholder="0" className={inputClass} />
                    </Field>
                    <Field label="Escala máxima (opcional)" htmlFor="layer-max-scale">
                      <input id="layer-max-scale" type="number" step="any" min="0" value={form.max_scale} onChange={(e) => change("max_scale", e.target.value)} disabled={loading} placeholder="Não definida" className={inputClass} />
                    </Field>
                    <Field label="URL da legenda (opcional)" htmlFor="layer-legend" className="sm:col-span-2">
                      <input id="layer-legend" type="text" value={form.legend_url} onChange={(e) => change("legend_url", e.target.value)} disabled={loading} placeholder="Preenchida ao escolher uma camada WMS" className={inputClass} />
                    </Field>
                  </div>
                )}
              </section>
            </div>

            <aside className="border-t border-slate-100 bg-slate-50/75 p-5 sm:p-7 xl:border-l xl:border-t-0" aria-label="Pré-visualização cartográfica">
              <div className="xl:sticky xl:top-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Eye size={19} className="text-blue-700" /> Pré-visualização
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">Confira a camada antes de salvar.</p>
                  </div>
                  {preview && (
                    <button type="button" onClick={clearPreview} disabled={loading} aria-label="Limpar pré-visualização" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100">
                      <EyeOff size={18} />
                    </button>
                  )}
                </div>

                <div className="relative mt-4 h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-[340px] xl:h-[390px]">
                  {preview ? (
                    <>
                      <PreviewMap
                        key={preview.key}
                        config={preview}
                        onLoaded={() => {
                          setPreviewLoading(false);
                          setPreviewError("");
                        }}
                        onError={() => {
                          setPreviewLoading(false);
                          setPreviewError("A prévia não carregou. Confira o nome técnico e a fonte WMS selecionada.");
                        }}
                      />
                      {previewLoading && (
                        <div className="absolute inset-0 z-[500] flex items-center justify-center gap-2 bg-white/75 text-sm font-semibold text-blue-700">
                          <Loader2 size={18} className="animate-spin" /> Carregando mapa...
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-7 text-center">
                      <div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><MapPinned size={30} /></div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">A camada ainda não foi visualizada</p>
                      <p className="max-w-xs text-xs text-slate-500">Selecione uma camada WMS ou informe seu nome técnico e clique em visualizar.</p>
                    </div>
                  )}
                </div>
                {previewError && <Feedback tone="error">{previewError}</Feedback>}

                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={loading || !normalizeTechnicalName(form.layer_name)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye size={18} /> {preview ? "Atualizar prévia" : "Visualizar no mapa"}
                </button>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Resumo do cadastro</p>
                  <p className="mt-2"><span className="text-slate-500">Nome:</span> {form.name.trim() || "Ainda não informado"}</p>
                  <p className="mt-1 break-all"><span className="text-slate-500">Camada:</span> {normalizeTechnicalName(form.layer_name) || "Ainda não informada"}</p>
                  <p className="mt-1"><span className="text-slate-500">Visibilidade:</span> {form.isPublic ? "Pública" : "Restrita"}</p>
                </div>
              </div>
            </aside>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
            <p className="hidden text-xs text-slate-500 md:block">* Campos obrigatórios</p>
            <div className="ml-auto flex w-full justify-end gap-3 sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar camada"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function PreviewMap({ config, onLoaded, onError }) {
  return (
    <MapContainer center={SOBRAL_CENTER} zoom={13} zoomControl className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <WMSTileLayer
        url={PROXY_WMS_URL}
        layers={config.layerName}
        transparent
        format="image/png"
        version={config.version}
        wms_link_id={config.wmsLinkId}
        crossOrigin="anonymous"
        eventHandlers={{ load: onLoaded, tileerror: onError }}
      />
    </MapContainer>
  );
}

function SectionTitle({ number, icon, title, id }) {
  return (
    <h3 id={id} className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700">{number}</span>
      <span className="text-blue-700">{icon}</span>
      {title}
    </h3>
  );
}

function Field({ label, htmlFor, children, help, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
    </div>
  );
}

function Feedback({ tone = "error", children }) {
  return (
    <div role="alert" className={`mt-3 flex gap-2 rounded-xl border p-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function getInitialForm(layer) {
  return {
    name: layer?.name || "",
    layer_name: layer?.layer_name || "",
    crs: layer?.crs || "EPSG:4326",
    legend_url: layer?.legend_url || "",
    type: layer?.type || "WMS",
    description: layer?.description || "",
    order: layer?.order == null ? "0" : String(layer.order),
    subcategory: getLayerSubcategoryId(layer),
    image_path: layer?.image_path || "",
    max_scale: layer?.max_scale == null ? "" : String(layer.max_scale),
    symbol: layer?.symbol || "",
    wms_link_id: layer?.wms_link_id == null ? "" : String(layer.wms_link_id),
    isPublic: layer?.isPublic == null ? true : Boolean(layer.isPublic),
  };
}

function getLayerSubcategoryId(layer) {
  if (!layer || layer.subcategory == null) return "";
  return String(
    typeof layer.subcategory === "object" ? layer.subcategory.id : layer.subcategory
  );
}

function getSubcategoryLabel(item) {
  const category = item.category?.name || "Sem categoria";
  return `${category} / ${item.name}${item.is_active === false ? " (inativa)" : ""}`;
}

function getWmsLabel(item) {
  return item.name || item.title || item.url || `WMS #${item.id}`;
}

function removeWorkspacePrefix(value) {
  return String(value || "").trim().split(":").pop().trim();
}

function normalizeTechnicalName(value) {
  return removeWorkspacePrefix(value);
}

function getFriendlyLayerName(title, technicalName) {
  const cleanTitle = removeWorkspacePrefix(title);
  const cleanTechnical = removeWorkspacePrefix(technicalName);
  const raw = cleanTitle && cleanTitle !== cleanTechnical ? cleanTitle : cleanTechnical || cleanTitle;
  return String(raw || "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
