import { useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Map from "../components/Map";
import Chatbot from "../components/Chatbot";
import TutorialOverlay from "../components/TutorialOverlay";

function MapView() {
  const [activeLayers, setActiveLayers] = useState([]);
  const [searchLocation, setSearchLocation] =
    useState(null);

  const [tutorialOpen, setTutorialOpen] =
    useState(false);

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Header
        onStartTutorial={() => setTutorialOpen(true)}
      />

      <main className="pt-[72px] h-full">
        <div className="relative h-full">
          <Sidebar
            activeLayers={activeLayers}
            onToggleLayer={handleLayerToggle}
            onClearMap={handleClearLayers}
            onSearchLocation={handleSearchLocation}
          />

          <Map
            activeLayers={activeLayers}
            searchLocation={searchLocation}
          />

          <Chatbot />
          
        </div>
      </main>

      <TutorialOverlay
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </div>
  );
}

export default MapView;