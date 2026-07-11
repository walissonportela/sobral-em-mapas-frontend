import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Layers,
  Loader2,
  Trash2,
  School,
  HeartPulse,
  Bus,
  Building2,
  Trees,
  Shield,
  Landmark,
  FolderTree,
  MapPinned,
  BarChart3,
  Printer,
  Maximize,
  Eraser,
  Info,
  Bookmark,
  ImageOff,
} from "lucide-react";

import api from "../services/api";

import SearchPanel from "./SearchPanel";

const API_BASE_URL = "http://localhost:8080/api";

export default function Sidebar({
  activeLayers = [],
  onToggleLayer,
  onClearMap,
  onSearchLocation,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [activePanel, setActivePanel] =
    useState("layers");

  useEffect(() => {
    loadLayers();
  }, []);

  async function loadLayers() {
    try {
      const response = await api.get("/map-data");

      const data =
        response.data?.data?.layers || [];

      setLayers(data);

      const categories = {};

      data.forEach((layer) => {
        const cat =
          layer.subcategory?.category?.name ||
          "Geral";

        categories[cat] = false;
      });

      setExpanded(categories);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const result = {};

    layers
      .filter((layer) =>
        layer.name
          ?.toLowerCase()
          .includes(search.toLowerCase())
      )
      .forEach((layer) => {
        const category =
          layer.subcategory?.category?.name ||
          "Geral";

        const subcategory =
          layer.subcategory?.name ||
          "Outros";

        if (!result[category]) {
          result[category] = {};
        }

        if (!result[category][subcategory]) {
          result[category][subcategory] = [];
        }

        result[category][subcategory].push(layer);
      });

    return result;
  }, [layers, search]);

  const isLayerActive = (layer) => {
    return activeLayers.some(
      (item) => item.id === layer.id
    );
  };

  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();

    if (name.includes("educ")) {
      return (
        <School
          size={16}
          className="text-blue-600"
        />
      );
    }

    if (name.includes("saúde")) {
      return (
        <HeartPulse
          size={16}
          className="text-red-500"
        />
      );
    }

    if (name.includes("trans")) {
      return (
        <Bus
          size={16}
          className="text-amber-500"
        />
      );
    }

    if (name.includes("infra")) {
      return (
        <Building2
          size={16}
          className="text-slate-600"
        />
      );
    }

    if (name.includes("ambient")) {
      return (
        <Trees
          size={16}
          className="text-green-600"
        />
      );
    }

    if (name.includes("segurança")) {
      return (
        <Shield
          size={16}
          className="text-indigo-600"
        />
      );
    }

    if (name.includes("econ")) {
      return (
        <Landmark
          size={16}
          className="text-yellow-600"
        />
      );
    }

    if (name.includes("territ")) {
      return (
        <MapPinned
          size={16}
          className="text-purple-600"
        />
      );
    }

    return (
      <FolderTree
        size={16}
        className="text-blue-600"
      />
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(
        "Erro ao alternar tela cheia:",
        err
      );
    }
  };

  return (
    <div
      className={`fixed top-[72px] left-0 bottom-0 z-[1000] flex transition-all duration-300 ${
        isOpen
          ? "translate-x-0"
          : "-translate-x-[420px]"
      }`}
    >
      <div
        data-tour="sidebar"
        className="
          w-16
          bg-gradient-to-b
          from-blue-700
          via-blue-800
          to-blue-900
          shadow-2xl
          flex
          flex-col
          items-center
          py-3
          gap-2
        "
      >
        <SidebarButton
          dataTour="layers-button"
          tooltip="Camadas"
          active={activePanel === "layers"}
          onClick={() => setActivePanel("layers")}
          icon={<Layers size={20} />}
        />

        <SidebarButton
          dataTour="legend-button"
          tooltip="Legendas"
          active={activePanel === "legends"}
          onClick={() => setActivePanel("legends")}
          icon={<Info size={20} />}
          badge={activeLayers.length}
        />

        <SidebarButton
          dataTour="search-button"
          tooltip="Buscar Local"
          active={activePanel === "search"}
          onClick={() => setActivePanel("search")}
          icon={<Search size={20} />}
        />

        <SidebarButton
          tooltip="Marcadores"
          active={activePanel === "bookmarks"}
          onClick={() => setActivePanel("bookmarks")}
          icon={<Bookmark size={20} />}
        />

        <SidebarButton
          tooltip="Limpar Mapa"
          active={false}
          onClick={onClearMap}
          icon={<Eraser size={20} />}
        />

        <SidebarButton
          tooltip="Imprimir"
          active={false}
          onClick={() => {
            console.log("Imprimir futuramente");
          }}
          icon={<Printer size={20} />}
        />

        <SidebarButton
          tooltip="Tela Cheia"
          active={false}
          onClick={toggleFullscreen}
          icon={<Maximize size={20} />}
        />
      </div>

      <aside
        className="
          w-[360px]
          bg-white
          border-r
          border-gray-200
          shadow-2xl
          flex
          flex-col
        "
      >
        {activePanel === "layers" && (
          <>
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      h-12
                      w-12
                      rounded-2xl
                      bg-white/15
                      backdrop-blur-sm
                      flex
                      items-center
                      justify-center
                      shadow-lg
                      border
                      border-white/10
                    "
                  >
                    <Layers size={22} />
                  </div>

                  <div>
                    <h2 className="font-bold text-xl leading-none">
                      Camadas
                    </h2>

                    <p className="text-xs text-blue-200 mt-1">
                      Gerenciamento de mapas temáticos
                    </p>
                  </div>
                </div>

                <div
                  className="
                    px-3
                    py-1.5
                    rounded-full
                    bg-white/10
                    text-[12px]
                    font-bold
                    text-blue-100
                    border
                    border-white/10
                  "
                >
                  {layers.length} mapas
                </div>
              </div>

              <div className="relative">
                <Search
                  size={18}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-blue-300
                  "
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Pesquisar camadas..."
                  className="
                    w-full
                    rounded-2xl
                    bg-white/10
                    border
                    border-white/10
                    pl-10
                    pr-4
                    py-3
                    text-sm
                    text-white
                    placeholder:text-blue-200
                    outline-none
                    focus:border-blue-300
                    focus:bg-white/15
                    transition-all
                  "
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="p-5 space-y-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="
                        h-12
                        rounded-xl
                        bg-gray-200
                        animate-pulse
                      "
                    />
                  ))}

                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    <span className="text-sm font-medium">
                      Carregando mapas...
                    </span>
                  </div>
                </div>
              )}

              {!loading &&
                Object.entries(grouped).map(
                  ([category, subs]) => (
                    <div
                      key={category}
                      className="border-b border-gray-100"
                    >
                      <button
                        type="button"
                        className="
                          w-full
                          flex
                          justify-between
                          items-center
                          px-4
                          py-4
                          hover:bg-gray-50
                          transition-all
                        "
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [category]:
                              !prev[category],
                          }))
                        }
                      >
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}

                          <span className="font-semibold text-gray-800">
                            {category}
                          </span>
                        </div>

                        {expanded[category] ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>

                      {expanded[category] && (
                        <div className="pb-3">
                          {Object.entries(subs).map(
                            ([sub, items]) => (
                              <div
                                key={sub}
                                className="px-4 mb-4"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                                  <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                    {sub}
                                  </span>
                                </div>

                                {items.map((layer) => (
                                  <label
                                    key={layer.id}
                                    className="
                                      flex
                                      items-center
                                      gap-3
                                      px-3
                                      py-2.5
                                      rounded-xl
                                      border
                                      border-transparent
                                      hover:bg-blue-50
                                      hover:border-blue-100
                                      cursor-pointer
                                      transition-all
                                    "
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isLayerActive(
                                        layer
                                      )}
                                      onChange={() =>
                                        onToggleLayer(
                                          layer
                                        )
                                      }
                                      className="h-4 w-4 accent-blue-700"
                                    />

                                    <span className="text-sm font-medium text-gray-700">
                                      {layer.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
            </div>

            {activeLayers.length > 0 && (
              <div className="border-t bg-gray-50 p-4 shrink-0">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers
                        size={16}
                        className="text-amber-700"
                      />

                      <h3 className="font-bold text-sm text-amber-800">
                        Camadas Ativas
                      </h3>

                      <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                        {activeLayers.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onClearMap}
                      className="
                        flex
                        items-center
                        gap-1
                        text-xs
                        text-red-600
                        hover:text-red-700
                      "
                    >
                      <Trash2 size={12} />
                      Limpar
                    </button>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                    {activeLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className="
                          flex
                          items-center
                          justify-between
                          bg-white
                          rounded-xl
                          px-3
                          py-2
                          shadow-sm
                          border
                          border-yellow-100
                        "
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />

                          <span className="text-sm font-medium text-gray-700 truncate">
                            {layer.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onToggleLayer(layer)
                          }
                          className="
                            h-7
                            w-7
                            rounded-full
                            flex
                            items-center
                            justify-center
                            text-gray-400
                            hover:bg-red-50
                            hover:text-red-600
                            transition-all
                            shrink-0
                          "
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activePanel === "legends" && (
          <LegendPanel activeLayers={activeLayers} />
        )}

        {activePanel === "search" && (
          <>
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Search size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-lg">
                    Buscar Local
                  </h2>

                  <p className="text-xs text-blue-200">
                    Pesquise endereços, bairros ou coordenadas
                  </p>
                </div>
              </div>
            </div>

            <SearchPanel onSearch={onSearchLocation} />
          </>
        )}

        {activePanel === "bookmarks" && (
          <>
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Bookmark size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-lg">
                    Marcadores
                  </h2>

                  <p className="text-xs text-blue-200">
                    Locais salvos no mapa
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl h-full flex flex-col items-center justify-center text-center">
                <Bookmark
                  size={42}
                  className="text-gray-300 mb-3"
                />

                <h3 className="font-semibold text-gray-700">
                  Marcadores
                </h3>

                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                  Espaço reservado para locais favoritos e pontos salvos.
                </p>
              </div>
            </div>
          </>
        )}

        {activePanel === "dashboard" && (
          <>
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-lg">
                    Indicadores
                  </h2>

                  <p className="text-xs text-blue-200">
                    Dashboards e estatísticas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl h-full flex flex-col items-center justify-center text-center">
                <BarChart3
                  size={42}
                  className="text-gray-300 mb-3"
                />

                <h3 className="font-semibold text-gray-700">
                  Painéis Analíticos
                </h3>

                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                  Espaço reservado para gráficos, indicadores e relatórios.
                </p>
              </div>
            </div>
          </>
        )}

        {activePanel === "query" && (
          <>
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <MapPinned size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-lg">
                    Consulta Espacial
                  </h2>

                  <p className="text-xs text-blue-200">
                    Informações geográficas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl h-full flex flex-col items-center justify-center text-center">
                <MapPinned
                  size={42}
                  className="text-gray-300 mb-3"
                />

                <h3 className="font-semibold text-gray-700">
                  Consulta de Feições
                </h3>

                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                  Espaço reservado para identificação, consultas espaciais e seleção.
                </p>
              </div>
            </div>
          </>
        )}
      </aside>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-12
          h-12
          bg-gradient-to-b
          from-blue-700
          to-blue-900
          text-white
          rounded-r-xl
          shadow-xl
          flex
          items-center
          justify-center
          hover:scale-105
          transition-all
        "
      >
        {isOpen ? (
          <ChevronLeft size={18} />
        ) : (
          <Menu size={18} />
        )}
      </button>
    </div>
  );
}

function SidebarButton({
  icon,
  tooltip,
  active,
  onClick,
  dataTour,
  badge = 0,
}) {
  return (
    <div className="group relative">
      <button
        data-tour={dataTour}
        type="button"
        onClick={onClick}
        className={`
          relative
          h-12
          w-12
          rounded-xl
          flex
          items-center
          justify-center
          transition-all
          duration-200
          ${
            active
              ? "bg-white text-blue-700 shadow-md"
              : "text-white hover:bg-white/15"
          }
        `}
      >
        {icon}

        {badge > 0 && (
          <span
            className="
              absolute
              -top-1
              -right-1
              min-w-5
              h-5
              px-1
              rounded-full
              bg-amber-400
              text-blue-950
              text-[10px]
              font-black
              flex
              items-center
              justify-center
              shadow
            "
          >
            {badge}
          </span>
        )}
      </button>

      <div
        className="
          absolute
          left-16
          top-1/2
          -translate-y-1/2
          opacity-0
          translate-x-2
          group-hover:opacity-100
          group-hover:translate-x-0
          transition-all
          duration-200
          pointer-events-none
          whitespace-nowrap
          px-3
          py-2
          rounded-lg
          bg-slate-900
          text-white
          text-xs
          font-medium
          shadow-xl
          z-[9999]
        "
      >
        {tooltip}
      </div>
    </div>
  );
}

function LegendPanel({ activeLayers = [] }) {
  const [hiddenLayerIds, setHiddenLayerIds] =
    useState([]);

  const visibleLayers = activeLayers.filter(
    (layer) =>
      layer?.layer_name &&
      !hiddenLayerIds.includes(layer.id)
  );

  const handleHideLegend = (layerId) => {
    setHiddenLayerIds((previous) => [
      ...previous,
      layerId,
    ]);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center shadow-lg border border-white/10">
              <Info size={22} />
            </div>

            <div>
              <h2 className="font-bold text-xl leading-none">
                Legendas
              </h2>

              <p className="text-xs text-blue-200 mt-1">
                Simbologia das camadas ativas
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-white/10 text-[12px] font-bold text-blue-100 border border-white/10">
            {activeLayers.length}
          </div>
        </div>

        <p className="text-xs text-blue-100">
          As legendas são carregadas diretamente do GeoServer.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {activeLayers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="h-16 w-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Layers size={30} />
              </div>

              <h3 className="font-bold text-gray-800 mt-4">
                Nenhuma camada ativa
              </h3>

              <p className="text-sm text-gray-500 mt-2 max-w-xs">
                Ative uma camada no painel de camadas para visualizar sua legenda aqui.
              </p>
            </div>
          </div>
        ) : visibleLayers.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 text-center">
            <p className="text-sm text-slate-500">
              Todas as legendas foram ocultadas.
            </p>

            <button
              type="button"
              onClick={() => setHiddenLayerIds([])}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 transition"
            >
              Mostrar novamente
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleLayers.map((layer) => (
              <LegendCard
                key={layer.id}
                layer={layer}
                onHide={() =>
                  handleHideLegend(layer.id)
                }
              />
            ))}

            {hiddenLayerIds.length > 0 && (
              <button
                type="button"
                onClick={() => setHiddenLayerIds([])}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-blue-700 text-sm font-bold hover:bg-blue-50 transition"
              >
                Mostrar legendas ocultas
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function LegendCard({ layer, onHide }) {
  const [legendError, setLegendError] =
    useState(false);

  const [previewError, setPreviewError] =
    useState(false);

  const legendUrl = buildLegendUrl(layer);
  const previewUrl = buildLayerPreviewUrl(layer);

  const description = getLayerDescription(layer);

  const categoryName =
    layer.subcategory?.category?.name ||
    "Sem categoria";

  const subcategoryName =
    layer.subcategory?.name ||
    "Sem subcategoria";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-slate-800 text-sm truncate">
            {layer.name}
          </h3>

          <p className="text-xs text-slate-400 mt-1 truncate">
            {categoryName} • {subcategoryName}
          </p>
        </div>

        <button
          type="button"
          onClick={onHide}
          className="h-8 w-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center shrink-0"
          title="Ocultar legenda"
        >
          <X size={15} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {description ? (
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Nenhuma descrição cadastrada para esta camada.
          </p>
        )}

        {!legendError && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 inline-flex max-w-full">
            <img
              src={legendUrl}
              alt={`Simbologia da camada ${layer.name}`}
              onError={() => setLegendError(true)}
              className="
                max-w-[180px]
                max-h-[90px]
                object-contain
              "
            />
          </div>
        )}

        {legendError && !previewError && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-500">
                Prévia da camada
              </p>
            </div>

            <img
              src={previewUrl}
              alt={`Prévia da camada ${layer.name}`}
              onError={() => setPreviewError(true)}
              className="
                w-full
                h-[120px]
                object-cover
                bg-white
              "
            />
          </div>
        )}

        {legendError && previewError && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
            <ImageOff
              size={22}
              className="text-slate-400 mx-auto"
            />

            <p className="text-xs text-slate-500 mt-2">
              Sem simbologia ou prévia disponível.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getLayerDescription(layer) {
  return (
    layer.description ||
    layer.descricao ||
    layer.abstract ||
    layer.metadata?.description ||
    ""
  );
}

function buildLegendUrl(layer) {
  if (layer.legend_url) {
    return layer.legend_url;
  }

  const params = new URLSearchParams();

  params.set("layer", layer.layer_name);

  const wmsLink =
    layer.wms_link ||
    layer.wmsLink ||
    null;

  const wmsLinkId =
    layer.wms_link_id ||
    wmsLink?.id ||
    "";

  if (wmsLinkId) {
    params.set("wms_link_id", wmsLinkId);
  }

  return `${API_BASE_URL}/legend?${params.toString()}`;
}

function buildLayerPreviewUrl(layer) {
  const params = new URLSearchParams();

  params.set("layers", layer.layer_name);
  params.set("transparent", "true");
  params.set("format", "image/png");
  params.set("version", "1.1.1");

  /*
   * BBOX aproximado da área urbana de Sobral.
   * Isso gera uma mini imagem da camada usando GetMap,
   * igual o mapa faz, só que em tamanho pequeno.
   */
  params.set("srs", "EPSG:4326");
  params.set("bbox", "-40.45,-3.78,-40.25,-3.60");
  params.set("width", "360");
  params.set("height", "180");

  const wmsLink =
    layer.wms_link ||
    layer.wmsLink ||
    null;

  const wmsLinkId =
    layer.wms_link_id ||
    wmsLink?.id ||
    "";

  if (wmsLinkId) {
    params.set("wms_link_id", wmsLinkId);
  }

  return `${API_BASE_URL}/proxy-wms?${params.toString()}`;
}