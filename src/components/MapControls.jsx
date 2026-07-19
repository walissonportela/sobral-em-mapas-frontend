import { useState, useRef } from "react";
import { useMap } from "react-leaflet";
import { Locate, Layers, Plus, Minus, Info, X } from "lucide-react";
import L from "leaflet";

export default function MapControls({ onLayerChange, currentLayer }) {
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
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
        <button className="h-11 w-11 flex items-center justify-center border-b border-slate-100 hover:bg-blue-50 transition" onClick={() => map.zoomIn()} title="Zoom +"><Plus size={20}/></button>
        <button className="h-11 w-11 flex items-center justify-center hover:bg-blue-50 transition" onClick={() => map.zoomOut()} title="Zoom -"><Minus size={20}/></button>
      </div>

      <div className="relative flex flex-col rounded-2xl shadow-xl border border-slate-200 bg-white">
        <button className="h-11 w-11 flex items-center justify-center border-b border-slate-100 hover:bg-blue-50 transition" onClick={handleLocate} title="Localizar"><Locate size={20} className={ locationEnabled ? "text-blue-600" : "text-slate-600" } /></button>
        <button className="h-11 w-11 flex items-center justify-center border-b border-slate-100 hover:bg-blue-50 transition" onClick={() => { setShowLayerMenu(!showLayerMenu); setShowLegend(false); }} title="Camadas"><Layers size={20} className={showLayerMenu ? "text-blue-600" : "text-slate-600"} /></button>
        <button className="h-11 w-11 flex items-center justify-center hover:bg-blue-50 transition" onClick={() => { setShowLegend(!showLegend); setShowLayerMenu(false); }} title="Legenda"><Info size={20} className={showLegend ? 'text-blue-600' : 'text-slate-600'} /></button>
        
       {showLayerMenu && (
          <div className="absolute top-11 right-14 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-[2000]">
            {[
              {
                id: "osm",
                label: "Mapa Padrão",
                preview:
                  "bg-gradient-to-br from-green-200 via-yellow-100 to-blue-200",
              },
              {
                id: "satellite",
                label: "Satélite",
                preview:
                  "bg-gradient-to-br from-green-900 via-green-700 to-stone-500",
              },
              {
                id: "topographic",
                label: "Relevo",
                preview:
                  "bg-gradient-to-br from-green-300 via-yellow-300 to-stone-400",
              },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  onLayerChange(layer.id);
                  setShowLayerMenu(false);
                }}
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2
                  rounded-xl
                  transition
                  ${
                    currentLayer === layer.id
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-50"
                  }
                `}
              >
                <div
                  className={`
                    w-10
                    h-10
                    rounded-lg
                    border
                    border-slate-300
                    overflow-hidden
                    relative
                    ${layer.preview}
                  `}
                >
                  {layer.id === "osm" && (
                    <>
                      <div className="absolute left-0 top-4 w-full h-[2px] bg-white/80 rotate-12"></div>
                      <div className="absolute left-3 top-0 w-[2px] h-full bg-white/70 -rotate-12"></div>
                    </>
                  )}

                  {layer.id === "satellite" && (
                    <>
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_30%,white_2px,transparent_3px)] bg-[length:12px_12px]"></div>
                    </>
                  )}

                  {layer.id === "topographic" && (
                    <>
                      <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,#8b5e3c_5px,#8b5e3c_6px)]"></div>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {layer.label}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {layer.id === "osm" &&
                      "Ruas e cidades"}

                    {layer.id === "satellite" &&
                      "Imagem aérea"}

                    {layer.id === "topographic" &&
                      "Curvas de nível"}
                  </span>
                </div>
              </button>
            ))}
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

function LegendSection({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
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