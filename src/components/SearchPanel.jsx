import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Compass,
  Database,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
const HISTORY_KEY = "sobral_recent_searches";
const GEOCODER_URL =
  import.meta.env.VITE_GEOCODER_URL ||
  "https://nominatim.openstreetmap.org/search";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");
const SOBRAL_VIEWBOX = "-40.45,-3.60,-40.25,-3.78";
// O autocompletar usa APENAS os arquivos GeoJSON da própria plataforma.
// O Nominatim público é consultado somente por ação explícita (Buscar / Enter).
const GEOJSON_URL_PATTERN = /^\/(?:api\/)?geodata\/[A-Za-z0-9_-]+\.geojson$/;
const GEOJSON_CACHE = new Map();
const MAX_GEOJSON_BYTES = 2_500_000;
const MAX_FILES_TO_INDEX = 24;
const MAX_NAMES_PER_FILE = 1800;
const MAX_SUGGESTIONS = 7;
const NAME_KEYS = [
  "nome", "name", "title", "nome_fantasia", "nomefantasia",
  "denominacao", "denominação", "nm_bairro", "bairro", "nm_distrito",
  "distrito", "nm_escola", "escola", "unidade", "equipamento",
  "estabelecimento", "descricao", "descrição", "label", "nm_localidade",
];

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function loadRecentSearches() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    const seen = new Set();
    return saved.filter((item) => {
      if (!Number.isFinite(Number(item?.lat)) || !Number.isFinite(Number(item?.lon))) {
        return false;
      }
      const key = getPlaceKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  } catch {
    return [];
  }
}

function parseCoordinates(value) {
  const match = value
    .trim()
    .replace(/[()]/g, "")
    .match(/^([+-]?\d{1,2}(?:\.\d+)?)\s*[,;]\s*([+-]?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}
// Identidade visual: ruas repetidas em vários trechos são uma sugestão só.
// Locais pontuais homônimos continuam separados por suas coordenadas.

function getSearchIdentity(item) {
  const name = normalize(item.featureName || getPlaceTitle(item));
  const type = item.geometryType || "";
  // Compatibilidade com o histórico antigo, salvo antes da classificação geométrica.
  const legacyRoad = !type && /sistema vi[aá]rio|vias|ruas|avenidas|rodovias/i.test(item.layerName || "");
  const isLine = ["LineString", "MultiLineString"].includes(type) || legacyRoad;
  if (isLine) return `via:${name}`;
  return `local:${name}:${Number(item.lat).toFixed(4)}:${Number(item.lon).toFixed(4)}`;
}

function getPlaceKey(item) {
  if (item?.kind === "geojson") return getSearchIdentity(item);
  if (item?.osm_type && item?.osm_id) return `${item.osm_type}:${item.osm_id}`;
  return String(item?.place_id || `${item?.lat},${item?.lon}`);
}

function getPlaceTitle(item) {
  if (item.kind === "coordinates") return "Coordenadas informadas";
  if (item.kind === "geojson") return item.featureName;
  return String(item.display_name || item.name || "Local encontrado")
    .split(",")[0].trim();
}

// Identifica o que é cada resultado a partir da geometria, dos atributos
// cadastrais e do nome da camada. Não presume que todo trecho é uma rua.
function getPlaceType(item) {
  if (item.kind === "coordinates") return "Coordenadas";
  if (item.kind !== "geojson") return "Endereço";
  if (item.placeType) return item.placeType;

  // Fallback para entradas antigas que já estão no histórico local.
  const hint = normalize(`${item.layerName || ""} ${item.subcategoryName || ""}`);
  const geometryType = item.geometryType || "";
  if (/bairro/.test(hint)) return "Bairro";
  if (/distrit/.test(hint)) return "Distrito";
  if (/universid|faculdade/.test(hint)) return "Ensino superior";
  if (/escol|ensino|educac/.test(hint)) return "Instituição de ensino";
  if (/hospital/.test(hint)) return "Hospital";
  if (/saude|clinica|ubs|psf/.test(hint)) return "Unidade de saúde";
  if (/praca/.test(hint)) return "Praça";
  if (/parque/.test(hint)) return "Parque";
  if (/sistema viario|\bvias\b|logradouro|rodovia|ruas|avenidas/.test(hint)) return "Via";
  if (["LineString", "MultiLineString"].includes(geometryType)) return "Linha";
  if (["Polygon", "MultiPolygon"].includes(geometryType)) return "Área";
  return "Local";
}

// Exibe o endereço apenas quando está registrado no GeoJSON.
// Sem essa informação, oferece uma descrição do tipo de feição,
// evitando apresentar uma rua ou um bairro que não foram verificados.
function getPlaceContext(item) {
  if (item.kind !== "geojson") return getPlaceSubtitle(item);
  if (item.addressDetail) return item.addressDetail;
  const type = getPlaceType(item);
  const generic = {
    Via: "Trecho da rede viária",
    Bairro: "Área do bairro",
    Distrito: "Área do distrito",
    Linha: "Traçado cartográfico",
    Área: "Área mapeada",
  };
  return generic[type] || `${type} no mapa de Sobral`;
}

function getPlaceSubtitle(item) {
  if (item.kind === "coordinates") {
    return `${Number(item.lat).toFixed(5)}, ${Number(item.lon).toFixed(5)}`;
  }
  if (item.kind === "geojson") {
    return `${getPlaceType(item)} · ${getPlaceContext(item)} · Camada: ${item.layerName}`;
  }
  return String(item.display_name || "")
    .split(",").slice(1).join(",").trim() || "Local encontrado";
}

// Suporta propriedades do OpenStreetMap e campos mais comuns dos dados
// municipais: tanto no nível principal quanto dentro de properties.tags.
function getFeatureAttribute(properties, keys) {
  const tags = properties?.tags && typeof properties.tags === "object" && !Array.isArray(properties.tags)
    ? properties.tags : {};
  for (const source of [properties || {}, tags]) {
    const values = new Map(Object.entries(source).map(([key, value]) => [normalize(key), value]));
    for (const key of keys) {
      const value = values.get(normalize(key));
      if (typeof value !== "string" && typeof value !== "number") continue;
      const result = String(value).trim();
      if (result && !/^(null|undefined|sem informação|sem informacao|n\/a)$/i.test(result)) return result;
    }
  }
  return "";
}

function getFeaturePlaceType(feature, layer) {
  const properties = feature?.properties || {};
  const amenity = normalize(getFeatureAttribute(properties, ["amenity", "tipo"]));
  const healthcare = normalize(getFeatureAttribute(properties, ["healthcare"]));
  const hint = normalize(`${layer?.name || ""} ${layer?.subcategory?.name || ""}`);
  const geometryType = feature?.geometry?.type || "";

  if (/bairro/.test(hint)) return "Bairro";
  if (/distrit/.test(hint)) return "Distrito";
  if (/sistema viario|\bvias\b|logradouro|rodovia|ruas|avenidas/.test(hint)) return "Via";
  if (amenity === "university" || amenity === "college" || /universid|faculdade/.test(hint)) return "Ensino superior";
  if (["school", "kindergarten"].includes(amenity) || /escol|ensino|educac/.test(hint)) return "Instituição de ensino";
  if (amenity === "hospital" || healthcare === "hospital" || /hospital/.test(hint)) return "Hospital";
  if (amenity === "clinic" || healthcare === "clinic" || /cl[ií]nica/.test(hint)) return "Clínica";
  if (amenity === "pharmacy" || /farmacia|farmácia/.test(hint)) return "Farmácia";
  if (/saude|saúde|ubs|psf/.test(hint)) return "Unidade de saúde";
  if (/praca|praça/.test(hint)) return "Praça";
  if (/parque/.test(hint)) return "Parque";
  if (["LineString", "MultiLineString"].includes(geometryType)) return "Linha";
  if (["Polygon", "MultiPolygon"].includes(geometryType)) return "Área";
  return "Local";
}

function getFeatureAddress(feature, featureName) {
  const properties = feature?.properties || {};
  const street = getFeatureAttribute(properties, [
    "addr:street", "addr_street", "logradouro", "nome_logradouro", "nm_logradouro",
    "ds_logradouro", "rua", "endereco", "endereço", "street",
  ]);
  const number = getFeatureAttribute(properties, ["addr:housenumber", "numero", "número", "num_imovel"]);
  const neighborhood = getFeatureAttribute(properties, [
    "addr:suburb", "addr:neighbourhood", "bairro", "nome_bairro", "nm_bairro", "bairro_nome",
  ]);
  const district = getFeatureAttribute(properties, ["addr:district", "distrito", "nm_distrito"]);
  const parts = [];
  // Não repete o título do resultado como se fosse informação adicional.
  if (street && normalize(street) !== normalize(featureName)) {
    parts.push(number ? `${street}, ${number}` : street);
  } else if (street && number) {
    parts.push(`Nº ${number}`);
  }
  if (neighborhood && normalize(neighborhood) !== normalize(featureName)) {
    parts.push(`Bairro ${neighborhood}`);
  }
  if (district && normalize(district) !== normalize(featureName) && normalize(district) !== normalize(neighborhood)) {
    parts.push(`Distrito ${district}`);
  }
  return parts.join(" · ");
}

function getGeojsonUrl(layer) {
  const path = layer?.geojson_path;
  if (typeof path !== "string" || !GEOJSON_URL_PATTERN.test(path)) return null;
  return path.startsWith("/api/geodata/")
    ? `${API_BASE_URL}${path.slice("/api".length)}`
    : path;
}

function isSearchableLayer(layer) {
  if (normalize(layer?.source_format) !== "geojson") return false;
  // Não indexa camadas explicitamente marcadas como privadas.
  if (layer.isPublic === false || layer.isPublic === 0 || layer.isPublic === "0" ||
      layer.is_public === false || layer.is_public === 0 || layer.is_public === "0") return false;
  return Boolean(getGeojsonUrl(layer));
}

function layerPriority(layer, activeIds) {
  const name = normalize(`${layer.name || ""} ${layer.subcategory?.name || ""}`);
  const relevant = /bairro|distrit|escol|educ|saud|hospital|unidade|ubs|psf|praca|parque|equipamento|ponto|turism/.test(name);
  return (activeIds.has(String(layer.id)) ? 10 : 0) + (relevant ? 4 : 0);
}

function getFeatureName(properties) {
  if (!properties || typeof properties !== "object") return null;
  const tags = properties.tags && typeof properties.tags === "object"
    ? properties.tags : {};
  for (const source of [properties, tags]) {
    const values = new Map(Object.entries(source).map(([key, value]) => [normalize(key), value]));
    for (const key of NAME_KEYS) {
      const value = values.get(normalize(key));
      if (typeof value !== "string") continue;
      const name = value.trim();
      if (name.length >= 2 && name.length <= 120 && !/^(null|sem nome|undefined|n\/a)$/i.test(name)) {
        return name;
      }
    }
  }
  return null;
}

function coordinatesCenter(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    const [lon, lat] = geometry.coordinates;
    if (Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
    return null;
  }
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  let count = 0;
  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [lon, lat] = coords;
      if (Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        count += 1;
      }
      return;
    }
    coords.forEach(walk);
  };
  if (geometry.type === "GeometryCollection") {
    geometry.geometries?.forEach((item) => {
      const center = coordinatesCenter(item);
      if (center) walk([center.lon, center.lat]);
    });
  } else {
    walk(geometry.coordinates);
  }
  return count ? { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 } : null;
}
// Estima a extensão de vias para manter o trecho mais representativo
// quando o GeoJSON divide uma rua em várias feições.

function lineLength(geometry) {
  if (!geometry || !["LineString", "MultiLineString"].includes(geometry.type)) return 0;
  const lines = geometry.type === "LineString"
    ? [geometry.coordinates]
    : geometry.coordinates;
  if (!Array.isArray(lines)) return 0;
  let length = 0;
  for (const line of lines) {
    if (!Array.isArray(line)) continue;
    for (let i = 1; i < line.length; i++) {
      const previous = line[i - 1];
      const current = line[i];
      if (!Array.isArray(previous) || !Array.isArray(current)) continue;
      const lat = (Number(previous[1]) + Number(current[1])) / 2;
      const dx = (Number(current[0]) - Number(previous[0])) * Math.cos(lat * Math.PI / 180);
      const dy = Number(current[1]) - Number(previous[1]);
      const segment = Math.hypot(dx, dy);
      if (Number.isFinite(segment)) length += segment;
    }
  }
  return length;
}

// Para vias, escolhe um ponto situado sobre a geometria, evitando que
// o marcador de pesquisa caia fora da rua quando ela faz curvas.
function lineRepresentativePoint(geometry) {
  if (!geometry || !["LineString", "MultiLineString"].includes(geometry.type)) return null;
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  if (!Array.isArray(lines)) return null;
  let best = null;
  let bestDistance = 0;
  for (const line of lines) {
    if (!Array.isArray(line)) continue;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1];
      const b = line[i];
      if (!Array.isArray(a) || !Array.isArray(b)) continue;
      const lat1 = Number(a[1]);
      const lon1 = Number(a[0]);
      const lat2 = Number(b[1]);
      const lon2 = Number(b[0]);
      if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) continue;
      const dx = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
      const distance = Math.hypot(dx, lat2 - lat1);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = { lat: (lat1 + lat2) / 2, lon: (lon1 + lon2) / 2 };
      }
    }
  }
  return best;
}

function extractPlaces(geojson, layer) {
  const features = geojson?.type === "FeatureCollection"
    ? geojson.features
    : geojson?.type === "Feature" ? [geojson] : [];
  if (!Array.isArray(features)) return [];
  const places = [];
  const dedupe = new Map();
  for (const [index, feature] of features.entries()) {
    const name = getFeatureName(feature?.properties);
    if (!name) continue;
    const geometryType = feature.geometry?.type || "";
    const point = lineRepresentativePoint(feature.geometry) || coordinatesCenter(feature.geometry);
    if (!point) continue;

    const length = lineLength(feature.geometry);
    const candidate = {
      kind: "geojson",
      place_id: `geojson:${layer.id}:${index}`,
      featureName: name,
      layerName: String(layer.name || "Mapa municipal"),
      subcategoryName: String(layer.subcategory?.name || ""),
      placeType: getFeaturePlaceType(feature, layer),
      addressDetail: getFeatureAddress(feature, name),
      geometryType,
      segmentLength: length,
      display_name: `${name}, ${layer.name || "Sobral"}`,
      ...point,
    };
    const key = getSearchIdentity(candidate);
    const existingIndex = dedupe.get(key);
    if (existingIndex !== undefined) {
      // Nomes de vias repetidos não geram novas sugestões. A localização
      // privilegia um trecho mais comprido, em vez de uma ponta arbitrária.
      if (length > places[existingIndex].segmentLength) {
        places[existingIndex] = candidate;
      }
      continue;
    }
    dedupe.set(key, places.length);
    places.push(candidate);
    if (places.length >= MAX_NAMES_PER_FILE) break;
  }
  return places;
}

async function fetchGeojsonPlaces(layer, signal) {
  const url = getGeojsonUrl(layer);
  if (!url) return [];
  // Cache em memória evita baixar novamente ao alternar abas da Sidebar.
  if (GEOJSON_CACHE.has(url)) return GEOJSON_CACHE.get(url);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`GeoJSON indisponível (${response.status})`);
  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > MAX_GEOJSON_BYTES) {
    await response.body?.cancel?.();
    return [];
  }
  let content = "";
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_GEOJSON_BYTES) {
        await reader.cancel();
        return [];
      }
      content += decoder.decode(value, { stream: true });
    }
    content += decoder.decode();
  } else {
    content = await response.text();
    if (new Blob([content]).size > MAX_GEOJSON_BYTES) return [];
  }
  const places = extractPlaces(JSON.parse(content), layer);
  GEOJSON_CACHE.set(url, places);
  return places;
}

export default function SearchPanel({ onSearch, layers = [], activeLayers = [] }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("sobral");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
  const [localPlaces, setLocalPlaces] = useState([]);
  const [indexProgress, setIndexProgress] = useState({ done: 0, total: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const requestRef = useRef(null);
  const lastRequestAtRef = useRef(0);
  const geocoderCacheRef = useRef(new Map());
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const eligibleLayers = useMemo(() => {
    const activeIds = new Set(activeLayers.map((layer) => String(layer.id)));
    const unique = new Map();
    for (const layer of layers) {
      if (!isSearchableLayer(layer)) continue;
      const key = getGeojsonUrl(layer);
      if (!unique.has(key)) unique.set(key, layer);
    }
    return [...unique.values()]
      .sort((a, b) => layerPriority(b, activeIds) - layerPriority(a, activeIds))
      .slice(0, MAX_FILES_TO_INDEX);
  }, [layers, activeLayers]);
  // Índice local progressivo, apenas enquanto a aba Buscar Local estiver aberta.
  // A consulta remota ao Nominatim NÃO é usada no autocompletar.
  useEffect(() => {
    const controller = new AbortController();
    const accumulated = [];
    let cursor = 0;
    let done = 0;
    const total = eligibleLayers.length;
    const work = async () => {
      while (!controller.signal.aborted) {
        const index = cursor++;
        if (index >= total) break;
        try {
          const items = await fetchGeojsonPlaces(eligibleLayers[index], controller.signal);
          if (controller.signal.aborted) return;
          accumulated.push(...items.map((place) => ({ ...place, sourceRank: index })));
          setLocalPlaces([...accumulated]);
        } catch (cause) {
          if (controller.signal.aborted) return;
          console.warn(`Busca local: não foi possível indexar ${eligibleLayers[index].name}`, cause);
        } finally {
          if (!controller.signal.aborted) {
            done += 1;
            setIndexProgress({ done, total });
          }
        }
      }
    };
    void Promise.all([work(), work()]);
    return () => controller.abort();
  }, [eligibleLayers]);
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(recentSearches));
    } catch {
      // O histórico é opcional (ex.: modo de navegação privada).
    }
  }, [recentSearches]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    const closeOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  const term = normalize(query);
  const localSuggestions = useMemo(() => {
    if (term.length < 2 || parseCoordinates(query)) return [];
    const distinct = new Map();
    for (const place of localPlaces) {
      if (!normalize(place.featureName).includes(term)) continue;
      const key = getSearchIdentity(place);
      const previous = distinct.get(key);
      // Prefere a camada priorizada pelo painel, independentemente da
      // ordem em que os downloads paralelos foram finalizados.
      if (!previous || (place.sourceRank ?? Infinity) < (previous.sourceRank ?? Infinity)) {
        distinct.set(key, place);
      }
    }
    return [...distinct.values()].sort((a, b) => {
      const aStart = normalize(a.featureName).startsWith(term) ? 0 : 1;
      const bStart = normalize(b.featureName).startsWith(term) ? 0 : 1;
      return aStart - bStart ||
        a.featureName.localeCompare(b.featureName, "pt-BR") ||
        (a.sourceRank ?? Infinity) - (b.sourceRank ?? Infinity);
    }).slice(0, MAX_SUGGESTIONS);
  }, [localPlaces, query, term]);
  const visibleRecent = useMemo(() => {
    // Não repete no histórico uma sugestão já exibida na seção de locais.
    const visibleKeys = new Set(term.length >= 2 ? localSuggestions.map(getPlaceKey) : []);
    const seen = new Set();
    return recentSearches.filter((item) => {
      if (term && !normalize(`${getPlaceTitle(item)} ${getPlaceSubtitle(item)}`).includes(term)) return false;
      const key = getPlaceKey(item);
      if (visibleKeys.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, term ? 3 : 5);
  }, [recentSearches, term, localSuggestions]);
  const showQuickMenu = showSuggestions &&
    (term.length >= 2 || (!term && visibleRecent.length > 0));
  const quickOptions = term.length >= 2
    ? [...localSuggestions, ...visibleRecent]
    : visibleRecent;
  const stillIndexing = eligibleLayers.length > 0 &&
    indexProgress.done < eligibleLayers.length;
  const saveRecent = (item) => {
    const key = getPlaceKey(item);
    setRecentSearches((previous) => [
      item,
      ...previous.filter((previousItem) => getPlaceKey(previousItem) !== key),
    ].slice(0, 5));
  };
  const selectLocation = (item) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const title = getPlaceTitle(item);
    const mapTitle = item.kind === "geojson" ? `${getPlaceType(item)}: ${title}` : title;
    onSearch?.({ lat, lon, name: mapTitle });
    saveRecent(item);
    setSelected(item);
    setQuery(getPlaceTitle(item));
    setResults([]);
    setSearched(false);
    setError("");
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };
  const resetSearch = () => {
    requestRef.current?.abort();
    setLoading(false);
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
    setSelected(null);
    setActiveSuggestion(-1);
    setShowSuggestions(true);
    onSearch?.(null);
    inputRef.current?.focus();
  };
  const handleChange = (value) => {
    requestRef.current?.abort();
    setLoading(false);
    setQuery(value);
    setResults([]);
    setSearched(false);
    setError("");
    setSelected(null);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
  };
  const handleInputKeyDown = (event) => {
    if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      return;
    }
    if (event.key === "ArrowDown" && quickOptions.length > 0) {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion((index) => Math.min(index + 1, quickOptions.length - 1));
    }
    if (event.key === "ArrowUp" && quickOptions.length > 0) {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && showSuggestions && activeSuggestion >= 0 && quickOptions[activeSuggestion]) {
      event.preventDefault();
      selectLocation(quickOptions[activeSuggestion]);
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setError("Digite um local ou suas coordenadas.");
      inputRef.current?.focus();
      return;
    }
    const coordinates = parseCoordinates(value);
    if (coordinates) {
      selectLocation({
        place_id: `coords:${coordinates.lat},${coordinates.lon}`,
        display_name: `Coordenadas: ${coordinates.lat}, ${coordinates.lon}`,
        kind: "coordinates",
        ...coordinates,
      });
      return;
    }
    if (value.length < 3) {
      setError("Informe pelo menos 3 caracteres para a busca externa.");
      return;
    }
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    const key = `${scope}:${normalize(value)}`;
    if (geocoderCacheRef.current.has(key)) {
      setResults(geocoderCacheRef.current.get(key));
      setSearched(true);
      setSelected(null);
      setError("");
      return;
    }
    if (loading) return;
    if (Date.now() - lastRequestAtRef.current < 1200) {
      setError("Aguarde um instante antes de fazer outra pesquisa.");
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    lastRequestAtRef.current = Date.now();
    setLoading(true);
    setSearched(false);
    setSelected(null);
    setResults([]);
    setError("");
    const fullQuery = scope === "sobral" && !/\bsobral\b/i.test(value)
      ? `${value}, Sobral, Ceará, Brasil` : value;
    const params = new URLSearchParams({
      q: fullQuery,
      format: "jsonv2",
      "accept-language": "pt-BR",
      countrycodes: "br",
      addressdetails: "1",
      limit: "6",
    });
    if (scope === "sobral") {
      params.set("viewbox", SOBRAL_VIEWBOX);
      params.set("bounded", "0");
    }
    try {
      const response = await fetch(`${GEOCODER_URL}?${params}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("Limite de consultas atingido. Tente novamente mais tarde.");
        throw new Error("Não foi possível consultar o serviço de localização.");
      }
      const data = await response.json();
      if (controller.signal.aborted) return;
      const places = Array.isArray(data)
        ? data.filter((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
        : [];
      geocoderCacheRef.current.set(key, places);
      setResults(places);
      setSearched(true);
    } catch (cause) {
      if (controller.signal.aborted) return;
      console.error("Erro ao pesquisar local:", cause);
      setError(cause.message || "Não foi possível pesquisar.");
    } finally {
      if (requestRef.current === controller) {
        setLoading(false);
        requestRef.current = null;
      }
    }
  };
  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 md:p-5" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="search-input" className="block text-sm font-bold text-slate-800">
          Onde você quer ir?
        </label>
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            autoComplete="off"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Rua, bairro, escola ou coordenadas"
            aria-label="Pesquisar um local no mapa"
            aria-expanded={showQuickMenu}
            aria-controls={showQuickMenu ? "sobral-quick-suggestions" : undefined}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={resetSearch}
              title="Limpar pesquisa"
              aria-label="Limpar pesquisa"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {showQuickMenu && (
          <section
            id="sobral-quick-suggestions"
            aria-label="Sugestões de locais"
            className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm"
          >
            {term.length >= 2 && (
              <>
                <div className="flex items-center justify-between bg-blue-50 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800">
                    <Database size={14} /> Locais dos mapas de Sobral
                  </span>
                  {stillIndexing && <Loader2 size={14} className="animate-spin text-blue-600" aria-label="Indexando mapas" />}
                </div>
                {localSuggestions.length > 0 ? (
                  <div className="max-h-52 overflow-y-auto">
                    {localSuggestions.map((place, index) => (
                      <button
                        key={getPlaceKey(place)}
                        type="button"
                        onClick={() => selectLocation(place)}
                        className={`flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 ${activeSuggestion === index ? "bg-blue-50" : "hover:bg-blue-50"}`}
                      >
                        <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="min-w-0 truncate text-xs font-semibold text-slate-800" title={place.featureName}>{place.featureName}</span>
                            <span className="shrink-0 text-[10px] font-semibold text-blue-700">{getPlaceType(place)}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-600" title={getPlaceContext(place)}>{getPlaceContext(place)}</span>
                          <span className="mt-0.5 block truncate text-[10px] text-slate-400" title={place.layerName}>Camada: {place.layerName}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-3 text-xs leading-relaxed text-slate-500">
                    {stillIndexing
                      ? "Preparando as sugestões dos mapas cadastrados..."
                      : "Nenhuma feição encontrada nos mapas indexados. Use Buscar no mapa para consultar endereços."}
                  </p>
                )}
              </>
            )}
            {visibleRecent.length > 0 && (
              <>
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <Clock3 size={14} /> Buscas recentes
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecentSearches([])}
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
                {visibleRecent.map((place, index) => (
                  <button
                    key={`recent-${getPlaceKey(place)}`}
                    type="button"
                    onClick={() => selectLocation(place)}
                    className={`flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 ${activeSuggestion === localSuggestions.length + index ? "bg-blue-50" : "hover:bg-blue-50"}`}
                  >
                    <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-700">{getPlaceTitle(place)}</span>
                      {place.kind === "geojson" ? (
                        <>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-600">{getPlaceType(place)} · {getPlaceContext(place)}</span>
                          <span className="mt-0.5 block truncate text-[10px] text-slate-400">Camada: {place.layerName}</span>
                        </>
                      ) : (
                        <span className="mt-0.5 block truncate text-[11px] text-slate-500">{getPlaceSubtitle(place)}</span>
                      )}
                    </span>
                  </button>
                ))}
              </>
            )}
          </section>
        )}
        <div className="flex items-center justify-between gap-2 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={scope === "sobral"}
              onChange={(event) => {
                requestRef.current?.abort();
                setLoading(false);
                setScope(event.target.checked ? "sobral" : "brasil");
                setResults([]);
                setSearched(false);
                setError("");
                setSelected(null);
              }}
              className="h-4 w-4 accent-blue-700"
            />
            Priorizar Sobral
          </label>
          <span className="text-[11px] text-slate-400">Brasil</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
          {loading ? "Pesquisando..." : "Buscar no mapa"}
        </button>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Digite para ver sugestões dos mapas municipais. Clique em uma sugestão para localizá-la.
          Para pesquisar outros endereços, pressione Enter ou use Buscar no mapa.
          Coordenadas: -3.6892, -40.3489.
        </p>
      </form>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {selected && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
            <CheckCircle2 size={16} /> Local localizado no mapa
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{getPlaceTitle(selected)}</p>
          {selected.kind === "geojson" ? (
              <>
                <p className="mt-1 text-xs font-semibold text-blue-700">{getPlaceType(selected)}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{getPlaceContext(selected)}</p>
                <p className="mt-1 text-[11px] text-slate-500">Camada: {selected.layerName}</p>
              </>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{getPlaceSubtitle(selected)}</p>
            )}
          <button type="button" onClick={resetSearch} className="mt-3 text-xs font-bold text-blue-700 hover:underline">
            Fazer outra pesquisa
          </button>
        </div>
      )}
      {searched && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Resultados da pesquisa">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2.5">
            <h3 className="text-xs font-bold text-slate-700">Resultados externos</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">{results.length}</span>
          </div>
          {results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              {results.map((item) => (
                <button
                  key={getPlaceKey(item)}
                  type="button"
                  onClick={() => selectLocation(item)}
                  className="flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-blue-50"
                >
                  <MapPin size={17} className="mt-0.5 shrink-0 text-blue-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{getPlaceTitle(item)}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{getPlaceSubtitle(item)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-center">
              <Compass size={24} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-bold text-slate-700">Nenhum endereço encontrado</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Tente outro nome ou desmarque Priorizar Sobral para ampliar a pesquisa.
              </p>
            </div>
          )}
        </section>
      )}
      <p className="text-center text-[10px] text-slate-400">
        Pesquisa externa: © OpenStreetMap contributors (Nominatim). Sugestões locais: camadas GeoJSON do sistema.
      </p>
    </div>
  );
}
