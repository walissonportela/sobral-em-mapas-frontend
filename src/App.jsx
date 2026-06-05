import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";

function App() {
  const [activeLayers, setActiveLayers] = useState([]);

  const handleLayerToggle = (layer) => {
    setActiveLayers((prev) => {
      const exists = prev.some(
        (item) => item.id === layer.id
      );

      if (exists) {
        return prev.filter(
          (item) => item.id !== layer.id
        );
      }

      return [...prev, layer];
    });
  };

  const handleClearLayers = () => {
    setActiveLayers([]);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Header />

      <main className="pt-[72px] h-full">
        <div className="relative h-full">
          <Sidebar
            activeLayers={activeLayers}
            onToggleLayer={handleLayerToggle}
            onClearMap={handleClearLayers}
          />

          <Map activeLayers={activeLayers} />
        </div>
      </main>
    </div>
  );
}

export default App;