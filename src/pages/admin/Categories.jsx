import { useEffect, useState } from "react";
import {
  FolderTree,
  FolderPlus,
  RefreshCcw,
  Plus,
  Pencil,
  Trash2,
  Layers,
  ChevronRight,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import CategoryFormModal from "../../components/admin/CategoryFormModal";
import SubcategoryFormModal from "../../components/admin/SubcategoryFormModal";

import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  updateSubcategoryStatus,
  deleteSubcategory,
} from "../../services/categoryService";

export default function Categories() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] =
    useState(null);

  const [error, setError] = useState("");

  const [categoryModal, setCategoryModal] =
    useState(null);

  const [subcategoryModal, setSubcategoryModal] =
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

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCategories();

      setCategories(response.categories || []);
    } catch (requestError) {
      console.error(
        "Erro ao carregar categorias:",
        requestError
      );

      const message = getErrorMessage(
        requestError,
        "Não foi possível carregar as categorias."
      );

      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialCategories = async () => {
      try {
        const response = await getCategories();

        if (active) {
          setCategories(response.categories || []);
        }
      } catch (requestError) {
        if (active) {
          console.error(
            "Erro ao carregar categorias:",
            requestError
          );

          const message = getErrorMessage(
            requestError,
            "Não foi possível carregar as categorias."
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

    loadInitialCategories();

    return () => {
      active = false;
    };
  }, []);

  const handleSaveCategory = async (payload) => {
    try {
      setSaving(true);

      if (categoryModal?.category) {
        await updateCategory(
          categoryModal.category.id,
          payload
        );

        showToast(
          "success",
          "Categoria atualizada com sucesso."
        );
      } else {
        await createCategory(payload);

        showToast(
          "success",
          "Categoria criada com sucesso."
        );
      }

      setCategoryModal(null);

      await loadCategories();
    } catch (requestError) {
      console.error(
        "Erro ao salvar categoria:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível salvar a categoria."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubcategory = async (payload) => {
    try {
      setSaving(true);

      if (subcategoryModal?.subcategory) {
        await updateSubcategory(
          subcategoryModal.subcategory.id,
          payload
        );

        showToast(
          "success",
          "Subcategoria atualizada com sucesso."
        );
      } else {
        await createSubcategory(payload);

        showToast(
          "success",
          "Subcategoria criada com sucesso."
        );
      }

      setSubcategoryModal(null);

      await loadCategories();
    } catch (requestError) {
      console.error(
        "Erro ao salvar subcategoria:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível salvar a subcategoria."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryStatus = async (
    category
  ) => {
    const nextStatus = !category.is_active;

    try {
      setStatusLoadingId(`category-${category.id}`);

      const response = await updateCategoryStatus(
        category.id,
        nextStatus
      );

      showToast(
        "success",
        response.message ||
          (nextStatus
            ? "Categoria ativada com sucesso."
            : "Categoria desativada com sucesso.")
      );

      await loadCategories();
    } catch (requestError) {
      console.error(
        "Erro ao alterar status da categoria:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível alterar o status da categoria."
        )
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleToggleSubcategoryStatus = async (
    subcategory
  ) => {
    const nextStatus = !subcategory.is_active;

    try {
      setStatusLoadingId(
        `subcategory-${subcategory.id}`
      );

      const response =
        await updateSubcategoryStatus(
          subcategory.id,
          nextStatus
        );

      showToast(
        "success",
        response.message ||
          (nextStatus
            ? "Subcategoria ativada com sucesso."
            : "Subcategoria desativada com sucesso.")
      );

      await loadCategories();
    } catch (requestError) {
      console.error(
        "Erro ao alterar status da subcategoria:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível alterar o status da subcategoria."
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

      if (deleteTarget.type === "category") {
        await deleteCategory(deleteTarget.item.id);

        showToast(
          "success",
          "Categoria excluída definitivamente com sucesso."
        );
      }

      if (deleteTarget.type === "subcategory") {
        await deleteSubcategory(deleteTarget.item.id);

        showToast(
          "success",
          "Subcategoria excluída definitivamente com sucesso."
        );
      }

      setDeleteTarget(null);

      await loadCategories();
    } catch (requestError) {
      console.error(
        "Erro ao excluir definitivamente:",
        requestError
      );

      showToast(
        "error",
        getErrorMessage(
          requestError,
          "Não foi possível excluir definitivamente o registro."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const totalCategories = categories.length;

  const totalActiveCategories = categories.filter(
    (category) => category.is_active
  ).length;

  const totalInactiveCategories =
    totalCategories - totalActiveCategories;

  const totalSubcategories = categories.reduce(
    (total, category) =>
      total +
      (category.subcategories?.length || 0),
    0
  );

  const totalActiveSubcategories =
    categories.reduce((total, category) => {
      return (
        total +
        (category.subcategories || []).filter(
          (subcategory) =>
            subcategory.is_active
        ).length
      );
    }, 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Categorias
            </h1>

            <p className="text-slate-500 mt-1">
              Organize categorias e subcategorias do Sobral em Mapas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadCategories}
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
                setSubcategoryModal({
                  subcategory: null,
                  defaultCategoryId:
                    categories[0]?.id || "",
                })
              }
              disabled={categories.length === 0}
              className="px-5 py-3 rounded-2xl bg-amber-500 text-blue-950 font-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <FolderPlus size={18} />
              Nova subcategoria
            </button>

            <button
              type="button"
              onClick={() =>
                setCategoryModal({
                  category: null,
                })
              }
              className="px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition flex items-center gap-2"
            >
              <Plus size={18} />
              Nova categoria
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Categorias"
            value={totalCategories}
            description={`${totalActiveCategories} ativa(s), ${totalInactiveCategories} inativa(s)`}
            icon={<FolderTree size={25} />}
            iconClass="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Subcategorias"
            value={totalSubcategories}
            description={`${totalActiveSubcategories} ativa(s)`}
            icon={<FolderPlus size={25} />}
            iconClass="bg-amber-100 text-amber-700"
          />

          <StatCard
            title="Ativas"
            value={
              totalActiveCategories +
              totalActiveSubcategories
            }
            description="Registros disponíveis"
            icon={<CheckCircle2 size={25} />}
            iconClass="bg-green-100 text-green-700"
          />

          <StatCard
            title="Inativas"
            value={
              totalCategories -
              totalActiveCategories +
              (totalSubcategories -
                totalActiveSubcategories)
            }
            description="Registros temporariamente ocultos"
            icon={<XCircle size={25} />}
            iconClass="bg-red-100 text-red-700"
          />
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Estrutura de categorias
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Use desativação para ocultar temporariamente e exclusão definitiva apenas quando tiver certeza.
              </p>
            </div>

            <span className="text-sm font-bold text-slate-500">
              {totalCategories} categoria(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex items-center gap-3 text-blue-700 font-semibold">
                <RefreshCcw
                  className="animate-spin"
                  size={22}
                />

                Carregando categorias...
              </div>
            </div>
          ) : categories.length === 0 ? (
            <EmptyCategories
              onCreate={() =>
                setCategoryModal({
                  category: null,
                })
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((category) => (
                <CategoryBlock
                  key={category.id}
                  category={category}
                  statusLoadingId={
                    statusLoadingId
                  }
                  onEditCategory={() =>
                    setCategoryModal({
                      category,
                    })
                  }
                  onToggleCategoryStatus={() =>
                    handleToggleCategoryStatus(
                      category
                    )
                  }
                  onDeleteCategory={() =>
                    setDeleteTarget({
                      type: "category",
                      item: category,
                    })
                  }
                  onCreateSubcategory={() =>
                    setSubcategoryModal({
                      subcategory: null,
                      defaultCategoryId:
                        category.id,
                    })
                  }
                  onEditSubcategory={(
                    subcategory
                  ) =>
                    setSubcategoryModal({
                      subcategory,
                      defaultCategoryId:
                        category.id,
                    })
                  }
                  onToggleSubcategoryStatus={(
                    subcategory
                  ) =>
                    handleToggleSubcategoryStatus(
                      subcategory
                    )
                  }
                  onDeleteSubcategory={(
                    subcategory
                  ) =>
                    setDeleteTarget({
                      type: "subcategory",
                      item: subcategory,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {categoryModal && (
        <CategoryFormModal
          category={categoryModal.category}
          loading={saving}
          onClose={() => {
            if (!saving) {
              setCategoryModal(null);
            }
          }}
          onSubmit={handleSaveCategory}
        />
      )}

      {subcategoryModal && (
        <SubcategoryFormModal
          subcategory={
            subcategoryModal.subcategory
          }
          defaultCategoryId={
            subcategoryModal.defaultCategoryId
          }
          categories={categories}
          loading={saving}
          onClose={() => {
            if (!saving) {
              setSubcategoryModal(null);
            }
          }}
          onSubmit={handleSaveSubcategory}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "category"
            ? "Excluir categoria definitivamente"
            : "Excluir subcategoria definitivamente"
        }
        message={
          deleteTarget
            ? getDeleteMessage(deleteTarget)
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

function CategoryBlock({
  category,
  statusLoadingId,
  onEditCategory,
  onToggleCategoryStatus,
  onDeleteCategory,
  onCreateSubcategory,
  onEditSubcategory,
  onToggleSubcategoryStatus,
  onDeleteSubcategory,
}) {
  const subcategories =
    category.subcategories || [];

  const hasSubcategories =
    subcategories.length > 0;

  const categoryStatusLoading =
    statusLoadingId ===
    `category-${category.id}`;

  return (
    <article
      className={`
        p-6
        ${
          category.is_active
            ? "bg-white"
            : "bg-slate-50"
        }
      `}
    >
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`
              h-14
              w-14
              rounded-2xl
              flex
              items-center
              justify-center
              shrink-0
              ${
                category.is_active
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-500"
              }
            `}
          >
            <FolderTree size={26} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`
                  text-xl
                  font-black
                  ${
                    category.is_active
                      ? "text-slate-800"
                      : "text-slate-500"
                  }
                `}
              >
                {category.name}
              </h3>

              <StatusBadge
                active={category.is_active}
              />
            </div>

            <p className="text-sm text-slate-500 mt-1">
              {subcategories.length} subcategoria(s)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreateSubcategory}
            className="px-4 py-2.5 rounded-2xl bg-amber-100 text-amber-800 font-bold hover:bg-amber-200 transition flex items-center gap-2"
          >
            <FolderPlus size={17} />
            Subcategoria
          </button>

          <button
            type="button"
            onClick={onToggleCategoryStatus}
            disabled={categoryStatusLoading}
            className={`
              px-4
              py-2.5
              rounded-2xl
              font-bold
              transition
              disabled:opacity-60
              flex
              items-center
              gap-2
              ${
                category.is_active
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }
            `}
          >
            {categoryStatusLoading ? (
              <RefreshCcw
                size={17}
                className="animate-spin"
              />
            ) : category.is_active ? (
              <PowerOff size={17} />
            ) : (
              <Power size={17} />
            )}

            {category.is_active
              ? "Desativar"
              : "Reativar"}
          </button>

          <button
            type="button"
            onClick={onEditCategory}
            className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-center"
            title="Editar categoria"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={onDeleteCategory}
            className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition flex items-center justify-center"
            title="Excluir definitivamente"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {hasSubcategories ? (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {subcategories.map((subcategory) => (
            <SubcategoryCard
              key={subcategory.id}
              subcategory={subcategory}
              statusLoadingId={
                statusLoadingId
              }
              onEdit={() =>
                onEditSubcategory(subcategory)
              }
              onToggleStatus={() =>
                onToggleSubcategoryStatus(
                  subcategory
                )
              }
              onDelete={() =>
                onDeleteSubcategory(subcategory)
              }
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
          Nenhuma subcategoria cadastrada nesta categoria.
        </div>
      )}
    </article>
  );
}

function SubcategoryCard({
  subcategory,
  statusLoadingId,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const isLoading =
    statusLoadingId ===
    `subcategory-${subcategory.id}`;

  return (
    <div
      className={`
        border
        rounded-2xl
        p-4
        flex
        items-center
        justify-between
        gap-3
        ${
          subcategory.is_active
            ? "border-slate-100 bg-slate-50"
            : "border-slate-200 bg-slate-100"
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`
            h-9
            w-9
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            ${
              subcategory.is_active
                ? "bg-white text-slate-500"
                : "bg-slate-200 text-slate-500"
            }
          `}
        >
          <ChevronRight size={17} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`
                font-bold
                truncate
                ${
                  subcategory.is_active
                    ? "text-slate-700"
                    : "text-slate-500"
                }
              `}
            >
              {subcategory.name}
            </p>

            <StatusBadge
              active={subcategory.is_active}
              small
            />
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Layers size={13} />
            Camadas vinculadas serão revisadas no próximo módulo
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={isLoading}
          className={`
            h-9
            w-9
            rounded-xl
            transition
            disabled:opacity-60
            flex
            items-center
            justify-center
            ${
              subcategory.is_active
                ? "bg-white text-red-600 hover:bg-red-50"
                : "bg-white text-green-700 hover:bg-green-50"
            }
          `}
          title={
            subcategory.is_active
              ? "Desativar subcategoria"
              : "Reativar subcategoria"
          }
        >
          {isLoading ? (
            <RefreshCcw
              size={15}
              className="animate-spin"
            />
          ) : subcategory.is_active ? (
            <PowerOff size={15} />
          ) : (
            <Power size={15} />
          )}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="h-9 w-9 rounded-xl bg-white text-slate-500 hover:text-blue-700 transition flex items-center justify-center"
          title="Editar subcategoria"
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="h-9 w-9 rounded-xl bg-white text-red-600 hover:bg-red-50 hover:text-red-800 transition flex items-center justify-center"
          title="Excluir definitivamente"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ active, small = false }) {
  return active ? (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        rounded-full
        bg-green-100
        text-green-700
        font-black
        ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}
      `}
    >
      <CheckCircle2 size={small ? 11 : 13} />
      Ativa
    </span>
  ) : (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        rounded-full
        bg-red-100
        text-red-700
        font-black
        ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}
      `}
    >
      <XCircle size={small ? 11 : 13} />
      Inativa
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

function EmptyCategories({ onCreate }) {
  return (
    <div className="p-12 text-center">
      <div className="h-20 w-20 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
        <FolderTree size={38} />
      </div>

      <h3 className="text-xl font-black text-slate-800 mt-5">
        Nenhuma categoria cadastrada
      </h3>

      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        Crie a primeira categoria para começar a organizar as camadas do mapa.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 px-5 py-3 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition inline-flex items-center gap-2"
      >
        <Plus size={18} />
        Criar categoria
      </button>
    </div>
  );
}

function getDeleteMessage(deleteTarget) {
  if (deleteTarget.type === "category") {
    return `Tem certeza que deseja excluir definitivamente a categoria "${deleteTarget.item.name}"? Essa ação não pode ser desfeita. Categorias com subcategorias não poderão ser excluídas.`;
  }

  return `Tem certeza que deseja excluir definitivamente a subcategoria "${deleteTarget.item.name}"? Essa ação não pode ser desfeita. Subcategorias com camadas vinculadas não poderão ser excluídas.`;
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