import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

// O token pertence exclusivamente à API configurada. Nunca permita que
// requisições com URL absoluta levem credenciais a um host externo.
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: false,
  allowAbsoluteUrls: false,
});

const apiOrigin = new URL(API_URL, window.location.origin).origin;

api.interceptors.request.use((config) => {
  const url = new URL(config.url || "", API_URL + "/");
  if (url.origin !== apiOrigin) {
    return Promise.reject(new Error("Destino da API não autorizado."));
  }

  // Evita enviar o Bearer token em buscas, mapas e integrações públicas.
  const route = String(config.url || "");
  const requiresAuth = /^\/(?:admin(?:\/|$)|me(?:\?|$)|logout(?:\?|$))/.test(route);
  const token = requiresAuth ? localStorage.getItem("admin_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só revoga a sessão local se uma chamada autenticada retornar 401.
    // Um 401 vindo do login (credenciais incorretas) não altera a sessão.
    const path = String(error?.config?.url || "");
    const authorizedRequest = !path.startsWith("/login") &&
      Boolean(error?.config?.headers?.Authorization);
    const currentToken = localStorage.getItem("admin_token");
    const sameSession = currentToken &&
      error?.config?.headers?.Authorization === `Bearer ${currentToken}`;
    if (error?.response?.status === 401 && authorizedRequest && sameSession) {
      window.dispatchEvent(new Event("sobral-auth-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
