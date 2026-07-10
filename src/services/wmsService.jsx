import api from "./api";

/**
 * Lista links WMS cadastrados.
 */
export async function getWmsLinks() {
  const response = await api.get("/admin/wms");

  return response.data;
}

/**
 * Cria um link WMS.
 */
export async function createWmsLink(data) {
  const response = await api.post("/admin/wms", data);

  return response.data;
}

/**
 * Atualiza um link WMS.
 */
export async function updateWmsLink(id, data) {
  const response = await api.put(
    `/admin/wms/${id}`,
    data
  );

  return response.data;
}

/**
 * Exclui um link WMS.
 */
export async function deleteWmsLink(id) {
  const response = await api.delete(
    `/admin/wms/${id}`
  );

  return response.data;
}

/**
 * Busca layers disponíveis no WMS via GetCapabilities.
 */
export async function getWmsAvailableLayers(id) {
  const response = await api.get(
    `/admin/wms/${id}/layers`
  );

  return response.data;
}