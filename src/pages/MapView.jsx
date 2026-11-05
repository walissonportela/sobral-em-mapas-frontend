import { useRef, useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Map from "../components/Map";
import Chatbot from "../components/Chatbot";
import TutorialOverlay from "../components/TutorialOverlay";

function MapView() {
  const [activeLayers, setActiveLayers] = useState([]);

  // Dados do mesmo catálogo carregado pela Sidebar, sem nova requisição à API.
  const [availableLayers, setAvailableLayers] = useState([]);

  // Preferências temporárias de visualização, separadas por ID da camada.
  // Não modificam arquivos GeoJSON nem são enviadas ao Laravel.
  const [layerViewSettings, setLayerViewSettings] = useState({});

  const handleLayerViewSettingsChange = (layerId, changes) => {
    const key = String(layerId);
    setLayerViewSettings((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        ...changes,
      },
    }));
  };

  const [searchLocation, setSearchLocation] =
    useState(null);

  const [tutorialOpen, setTutorialOpen] =
    useState(false);

  const [tutorialKey, setTutorialKey] =
    useState(0);

  const [sidebarOpenSignal, setSidebarOpenSignal] =
    useState(0);

  const mapToolsRef = useRef(null);

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

  const handleSearchLocation = (location) => {
    setSearchLocation(location);
  };

  const handleStartTutorial = () => {
    setTutorialOpen(false);

    setSidebarOpenSignal((previous) => previous + 1);
    setTutorialKey((previous) => previous + 1);

    window.setTimeout(() => {
      setTutorialOpen(true);
    }, 380);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Header onStartTutorial={handleStartTutorial} />

      <main className="pt-[72px] h-full">
        <div className="relative h-full">
          <Sidebar
            activeLayers={activeLayers}
            layerViewSettings={layerViewSettings}
            onLayerViewSettingsChange={handleLayerViewSettingsChange}
            onToggleLayer={handleLayerToggle}
            onLayersLoaded={setAvailableLayers}
            onClearMap={handleClearLayers}
            onSearchLocation={handleSearchLocation}
            mapToolsRef={mapToolsRef}
            forceOpenSignal={sidebarOpenSignal}
          />

          <Map
            activeLayers={activeLayers}
            availableLayers={availableLayers}
            onToggleLayer={handleLayerToggle}
            layerViewSettings={layerViewSettings}
            searchLocation={searchLocation}
            mapToolsRef={mapToolsRef}
          />

          {/* <Chatbot /> */}
        </div>
      </main>

      <TutorialOverlay
        key={tutorialKey}
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </div>
  );
}

export default MapView;
