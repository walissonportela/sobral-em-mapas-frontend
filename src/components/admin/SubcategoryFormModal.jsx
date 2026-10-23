import { useState } from "react";
import { X, FolderPlus, Loader2, Save } from "lucide-react";

export default function SubcategoryFormModal({
  subcategory,
  defaultCategoryId = "",
  categories = [],
  loading = false,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(subcategory);

  const [name, setName] = useState(() => subcategory?.name || "");
  const [categoryId, setCategoryId] = useState(() => {
    const selectedId =
      subcategory?.category_id ??
      subcategory?.category?.id ??
      defaultCategoryId;

    return selectedId == null ? "" : String(selectedId);
  });

  const canSave =
    !loading &&
    name.trim().length > 0 &&
    categoryId !== "" &&
    Number.isInteger(Number(categoryId)) &&
    Number(categoryId) > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;

    onSubmit({
      name: name.trim(),
      category_id: Number(categoryId),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subcategory-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <FolderPlus size={24} />
            </div>

            <div className="min-w-0">
              <h2
                id="subcategory-modal-title"
                className="text-xl font-black text-slate-800"
              >
                {isEditing ? "Editar subcategoria" : "Nova subcategoria"}
              </h2>
              <p className="text-sm text-slate-500">
                Organize as camadas dentro de uma categoria.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          <div>
            <label
              htmlFor="subcategory-name"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Nome da subcategoria
            </label>
            <input
              id="subcategory-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              required
              autoFocus
              maxLength={255}
              placeholder="Ex.: Divisão de Bairros"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="subcategory-category"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Categoria principal
            </label>
            <select
              id="subcategory-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={loading || categories.length === 0}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_active === false ? " (inativa)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              A subcategoria será exibida dentro da categoria selecionada.
            </p>
            {categories.length === 0 && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Cadastre uma categoria antes de criar subcategorias.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
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
