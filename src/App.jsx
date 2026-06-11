import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import MapView from "./pages/MapView";
import Dashboard from "./pages/admin/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<MapView />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              roles={[
                "Administrador",
                "Agente"
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;