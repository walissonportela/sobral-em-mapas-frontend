import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

function readStoredUser() {
  try {
    if (!localStorage.getItem("admin_token")) return null;
    const data = JSON.parse(localStorage.getItem("user_data") || "null");
    return data && typeof data === "object" ? data : null;
  } catch {
    localStorage.removeItem("user_data");
    return null;
  }
}

function clearCredentials() {
  localStorage.removeItem("user_data");
  localStorage.removeItem("admin_token");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    const onExpired = () => {
      clearCredentials();
      if (active) {
        setUser(null);
        setAuthReady(true);
      }
    };

    window.addEventListener("sobral-auth-expired", onExpired);

    const verify = async () => {
      if (!localStorage.getItem("admin_token")) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        // Perfil e status de aprovação são validados no backend;
        // dados de usuário guardados no navegador não são uma autorização.
        const response = await api.get("/me", { timeout: 10000 });
        if (!active) return;
        if (response.data?.user?.approved === false) {
          onExpired();
          return;
        }
        const verifiedUser = response.data?.user;
        if (!verifiedUser) {
          onExpired();
          return;
        }
        localStorage.setItem("user_data", JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      } catch (error) {
        if (!active) return;
        if ([401, 403].includes(error?.response?.status)) {
          onExpired();
        }
        // Falha de rede não apaga a sessão: a API permanece responsável
        // por barrar operações autenticadas enquanto estiver indisponível.
      } finally {
        if (active) setAuthReady(true);
      }
    };

    void verify();
    return () => {
      active = false;
      window.removeEventListener("sobral-auth-expired", onExpired);
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("user_data", JSON.stringify(userData));
    localStorage.setItem("admin_token", token);
    setUser(userData);
    setAuthReady(true);
  };

  const logout = () => {
    const token = localStorage.getItem("admin_token");
    // A revogação no backend é tentada com o token capturado antes
    // da remoção local. Mesmo offline, o navegador encerra a sessão.
    if (token) {
      void api.post("/logout", null, {
        timeout: 5000,
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearCredentials();
    setUser(null);
    setAuthReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
