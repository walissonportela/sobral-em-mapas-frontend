import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import {
  Check, Circle, Droplet, Eraser, Expand, Eye, Hand, Info, Layers,
  List, LocateFixed, MapPin, Minus, Palette, Paintbrush, Pencil,
  Pentagon, RectangleHorizontal, RotateCcw, Scaling, Settings2,
  Shrink, Trash2, Undo2, X,
} from "lucide-react";

const SOBRAL_CENTER = [-3.6892, -40.3489];
const PALETTE = [
  "#2563eb", "#0ea5e9", "#06b6d4", "#0d9488",
  "#16a34a", "#84cc16", "#eab308", "#f97316",
  "#dc2626", "#e11d48", "#a855f7", "#7c3aed",
  "#a16207", "#64748b", "#111827", "#ffffff",
];
const INITIAL_STYLE = {
  color: "#2563eb", weight: 3, lineOpacity: 100,
  fillOpacity: 18, lineStyle: "solid", markerSize: 18,
};
const BUTTON = "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

const limit = (value, min, max, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(min, Math.min(max, num)) : fallback;
};

function safeStyle(source = {}) {
  return {
    color: /^#[0-9a-f]{6}$/i.test(source.color || "") ? source.color : INITIAL_STYLE.color,
    weight: limit(source.weight, 1, 20, 3),
    lineOpacity: limit(source.lineOpacity, 10, 100, 100),
    fillOpacity: limit(source.fillOpacity, 0, 100, 18),
    lineStyle: ["solid", "dashed", "dotted"].includes(source.lineStyle) ? source.lineStyle : "solid",
    markerSize: limit(source.markerSize, 10, 36, 18),
  };
}

function savedStyle(style) {
  const s = safeStyle(style);
  return {
    cor: s.color,
    espessura: s.weight,
    opacidade_linha: s.lineOpacity / 100,
    opacidade_preenchimento: s.fillOpacity / 100,
    tipo_linha: s.lineStyle,
    tamanho_ponto: s.markerSize,
  };
}

function vectorStyle(style) {
  const s = safeStyle(style);
  return {
    color: s.color,
    weight: s.weight,
    opacity: s.lineOpacity / 100,
    fillColor: s.color,
    fillOpacity: s.fillOpacity / 100,
    dashArray: s.lineStyle === "dashed" ? "10,8" : s.lineStyle === "dotted" ? "2,8" : null,
    lineCap: "round",
  };
}

function dotIcon(style) {
  const s = safeStyle(style);
  const size = s.markerSize;
  return L.divIcon({
    className: "sobral-editor-point",
    html: `<span style="display:block;box-sizing:border-box;width:${size}px;height:${size}px;background:${s.color};opacity:${s.lineOpacity / 100};border:2px solid white;border-radius:50%;box-shadow:0 1px 7px #0007"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function applyAppearance(layer, appearance) {
  if (layer instanceof L.Marker) layer.setIcon(dotIcon(appearance));
  else if (typeof layer.setStyle === "function") layer.setStyle(vectorStyle(appearance));
  if (!layer.feature) layer.feature = { type: "Feature", properties: {} };
  if (!layer.feature.properties) layer.feature.properties = {};
  layer.feature.properties.estilo = savedStyle(appearance);
}

function typeLabel(item) {
  if (item.shape === "rectangle") return "Retângulo";
  if (item.shape === "circle") return "Círculo";
  return { Point: "Ponto", LineString: "Linha", Polygon: "Polígono" }[item.geometry] || item.geometry;
}

function metricForLayer(layer) {
  try {
    if (layer instanceof L.Polygon) {
      const ring = layer.getLatLngs()[0];
      const area = L.GeometryUtil.geodesicArea(ring);
      return area < 1000000
        ? `${area.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`
        : `${(area / 1000000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km²`;
    }
    if (layer instanceof L.Polyline) {
      const coords = layer.getLatLngs();
      let meters = 0;
      for (let i = 1; i < coords.length; i += 1) meters += coords[i - 1].distanceTo(coords[i]);
      return meters < 1000
        ? `${meters.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m`
        : `${(meters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
    }
  } catch (error) {
    console.warn("Não foi possível calcular a medida da feição:", error);
  }
  return "";
}

// O GeoJSON não tem geometria nativa de círculo. Converte o círculo desenhado
// em um polígono aproximado, que poderá ser armazenado e editado normalmente.
function circleAsPolygon(circle, appearance) {
  const center = circle.getLatLng();
  const radius = circle.getRadius();
  const earth = 6378137;
  const latitudeRad = (center.lat * Math.PI) / 180;
  const steps = 64;
  const vertices = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i * 2 * Math.PI) / steps;
    const latitude = center.lat + (radius / earth) * Math.cos(angle) * 180 / Math.PI;
    const longitude = center.lng + (radius / (earth * Math.cos(latitudeRad))) * Math.sin(angle) * 180 / Math.PI;
    vertices.push([latitude, longitude]);
  }
  return L.polygon(vertices, vectorStyle(appearance));
}

function ToolButton({ label, icon, active, onClick, disabled }) {
  return (
    <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick}
      className={`${BUTTON} w-full ${active ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"}`}>
      {icon} {label}
    </button>
  );
}

function Slider({ id, icon, label, value, min, max, step = 1, suffix, disabled, onChange }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-center gap-2 text-xs font-medium text-slate-600">
        {icon} {label}: <strong className="ml-auto text-slate-800">{value}{suffix}</strong>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        disabled={disabled} onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-blue-600 disabled:opacity-40" />
    </div>
  );
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const element = map.getContainer().parentElement;
    let frame = null;
    const update = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(element);
    window.addEventListener("resize", update);
    update();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [map]);
  return null;
}

/**
 * Mantém UMA instância do Leaflet: os traçados ficam em rascunho até que
 * o usuário os conclua. Não usa conclusão implícita do Leaflet Draw para
 * polígonos/linhas nem depende do drag handler do Leaflet Draw para formas.
 * O Leaflet Draw continua responsável pela edição de vértices existentes.
 */
function DrawingBridge({ command, appearance, featureName, groupRef, actionsRef, onChanged, onDone, onProgress, onError }) {
  const map = useMap();
  const editorRef = useRef(null);
  const nextNameRef = useRef(featureName);
  const appearanceRef = useRef(appearance);
  const commandRef = useRef(command.kind);
  const changedRef = useRef(onChanged);
  const doneRef = useRef(onDone);
  const progressRef = useRef(onProgress);
  const errorRef = useRef(onError);

  useEffect(() => {
    nextNameRef.current = featureName;
    appearanceRef.current = appearance;
    commandRef.current = command.kind;
    changedRef.current = onChanged;
    doneRef.current = onDone;
    progressRef.current = onProgress;
    errorRef.current = onError;
  }, [featureName, appearance, command.kind, onChanged, onDone, onProgress, onError]);

  useEffect(() => {
    const group = L.featureGroup().addTo(map);
    groupRef.current = group;

    const handleLayerClick = (layer) => {
      layer.on("click", (event) => {
        if (commandRef.current === "erase") {
          L.DomEvent.stopPropagation(event);
          group.removeLayer(layer);
          changedRef.current();
        } else if (commandRef.current === "paint") {
          L.DomEvent.stopPropagation(event);
          applyAppearance(layer, appearanceRef.current);
          changedRef.current();
        }
      });
    };

    actionsRef.current.addFeature = (layer, shape) => {
      const count = group.getLayers().length + 1;
      const names = {
        point: "Ponto", line: "Linha", polygon: "Polígono",
        rectangle: "Retângulo", circle: "Círculo",
      };
      layer.feature = {
        type: "Feature",
        properties: {
          nome: nextNameRef.current.trim() || `${names[shape] || "Feição"} ${count}`,
          ...(shape === "rectangle" || shape === "circle" ? { forma: shape } : {}),
        },
      };
      applyAppearance(layer, appearanceRef.current);
      handleLayerClick(layer);
      group.addLayer(layer);
      changedRef.current();
      doneRef.current();
    };

    actionsRef.current.fit = () => {
      if (group.getLayers().length) {
        const bounds = group.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), { maxZoom: 17 });
      }
    };
    actionsRef.current.commitEdit = () => editorRef.current?.save?.();

    return () => {
      editorRef.current?.disable();
      editorRef.current = null;
      if (groupRef.current === group) groupRef.current = null;
      actionsRef.current.addFeature = null;
      actionsRef.current.finishShape = null;
      actionsRef.current.undoVertex = null;
      actionsRef.current.fit = null;
      actionsRef.current.commitEdit = null;
      group.removeFrom(map);
    };
  }, [map, groupRef, actionsRef]);

  useEffect(() => {
    // Não reiniciar uma ferramenta quando o nome, cor ou contador mudar.
    const kind = command.kind;
    const actions = actionsRef.current;
    actions.finishShape = null;
    actions.undoVertex = null;
    editorRef.current?.disable();
    editorRef.current = null;
    if (!kind) return undefined;

    if (kind === "edit") {
      const group = groupRef.current;
      if (!group || !group.getLayers().length) return undefined;
      const edit = new L.EditToolbar.Edit(map, { featureGroup: group });
      editorRef.current = edit;
      edit.enable();
      const onEdited = () => changedRef.current();
      map.on(L.Draw.Event.EDITED, onEdited);
      return () => {
        edit.save();
        edit.disable();
        map.off(L.Draw.Event.EDITED, onEdited);
        if (editorRef.current === edit) editorRef.current = null;
      };
    }

    if (kind === "erase" || kind === "paint") return undefined;

    const wasDragging = map.dragging.enabled();
    const wasDoubleClick = map.doubleClickZoom.enabled();
    // Desativar interações conflitantes durante cada ferramenta.
    if (wasDoubleClick) map.doubleClickZoom.disable();

    if (kind === "point" || kind === "line" || kind === "polygon") {
      const vertices = [];
      let sketch = null;
      let previewPoint = null;

      const redraw = () => {
        progressRef.current(vertices.length);
        if (kind === "point") return;
        if (sketch) map.removeLayer(sketch);
        sketch = null;
        if (!vertices.length) return;
        const coords = previewPoint ? [...vertices, previewPoint] : vertices;
        // A linha permanece aberta até o comando explícito "Concluir".
        sketch = L.polyline(coords, {
          ...vectorStyle(appearanceRef.current),
          interactive: false,
          bubblingMouseEvents: false,
        }).addTo(map);
      };

      const handleClick = (event) => {
        if (kind === "point") {
          actions.addFeature(L.marker(event.latlng, { icon: dotIcon(appearanceRef.current) }), "point");
          return;
        }
        // Alguns navegadores emitem um clique extra em sequência de duplo clique.
        // A conclusão, porém, só acontece pelo botão do formulário.
        vertices.push(event.latlng);
        previewPoint = null;
        redraw();
      };
      const handleMove = (event) => {
        if (!vertices.length || kind === "point") return;
        previewPoint = event.latlng;
        redraw();
      };
      const finish = () => {
        const minimum = kind === "line" ? 2 : 3;
        if (vertices.length < minimum) {
          errorRef.current(`Marque pelo menos ${minimum} pontos antes de concluir.`);
          return;
        }
        const style = vectorStyle(appearanceRef.current);
        const layer = kind === "line"
          ? L.polyline(vertices, style)
          : L.polygon(vertices, style);
        actions.addFeature(layer, kind);
      };
      const undoVertex = () => {
        vertices.pop();
        previewPoint = null;
        redraw();
      };
      actions.finishShape = finish;
      actions.undoVertex = undoVertex;
      map.on("click", handleClick);
      map.on("mousemove", handleMove);
      return () => {
        map.off("click", handleClick);
        map.off("mousemove", handleMove);
        if (sketch) map.removeLayer(sketch);
        sketch = null;
        actions.finishShape = null;
        actions.undoVertex = null;
        if (wasDoubleClick) map.doubleClickZoom.enable();
      };
    }

    if (kind === "rectangle" || kind === "circle") {
      const container = map.getContainer();
      const previousTouchAction = container.style.touchAction;
      const downDragState = map.dragging.enabled();
      if (downDragState) map.dragging.disable();
      container.style.touchAction = "none";
      let starting = null;
      let pointerId = null;
      let preview = null;
      let originPoint = null;

      const convert = (event) => map.mouseEventToLatLng(event);
      const isControl = (event) => event.target instanceof Element &&
        Boolean(event.target.closest(".leaflet-control-container, button, a, input"));
      const drawPreview = (destination) => {
        if (!starting) return;
        const style = { ...vectorStyle(appearanceRef.current), interactive: false };
        if (!preview) {
          preview = kind === "rectangle"
            ? L.rectangle(L.latLngBounds(starting, destination), style).addTo(map)
            : L.circle(starting, { ...style, radius: Math.max(1, starting.distanceTo(destination)) }).addTo(map);
        } else if (kind === "rectangle") {
          preview.setBounds(L.latLngBounds(starting, destination));
        } else {
          preview.setRadius(Math.max(1, starting.distanceTo(destination)));
        }
      };
      const onDown = (event) => {
        if (event.button !== 0 || isControl(event) || pointerId !== null) return;
        pointerId = event.pointerId;
        starting = convert(event);
        originPoint = { x: event.clientX, y: event.clientY };
        container.setPointerCapture?.(pointerId);
        event.preventDefault();
        event.stopPropagation();
      };
      const onMove = (event) => {
        if (event.pointerId !== pointerId || !starting) return;
        drawPreview(convert(event));
        event.preventDefault();
      };
      const onUp = (event) => {
        if (event.pointerId !== pointerId || !starting) return;
        const distancePx = Math.hypot(event.clientX - originPoint.x, event.clientY - originPoint.y);
        const end = convert(event);
        if (container.hasPointerCapture?.(pointerId)) container.releasePointerCapture(pointerId);
        pointerId = null;
        if (preview) { map.removeLayer(preview); preview = null; }
        const begin = starting;
        starting = null;
        originPoint = null;
        event.preventDefault();
        event.stopPropagation();
        if (distancePx < 6 || begin.distanceTo(end) < 1) {
          errorRef.current("Clique, mantenha pressionado e arraste para desenhar a forma.");
          return;
        }
        if (kind === "rectangle") {
          actions.addFeature(L.rectangle(L.latLngBounds(begin, end), vectorStyle(appearanceRef.current)), "rectangle");
        } else {
          const radius = begin.distanceTo(end);
          const circle = L.circle(begin, { radius });
          actions.addFeature(circleAsPolygon(circle, appearanceRef.current), "circle");
        }
      };
      const onCancel = (event) => {
        if (event.pointerId !== pointerId) return;
        if (container.hasPointerCapture?.(pointerId)) container.releasePointerCapture(pointerId);
        pointerId = null;
        starting = null;
        if (preview) { map.removeLayer(preview); preview = null; }
      };
      container.addEventListener("pointerdown", onDown, true);
      container.addEventListener("pointermove", onMove, true);
      container.addEventListener("pointerup", onUp, true);
      container.addEventListener("pointercancel", onCancel, true);
      return () => {
        container.removeEventListener("pointerdown", onDown, true);
        container.removeEventListener("pointermove", onMove, true);
        container.removeEventListener("pointerup", onUp, true);
        container.removeEventListener("pointercancel", onCancel, true);
        if (pointerId !== null && container.hasPointerCapture?.(pointerId)) container.releasePointerCapture(pointerId);
        if (preview) map.removeLayer(preview);
        container.style.touchAction = previousTouchAction;
        if (downDragState) map.dragging.enable();
        if (wasDoubleClick) map.doubleClickZoom.enable();
      };
    }

    if (wasDoubleClick) map.doubleClickZoom.enable();
    if (wasDragging) map.dragging.enable();
    return undefined;
  }, [map, command, groupRef, actionsRef]);

  return null;
}

/** Editor independente do painel Medição e do Map.jsx. */
export default function GeoJSONDrawingEditor({ onSave, onCancel, saving = false }) {
  const groupRef = useRef(null);
  const actionsRef = useRef({ fit: null, commitEdit: null, addFeature: null, finishShape: null, undoVertex: null });
  const [expanded, setExpanded] = useState(false);
  const [command, setCommand] = useState({ kind: null, serial: 0 });
  const [featureName, setFeatureName] = useState("");
  const [appearance, setAppearance] = useState(INITIAL_STYLE);
  const [features, setFeatures] = useState([]);
  const [sketchCount, setSketchCount] = useState(0);
  const [error, setError] = useState("");
  const onDrawingError = useCallback((message) => setError(message), []);

  const syncFeatures = useCallback(() => {
    const group = groupRef.current;
    if (!group) return;
    setFeatures(group.getLayers().map((layer) => {
      const geo = layer.toGeoJSON();
      return {
        id: L.stamp(layer),
        name: layer.feature?.properties?.nome || "Sem nome",
        geometry: geo.geometry?.type || "Geometria",
        shape: layer.feature?.properties?.forma,
        color: layer.feature?.properties?.estilo?.cor || INITIAL_STYLE.color,
        measure: metricForLayer(layer),
      };
    }));
  }, []);

  const stopTool = useCallback(() => {
    setSketchCount(0);
    setCommand((previous) => ({ kind: null, serial: previous.serial + 1 }));
  }, []);

  const chooseTool = (kind) => {
    if (saving) return;
    setSketchCount(0);
    actionsRef.current.commitEdit?.();
    setError("");
    setCommand((previous) => ({ kind, serial: previous.serial + 1 }));
  };

  const getLayer = (id) => groupRef.current?.getLayers().find((layer) => L.stamp(layer) === id);

  const deleteOne = (id) => {
    if (saving) return;
    actionsRef.current.commitEdit?.();
    stopTool();
    const layer = getLayer(id);
    if (layer) groupRef.current.removeLayer(layer);
    syncFeatures();
  };

  const renameOne = (id, value) => {
    if (saving) return;
    const layer = getLayer(id);
    if (!layer) return;
    layer.feature.properties.nome = value;
    syncFeatures();
  };

  const undoLast = () => {
    actionsRef.current.commitEdit?.();
    stopTool();
    const group = groupRef.current;
    const items = group?.getLayers() || [];
    if (items.length) group.removeLayer(items[items.length - 1]);
    syncFeatures();
    setError("");
  };

  const clearAll = () => {
    actionsRef.current.commitEdit?.();
    stopTool();
    groupRef.current?.clearLayers();
    syncFeatures();
    setError("");
  };

  const saveDrawing = () => {
    actionsRef.current.commitEdit?.();
    const content = groupRef.current?.toGeoJSON();
    if (!content?.features?.length) {
      setError("Adicione pelo menos uma feição antes de continuar.");
      return;
    }
    stopTool();
    setError("");
    onSave?.(content);
  };

  // O editor permanece no mesmo portal DOM ao alternar tamanhos; mapa e desenhos não são remontados.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (saving) return;
      if (command.kind) stopTool();
      else if (expanded) setExpanded(false);
      else onCancel?.();
    };
    document.addEventListener("keydown", onEscape, true);
    return () => document.removeEventListener("keydown", onEscape, true);
  }, [saving, expanded, command.kind, onCancel, stopTool]);

  const instructions = {
    point: "Clique no mapa para adicionar um ponto.",
    line: "Clique para adicionar vértices e pressione Concluir linha.",
    polygon: "Clique para adicionar quantos vértices desejar e pressione Concluir polígono.",
    rectangle: "Pressione o mouse no mapa, arraste e solte para criar um retângulo.",
    circle: "Pressione no centro, arraste para definir o raio e solte o mouse.",
    edit: "Arraste vértices ou pontos; clique em Concluir edição quando terminar.",
    erase: "Clique sobre uma feição para removê-la.",
    paint: "Clique sobre uma feição para aplicar o estilo selecionado.",
  };

  const panel = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/65 p-0 md:p-3" role="presentation">
      <section role="dialog" aria-modal="true" aria-label="Editor de desenho de camadas GeoJSON"
        className={`flex min-h-0 flex-col overflow-hidden bg-white shadow-2xl ${expanded ? "h-[100dvh] w-screen rounded-none" : "h-[100dvh] w-screen rounded-none md:h-[min(94dvh,860px)] md:w-[min(96vw,1250px)] md:rounded-2xl"}`}>
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-800"><Layers size={19} className="text-blue-700" /> Editor de camadas GeoJSON</h2>
            <p className="text-xs text-slate-500">Desenhe, configure a aparência e organize suas feições.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setExpanded((old) => !old)} disabled={saving}
              className={`${BUTTON} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
              {expanded ? <Shrink size={17}/> : <Expand size={17}/>} {expanded ? "Reduzir" : "Tela cheia"}
            </button>
            <button type="button" onClick={onCancel} disabled={saving} aria-label="Fechar editor"
              className={`${BUTTON} border-slate-200 bg-white text-slate-600 hover:bg-slate-100`}><X size={17}/></button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:flex-row lg:gap-3 lg:p-3">
          <aside aria-label="Ferramentas do editor"
            className="max-h-[38dvh] shrink-0 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 lg:max-h-none lg:w-[330px] lg:shrink-0">
            <div>
              <label htmlFor="geojson-draw-name" className="mb-1.5 block text-xs font-bold text-slate-700">Nome da próxima feição</label>
              <input id="geojson-draw-name" type="text" maxLength={120} value={featureName}
                onChange={(event) => setFeatureName(event.target.value)} disabled={saving}
                placeholder="Ex.: Praça Central, Área Verde..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>

            <section className="space-y-2" aria-label="Ferramentas de desenho">
              <h3 className="text-xs font-black text-slate-700">Desenhar</h3>
              <div className="grid grid-cols-2 gap-2">
                <ToolButton label="Ponto" icon={<MapPin size={16}/>} active={command.kind === "point"} disabled={saving} onClick={() => chooseTool("point")}/>
                <ToolButton label="Linha" icon={<Minus size={16}/>} active={command.kind === "line"} disabled={saving} onClick={() => chooseTool("line")}/>
                <ToolButton label="Polígono" icon={<Pentagon size={16}/>} active={command.kind === "polygon"} disabled={saving} onClick={() => chooseTool("polygon")}/>
                <ToolButton label="Retângulo" icon={<RectangleHorizontal size={16}/>} active={command.kind === "rectangle"} disabled={saving} onClick={() => chooseTool("rectangle")}/>
                <ToolButton label="Círculo" icon={<Circle size={16}/>} active={command.kind === "circle"} disabled={saving} onClick={() => chooseTool("circle")}/>
                <ToolButton label="Navegar" icon={<Hand size={16}/>} active={!command.kind} disabled={saving} onClick={stopTool}/>
              </div>
            </section>

            {(command.kind === "line" || command.kind === "polygon") && (
              <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-800">
                  {sketchCount} {sketchCount === 1 ? "vértice marcado" : "vértices marcados"}.
                  {command.kind === "polygon" ? " Mínimo: 3." : " Mínimo: 2."}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => actionsRef.current.undoVertex?.()} disabled={sketchCount === 0}
                    className={`${BUTTON} border-blue-200 bg-white text-blue-700 hover:bg-blue-100`}>
                    <Undo2 size={15}/> Desfazer vértice
                  </button>
                  <button type="button" onClick={() => actionsRef.current.finishShape?.()}
                    disabled={sketchCount < (command.kind === "polygon" ? 3 : 2)}
                    className={`${BUTTON} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`}>
                    <Check size={15}/> Concluir {command.kind === "polygon" ? "polígono" : "linha"}
                  </button>
                </div>
              </div>
            )}

            <section className="space-y-2" aria-label="Ferramentas para modificar desenhos">
              <h3 className="text-xs font-black text-slate-700">Modificar desenhos</h3>
              <div className="grid grid-cols-2 gap-2">
                <ToolButton label="Editar vértices" icon={<Pencil size={16}/>} active={command.kind === "edit"} disabled={saving || features.length === 0} onClick={() => chooseTool("edit")}/>
                <ToolButton label="Excluir no mapa" icon={<Eraser size={16}/>} active={command.kind === "erase"} disabled={saving || features.length === 0} onClick={() => chooseTool("erase")}/>
                <ToolButton label="Aplicar estilo" icon={<Paintbrush size={16}/>} active={command.kind === "paint"} disabled={saving || features.length === 0} onClick={() => chooseTool("paint")}/>
              </div>
              {command.kind === "edit" && (
                <button type="button" onClick={() => { actionsRef.current.commitEdit?.(); stopTool(); syncFeatures(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">
                  <Check size={16}/> Concluir edição
                </button>
              )}
            </section>

            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3" aria-label="Aparência dos desenhos">
              <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-700">
                <Settings2 size={17} className="text-slate-500"/> Aparência
              </h3>
              <div className="grid grid-cols-8 gap-1.5" aria-label="Paleta de cores">
                {PALETTE.map((color) => (
                  <button key={color} type="button" disabled={saving} title={color}
                    aria-label={`Selecionar cor ${color}`} aria-pressed={appearance.color === color}
                    onClick={() => setAppearance((before) => ({ ...before, color }))}
                    style={{ backgroundColor: color }}
                    className={`aspect-square min-h-6 rounded-md border-2 hover:scale-105 ${appearance.color === color ? "border-slate-800 ring-2 ring-blue-300" : "border-slate-200"}`} />
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="geojson-custom-color" className="flex items-center gap-2 text-xs font-medium text-slate-600"><Palette size={16}/> Cor personalizada</label>
                <input id="geojson-custom-color" type="color" value={appearance.color} disabled={saving}
                  onChange={(e) => setAppearance((old) => ({ ...old, color: e.target.value }))}
                  className="h-9 w-16 cursor-pointer rounded border-0 bg-transparent" />
              </div>
              <Slider id="geojson-line-weight" icon={<Scaling size={15}/>} label="Espessura" value={appearance.weight} min={1} max={20} suffix="px" disabled={saving}
                onChange={(weight) => setAppearance((old) => ({ ...old, weight }))} />
              <Slider id="geojson-line-opacity" icon={<Eye size={15}/>} label="Opacidade do traço" value={appearance.lineOpacity} min={10} max={100} step={10} suffix="%" disabled={saving}
                onChange={(lineOpacity) => setAppearance((old) => ({ ...old, lineOpacity }))} />
              <Slider id="geojson-fill-opacity" icon={<Droplet size={15}/>} label="Preenchimento" value={appearance.fillOpacity} min={0} max={100} step={5} suffix="%" disabled={saving}
                onChange={(fillOpacity) => setAppearance((old) => ({ ...old, fillOpacity }))} />
              <div className="space-y-1">
                <label htmlFor="geojson-line-style" className="text-xs font-medium text-slate-600">Estilo do traço</label>
                <select id="geojson-line-style" value={appearance.lineStyle} disabled={saving}
                  onChange={(e) => setAppearance((old) => ({ ...old, lineStyle: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
                  <option value="solid">Contínua</option>
                  <option value="dashed">Tracejada</option>
                  <option value="dotted">Pontilhada</option>
                </select>
              </div>
              <Slider id="geojson-marker-size" icon={<MapPin size={15}/>} label="Tamanho do ponto" value={appearance.markerSize} min={10} max={36} step={2} suffix="px" disabled={saving}
                onChange={(markerSize) => setAppearance((old) => ({ ...old, markerSize }))} />
              <p className="text-[11px] leading-relaxed text-slate-500">As opções são aplicadas ao próximo desenho. Para atualizar um já criado, selecione “Aplicar estilo” e clique nele.</p>
            </section>

            <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3" aria-label="Lista de desenhos">
              <h3 className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700"><span className="flex items-center gap-2"><List size={16}/> Itens desenhados</span><span className="rounded-full bg-slate-100 px-2 py-0.5">{features.length}</span></h3>
              {features.length === 0 ? <p className="text-xs text-slate-500">Nenhum desenho adicionado.</p> : (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {features.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                      <span className="h-3 w-3 shrink-0 rounded-full border border-slate-300" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{typeLabel(item)} {item.measure ? `· ${item.measure}` : ""}</p>
                        <input aria-label={`Nome da feição ${item.id}`} value={item.name} disabled={saving}
                          onChange={(event) => renameOne(item.id, event.target.value)}
                          className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-semibold text-slate-800 focus:border-blue-300 focus:bg-white" />
                      </div>
                      <button type="button" onClick={() => deleteOne(item.id)} disabled={saving} title="Excluir este desenho"
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-xl border border-slate-200" aria-label="Mapa de desenho">
            <MapContainer center={SOBRAL_CENTER} zoom={13} scrollWheelZoom zoomControl className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
              <DrawingBridge command={command} appearance={appearance} featureName={featureName}
                groupRef={groupRef} actionsRef={actionsRef} onChanged={syncFeatures} onDone={stopTool}
                onProgress={setSketchCount} onError={onDrawingError} />
              <ResizeMap />
            </MapContainer>
            <button type="button" onClick={() => actionsRef.current.fit?.()} disabled={!features.length}
              className="absolute right-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-lg hover:bg-slate-50 disabled:opacity-50">
              <LocateFixed size={15}/> Ver desenhos
            </button>
          </div>
        </div>

        <footer className="shrink-0 space-y-2 border-t border-slate-100 bg-white px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <p className="flex items-center gap-2"><Info size={15}/> {instructions[command.kind] || "Escolha uma ferramenta para começar a desenhar."}</p>
            <strong>{features.length} {features.length === 1 ? "feição" : "feições"}</strong>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving || !features.length} onClick={undoLast}
                className={`${BUTTON} border-slate-200 text-slate-700 hover:bg-slate-100`}><Undo2 size={15}/> Desfazer última</button>
              <button type="button" disabled={saving || !features.length} onClick={clearAll}
                className={`${BUTTON} border-red-200 text-red-600 hover:bg-red-50`}><RotateCcw size={15}/> Limpar tudo</button>
            </div>
            <button type="button" onClick={saveDrawing} disabled={saving || !features.length}
              className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-40">
              <Check size={17}/> {saving ? "Enviando..." : "Usar desenho nesta camada"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );

  return createPortal(panel, document.body);
}
