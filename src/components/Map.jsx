import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  GeoJSON,
  WMSTileLayer,
  useMap,
  useMapEvents,
  ScaleControl,
  Pane,
} from "react-leaflet";

import { Crosshair, ChevronDown, Copy, Check, MapPin } from "lucide-react";

import L from "leaflet";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "leaflet-geometryutil";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PrintSelectionOverlay from "./PrintSelectionOverlay";
import MapControls from "./MapControls";
import LocalGeoJSONLayer from "./LocalGeoJSONLayer";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api";

// Chave pública dos mapas-base da CARTO (configurada no .env.local do Vite).
const CARTO_BASEMAP_KEY = (import.meta.env.VITE_CARTO_BASEMAP_KEY || "").trim();


const searchPinIcon = L.divIcon({
  className: "",
  html: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="44"
      viewBox="0 0 36 44"
    >
      <path
        d="M18 2C9 2 3 9 3 17c0 12 15 24 15 24s15-12 15-24C33 9 27 2 18 2Z"
        fill="#2563eb"
        stroke="#ffffff"
        stroke-width="2.5"
      />
      <circle
        cx="18"
        cy="17"
        r="6"
        fill="#ffffff"
      />
    </svg>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  popupAnchor: [0, -39],
});

export default function Map({
  activeLayers = [],
  layerViewSettings = {},
  availableLayers = [],
  onToggleLayer,
  searchLocation,
  mapToolsRef,
}) {

  const [sobralGeoJson, setSobralGeoJson] =
    useState(null);
  const [showMunicipalBoundary, setShowMunicipalBoundary] = useState(true);

  // Reaproveita o mesmo cadastro de camadas exibido na Sidebar.
  // Somente GeoJSONs existentes entram no controle territorial.
  const referenceLayers = useMemo(() => {
    const normalize = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

    const candidates = availableLayers.filter((layer) =>
      String(layer.source_format || "").toUpperCase() === "GEOJSON" &&
      Boolean(layer.geojson_path)
    );

    const findLayer = (exactName, categoryKeyword, nameKeyword) =>
      candidates.find((layer) => normalize(layer.name) === exactName) ||
      candidates.find((layer) =>
        normalize(layer.subcategory?.name).includes(categoryKeyword) &&
        normalize(layer.name).includes(nameKeyword)
      ) || null;

    return [
      {
        id: "bairros",
        label: "Limite dos bairros",
        layer: findLayer("bairros de sobral", "bairro", "bairro"),
      },
      {
        id: "distritos",
        label: "Limite dos distritos",
        layer: findLayer("divisao de distritos", "distrito", "distrito"),
      },
    ];
  }, [availableLayers]);

  const [printMode, setPrintMode] =
    useState(false);

  const [printFormat, setPrintFormat] =
    useState("pdf");

  const [isExporting, setIsExporting] =
    useState(false);

  const [printSelection, setPrintSelection] =
    useState({
      x: 460,
      y: 130,
      width: 560,
      height: 360,
    });

  const [layerUrl, setLayerUrl] = useState(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  );
  const [layerType, setLayerType] = useState("osm");

  const handleLayerChange = (type) => {
    const urls = {
      osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      light: CARTO_BASEMAP_KEY
        ? `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_BASEMAP_KEY)}`
        : null,
      dark: CARTO_BASEMAP_KEY
        ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_BASEMAP_KEY)}`
        : null,
      darkContrast: CARTO_BASEMAP_KEY
        ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_BASEMAP_KEY)}`
        : null,
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      topographic:
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    };

    if (!urls[type]) {
      console.warn("Fonte de mapa indisponível. Confira VITE_CARTO_BASEMAP_KEY no .env.local.");
      return;
    }

    setLayerType(type);
    setLayerUrl(urls[type]);
  };

  const mapShellRef = useRef(null);
  const drawLayerRef = useRef(null);

  const position = [-3.6892, -40.3489];
  useEffect(() => {
    let isMounted = true;

    async function loadBoundary() {
      try {
        const response = await fetch(
          "https://polygons.openstreetmap.fr/get_geojson.py?id=302610&params=0"
        );

        const data = await response.json();

        if (isMounted) {
          setSobralGeoJson(data);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar limite de Sobral:",
          error
        );
      }
    }

    loadBoundary();

    return () => {
      isMounted = false;
    };
  }, []);

  
  const exportSelectedArea = useCallback(
    async (selectedFormat = printFormat) => {
      try {
        const shell = mapShellRef.current;

        if (!shell) {
          alert("Área do mapa não encontrada.");
          return;
        }

        const mapElement = shell.querySelector(
          ".leaflet-container"
        );

        if (!mapElement) {
          alert("Container do mapa não encontrado.");
          return;
        }

        setIsExporting(true);

        await new Promise((resolve) =>
          window.setTimeout(resolve, 250)
        );

        const mapRect =
          mapElement.getBoundingClientRect();

        const shellRect =
          shell.getBoundingClientRect();

        // GERAÇÃO DA IMAGEM COM DOM-TO-IMAGE-MORE
        const scale = 2;
        const canvas = await domtoimage.toCanvas(mapElement, {
          bgcolor: "#ffffff",
          width: mapElement.clientWidth * scale,
          height: mapElement.clientHeight * scale,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          },
          filter: (node) => {
            // Proteção para nós de texto (que não têm dataset ou classList)
            if (node.nodeType !== 1) return true;

            // Ignora a interface para não sair na foto e evitar erros de CSS
            if (node.dataset?.printOverlay === "true") return false;
            if (node.dataset?.mapExportIgnore === "true") return false;
            if (node.classList?.contains("leaflet-control-container")) return false;
            
            return true;
          },
        });

        const scaleX = canvas.width / mapRect.width;
        const scaleY = canvas.height / mapRect.height;

        const relativeX =
          printSelection.x -
          (mapRect.left - shellRect.left);

        const relativeY =
          printSelection.y -
          (mapRect.top - shellRect.top);

        const cropX = Math.max(
          0,
          Math.round(relativeX * scaleX)
        );

        const cropY = Math.max(
          0,
          Math.round(relativeY * scaleY)
        );

        const cropWidth = Math.min(
          Math.round(printSelection.width * scaleX),
          canvas.width - cropX
        );

        const cropHeight = Math.min(
          Math.round(printSelection.height * scaleY),
          canvas.height - cropY
        );

        if (cropWidth <= 0 || cropHeight <= 0) {
          alert("A área selecionada está fora do mapa.");
          return;
        }

        const croppedCanvas =
          document.createElement("canvas");

        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;

        const context =
          croppedCanvas.getContext("2d");

        context.drawImage(
          canvas,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        const format =
          selectedFormat || printFormat;

        if (format === "pdf") {
          exportCanvasAsPdf(croppedCanvas);
        } else if (format === "jpeg") {
          await exportCanvasAsImage(
            croppedCanvas,
            "jpeg"
          );
        } else {
          await exportCanvasAsImage(
            croppedCanvas,
            "png"
          );
        }

        dispatchPrintHistoryEvent({
          format,
          selection: printSelection,
          activeLayers,
          canvas: croppedCanvas,
        });

      } catch (error) {
        console.error("Erro real ao exportar:", error);

        const message =
          error?.message || String(error);

        if (message.includes("oklch")) {
          alert(
            "Não foi possível exportar porque algum elemento visual usa cor CSS OKLCH. Ajustei para ignorar os controles do mapa; atualize a página com Ctrl + F5 e tente novamente."
          );

          return;
        }

        alert(
          `Não foi possível exportar o mapa.\n\nErro: ${message}`
        );
      } finally {
        setIsExporting(false);
      }
    },
    [printFormat, printSelection, activeLayers]
  );

  const printTools = useMemo(
    () => ({
      enablePrintSelection: (
        format = "pdf",
        savedSelection = null
      ) => {
        setPrintFormat(format);

        if (savedSelection) {
          setPrintSelection(
            normalizePrintSelection(savedSelection)
          );
        }

        setPrintMode(true);
      },

      disablePrintSelection: () => {
        setPrintMode(false);
      },

      setPrintFormat: (format) => {
        setPrintFormat(format);
      },

      exportPrintSelection: (format) => {
        exportSelectedArea(format);
      },
    }),
    [exportSelectedArea]
  );

  return (
    <div
      ref={mapShellRef}
      className="absolute inset-0 z-0"
    >
      {/* O contraste modifica somente os tiles do mapa-base.
          Camadas GeoJSON, WMS, marcadores e limite municipal não recebem o filtro. */}
      <style>{`
        .leaflet-layer.sobral-dark-contrast {
          filter: brightness(1.65) contrast(1.15) saturate(1.1);
        }

        /* Etiquetas das medições: fundo claro e texto azul legível. */
        .leaflet-tooltip.measurement-tooltip {
          background: rgba(255, 255, 255, 0.97) !important;
          color: #1e40af !important;
          border: 1px solid #bfdbfe !important;
          border-left: 3px solid #2563eb !important;
          border-radius: 8px !important;
          padding: 7px 11px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15) !important;
          white-space: nowrap !important;
        }
        .leaflet-tooltip.measurement-tooltip::before {
          display: none !important;
        }
          
      `}</style>
      <MapContainer
        center={position}
        zoom={14}
        zoomControl={false}
        preferCanvas={true}
        className="h-full w-full"
      >
        <MapToolsBridge
          searchLocation={searchLocation}
          mapToolsRef={mapToolsRef}
          drawLayerRef={drawLayerRef}
          printTools={printTools}
        />

        <MapControls
          onLayerChange={handleLayerChange}
          currentLayer={layerType}
          activeLayers={activeLayers}
          referenceLayers={referenceLayers}
          onToggleReferenceLayer={onToggleLayer}
          municipalBoundaryVisible={showMunicipalBoundary}
          municipalBoundaryAvailable={Boolean(sobralGeoJson)}
          onToggleMunicipalBoundary={() => setShowMunicipalBoundary((visible) => !visible)}
        />

        {/* Escala gráfica dinâmica, em metros e quilômetros */}
        <ScaleControl
          position="bottomright"
          metric={true}
          imperial={false}
          maxWidth={120}
        />

        {/* Coordenadas do cursor ou do ponto tocado no mapa */}
        <MapCoordinatesDisplay />

        <Pane name="base-map" style={{ zIndex: 200 }}>
          <TileLayer
            key={layerType}
            url={layerUrl}
            className={layerType === "darkContrast" ? "sobral-dark-contrast" : ""}
            crossOrigin="anonymous"
            attribution={
              layerType === "light" || layerType === "dark" || layerType === "darkContrast"
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution/">CARTO</a>'
                : layerType === "osm"
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  : layerType === "topographic"
                    ? '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>, OpenStreetMap contributors, SRTM'
                    : 'Tiles &copy; Esri, Maxar'
            }
          />
        </Pane>

        <Pane name="wms-layers" style={{ zIndex: 450 }}>
          {activeLayers
            .filter((layer) => layer.source_format !== "GEOJSON")
            .map((layer) => (
              <WMSTileLayer
              key={layer.id}
              url={`${API_BASE_URL}/proxy-wms`}
              layers={layer.layer_name}
              transparent
              format="image/png"
              version="1.1.1"
              crossOrigin="anonymous"
              wms_link_id={
                layer.wms_link_id ||
                layer.wmsLink?.id ||
                ""
              }
            />
          ))}
        </Pane>

        {showMunicipalBoundary && sobralGeoJson && (
          <GeoJSON
            data={sobralGeoJson}
            style={{
              color: "#ff0000",
              weight: 3,
              fillOpacity: 0,
            }}
          />
        )}

        
        {activeLayers
          .filter((layer) => layer.source_format === "GEOJSON")
          .map((layer) => (
            <LocalGeoJSONLayer
              key={layer.id}
              layer={layer}
              viewSettings={layerViewSettings[String(layer.id)]}
            />
          ))}


        {/* Marca o resultado selecionado na pesquisa, acima das outras camadas. */}
        
        {/* Pino do local encontrado na pesquisa */}
        <Pane name="search-result-highlight" style={{ zIndex: 670 }}>
          {searchLocation &&
            Number.isFinite(Number(searchLocation.lat)) &&
            Number.isFinite(Number(searchLocation.lon)) && (
              <Marker
                position={[
                  Number(searchLocation.lat),
                  Number(searchLocation.lon),
                ]}
                icon={searchPinIcon}
              >
                
                <Popup
                  className="sobral-search-popup"
                  minWidth={220}
                  maxWidth={240}
                  offset={[0, -5]}
                >
                  <div className="px-3 py-3">
                    <div className="mb-2 flex items-center gap-1.5 pr-6">
                      <MapPin size={14} className="shrink-0 text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        Local encontrado
                      </span>
                    </div>

                    <h3 className="m-0 break-words text-[15px] font-bold leading-snug text-slate-800">
                      {searchLocation.name || "Local encontrado"}
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2">
                      <Crosshair size={12} className="shrink-0 text-slate-400" />
                      <span className="text-[11px] text-slate-500">
                        {Number(searchLocation.lat).toFixed(5)},{" "}
                        {Number(searchLocation.lon).toFixed(5)}
                      </span>
                    </div>
                  </div>
                </Popup>

              </Marker>
            )}
        </Pane>

      </MapContainer>

      {printMode && (
        <PrintSelectionOverlay
          selection={printSelection}
          setSelection={setPrintSelection}
          format={printFormat}
          setFormat={setPrintFormat}
          onClose={() => setPrintMode(false)}
          onExport={() =>
            exportSelectedArea(printFormat)
          }
          isExporting={isExporting}
          containerRef={mapShellRef}
        />
      )}
    </div>
  );
}

// Mostra latitude e longitude em WGS 84, com painel compacto e recolhível.
// Em telas pequenas, o painel começa recolhido para ocupar menos espaço no mapa.
function MapCoordinatesDisplay() {
  const [coordinates, setCoordinates] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [expanded, setExpanded] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 640px)").matches
  );

  useMapEvents({
    mousemove(event) {
      setCoordinates({
        latitude: event.latlng.lat.toFixed(5),
        longitude: event.latlng.lng.toFixed(5),
      });
      setCopyStatus("");
    },
    click(event) {
      // No celular, um toque no mapa também atualiza as coordenadas.
      setCoordinates({
        latitude: event.latlng.lat.toFixed(5),
        longitude: event.latlng.lng.toFixed(5),
      });
      setCopyStatus("");
    },
  });

  const copyCoordinates = async (event) => {
    event.stopPropagation();
    if (!coordinates) return;

    const text = `${coordinates.latitude}, ${coordinates.longitude}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copiado!");
    } catch (error) {
      console.error("Não foi possível copiar as coordenadas:", error);
      setCopyStatus("Erro ao copiar");
    }
  };

  return (
    <div
      data-map-export-ignore="true"
      className="absolute bottom-[72px] right-3 z-[1000]"
      onMouseDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {expanded ? (
        <div className="w-[230px] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Crosshair size={15} className="text-blue-600" aria-hidden="true" />
              <span className="text-xs font-semibold text-slate-700">Coordenadas</span>
              <span className="text-[10px] text-slate-400">WGS 84</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              title="Recolher coordenadas"
              aria-label="Recolher coordenadas"
              aria-expanded={true}
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="px-3 pb-2.5 pt-2">
            {coordinates ? (
              <div className="space-y-1 font-mono text-[11px] tabular-nums text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-7 text-slate-500">Lat:</span>
                  <span>{coordinates.latitude}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 text-slate-500">Lon:</span>
                  <span>{coordinates.longitude}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Mova o cursor ou toque no mapa.
              </p>
            )}

            <button
              type="button"
              onClick={copyCoordinates}
              disabled={!coordinates}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Copiar latitude e longitude"
            >
              {copyStatus === "Copiado!" ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
              {copyStatus || "Copiar coordenadas"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-blue-50 hover:text-blue-700"
          title="Mostrar coordenadas"
          aria-label="Mostrar coordenadas"
          aria-expanded={false}
        >
          <Crosshair size={21} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// Unidades de exibição: os valores reais continuam em metros e metros quadrados.
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

function formatMeasurementNumber(value, minimum = 2, maximum = minimum) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: minimum,
    maximumFractionDigits: maximum,
  }).format(value);
}

function formatMeasurement(measurement, units) {
  const rawValue = measurement?.value;
  const value = Number(rawValue);
  if (rawValue == null || !Number.isFinite(value)) return measurement?.text || "";

  if (measurement.type === "polygon") {
    const displayKm2 = units.area === "km2" || (units.area === "auto" && value >= 1_000_000);
    return displayKm2
      ? `${formatMeasurementNumber(value / 1_000_000, 2, 8)} km²`
      : `${formatMeasurementNumber(value, 2)} m²`;
  }

  if (measurement.type === "polyline") {
    const displayKm = units.distance === "km" || (units.distance === "auto" && value >= 1_000);
    return displayKm
      ? `${formatMeasurementNumber(value / 1_000, 2, 5)} km`
      : `${formatMeasurementNumber(value, 2)} m`;
  }

  return measurement?.text || "";
}

function MapToolsBridge({
  searchLocation,
  mapToolsRef,
  drawLayerRef,
  printTools,
}) {
  const map = useMap();
  const activeDrawerRef = useRef(null);
  const [measurementUnits, setMeasurementUnits] = useState(loadMeasurementUnits);

  
  const getMeasurements = useCallback(() => {
    const layers = drawLayerRef.current?.getLayers() || [];

    return layers
      .filter((layer) => layer._sobralMeasurement)
      .map((layer) => ({
        id: L.stamp(layer),
        ...layer._sobralMeasurement,
        text: formatMeasurement(layer._sobralMeasurement, measurementUnits),
      }));
  }, [drawLayerRef, measurementUnits]);

  const publishMeasurements = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("sobral-measurements-changed", {
        detail: getMeasurements(),
      })
    );
  }, [getMeasurements]);

  // Atualiza etiquetas e lista imediatamente após trocar a unidade.
  useEffect(() => {
    drawLayerRef.current?.eachLayer((layer) => {
      if (!layer._sobralMeasurement || !layer.getTooltip?.()) return;
      layer.setTooltipContent(formatMeasurement(layer._sobralMeasurement, measurementUnits));
    });
    publishMeasurements();
  }, [drawLayerRef, measurementUnits, publishMeasurements]);

  // Lembra a escolha quando o usuário troca de painel ou atualiza a página.
  useEffect(() => {
    try {
      localStorage.setItem(MEASUREMENT_UNITS_STORAGE_KEY, JSON.stringify(measurementUnits));
    } catch {
      // Preferências são opcionais caso o armazenamento esteja indisponível.
    }
  }, [measurementUnits]);

  useEffect(() => {
    const drawLayer = L.featureGroup();

    drawLayer.addTo(map);
    drawLayerRef.current = drawLayer;

    return () => {
      drawLayer.removeFrom(map);
      drawLayerRef.current = null;
    };
  }, [map, drawLayerRef]);

  useEffect(() => {
    if (!searchLocation) return;

    map.flyTo(
      [searchLocation.lat, searchLocation.lon],
      17,
      {
        duration: 2,
      }
    );
  }, [searchLocation, map]);

  useEffect(() => {
    const handleCreated = (event) => {
      const { layerType, layer } = event;

      if (layerType === "polyline") {
        const measurement = { type: "polyline", value: getPolylineDistance(layer) };
        const text = formatMeasurement(measurement, measurementUnits);

        layer.bindTooltip(text, {
          permanent: true,
          direction: "center",
          className: "measurement-tooltip",
        });

        layer.openTooltip();
        layer._sobralMeasurement = measurement;
      }

      if (layerType === "polygon") {
        const measurement = { type: "polygon", value: getPolygonArea(layer) };
        const text = formatMeasurement(measurement, measurementUnits);

        layer.bindTooltip(text, {
          permanent: true,
          direction: "center",
          className: "measurement-tooltip",
        });

        layer.openTooltip();
        layer._sobralMeasurement = measurement;
      }

      drawLayerRef.current?.addLayer(layer);
      publishMeasurements();

      activeDrawerRef.current = null;
      map.doubleClickZoom.enable();
    };

    map.on(
      L.Draw.Event.CREATED,
      handleCreated
    );

    return () => {
      map.off(
        L.Draw.Event.CREATED,
        handleCreated
      );
    };
  }, [map, drawLayerRef, publishMeasurements, measurementUnits]);

  useEffect(() => {
    const startDrawer = (drawer) => {
      if (activeDrawerRef.current) {
        activeDrawerRef.current.disable();
      }

      map.doubleClickZoom.disable();

      activeDrawerRef.current = drawer;
      drawer.enable();
    };

    if (!mapToolsRef) {
      return undefined;
    }

    mapToolsRef.current = {
      zoomIn: () => {
        map.zoomIn();
      },

      zoomOut: () => {
        map.zoomOut();
      },

      // Retorna a lista atual ao abrir novamente a aba Medição.
      getMeasurements,

      // Não recalcula geometria: apenas modifica a unidade exibida.
      setMeasurementUnits: (changes) => {
        setMeasurementUnits((previous) => {
          const next = {
            area: ["auto", "m2", "km2"].includes(changes?.area) ? changes.area : previous.area,
            distance: ["auto", "m", "km"].includes(changes?.distance) ? changes.distance : previous.distance,
          };
          return next.area === previous.area && next.distance === previous.distance ? previous : next;
        });
      },

      // Remove somente a medição escolhida pelo identificador do Leaflet.
      deleteMeasurement: (id) => {
        const group = drawLayerRef.current;
        if (!group) return;

        const layer = group.getLayer(Number(id));
        if (!layer?._sobralMeasurement) return;

        group.removeLayer(layer);
        publishMeasurements();
      },

      clearDrawings: () => {
        drawLayerRef.current?.clearLayers();
        publishMeasurements();

        if (activeDrawerRef.current) {
          activeDrawerRef.current.disable();
          activeDrawerRef.current = null;
        }

        map.doubleClickZoom.enable();
      },

      measureLine: (options) => {
        const color = options?.color || "#2563eb";
        const weight = options?.width || 4;
        const style = options?.style || "solid";
        const opacity = options?.opacity ?? 1;

        let dashArray = null;
        if (style === "dashed") dashArray = "15, 10";
        if (style === "dotted") dashArray = "3, 8";

        const drawer = new L.Draw.Polyline(map, {
          shapeOptions: {
            color: color,
            weight: weight,
            opacity: opacity, 
            dashArray: dashArray,
          },
          metric: true,
          feet: false,
          nautic: false,
        });

        startDrawer(drawer);
      },

      measureArea: (options) => {
        configureLeafletDrawPtBr();

        const color = options?.color || "#2563eb";
        const weight = options?.width || 3;
        const style = options?.style || "solid";
        const opacity = options?.opacity ?? 1;
        const fillOpacity = options?.fillOpacity ?? 0.18;

        let dashArray = null;
        if (style === "dashed") dashArray = "15, 10";
        if (style === "dotted") dashArray = "3, 8";

        const drawer = new L.Draw.Polygon(map, {
          shapeOptions: {
            color: color,
            weight: weight,
            opacity: opacity,
            dashArray: dashArray,
            fillColor: color,
            fillOpacity: fillOpacity,
          },

          allowIntersection: true,
          showArea: false,
          metric: true,
          feet: false,
          nautic: false,
          guidelineDistance: 12,
          zIndexOffset: 2000,
          repeatMode: false,
        });

        startDrawer(drawer);
      },

      enablePrintSelection:
        printTools.enablePrintSelection,

      disablePrintSelection:
        printTools.disablePrintSelection,

      setPrintFormat:
        printTools.setPrintFormat,

      exportPrintSelection:
        printTools.exportPrintSelection,
    };

    return () => {
      mapToolsRef.current = null;
    };
  }, [
    map,
    mapToolsRef,
    drawLayerRef,
    printTools,
    getMeasurements,
    publishMeasurements,
  ]);

  return null;
}

function MapZoomControls() {
  const map = useMap();

  return (
    <div
      data-tour="map-zoom-controls"
      data-map-export-ignore="true"
      className="
        absolute
        top-4
        right-4
        z-[1000]
        flex
        flex-col
        rounded-2xl
        overflow-hidden
        shadow-xl
        border
        border-slate-200
        bg-white
      "
      onMouseDown={(event) =>
        event.stopPropagation()
      }
      onDoubleClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          map.zoomIn();
        }}
        className="
          h-11
          w-11
          flex
          items-center
          justify-center
          text-xl
          font-black
          text-slate-700
          hover:bg-blue-50
          hover:text-blue-700
          transition
          border-b
          border-slate-200
        "
        title="Aumentar zoom"
      >
        +
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          map.zoomOut();
        }}
        className="
          h-11
          w-11
          flex
          items-center
          justify-center
          text-2xl
          font-black
          text-slate-700
          hover:bg-blue-50
          hover:text-blue-700
          transition
        "
        title="Diminuir zoom"
      >
        −
      </button>
    </div>
  );
}

function getPolylineDistance(layer) {
  const latLngs = layer.getLatLngs();

  if (!latLngs || latLngs.length < 2) {
    return 0;
  }

  let distance = 0;

  for (let index = 1; index < latLngs.length; index++) {
    distance += latLngs[index - 1].distanceTo(
      latLngs[index]
    );
  }

  return distance;
}

function getPolygonArea(layer) {
  const latLngs = layer.getLatLngs();

  if (!latLngs || !latLngs.length) {
    return 0;
  }

  const mainRing = Array.isArray(latLngs[0])
    ? latLngs[0]
    : latLngs;

  return L.GeometryUtil.geodesicArea(mainRing);
}

function getCurrentTimestampFilename() {
  return getFormattedLocalDateTime("sobral-em-mapas");
}


// Função auxiliar universal que pega o horário local
function getFormattedLocalDateTime(prefix, dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${prefix}-${year}-${month}-${day}-${hours}-${minutes}`;
}

function exportCanvasAsImage(canvas, format) {
  return new Promise((resolve, reject) => {
    const isJpeg = format === "jpeg";
    const outputCanvas = document.createElement("canvas");

    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const context = outputCanvas.getContext("2d");

    if (isJpeg) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    }

    context.drawImage(canvas, 0, 0);

    const mimeType = isJpeg ? "image/jpeg" : "image/png";
    const extension = isJpeg ? "jpg" : "png";
    const filename = getCurrentTimestampFilename(); 

    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem."));
          return;
        }
        downloadBlob(blob, `${filename}.${extension}`);
        resolve();
      },
      mimeType,
      isJpeg ? 0.95 : undefined
    );
  });
}

function exportCanvasAsPdf(canvas) {
  const imageData = canvas.toDataURL("image/jpeg", 0.95);
  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const imageRatio = canvas.width / canvas.height;

  let imageWidth = maxWidth;
  let imageHeight = imageWidth / imageRatio;

  if (imageHeight > maxHeight) {
    imageHeight = maxHeight;
    imageWidth = imageHeight * imageRatio;
  }

  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;

  pdf.addImage(imageData, "JPEG", x, y, imageWidth, imageHeight);
  
  const filename = getCurrentTimestampFilename(); // 
  pdf.save(`${filename}.pdf`);
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 500);
}

function normalizePrintSelection(selection) {
  return {
    x: Number(selection?.x) || 460,
    y: Number(selection?.y) || 130,
    width: Number(selection?.width) || 560,
    height: Number(selection?.height) || 360,
  };
}

function dispatchPrintHistoryEvent({
  format,
  selection,
  activeLayers = [],
  canvas,
}) {
  const imageDataUrl =
    canvasToHistoryDataUrl(canvas);

  const item = {
    id:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

    createdAt: new Date().toISOString(),

    format,

    selection: {
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
    },

    imageDataUrl,
    imageMimeType: "image/jpeg",

    outputWidth: canvas?.width || 0,
    outputHeight: canvas?.height || 0,

    layers: activeLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
    })),
  };

  window.dispatchEvent(
    new CustomEvent("sobral-map-print-exported", {
      detail: item,
    })
  );
}

function canvasToHistoryDataUrl(canvas) {
  if (!canvas) {
    return "";
  }

  const outputCanvas =
    document.createElement("canvas");

  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;

  const context =
    outputCanvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(
    0,
    0,
    outputCanvas.width,
    outputCanvas.height
  );

  context.drawImage(canvas, 0, 0);

  return outputCanvas.toDataURL(
    "image/jpeg",
    0.82
  );
}

function configureLeafletDrawPtBr() {
  if (!L.drawLocal) return;

  L.drawLocal.draw.toolbar.actions.title =
    "Cancelar desenho";
  L.drawLocal.draw.toolbar.actions.text =
    "Cancelar";

  L.drawLocal.draw.toolbar.finish.title =
    "Finalizar desenho";
  L.drawLocal.draw.toolbar.finish.text =
    "Finalizar";

  L.drawLocal.draw.toolbar.undo.title =
    "Remover último ponto";
  L.drawLocal.draw.toolbar.undo.text =
    "Remover último ponto";

  L.drawLocal.draw.toolbar.buttons.polyline =
    "Medir distância";
  L.drawLocal.draw.toolbar.buttons.polygon =
    "Medir área";

  L.drawLocal.draw.handlers.polyline.tooltip.start =
    "Clique no mapa para iniciar a medição.";
  L.drawLocal.draw.handlers.polyline.tooltip.cont =
    "Clique para continuar a linha.";
  L.drawLocal.draw.handlers.polyline.tooltip.end =
    "Clique no último ponto para finalizar.";

  L.drawLocal.draw.handlers.polygon.tooltip.start =
    "Clique no mapa para iniciar a área.";
  L.drawLocal.draw.handlers.polygon.tooltip.cont =
    "Clique para adicionar mais pontos.";
  L.drawLocal.draw.handlers.polygon.tooltip.end =
    "Clique no primeiro ponto para fechar a área.";
}