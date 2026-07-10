import { useState } from "react";
import {
  X,
  Layers,
  Loader2,
  Save,
  Map,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

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

  const isEditing = Boolean(layer);

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
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

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
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
                Configure as informações da camada do mapa.
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
                  onChange={(event) =>
                    handleChange(
                      "wms_link_id",
                      event.target.value
                    )
                  }
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