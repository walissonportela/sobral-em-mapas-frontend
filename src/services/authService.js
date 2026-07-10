import api from "./api";

/**
 * Realiza o login.
 */
export async function loginRequest(email, password) {
  const response = await api.post("/login", {
    email,
    password,
  });

  return response.data;
}

/**
 * Realiza o cadastro público de um visitante.
 */
export async function registerVisitor(data) {
  const response = await api.post("/register", data);

  return response.data;
}

/**
 * Busca o usuário autenticado usando o token salvo.
 */
export async function getAuthenticatedUser() {
  const response = await api.get("/me");

  return response.data;
}

/**
 * Encerra a sessão no backend.
 */
export async function logoutRequest() {
  const response = await api.post("/logout");

  return response.data;
}