import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Map as MapIcon,
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
} from "lucide-react";

import api from "../services/api";

export default function Sidebar({
  activeLayers,
  onToggleLayer,
  onClearMap,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

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

        result[category][subcategory].push(
          layer
        );
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

    if (name.includes("educ"))
      return (
        <School
          size={16}
          className="text-blue-600"
        />
      );

    if (name.includes("saúde"))
      return (
        <HeartPulse
          size={16}
          className="text-red-500"
        />
      );

    if (name.includes("trans"))
      return (
        <Bus
          size={16}
          className="text-amber-500"
        />
      );

    if (name.includes("infra"))
      return (
        <Building2
          size={16}
          className="text-slate-600"
        />
      );

    if (name.includes("ambient"))
      return (
        <Trees
          size={16}
          className="text-green-600"
        />
      );

    if (name.includes("segurança"))
      return (
        <Shield
          size={16}
          className="text-indigo-600"
        />
      );

    if (name.includes("econ"))
      return (
        <Landmark
          size={16}
          className="text-yellow-600"
        />
      );

    if (name.includes("territ"))
      return (
        <MapPinned
          size={16}
          className="text-purple-600"
        />
      );

    return (
      <FolderTree
        size={16}
        className="text-blue-600"
      />
    );
  };

  return (
    <div
      className={`fixed top-16 left-0 bottom-0 z-[1000] flex transition-all duration-300 ${
        isOpen
          ? "translate-x-0"
          : "-translate-x-[360px]"
      }`}
    >
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
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
              <MapIcon size={20} />
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Sobral em Mapas
              </h2>

              <p className="text-xs text-blue-200">
                Sistema de Informações Geográficas
              </p>
            </div>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-blue-300"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Pesquisar camadas..."
              className="
                w-full
                rounded-xl
                bg-white/10
                border
                border-white/10
                pl-10
                pr-3
                py-3
                text-sm
                outline-none
                placeholder:text-blue-200
              "
            />
          </div>
        </div>

        {/* LISTA DE MAPAS */}
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
                      {getCategoryIcon(
                        category
                      )}

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

        {/* MAPAS ATIVOS FIXOS NO RODAPÉ */}
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

              <div className="max-h-25 overflow-y-auto space-y-2 pr-1">
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
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />

                      <span className="text-sm font-medium text-gray-700 truncate">
                        {layer.name}
                      </span>
                    </div>

                    <button
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
      </aside>

      <button
        onClick={() =>
          setIsOpen(!isOpen)
        }
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