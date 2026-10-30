import { createElement, useEffect, useState } from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { GeoJSON } from "react-leaflet";

import L from "leaflet";

import {

  Baby,

  Bike,

  BookOpen,

  Building2,

  Bus,

  Church,

  Cross,

  Droplets,

  Flame,

  Flower2,

  GraduationCap,

  HeartPulse,

  Hospital,

  Landmark,

  MapPin,

  ParkingCircle,

  Pill,

  Recycle,

  School,

  Shield,

  ShoppingCart,

  Train,

  Trees,

} from "lucide-react";

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

// Marcadores temáticos, escolhidos a partir dos atributos do GeoJSON.

// O cadastro da camada e os GeoJSONs não precisam ser alterados.

const POINT_ICONS = {

  school: { component: School, color: "#2563eb" },

  kindergarten: { component: Baby, color: "#0891b2" },

  university: { component: GraduationCap, color: "#7c3aed" },

  hospital: { component: Hospital, color: "#dc2626" },

  health: { component: HeartPulse, color: "#e11d48" },

  pharmacy: { component: Pill, color: "#be123c" },

  park: { component: Trees, color: "#15803d" },

  playground: { component: Flower2, color: "#16a34a" },

  bus: { component: Bus, color: "#d97706" },

  bicycle: { component: Bike, color: "#0d9488" },

  train: { component: Train, color: "#4f46e5" },

  museum: { component: Landmark, color: "#9333ea" },

  library: { component: BookOpen, color: "#2563eb" },

  police: { component: Shield, color: "#475569" },

  fire: { component: Flame, color: "#ea580c" },

  government: { component: Building2, color: "#1d4ed8" },

  shopping: { component: ShoppingCart, color: "#c026d3" },

  worship: { component: Church, color: "#64748b" },

  water: { component: Droplets, color: "#0284c7" },

  recycling: { component: Recycle, color: "#16a34a" },

  parking: { component: ParkingCircle, color: "#64748b" },

  firstAid: { component: Cross, color: "#dc2626" },

  default: { component: MapPin, color: "#2563eb" },

};

// Armazena um ícone por combinação de tipo, tamanho e cor.

// Evita renderizar o mesmo SVG centenas de vezes no mapa.

const markerIconCache = new Map();

function getPointCategory(feature, layer) {

  const properties = feature?.properties || {};

  const tags = properties.tags && typeof properties.tags === "object" ? properties.tags : {};

  const attr = (key) => String(properties[key] ?? tags[key] ?? "").toLowerCase().trim();

  const amenity = attr("amenity");

  const healthcare = attr("healthcare");

  const leisure = attr("leisure");

  const tourism = attr("tourism");

  const highway = attr("highway");

  const transport = attr("public_transport");

  const railway = attr("railway");

  if (amenity === "kindergarten") return "kindergarten";

  if (amenity === "school") return "school";

  if (["college", "university"].includes(amenity)) return "university";

  if (amenity === "hospital" || healthcare === "hospital") return "hospital";

  if (["clinic", "doctors", "dentist", "health_centre"].includes(amenity) ||

      ["clinic", "doctor", "dentist", "centre", "health_post"].includes(healthcare)) return "health";

  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";

  if (["park", "garden", "nature_reserve"].includes(leisure)) return "park";

  if (leisure === "playground") return "playground";

  if (["bus_station"].includes(amenity) || highway === "bus_stop" || transport === "platform" && attr("bus") === "yes") return "bus";

  if (["bicycle_parking", "bicycle_rental"].includes(amenity)) return "bicycle";

  if (["station", "halt", "tram_stop"].includes(railway)) return "train";

  if (tourism === "museum" || tourism === "attraction" && attr("historic")) return "museum";

  if (amenity === "library") return "library";

  if (amenity === "police") return "police";

  if (amenity === "fire_station") return "fire";

  if (["townhall", "public_building", "courthouse"].includes(amenity)) return "government";

  if (amenity === "place_of_worship") return "worship";

  if (amenity === "drinking_water") return "water";

  if (amenity === "recycling") return "recycling";

  if (amenity === "parking") return "parking";

  if (attr("shop")) return "shopping";

  if (amenity === "first_aid") return "firstAid";

  // Para arquivos GeoJSON próprios que não possuem tags do OpenStreetMap,

  // considera também a descrição da camada/subcategoria.

  const hint = [

    layer?.name,

    layer?.subcategory?.name,

    layer?.subcategory?.category?.name,

    attr("categoria"),

    attr("tipo"),

  ].filter(Boolean).join(" ").toLowerCase();

  if (/infantil|creche/.test(hint)) return "kindergarten";

  if (/universid|faculdade|ensino superior/.test(hint)) return "university";

  if (/escola|educa|ensino/.test(hint)) return "school";

  if (/farm[aá]c/.test(hint)) return "pharmacy";

  if (/hospital/.test(hint)) return "hospital";

  if (/sa[uú]de|cl[ií]nica|posto de sa[uú]de|ubs/.test(hint)) return "health";

  if (/parque|pra[cç]a|[aá]rea verde/.test(hint)) return "park";

  if (/biblioteca/.test(hint)) return "library";

  if (/museu|patrim[oô]nio|cultur/.test(hint)) return "museum";

  if (/ônibus|onibus|transporte p[uú]blico|parada/.test(hint)) return "bus";

  if (/ciclovia|bicicleta/.test(hint)) return "bicycle";

  if (/pol[ií]cia|seguran[cç]a/.test(hint)) return "police";

  if (/hidr|[aá]gua/.test(hint)) return "water";

  return "default";

}

function getMarkerIcon(category, savedStyle) {

  const style = POINT_ICONS[category] || POINT_ICONS.default;

  const customColor = savedStyle?.cor;

  // Só aceita hexadecimais, evitando introduzir CSS arbitrário em HTML.

  const color = /^#[0-9a-f]{6}$/i.test(customColor || "") ? customColor : style.color;

  const rawSize = Number(savedStyle?.tamanho_ponto);

  const size = savedStyle?.tamanho_ponto !== undefined && Number.isFinite(rawSize)

    ? Math.min(48, Math.max(28, Math.round(rawSize + 16)))

    : 36;

  const key = `${category}|${color}|${size}`;

  if (markerIconCache.has(key)) return markerIconCache.get(key);

  const svg = renderToStaticMarkup(createElement(style.component, {

    size: Math.round(size * 0.54),

    strokeWidth: 2.3,

    "aria-hidden": true,

  }));

  const icon = L.divIcon({

    html: `<span class="sobral-geojson-point-icon" style="--sobral-pin-color:${color};--sobral-pin-size:${size}px">${svg}</span>`,

    className: "sobral-geojson-marker",

    iconSize: [size, size],

    iconAnchor: [size / 2, size / 2],

    popupAnchor: [0, -size / 2],

    tooltipAnchor: [0, -size / 2],

  });

  markerIconCache.set(key, icon);

  return icon;

}

function pointForFeature(feature, latlng, layer) {

  const category = getPointCategory(feature, layer);

  const icon = getMarkerIcon(category, feature?.properties?.estilo);

  return L.marker(latlng, { icon });

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

// Dicionários de apresentação: os dados originais do GeoJSON continuam intactos.

// Os atributos são traduzidos apenas nos popups, sem interferir nos ícones temáticos.

const POPUP_ATTRIBUTE_LABELS = {

  "@id": "Identificador OSM",

  "@geometry": "Geometria",

  "id_2": "ID",

  "osm_id": "Identificador OSM",

  "addr:city": "Cidade",

  "addr:country": "País",

  "addr:district": "Distrito",

  "addr:state": "Estado",

  "addr:housenumber": "Número",

  "addr:postcode": "CEP",

  "addr:street": "Logradouro",

  "addr:suburb": "Bairro",

  "addr:neighbourhood": "Bairro",

  "addr:place": "Localidade",

  "addr:unit": "Unidade",

  "amenity": "Tipo de estabelecimento",

  "healthcare": "Serviço de saúde",

  "healthcare:speciality": "Especialidade médica",

  "leisure": "Tipo de área de lazer",

  "tourism": "Tipo de atração turística",

  "historic": "Patrimônio histórico",

  "operator": "Instituição responsável",

  "operator:type": "Tipo de administração",

  "brand": "Marca",

  "check_date": "Data de verificação",

  "check:date": "Data de verificação",

  "survey:date": "Data do levantamento",

  "start_date": "Data de início",

  "end_date": "Data de encerramento",

  "level": "Nível",

  "building:levels": "Número de pavimentos",

  "building": "Tipo de edificação",

  "opening_hours": "Horário de funcionamento",

  "phone": "Telefone",

  "contact:phone": "Telefone",

  "email": "E-mail",

  "contact:email": "E-mail",

  "website": "Site",

  "contact:website": "Site",

  "wheelchair": "Acessibilidade para cadeirantes",

  "toilets:wheelchair": "Banheiro acessível",

  "tactile_paving": "Piso tátil",

  "description": "Descrição",

  "desc": "Descrição",

  "descricao": "Descrição",

  "descrição": "Descrição",

  "source": "Fonte dos dados",

  "source:geometry": "Fonte da geometria",

  "source:date": "Data da fonte",

  "name:pt": "Nome em português",

  "alt_name": "Nome alternativo",

  "official_name": "Nome oficial",

  "short_name": "Nome abreviado",

  "ref": "Referência",

  "highway": "Tipo de via",

  "public_transport": "Transporte público",

  "railway": "Tipo de infraestrutura ferroviária",

  "route": "Tipo de rota",

  "surface": "Tipo de pavimentação",

  "oneway": "Sentido único",

  "lanes": "Número de faixas",

  "maxspeed": "Velocidade máxima",

  "bridge": "Ponte",

  "tunnel": "Túnel",

  "lit": "Iluminação",

  "access": "Acesso",

  "foot": "Acesso a pedestres",

  "bicycle": "Acesso de bicicletas",

  "motor_vehicle": "Acesso de veículos motorizados",

  "shop": "Tipo de comércio",

  "landuse": "Uso do solo",

  "natural": "Elemento natural",

  "waterway": "Tipo de curso d'água",

  "sport": "Modalidade esportiva",

  "religion": "Religião",

  "denomination": "Denominação religiosa",

  "population": "População",

  "capacity": "Capacidade",

  "wikidata": "Wikidata",

  "wikipedia": "Wikipédia",

  "lei": "Legislação",

  "categoria": "Categoria",

  "tipo": "Tipo",

};

const POPUP_VALUE_TRANSLATIONS = {

  amenity: {

    school: "Escola", kindergarten: "Educação infantil", university: "Universidade",

    college: "Faculdade", hospital: "Hospital", clinic: "Clínica",

    doctors: "Consultório médico", dentist: "Consultório odontológico",

    pharmacy: "Farmácia", health_centre: "Centro de saúde",

    library: "Biblioteca", place_of_worship: "Local de culto",

    police: "Delegacia de polícia", fire_station: "Corpo de bombeiros",

    townhall: "Prefeitura", courthouse: "Fórum", public_building: "Prédio público",

    bus_station: "Terminal rodoviário", parking: "Estacionamento",

    bicycle_parking: "Estacionamento de bicicletas", bicycle_rental: "Aluguel de bicicletas",

    drinking_water: "Água potável", recycling: "Ponto de reciclagem",

    first_aid: "Primeiros socorros", bank: "Banco", atm: "Caixa eletrônico",

    restaurant: "Restaurante", cafe: "Cafeteria", fast_food: "Lanchonete",

    marketplace: "Mercado", community_centre: "Centro comunitário",

    social_facility: "Equipamento de assistência social",

  },

  healthcare: {

    hospital: "Hospital", clinic: "Clínica", doctor: "Consultório médico",

    dentist: "Consultório odontológico", pharmacy: "Farmácia",

    centre: "Centro de saúde", health_post: "Posto de saúde",

    laboratory: "Laboratório", physiotherapist: "Fisioterapia",

  },

  leisure: {

    park: "Parque", garden: "Jardim", nature_reserve: "Reserva natural",

    playground: "Parque infantil", sports_centre: "Centro esportivo",

    pitch: "Quadra esportiva", stadium: "Estádio", swimming_pool: "Piscina",

    fitness_centre: "Academia", recreation_ground: "Área de lazer",

  },

  tourism: {

    museum: "Museu", attraction: "Atração turística", viewpoint: "Mirante",

    artwork: "Obra de arte", information: "Informações turísticas",

    hotel: "Hotel", hostel: "Albergue", guest_house: "Pousada",

  },

  public_transport: {

    platform: "Plataforma de embarque", station: "Estação", stop_position: "Ponto de parada",

  },

  highway: {

    bus_stop: "Parada de ônibus", residential: "Rua residencial",

    primary: "Via principal", secondary: "Via secundária", tertiary: "Via terciária",

    trunk: "Via expressa", motorway: "Rodovia", service: "Via de serviço",

    pedestrian: "Via de pedestres", footway: "Caminho de pedestres",

    cycleway: "Ciclovia", path: "Caminho", steps: "Escadaria",

    unclassified: "Via não classificada", living_street: "Rua compartilhada",

  },

  railway: {

    station: "Estação", halt: "Parada", tram_stop: "Parada de bonde",

    rail: "Ferrovia", light_rail: "Veículo leve sobre trilhos",

  },

  surface: {

    asphalt: "Asfalto", concrete: "Concreto", paved: "Pavimentada",

    unpaved: "Não pavimentada", paving_stones: "Calçamento",

    cobblestone: "Paralelepípedo", gravel: "Cascalho",

    ground: "Terra", dirt: "Terra", sand: "Areia", grass: "Grama",

  },

  building: {

    school: "Escola", university: "Universidade", hospital: "Hospital",

    residential: "Residencial", apartments: "Prédio de apartamentos",

    house: "Casa", commercial: "Comercial", public: "Prédio público",

    government: "Prédio governamental", church: "Igreja",

  },

  landuse: {

    residential: "Residencial", commercial: "Comercial", industrial: "Industrial",

    retail: "Comércio varejista", farmland: "Área agrícola", forest: "Floresta",

    grass: "Gramado", cemetery: "Cemitério", recreation_ground: "Área de lazer",

  },

  access: {

    yes: "Permitido", no: "Proibido", private: "Privado",

    permissive: "Permitido com restrições", designated: "Destinado a esse uso",

    customers: "Somente clientes", destination: "Somente acesso ao destino",

  },

  "operator:type": {

    public: "Pública", private: "Privada", government: "Governamental",

    ngo: "Organização não governamental", religious: "Religiosa",

  },

  wheelchair: { yes: "Acessível", no: "Não acessível", limited: "Acesso limitado", designated: "Acesso dedicado" },

  "toilets:wheelchair": { yes: "Sim", no: "Não", limited: "Parcialmente" },

};

const YES_NO_POPUP_KEYS = new Set([

  "oneway", "lit", "bridge", "tunnel", "tactile_paving", "foot", "bicycle", "motor_vehicle"

]);

const POPUP_DATE_KEYS = new Set([

  "check_date", "check:date", "survey:date", "start_date", "end_date", "source:date"

]);

const POPUP_HIDDEN_KEYS = new Set(["@id", "@geometry"]);

function displayPopupValue(key, value) {

  if (value !== null && typeof value === "object") return JSON.stringify(value);

  if (typeof value === "boolean") return value ? "Sim" : "Não";

  const original = String(value);

  const normalizedValue = original.trim().toLowerCase();

  const translated = POPUP_VALUE_TRANSLATIONS[key]?.[normalizedValue];

  if (translated) return translated;

  if (YES_NO_POPUP_KEYS.has(key)) {

    if (normalizedValue === "yes") return "Sim";

    if (normalizedValue === "no") return "Não";

  }

  // Converte apenas datas completas ISO. Evita deslocamentos por fuso horário.

  if (POPUP_DATE_KEYS.has(key) && /^\d{4}-\d{2}-\d{2}$/.test(original)) {

    const [year, month, day] = original.split("-");

    return `${day}/${month}/${year}`;

  }

  return original;

}

function formatPopupAttribute(key, value) {

  const normalized = key.toLowerCase();

  // Medições realizadas no editor continuam sendo exibidas em km ou km².

  if (normalized === "area_m2") return { label: "Área", value: formatUnit(value, 1_000_000, "km²") };

  if (["area_km2", "area_km²"].includes(normalized)) return { label: "Área", value: formatUnit(value, 1, "km²") };

  if (normalized === "perimetro_m") return { label: "Perímetro", value: formatUnit(value, 1_000, "km") };

  if (["perimetro_km", "perímetro_km"].includes(normalized)) return { label: "Perímetro", value: formatUnit(value, 1, "km") };

  if (normalized === "comprimento_m") return { label: "Distância", value: formatUnit(value, 1_000, "km") };

  if (["comprimento_km", "distancia_km", "distância_km"].includes(normalized)) return { label: "Distância", value: formatUnit(value, 1, "km") };

  const friendlyName = POPUP_ATTRIBUTE_LABELS[normalized];

  const fallbackName = key.replace(/[_:]/g, " ").replace(/^./, (letter) => letter.toUpperCase());

  return {

    label: friendlyName || fallbackName,

    value: displayPopupValue(normalized, value),

  };

}

// Alguns GeoJSONs do OSM trazem campos dentro de "tags". Exibimos os campos

// individualmente em vez de um objeto JSON, priorizando os campos do nível principal.

function getPopupAttributes(properties) {

  const attributes = Object.entries(properties).filter(([key]) => key !== "tags");

  const tags = properties.tags;

  if (tags && typeof tags === "object" && !Array.isArray(tags)) {

    const known = new Set(attributes.map(([key]) => key.toLowerCase()));

    for (const [key, value] of Object.entries(tags)) {

      if (!known.has(key.toLowerCase())) attributes.push([key, value]);

    }

  }

  return attributes;

}

// Estilos somente de apresentacao: sem alterar os dados ou os enderecos GeoJSON.

const PRESENTATION_STYLE_ID = "sobral-geojson-popup-visual-v4";

function ensurePresentationStyles() {

  if (document.getElementById(PRESENTATION_STYLE_ID)) return;

  const element = document.createElement("style");

  element.id = PRESENTATION_STYLE_ID;

  element.textContent = `

    /* Ícones temáticos dos pontos: sem imagem externa e sem alterar o GeoJSON. */

    .leaflet-marker-icon.sobral-geojson-marker {

      background: transparent !important;

      border: 0 !important;

    }

    .sobral-geojson-point-icon {

      width: var(--sobral-pin-size);

      height: var(--sobral-pin-size);

      border: 2px solid #fff;

      border-radius: 50%;

      background: var(--sobral-pin-color);

      box-shadow: 0 3px 9px rgba(15, 23, 42, .28);

      display: flex;

      justify-content: center;

      align-items: center;

      color: #fff;

      box-sizing: border-box;

      transition: transform .15s ease, box-shadow .15s ease;

    }

    .sobral-geojson-point-icon svg { display: block; flex-shrink: 0; }

    .leaflet-marker-icon.sobral-geojson-marker:hover .sobral-geojson-point-icon {

      transform: scale(1.12);

      box-shadow: 0 5px 14px rgba(15, 23, 42, .35);

    }

    .leaflet-tooltip.sobral-geojson-point-tooltip {

      background: rgba(255, 255, 255, .98) !important;

      color: #1e40af !important;

      border: 1px solid #bfdbfe !important;

      border-radius: 9px !important;

      box-shadow: 0 4px 12px rgba(15, 23, 42, .18) !important;

      padding: 6px 10px !important;

      font: 700 12px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif !important;

      white-space: nowrap !important;

    }

    /* Aparência original dos rótulos de bairros e outras geometrias. */
    .leaflet-tooltip.sobral-geojson-label {
      display: inline-block !important;
      width: max-content !important;
      min-width: max-content !important;
      max-width: none !important;
      white-space: nowrap !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
      writing-mode: horizontal-tb !important;
      background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%) !important;
      color: #1e40af !important;
      border: 1px solid #bfdbfe !important;
      border-left: 4px solid #2563eb !important;
      padding: 9px 14px !important;
      border-radius: 12px !important;
      font: 800 12px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif !important;
      box-shadow: 0 4px 14px rgba(30, 64, 175, .16) !important;
      text-align: center !important;
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

    .sobral-feature-detail strong { color: #475569; flex: 0 0 43%; min-width: 0; overflow-wrap: anywhere; }

    .sobral-feature-detail span { color: #0f172a; flex: 1; min-width: 0; text-align: right; overflow-wrap: anywhere; }

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

  const omitKeys = new Set(["nome", "name", "title", "estilo", "forma", "descricao", "descrição", "description", "desc", ...POPUP_HIDDEN_KEYS]);

  for (const [key, value] of getPopupAttributes(properties)) {

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

      pointToLayer={(feature, latlng) => pointForFeature(feature, latlng, layer)}

      onEachFeature={(feature, leafletLayer) => {

        const properties = feature.properties || {};

        const name = properties.nome || properties.name || properties.title;

        const geometryType = feature.geometry?.type || "";

        const isPoint = geometryType === "Point" || geometryType === "MultiPoint";

        const showLabel = [

          "Polygon", "MultiPolygon", "LineString", "MultiLineString", "Point", "MultiPoint"

        ].includes(geometryType);

        if (name && showLabel) {

          leafletLayer.bindTooltip(String(name), {

            // Pontos só mostram o nome ao passar o mouse; áreas/linhas mantêm os rótulos.

            permanent: !isPoint,

            direction: isPoint ? "top" : "center",

            className: isPoint ? "sobral-geojson-point-tooltip" : "sobral-geojson-label",

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
