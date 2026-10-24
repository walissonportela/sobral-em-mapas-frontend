import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

// Suporta tanto arquivos antigos do frontend quanto uploads publicados pelo Laravel.
const LOCAL_GEOJSON_PATH = /^\/geodata\/[A-Za-z0-9_-]+\.geojson$/;
const LARAVEL_GEOJSON_PATH = /^\/api\/geodata\/[A-Za-z0-9_-]+\.geojson$/;
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

const DEFAULT_STYLE = {
  color: "#2563eb",
  weight: 2,
  opacity: 1,
  fillColor: "#3b82f6",
  fillOpacity: 0.12,
};

function styleForFeature(feature) {
  const saved = feature?.properties?.estilo;
  if (!saved || typeof saved !== "object") return DEFAULT_STYLE;
  const color = /^#[0-9a-f]{6}$/i.test(saved.cor || "") ? saved.cor : DEFAULT_STYLE.color;
  const width = Number(saved.espessura);
  const opacity = Number(saved.opacidade_preenchimento);
  const savedLineOpacity = Number(saved.opacidade_linha);
  const style = ["solid", "dashed", "dotted"].includes(saved.tipo_linha)
    ? saved.tipo_linha
    : "solid";
  return {
    color,
    weight: Number.isFinite(width) ? Math.min(20, Math.max(1, width)) : 2,
    opacity: saved.opacidade_linha !== undefined && Number.isFinite(savedLineOpacity)
      ? Math.min(1, Math.max(0, savedLineOpacity))
      : 1,
    fillColor: color,
    fillOpacity: saved.opacidade_preenchimento !== undefined && Number.isFinite(opacity)
      ? Math.min(1, Math.max(0, opacity))
      : 0.12,
    dashArray: style === "dashed" ? "10,8" : style === "dotted" ? "2,8" : null,
    lineCap: "round",
  };
}

function pointForFeature(feature, latlng) {
  const saved = feature?.properties?.estilo;
  const rawSize = Number(saved?.tamanho_ponto);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(32, Math.max(10, rawSize)) : 18;
  const line = styleForFeature(feature);
  return L.circleMarker(latlng, {
    ...line,
    radius: size / 2,
    fillOpacity: line.opacity,
    weight: 2,
  });
}

// A unidade apresentada ao usuário é quilômetro (km) ou quilômetro quadrado (km²).
// Os números originais em metros e m² continuam intactos no GeoJSON.
const numberFormatter = (digits) => new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: digits,
});

function formatUnit(value, divisor, unit) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  const converted = parsed / divisor;
  // Evita exibir 0,00 km² quando o desenho é muito pequeno.
  const digits = Math.abs(converted) < 0.01 && converted !== 0 ? 6 : 2;
  return `${numberFormatter(digits).format(converted)} ${unit}`;
}

function formatPopupAttribute(key, value) {
  const normalized = key.toLowerCase();
  if (normalized === "area_m2") {
    return { label: "Área", value: formatUnit(value, 1_000_000, "km²") };
  }
  if (["area_km2", "area_km²"].includes(normalized)) {
    return { label: "Área", value: formatUnit(value, 1, "km²") };
  }
  if (normalized === "perimetro_m") {
    return { label: "Perímetro", value: formatUnit(value, 1_000, "km") };
  }
  if (["perimetro_km", "perímetro_km"].includes(normalized)) {
    return { label: "Perímetro", value: formatUnit(value, 1, "km") };
  }
  if (normalized === "comprimento_m") {
    return { label: "Distância", value: formatUnit(value, 1_000, "km") };
  }
  if (["comprimento_km", "distancia_km", "distância_km"].includes(normalized)) {
    return { label: "Distância", value: formatUnit(value, 1, "km") };
  }
  const friendlyNames = {
    id_2: "ID",
    lei: "Legislação",
    descricao: "Descrição",
    "descrição": "Descrição",
    description: "Descrição",
  };
  const label = friendlyNames[normalized] ||
    (key.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase()));
  return {
    label,
    value: typeof value === "object" ? JSON.stringify(value) : String(value),
  };
}


// Estilos somente de apresentacao: sem alterar os dados ou os enderecos GeoJSON.
const PRESENTATION_STYLE_ID = "sobral-geojson-popup-visual-v3";

function ensurePresentationStyles() {
  if (document.getElementById(PRESENTATION_STYLE_ID)) return;
  const element = document.createElement("style");
  element.id = PRESENTATION_STYLE_ID;
  element.textContent = `
    /* Rótulo discreto e sempre horizontal, inclusive para nomes longos. */
    .leaflet-tooltip.sobral-geojson-label {
      display: inline-block !important;
      width: max-content !important;
      min-width: max-content !important;
      max-width: none !important;
      white-space: nowrap !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
      writing-mode: horizontal-tb !important;
      background: rgba(255, 255, 255, .96) !important;
      border: 1px solid #93c5fd !important;
      color: #1e40af !important;
      padding: 4px 8px !important;
      border-radius: 7px !important;
      font: 700 11px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif !important;
      box-shadow: 0 1px 4px rgba(15, 23, 42, .12) !important;
      text-align: center;
      pointer-events: none !important;
    }
    .leaflet-tooltip.sobral-geojson-label::before { display: none !important; }

    .leaflet-popup.sobral-geojson-popup .leaflet-popup-content-wrapper {
      padding: 0 !important;
      overflow: hidden;
      border-radius: 19px;
      background: #fff;
      box-shadow: 0 16px 45px rgba(15, 23, 42, .24);
    }
    .leaflet-popup.sobral-geojson-popup .leaflet-popup-content {
      margin: 0 !important;
      width: 310px !important;
      max-width: calc(100vw - 60px) !important;
    }
    .leaflet-popup.sobral-geojson-popup .leaflet-popup-tip { background: white; }
    .leaflet-popup.sobral-geojson-popup .leaflet-popup-close-button {
      z-index: 2;
      top: 9px !important;
      right: 10px !important;
      color: white !important;
      background: rgba(255,255,255,.16);
      border-radius: 50%;
      width: 27px !important;
      height: 27px !important;
      line-height: 24px !important;
      text-align: center;
    }
    .sobral-feature-card { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f172a; }
    .sobral-feature-card-head {
      background: linear-gradient(125deg, #1d4ed8 0%, #1e40af 95%);
      color: #fff;
      padding: 16px 44px 17px 18px;
    }
    .sobral-feature-card-tag {
      display: inline-block; border: 1px solid rgba(255,255,255,.25);
      background: rgba(255,255,255,.13); border-radius: 30px;
      padding: 3px 9px; font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .065em; margin-bottom: 9px;
    }
    .sobral-feature-card-title { margin: 0; font-size: 18px; font-weight: 800; line-height: 1.32; }
    .sobral-feature-card-body { padding: 15px 16px 17px; }
    /* Descrição com hierarquia visual, sem alterar o restante do popup. */
    .sobral-feature-description-box {
      padding: 12px 13px;
      margin: 0 0 14px;
      border-left: 3px solid #2563eb;
      border-radius: 9px;
      background: #f8fafc;
    }
    .sobral-feature-description-label {
      margin: 0 0 5px;
      color: #1d4ed8;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .055em;
      text-transform: uppercase;
    }
    .sobral-feature-description { color:#334155; line-height:1.65; margin: 0; font-size: 13px; overflow-wrap: break-word; }
    .sobral-feature-metrics { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 9px; margin: 0 0 13px; }
    .sobral-feature-metric { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 11px; min-width: 0; }
    .sobral-feature-metric-label { color: #1d4ed8; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
    .sobral-feature-metric-value { color: #0f172a; font-size: 15px; font-weight: 800; overflow-wrap: anywhere; }
    .sobral-feature-details { border: 1px solid #e2e8f0; border-radius: 11px; overflow: hidden; }
    .sobral-feature-details-heading { font-size: 11px; font-weight: 800; padding: 9px 11px; color: #1d4ed8; background: #f8fafc; }
    .sobral-feature-detail { display: flex; justify-content: space-between; gap: 12px; padding: 9px 11px; border-top: 1px solid #f1f5f9; font-size: 12px; }
    .sobral-feature-detail strong { color: #475569; }
    .sobral-feature-detail span { color: #0f172a; text-align: right; overflow-wrap: anywhere; }
  `;
  document.head.appendChild(element);
}

function domElement(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function buildStyledPopup(feature, layer) {
  const properties = feature?.properties || {};
  const name = properties.nome || properties.name || properties.title || layer.name || "Informações da camada";
  const type = feature?.geometry?.type || "";
  const typeName = ["Polygon", "MultiPolygon"].includes(type) ? "Área" :
    ["LineString", "MultiLineString"].includes(type) ? "Linha" :
    ["Point", "MultiPoint"].includes(type) ? "Ponto" : "Elemento";

  const root = domElement("div", "sobral-feature-card");
  const header = domElement("div", "sobral-feature-card-head");
  header.appendChild(domElement("span", "sobral-feature-card-tag", typeName));
  header.appendChild(domElement("h3", "sobral-feature-card-title", name));
  root.appendChild(header);

  const body = domElement("div", "sobral-feature-card-body");
  const description = properties.descricao ?? properties["descrição"] ?? properties.description ?? properties.desc;
  if (description !== undefined && description !== null && description !== "") {
    const descriptionBox = domElement("div", "sobral-feature-description-box");
    descriptionBox.appendChild(domElement("div", "sobral-feature-description-label", "Descrição"));
    descriptionBox.appendChild(domElement("p", "sobral-feature-description", description));
    body.appendChild(descriptionBox);
  }

  const measurements = [];
  const other = [];
  const measureKeys = new Set([
    "area_m2", "area_km2", "area_km²", "perimetro_m", "perimetro_km", "perímetro_km",
    "comprimento_m", "comprimento_km", "distancia_km", "distância_km"
  ]);
  const omitKeys = new Set(["nome", "name", "title", "estilo", "forma", "descricao", "descrição", "description", "desc"]);

  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined || value === "") continue;
    const lower = key.toLowerCase();
    if (omitKeys.has(lower)) continue;
    const item = formatPopupAttribute(key, value);
    if (measureKeys.has(lower)) measurements.push(item);
    else other.push(item);
  }

  if (measurements.length) {
    const grid = domElement("div", "sobral-feature-metrics");
    for (const item of measurements) {
      const card = domElement("div", "sobral-feature-metric");
      card.appendChild(domElement("div", "sobral-feature-metric-label", item.label));
      card.appendChild(domElement("div", "sobral-feature-metric-value", item.value));
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }

  if (other.length) {
    const details = domElement("div", "sobral-feature-details");
    details.appendChild(domElement("div", "sobral-feature-details-heading", "Informações adicionais"));
    for (const item of other) {
      const row = domElement("div", "sobral-feature-detail");
      row.appendChild(domElement("strong", "", item.label));
      row.appendChild(domElement("span", "", item.value));
      details.appendChild(row);
    }
    body.appendChild(details);
  }
  root.appendChild(body);
  return root;
}

export default function LocalGeoJSONLayer({ layer }) {
  const [loaded, setLoaded] = useState(null);
  const path = layer.geojson_path;
  const geojson = loaded?.path === path ? loaded.data : null;

  useEffect(() => {
    ensurePresentationStyles();
  }, []);

  useEffect(() => {
    if (!LOCAL_GEOJSON_PATH.test(path || "") && !LARAVEL_GEOJSON_PATH.test(path || "")) {
      console.error("Caminho GeoJSON inválido:", path);
      return;
    }
    const controller = new AbortController();
    const url = LARAVEL_GEOJSON_PATH.test(path)
      ? `${API_BASE_URL}${path.slice("/api".length)}`
      : path;
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Não foi possível carregar ${path} (HTTP ${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          if (!data || typeof data !== "object" || !data.type) {
            throw new Error(`O arquivo ${path} não contém GeoJSON válido.`);
          }
          setLoaded({ path, data });
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(`Erro ao carregar a camada "${layer.name}":`, error);
      });
    return () => controller.abort();
  }, [path, layer.name]);

  if (!geojson) return null;
  return (
    <GeoJSON
      data={geojson}
      style={styleForFeature}
      pointToLayer={pointForFeature}
      onEachFeature={(feature, leafletLayer) => {
        const properties = feature.properties || {};
        const name = properties.nome || properties.name || properties.title;
        const geometryType = feature.geometry?.type || "";
        
        const showLabel = [
          "Polygon",
          "MultiPolygon",
          "LineString",
          "MultiLineString",
          "Point",
          "MultiPoint",
        ].includes(geometryType);

        if (name && showLabel) {
          leafletLayer.bindTooltip(String(name), {
            permanent: true,
            direction: "center",
            className: "bairro-tooltip",
            opacity: 0.95,
          });
        }


        leafletLayer.bindPopup(buildStyledPopup(feature, layer), {
          maxWidth: 360,
          className: "sobral-geojson-popup",
        });
      }}
    />
  );
}
