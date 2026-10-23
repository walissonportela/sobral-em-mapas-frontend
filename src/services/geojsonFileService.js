
import api from "./api";

/**
 * Lista os arquivos GeoJSON armazenados no Laravel.
 */
export async function listGeojsonFiles() {
  const response = await api.get("/admin/geojson-files");

  return response.data?.files || [];
}

/**
 * Envia um arquivo GeoJSON para o Laravel.
 */
export async function uploadGeojsonFile(file) {
  const formData = new FormData();

  formData.append("file", file);

  // O navegador define automaticamente o multipart boundary.
  const response = await api.post(
    "/admin/geojson-files",
    formData
  );

  return response.data?.file;
}

/**
 * Obtém o conteúdo de um GeoJSON pela rota
 * administrativa autenticada.
 *
 * Permite visualizar o arquivo antes de
 * cadastrar e publicar a camada.
 */
export async function getGeojsonFileContent(filename, signal) {
  if (!/^[A-Za-z0-9_-]+\.geojson$/.test(filename)) {
    throw new Error("Nome de arquivo GeoJSON inválido.");
  }

  const response = await api.get(
    `/admin/geojson-files/${encodeURIComponent(filename)}/content`,
    { signal }
  );

  return response.data;
}
