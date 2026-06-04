import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Map from './components/Map';

function App() {
  // Estado para gerenciar quais camadas estão ativas no mapa
  const [activeLayers, setActiveLayers] = useState([]);

  // Função para ativar/desativar camadas
  const handleLayerToggle = (layer) => {
    setActiveLayers(prev => 
      prev.includes(layer.layer_name) 
        ? prev.filter(name => name !== layer.layer_name) 
        : [...prev, layer.layer_name]
    );
  };

  // Função para limpar todas as camadas de uma vez
  const handleClearLayers = () => {
    setActiveLayers([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      {/* Header fixo no topo */}
      <Header />

      <div className="relative flex-1 overflow-hidden">
        {/* A Sidebar agora flutua sobre o mapa. 
          O segredo é o posicionamento "absolute" ou "fixed" dentro de um pai "relative" 
        */}
        <Sidebar 
          activeLayers={activeLayers} 
          onToggleLayer={handleLayerToggle} 
          onClearMap={handleClearLayers} 
        />
        
        {/* O Mapa ocupa 100% do espaço disponível por baixo da Sidebar.
          Usamos z-0 para garantir que ele seja a base 
        */}
        <main className="absolute inset-0 z-0">
          <Map activeLayers={activeLayers} />
        </main>
      </div>
    </div>
  );
}

export default App;