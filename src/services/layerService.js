import api from "./api";

/**
 * Lista camadas, subcategorias e links WMS.
 */
export async function getLayers() {
  const response = await api.get("/admin/layers");

  return response.data;
}

/**
 * Cria uma camada.
 */
export async function createLayer(data) {
  const response = await api.post(
    "/admin/layers",
    data
  );

  return response.data;
}

/**
 * Atualiza uma camada.
 */
export async function updateLayer(id, data) {
  const response = await api.put(
    `/admin/layers/${id}`,
    data
  );

  return response.data;
}

/**
 * Ativa ou desativa uma camada.
 */
export async function updateLayerStatus(id, isActive) {
  const response = await api.patch(
    `/admin/layers/${id}/status`,
    {
      is_active: isActive,
    }
  );

  return response.data;
}

/**
 * Exclui definitivamente uma camada.
 */
export async function deleteLayer(id) {
  const response = await api.delete(
    `/admin/layers/${id}`
  );

  return response.data;
}

/**
 * Busca as layers disponíveis dentro de um link WMS
 * usando GetCapabilities.
 */
export async function getAvailableWmsLayers(wmsLinkId) {
  const response = await api.get(
    `/admin/wms/${wmsLinkId}/layers`
  );

  return response.data;
}