import api from "./api";

/**
 * Lista todos os usuários e perfis.
 */
export async function getUsers() {
  const response = await api.get("/admin/users");

  return response.data;
}

/**
 * Busca um usuário específico.
 */
export async function getUser(id) {
  const response = await api.get(
    `/admin/users/${id}`
  );

  return response.data;
}

/**
 * Cria um usuário pelo painel administrativo.
 */
export async function createUser(data) {
  const response = await api.post(
    "/admin/users",
    data
  );

  return response.data;
}

/**
 * Atualiza um usuário.
 */
export async function updateUser(id, data) {
  const response = await api.put(
    `/admin/users/${id}`,
    data
  );

  return response.data;
}

/**
 * Exclui um usuário.
 */
export async function deleteUser(id) {
  const response = await api.delete(
    `/admin/users/${id}`
  );

  return response.data;
}

/**
 * Lista solicitações de cadastro pendentes.
 */
export async function getPendingUsers() {
  const response = await api.get(
    "/admin/users/pending"
  );

  return response.data;
}

/**
 * Aprova uma solicitação.
 */
export async function approveUser(id) {
  const response = await api.patch(
    `/admin/users/${id}/approve`
  );

  return response.data;
}

/**
 * Recusa e remove uma solicitação pendente.
 */
export async function rejectUser(id) {
  const response = await api.delete(
    `/admin/users/${id}/reject`
  );

  return response.data;
}