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

function App() {
  const adminAndAgentRoles = [
    "Administrador",
    "Agente",
  ];

  const onlyAdminRoles = [
    "Administrador",
  ];

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
        <Route path="/minha-conta" element={
          <Profile />} 
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

        {/* Administrador e Agente */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={adminAndAgentRoles}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/layers"
          element={
            <ProtectedRoute roles={adminAndAgentRoles}>
              <Layers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={adminAndAgentRoles}>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/wms"
          element={
            <ProtectedRoute roles={adminAndAgentRoles}>
              <Wms />
            </ProtectedRoute>
          }
        />

        {/* Somente Administrador */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={onlyAdminRoles}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute roles={onlyAdminRoles}>
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