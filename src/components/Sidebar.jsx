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
  Printer,
  Maximize,
  Eraser,
  Info,
  Bookmark,
  ImageOff,
  Ruler,
  Star,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import api from "../services/api";
import SearchPanel from "./SearchPanel";

import { jsPDF } from "jspdf";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api";

export default function Sidebar({
  activeLayers = [],
  onToggleLayer,
  onClearMap,
  onSearchLocation,
  mapToolsRef,
  forceOpenSignal,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [activePanel, setActivePanel] =
    useState("layers");

  const [favoriteStorageKey] = useState(() =>
    getFavoriteLayersStorageKey()
  );

  const [favoriteLayerIds, setFavoriteLayerIds] =
    useState(() =>
      loadFavoriteLayerIds(favoriteStorageKey)
    );

  useEffect(() => {
    localStorage.setItem(
      favoriteStorageKey,
      JSON.stringify(favoriteLayerIds)
    );
  }, [favoriteStorageKey, favoriteLayerIds]);

  useEffect(() => {
    if (forceOpenSignal > 0) {
      setIsOpen(true);
    }
  }, [forceOpenSignal]);

  useEffect(() => {
    let isMounted = true;

    async function loadLayers() {
      try {
        const response = await api.get("/map-data");

        if (!isMounted) return;

        const data =
          response.data?.data?.layers || [];

        setLayers(data);

        const categories = {};

        data.forEach((layer) => {
          const category =
            layer.subcategory?.category?.name ||
            "Geral";

          categories[category] = false;
        });

        setExpanded(categories);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLayers();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const favoriteLayers = useMemo(() => {
    return layers.filter((layer) =>
      favoriteLayerIds.includes(
        String(layer.id)
      )
    );
  }, [layers, favoriteLayerIds]);

  const isLayerActive = (layer) => {
    return activeLayers.some(
      (item) => item.id === layer.id
    );
  };

  const isLayerFavorite = (layer) => {
    return favoriteLayerIds.includes(
      String(layer.id)
    );
  };

  const toggleFavoriteLayer = (layerId) => {
    const id = String(layerId);

    setFavoriteLayerIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [...previous, id];
    });
  };

  const handleClearEverything = () => {
    onClearMap?.();
    mapToolsRef?.current?.clearDrawings?.();
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
          dataTour="measure-button"
          tooltip="Medição"
          active={activePanel === "measure"}
          onClick={() => setActivePanel("measure")}
          icon={<Ruler size={20} />}
        />

        <SidebarButton
          dataTour="bookmarks-button"
          tooltip="Marcadores"
          active={activePanel === "bookmarks"}
          onClick={() => setActivePanel("bookmarks")}
          icon={<Bookmark size={20} />}
          badge={favoriteLayers.length}
        />

        <SidebarButton
          dataTour="print-button"
          tooltip="Impressão"
          active={activePanel === "print"}
          onClick={() => setActivePanel("print")}
          icon={<Printer size={20} />}
        />

        <SidebarButton
          dataTour="clear-button"
          tooltip="Limpar Mapa"
          active={false}
          onClick={handleClearEverything}
          icon={<Eraser size={20} />}
        />

        <SidebarButton
          dataTour="fullscreen-button"
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
                  onChange={(event) =>
                    setSearch(event.target.value)
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
                                  <LayerRow
                                    key={layer.id}
                                    layer={layer}
                                    active={isLayerActive(
                                      layer
                                    )}
                                    favorite={isLayerFavorite(
                                      layer
                                    )}
                                    onToggleLayer={
                                      onToggleLayer
                                    }
                                    onToggleFavorite={
                                      toggleFavoriteLayer
                                    }
                                  />
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
            <PanelHeader
              icon={<Search size={22} />}
              title="Buscar Local"
              subtitle="Pesquise endereços, bairros ou coordenadas"
            />

            <SearchPanel onSearch={onSearchLocation} />
          </>
        )}

        {activePanel === "measure" && (
          <MeasurePanel mapToolsRef={mapToolsRef} />
        )}

        {activePanel === "bookmarks" && (
          <BookmarksPanel
            favoriteLayers={favoriteLayers}
            onToggleFavorite={toggleFavoriteLayer}
            onToggleLayer={onToggleLayer}
            isLayerActive={isLayerActive}
          />
        )}

        {activePanel === "print" && (
          <PrintPanel
            activeLayers={activeLayers}
            mapToolsRef={mapToolsRef}
            onCollapseSidebar={() => setIsOpen(false)}
          />
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
    <div
      data-tour={dataTour}
      className="
        group
        relative
        h-12
        w-12
        flex
        items-center
        justify-center
      "
    >
      <button
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

function LayerRow({
  layer,
  active,
  favorite,
  onToggleLayer,
  onToggleFavorite,
}) {
  const inputId = `layer-checkbox-${layer.id}`;

  return (
    <div
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
        transition-all
      "
    >
      <input
        id={inputId}
        type="checkbox"
        checked={active}
        onChange={() => onToggleLayer(layer)}
        className="h-4 w-4 accent-blue-700 shrink-0"
      />

      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700 truncate flex-1 cursor-pointer"
      >
        {layer.name}
      </label>

      <button
        type="button"
        onClick={() => onToggleFavorite(layer.id)}
        className="
          h-8
          w-8
          rounded-xl
          flex
          items-center
          justify-center
          hover:bg-amber-50
          transition-all
          shrink-0
        "
        title={
          favorite
            ? "Remover dos marcadores"
            : "Adicionar aos marcadores"
        }
      >
        <Star
          size={16}
          className={
            favorite
              ? "text-amber-500"
              : "text-slate-300"
          }
          fill={favorite ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
  count,
}) {
  return (
    <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5 border-b border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center shadow-lg border border-white/10">
            {icon}
          </div>

          <div>
            <h2 className="font-bold text-xl leading-none">
              {title}
            </h2>

            <p className="text-xs text-blue-200 mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {count !== null &&
          count !== undefined && (
            <div className="px-3 py-1.5 rounded-full bg-white/10 text-[12px] font-bold text-blue-100 border border-white/10">
              {count}
            </div>
          )}
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
      <PanelHeader
        icon={<Info size={22} />}
        title="Legendas"
        subtitle="Simbologia e descrição das camadas ativas"
        count={activeLayers.length}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {activeLayers.length === 0 ? (
          <EmptyState
            icon={<Layers size={30} />}
            title="Nenhuma camada ativa"
            text="Ative uma camada no painel de camadas para visualizar sua legenda aqui."
          />
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

function MeasurePanel({ mapToolsRef }) {
  return (
    <>
      <PanelHeader
        icon={<Ruler size={22} />}
        title="Medição"
        subtitle="Meça distâncias e áreas no mapa"
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() =>
              mapToolsRef?.current?.measureLine?.()
            }
            className="
              w-full
              rounded-2xl
              bg-white
              border
              border-slate-200
              p-4
              text-left
              hover:border-blue-200
              hover:bg-blue-50
              transition
              shadow-sm
            "
          >
            <h3 className="font-black text-slate-800">
              Medir distância
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Clique no mapa para desenhar uma linha e calcular o comprimento.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              mapToolsRef?.current?.measureArea?.()
            }
            className="
              w-full
              rounded-2xl
              bg-white
              border
              border-slate-200
              p-4
              text-left
              hover:border-blue-200
              hover:bg-blue-50
              transition
              shadow-sm
            "
          >
            <h3 className="font-black text-slate-800">
              Medir área
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Desenhe um polígono para calcular a área aproximada.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              mapToolsRef?.current?.clearDrawings?.()
            }
            className="
              w-full
              rounded-2xl
              bg-red-50
              border
              border-red-100
              p-4
              text-left
              hover:bg-red-100
              transition
            "
          >
            <h3 className="font-black text-red-700">
              Limpar medições
            </h3>

            <p className="text-sm text-red-500 mt-1">
              Remove todas as linhas e áreas medidas no mapa.
            </p>
          </button>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                mapToolsRef?.current?.zoomIn?.()
              }
              className="rounded-2xl bg-white border border-slate-200 p-4 font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <ZoomIn size={18} />
              Zoom +
            </button>

            <button
              type="button"
              onClick={() =>
                mapToolsRef?.current?.zoomOut?.()
              }
              className="rounded-2xl bg-white border border-slate-200 p-4 font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <ZoomOut size={18} />
              Zoom -
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function BookmarksPanel({
  favoriteLayers = [],
  onToggleFavorite,
  onToggleLayer,
  isLayerActive,
}) {
  return (
    <>
      <PanelHeader
        icon={<Bookmark size={22} />}
        title="Marcadores"
        subtitle="Camadas favoritas para acesso rápido"
        count={favoriteLayers.length}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {favoriteLayers.length === 0 ? (
          <EmptyState
            icon={
              <Star
                size={30}
                fill="currentColor"
              />
            }
            title="Nenhuma camada marcada"
            text="Use a estrela ao lado das camadas para salvá-las aqui."
            color="amber"
          />
        ) : (
          <div className="space-y-3">
            {favoriteLayers.map((layer) => {
              const active = isLayerActive(layer);

              const category =
                layer.subcategory?.category?.name ||
                "Sem categoria";

              const subcategory =
                layer.subcategory?.name ||
                "Sem subcategoria";

              return (
                <div
                  key={layer.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-800 text-sm truncate">
                        {layer.name}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {category} • {subcategory}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onToggleFavorite(layer.id)
                      }
                      className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center shrink-0"
                      title="Remover dos marcadores"
                    >
                      <Star
                        size={16}
                        fill="currentColor"
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleLayer(layer)
                    }
                    className={`
                      mt-4
                      w-full
                      rounded-xl
                      px-4
                      py-2.5
                      text-sm
                      font-bold
                      transition
                      ${
                        active
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-blue-700 text-white hover:bg-blue-800"
                      }
                    `}
                  >
                    {active
                      ? "Remover do mapa"
                      : "Adicionar ao mapa"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function PrintPanel({
  activeLayers = [],
  mapToolsRef,
  onCollapseSidebar,
}) {
  const [historyStorageKey] = useState(() =>
    getPrintHistoryStorageKey()
  );

  const [printHistory, setPrintHistory] = useState(
    () => loadPrintHistory(historyStorageKey)
  );

  useEffect(() => {
    localStorage.setItem(
      historyStorageKey,
      JSON.stringify(printHistory)
    );
  }, [historyStorageKey, printHistory]);

  useEffect(() => {
    const handlePrintExported = (event) => {
      const item = event.detail;

      if (!item?.selection || !item?.imageDataUrl) {
        return;
      }

      setPrintHistory((previous) => {
        const next = [
          item,
          ...previous.filter(
            (oldItem) => oldItem.id !== item.id
          ),
        ];

        return next.slice(0, 8);
      });
    };

    window.addEventListener(
      "sobral-map-print-exported",
      handlePrintExported
    );

    return () => {
      window.removeEventListener(
        "sobral-map-print-exported",
        handlePrintExported
      );
    };
  }, []);

  const getPrintTools = () => {
    const tools = mapToolsRef?.current;

    if (!tools) {
      alert(
        "O mapa ainda não terminou de carregar. Aguarde alguns segundos e tente novamente."
      );

      return null;
    }

    return tools;
  };

  const handleActivateSelection = () => {
    const tools = getPrintTools();

    if (!tools) return;

    if (!tools.enablePrintSelection) {
      alert(
        "A ferramenta de impressão ainda não foi registrada no mapa."
      );

      return;
    }

    tools.enablePrintSelection("pdf");

    onCollapseSidebar?.();
  };

  const handleExportHistoryItem = async (
    item,
    format = "pdf"
  ) => {
    try {
      await exportHistoryImage(item, format);
    } catch (error) {
      console.error(
        "Erro ao exportar item do histórico:",
        error
      );

      alert(
        "Não foi possível exportar este item do histórico. Itens antigos podem não ter a imagem salva."
      );
    }
  };

  const handleDeleteHistoryItem = (itemId) => {
    setPrintHistory((previous) =>
      previous.filter((item) => item.id !== itemId)
    );
  };

  const handleClearHistory = () => {
    setPrintHistory([]);
  };

  const handleCancelSelection = () => {
    mapToolsRef?.current?.disablePrintSelection?.();
  };

  return (
    <>
      <PanelHeader
        icon={<Printer size={22} />}
        title="Impressão"
        subtitle="Exportação e histórico de recortes"
        count={printHistory.length}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-black text-slate-800">
            Nova área de impressão
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Ative o retângulo no mapa. Depois mova, redimensione e escolha o formato diretamente no card de exportação.
          </p>

          <button
            type="button"
            onClick={handleActivateSelection}
            className="
              mt-5
              w-full
              rounded-2xl
              bg-blue-700
              text-white
              px-4
              py-3
              font-bold
              hover:bg-blue-800
              transition
              flex
              items-center
              justify-center
              gap-2
            "
          >
            <FileText size={18} />
            Ativar área de impressão
          </button>

          <button
            type="button"
            onClick={handleCancelSelection}
            className="
              mt-3
              w-full
              rounded-2xl
              bg-slate-100
              text-slate-600
              px-4
              py-3
              font-bold
              hover:bg-slate-200
              transition
              flex
              items-center
              justify-center
              gap-2
            "
          >
            <X size={18} />
            Cancelar área ativa
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-black text-slate-800">
                Histórico de impressões
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
                Recortes exportados nesta conta.
              </p>
            </div>

            {printHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="
                  h-9
                  w-9
                  rounded-xl
                  bg-red-50
                  text-red-600
                  hover:bg-red-100
                  transition
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
                title="Limpar histórico"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {printHistory.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 text-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-700 mx-auto flex items-center justify-center">
                <ImageIcon size={24} />
              </div>

              <h4 className="font-bold text-slate-700 mt-3">
                Nenhuma impressão ainda
              </h4>

              <p className="text-sm text-slate-500 mt-1">
                Quando você exportar uma área, ela aparecerá aqui para reutilização.
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3">
              {printHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-4
                    shadow-sm
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-slate-800">
                        Impressão #{printHistory.length - index}
                      </h4>

                      <p className="text-xs text-slate-500 mt-1">
                        {formatPrintDate(item.createdAt)}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Área:{" "}
                        {Math.round(
                          item.selection?.width || 0
                        )}{" "}
                        ×{" "}
                        {Math.round(
                          item.selection?.height || 0
                        )}{" "}
                        px
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Último formato:{" "}
                        <span className="font-bold uppercase">
                          {item.format || "pdf"}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteHistoryItem(item.id)
                      }
                      className="
                        h-8
                        w-8
                        rounded-xl
                        bg-slate-100
                        text-slate-400
                        hover:bg-red-50
                        hover:text-red-600
                        transition
                        flex
                        items-center
                        justify-center
                        shrink-0
                      "
                      title="Remover do histórico"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {item.imageDataUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={item.imageDataUrl}
                        alt="Prévia da impressão"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  {item.layers?.length > 0 && (
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                      <p className="text-[11px] font-black text-amber-800 uppercase">
                        Camadas usadas
                      </p>

                      <p className="text-xs text-amber-900 mt-1 truncate">
                        {item.layers
                          .map((layer) => layer.name)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {["pdf", "png", "jpeg"].map(
                      (formatOption) => (
                        <button
                          key={formatOption}
                          type="button"
                          onClick={() =>
                              handleExportHistoryItem(
                                item,
                                formatOption
                              )
                            }
                          className="
                            rounded-xl
                            bg-slate-100
                            text-slate-600
                            hover:bg-blue-700
                            hover:text-white
                            px-2
                            py-2
                            text-xs
                            font-black
                            uppercase
                            transition
                          "
                        >
                          {formatOption}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeLayers.length > 0 && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-black text-amber-800 uppercase">
              Camadas no mapa agora
            </p>

            <div className="mt-3 space-y-2">
              {activeLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="text-sm text-amber-900 font-medium"
                >
                  • {layer.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({
  icon,
  title,
  text,
  color = "blue",
}) {
  const colorClasses =
    color === "amber"
      ? "bg-amber-100 text-amber-600"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="h-full flex items-center justify-center text-center">
      <div>
        <div
          className={`
            h-16
            w-16
            rounded-3xl
            flex
            items-center
            justify-center
            mx-auto
            ${colorClasses}
          `}
        >
          {icon}
        </div>

        <h3 className="font-bold text-gray-800 mt-4">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          {text}
        </p>
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

function getPrintHistoryStorageKey() {
  const userId = getCurrentUserStorageId();

  return `sobral_map_print_history_${userId}`;
}

function getCurrentUserStorageId() {
  const possibleKeys = [
    "admin_user",
    "sobral_user",
    "auth_user",
    "user",
    "current_user",
  ];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      const user =
        parsed?.user ||
        parsed?.data?.user ||
        parsed;

      const identifier =
        user?.id ||
        user?.email ||
        user?.login ||
        user?.name;

      if (identifier) {
        return String(identifier);
      }
    } catch {
      // ignora registros inválidos
    }
  }

  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token");

  if (token) {
    return `token_${token.slice(0, 12)}`;
  }

  return "guest";
}

function loadPrintHistory(storageKey) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function formatPrintDate(value) {
  if (!value) {
    return "Data não informada";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Data inválida";
  }
}

async function exportHistoryImage(item, format) {
  if (!item?.imageDataUrl) {
    throw new Error(
      "Imagem não encontrada no histórico."
    );
  }

  const image = await loadImageFromDataUrl(
    item.imageDataUrl
  );

  const canvas = document.createElement("canvas");

  canvas.width =
    image.naturalWidth ||
    item.outputWidth ||
    1000;

  canvas.height =
    image.naturalHeight ||
    item.outputHeight ||
    700;

  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const filename = getHistoryFilename(item);

  if (format === "pdf") {
    exportHistoryCanvasAsPdf(canvas, filename);
    return;
  }

  const mimeType =
    format === "jpeg"
      ? "image/jpeg"
      : "image/png";

  const extension =
    format === "jpeg" ? "jpg" : "png";

  const blob = await canvasToBlob(
    canvas,
    mimeType,
    format === "jpeg" ? 0.95 : undefined
  );

  downloadBlob(
    blob,
    `${filename}.${extension}`
  );
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () =>
      reject(
        new Error(
          "Não foi possível carregar a imagem do histórico."
        )
      );

    image.src = dataUrl;
  });
}

function canvasToBlob(
  canvas,
  mimeType,
  quality
) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Não foi possível gerar o arquivo."
            )
          );
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

function exportHistoryCanvasAsPdf(
  canvas,
  filename
) {
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

  pdf.save(`${filename}.pdf`);
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

function getHistoryFilename(item) {
  const date = item?.createdAt
    ? new Date(item.createdAt)
    : new Date();

  const datePart = date
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "-");

  return `sobral-em-mapas-${datePart}`;
}

function getFavoriteLayersStorageKey() {
  const userId = getCurrentUserStorageId();

  return `sobral_map_favorite_layers_${userId}`;
}

function loadFavoriteLayerIds(storageKey) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    return Array.isArray(saved)
      ? saved.map(String)
      : [];
  } catch {
    return [];
  }
}