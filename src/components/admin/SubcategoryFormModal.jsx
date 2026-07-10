import { useState } from "react";
import {
  X,
  FolderTree,
  Loader2,
  Save,
} from "lucide-react";

export default function CategoryFormModal({
  category,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(
    category?.name || ""
  );

  const isEditing = Boolean(category);

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: name.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FolderTree size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {isEditing
                  ? "Editar categoria"
                  : "Nova categoria"}
              </h2>

              <p className="text-sm text-slate-500">
                Organize os grupos principais de camadas.
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
          className="p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nome da categoria
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={loading}
              required
              autoFocus
              placeholder="Ex: Educação, Saúde, Infraestrutura"
              className="
                w-full
                px-4
                py-3
                rounded-2xl
                border
                border-slate-200
                outline-none
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
                disabled:bg-slate-100
                transition
              "
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              disabled={loading || !name.trim()}
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
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}