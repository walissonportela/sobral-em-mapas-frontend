import api from "./api";

/**
 * Lista categorias com subcategorias.
 */
export async function getCategories() {
  const response = await api.get("/admin/categories");

  return response.data;
}

/**
 * Cria uma categoria.
 */
export async function createCategory(data) {
  const response = await api.post(
    "/admin/categories",
    data
  );

  return response.data;
}

/**
 * Atualiza uma categoria.
 */
export async function updateCategory(id, data) {
  const response = await api.put(
    `/admin/categories/${id}`,
    data
  );

  return response.data;
}

/**
 * Ativa ou desativa uma categoria.
 */
export async function updateCategoryStatus(id, isActive) {
  const response = await api.patch(
    `/admin/categories/${id}/status`,
    {
      is_active: isActive,
    }
  );

  return response.data;
}

/**
 * Exclui definitivamente uma categoria.
 */
export async function deleteCategory(id) {
  const response = await api.delete(
    `/admin/categories/${id}`
  );

  return response.data;
}

/**
 * Cria uma subcategoria.
 */
export async function createSubcategory(data) {
  const response = await api.post(
    "/admin/subcategories",
    data
  );

  return response.data;
}

/**
 * Atualiza uma subcategoria.
 */
export async function updateSubcategory(id, data) {
  const response = await api.put(
    `/admin/subcategories/${id}`,
    data
  );

  return response.data;
}

/**
 * Ativa ou desativa uma subcategoria.
 */
export async function updateSubcategoryStatus(
  id,
  isActive
) {
  const response = await api.patch(
    `/admin/subcategories/${id}/status`,
    {
      is_active: isActive,
    }
  );

  return response.data;
}

/**
 * Exclui definitivamente uma subcategoria.
 */
export async function deleteSubcategory(id) {
  const response = await api.delete(
    `/admin/subcategories/${id}`
  );

  return response.data;
}