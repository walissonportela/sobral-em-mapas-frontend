import { useState } from 'react';
import { Ruler, Square, Trash2, MousePointer2, Plus, Minus, ChevronRight } from 'lucide-react';

export default function MapToolbar({ onMeasureLine, onMeasureArea, onClear, onZoomIn, onZoomOut, onStop }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 items-end font-sans">
      
      {/* Grupo de Zoom - Centralizado */}
      <div className="flex flex-col bg-white rounded-wall shadow-xl border border-gray-200 p-1 w-12 items-center justify-center">
        <button 
          onClick={onZoomIn} 
          className="h-10 w-full hover:bg-blue-50 text-blue-700 rounded-lg transition-all flex items-center justify-center" 
          title="Aproximar"
        >
          <Plus size={20} />
        </button>
        <div className="h-[1px] bg-gray-100 w-8 mx-auto"></div>
        <button 
          onClick={onZoomOut} 
          className="h-10 w-full hover:bg-blue-50 text-blue-700 rounded-lg transition-all flex items-center justify-center" 
          title="Afastar"
        >
          <Minus size={20} />
        </button>
      </div>

      {/* Botão de Navegação / Stop - Destrava o mouse */}
      <div className="bg-white rounded-wall shadow-xl border border-gray-200 p-1 w-12 h-12 flex items-center justify-center">
        <button 
          onClick={onStop} 
          className="h-10 w-10 hover:bg-blue-50 text-gray-600 rounded-lg transition-all flex items-center justify-center" 
          title="Modo Navegação"
        >
          <MousePointer2 size={20} />
        </button>
      </div>

      {/* Menu Expansível de Medição */}
      <div className="flex items-center gap-2">
        {isExpanded && (
          <div className="flex bg-white rounded-wall shadow-xl border border-gray-200 p-1 animate-in slide-in-from-right-2 duration-200 overflow-hidden">
            <button 
              onClick={() => { onMeasureLine(); setIsExpanded(false); }} 
              className="h-10 hover:bg-blue-50 text-gray-600 rounded-lg transition-all flex items-center gap-2 px-4 whitespace-nowrap"
            >
              <Ruler size={18} />
              <span className="text-[10px] font-black uppercase tracking-tight">Distância</span>
            </button>
            
            <div className="w-[1px] bg-gray-100 h-6 my-auto"></div>
            
            <button 
              onClick={() => { onMeasureArea(); setIsExpanded(false); }} 
              className="h-10 hover:bg-blue-50 text-gray-600 rounded-lg transition-all flex items-center gap-2 px-4 whitespace-nowrap"
            >
              <Square size={18} />
              <span className="text-[10px] font-black uppercase tracking-tight">Área</span>
            </button>
            
            <div className="w-[1px] bg-gray-100 h-6 my-auto"></div>
            
            <button 
              onClick={() => { onClear(); setIsExpanded(false); }} 
              className="h-10 hover:bg-red-50 text-red-500 rounded-lg transition-all flex items-center gap-2 px-4 whitespace-nowrap"
            >
              <Trash2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-tight">Limpar</span>
            </button>
          </div>
        )}

        {/* Botão Gatilho (Régua) */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center w-12 h-12 rounded-wall shadow-xl border transition-all 
            ${isExpanded ? 'bg-blue-700 text-white border-blue-800' : 'bg-white text-blue-700 border-gray-200 hover:bg-blue-50'}`}
          title="Medir"
        >
          {isExpanded ? <ChevronRight size={24} /> : <Ruler size={24} />}
        </button>
      </div>
    </div>
  );
}