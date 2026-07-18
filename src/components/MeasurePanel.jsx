import { Ruler, Trash2, Palette, Scaling, Settings2, Eye, Droplet, List } from "lucide-react";
import { useState, useEffect } from "react";
import { PanelHeader } from "./Sidebar"; 

export default function MeasurePanel({ mapToolsRef }) {
  const [lineColor, setLineColor] = useState("#2563eb");
  const [lineWidth, setLineWidth] = useState(3);
  const [lineStyle, setLineStyle] = useState("solid");
  const [lineOpacity, setLineOpacity] = useState(100); 
  const [fillOpacity, setFillOpacity] = useState(18); // NOVO: Controle de preenchimento
  const [measurements, setMeasurements] = useState([]); // NOVO: Lista de desenhos

  // Escuta as alterações nos desenhos do mapa
  useEffect(() => {
    const handleMeasurements = (event) => {
      setMeasurements(event.detail || []);
    };
    window.addEventListener("sobral-measurements-changed", handleMeasurements);
    return () => window.removeEventListener("sobral-measurements-changed", handleMeasurements);
  }, []);

  const handleMeasureLine = () => {
    mapToolsRef?.current?.measureLine?.({
      color: lineColor,
      width: lineWidth,
      style: lineStyle,
      opacity: lineOpacity / 100,
    });
  };

  const handleMeasureArea = () => {
    mapToolsRef?.current?.measureArea?.({
      color: lineColor,
      width: lineWidth,
      style: lineStyle,
      opacity: lineOpacity / 100,
      fillOpacity: fillOpacity / 100, // Repassando o fundo
    });
  };

  return (
    <>
      <PanelHeader
        icon={<Ruler size={22} />}
        title="Medição"
        subtitle="Meça distâncias e áreas no mapa"
      />

      {/* Ajuste responsivo: p-4 no mobile, p-5 no desktop, gap ajustado */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5 space-y-4 md:space-y-6">
        
        {/* CONFIGURAÇÕES VISUAIS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <Settings2 size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-700 text-[13px] md:text-sm">Aparência</h3>
          </div>

          <div className="space-y-4 md:space-y-5">
            {/* Cor */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] md:text-sm font-medium text-slate-600">
                <Palette size={16} className="text-slate-400" />
                Cor principal
              </label>
              {/* Área de toque maior (h-10) para mobile */}
              <input
                type="color"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="h-10 w-16 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
            </div>

            {/* Espessura */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[13px] md:text-sm font-medium text-slate-600">
                <Scaling size={16} className="text-slate-400" />
                Espessura: {lineWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Opacidade da Linha */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[13px] md:text-sm font-medium text-slate-600">
                <Eye size={16} className="text-slate-400" />
                Opacidade do traço: {lineOpacity}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={lineOpacity}
                onChange={(e) => setLineOpacity(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* NOVO: Opacidade do Fundo */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[13px] md:text-sm font-medium text-slate-600">
                <Droplet size={16} className="text-slate-400" />
                Fundo da área: {fillOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={fillOpacity}
                onChange={(e) => setFillOpacity(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Estilo da Linha */}
            <div className="space-y-1 pt-1">
              <select
                value={lineStyle}
                onChange={(e) => setLineStyle(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[13px] md:text-sm text-slate-700 focus:outline-none focus:border-blue-400"
              >
                <option value="solid">Contínua (▬▬▬)</option>
                <option value="dashed">Tracejada ( ‑ ‑ ‑ )</option>
                <option value="dotted">Pontilhada ( • • • )</option>
              </select>
            </div>
          </div>
        </div>

        {/* FERRAMENTAS */}
        <div className="space-y-2 md:space-y-3">
          <button
            type="button"
            onClick={handleMeasureLine}
            className="w-full rounded-2xl bg-white border border-slate-200 p-3 md:p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition shadow-sm group"
          >
            <h3 className="font-black text-slate-800 text-[13px] md:text-base group-hover:text-blue-700">Medir distância</h3>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 leading-snug">
              Clique no mapa para traçar uma linha.
            </p>
          </button>

          <button
            type="button"
            onClick={handleMeasureArea}
            className="w-full rounded-2xl bg-white border border-slate-200 p-3 md:p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition shadow-sm group"
          >
            <h3 className="font-black text-slate-800 text-[13px] md:text-base group-hover:text-blue-700">Medir área</h3>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 leading-snug">
              Desenhe um polígono para calcular o tamanho.
            </p>
          </button>
        </div>

        {/* LISTA DE MEDIÇÕES */}
        {measurements.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <List size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-700 text-[13px] md:text-sm">Itens desenhados</h3>
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold">
                {measurements.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
              {measurements.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.type === "polyline" ? `Linha ${index + 1}` : `Área ${index + 1}`}
                    </p>
                    <p className="text-[13px] md:text-sm font-black text-slate-700 truncate">
                      {item.text}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => mapToolsRef?.current?.deleteMeasurement?.(item.id)}
                    className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
                    title="Apagar este desenho"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIMPEZA TOTAL (Fora da condição, sempre aparece) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => mapToolsRef?.current?.clearDrawings?.()}
            className="w-full text-left rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between hover:bg-red-100 transition group"
          >
            <div>
              <h3 className="font-black text-red-700 text-[13px] md:text-sm">Limpar medições</h3>
              <p className="text-xs text-red-500 mt-0.5">
                Remove os desenhos do mapa
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition shrink-0">
              <Trash2 size={18} className="text-red-600" />
            </div>
          </button>
        </div>

      </div>
    </>
  );
}
