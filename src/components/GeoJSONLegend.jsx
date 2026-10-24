import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";

// As mesmas origens usadas pelo LocalGeoJSONLayer.jsx.
const LOCAL_PATH = /^\/geodata\/[A-Za-z0-9_-]+\.geojson$/;
const LARAVEL_PATH = /^\/api\/geodata\/[A-Za-z0-9_-]+\.geojson$/;
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

const DEFAULT_COLOR = "#2563eb";
const DEFAULT_FILL = "#3b82f6";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MAX_ROWS = 10;

function clamp(value, min, max, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function geometryKind(geometry) {
  const type = geometry?.type || "";
  if (type === "Point" || type === "MultiPoint") return "point";
  if (type === "LineString" || type === "MultiLineString") return "line";
  if (type === "Polygon" || type === "MultiPolygon") return "polygon";
  return "other";
}

function readStyle(feature) {
  const saved = feature?.properties?.estilo;
  const data = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const color = HEX_COLOR.test(data.cor || "") ? data.cor.toLowerCase() : DEFAULT_COLOR;
  const hasSavedColor = HEX_COLOR.test(data.cor || "");
  return {
    color,
    fillColor: hasSavedColor ? color : DEFAULT_FILL,
    width: clamp(data.espessura, 1, 20, 2),
    opacity: clamp(data.opacidade_linha, 0, 1, 1),
    fillOpacity: clamp(data.opacidade_preenchimento, 0, 1, 0.12),
    lineType: ["solid", "dashed", "dotted"].includes(data.tipo_linha)
      ? data.tipo_linha
      : "solid",
    pointSize: clamp(data.tamanho_ponto, 10, 36, 18),
  };
}

function legendGroups(geojson) {
  const features = geojson?.type === "FeatureCollection"
    ? geojson.features
    : geojson?.type === "Feature"
      ? [geojson]
      : [];
  if (!Array.isArray(features)) return [];

  const groups = new Map();
  for (const feature of features) {
    if (!feature?.geometry) continue;
    const kind = geometryKind(feature.geometry);
    if (kind === "other") continue;
    const style = readStyle(feature);
    const key = JSON.stringify([kind, ...Object.values(style)]);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      const rawName = feature.properties?.nome || feature.properties?.name || feature.properties?.title;
      groups.set(key, {
        key,
        kind,
        style,
        count: 1,
        name: typeof rawName === "string" ? rawName.trim() : "",
      });
    }
  }
  return Array.from(groups.values());
}

function groupName(group) {
  if (group.count === 1 && group.name) return group.name;
  const names = {
    point: ["Ponto", "Pontos"],
    line: ["Linha", "Linhas"],
    polygon: ["Área", "Áreas"],
  };
  const [single, plural] = names[group.kind] || ["Feição", "Feições"];
  return group.count === 1 ? single : `${plural} (${group.count})`;
}

function dashPattern(lineType) {
  return lineType === "dashed" ? "8 6" : lineType === "dotted" ? "1 5" : undefined;
}

function Symbol({ group }) {
  const { style, kind } = group;
  const stroke = {
    stroke: style.color,
    strokeWidth: Math.min(6, Math.max(1.5, style.width)),
    strokeOpacity: style.opacity,
    strokeDasharray: dashPattern(style.lineType),
    strokeLinecap: "round",
  };

  return (
    <svg width="36" height="32" viewBox="0 0 36 32" aria-hidden="true" className="shrink-0">
      {kind === "polygon" && (
        <rect x="6" y="5" width="24" height="22" rx="2" fill={style.fillColor}
          fillOpacity={style.fillOpacity} {...stroke} />
      )}
      {kind === "line" && (
        <line x1="3" y1="16" x2="33" y2="16" {...stroke} />
      )}
      {kind === "point" && (
        <circle cx="18" cy="16" r={Math.min(13, Math.max(5, style.pointSize / 2))}
          fill={style.color} fillOpacity={style.opacity} stroke="#fff" strokeWidth="2" />
      )}
    </svg>
  );
}

/**
 * Legenda dinâmica para cartões GeoJSON da Sidebar.
 * Lê exclusivamente a URL pública publicada (ou o arquivo local antigo),
 * sem depender dos dados da API administrativa e sem modificar os arquivos.
 */
export default function GeoJSONLegend({ layer }) {
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const path = layer?.geojson_path || "";
  const validPath = LOCAL_PATH.test(path) || LARAVEL_PATH.test(path);

  useEffect(() => {
    if (!validPath) return undefined;

    const controller = new AbortController();
    const url = LARAVEL_PATH.test(path)
      ? `${API_BASE_URL}${path.slice("/api".length)}`
      : path;

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ path, ok: true, data });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          console.error(`Erro ao carregar a legenda de ${layer?.name || "GeoJSON"}:`, error);
          setResult({ path, ok: false, data: null });
        }
      });

    return () => controller.abort();
  }, [path, validPath, layer?.name]);

  const groups = useMemo(
    () => (result?.path === path && result.ok ? legendGroups(result.data) : []),
    [result, path]
  );
  const waiting = validPath && result?.path !== path;
  const error = !validPath || (result?.path === path && !result.ok);
  const visibleGroups = expanded ? groups : groups.slice(0, MAX_ROWS);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="mb-3 text-xs font-bold text-slate-600">Simbologia da camada</p>

        {waiting && (
          <div className="flex items-center gap-2 text-xs text-slate-500" role="status">
            <Loader2 size={15} className="animate-spin" /> Carregando simbologia...
          </div>
        )}

        {error && (
          <p className="flex items-start gap-2 text-xs text-amber-700" role="status">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            Não foi possível carregar a legenda desta camada.
          </p>
        )}

        {!waiting && !error && groups.length === 0 && (
          <p className="text-xs text-slate-500">Nenhuma geometria disponível para a legenda.</p>
        )}

        {!waiting && !error && groups.length > 0 && (
          <div className="space-y-2">
            {visibleGroups.map((group) => (
              <div key={group.key} className="flex min-w-0 items-center gap-3">
                <Symbol group={group} />
                <span className="min-w-0 break-words text-xs font-medium text-slate-700">
                  {groupName(group)}
                </span>
              </div>
            ))}
            {groups.length > MAX_ROWS && (
              <button type="button" onClick={() => setExpanded((old) => !old)}
                className="mt-1 text-left text-xs font-semibold text-blue-700 hover:underline">
                {expanded ? "Mostrar menos" : `Mostrar mais ${groups.length - MAX_ROWS} estilos`}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <FileText size={14} />
        <span>Dados vetoriais (GeoJSON)</span>
      </div>
    </div>
  );
}
