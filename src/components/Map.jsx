import {
  MapContainer,
  TileLayer,
  GeoJSON,
  WMSTileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import html2canvas from "html2canvas";
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

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api";

export default function Map({
  activeLayers = [],
  searchLocation,
  mapToolsRef,
}) {

  const [sobralGeoJson, setSobralGeoJson] =
    useState(null);

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

        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          foreignObjectRendering: false,

          ignoreElements: (element) => {
            return Boolean(
              element.closest?.(
                "[data-print-overlay='true']"
              ) ||
                element.closest?.(
                  "[data-map-export-ignore='true']"
                ) ||
                element.closest?.(
                  ".leaflet-control-container"
                )
            );
          },

          onclone: (clonedDocument) => {
            clonedDocument
              .querySelectorAll(
                [
                  "[data-print-overlay='true']",
                  "[data-map-export-ignore='true']",
                  ".leaflet-control-container",
                ].join(",")
              )
              .forEach((element) => {
                element.remove();
              });
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

        <MapZoomControls />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          crossOrigin="anonymous"
        />

        {activeLayers.map((layer) => {
        

          return (
            <WMSTileLayer
              key={layer.id}
              url={`${API_BASE_URL}/proxy-wms`}
              layers={layer.layer_name}
              transparent={true}
              format="image/png"
              version="1.1.1"
              crossOrigin="anonymous"
              wms_link_id={
                layer.wms_link_id ||
                layer.wmsLink?.id ||
                ""
              }
            />
          );
        })}

        {sobralGeoJson && (
          <GeoJSON
            data={sobralGeoJson}
            style={{
              color: "#ff0000",
              weight: 3,
              fillOpacity: 0,
            }}
          />
        )}
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

function MapToolsBridge({
  searchLocation,
  mapToolsRef,
  drawLayerRef,
  printTools,
}) {
  const map = useMap();
  const activeDrawerRef = useRef(null);

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
        const distance =
          getPolylineDistance(layer);

        const text =
          distance >= 1000
            ? `${(distance / 1000).toFixed(2)} km`
            : `${Math.round(distance)} m`;

        layer.bindTooltip(text, {
          permanent: true,
          direction: "center",
          className: "measurement-tooltip",
        });

        layer.openTooltip();
      }

      if (layerType === "polygon") {
        const area = getPolygonArea(layer);

        const text =
          area >= 1000000
            ? `${(area / 1000000).toFixed(2)} km²`
            : `${area.toFixed(2)} m²`;

        layer.bindTooltip(text, {
          permanent: true,
          direction: "center",
          className: "measurement-tooltip",
        });

        layer.openTooltip();
      }

      drawLayerRef.current?.addLayer(layer);

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
  }, [map, drawLayerRef]);

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

      clearDrawings: () => {
        drawLayerRef.current?.clearLayers();

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

function exportCanvasAsImage(canvas, format) {
  return new Promise((resolve, reject) => {
    const isJpeg = format === "jpeg";

    const outputCanvas =
      document.createElement("canvas");

    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const context =
      outputCanvas.getContext("2d");

    if (isJpeg) {
      context.fillStyle = "#ffffff";
      context.fillRect(
        0,
        0,
        outputCanvas.width,
        outputCanvas.height
      );
    }

    context.drawImage(canvas, 0, 0);

    const mimeType = isJpeg
      ? "image/jpeg"
      : "image/png";

    const extension = isJpeg ? "jpg" : "png";

    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Não foi possível gerar a imagem."
            )
          );
          return;
        }

        downloadBlob(
          blob,
          `sobral-em-mapas.${extension}`
        );

        resolve();
      },
      mimeType,
      isJpeg ? 0.95 : undefined
    );
  });
}

function exportCanvasAsPdf(canvas) {
  const imageData = canvas.toDataURL(
    "image/jpeg",
    0.95
  );

  const orientation =
    canvas.width >= canvas.height
      ? "landscape"
      : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const margin = 10;

  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const imageRatio =
    canvas.width / canvas.height;

  let imageWidth = maxWidth;
  let imageHeight = imageWidth / imageRatio;

  if (imageHeight > maxHeight) {
    imageHeight = maxHeight;
    imageWidth = imageHeight * imageRatio;
  }

  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;

  pdf.addImage(
    imageData,
    "JPEG",
    x,
    y,
    imageWidth,
    imageHeight
  );

  pdf.save("sobral-em-mapas.pdf");
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