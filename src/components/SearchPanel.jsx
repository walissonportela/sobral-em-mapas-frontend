import { useEffect, useState, useRef } from "react";
import { Search, Loader2, MapPin, X, MapPinOff, Clock } from "lucide-react";

export default function SearchPanel({ onSearch }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  
  // NOVO: Controle de foco e histórico
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem("sobral_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const wrapperRef = useRef(null);

  // Salva no localStorage sempre que a lista de recentes mudar
  useEffect(() => {
    localStorage.setItem("sobral_recent_searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
        setShowNoResults(false);
        setIsFocused(false); // Remove o foco ao clicar fora
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowNoResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&countrycodes=br&format=json&limit=5&viewbox=-40.45,-3.60,-40.25,-3.78&bounded=0`
        );

        const data = await response.json();
        setSuggestions(data);
        setShowNoResults(data.length === 0);
      } catch (error) {
        console.error("Erro na busca:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim() || suggestions.length === 0) return;
    selectLocation(suggestions[0]);
  };

  const selectLocation = (item) => {
    onSearch({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      name: item.display_name,
    });

    const shortName = item.display_name.split(",")[0];
    setQuery(shortName);
    setSuggestions([]);
    setShowNoResults(false);
    setIsFocused(false);

    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.place_id !== item.place_id);
      return [item, ...filtered].slice(0, 3);
    });
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowNoResults(false);
    document.getElementById("search-input")?.focus();
  };

  return (
    <div className="p-5" ref={wrapperRef}>
      <div className="relative">
        <input
          id="search-input"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Buscar rua, bairro ou local..."
          className="
            w-full border border-slate-200 bg-white rounded-xl pl-10 pr-10 py-3.5
            text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm
          "
        />

        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          ) : (
            query.length > 0 && (
              <button
                onClick={clearSearch}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )
          )}
        </div>

        {/* MÚLTIPLAS CONDIÇÕES: Mostra se tiver sugestões OU se estiver focado, vazio e com histórico */}
        {(suggestions.length > 0 || (isFocused && query.trim() === "" && recentSearches.length > 0)) && (
          <div className="absolute top-full left-0 right-0 mt-2 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xl z-50">
            
            {/* LISTA DE HISTÓRICO RECENTE */}
            {isFocused && query.trim() === "" && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscas Recentes</span>
                  <button 
                    onClick={() => setRecentSearches([])}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                  >
                    Limpar
                  </button>
                </div>
                {recentSearches.map((item) => {
                  const parts = item.display_name.split(", ");
                  return (
                    <button
                      key={`recent-${item.place_id}`}
                      onClick={() => selectLocation(item)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors flex items-start gap-3 group"
                    >
                      <Clock size={16} className="text-slate-300 group-hover:text-blue-500 mt-0.5 shrink-0 transition-colors" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-600 group-hover:text-slate-800 truncate">{parts[0]}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{parts.slice(1).join(", ")}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* LISTA DE SUGESTÕES DA API */}
            {suggestions.length > 0 && suggestions.map((item) => {
              const parts = item.display_name.split(", ");
              return (
                <button
                  key={`suggestion-${item.place_id}`}
                  onClick={() => selectLocation(item)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-b-0 transition-colors flex items-start gap-3 group"
                >
                  <MapPin size={16} className="text-slate-400 group-hover:text-blue-600 mt-0.5 shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{parts[0]}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{parts.slice(1).join(", ")}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Estado Vazio */}
        {!loading && showNoResults && query.length >= 3 && (
          <div className="absolute top-full left-0 right-0 mt-2 border border-slate-100 rounded-xl bg-white shadow-xl z-50 p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <MapPinOff size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Local não encontrado</p>
              <p className="text-xs text-slate-500 mt-0.5">Tente buscar por um nome mais genérico.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}