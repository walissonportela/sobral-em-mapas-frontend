
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MapView from "./pages/MapView";
import About from "./pages/About";
import Profile from "./pages/Profile";

import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Layers from "./pages/admin/Layers";
import Categories from "./pages/admin/Categories";
import Requests from "./pages/admin/Requests";
import Wms from "./pages/admin/Wms";

import ProtectedRoute from "./routes/ProtectedRoute";

// Perfis com acesso ao painel administrativo.
const administrativeRoles = [
  "Superadministrador",
  "Administrador",
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mapa público */}
        <Route
          path="/"
          element={<MapView />}
        />

        {/* Sobre o sistema */}
        <Route
          path="/sobre"
          element={<About />}
        />

        {/* Página do perfil */}
        <Route
          path="/minha-conta"
          element={<Profile />}
        />

        {/* Redirecionamento inicial do painel */}
        <Route
          path="/admin"
          element={
            <Navigate
              to="/admin/dashboard"
              replace
            />
          }
        />

        {/* Dashboard administrativo */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={administrativeRoles}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Gerenciamento de camadas */}
        <Route
          path="/admin/layers"
          element={
            <ProtectedRoute roles={administrativeRoles}>
              <Layers />
            </ProtectedRoute>
          }
        />

        {/* Gerenciamento de categorias */}
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={administrativeRoles}>
              <Categories />
            </ProtectedRoute>
          }
        />

        {/* Gerenciamento de links WMS */}
        <Route
          path="/admin/wms"
          element={
            <ProtectedRoute roles={administrativeRoles}>
              <Wms />
            </ProtectedRoute>
          }
        />

        {/*
          Usuários:
          - Superadministrador: gerenciamento completo.
          - Administrador: somente consulta.

          As permissões de escrita são verificadas
          pelo backend Laravel.
        */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={administrativeRoles}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/*
          Solicitações:
          - Superadministrador: aprovar ou recusar.
          - Administrador: aprovar ou recusar
            somente cadastros de Visitantes.
        */}
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute roles={administrativeRoles}>
              <Requests />
            </ProtectedRoute>
          }
        />

        {/* Rota inexistente */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
