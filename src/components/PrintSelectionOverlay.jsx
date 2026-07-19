import { useEffect, useMemo, useState } from "react";
import {
  X,
  Move,
  Download,
  Loader2,
} from "lucide-react";

export default function PrintSelectionOverlay({
  selection,
  setSelection,
  format,
  setFormat,
  onClose,
  onExport,
  isExporting,
  containerRef,
}) {

  // Verifica se o armazenamento está cheio ao abrir o painel
  useEffect(() => {
    const checkStorageQuota = () => {
      try {
        // Tenta gravar um dado temporário minúsculo para testar se há espaço
        localStorage.setItem('__test_quota__', 'test');
        localStorage.removeItem('__test_quota__');
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          alert(
            "Memória de impressão cheia! \n\n" +
            "Para continuar exportando, por favor, recarregue a página (F5) " +
            "ou limpe o histórico de impressões no painel lateral."
          );
        }
      }
    };

    checkStorageQuota();
  }, []);
  
  const [dragState, setDragState] = useState(null);

  const [containerSize, setContainerSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const updateContainerSize = () => {
      const rect =
        containerRef.current?.getBoundingClientRect();

      if (!rect) return;

      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateContainerSize();

    window.addEventListener(
      "resize",
      updateContainerSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateContainerSize
      );
    };
  }, [containerRef]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event) => {
      const deltaX =
        event.clientX - dragState.startX;

      const deltaY =
        event.clientY - dragState.startY;

      if (dragState.type === "move") {
        const nextX = clamp(
          dragState.initial.x + deltaX,
          0,
          containerSize.width -
            dragState.initial.width
        );

        const nextY = clamp(
          dragState.initial.y + deltaY,
          0,
          containerSize.height -
            dragState.initial.height
        );

        setSelection((previous) => ({
          ...previous,
          x: nextX,
          y: nextY,
        }));
      }

      if (dragState.type === "resize") {
        const nextWidth = clamp(
          dragState.initial.width + deltaX,
          280,
          containerSize.width -
            dragState.initial.x
        );

        const nextHeight = clamp(
          dragState.initial.height + deltaY,
          210,
          containerSize.height -
            dragState.initial.y
        );

        setSelection((previous) => ({
          ...previous,
          width: nextWidth,
          height: nextHeight,
        }));
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );
    };
  }, [
    dragState,
    containerSize,
    setSelection,
  ]);

  const startMove = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragState({
      type: "move",
      startX: event.clientX,
      startY: event.clientY,
      initial: selection,
    });
  };

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragState({
      type: "resize",
      startX: event.clientX,
      startY: event.clientY,
      initial: selection,
    });
  };

  const toolbarStyle = useMemo(() => {
    return getPrintToolbarStyle(
      selection,
      containerSize
    );
  }, [selection, containerSize]);

  return (
    <div
      data-print-overlay="true"
      className="
        absolute
        inset-0
        z-[1400]
        pointer-events-none
      "
    >
      <div className="absolute inset-0 bg-slate-950/30" />

      <div
        className="
          absolute
          rounded-2xl
          border-4
          border-amber-400
          bg-transparent
          shadow-[0_0_0_9999px_rgba(15,23,42,0.38)]
          pointer-events-auto
          overflow-hidden
        "
        style={{
          left: selection.x,
          top: selection.y,
          width: selection.width,
          height: selection.height,
        }}
      >
        <div
          onPointerDown={startMove}
          className="
            absolute
            left-0
            right-0
            top-0
            h-11
            bg-amber-400
            text-blue-950
            px-4
            text-xs
            font-black
            flex
            items-center
            justify-between
            gap-3
            cursor-move
            select-none
          "
        >
          <span className="flex items-center gap-2">
            <Move size={15} />
            Área de impressão
          </span>

          <span>
            {Math.round(selection.width)} ×{" "}
            {Math.round(selection.height)}
          </span>
        </div>

        <div
          onPointerDown={startResize}
          className="
            absolute
            right-0
            bottom-0
            h-10
            w-10
            bg-amber-400
            cursor-nwse-resize
            rounded-tl-xl
            flex
            items-center
            justify-center
            text-blue-950
            font-black
            select-none
          "
          title="Redimensionar"
        >
          ↘
        </div>
      </div>

      <div
        className="
          absolute
          w-[285px]
          rounded-3xl
          bg-white
          border
          border-slate-200
          shadow-2xl
          pointer-events-auto
          overflow-hidden
        "
        style={toolbarStyle}
        onPointerDown={(event) =>
          event.stopPropagation()
        }
      >
        <div
          className="
            bg-gradient-to-br
            from-blue-700
            via-blue-800
            to-blue-900
            text-white
            p-4
          "
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-base leading-tight">
                Exportar área
              </h3>

              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Escolha o formato e exporte a área selecionada.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                h-9
                w-9
                rounded-xl
                bg-white/10
                hover:bg-white/20
                transition
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {["pdf", "png", "jpeg"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                className={`
                  rounded-xl
                  px-3
                  py-2.5
                  text-xs
                  font-black
                  uppercase
                  transition
                  ${
                    format === item
                      ? "bg-blue-700 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="
              mt-4
              w-full
              rounded-2xl
              bg-amber-400
              text-blue-950
              px-4
              py-3
              font-black
              hover:bg-amber-300
              disabled:opacity-60
              disabled:cursor-wait
              transition
              flex
              items-center
              justify-center
              gap-2
            "
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download size={18} />
                Exportar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              mt-2
              w-full
              rounded-2xl
              bg-slate-100
              text-slate-600
              px-4
              py-3
              font-bold
              hover:bg-slate-200
              transition
            "
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function getPrintToolbarStyle(
  selection,
  containerSize
) {
  const toolbarWidth = 285;
  const toolbarHeight = 250;
  const gap = 12;
  const margin = 16;

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  let left = selection.x + selection.width + gap;
  let top = selection.y;

  const hasSpaceOnRight =
    left + toolbarWidth <= containerWidth - margin;

  if (!hasSpaceOnRight) {
    left =
      selection.x +
      selection.width -
      toolbarWidth -
      gap;
  }

  if (left < margin) {
    left = margin;
  }

  if (left + toolbarWidth > containerWidth - margin) {
    left = containerWidth - toolbarWidth - margin;
  }

  if (top + toolbarHeight > containerHeight - margin) {
    top = containerHeight - toolbarHeight - margin;
  }

  if (top < margin) {
    top = margin;
  }

  return {
    left,
    top,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}