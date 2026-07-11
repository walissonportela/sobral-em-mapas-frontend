import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  X,
  MousePointer2,
} from "lucide-react";

export default function TutorialOverlay({
  open,
  onClose,
}) {
  const sidebarStepAdjustments = {
    placement: "right",
    disableScroll: true,
    spotlightPadding: 3,
    spotlightOffsetX: -8,
    spotlightOffsetY: 0,
    cardOffsetX: -8,
  };

  const steps = useMemo(
    () => [
      {
        selector: "[data-tour='sidebar']",
        title: "Menu lateral",
        text: "Aqui ficam as principais ferramentas do mapa. Você pode acessar camadas, legendas, busca, medição, marcadores, impressão, limpar o mapa e ativar tela cheia.",
        placement: "right",
        disableScroll: true,
        spotlightPadding: 0,
        spotlightOffsetX: -8,
        cardOffsetX: -8,
      },
      {
        selector: "[data-tour='layers-button']",
        title: "Camadas",
        text: "Neste botão você acessa a lista de mapas temáticos disponíveis. Ao marcar uma camada, ela aparece sobre o mapa.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='legend-button']",
        title: "Legendas",
        text: "Aqui ficam as informações das camadas ativas, incluindo descrição, categoria, subcategoria e prévia visual quando disponível.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='search-button']",
        title: "Busca de locais",
        text: "Use esta opção para pesquisar endereços, bairros, locais de interesse ou coordenadas no mapa.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='measure-button']",
        title: "Medição",
        text: "Nesta ferramenta você pode medir distâncias e áreas diretamente no mapa. É útil para calcular trechos, perímetros e áreas aproximadas.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='bookmarks-button']",
        title: "Marcadores",
        text: "Aqui ficam as camadas favoritas. Você pode marcar camadas com estrela para acessá-las rapidamente depois.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='print-button']",
        title: "Impressão",
        text: "Nesta área você poderá imprimir o mapa atual, salvar como PDF e, futuramente, exportar a área do mapa como PNG ou JPEG.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='clear-button']",
        title: "Limpar mapa",
        text: "Este botão remove as camadas ativas e limpa desenhos ou medições feitas no mapa.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='fullscreen-button']",
        title: "Tela cheia",
        text: "Use este botão para expandir o sistema em tela cheia e aproveitar melhor a visualização do mapa.",
        ...sidebarStepAdjustments,
      },
      {
        selector: "[data-tour='map-zoom-controls']",
        title: "Controles de zoom",
        text: "Estes botões permitem aproximar ou afastar o mapa rapidamente usando o zoom manual.",
        placement: "left",
        disableScroll: true,
        spotlightPadding: 6,
        spotlightOffsetX: 0,
        cardOffsetX: -8,
      },
      {
        selector: "[data-tour='contact-button']",
        title: "Contato",
        text: "Neste menu você pode enviar dúvidas, sugestões, solicitações ou relatar problemas encontrados no mapa.",
        placement: "bottom",
        disableScroll: true,
      },
      {
        selector: "[data-tour='about-button']",
        title: "Sobre",
        text: "Aqui você acessa uma página com informações sobre a cidade e sobre o projeto Sobral em Mapas.",
        placement: "bottom",
        disableScroll: true,
      },
      {
        selector: "[data-tour='login-area']",
        title: "Área do usuário",
        text: "Neste espaço ficam as opções de login, acesso administrativo e informações do usuário autenticado.",
        placement: "bottom-left",
        disableScroll: true,
      },
      {
        selector: "[data-tour='chat-button']",
        title: "Chat",
        text: "O chat pode auxiliar o usuário com dúvidas rápidas, orientações e apoio durante o uso do sistema.",
        placement: "left",
        disableScroll: true,
        spotlightPadding: 8,
        cardOffsetX: -8,
      },
    ],
    []
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        setCurrentStep((previous) =>
          Math.min(previous + 1, steps.length - 1)
        );
      }

      if (event.key === "ArrowLeft") {
        setCurrentStep((previous) =>
          Math.max(previous - 1, 0)
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose, steps.length]);

  useEffect(() => {
    if (!open || !step) return;

    let timeoutId;

    const updateTarget = () => {
      const element = document.querySelector(step.selector);

      if (!element) {
        setTargetRect(null);
        return;
      }

      if (!step.disableScroll) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }

      timeoutId = window.setTimeout(() => {
        const rect = element.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        });
      }, 180);
    };

    updateTarget();

    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open || !step) {
    return null;
  }

  const spotlightStyle = getSpotlightStyle(
    targetRect,
    step
  );

  const cardStyle = getCardStyle(
    targetRect,
    step
  );

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {targetRect && (
        <div
          className="
            absolute
            rounded-3xl
            border-4
            border-amber-400
            bg-transparent
            shadow-[0_0_0_9999px_rgba(15,23,42,0.78)]
            transition-all
            duration-300
          "
          style={spotlightStyle}
        />
      )}

      {!targetRect && (
        <div className="absolute inset-0 bg-slate-950/80" />
      )}

      <div
        className="
          absolute
          w-[360px]
          max-w-[calc(100vw-2rem)]
          bg-white
          rounded-3xl
          shadow-2xl
          border
          border-slate-200
          pointer-events-auto
          overflow-hidden
        "
        style={cardStyle}
      >
        <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center">
                <MousePointer2 size={21} />
              </div>

              <div>
                <p className="text-xs text-blue-100 font-bold">
                  Passo {currentStep + 1} de {steps.length}
                </p>

                <h2 className="text-lg font-black">
                  {step.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {step.text}
          </p>

          <div className="flex items-center gap-1 mt-5 flex-wrap">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`
                  h-2
                  rounded-full
                  transition-all
                  ${
                    index === currentStep
                      ? "w-8 bg-blue-700"
                      : "w-2 bg-slate-200"
                  }
                `}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={() =>
                setCurrentStep((previous) =>
                  Math.max(previous - 1, 0)
                )
              }
              disabled={isFirst}
              className="
                px-4
                py-2.5
                rounded-2xl
                bg-slate-100
                text-slate-700
                font-bold
                hover:bg-slate-200
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
                flex
                items-center
                gap-2
              "
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="
                  px-4
                  py-2.5
                  rounded-2xl
                  bg-blue-700
                  text-white
                  font-bold
                  hover:bg-blue-800
                  transition
                "
              >
                Concluir
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setCurrentStep((previous) =>
                    Math.min(
                      previous + 1,
                      steps.length - 1
                    )
                  )
                }
                className="
                  px-4
                  py-2.5
                  rounded-2xl
                  bg-blue-700
                  text-white
                  font-bold
                  hover:bg-blue-800
                  transition
                  flex
                  items-center
                  gap-2
                "
              >
                Próximo
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition"
          >
            Pular tutorial
          </button>
        </div>
      </div>
    </div>
  );
}

function getSpotlightStyle(rect, step = {}) {
  if (!rect) return {};

  const padding = step.spotlightPadding ?? 8;
  const offsetX = step.spotlightOffsetX ?? 0;
  const offsetY = step.spotlightOffsetY ?? 0;

  return {
    top: Math.max(rect.top - padding + offsetY, 8),
    left: Math.max(rect.left - padding + offsetX, 8),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function getCardStyle(rect, step = {}) {
  const placement = step.placement || "right";

  const cardWidth = 360;
  const cardHeight = 300;
  const margin = 14;

  const cardOffsetX = step.cardOffsetX ?? 0;
  const cardOffsetY = step.cardOffsetY ?? 0;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  let top = rect.top;
  let left = rect.right + margin;

  if (placement === "left") {
    left = rect.left - cardWidth - margin;
    top = rect.top;
  }

  if (placement === "right") {
    left = rect.right + margin;
    top = rect.top;
  }

  if (placement === "bottom") {
    left = rect.left;
    top = rect.bottom + margin;
  }

  if (placement === "bottom-left") {
    left = rect.right - cardWidth;
    top = rect.bottom + margin;
  }

  if (placement === "top") {
    left = rect.left;
    top = rect.top - cardHeight - margin;
  }

  left += cardOffsetX;
  top += cardOffsetY;

  if (left + cardWidth > windowWidth - margin) {
    left = windowWidth - cardWidth - margin;
  }

  if (left < margin) {
    left = margin;
  }

  if (top + cardHeight > windowHeight - margin) {
    top = windowHeight - cardHeight - margin;
  }

  if (top < margin) {
    top = margin;
  }

  return {
    top,
    left,
  };
}