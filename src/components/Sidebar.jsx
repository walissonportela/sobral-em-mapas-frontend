import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ChevronDown, Layers, Menu, Search, Filter, 
  Info, Eraser, X, ChevronRight, Map as MapIcon,
  ChevronLeft // Novo ícone para recolher
} from 'lucide-react';

export default function Sidebar({ activeLayers, onToggleLayer, onClearMap }) {
  const [isOpen, setIsOpen] = useState(true); 
  const [view, setView] = useState('camadas');
  const [categories, setCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    api.get('/map-data')
      .then(res => {
        const layers = res.data.data.layers;
        const grouped = layers.reduce((acc, layer) => {
          const cat = layer.category?.name || 'Geral';
          const sub = layer.subcategory?.name || 'Diversos';
          if (!acc[cat]) acc[cat] = {};
          if (!acc[cat][sub]) acc[cat][sub] = [];
          acc[cat][sub].push(layer);
          return acc;
        }, {});
        setCategories(grouped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleAccordion = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCategories = Object.keys(categories).reduce((acc, cat) => {
    const subcats = categories[cat];
    const filteredSubcats = Object.keys(subcats).reduce((subAcc, sub) => {
      const layers = subcats[sub].filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (layers.length > 0) subAcc[sub] = layers;
      return subAcc;
    }, {});
    if (Object.keys(filteredSubcats).length > 0) acc[cat] = filteredSubcats;
    return acc;
  }, {});

  return (
    <div className={`fixed top-16 left-0 bottom-0 flex z-[1000] transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-[350px]'}`}>
      
      {/* Corpo da Sidebar */}
      <aside className="w-[350px] bg-white flex flex-col shadow-2xl border-r border-gray-100 h-full relative">
        
        {/* BOTÃO TOGGLE (Colado na direita) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-10 top-2 bg-blue-700 text-white p-2.5 rounded-r-lg shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center border-l border-blue-600"
          title={isOpen ? "Recolher Menu" : "Expandir Menu"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>

        {/* Cabeçalho */}
        <div className="p-4 bg-blue-700 text-white shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <MapIcon size={18} className="text-blue-200" />
            <h1 className="font-bold text-sm uppercase tracking-wider">Sobral em Mapas</h1>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
            <input 
              type="text"
              placeholder="Pesquisar camadas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-blue-800/40 border border-blue-400/20 rounded-lg py-2 pl-9 pr-4 text-xs placeholder:text-blue-300 focus:bg-white focus:text-blue-900 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Abas */}
        <div className="flex bg-gray-50 border-b border-gray-100">
          <button 
            onClick={() => setView('camadas')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'camadas' ? 'text-blue-700 border-b-2 border-blue-700 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Camadas
          </button>
          <button 
            onClick={() => setView('ativos')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'ativos' ? 'text-blue-700 border-b-2 border-blue-700 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Mapas Ativos ({activeLayers.length})
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-3 bg-white space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
               <span className="text-[10px] font-bold uppercase tracking-widest">Carregando...</span>
            </div>
          ) : view === 'camadas' ? (
            Object.keys(filteredCategories).map(cat => (
              <div key={cat} className="border border-gray-50 rounded-lg overflow-hidden">
                <button 
                  onClick={() => toggleAccordion(cat)}
                  className={`w-full flex items-center justify-between p-3 text-left transition-all ${openItems[cat] ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                >
                  <span className="font-bold text-[11px] text-gray-700 uppercase tracking-tight">{cat}</span>
                  <ChevronDown className={`text-gray-400 transition-transform duration-300 ${openItems[cat] ? 'rotate-180' : ''}`} size={14} />
                </button>

                {openItems[cat] && (
                  <div className="px-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {Object.keys(filteredCategories[cat]).map(sub => (
                      <div key={sub} className="mt-1">
                        <button 
                          onClick={() => toggleAccordion(`${cat}-${sub}`)}
                          className="w-full flex items-center gap-2 p-2 text-[10px] font-bold text-blue-600/60 uppercase"
                        >
                          <ChevronRight size={10} className={openItems[`${cat}-${sub}`] ? 'rotate-90 transition-transform' : ''} />
                          {sub}
                        </button>
                        
                        {openItems[`${cat}-${sub}`] && (
                          <div className="pl-4 pr-2 py-1 space-y-1">
                            {filteredCategories[cat][sub].map(layer => (
                              <label key={layer.layer_name} className="flex items-center gap-3 p-2 rounded-md hover:bg-blue-50/30 cursor-pointer group transition-all border border-transparent hover:border-blue-100">
                                <input 
                                  type="checkbox"
                                  checked={activeLayers.includes(layer.layer_name)}
                                  onChange={() => onToggleLayer(layer)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                                />
                                <span className="text-[11px] text-gray-500 group-hover:text-blue-800 transition-colors">{layer.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="space-y-3">
              {activeLayers.length === 0 ? (
                <div className="text-center py-20">
                    <Info size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhuma camada ativa</p>
                </div>
              ) : (
                activeLayers.map(layerName => {
                  const layer = Object.values(categories).flatMap(s => Object.values(s)).flat().find(l => l.layer_name === layerName);
                  return (
                    <div key={layerName} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm border-l-4 border-blue-600 animate-in slide-in-from-left-2 duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-[10px] text-blue-900 uppercase tracking-tighter">{layer?.name}</h3>
                        <button onClick={() => onToggleLayer(layer)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </div>
                      {layer?.legend_url && <img src={layer.legend_url} className="max-w-full h-auto mb-2 opacity-90" alt="Legenda" />}
                      <p className="text-[9px] text-gray-400 leading-normal">{layer?.description || "Sem descrição disponível."}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button 
            onClick={onClearMap}
            className="flex items-center gap-2 text-[9px] font-bold uppercase text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
          >
            <Eraser size={12} /> Limpar
          </button>
          <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest italic">Prefeitura de Sobral</span>
        </div>
      </aside>
    </div>
  );
}