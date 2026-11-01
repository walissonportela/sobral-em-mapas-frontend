import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GeoJSON, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  Ambulance,
  Baby,
  Banknote,
  Bike,
  BookOpen,
  Building2,
  Bus,
  BusFront,
  Camera,
  CarFront,
  Church,
  Clapperboard,
  Coffee,
  Cross,
  Drama,
  Droplets,
  Dumbbell,
  Factory,
  Flame,
  Flower2,
  Footprints,
  Fuel,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Hospital,
  Hotel,
  Landmark,
  Leaf,
  MapPin,
  Microscope,
  Mountain,
  Music2,
  Palette,
  ParkingCircle,
  Pill,
  Recycle,
  Route,
  School,
  Shield,
  ShoppingCart,
  Sprout,
  Stethoscope,
  Store,
  TentTree,
  Theater,
  Train,
  TreePine,
  Trees,
  Trophy,
  UtensilsCrossed,
  Volleyball,
  Warehouse,
  Waves,
  WavesLadder,
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

// Abaixo deste zoom, apenas as geometrias permanecem no mapa.
// Evita ícones agrupados e rótulos gigantes quando o usuário afasta muito.
// Zoom 11 ou maior restaura automaticamente os marcadores e os nomes elegíveis.
const MIN_SYMBOL_ZOOM = 12;

function styleForFeature(feature, colorOverride = null, strokeWidthOverride = null) {
  // A espessura escolhida na sidebar vale somente nesta visualização.
  // Se não houver preferência, preserva a espessura original do GeoJSON.
  const requestedWidth = strokeWidthOverride == null ? null : Number(strokeWidthOverride);
  const temporaryWidth = requestedWidth !== null && Number.isFinite(requestedWidth)
    ? Math.min(12, Math.max(1, requestedWidth))
    : null;
  const saved = feature?.properties?.estilo;
  if (!saved || typeof saved !== "object") {
    return {
      ...DEFAULT_STYLE,
      ...(colorOverride ? { color: colorOverride, fillColor: colorOverride } : {}),
      ...(temporaryWidth !== null ? { weight: temporaryWidth } : {}),
    };
  }
  const color = /^#[0-9a-f]{6}$/i.test(saved.cor || "") ? saved.cor : DEFAULT_STYLE.color;
  const width = Number(saved.espessura);
  const opacity = Number(saved.opacidade_preenchimento);
  const savedLineOpacity = Number(saved.opacidade_linha);
  const style = ["solid", "dashed", "dotted"].includes(saved.tipo_linha)
    ? saved.tipo_linha
    : "solid";
  return {
    color: colorOverride || color,
    weight: temporaryWidth ?? (Number.isFinite(width) ? Math.min(20, Math.max(1, width)) : 2),
    opacity: saved.opacidade_linha !== undefined && Number.isFinite(savedLineOpacity)
      ? Math.min(1, Math.max(0, savedLineOpacity))
      : 1,
    fillColor: colorOverride || color,
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
  // Educação e pesquisa
  school: { component: School, color: "#2563eb" },
  kindergarten: { component: Baby, color: "#0891b2" },
  university: { component: GraduationCap, color: "#7c3aed" },
  college: { component: GraduationCap, color: "#6366f1" },
  library: { component: BookOpen, color: "#1d4ed8" },
  research: { component: Microscope, color: "#4338ca" },

  // Saúde e atendimento
  hospital: { component: Hospital, color: "#dc2626" },
  health: { component: HeartPulse, color: "#e11d48" },
  clinic: { component: Stethoscope, color: "#e11d48" },
  dentist: { component: Stethoscope, color: "#db2777" },
  pharmacy: { component: Pill, color: "#be123c" },
  laboratory: { component: Microscope, color: "#c026d3" },
  ambulance: { component: Ambulance, color: "#dc2626" },
  firstAid: { component: Cross, color: "#dc2626" },

  // Esporte, lazer e recreação
  sports: { component: Dumbbell, color: "#2563eb" },
  sportsCentre: { component: Trophy, color: "#1d4ed8" },
  sportsHall: { component: Volleyball, color: "#2563eb" },
  pitch: { component: Volleyball, color: "#0284c7" },
  stadium: { component: Trophy, color: "#1e40af" },
  fitness: { component: Dumbbell, color: "#0d9488" },
  swimming: { component: WavesLadder, color: "#0891b2" },
  runningTrack: { component: Footprints, color: "#2563eb" },
  playground: { component: Flower2, color: "#16a34a" },

  // Meio ambiente, recursos naturais e saneamento
  park: { component: Trees, color: "#15803d" },
  garden: { component: Flower2, color: "#16a34a" },
  natureReserve: { component: TreePine, color: "#166534" },
  vegetation: { component: Leaf, color: "#22c55e" },
  planting: { component: Sprout, color: "#65a30d" },
  water: { component: Droplets, color: "#0284c7" },
  river: { component: Waves, color: "#0369a1" },
  recycling: { component: Recycle, color: "#16a34a" },

  // Mobilidade e transporte
  bus: { component: Bus, color: "#d97706" },
  busStation: { component: BusFront, color: "#ea580c" },
  bicycle: { component: Bike, color: "#0d9488" },
  bicycleParking: { component: Bike, color: "#059669" },
  train: { component: Train, color: "#4f46e5" },
  road: { component: Route, color: "#64748b" },
  parking: { component: ParkingCircle, color: "#475569" },
  fuel: { component: Fuel, color: "#b45309" },
  vehicle: { component: CarFront, color: "#475569" },

  // Cultura, patrimônio e turismo
  museum: { component: Landmark, color: "#9333ea" },
  monument: { component: Landmark, color: "#7e22ce" },
  historic: { component: Landmark, color: "#a16207" },
  artGallery: { component: Palette, color: "#c026d3" },
  theater: { component: Theater, color: "#7c3aed" },
  cinema: { component: Clapperboard, color: "#9333ea" },
  culturalCentre: { component: Drama, color: "#a21caf" },
  music: { component: Music2, color: "#c026d3" },
  attraction: { component: Camera, color: "#7c3aed" },
  viewpoint: { component: Mountain, color: "#64748b" },
  camping: { component: TentTree, color: "#15803d" },

  // Segurança e serviços públicos
  police: { component: Shield, color: "#334155" },
  fire: { component: Flame, color: "#ea580c" },
  government: { component: Building2, color: "#1d4ed8" },
  courthouse: { component: Landmark, color: "#475569" },
  community: { component: Building2, color: "#2563eb" },
  socialAssistance: { component: HeartHandshake, color: "#0891b2" },
  worship: { component: Church, color: "#64748b" },

  // Comércio e serviços
  shopping: { component: ShoppingCart, color: "#c026d3" },
  market: { component: Store, color: "#d97706" },
  restaurant: { component: UtensilsCrossed, color: "#ea580c" },
  cafe: { component: Coffee, color: "#92400e" },
  hotel: { component: Hotel, color: "#6366f1" },
  bank: { component: Banknote, color: "#15803d" },

  // Infraestrutura e indústria
  industry: { component: Factory, color: "#475569" },
  warehouse: { component: Warehouse, color: "#64748b" },

  // Caso não haja categoria identificável
  default: { component: MapPin, color: "#2563eb" },
};

// Armazena um ícone por combinação de tipo, tamanho e cor.

// Evita renderizar o mesmo SVG centenas de vezes no mapa.

const markerIconCache = new Map();
const clusterIconCache = new Map();

function getPointCategory(feature, layer) {
  const properties = feature?.properties || {};
  const tags = properties.tags && typeof properties.tags === "object" && !Array.isArray(properties.tags)
    ? properties.tags : {};
  // OSM pode exportar tags diretamente em properties ou dentro de properties.tags.
  const attr = (key) => String(properties[key] ?? tags[key] ?? "").toLowerCase().trim();
  const amenity = attr("amenity");
  const healthcare = attr("healthcare");
  const leisure = attr("leisure");
  const tourism = attr("tourism");
  const historic = attr("historic");
  const sport = attr("sport");
  const highway = attr("highway");
  const transport = attr("public_transport");
  const railway = attr("railway");
  const emergency = attr("emergency");
  const shop = attr("shop");
  const natural = attr("natural");
  const waterway = attr("waterway");
  const landuse = attr("landuse");
  const building = attr("building");
  const office = attr("office");

  // 1. Atributos específicos: sempre prevalecem sobre o nome da camada.
  // Educação
  if (amenity === "kindergarten" || amenity === "childcare") return "kindergarten";
  if (amenity === "school" || amenity === "music_school") return "school";
  if (amenity === "university") return "university";
  if (amenity === "college") return "college";
  if (amenity === "library") return "library";
  if (["research_institute", "research", "laboratory"].includes(office)) return "research";

  // Saúde (as categorias mais específicas vêm primeiro)
  if (["ambulance_station", "ambulance"].includes(emergency)) return "ambulance";
  if (amenity === "first_aid" || emergency === "first_aid") return "firstAid";
  if (amenity === "hospital" || healthcare === "hospital") return "hospital";
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";
  if (amenity === "dentist" || healthcare === "dentist") return "dentist";
  if (healthcare === "laboratory" || amenity === "laboratory") return "laboratory";
  if (["clinic", "doctors"].includes(amenity) || ["clinic", "doctor", "physiotherapist"].includes(healthcare)) return "clinic";
  if (["health_centre", "doctors_office"].includes(amenity) || ["centre", "health_post", "nurse"].includes(healthcare)) return "health";

  // Esporte e lazer: especializações antes de ícones genéricos.
  if (leisure === "playground") return "playground";
  if (leisure === "stadium") return "stadium";
  if (leisure === "sports_hall") return "sportsHall";
  if (leisure === "sports_centre") return "sportsCentre";
  if (leisure === "pitch") return "pitch";
  if (["fitness_centre", "fitness_station"].includes(leisure) || amenity === "gym") return "fitness";
  if (leisure === "swimming_pool" || sport === "swimming") return "swimming";
  if (leisure === "track" || ["running", "athletics"].includes(sport)) return "runningTrack";
  if (leisure === "recreation_ground") return "sports";
  if (sport) return "sports";

  // Meio ambiente e água
  if (leisure === "garden") return "garden";
  if (leisure === "nature_reserve" || ["protected_area", "national_park"].includes(attr("boundary"))) return "natureReserve";
  if (leisure === "park") return "park";
  if (landuse === "forest" || natural === "wood") return "vegetation";
  if (["allotments", "farmland", "orchard"].includes(landuse)) return "planting";
  if (waterway || natural === "water" || natural === "wetland") return "river";
  if (amenity === "drinking_water" || attr("man_made") === "water_works") return "water";
  if (amenity === "recycling" || attr("recycling_type")) return "recycling";

  // Mobilidade e transporte
  if (amenity === "bus_station" || transport === "station" && attr("bus") === "yes") return "busStation";
  if (highway === "bus_stop" || transport === "stop_position" && attr("bus") === "yes" ||
      transport === "platform" && attr("bus") === "yes") return "bus";
  if (amenity === "bicycle_parking") return "bicycleParking";
  if (amenity === "bicycle_rental" || amenity === "bicycle_repair_station" || attr("bicycle") === "designated") return "bicycle";
  if (["station", "halt", "tram_stop", "subway_entrance"].includes(railway)) return "train";
  if (amenity === "parking") return "parking";
  if (amenity === "fuel") return "fuel";
  if (amenity === "car_rental" || amenity === "car_sharing") return "vehicle";
  if (highway && ["motorway_junction", "services", "rest_area"].includes(highway)) return "road";

  // Cultura, turismo e patrimônio histórico
  if (tourism === "museum") return "museum";
  if (["monument", "memorial", "wayside_cross"].includes(historic)) return "monument";
  if (historic) return "historic";
  if (tourism === "gallery" || tourism === "artwork") return "artGallery";
  if (amenity === "theatre") return "theater";
  if (amenity === "cinema") return "cinema";
  if (amenity === "arts_centre" || amenity === "cultural_centre") return "culturalCentre";
  if (amenity === "music_venue") return "music";
  if (tourism === "viewpoint") return "viewpoint";
  if (tourism === "camp_site" || tourism === "caravan_site") return "camping";
  if (["hotel", "hostel", "guest_house", "motel", "apartment"].includes(tourism)) return "hotel";
  if (tourism === "attraction" || tourism === "theme_park") return "attraction";

  // Segurança, governo e serviços sociais
  if (amenity === "police") return "police";
  if (amenity === "fire_station") return "fire";
  if (amenity === "courthouse") return "courthouse";
  if (["townhall", "public_building"].includes(amenity) || office === "government") return "government";
  if (["social_facility", "social_centre"].includes(amenity) || healthcare === "social_work") return "socialAssistance";
  if (amenity === "community_centre") return "community";
  if (amenity === "place_of_worship") return "worship";

  // Comércio e serviços
  if (amenity === "restaurant" || amenity === "fast_food" || amenity === "food_court") return "restaurant";
  if (amenity === "cafe" || amenity === "ice_cream") return "cafe";
  if (amenity === "bank" || amenity === "atm") return "bank";
  if (amenity === "marketplace" || ["supermarket", "convenience", "bakery", "greengrocer"].includes(shop)) return "market";
  if (shop) return "shopping";

  // Infraestrutura
  if (landuse === "industrial" || ["industrial", "factory"].includes(building) || office === "company") return "industry";
  if (building === "warehouse" || landuse === "depot") return "warehouse";

  // 2. GeoJSON sem tags OSM: nomes e campos descritivos da própria feição.
  // Se não encontrar uma especialização, utiliza o nome da camada/subcategoria.
  const featureHint = [
    attr("tipo"), attr("categoria"), attr("name"), attr("nome"), attr("title"),
    attr("description"), attr("descricao"),
  ].filter(Boolean).join(" ");
  const layerHint = [
    layer?.name, layer?.subcategory?.name, layer?.subcategory?.category?.name,
  ].filter(Boolean).join(" ").toLowerCase();

  const categoryFromHint = (hint) => {
    if (!hint) return null;
    if (/creche|educa[cç][aã]o infantil|pr[eé][ -]?escola/.test(hint)) return "kindergarten";
    if (/universid|ensino superior/.test(hint)) return "university";
    if (/faculdade|centro universit[aá]rio/.test(hint)) return "college";
    if (/biblioteca/.test(hint)) return "library";
    if (/escola|col[eé]gio|educa[cç][aã]o|institui[cç][aã]o de ensino/.test(hint)) return "school";
    if (/odontolog|dentista/.test(hint)) return "dentist";
    if (/laborat[oó]rio|exames cl[ií]nicos/.test(hint)) return "laboratory";
    if (/farm[aá]cia/.test(hint)) return "pharmacy";
    if (/hospital/.test(hint)) return "hospital";
    if (/cl[ií]nica|consult[oó]rio/.test(hint)) return "clinic";
    if (/ubs|posto de sa[uú]de|unidade b[aá]sica|csf|centro de sa[uú]de/.test(hint)) return "health";
    if (/amb[uú]l[aâ]ncia|samu/.test(hint)) return "ambulance";
    if (/primeiros socorros/.test(hint)) return "firstAid";
    if (/est[aá]dio/.test(hint)) return "stadium";
    if (/piscina|nata[cç][aã]o/.test(hint)) return "swimming";
    if (/gin[aá]sio|quadra coberta/.test(hint)) return "sportsHall";
    if (/quadra|campo de futebol|campo esportivo/.test(hint)) return "pitch";
    if (/academia|muscula[cç][aã]o/.test(hint)) return "fitness";
    if (/pista de corrida|atletismo/.test(hint)) return "runningTrack";
    if (/centro esportivo|complexo esportivo|esport|arena/.test(hint)) return "sportsCentre";
    if (/playground|parque infantil/.test(hint)) return "playground";
    if (/reserva|[aá]rea de prote[cç][aã]o/.test(hint)) return "natureReserve";
    if (/jardim/.test(hint)) return "garden";
    if (/parque|pra[cç]a|[aá]rea verde/.test(hint)) return "park";
    if (/\brio\b|\blago\b|a[cç]ude|lagoa/.test(hint)) return "river";
    if (/[aá]gua|hidr[aá]ulic/.test(hint)) return "water";
    if (/reciclagem|ecoponto/.test(hint)) return "recycling";
    if (/rodovi[aá]ria|terminal de [oô]nibus/.test(hint)) return "busStation";
    if (/[oô]nibus|parada de [oô]nibus|transporte p[uú]blico/.test(hint)) return "bus";
    if (/biciclet[aá]rio/.test(hint)) return "bicycleParking";
    if (/ciclovia|bicicleta|ciclofaixa/.test(hint)) return "bicycle";
    if (/ferrovia|esta[cç][aã]o ferrovi[aá]ria|trem/.test(hint)) return "train";
    if (/estacionamento/.test(hint)) return "parking";
    if (/posto de combust[ií]vel/.test(hint)) return "fuel";
    if (/sistema vi[aá]rio|malha vi[aá]ria|rodovia/.test(hint)) return "road";
    if (/museu/.test(hint)) return "museum";
    if (/monumento|memorial/.test(hint)) return "monument";
    if (/patrim[oô]nio|hist[oó]ric/.test(hint)) return "historic";
    if (/galeria de arte|artes visuais/.test(hint)) return "artGallery";
    if (/teatro/.test(hint)) return "theater";
    if (/cinema/.test(hint)) return "cinema";
    if (/centro cultural|equipamento cultural/.test(hint)) return "culturalCentre";
    if (/turismo|atra[cç][aã]o tur[ií]stica/.test(hint)) return "attraction";
    if (/pousada|hotel|hospedagem/.test(hint)) return "hotel";
    if (/delegacia|pol[ií]cia|seguran[cç]a p[uú]blica/.test(hint)) return "police";
    if (/bombeiro/.test(hint)) return "fire";
    if (/f[oó]rum|tribunal|justi[cç]a/.test(hint)) return "courthouse";
    if (/prefeitura|secretaria municipal|[oó]rg[aã]o p[uú]blico/.test(hint)) return "government";
    if (/assist[eê]ncia social|cras|creas/.test(hint)) return "socialAssistance";
    if (/centro comunit[aá]rio/.test(hint)) return "community";
    if (/igreja|templo|religioso/.test(hint)) return "worship";
    if (/restaurante|lanchonete/.test(hint)) return "restaurant";
    if (/caf[eé]|cafeteria/.test(hint)) return "cafe";
    if (/mercado|feira|supermercado/.test(hint)) return "market";
    if (/com[eé]rcio|loja|shopping/.test(hint)) return "shopping";
    if (/\bbanco\b|caixa eletr[oô]nico/.test(hint) && !/atl[eé]tica|esportiv/.test(hint)) return "bank";
    if (/ind[uú]stria|f[aá]brica/.test(hint)) return "industry";
    if (/dep[oó]sito|galp[aã]o|armaz[eé]m/.test(hint)) return "warehouse";
    return null;
  };

  return categoryFromHint(featureHint) || categoryFromHint(layerHint) || "default";
}

function getMarkerIcon(category, savedStyle, colorOverride = null) {
  const style = POINT_ICONS[category] || POINT_ICONS.default;
  const customColor = savedStyle?.cor;
  // Só aceita hexadecimais, evitando introduzir CSS arbitrário em HTML.
  const color = colorOverride || (/^#[0-9a-f]{6}$/i.test(customColor || "") ? customColor : style.color);
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
    park: "Parque",
    garden: "Jardim",
    nature_reserve: "Reserva natural",
    playground: "Parque infantil",
    sports_centre: "Centro esportivo",
    sports_hall: "Ginásio esportivo",
    pitch: "Quadra ou campo esportivo",
    stadium: "Estádio",
    swimming_pool: "Piscina",
    fitness_centre: "Academia",
    fitness_station: "Academia ao ar livre",
    recreation_ground: "Área de lazer",
    track: "Pista esportiva",
  },
  sport: {
    gymnastics: "Ginástica",
    soccer: "Futebol",
    football: "Futebol",
    futsal: "Futsal",
    basketball: "Basquete",
    volleyball: "Voleibol",
    beachvolleyball: "Vôlei de praia",
    tennis: "Tênis",
    table_tennis: "Tênis de mesa",
    swimming: "Natação",
    athletics: "Atletismo",
    running: "Corrida",
    cycling: "Ciclismo",
    fitness: "Condicionamento físico",
    fitness_training: "Treinamento físico",
    weightlifting: "Levantamento de peso",
    martial_arts: "Artes marciais",
    boxing: "Boxe",
    judo: "Judô",
    karate: "Caratê",
    handball: "Handebol",
    skateboarding: "Skate",
    badminton: "Badminton",
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
    /* Agrupamentos de pontos: indicam quantos estabelecimentos estão próximos. */
    .leaflet-marker-icon.sobral-geojson-cluster-icon {
      background: transparent !important;
      border: 0 !important;
    }
    .sobral-geojson-cluster-bubble {
      width: var(--sobral-cluster-size);
      height: var(--sobral-cluster-size);
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border: 3px solid #fff;
      border-radius: 50%;
      background: var(--sobral-cluster-color);
      color: white;
      font: 800 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
      box-shadow: 0 3px 11px rgba(15, 23, 42, .3), 0 0 0 5px rgba(37, 99, 235, .15);
      transition: transform .15s ease;
    }
    .sobral-geojson-cluster-icon:hover .sobral-geojson-cluster-bubble {
      transform: scale(1.09);
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

// Em zoom distante, nomes são ocultados para evitar sobreposição de etiquetas.
// A preferência pertence ao componente pai e não é armazenada no GeoJSON.
function featureLabelIsPermanent(mode, geometryType, zoom, layer) {
  if (zoom < MIN_SYMBOL_ZOOM) return false;
  if (mode === "names") return true;
  if (mode === "icons") return false;
  if (["Point", "MultiPoint"].includes(geometryType)) return false;
  if (["LineString", "MultiLineString"].includes(geometryType)) return false;
  const hint = `${layer?.name || ""} ${layer?.subcategory?.name || ""}`.toLowerCase();
  const territorial = /bairro|distrit|territor|limite|perímetro|perimetro/.test(hint);
  return zoom >= (territorial ? 14 : 16);
}

function polygonIconFeatures(geojson, layer, colorOverride) {
  const features = geojson?.type === "FeatureCollection"
    ? geojson.features
    : geojson?.type === "Feature" ? [geojson] : [];
  // Limite intencional para não criar milhares de marcadores em áreas muito densas.
  return features.filter((item) => ["Polygon", "MultiPolygon"].includes(item?.geometry?.type))
    .slice(0, 300)
    .flatMap((feature, index) => {
      try {
        const bounds = L.geoJSON(feature).getBounds();
        if (!bounds.isValid()) return [];
        return [{
          key: String(feature.id ?? index),
          position: bounds.getCenter(),
          feature,
          icon: getMarkerIcon(getPointCategory(feature, layer), feature?.properties?.estilo, colorOverride),
        }];
      } catch {
        return [];
      }
    });
}

// Transforma geometrias pontuais em itens próprios para agrupamento e mantém
// polígonos/linhas no GeoJSON original. Isso evita desenhar os pontos duas vezes.
function separateGeoJSON(data) {
  const shapes = [];
  const points = [];
  const features = data?.type === "FeatureCollection"
    ? (data.features || [])
    : data?.type === "Feature"
      ? [data]
      : data?.type ? [{ type: "Feature", properties: {}, geometry: data }] : [];

  function processGeometry(feature, geometry, id) {
    if (!geometry) return;
    if (geometry.type === "GeometryCollection") {
      (geometry.geometries || []).forEach((item, index) => {
        processGeometry(feature, item, `${id}-${index}`);
      });
      return;
    }
    if (geometry.type === "Point" || geometry.type === "MultiPoint") {
      const coordinates = geometry.type === "Point"
        ? [geometry.coordinates]
        : geometry.coordinates;
      if (!Array.isArray(coordinates)) return;
      coordinates.forEach((coordinatesPair, index) => {
        if (!Array.isArray(coordinatesPair) || coordinatesPair.length < 2) return;
        const longitude = Number(coordinatesPair[0]);
        const latitude = Number(coordinatesPair[1]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
        points.push({
          key: `p-${id}-${index}`,
          feature: {
            ...feature,
            geometry: { type: "Point", coordinates: [longitude, latitude] },
          },
          position: L.latLng(latitude, longitude),
        });
      });
      return;
    }
    shapes.push({ ...feature, geometry });
  }

  features.forEach((feature, index) => {
    processGeometry(feature, feature?.geometry, index);
  });
  return { shapes: { type: "FeatureCollection", features: shapes }, points };
}

// Agrupamento por proximidade em pixels projetados. É recalculado no zoom,
// sem alterar o GeoJSON, e independe de bibliotecas extras no package.json.
function clusterNearbyMarkers(markers, map, zoom) {
  const radius = zoom <= 12 ? 68 : zoom <= 15 ? 58 : 46;
  const cellSize = radius;
  const buckets = new Map();
  const groups = [];
  const squaredRadius = radius * radius;

  for (const item of markers) {
    const projected = map.project(item.position, zoom);
    const cellX = Math.floor(projected.x / cellSize);
    const cellY = Math.floor(projected.y / cellSize);
    let nearest = null;
    let nearestDistance = squaredRadius;

    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        const bucket = buckets.get(`${cellX + offsetX}:${cellY + offsetY}`) || [];
        for (const group of bucket) {
          const dx = projected.x - group.anchorX;
          const dy = projected.y - group.anchorY;
          const distance = dx * dx + dy * dy;
          if (distance <= nearestDistance) {
            nearestDistance = distance;
            nearest = group;
          }
        }
      }
    }

    if (nearest) {
      nearest.items.push(item);
      nearest.sumX += projected.x;
      nearest.sumY += projected.y;
    } else {
      const group = {
        key: item.key,
        items: [item],
        anchorX: projected.x,
        anchorY: projected.y,
        sumX: projected.x,
        sumY: projected.y,
      };
      groups.push(group);
      const bucketKey = `${cellX}:${cellY}`;
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
      buckets.get(bucketKey).push(group);
    }
  }

  return groups.map((group) => ({
    key: `group-${group.key}-${zoom}`,
    items: group.items,
    position: map.unproject(L.point(
      group.sumX / group.items.length,
      group.sumY / group.items.length
    ), zoom),
  }));
}

function getClusterIcon(count, colorOverride) {
  const color = colorOverride || "#1d4ed8";
  const size = count < 10 ? 42 : count < 100 ? 48 : 54;
  const key = `${count}-${color}`;
  if (clusterIconCache.has(key)) return clusterIconCache.get(key);
  const icon = L.divIcon({
    html: `<span class="sobral-geojson-cluster-bubble" style="--sobral-cluster-color:${color};--sobral-cluster-size:${size}px">${count}</span>`,
    className: "sobral-geojson-cluster-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  clusterIconCache.set(key, icon);
  return icon;
}

function featureDisplayName(feature, layer) {
  const props = feature?.properties || {};
  return props.nome || props.name || props.title || layer.name || "Elemento do mapa";
}

// Para marcadores no mesmo endereço, mesmo o maior zoom pode não separá-los.
// A lista permite abrir o popup de cada estabelecimento individualmente.
function showClusterItems(map, group, layer) {
  const root = domElement("div", "sobral-geojson-cluster-list");
  root.style.cssText = "font-family:system-ui,sans-serif;max-height:300px;overflow-y:auto;padding:8px 4px";
  const title = domElement("strong", "", `${group.items.length} elementos neste local`);
  title.style.cssText = "display:block;color:#1e40af;margin-bottom:10px";
  root.appendChild(title);

  group.items.forEach((item) => {
    const button = domElement("button", "", featureDisplayName(item.feature, layer));
    button.type = "button";
    button.style.cssText = "display:block;width:100%;padding:8px;text-align:left;border:0;border-bottom:1px solid #e2e8f0;background:#fff;color:#334155;cursor:pointer";
    button.addEventListener("click", () => {
      L.popup({ className: "sobral-geojson-popup", maxWidth: 360 })
        .setLatLng(item.position)
        .setContent(buildStyledPopup(item.feature, layer))
        .openOn(map);
    });
    root.appendChild(button);
  });
  L.popup({ maxWidth: 360 }).setLatLng(group.position).setContent(root).openOn(map);
}

function SingleFeatureMarker({ item, layer, mode }) {
  const markerRef = useRef(null);
  const name = featureDisplayName(item.feature, layer);
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return undefined;
    marker.bindPopup(buildStyledPopup(item.feature, layer), {
      maxWidth: 360,
      className: "sobral-geojson-popup",
    });
    if (name) {
      marker.bindTooltip(String(name), {
        permanent: mode === "names",
        direction: "top",
        className: "sobral-geojson-point-tooltip",
        opacity: 0.95,
      });
    }
    return () => {
      marker.unbindPopup();
      marker.unbindTooltip();
    };
  }, [item.feature, layer, mode, name]);
  return <Marker position={item.position} icon={item.icon} ref={markerRef} />;
}

function ClusteredFeatureMarker({ group, map, zoom, layer, colorOverride }) {
  const onClick = () => {
    const maxZoom = map.getMaxZoom();
    const limit = Number.isFinite(maxZoom) ? maxZoom : 19;
    if (zoom < limit) {
      map.setView(group.position, Math.min(limit, zoom + 2), { animate: true });
    } else {
      showClusterItems(map, group, layer);
    }
  };
  return (
    <Marker
      position={group.position}
      icon={getClusterIcon(group.items.length, colorOverride)}
      eventHandlers={{ click: onClick }}
    />
  );
}

export default function LocalGeoJSONLayer({ layer, viewSettings = {} }) {
  const [loaded, setLoaded] = useState(null);
  const map = useMapEvents({ zoomend: (event) => setZoom(event.target.getZoom()) });
  const [zoom, setZoom] = useState(() => map.getZoom());
  const showDetails = zoom >= MIN_SYMBOL_ZOOM;
  const path = layer.geojson_path;
  const mode = ["auto", "icons", "names"].includes(viewSettings?.labelMode)
    ? viewSettings.labelMode : "auto";
  const colorOverride = /^#[0-9a-f]{6}$/i.test(viewSettings?.color || "")
    ? viewSettings.color : null;
  const requestedStrokeWidth = viewSettings?.strokeWidth == null
    ? null : Number(viewSettings.strokeWidth);
  const strokeWidthOverride = requestedStrokeWidth !== null && Number.isFinite(requestedStrokeWidth)
    ? Math.min(12, Math.max(1, requestedStrokeWidth)) : null;
  const geojson = loaded?.path === path ? loaded.data : null;
  const geoJSONRef = useRef(null);

  const separated = useMemo(() => (geojson ? separateGeoJSON(geojson) : null), [geojson]);
  const polygonMarkers = useMemo(
    () => (showDetails && mode === "icons" && geojson
      ? polygonIconFeatures(geojson, layer, colorOverride)
      : []),
    [showDetails, mode, geojson, layer, colorOverride]
  );
  const individualMarkers = useMemo(() => {
    if (!separated || !showDetails) return [];
    const pointMarkers = separated.points.map((item) => ({
      ...item,
      icon: getMarkerIcon(getPointCategory(item.feature, layer), item.feature?.properties?.estilo, colorOverride),
    }));
    return [...pointMarkers, ...polygonMarkers.map((item) => ({ ...item, key: `area-${item.key}` }))];
  }, [separated, polygonMarkers, layer, colorOverride, showDetails]);
  const markerGroups = useMemo(
    () => (showDetails ? clusterNearbyMarkers(individualMarkers, map, zoom) : []),
    [individualMarkers, map, zoom, showDetails]
  );

  const areaNames = zoom >= 14;
  const otherNames = zoom >= 16;
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

  // Atualiza linhas e contornos existentes sem remontar milhares de feições
  // ao movimentar o controle de espessura. Mantém popups e medições intactos.
  useEffect(() => {
    if (!geoJSONRef.current) return;
    geoJSONRef.current.setStyle((feature) =>
      styleForFeature(feature, colorOverride, strokeWidthOverride)
    );
  }, [geojson, colorOverride, strokeWidthOverride]);

  if (!geojson || !separated) return null;
  return (
    <>
      {separated.shapes.features.length > 0 && (
        <GeoJSON
          ref={geoJSONRef}
          key={`${mode}-${colorOverride || "original"}-${showDetails}-${areaNames}-${otherNames}`}
          data={separated.shapes}
          style={(feature) => styleForFeature(feature, colorOverride, strokeWidthOverride)}
          onEachFeature={(feature, leafletLayer) => {
            const properties = feature.properties || {};
            const name = properties.nome || properties.name || properties.title;
            const geometryType = feature.geometry?.type || "";
            // Abaixo do zoom mínimo não cria nem tooltip de hover.
            // Popups e geometrias continuam disponíveis normalmente.
            if (name && showDetails) {
              leafletLayer.bindTooltip(String(name), {
                permanent: featureLabelIsPermanent(mode, geometryType, zoom, layer),
                direction: "center",
                className: "sobral-geojson-label",
                opacity: 0.95,
              });
            }
            leafletLayer.bindPopup(buildStyledPopup(feature, layer), {
              maxWidth: 360,
              className: "sobral-geojson-popup",
            });
          }}
        />
      )}
      {markerGroups.map((group) => group.items.length > 1 ? (
        <ClusteredFeatureMarker
          key={group.key}
          group={group}
          map={map}
          zoom={zoom}
          layer={layer}
          colorOverride={colorOverride}
        />
      ) : (
        <SingleFeatureMarker
          key={group.items[0].key}
          item={group.items[0]}
          layer={layer}
          mode={mode}
        />
      ))}
    </>
  );
}
