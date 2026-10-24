import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import api from "../../services/api";

// Os dois formatos de caminho que o Sobral em Mapas já utiliza.
const FRONTEND_GEOJSON = /^\/geodata\/([A-Za-z0-9_-]+\.geojson)$/;
const LARAVEL_GEOJSON = /^\/api\/geodata\/([A-Za-z0-9_-]+\.geojson)$/;

/**
 * Botão de exportação para a tabela de camadas administrativas.
 *
 * - Arquivos antigos: obtidos do frontend/public/geodata.
 * - Arquivos enviados: obtidos pela rota administrativa autenticada do Laravel.
 *
 * Não altera nem regrava o GeoJSON: baixa as geometrias, os atributos e
 * properties.estilo exatamente como estão armazenados.
 */
export default function GeoJSONDownloadButton({ layer, onNotify }) {
  const [downloading, setDownloading] = useState(false);

  if (layer?.source_format !== "GEOJSON") return null;

  async function handleDownload() {
    if (downloading) return;

    setDownloading(true);
    try {
      const blob = await readLayerGeoJSON(layer);
      await validateGeoJSON(blob);

      const filename = buildDownloadFilename(layer);
      const objectUrl = URL.createObjectURL(blob);

      try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally {
        // Atrasar a liberação para que navegadores concluam o download.
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      }

      onNotify?.("success", `GeoJSON de "${layer.name}" preparado para download.`);
    } catch (error) {
      console.error("Erro ao exportar GeoJSON:", error);
      onNotify?.("error", describeExportError(error));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      title={`Baixar GeoJSON de ${layer.name}`}
      aria-label={`Baixar GeoJSON de ${layer.name}`}
      className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex items-center justify-center disabled:cursor-wait disabled:opacity-50"
    >
      {downloading ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <Download size={17} />
      )}
    </button>
  );
}

async function readLayerGeoJSON(layer) {
  const path = layer.geojson_path || "";
  const laravelMatch = path.match(LARAVEL_GEOJSON);

  if (laravelMatch) {
    // Funciona inclusive se a camada estiver inativa ou privada.
    // A autenticação é acrescentada automaticamente pelo services/api.js.
    const filename = encodeURIComponent(laravelMatch[1]);
    const response = await api.get(
      `/admin/geojson-files/${filename}/content`,
      { responseType: "blob" }
    );
    return response.data;
  }

  if (FRONTEND_GEOJSON.test(path)) {
    // Compatibilidade com GeoJSON antigos publicados no Vite/frontend.
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Arquivo GeoJSON não encontrado (HTTP ${response.status}).`);
    }
    return response.blob();
  }

  throw new Error(
    "Esta camada não possui um caminho GeoJSON compatível com a exportação."
  );
}

async function validateGeoJSON(blob) {
  let parsed;

  try {
    parsed = JSON.parse(await blob.text());
  } catch {
    throw new Error("O servidor não retornou um arquivo GeoJSON válido.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !["FeatureCollection", "Feature", "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"].includes(parsed.type)
  ) {
    throw new Error("O arquivo retornado não possui uma estrutura GeoJSON reconhecida.");
  }
}

function buildDownloadFilename(layer) {
  const base = String(layer.layer_name || layer.name || "camada")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return `${base || "camada"}.geojson`;
}

function describeExportError(error) {
  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return "Sua sessão não permite baixar este arquivo. Entre novamente no painel.";
  }

  if (status === 404) {
    return "O arquivo GeoJSON não foi encontrado no armazenamento do Laravel.";
  }

  return error?.message || "Não foi possível exportar a camada GeoJSON.";
}
