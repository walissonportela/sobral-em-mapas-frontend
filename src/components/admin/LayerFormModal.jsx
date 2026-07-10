import { useState } from "react";
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
} from "lucide-react";

import { getAvailableWmsLayers } from "../../services/layerService";

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

  const isEditing = Boolean(layer);

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFetchWmsLayers = async () => {
    if (!form.wms_link_id) {
      setWmsError("Selecione um link WMS antes de buscar as layers.");
      return;
    }

    try {
      setLoadingWmsLayers(true);
      setWmsError("");

      const response = await getAvailableWmsLayers(
        form.wms_link_id
      );

      setAvailableLayers(response.layers || []);

      if ((response.layers || []).length === 0) {
        setWmsError("Nenhuma layer foi encontrada nesse WMS.");
      }
    } catch (requestError) {
      console.error("Erro ao buscar layers do WMS:", requestError);

      setWmsError(
        requestError.response?.data?.message ||
          "Não foi possível buscar as layers desse WMS."
      );
    } finally {
      setLoadingWmsLayers(false);
    }
  };

  const handleSelectAvailableLayer = (wmsLayer) => {
    setForm((previous) => ({
      ...previous,
      name: wmsLayer.title || wmsLayer.name || previous.name,
      layer_name: wmsLayer.name || previous.layer_name,
      crs: wmsLayer.crs || previous.crs || "EPSG:4326",
      legend_url: wmsLayer.legend_url || previous.legend_url || "",
      description:
        wmsLayer.abstract ||
        previous.description ||
        "",
      type: "WMS",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: form.name.trim(),
      layer_name: form.layer_name.trim(),
      crs: form.crs.trim() || "EPSG:4326",
      legend_url: form.legend_url.trim() || null,
      type: form.type || "WMS",
      description: form.description.trim() || null,
      order: form.order === "" ? 0 : Number(form.order),
      subcategory:
        form.subcategory === ""
          ? null
          : Number(form.subcategory),
      image_path: form.image_path.trim() || null,
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

  const filteredAvailableLayers =
    availableLayers.filter((item) => {
      const searchText = wmsSearch
        .trim()
        .toLowerCase();

      if (!searchText) return true;

      return (
        item.name?.toLowerCase().includes(searchText) ||
        item.title?.toLowerCase().includes(searchText)
      );
    });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
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
                Configure ou busque uma camada diretamente do WMS.
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
                  Selecione um link WMS e consulte o GetCapabilities para preencher o cadastro automaticamente.
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
                  {filteredAvailableLayers.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() =>
                        handleSelectAvailableLayer(item)
                      }
                      className="
                        w-full
                        text-left
                        p-4
                        hover:bg-blue-50
                        transition
                      "
                    >
                      <p className="font-black text-slate-800">
                        {item.title || item.name}
                      </p>

                      <p className="text-xs text-blue-700 font-semibold mt-1">
                        {item.name}
                      </p>

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
                  ))}
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
                  placeholder="Ex: Escolas Municipais"
                  className={inputClass}
                />
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
                  placeholder="Ex: workspace:camada"
                  className={inputClass}
                />
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
                  <option value="GeoJSON">GeoJSON</option>
                  <option value="Raster">Raster</option>
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

                  {subcategories.map((subcategory) => (
                    <option
                      key={subcategory.id}
                      value={subcategory.id}
                    >
                      {getSubcategoryLabel(subcategory)}
                    </option>
                  ))}
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

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:opacity-50"
            >
              Cancelar
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
        </form>
      </div>
    </div>
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