import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
} from "react-router-dom";

import {
  ArrowLeft,
  UserCircle,
  Mail,
  Shield,
  Star,
  Printer,
  Image as ImageIcon,
  Calendar,
  Layers,
  Download,
  Trash2,
  Map as MapIcon,
  BadgeCheck,
  Sparkles,
  Clock3,
  HardDrive,
  MapPinned,
} from "lucide-react";

import { jsPDF } from "jspdf";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  const [heroImageError, setHeroImageError] =
    useState(false);

  const [layers, setLayers] = useState([]);
  const [loadingLayers, setLoadingLayers] =
    useState(true);

  const [favoriteLayerIds, setFavoriteLayerIds] =
    useState([]);

  const [printHistory, setPrintHistory] =
    useState([]);

  const userStorageId = useMemo(() => {
    return getCurrentUserStorageId(user);
  }, [user]);

  const favoriteStorageKey = useMemo(() => {
    return `sobral_map_favorite_layers_${userStorageId}`;
  }, [userStorageId]);

  const printHistoryStorageKey = useMemo(() => {
    return `sobral_map_print_history_${userStorageId}`;
  }, [userStorageId]);

  useEffect(() => {
    if (!user) return;

    setFavoriteLayerIds(
      loadStringArray(favoriteStorageKey)
    );

    setPrintHistory(
      loadArray(printHistoryStorageKey)
    );
  }, [
    user,
    favoriteStorageKey,
    printHistoryStorageKey,
  ]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadLayers() {
      try {
        setLoadingLayers(true);

        const response = await api.get("/map-data");

        if (!isMounted) return;

        setLayers(
          response.data?.data?.layers || []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar camadas favoritas:",
          error
        );
      } finally {
        if (isMounted) {
          setLoadingLayers(false);
        }
      }
    }

    loadLayers();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const favoriteLayers = useMemo(() => {
    return layers.filter((layer) =>
      favoriteLayerIds.includes(String(layer.id))
    );
  }, [layers, favoriteLayerIds]);

  const handleRemoveFavorite = (layerId) => {
    const next = favoriteLayerIds.filter(
      (id) => id !== String(layerId)
    );

    setFavoriteLayerIds(next);

    localStorage.setItem(
      favoriteStorageKey,
      JSON.stringify(next)
    );
  };

  const handleDeletePrint = (itemId) => {
    const next = printHistory.filter(
      (item) => item.id !== itemId
    );

    setPrintHistory(next);

    localStorage.setItem(
      printHistoryStorageKey,
      JSON.stringify(next)
    );
  };

  const handleClearPrintHistory = () => {
    setPrintHistory([]);

    localStorage.setItem(
      printHistoryStorageKey,
      JSON.stringify([])
    );
  };

  const handleExportPrint = async (
    item,
    format
  ) => {
    try {
      await exportHistoryImage(item, format);
    } catch (error) {
      console.error(
        "Erro ao exportar impressão:",
        error
      );

      alert(
        "Não foi possível exportar esta impressão. Ela pode ter sido salva antes da prévia da imagem existir."
      );
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const profileName =
    user.profile?.nome ||
    user.profile?.name ||
    "Visitante";

  const lastPrint = printHistory[0];

  return (
    <div className="h-screen overflow-y-auto bg-slate-100">
      <section
        className="
          relative
          overflow-hidden
          min-h-[520px]
          bg-gradient-to-br
          from-blue-700
          via-blue-800
          to-blue-950
          text-white
        "
      >
        {!heroImageError && (
          <img
            src="/images/sobral-hero.jpg"
            alt="Sobral"
            onError={() => setHeroImageError(true)}
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              opacity-25
            "
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-900/75 to-blue-800/60" />

        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400" />
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="
                inline-flex
                items-center
                gap-2
                text-blue-100
                hover:text-white
                transition
                text-sm
                font-medium
              "
            >
              <ArrowLeft size={18} />
              Voltar para o mapa
            </Link>

            <div
              className="
                hidden
                md:flex
                items-center
                gap-2
                rounded-2xl
                bg-white/10
                border
                border-white/10
                px-4
                py-2
                text-sm
                text-blue-100
                backdrop-blur
              "
            >
              <MapIcon size={17} />
              Sobral em Mapas
            </div>
          </div>

          <div className="mt-12 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div
                className="
                  relative
                  h-28
                  w-28
                  rounded-[2.2rem]
                  bg-amber-400
                  text-blue-950
                  flex
                  items-center
                  justify-center
                  text-5xl
                  font-black
                  shadow-2xl
                  border
                  border-white/20
                  shrink-0
                "
              >
                {getInitial(user.name)}

                <div
                  className="
                    absolute
                    -right-2
                    -bottom-2
                    h-10
                    w-10
                    rounded-2xl
                    bg-blue-700
                    text-amber-300
                    border-4
                    border-blue-950
                    flex
                    items-center
                    justify-center
                  "
                >
                  <BadgeCheck size={20} />
                </div>
              </div>

              <div>
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-amber-400/15
                    border
                    border-amber-300/20
                    px-3
                    py-1
                    text-xs
                    font-black
                    text-amber-300
                    uppercase
                    tracking-wide
                  "
                >
                  <Sparkles size={14} />
                  Minha conta
                </div>

                <h1 className="text-4xl lg:text-6xl font-black mt-4 leading-tight">
                  {user.name || "Usuário"}
                </h1>

                <p className="text-blue-100 mt-3 max-w-2xl text-lg leading-relaxed">
                  Gerencie seus dados, camadas favoritas e impressões recentes
                  salvas neste navegador.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <UserBadge
                    icon={<Shield size={15} />}
                    text={profileName}
                  />

                  <UserBadge
                    icon={<Mail size={15} />}
                    text={user.email || "E-mail não informado"}
                  />
                </div>
              </div>
            </div>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-3
                gap-3
                xl:min-w-[520px]
              "
            >
              <MetricCard
                icon={<Star size={20} />}
                label="Favoritos"
                value={favoriteLayerIds.length}
              />

              <MetricCard
                icon={<Printer size={20} />}
                label="Impressões"
                value={printHistory.length}
              />

              <MetricCard
                icon={<Clock3 size={20} />}
                label="Última ação"
                value={lastPrint ? "Recente" : "Sem dados"}
                small
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 pb-16">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="
              lg:col-span-1
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-slate-200
              overflow-hidden
            "
          >
            <div className="p-6 border-b border-slate-100">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <UserCircle size={26} />
              </div>

              <h2 className="font-black text-slate-800 text-xl mt-4">
                Dados do usuário
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Informações básicas da conta logada.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <InfoRow
                icon={<UserCircle size={18} />}
                label="Nome"
                value={user.name || "Não informado"}
              />

              <InfoRow
                icon={<Mail size={18} />}
                label="E-mail"
                value={user.email || "Não informado"}
              />

              <InfoRow
                icon={<Shield size={18} />}
                label="Perfil"
                value={profileName}
              />

              <InfoRow
                icon={<HardDrive size={18} />}
                label="Armazenamento"
                value="Local do navegador"
              />
            </div>
          </div>

          <div
            className="
              lg:col-span-2
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            "
          >
            <SummaryCard
              icon={
                <Star
                  size={30}
                  fill="currentColor"
                />
              }
              title="Camadas favoritas"
              text="Camadas salvas para acesso rápido no mapa."
              value={favoriteLayerIds.length}
              color="amber"
            />

            <SummaryCard
              icon={<Printer size={30} />}
              title="Impressões recentes"
              text="Recortes exportados e disponíveis para baixar novamente."
              value={printHistory.length}
              color="blue"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <div
            className="
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-slate-200
              overflow-hidden
            "
          >
            <SectionHeader
              icon={
                <Star
                  size={23}
                  fill="currentColor"
                />
              }
              title="Camadas favoritas"
              subtitle="Favoritos vinculados ao usuário logado."
              color="amber"
            />

            <div className="p-5 max-h-[620px] overflow-y-auto">
              {loadingLayers ? (
                <LoadingBlock text="Carregando favoritos..." />
              ) : favoriteLayers.length === 0 ? (
                <EmptyBlock
                  icon={<Layers size={28} />}
                  title="Nenhuma camada favorita"
                  text="Favorite camadas pelo painel lateral do mapa para vê-las aqui."
                />
              ) : (
                <div className="space-y-3">
                  {favoriteLayers.map((layer) => (
                    <FavoriteLayerCard
                      key={layer.id}
                      layer={layer}
                      onRemove={() =>
                        handleRemoveFavorite(layer.id)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-slate-200
              overflow-hidden
            "
          >
            <div className="relative">
              <SectionHeader
                icon={<Printer size={23} />}
                title="Últimas impressões"
                subtitle="Baixe novamente em PDF, PNG ou JPEG."
                color="blue"
              />

              {printHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPrintHistory}
                  className="
                    absolute
                    right-5
                    top-1/2
                    -translate-y-1/2
                    h-10
                    w-10
                    rounded-xl
                    bg-red-50
                    text-red-600
                    hover:bg-red-100
                    transition
                    flex
                    items-center
                    justify-center
                  "
                  title="Limpar histórico"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>

            <div className="p-5 max-h-[620px] overflow-y-auto">
              {printHistory.length === 0 ? (
                <EmptyBlock
                  icon={<ImageIcon size={28} />}
                  title="Nenhuma impressão salva"
                  text="As impressões exportadas pelo mapa aparecerão aqui."
                />
              ) : (
                <div className="space-y-4">
                  {printHistory.map((item) => (
                    <PrintHistoryCard
                      key={item.id}
                      item={item}
                      onDelete={() =>
                        handleDeletePrint(item.id)
                      }
                      onExport={(format) =>
                        handleExportPrint(
                          item,
                          format
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function UserBadge({ icon, text }) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-2
        rounded-2xl
        bg-white/10
        border
        border-white/10
        px-4
        py-2
        text-sm
        text-blue-100
        backdrop-blur
        max-w-full
      "
    >
      {icon}

      <span className="truncate">
        {text}
      </span>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  small = false,
}) {
  return (
    <div
      className="
        rounded-3xl
        bg-white/10
        border
        border-white/10
        p-5
        backdrop-blur
      "
    >
      <div className="flex items-center gap-2 text-blue-100">
        {icon}
        <span className="text-sm">
          {label}
        </span>
      </div>

      <p
        className={`
          font-black
          mt-3
          ${small ? "text-2xl" : "text-4xl"}
        `}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  text,
  value,
  color,
}) {
  const colorClasses =
    color === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-blue-50 text-blue-700";

  return (
    <div
      className="
        relative
        overflow-hidden
        bg-white
        rounded-3xl
        shadow-sm
        border
        border-slate-200
        p-6
      "
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-100" />

      <div className="relative">
        <div
          className={`
            h-14
            w-14
            rounded-2xl
            flex
            items-center
            justify-center
            ${colorClasses}
          `}
        >
          {icon}
        </div>

        <h2 className="font-black text-slate-800 text-xl mt-5">
          {title}
        </h2>

        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          {text}
        </p>

        <div className="mt-7 flex items-end gap-2">
          <span className="text-5xl font-black text-slate-800">
            {value}
          </span>

          <span className="text-sm text-slate-400 mb-2">
            registros
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  color,
}) {
  const colorClasses =
    color === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-blue-50 text-blue-700";

  return (
    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
      <div
        className={`
          h-12
          w-12
          rounded-2xl
          flex
          items-center
          justify-center
          shrink-0
          ${colorClasses}
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="font-black text-slate-800 text-xl">
          {title}
        </h2>

        <p className="text-sm text-slate-500 truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-400">
          {label}
        </p>

        <p
          className="font-semibold text-slate-700 truncate"
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FavoriteLayerCard({ layer, onRemove }) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        p-4
        hover:bg-slate-50
        transition
        flex
        items-start
        justify-between
        gap-3
      "
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star size={16} fill="currentColor" />
          </div>

          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-sm truncate">
              {layer.name}
            </h3>

            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {layer.subcategory?.category?.name ||
                "Sem categoria"}{" "}
              •{" "}
              {layer.subcategory?.name ||
                "Sem subcategoria"}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
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
        title="Remover favorito"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function PrintHistoryCard({
  item,
  onDelete,
  onExport,
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-sm
        overflow-hidden
      "
    >
      {item.imageDataUrl ? (
        <img
          src={item.imageDataUrl}
          alt="Prévia da impressão"
          className="h-48 w-full object-cover bg-slate-100"
        />
      ) : (
        <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400">
          <ImageIcon size={32} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={14} />
              {formatDate(item.createdAt)}
            </div>

            <p className="text-xs text-slate-400 mt-2">
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
              <span className="uppercase font-bold">
                {item.format || "pdf"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onDelete}
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
            title="Excluir impressão"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {item.layers?.length > 0 && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2">
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
          {["pdf", "png", "jpeg"].map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => onExport(format)}
              className="
                rounded-xl
                bg-slate-100
                text-slate-600
                hover:bg-blue-700
                hover:text-white
                px-3
                py-2.5
                text-xs
                font-black
                uppercase
                transition
                flex
                items-center
                justify-center
                gap-1
              "
            >
              <Download size={14} />
              {format}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingBlock({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

function EmptyBlock({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        {icon}
      </div>

      <h3 className="font-bold text-slate-700 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {text}
      </p>
    </div>
  );
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "U";
}

function getCurrentUserStorageId(user) {
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

      const storedUser =
        parsed?.user ||
        parsed?.data?.user ||
        parsed;

      const identifier =
        storedUser?.id ||
        storedUser?.email ||
        storedUser?.login ||
        storedUser?.name;

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

  const userIdentifier =
    user?.id ||
    user?.email ||
    user?.login ||
    user?.name;

  return userIdentifier
    ? String(userIdentifier)
    : "guest";
}

function loadStringArray(storageKey) {
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

function loadArray(storageKey) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "Data não informada";

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