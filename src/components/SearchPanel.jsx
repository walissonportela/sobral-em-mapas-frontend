import { useEffect, useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";

export default function SearchPanel({
  onSearch,
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] =
    useState(false);

  const [suggestions, setSuggestions] =
    useState([]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&countrycodes=br&format=json&limit=5`
        );

        const data =
          await response.json();

        setSuggestions(data);
      } catch (error) {
        console.error(error);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&countrycodes=br&format=json&limit=1`
      );

      const data =
        await response.json();

      if (!data.length) {
        alert(
          "Localização não encontrada."
        );
        return;
      }

      selectLocation(data[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (item) => {
    onSearch({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      name: item.display_name,
    });

    setQuery(item.display_name);
    setSuggestions([]);
  };

  return (
    <div className="p-5">
        <div className="relative">

        <input
            value={query}
            onChange={(e) =>
            setQuery(e.target.value)
            }
            onKeyDown={(e) => {
            if (e.key === "Enter") {
                handleSearch();
            }
            }}
            placeholder="Buscar endereço..."
            className="
            w-full
            border
            rounded-xl
            pl-10
            pr-10
            py-3
            text-sm
            outline-none
            focus:border-blue-500
            "
        />

        {suggestions.length > 0 && (
            <div
                className="
                mt-2
                border
                rounded-xl
                overflow-hidden
                bg-white
                shadow-lg
                "
            >
                {suggestions.map((item) => (
                <button
                    key={item.place_id}
                    onClick={() =>
                    selectLocation(item)
                    }
                    className="
                    w-full
                    text-left
                    px-4
                    py-3
                    hover:bg-blue-50
                    border-b
                    last:border-b-0
                    "
                >
                    {item.display_name}
                </button>
                ))}
            </div>
            )}

        {loading && (
            <Loader2
            size={16}
            className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                animate-spin
                text-blue-600
            "
            />
        )}

        <Search
            size={18}
            onClick={handleSearch}
            className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
                cursor-pointer
                hover:text-blue-600
            "
            />

        </div>

    </div>
  );
}