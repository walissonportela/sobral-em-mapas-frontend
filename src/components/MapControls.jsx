import { useState, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  Locate,
  Layers,
  Plus,
  Minus,
  Info,
  X,
  Navigation2,
} from "lucide-react";
import L from "leaflet";

export default function MapControls({
  onLayerChange,
  currentLayer,
  municipalBoundaryVisible = true,
  municipalBoundaryAvailable = false,
  onToggleMunicipalBoundary,
}) {
  const map = useMap();
  const [showLegend, setShowLegend] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const locationMarkerRef = useRef(null);
  const locationCircleRef = useRef(null);

  const [locationEnabled, setLocationEnabled] = useState(false);

  const locationFound = (e) => {
    if (locationMarkerRef.current) {
      map.removeLayer(locationMarkerRef.current);
    }

    if (locationCircleRef.current) {
      map.removeLayer(locationCircleRef.current);
    }

    locationMarkerRef.current = L.marker(e.latlng)
      .addTo(map)
      .bindPopup("Você está aqui!");

    locationCircleRef.current = L.circle(e.latlng, {
      radius: e.accuracy,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);

    map.flyTo(e.latlng, 16);

    setLocationEnabled(true);
  };

  const handleLocate = () => {
    if (locationEnabled) {
      if (locationMarkerRef.current) {
        map.removeLayer(locationMarkerRef.current);
        locationMarkerRef.current = null;
      }

      if (locationCircleRef.current) {
        map.removeLayer(locationCircleRef.current);
        locationCircleRef.current = null;
      }

      map.stopLocate();
      map.off("locationfound", locationFound);

      setLocationEnabled(false);
      return;
    }

    map.off("locationfound", locationFound);
    map.on("locationfound", locationFound);

    map.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
      watch: false,
    });
  };

  return (
    <div
      data-tour="map-controls"
      data-map-export-ignore="true"
      className="absolute top-4 right-4 z-[1000] flex flex-col gap-2"
    >
      {/* Indicador fixo do norte: o mapa não possui rotação */}
      <div
        aria-label="Norte geográfico"
        role="img"
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white shadow-lg pointer-events-none"
      >
        <Navigation2 size={23} strokeWidth={1.8} className="text-slate-800" />
        <span className="text-[9px] font-bold leading-none text-slate-600">N</span>
      </div>

      <div className="flex flex-col rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
        <button className="h-11 w-11 flex items-center justify-center border-b border-slate-100 hover:bg-blue-50 transition" onClick={() => map.zoomIn()} title="Zoom +"><Plus size={20}/></button>
        <button className="h-11 w-11 flex items-center justify-center hover:bg-blue-50 transition" onClick={() => map.zoomOut()} title="Zoom -"><Minus size={20}/></button>
      </div>

      <div className="relative flex flex-col rounded-2xl shadow-xl border border-slate-200 bg-white">
        <button className="h-11 w-11 flex items-center justify-center border-b border-slate-100 hover:bg-blue-50 transition" onClick={handleLocate} title="Localizar"><Locate size={20} className={ locationEnabled ? "text-blue-600" : "text-slate-600" } /></button>
        <button className="h-11 w-11 flex items-center justify-center border-b border-slate-100 hover:bg-blue-50 transition" onClick={() => { setShowLayerMenu(!showLayerMenu); setShowLegend(false); }} title="Camadas"><Layers size={20} className={showLayerMenu ? "text-blue-600" : "text-slate-600"} /></button>
        <button className="h-11 w-11 flex items-center justify-center hover:bg-blue-50 transition" onClick={() => { setShowLegend(!showLegend); setShowLayerMenu(false); }} title="Legenda"><Info size={20} className={showLegend ? 'text-blue-600' : 'text-slate-600'} /></button>
        
        {showLayerMenu && (
          <div
            className="absolute top-0 right-14 z-[2000] w-56 max-w-[calc(100vw-88px)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
            style={{ maxHeight: "min(420px, calc(100dvh - 240px))" }}
            onWheel={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Mapas-base
            </p>

            {[
              {
                id: "osm",
                label: "Mapa Padrão",
                preview: "bg-gradient-to-br from-green-200 via-yellow-100 to-blue-200",
              },
              {
                id: "light",
                label: "Claro",
                preview: "bg-gradient-to-br from-white via-slate-100 to-sky-100",
              },
              {
                id: "darkContrast",
                label: "Escuro",
                preview: "bg-gradient-to-br from-slate-950 via-slate-600 to-slate-300",
              },
              {
                id: "satellite",
                label: "Satélite",
                preview: "bg-gradient-to-br from-green-900 via-green-700 to-stone-500",
              },
              {
                id: "topographic",
                label: "Relevo",
                preview: "bg-gradient-to-br from-green-300 via-yellow-300 to-stone-400",
              },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => {
                  onLayerChange(layer.id);
                  setShowLayerMenu(false);
                }}
                aria-pressed={currentLayer === layer.id}
                className={`flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors ${
                  currentLayer === layer.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`h-8 w-8 shrink-0 rounded-md border border-slate-200 ${layer.preview}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {layer.label}
                </span>
                {currentLayer === layer.id && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                )}
              </button>
            ))}

            {/* As opções abaixo usam as camadas já cadastradas na Sidebar. */}
            <div className="mt-2 border-t border-slate-100 px-1 pt-2 pb-1">
              <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Limites territoriais
              </p>

              <label
                className={`flex min-h-8 items-center gap-2 rounded-md px-1 py-1 text-xs ${
                  municipalBoundaryAvailable
                    ? "cursor-pointer text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed text-slate-400"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 shrink-0 accent-blue-600"
                  checked={municipalBoundaryVisible && municipalBoundaryAvailable}
                  disabled={!municipalBoundaryAvailable}
                  onChange={() => onToggleMunicipalBoundary?.()}
                />
                <span className="leading-tight">Limite municipal de Sobral</span>
              </label>

            </div>
          </div>
        )}

        {showLegend && (
          <div className="absolute top-0 right-14 w-[320px] bg-white rounded-2xl shadow-xl border border-slate-200 z-[2000]">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700">
                Legenda
              </h3>

              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-[50vh] sm:max-h-[400px] overflow-y-auto space-y-5">

              {/* Vias e Transportes */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">
                  Vias e Transportes
                </h4>

                <div className="space-y-2.5">
                  <LegendItem
                    visual={<div className="w-6 h-1.5 bg-orange-400 rounded-sm"></div>}
                    label="Rodovia / BR"
                  />

                  <LegendItem
                    visual={
                      <div className="w-6 h-1 rounded-sm overflow-hidden flex">
                        <div className="w-1/2 bg-yellow-300 border-y border-yellow-500"></div>
                        <div className="w-1/2 bg-orange-400 border-y border-orange-600"></div>
                      </div>
                    }
                    label="Estrada principal / CE e BR"
                  />

                  <LegendItem
                    visual={<div className="w-6 h-[3px] bg-white border-y border-slate-300"></div>}
                    label="Rua comum"
                  />

                  <LegendItem
                    visual={<div className="w-6 h-[2px] border-b-[2px] border-dashed border-slate-400"></div>}
                    label="Via de pedestre / Trilha"
                  />

                  <LegendItem
                    visual={<div className="w-6 h-[2px] border-b-[2px] border-dotted border-blue-500"></div>}
                    label="Ciclovia"
                  />

                  <LegendItem
                    visual={
                      <div className="w-6 h-1 relative flex items-center justify-center">
                        <div className="absolute w-full h-[2px] bg-slate-500"></div>
                        <div className="absolute w-full h-[6px] border-x-2 border-slate-500 flex justify-evenly">
                          <div className="w-px h-full bg-slate-500"></div>
                        </div>
                      </div>
                    }
                    label="Ferrovia"
                  />
                </div>
              </div>

              {/* Uso do Solo */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">
                  Uso do Solo
                </h4>

                <div className="space-y-2.5">
                  <LegendItem
                    visual={<div className="w-5 h-5 bg-[#aad3df] rounded-sm"></div>}
                    label="Rio / Lago / Água"
                  />

                  <LegendItem
                    visual={<div className="w-5 h-5 bg-[#c8facc] rounded-sm"></div>}
                    label="Parque / Praça"
                  />

                  <LegendItem
                    visual={<div className="w-5 h-5 bg-[#8dc56c] rounded-sm"></div>}
                    label="Floresta / Mata"
                  />

                  <LegendItem
                    visual={<div className="w-5 h-5 bg-[#e0dfdf] rounded-sm"></div>}
                    label="Área residencial"
                  />

                  <LegendItem
                    visual={<div className="w-5 h-5 bg-[#ebdbe8] rounded-sm"></div>}
                    label="Área industrial"
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({ visual, label }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="w-7 flex justify-center shrink-0">
        {visual}
      </div>

      <span>{label}</span>
    </div>
  );
}