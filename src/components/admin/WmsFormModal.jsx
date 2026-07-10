import { useState } from "react";
import {
  X,
  Server,
  Loader2,
  Save,
  Link as LinkIcon,
  Info,
} from "lucide-react";

export default function WmsFormModal({
  wmsLink,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    name: wmsLink?.name || "",
    url: wmsLink?.url || "",
    version: wmsLink?.version || "1.1.1",
  });

  const isEditing = Boolean(wmsLink);

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
      url: form.url.trim(),
      version: form.version || "1.1.1",
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Server size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {isEditing
                  ? "Editar link WMS"
                  : "Novo link WMS"}
              </h2>

              <p className="text-sm text-slate-500">
                Cadastre a URL base do servidor WMS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-50 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex gap-3 text-sm text-blue-800">
            <Info
              size={18}
              className="shrink-0 mt-0.5"
            />

            <div>
              <p className="font-bold">
                Use a URL base do WMS, não a URL de OpenLayers/GetMap.
              </p>

              <p className="mt-1">
                Exemplo correto:
                <span className="font-mono block mt-1 text-xs break-all">
                  http://geoserver.sobral.ce.gov.br/geoserver/wms
                </span>
              </p>
            </div>
          </div>

          <FormField label="Nome do WMS">
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                handleChange("name", event.target.value)
              }
              disabled={loading}
              required
              autoFocus
              placeholder="Ex: GeoServer Sobral - Geral"
              className={inputClass}
            />
          </FormField>

          <FormField label="URL base">
            <div className="relative">
              <LinkIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="url"
                value={form.url}
                onChange={(event) =>
                  handleChange("url", event.target.value)
                }
                disabled={loading}
                required
                placeholder="http://geoserver.sobral.ce.gov.br/geoserver/wms"
                className={`${inputClass} pl-11`}
              />
            </div>
          </FormField>

          <FormField label="Versão WMS">
            <select
              value={form.version}
              onChange={(event) =>
                handleChange("version", event.target.value)
              }
              disabled={loading}
              className={inputClass}
            >
              <option value="1.1.1">1.1.1</option>
              <option value="1.3.0">1.3.0</option>
              <option value="1.1.0">1.1.0</option>
            </select>
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
                !form.url.trim()
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
                  Salvar WMS
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