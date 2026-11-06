import { useEffect, useState } from "react";
import {
  ChevronDown,
  Droplet,
  Eye,
  List,
  Palette,
  Pentagon,
  Route,
  Ruler,
  Scaling,
  Settings2,
  Trash2,
} from "lucide-react";
import { PanelHeader } from "./Sidebar";

// Leaflet aceita cores CSS em rgb(). As preferências ficam apenas no navegador.
const hexToRgb = (hex) => {
  const cleanHex = hex.replace(/^#/, "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

const MEASUREMENT_UNITS_STORAGE_KEY = "sobral_measurement_units_v1";

function loadMeasurementUnits() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEASUREMENT_UNITS_STORAGE_KEY) || "{}");
    return {
      distance: ["auto", "m", "km"].includes(saved?.distance) ? saved.distance : "auto",
      area: ["auto", "m2", "km2"].includes(saved?.area) ? saved.area : "auto",
    };
  } catch {
    return { distance: "auto", area: "auto" };
  }
}

export default function MeasurePanel({ mapToolsRef }) {
  const [lineColor, setLineColor] = useState("#2563eb");
  const [lineWidth, setLineWidth] = useState(3);
  const [lineStyle, setLineStyle] = useState("solid");
  const [lineOpacity, setLineOpacity] = useState(100);
  const [fillOpacity, setFillOpacity] = useState(18);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [measurementUnits, setMeasurementUnits] = useState(loadMeasurementUnits);
  // O estado inicia vazio: não lemos refs durante a renderização.
  const [measurements, setMeasurements] = useState([]);

 
  useEffect(() => {
    // Mantém a lista sincronizada com os desenhos do Leaflet.
    const handleMeasurements = (event) => {
      setMeasurements(Array.isArray(event.detail) ? event.detail : []);
    };

    window.addEventListener(
      "sobral-measurements-changed",
      handleMeasurements
    );

    // Recupera os desenhos existentes ao reabrir a aba, após a montagem.
    // O requestAnimationFrame evita ler a ref durante a renderização
    // e evita setState síncrono dentro do useEffect.
    const frameId = window.requestAnimationFrame(() => {
      const currentItems = mapToolsRef?.current?.getMeasurements?.() || [];
      setMeasurements(currentItems);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(
        "sobral-measurements-changed",
        handleMeasurements
      );
    };
  }, [mapToolsRef]);


  const handleMeasureLine = () => {
    mapToolsRef?.current?.measureLine?.({
      color: hexToRgb(lineColor),
      width: lineWidth,
      style: lineStyle,
      opacity: lineOpacity / 100,
    });
  };

  const handleMeasureArea = () => {
    mapToolsRef?.current?.measureArea?.({
      color: hexToRgb(lineColor),
      width: lineWidth,
      style: lineStyle,
      opacity: lineOpacity / 100,
      fillOpacity: fillOpacity / 100,
    });
  };

  const handleUnitChange = (kind, selected) => {
    const next = { ...measurementUnits, [kind]: selected };
    setMeasurementUnits(next);
    mapToolsRef?.current?.setMeasurementUnits?.({ [kind]: selected });
    try {
      localStorage.setItem(MEASUREMENT_UNITS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // O controle continua funcionando mesmo sem armazenamento local.
    }
  };

  const handleDeleteMeasurement = (id) => {
    mapToolsRef?.current?.deleteMeasurement?.(id);
    // A lista será atualizada pelo evento enviado pelo Map.jsx.
  };

  const handleClearAll = () => {
    mapToolsRef?.current?.clearDrawings?.();
    // Também utiliza o mesmo evento de sincronização.
  };

  return (
    <>
      <PanelHeader
        icon={<Ruler size={22} />}
        title="Medição"
        subtitle="Meça distâncias e áreas no mapa"
      />

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 md:p-5">
        {/* Ferramentas de medição em destaque */}
        <section aria-label="Ferramentas de medição">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Nova medição
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleMeasureLine}
              className="group flex min-w-0 flex-col items-start gap-2 rounded-xl border border-blue-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
                <Route size={19} />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-800">Distância</span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                  Desenhar uma linha
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleMeasureArea}
              className="group flex min-w-0 flex-col items-start gap-2 rounded-xl border border-blue-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
                <Pentagon size={19} />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-800">Área</span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                  Desenhar um polígono
                </span>
              </span>
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Clique nos pontos do mapa para desenhar. Finalize a medição
            conforme as instruções exibidas no mapa.
          </p>
        </section>

        {/* Preferências recolhíveis, sem ocupar o painel inteiro. */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setAppearanceOpen((value) => !value)}
            aria-expanded={appearanceOpen}
            className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <Settings2 size={18} className="text-blue-700" />
              <span className="text-sm font-bold text-slate-800">Aparência e unidades</span>
            </span>
            <ChevronDown
              size={17}
              className={`shrink-0 text-slate-500 transition-transform ${appearanceOpen ? "rotate-180" : ""}`}
            />
          </button>

          {appearanceOpen && (
            <div className="space-y-4 border-t border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="medicao-cor-principal"
                  className="flex items-center gap-2 text-xs font-medium text-slate-700"
                >
                  <Palette size={15} className="text-slate-400" />
                  Cor principal
                </label>
                <input
                  id="medicao-cor-principal"
                  type="color"
                  value={lineColor}
                  onChange={(event) => setLineColor(event.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                  <label htmlFor="medicao-espessura" className="flex items-center gap-2">
                    <Scaling size={15} className="text-slate-400" />
                    Espessura
                  </label>
                  <span className="font-bold text-blue-800">{lineWidth} px</span>
                </div>
                <input
                  id="medicao-espessura"
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(event) => setLineWidth(Number(event.target.value))}
                  className="w-full cursor-pointer accent-blue-700"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                  <label htmlFor="medicao-opacidade-traco" className="flex items-center gap-2">
                    <Eye size={15} className="text-slate-400" />
                    Opacidade do traço
                  </label>
                  <span className="font-bold text-blue-800">{lineOpacity}%</span>
                </div>
                <input
                  id="medicao-opacidade-traco"
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={lineOpacity}
                  onChange={(event) => setLineOpacity(Number(event.target.value))}
                  className="w-full cursor-pointer accent-blue-700"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                  <label htmlFor="medicao-fundo-area" className="flex items-center gap-2">
                    <Droplet size={15} className="text-slate-400" />
                    Preenchimento da área
                  </label>
                  <span className="font-bold text-blue-800">{fillOpacity}%</span>
                </div>
                <input
                  id="medicao-fundo-area"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={fillOpacity}
                  onChange={(event) => setFillOpacity(Number(event.target.value))}
                  className="w-full cursor-pointer accent-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="medicao-estilo-linha"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Estilo da linha
                </label>
                <select
                  id="medicao-estilo-linha"
                  value={lineStyle}
                  onChange={(event) => setLineStyle(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  <option value="solid">Contínua</option>
                  <option value="dashed">Tracejada</option>
                  <option value="dotted">Pontilhada</option>
                </select>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-blue-800">Unidades de medição</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    A unidade escolhida também atualiza os desenhos já realizados.
                  </p>
                </div>
                <div>
                  <label htmlFor="unidade-distancia" className="mb-1 block text-xs font-medium text-slate-700">
                    Distâncias
                  </label>
                  <select
                    id="unidade-distancia"
                    value={measurementUnits.distance}
                    onChange={(event) => handleUnitChange("distance", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="auto">Automático (m ou km)</option>
                    <option value="m">Metros (m)</option>
                    <option value="km">Quilômetros (km)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="unidade-area" className="mb-1 block text-xs font-medium text-slate-700">
                    Áreas
                  </label>
                  <select
                    id="unidade-area"
                    value={measurementUnits.area}
                    onChange={(event) => handleUnitChange("area", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="auto">Automático (m² ou km²)</option>
                    <option value="m2">Metros quadrados (m²)</option>
                    <option value="km2">Quilômetros quadrados (km²)</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                As opções de aparência serão usadas nos próximos desenhos.
              </p>
            </div>
          )}
        </section>

        {/* Cada medição tem sua própria lixeira. */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-blue-50 px-3 py-3">
            <div className="flex items-center gap-2">
              <List size={17} className="text-blue-700" />
              <h3 className="text-sm font-bold text-blue-900">Medições realizadas</h3>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {measurements.length}
            </span>
          </div>

          {measurements.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs leading-relaxed text-slate-500">
              Nenhuma medição realizada. Escolha Distância ou Área acima para começar.
            </p>
          ) : (
            <>
              <div className="max-h-60 space-y-2 overflow-y-auto p-3">
                {measurements.map((item, index) => {
                  const isLine = item.type === "polyline";
                  const number = measurements
                    .slice(0, index + 1)
                    .filter((measurement) => measurement.type === item.type)
                    .length;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        {isLine ? <Route size={17} /> : <Pentagon size={17} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-500">
                          {isLine ? `Distância ${number}` : `Área ${number}`}
                        </p>
                        <p className="truncate text-sm font-bold text-slate-800" title={item.text}>
                          {item.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMeasurement(item.id)}
                        aria-label={`Excluir somente ${isLine ? "distância" : "área"} ${number}`}
                        title="Excluir somente esta medição"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                >
                  <Trash2 size={15} />
                  Limpar todas as medições
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
