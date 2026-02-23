import { useEffect, useState } from 'react';
import api from '../services/api';
import { Layers, Map as MapIcon } from 'lucide-react';

export default function Sidebar() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/map-data')
      .then(response => {
        // Pegamos a lista que vem de data.layers do seu JSON
        setLayers(response.data.data.layers);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar camadas:", error);
        setLoading(false);
      });
  }, []);

  return (
    <aside className="w-80 h-screen bg-white shadow-xl flex flex-col border-r border-gray-200">
      <div className="p-6 border-b border-gray-100 bg-blue-600 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapIcon size={24} />
          Sobral em Mapas
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
          Camadas Disponíveis ({layers.length})
        </h3>
        
        {loading ? (
          <p className="text-sm text-gray-500 px-2 italic">Carregando camadas...</p>
        ) : (
          layers.map(layer => (
            <button
              key={layer.id}
              className="w-full text-left p-3 rounded-wall hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center gap-3 group border border-transparent hover:border-blue-100"
            >
              <Layers size={18} className="text-gray-400 group-hover:text-blue-500" />
              <span className="text-sm font-medium">{layer.name}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}