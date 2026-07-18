import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  // Calcula os passos e configurações visual dependendo da tela atual
  const steps = useMemo(() => {
    const isMobile = window.innerWidth < 768;
    const suffix = isMobile ? "-mobile" : "";

    const sidebarAdjustments = {
      placement: isMobile ? "bottom" : "right",
      disableScroll: !isMobile,
      spotlightPadding: isMobile ? 4 : 3,
      spotlightOffsetX: isMobile ? 0 : -8,
      spotlightOffsetY: 0,
      cardOffsetX: isMobile ? 0 : -8,
      cardOffsetY: isMobile ? 12 : 0,
    };

    const allSteps = [
      {
        selector: `[data-tour='sidebar${suffix}']`,
        title: "Menu lateral",
        text: "Aqui ficam as principais ferramentas do mapa. Você pode acessar mapas, informações, busca, medição, marcadores, impressão, limpar o mapa e ativar tela cheia.",
        placement: isMobile ? "bottom" : "right",
        disableScroll: !isMobile,
        spotlightPadding: 0,
        spotlightOffsetX: isMobile ? 0 : -8,
        spotlightOffsetY: 0,
        cardOffsetX: isMobile ? 0 : -8,
        cardOffsetY: isMobile ? 12 : 0,
      },
      {
        selector: `[data-tour='layers-button${suffix}']`,
        title: "Mapas",
        text: "Neste botão você acessa a lista de mapas temáticos disponíveis. Ao marcar uma camada, ela aparece sobre o mapa.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='legend-button${suffix}']`,
        title: "Informações",
        text: "Aqui ficam as informações dos mapas ativos, incluindo descrição, categoria, subcategoria e prévia visual quando disponível.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='search-button${suffix}']`,
        title: "Busca de locais",
        text: "Use esta opção para pesquisar endereços, bairros, locais de interesse ou coordenadas no mapa.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='measure-button${suffix}']`,
        title: "Medição",
        text: "Nesta ferramenta você pode medir distâncias e áreas diretamente no mapa. É útil para calcular trechos, perímetros e áreas aproximadas.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='bookmarks-button${suffix}']`,
        title: "Favoritos",
        text: "Aqui ficam os mapas favoritos. Você pode marcar mapas com estrela para acessá-los rapidamente depois.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='print-button${suffix}']`,
        title: "Impressão",
        text: "Nesta área você poderá imprimir o mapa atual, salvar como PDF e, futuramente, exportar a área do mapa como PNG ou JPEG.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='clear-button${suffix}']`,
        title: "Limpar mapa",
        text: "Este botão remove os mapas ativos e limpa desenhos ou medições feitas no mapa.",
        ...sidebarAdjustments,
      },
      {
        selector: `[data-tour='fullscreen-button${suffix}']`,
        title: "Tela cheia",
        text: "Use este botão para expandir o sistema em tela cheia e aproveitar melhor a visualização do mapa.",
        ...sidebarAdjustments,
      },
      {
        selector: "[data-tour='map-controls']",
        title: "Controles do mapa",
        text: "Nesta área você encontra os principais controles do mapa, como zoom, localização, troca do mapa base e visualização da legenda.",
        placement: isMobile ? "top" : "left",
        disableScroll: true,
        spotlightPadding: 8,
        spotlightOffsetX: 0,
        spotlightOffsetY: 0,
        cardOffsetX: isMobile ? 0 : -8,
        cardOffsetY: isMobile ? -12 : 0,
      },
      {
        selector: "[data-tour='contact-button']",
        title: "Contato",
        text: "Neste menu você pode enviar dúvidas, sugestões, solicitações ou relatar problemas encontrados no mapa.",
        placement: isMobile ? "top" : "bottom",
        disableScroll: true,
        spotlightPadding: 8,
        spotlightOffsetX: 0,
        spotlightOffsetY: 0,
        cardOffsetX: 0,
        cardOffsetY: isMobile ? -12 : 0,
      },
      {
        selector: "[data-tour='about-button']",
        title: "Sobre",
        text: "Aqui você acessa uma página com informações sobre a cidade e sobre o projeto Sobral em Mapas.",
        placement: isMobile ? "top" : "bottom",
        disableScroll: true,
        spotlightPadding: 8,
        spotlightOffsetX: 0,
        spotlightOffsetY: 0,
        cardOffsetX: 0,
        cardOffsetY: isMobile ? -12 : 0,
      },
      {
        selector: "[data-tour='login-area']",
        title: "Área do usuário",
        text: "Neste espaço ficam as opções de login, acesso administrativo e informações do usuário autenticado.",
        placement: isMobile ? "top" : "bottom-left",
        disableScroll: true,
        spotlightPadding: 8,
        spotlightOffsetX: 0,
        spotlightOffsetY: 0,
        cardOffsetX: 0,
        cardOffsetY: isMobile ? -12 : 0,
      },
      {
        selector: "[data-tour='chat-button']",
        title: "Chat",
        text: "O chat pode auxiliar o usuário com dúvidas rápidas, orientações e apoio durante o uso do sistema.",
        placement: isMobile ? "top" : "left",
        disableScroll: true,
        spotlightPadding: 8,
        spotlightOffsetX: 0,
        spotlightOffsetY: 0,
        cardOffsetX: isMobile ? 0 : -8,
        cardOffsetY: isMobile ? -12 : 0,
      },
    ];

    if (isMobile) {
      return allSteps.filter(step => 
        !step.selector.includes('map-controls') &&
        !step.selector.includes('login-area') &&
        !step.selector.includes('contact-button') &&
        !step.selector.includes('about-button') &&
        !step.selector.includes('chat-button')
      );
    }

    return allSteps;
  }, []);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Dispara o evento para abrir/fechar o menu mobile dependendo do passo
  useEffect(() => {
    if (!open) return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const isSidebarStep = currentStep <= 8;

    window.dispatchEvent(
      new CustomEvent("sobral-tutorial-sidebar", {
        detail: { open: isSidebarStep },
      })
    );
  }, [currentStep, open]);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setTargetRect(null);
    onClose();
  }, [onClose]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  }, []);

  const goToNextStep = useCallback(() => {
    setCurrentStep((previous) => Math.min(previous + 1, steps.length - 1));
  }, [steps.length]);

  // Controles do teclado
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key === "ArrowRight") {
        goToNextStep();
        return;
      }
      if (event.key === "ArrowLeft") {
        goToPreviousStep();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose, goToNextStep, goToPreviousStep]);

  useLayoutEffect(() => {
    if (!open || !step) return undefined;

    let animationFrameId = null;
    let scrollTimeoutId = null;
    let transitionTimeoutId = null;
    let resizeObserver = null;
    let cancelled = false;

    const measureTarget = () => {
      const element = document.querySelector(step.selector);

      if (!element || cancelled) return;

      const rect = element.getBoundingClientRect();

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
    };

    const scheduleMeasurement = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(() => {
        measureTarget();
      });
    };

    const isMobile = window.innerWidth < 768;
    const isSidebarStep = currentStep <= 8;

    // Se no Mobile ele for transicionar entre um passo de dentro do Menu
    // para um de fora, precisamos de uma pausa leve para o DOM redesenhar 
    // o bloqueio escuro sumindo.
    const waitTime = isMobile && !isSidebarStep ? 350 : 0;

    transitionTimeoutId = setTimeout(() => {
        if (cancelled) return;

        const element = document.querySelector(step.selector);

        if (element && !step.disableScroll) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });

            scheduleMeasurement();

            scrollTimeoutId = window.setTimeout(() => {
                scheduleMeasurement();
            }, 350);
        } else {
            scheduleMeasurement();
        }

        const handleWindowChange = () => scheduleMeasurement();
        window.addEventListener("resize", handleWindowChange);
        window.addEventListener("scroll", handleWindowChange, true);

        if (element && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => scheduleMeasurement());
            resizeObserver.observe(element);
        }
    }, waitTime);

    return () => {
      cancelled = true;

      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      if (scrollTimeoutId !== null) window.clearTimeout(scrollTimeoutId);
      if (transitionTimeoutId !== null) clearTimeout(transitionTimeoutId);
      if (resizeObserver) resizeObserver.disconnect();

      window.removeEventListener("resize", () => scheduleMeasurement());
      window.removeEventListener("scroll", () => scheduleMeasurement(), true);
    };
  }, [open, step, currentStep]);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open || !step) return null;

  const spotlightStyle = getSpotlightStyle(targetRect, step);
  const cardStyle = getCardStyle(targetRect, step);

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {!targetRect && (
        <>
          <div className="absolute inset-0 bg-slate-950/80" />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar tutorial"
            className="absolute top-5 right-5 h-10 w-10 rounded-xl bg-white text-slate-700 shadow-xl pointer-events-auto flex items-center justify-center hover:bg-slate-100 transition"
          >
            <X size={19} />
          </button>
        </>
      )}

      {targetRect && (
        <div
          className="absolute rounded-3xl border-4 border-amber-400 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.78)] transition-[top,left,width,height] duration-300 ease-out"
          style={spotlightStyle}
        />
      )}

      {targetRect && (
        <div
          className="absolute w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 pointer-events-auto overflow-hidden transition-[top,left] duration-300 ease-out"
          style={cardStyle}
        >
          <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <MousePointer2 size={21} />
                </div>
                <div>
                  <p className="text-xs text-blue-100 font-bold">
                    Passo {currentStep + 1} de {steps.length}
                  </p>
                  <h2 className="text-lg font-black">{step.title}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar tutorial"
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
            <div className="flex items-center gap-1 mt-5 flex-wrap">
              {steps.map((tutorialStep, index) => (
                <span
                  key={`${tutorialStep.selector}-${index}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? "w-8 bg-blue-700" : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isFirst}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition"
                >
                  Concluir
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-4 py-2.5 rounded-2xl bg-blue-700 text-white font-bold hover:bg-blue-800 transition flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="mt-4 w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition"
            >
              Pular tutorial
            </button>
          </div>
        </div>
      )}
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
  if (!rect) return { visibility: "hidden", pointerEvents: "none" };

  const placement = step.placement || "right";
  const cardWidth = 360;
  const cardHeight = 300;
  const margin = 14;
  const cardOffsetX = step.cardOffsetX ?? 0;
  const cardOffsetY = step.cardOffsetY ?? 0;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let top = rect.top;
  let left = rect.right + margin;

  if (placement === "left") {
    left = rect.left - cardWidth - margin;
    top = rect.top;
  } else if (placement === "right") {
    left = rect.right + margin;
    top = rect.top;
  } else if (placement === "bottom") {
    left = rect.left;
    top = rect.bottom + margin;
  } else if (placement === "bottom-left") {
    left = rect.right - cardWidth;
    top = rect.bottom + margin;
  } else if (placement === "top") {
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

  return { top, left };
}