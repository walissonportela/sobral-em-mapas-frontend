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
  FileUp,
  PenTool,
  RefreshCcw,
  Link2,
  Loader2,
  MapPinned,
  Save,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import GeoJSONDrawingEditor from "./GeoJSONDrawingEditor";
import "leaflet/dist/leaflet.css";
import { getAvailableWmsLayers } from "../../services/layerService";
import {
  listGeojsonFiles,
  uploadGeojsonFile,
  getGeojsonFileContent,
} from "../../services/geojsonFileService";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");
const PROXY_WMS_URL = `${API_BASE_URL}/proxy-wms`;
const SOBRAL_CENTER = [-3.6892, -40.3489];
const GEOJSON_PATH_PATTERN = /^\/(?:api\/)?geodata\/[A-Za-z0-9_-]+\.geojson$/;
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
  const isGeoJSON = form.source_format === "GEOJSON";
  const [availableLayers, setAvailableLayers] = useState([]);
  const [loadingWmsLayers, setLoadingWmsLayers] = useState(false);
  const [wmsError, setWmsError] = useState("");
  const [wmsSearch, setWmsSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const requestIdRef = useRef(0);
  const geojsonAbortRef = useRef(null);
  const [storedGeojsonFiles, setStoredGeojsonFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState("new");
  const [drawingInitialData, setDrawingInitialData] = useState(null);
  const [drawingLoading, setDrawingLoading] = useState(false);
  // O caminho é interno ao formulário; administradores escolhem pelo nome do arquivo.
  const selectedGeojsonPath = form.geojson_path.trim();
  const isLegacyGeojson = selectedGeojsonPath.startsWith("/geodata/");
  const isUploadedGeojson = selectedGeojsonPath.startsWith("/api/geodata/");
  const selectedFileInList = storedGeojsonFiles.some(
    (item) => item.geojson_path === selectedGeojsonPath
  );
  const uploadInputRef = useRef(null);
  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      geojsonAbortRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        if (drawingOpen) setDrawingOpen(false);
        else onClose?.();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [loading, onClose, drawingOpen]);
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
    !fileUploading &&
    form.name.trim().length > 0 &&
    normalizeTechnicalName(form.layer_name).length > 0 &&
    form.subcategory !== "" &&
    (!isGeoJSON || GEOJSON_PATH_PATTERN.test(form.geojson_path.trim()));

  useEffect(() => {
    if (!isGeoJSON) return;

    let active = true;
    const fetchFiles = async () => {
      try {
        const files = await listGeojsonFiles();
        if (active) setStoredGeojsonFiles(Array.isArray(files) ? files : []);
      } catch (error) {
        if (active) {
          setFilesError(getFriendlyGeojsonApiError(error));
        }
      }
    };
    fetchFiles();

    return () => {
      active = false;
    };
  }, [isGeoJSON]);

  const refreshGeojsonFiles = async () => {
    setFilesLoading(true);
    setFilesError("");
    try {
      const files = await listGeojsonFiles();
      setStoredGeojsonFiles(Array.isArray(files) ? files : []);
    } catch (error) {
      setFilesError(getFriendlyGeojsonApiError(error));
    } finally {
      setFilesLoading(false);
    }
  };

  const handleUploadGeojson = async (event) => {
    const file = event.target.files?.[0];
    // Permite selecionar novamente o mesmo arquivo após um erro.
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".geojson")) {
      setFilesError("Selecione um arquivo com a extensão .geojson.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFilesError("O arquivo deve ter no máximo 10 MB.");
      return;
    }

    setFileUploading(true);
    setFilesError("");
    setFileSuccess("");
    try {
      const uploaded = await uploadGeojsonFile(file);
      if (uploaded?.geojson_path && GEOJSON_PATH_PATTERN.test(uploaded.geojson_path)) {
        // A camada referencia a URL pública, que estará acessível após a publicação.
        // A API retorna o caminho interno; não precisamos mostrá-lo na interface.
        const baseName = file.name.replace(/\.geojson$/i, "");
        setForm((prev) => ({
          ...prev,
          geojson_path: uploaded.geojson_path,
          name: prev.name || getFriendlyLayerName(baseName, baseName),
          layer_name: prev.layer_name || getTechnicalNameFromFilename(baseName),
        }));
        clearPreview();
      }
      setFileSuccess("Arquivo enviado! Confira a prévia e complete os dados da camada para publicar.");
      const files = await listGeojsonFiles();
      setStoredGeojsonFiles(Array.isArray(files) ? files : []);
    } catch (error) {
      setFilesError(getFriendlyGeojsonApiError(error));
    } finally {
      setFileUploading(false);
    }
  };

  // Abre uma cópia da camada existente para edição. O arquivo publicado fica
  // intacto até que o administrador confirme "Salvar alterações".
  const handleEditExistingGeojson = async () => {
    const path = form.geojson_path.trim();
    if (!GEOJSON_PATH_PATTERN.test(path) || drawingLoading || fileUploading) return;
    setFilesError("");
    setDrawingLoading(true);
    try {
      let data;
      if (path.startsWith("/api/geodata/")) {
        const filename = path.slice("/api/geodata/".length);
        data = await getGeojsonFileContent(filename);
      } else {
        const response = await fetch(path);
        if (!response.ok) throw new Error("O arquivo selecionado não está disponível.");
        data = await response.json();
      }
      if (!data || !["FeatureCollection", "Feature", "GeometryCollection"].includes(data.type)) {
        throw new Error("O arquivo não contém feições GeoJSON editáveis.");
      }
      const sample = L.geoJSON(data);
      if (!sample.getLayers().length || !sample.getBounds().isValid()) {
        throw new Error("Nenhuma geometria válida foi encontrada no arquivo.");
      }
      setDrawingInitialData(data);
      setDrawingMode("edit");
      setDrawingOpen(true);
    } catch (error) {
      setFilesError(getFriendlyGeojsonApiError(error));
    } finally {
      setDrawingLoading(false);
    }
  };

  const handleSaveDrawing = async (geojson) => {
    if (!geojson?.features?.length) return;
    const suffix = Date.now();
    const filename = `desenho_${suffix}.geojson`;
    const file = new File([JSON.stringify(geojson)], filename, {
      type: "application/geo+json",
    });

    setFileUploading(true);
    setFilesError("");
    setFileSuccess("");
    try {
      const uploaded = await uploadGeojsonFile(file);
      if (!uploaded?.geojson_path || !GEOJSON_PATH_PATTERN.test(uploaded.geojson_path)) {
        throw new Error("O servidor não retornou o caminho do arquivo criado.");
      }
      clearPreview();
      setForm((prev) => ({
        ...prev,
        geojson_path: uploaded.geojson_path,
        name: prev.name.trim() || `Camada desenhada ${new Date().toLocaleString("pt-BR")}`,
        layer_name: prev.layer_name.trim() || `desenho_${suffix}`,
        crs: "EPSG:4326",
      }));
      // Exibe a geometria imediatamente, sem exigir que esteja publicada.
      setPreview({
        key: `desenho-${suffix}`,
        sourceFormat: "GEOJSON",
        geojsonData: geojson,
        geojsonPath: uploaded.geojson_path,
      });
      setDrawingOpen(false);
      setFileSuccess(isEditing
        ? "Nova versão salva! Confira a prévia e clique em Salvar alterações para atualizar esta camada. O arquivo anterior foi preservado."
        : "Desenho armazenado! Confira a prévia e complete o cadastro da camada.");
      const files = await listGeojsonFiles();
      setStoredGeojsonFiles(Array.isArray(files) ? files : []);
    } catch (error) {
      setFilesError(getFriendlyGeojsonApiError(error));
    } finally {
      setFileUploading(false);
    }
  };

  const clearPreview = () => {
    geojsonAbortRef.current?.abort();
    geojsonAbortRef.current = null;
    setPreview(null);
    setPreviewError("");
    setPreviewLoading(false);
  };

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "layer_name" || field === "geojson_path") clearPreview();
  };

  const changeSourceFormat = (value) => {
    requestIdRef.current += 1;
    setLoadingWmsLayers(false);
    setAvailableLayers([]);
    setWmsSearch("");
    setWmsError("");
    clearPreview();
    setDrawingOpen(false);
    setForm((prev) => ({
      ...prev,
      source_format: value,
      type: value === "WMS" ? prev.type || "WMS" : null,
    }));
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
      // Nunca exibe HTML ou mensagens técnicas retornadas pelo servidor.
      setWmsError(getFriendlyWmsError(error));
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
      sourceFormat: "WMS",
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
  const handlePreview = async () => {
    if (!isGeoJSON) {
      startPreview(form.layer_name);
      return;
    }

    const path = form.geojson_path.trim();
    if (!GEOJSON_PATH_PATTERN.test(path)) {
      setPreviewError("Selecione ou envie um arquivo GeoJSON antes de visualizar.");
      return;
    }

    clearPreview();
    const controller = new AbortController();
    geojsonAbortRef.current = controller;
    setPreviewLoading(true);

    try {
      let data;
      if (path.startsWith("/api/geodata/")) {
        // A pré-visualização de uploads ainda não publicados exige o token do admin.
        const filename = path.substring("/api/geodata/".length);
        data = await getGeojsonFileContent(filename, controller.signal);
      } else {
        // Mantém suporte aos arquivos antigos em frontend/public/geodata.
        const response = await fetch(path, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Não foi possível localizar o arquivo selecionado.");
        }
        data = await response.json();
      }
      const valid = data && (
        (data.type === "FeatureCollection" && Array.isArray(data.features)) ||
        data.type === "Feature" ||
        data.type === "GeometryCollection" ||
        ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"].includes(data.type)
      );
      if (!valid) throw new Error("O arquivo não contém dados GeoJSON válidos.");

      // Validar também as geometrias antes de renderizar o mapa.
      const bounds = L.geoJSON(data).getBounds();
      if (!bounds.isValid()) throw new Error("O GeoJSON não contém geometrias com coordenadas válidas.");

      if (controller.signal.aborted) return;
      setPreview({
        key: `${path}-${Date.now()}`,
        sourceFormat: "GEOJSON",
        geojsonData: data,
        geojsonPath: path,
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        const status = error?.response?.status;
        setPreviewError(
          status === 401 ? "Sessão expirada. Entre novamente no painel administrativo." :
          status === 403 ? "Você não tem permissão para visualizar este GeoJSON." :
          status === 404 ? "Arquivo não encontrado. Confira a seleção ou envie-o novamente." :
          status >= 500 ? "Não foi possível carregar o arquivo no momento. Tente novamente." :
          error?.message || "Não foi possível carregar o GeoJSON."
        );
      }
    } finally {
      if (!controller.signal.aborted) setPreviewLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;

    onSubmit?.({
      name: form.name.trim(),
      layer_name: normalizeTechnicalName(form.layer_name),
      source_format: form.source_format,
      geojson_path: isGeoJSON ? form.geojson_path.trim() : null,
      crs: form.crs.trim() || "EPSG:4326",
      legend_url: isGeoJSON ? null : form.legend_url.trim() || null,
      type: isGeoJSON ? null : (form.type || "WMS"),
      description: form.description.trim() || null,
      order: form.order === "" ? 0 : Number(form.order),
      subcategory: Number(form.subcategory),
      max_scale: form.max_scale === "" ? null : Number(form.max_scale),
      wms_link_id: isGeoJSON || form.wms_link_id === "" ? null : Number(form.wms_link_id),
      isPublic: Boolean(form.isPublic),
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
              <section aria-labelledby="source-section-title">
                  <SectionTitle number="1" icon={<Link2 size={18} />} title="Fonte cartográfica" id="source-section-title" />
                  <Field
                    label="Formato da camada"
                    htmlFor="layer-source-format"
                    help="Escolha um serviço de mapas (WMS) ou um arquivo geográfico (GeoJSON)."
                  >
                    <select
                      id="layer-source-format"
                      className={inputClass}
                      value={form.source_format}
                      onChange={(e) => changeSourceFormat(e.target.value)}
                      disabled={loading}
                    >
                      <option value="WMS">WMS — Serviço geoespacial</option>
                      <option value="GEOJSON">GeoJSON — Arquivo</option>
                    </select>
                  </Field>
              </section>

              {isGeoJSON ? (
                  <section aria-labelledby="geojson-section-title">
                    <SectionTitle
                      number="2"
                      icon={<MapPinned size={18} />}
                      title="Selecionar arquivo GeoJSON"
                      id="geojson-section-title"
                    />
                    <p className="mb-4 text-sm text-slate-500">
                      Escolha um arquivo já disponível ou envie um novo para utilizar nesta camada.
                    </p>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          <FileUp size={17} className="text-blue-700" /> Biblioteca de arquivos
                        </h4>
                        <button
                          type="button"
                          title="Atualizar lista de arquivos"
                          aria-label="Atualizar lista de arquivos"
                          onClick={refreshGeojsonFiles}
                          disabled={loading || filesLoading || fileUploading}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-blue-50 disabled:opacity-50"
                        >
                          <RefreshCcw size={16} className={filesLoading ? "animate-spin" : ""} />
                        </button>
                      </div>

                      <Field label="Arquivo GeoJSON *" htmlFor="layer-stored-geojson">
                        <select
                          id="layer-stored-geojson"
                          className={inputClass}
                          value={selectedGeojsonPath}
                          onChange={(event) => {
                            change("geojson_path", event.target.value);
                            setFileSuccess("");
                          }}
                          disabled={loading || filesLoading || fileUploading}
                          required
                        >
                          <option value="">Selecione um arquivo GeoJSON</option>
                          {isLegacyGeojson && (
                            <option value={selectedGeojsonPath}>
                              Arquivo atual — {getGeojsonDisplayName(selectedGeojsonPath)}
                            </option>
                          )}
                          {isUploadedGeojson && !selectedFileInList && (
                            <option value={selectedGeojsonPath}>
                              Arquivo atual — {getGeojsonDisplayName(selectedGeojsonPath)}
                            </option>
                          )}
                          {storedGeojsonFiles.map((item) => (
                            <option key={item.filename} value={item.geojson_path}>
                              {getGeojsonDisplayName(item.filename)} ({formatFileSize(item.size_bytes)})
                            </option>
                          ))}
                        </select>
                      </Field>

                      {!filesLoading && storedGeojsonFiles.length === 0 && !selectedGeojsonPath && (
                        <p className="text-xs text-slate-500">
                          Nenhum arquivo disponível. Envie um GeoJSON para começar.
                        </p>
                      )}

                      <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-semibold text-slate-400">ou</span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>

                      <div>
                        <input
                          ref={uploadInputRef}
                          type="file"
                          accept=".geojson,application/geo+json,application/json"
                          onChange={handleUploadGeojson}
                          className="hidden"
                          aria-label="Selecionar arquivo GeoJSON para enviar"
                        />
                        <button
                          type="button"
                          disabled={loading || fileUploading}
                          onClick={() => uploadInputRef.current?.click()}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                        >
                          {fileUploading ? <Loader2 size={17} className="animate-spin" /> : <FileUp size={17} />}
                          {fileUploading ? "Enviando arquivo..." : "Enviar novo arquivo GeoJSON"}
                        </button>
                        <p className="mt-2 text-center text-xs text-slate-500">
                          Arquivos .geojson de até 10 MB
                        </p>
                      </div>

                      <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-semibold text-slate-400">ou</span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                      <button
                        type="button"
                        disabled={loading || fileUploading || drawingLoading}
                        onClick={() => {
                          if (drawingOpen) {
                            setDrawingOpen(false);
                          } else {
                            setDrawingMode("new");
                            setDrawingInitialData(null);
                            setDrawingOpen(true);
                          }
                        }}
                        aria-expanded={drawingOpen && drawingMode === "new"}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                      >
                        <PenTool size={17} /> {drawingOpen ? "Fechar editor de desenho" : "Desenhar nova camada no mapa"}
                      </button>
                      {isEditing && selectedGeojsonPath && (
                        <button
                          type="button"
                          disabled={loading || fileUploading || drawingLoading || drawingOpen}
                          onClick={handleEditExistingGeojson}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {drawingLoading ? <Loader2 size={17} className="animate-spin" /> : <PenTool size={17} />}
                          {drawingLoading ? "Carregando desenhos..." : "Editar geometrias desta camada"}
                        </button>
                      )}
                      {drawingOpen && (
                        <GeoJSONDrawingEditor
                          key={drawingMode === "edit" ? `edit-${selectedGeojsonPath}` : "new"}
                          initialGeojson={drawingMode === "edit" ? drawingInitialData : null}
                          saving={fileUploading}
                          onSave={handleSaveDrawing}
                          onCancel={() => setDrawingOpen(false)}
                        />
                      )}

                      {filesError && <Feedback tone="error">{filesError}</Feedback>}
                      {fileSuccess && <Feedback tone="info">{fileSuccess}</Feedback>}
                      {selectedGeojsonPath && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={17} className="shrink-0 text-blue-700" />
                            <span className="min-w-0 break-words">
                              <strong>Selecionado:</strong> {getGeojsonDisplayName(selectedGeojsonPath)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            Clique em “Visualizar no mapa” para conferir as geometrias antes de salvar.
                          </p>
                          {isLegacyGeojson && (
                            <p className="mt-1 text-xs text-slate-500">
                              Este arquivo já fazia parte da plataforma e continua compatível.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  <section aria-labelledby="wms-section-title">
                    <SectionTitle number="2" icon={<Link2 size={18} />} title="Serviço WMS" id="wms-section-title" />
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
              )}
              <section aria-labelledby="details-section-title">
                  <SectionTitle number="3" icon={<MapPinned size={18} />} title="Identificação e organização" id="details-section-title" />
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
                  <Field
                    label={isGeoJSON ? "Identificador técnico *" : "Nome técnico no GeoServer *"}
                    htmlFor="layer-technical"
                    help={isGeoJSON
                      ? "Identificador único para a camada. Ex.: bairros_sobral_2023."
                      : "Pode colar Ceara:escolas_municipais; o sistema salva somente escolas_municipais."}
                  >
                    <input
                      id="layer-technical"
                      type="text"
                      required
                      maxLength={255}
                      value={form.layer_name}
                      onChange={(e) => change("layer_name", e.target.value)}
                      disabled={loading}
                      placeholder={isGeoJSON ? "Ex.: bairros_sobral_2023" : "Ex.: escolas_municipais"}
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
                    {!isGeoJSON && (
                      <Field label="URL da legenda (opcional)" htmlFor="layer-legend" className="sm:col-span-2">
                        <input id="layer-legend" type="text" value={form.legend_url} onChange={(e) => change("legend_url", e.target.value)} disabled={loading} placeholder="Preenchida ao escolher uma camada WMS" className={inputClass} />
                      </Field>
                    )}
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
                    <p className="mt-1 text-sm text-slate-500">
                      {isGeoJSON ? "Confira o arquivo GeoJSON antes de salvar." : "Confira a camada antes de salvar."}
                    </p>
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
                  ) : previewLoading ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-blue-700">
                      <Loader2 size={18} className="animate-spin" /> Carregando arquivo GeoJSON...
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-7 text-center">
                      <div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><MapPinned size={30} /></div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">A camada ainda não foi visualizada</p>
                      <p className="max-w-xs text-xs text-slate-500">
                        {isGeoJSON
                          ? "Selecione ou envie um arquivo GeoJSON e clique em visualizar."
                          : "Selecione uma camada WMS ou informe seu nome técnico e clique em visualizar."}
                      </p>
                    </div>
                  )}
                </div>
                {previewError && <Feedback tone="error">{previewError}</Feedback>}
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={loading || previewLoading || (isGeoJSON
                    ? !GEOJSON_PATH_PATTERN.test(form.geojson_path.trim())
                    : !normalizeTechnicalName(form.layer_name))}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye size={18} /> {preview ? "Atualizar prévia" : "Visualizar no mapa"}
                </button>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Resumo do cadastro</p>
                  <p className="mt-2"><span className="text-slate-500">Nome:</span> {form.name.trim() || "Ainda não informado"}</p>
                  <p className="mt-1 break-all"><span className="text-slate-500">Camada:</span> {normalizeTechnicalName(form.layer_name) || "Ainda não informada"}</p>
                  <p className="mt-1"><span className="text-slate-500">Formato:</span> {isGeoJSON ? "GeoJSON" : "WMS"}</p>
                  {isGeoJSON && (
                    <p className="mt-1 break-all"><span className="text-slate-500">Arquivo:</span> {selectedGeojsonPath ? getGeojsonDisplayName(selectedGeojsonPath) : "Ainda não selecionado"}</p>
                  )}
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
// Interpreta os estilos gravados em properties.estilo, tal como o mapa público.
function previewFeatureStyle(feature) {
  const saved = feature?.properties?.estilo;
  const color = /^#[0-9a-f]{6}$/i.test(saved?.cor || "")
    ? saved.cor
    : "#2563eb";
  const rawWidth = Number(saved?.espessura);
  const rawLineOpacity = Number(saved?.opacidade_linha);
  const rawFillOpacity = Number(saved?.opacidade_preenchimento);
  const lineType = saved?.tipo_linha;

  return {
    color,
    fillColor: color,
    weight: Number.isFinite(rawWidth) && rawWidth > 0
      ? Math.min(20, Math.max(1, rawWidth))
      : 2,
    opacity: saved?.opacidade_linha !== undefined && Number.isFinite(rawLineOpacity)
      ? Math.min(1, Math.max(0, rawLineOpacity))
      : 1,
    fillOpacity: saved?.opacidade_preenchimento !== undefined && Number.isFinite(rawFillOpacity)
      ? Math.min(1, Math.max(0, rawFillOpacity))
      : 0.12,
    dashArray: lineType === "dashed" ? "10,8" : lineType === "dotted" ? "2,8" : null,
    lineCap: "round",
  };
}

function previewPointToLayer(feature, latlng) {
  const rawSize = Number(feature?.properties?.estilo?.tamanho_ponto);
  const size = Number.isFinite(rawSize) && rawSize > 0
    ? Math.min(32, Math.max(10, rawSize))
    : 18;
  const style = previewFeatureStyle(feature);
  return L.circleMarker(latlng, {
    ...style,
    radius: size / 2,
    fillOpacity: style.opacity,
    weight: 2,
  });
}

function PreviewMap({ config, onLoaded, onError }) {
  const isGeoJSON = config.sourceFormat === "GEOJSON";
  return (
    <MapContainer center={SOBRAL_CENTER} zoom={13} zoomControl className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {isGeoJSON ? (
        <>
          <GeoJSON
            data={config.geojsonData}
            style={previewFeatureStyle}
            pointToLayer={previewPointToLayer}
            onEachFeature={(feature, leafletLayer) => {
              const name = feature.properties?.nome || feature.properties?.name;
              if (name) {
                const label = document.createElement("span");
                label.textContent = String(name);
                leafletLayer.bindTooltip(label);
              }
            }}
          />
          <FitGeoJsonBounds data={config.geojsonData} />
        </>
      ) : (
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
      )}
    </MapContainer>
  );
}

function FitGeoJsonBounds({ data }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.geoJSON(data).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
  }, [map, data]);
  return null;
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

// Traduz falhas HTTP do proxy/GeoServer para mensagens compreensíveis.
// O Laravel pode responder com status 500, mas incluir o 502 do GeoServer
// dentro de "message" ou "error"; por isso verificamos ambos.
function getFriendlyWmsError(error) {
  const status = error?.response?.status;
  const serverMessage = [
    error?.response?.data?.message,
    error?.response?.data?.error,
    error?.message,
  ]
    .filter((value) => typeof value === "string")
    .join(" ");

  if (status === 502 || /\b502\b|bad gateway/i.test(serverMessage)) {
    return "Serviço WMS indisponível no momento (erro 502). Não foi possível consultar as camadas desse servidor. Tente novamente mais tarde.";
  }

  if (status === 504 || /\b504\b|gateway timeout/i.test(serverMessage)) {
    return "O servidor WMS demorou demais para responder (erro 504). Tente novamente mais tarde.";
  }

  if (status === 503 || /\b503\b|service unavailable/i.test(serverMessage)) {
    return "O serviço WMS está indisponível no momento (erro 503). Tente novamente mais tarde.";
  }

  if (status === 404) {
    return "O serviço WMS não foi encontrado. Confira o endereço cadastrado para esse servidor.";
  }

  if (status === 401 || status === 403) {
    return "O acesso a esse serviço WMS não foi autorizado. Verifique as permissões do servidor.";
  }

  if (error?.code === "ECONNABORTED" || status === 408) {
    return "A consulta ao WMS excedeu o tempo de espera. Tente novamente.";
  }

  if (!error?.response) {
    return "Não foi possível estabelecer comunicação com a API. Verifique sua conexão e se o backend está funcionando.";
  }

  return "Não foi possível consultar as camadas do serviço WMS. Verifique a disponibilidade do servidor e tente novamente.";
}

function formatFileSize(sizeBytes) {
  const bytes = Number(sizeBytes) || 0;
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFriendlyGeojsonApiError(error) {
  // Erros locais de validação também precisam aparecer claramente no formulário.
  if (!error?.response && typeof error?.message === "string" &&
      error.message.length < 240 && !/[<>]/.test(error.message) &&
      error.message !== "Network Error") {
    return error.message;
  }
  const status = error?.response?.status;
  if (status === 401) return "Sua sessão expirou. Entre novamente no painel administrativo.";
  if (status === 403) return "Você não tem permissão para acessar os arquivos GeoJSON.";
  if (status === 404) return "O serviço de arquivos não está disponível. Tente novamente ou contate o suporte.";
  if (status === 413) return "O arquivo ultrapassou o tamanho aceito pelo servidor.";
  if (status === 422) {
    const fields = error?.response?.data?.errors;
    const fileMessage = fields?.file?.[0];
    if (fileMessage && typeof fileMessage === "string" && !fileMessage.includes("<")) {
      return fileMessage;
    }
    return "O arquivo não passou pela validação. Confira se é um GeoJSON do tipo FeatureCollection, com até 10 MB.";
  }
  if (status >= 500) return "Não foi possível processar o arquivo no momento. Tente novamente.";
  return "Não foi possível acessar os arquivos. Verifique sua conexão e tente novamente.";
}

function getGeojsonDisplayName(pathOrName) {
  const filename = String(pathOrName || "").split("/").pop() || "Arquivo GeoJSON";
  // Remove identificadores únicos usados pelo armazenamento, apenas na exibição.
  return filename.replace(
    /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.geojson$)/i,
    ""
  );
}
function getTechnicalNameFromFilename(baseName) {
  return String(baseName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "camada_geojson";
}
function getInitialForm(layer) {
  return {
    name: layer?.name || "",
    layer_name: layer?.layer_name || "",
    source_format: layer?.source_format === "GEOJSON" ? "GEOJSON" : "WMS",
    geojson_path: layer?.geojson_path || "",
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
