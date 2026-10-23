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

export default function LocalGeoJSONLayer({ layer }) {
  const [loaded, setLoaded] = useState(null);
  const path = layer.geojson_path;
  const geojson = loaded?.path === path ? loaded.data : null;

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
        const isPolygon = geometryType === "Polygon" || geometryType === "MultiPolygon";

        if (name && isPolygon) {
          leafletLayer.bindTooltip(String(name), {
            permanent: true,
            direction: "center",
            className: "bairro-tooltip",
            opacity: 0.95,
          });
        }

        const popup = document.createElement("div");
        popup.className = "bairro-popup";
        const title = document.createElement("h3");
        title.textContent = String(name || layer.name || "Informações da camada");
        popup.appendChild(title);

        for (const [key, value] of Object.entries(properties)) {
          if (["nome", "name", "title", "estilo", "forma"].includes(key.toLowerCase()) ||
              value === null || value === undefined || value === "") continue;
          const row = document.createElement("p");
          const label = document.createElement("strong");
          label.textContent = key === "id_2" ? "ID: " : key === "lei" ? "Legislação: " : `${key.replace(/_/g, " ")}: `;
          const valueText = document.createElement("span");
          valueText.textContent = typeof value === "object" ? JSON.stringify(value) : String(value);
          row.append(label, valueText);
          popup.appendChild(row);
        }
        leafletLayer.bindPopup(popup, { maxWidth: 320 });
      }}
    />
  );
}
