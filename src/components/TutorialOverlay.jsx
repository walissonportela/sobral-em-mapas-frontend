import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, MousePointer2, X } from "lucide-react";

const SCREEN_MARGIN = 12;
const CARD_GAP = 16;
const MOBILE_BREAKPOINT = 768;
// O destaque e o cartão viajam juntos até o próximo controle.
const MOVE_DURATION = 480;
const FADE_OUT_DURATION = 160;
const STEP_LOCK_DURATION = 450;
const MOTION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const MOTION_TRANSITION = `top ${MOVE_DURATION}ms ${MOTION_EASING}, left ${MOVE_DURATION}ms ${MOTION_EASING}, width ${MOVE_DURATION}ms ${MOTION_EASING}, height ${MOVE_DURATION}ms ${MOTION_EASING}`;


function buildSteps(isMobile) {
  const suffix = isMobile ? "-mobile" : "";
  const sidebarStep = {
    placement: isMobile ? "bottom" : "right",
    spotlightPadding: 5,
    scrollToTarget: isMobile,
  };

  const steps = [
    {
      selector: `[data-tour='sidebar${suffix}']`,
      title: "Menu lateral",
      text: "O menu reúne as principais ferramentas: mapas, informações, busca, medição, favoritos, impressão, limpeza e tela cheia.",
      placement: isMobile ? "bottom" : "right",
      spotlightPadding: 4,
      scrollToTarget: isMobile,
    },
    {
      selector: `[data-tour='layers-button${suffix}']`,
      title: "Mapas",
      text: "Explore os mapas por categorias e subcategorias. Ative uma ou mais camadas para visualizar as informações sobre o território.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='legend-button${suffix}']`,
      title: "Informações e legendas",
      text: "Consulte as legendas e descrições das camadas ativas. Para os mapas GeoJSON, você também pode ajustar cores e exibição dos nomes.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='search-button${suffix}']`,
      title: "Busca de locais",
      text: "Pesquise endereços, bairros, locais de interesse ou coordenadas para encontrá-los no mapa.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='measure-button${suffix}']`,
      title: "Medição",
      text: "Meça distâncias, perímetros e áreas diretamente no mapa para apoiar sua análise territorial.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='bookmarks-button${suffix}']`,
      title: "Favoritos",
      text: "Salve os mapas que você consulta com frequência para encontrá-los rapidamente depois.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='print-button${suffix}']`,
      title: "Impressão e exportação",
      text: "Selecione uma área do mapa e exporte a visualização como PDF, PNG ou JPEG.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='clear-button${suffix}']`,
      title: "Limpar mapa",
      text: "Remova as camadas ativas e os desenhos ou medições quando quiser começar uma nova consulta.",
      ...sidebarStep,
    },
    {
      selector: `[data-tour='fullscreen-button${suffix}']`,
      title: "Tela cheia",
      text: "Amplie a área disponível para o mapa e aproveite melhor o espaço da tela.",
      ...sidebarStep,
    },
    {
      selector: "[data-tour='map-controls']",
      title: "Controles cartográficos",
      text: "Use os controles de zoom, localização, troca do mapa-base e outras opções de navegação.",
      placement: isMobile ? "top" : "left",
      spotlightPadding: 7,
    },
    {
      selector: "[data-tour='contact-button']",
      title: "Contato",
      text: "Envie dúvidas, sugestões ou relatos de problemas encontrados durante a utilização da plataforma.",
      placement: "bottom",
      spotlightPadding: 7,
    },
    {
      selector: "[data-tour='about-button']",
      title: "Sobre a plataforma",
      text: "Conheça o Sobral em Mapas, suas funcionalidades e as formas de explorar informações geográficas do município.",
      placement: "bottom",
      spotlightPadding: 7,
    },
    {
      selector: "[data-tour='login-area']",
      title: "Área do usuário",
      text: "Acesse sua conta e encontre as opções disponíveis para o seu perfil.",
      placement: "bottom-left",
      spotlightPadding: 7,
    },
    {
      selector: "[data-tour='chat-button']",
      title: "Chat",
      text: "Quando estiver disponível, o chat oferece orientações e respostas a dúvidas rápidas.",
      placement: "left",
      spotlightPadding: 7,
    },
  ];

  // Não mostrar passos de controles ocultos na versão móvel.
  if (isMobile) {
    return steps.filter(({ selector }) =>
      !["map-controls", "contact-button", "about-button", "login-area", "chat-button"].some(
        (name) => selector.includes(name)
      )
    );
  }

  return steps;
}

function elementIsVisible(element) {
  if (!element || element.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function sameRect(a, b) {
  if (!a || !b) return a === b;
  return ["top", "left", "width", "height"].every(
    (key) => Math.abs(a[key] - b[key]) < 0.5
  );
}

function getHighlightRect(target, padding, viewport) {
  if (!target) return null;
  const left = clamp(target.left - padding, 2, viewport.width - 2);
  const top = clamp(target.top - padding, 2, viewport.height - 2);
  const right = clamp(target.right + padding, left, viewport.width - 2);
  const bottom = clamp(target.bottom + padding, top, viewport.height - 2);
  if (right - left < 1 || bottom - top < 1) return null;
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function getCardPosition(target, preferred, size, viewport) {
  const width = Math.min(380, Math.max(0, viewport.width - SCREEN_MARGIN * 2));
  const height = Math.min(size.height || 380, Math.max(0, viewport.height - SCREEN_MARGIN * 2));
  const centerX = target ? (target.left + target.right) / 2 : viewport.width / 2;
  const centerY = target ? (target.top + target.bottom) / 2 : viewport.height / 2;

  const positions = target
    ? {
        right: { left: target.right + CARD_GAP, top: centerY - height / 2 },
        left: { left: target.left - CARD_GAP - width, top: centerY - height / 2 },
        bottom: { left: centerX - width / 2, top: target.bottom + CARD_GAP },
        "bottom-left": { left: target.right - width, top: target.bottom + CARD_GAP },
        top: { left: centerX - width / 2, top: target.top - CARD_GAP - height },
      }
    : {};

  const priority = [preferred, "right", "left", "bottom", "top", "bottom-left"];
  const options = [...new Set(priority)].map((name) => ({ name, ...positions[name] })).filter(
    (value) => Number.isFinite(value.left) && Number.isFinite(value.top)
  );

  const fits = ({ left, top }) =>
    left >= SCREEN_MARGIN &&
    top >= SCREEN_MARGIN &&
    left + width <= viewport.width - SCREEN_MARGIN &&
    top + height <= viewport.height - SCREEN_MARGIN;

  // Prefere o lado solicitado, mas troca de lado se a caixa sair da tela.
  const chosen = options.find(fits);
  if (chosen) return { left: chosen.left, top: chosen.top, width };

  // Em telas pequenas, usa o espaço com menor sobreposição ao alvo.
  let best = null;
  let lowestOverlap = Infinity;
  for (const option of options) {
    const left = clamp(option.left, SCREEN_MARGIN, viewport.width - width - SCREEN_MARGIN);
    const top = clamp(option.top, SCREEN_MARGIN, viewport.height - height - SCREEN_MARGIN);
    const overlapX = target
      ? Math.max(0, Math.min(left + width, target.right) - Math.max(left, target.left))
      : 0;
    const overlapY = target
      ? Math.max(0, Math.min(top + height, target.bottom) - Math.max(top, target.top))
      : 0;
    const overlap = overlapX * overlapY;
    if (overlap < lowestOverlap) {
      lowestOverlap = overlap;
      best = { left, top, width };
    }
  }
  return best || {
    left: Math.max(SCREEN_MARGIN, (viewport.width - width) / 2),
    top: Math.max(SCREEN_MARGIN, (viewport.height - height) / 2),
    width,
  };
}

export default function TutorialOverlay({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [cardHeight, setCardHeight] = useState(380);
  const [contentVisible, setContentVisible] = useState(true);
  const [isChangingStep, setIsChangingStep] = useState(false);
  const cardRef = useRef(null);
  const changeTimerRef = useRef(null);
  const unlockTimerRef = useRef(null);

  const isMobile = viewport.width < MOBILE_BREAKPOINT;
  const steps = useMemo(() => {
    if (!open) return [];
    return buildSteps(isMobile).filter(({ selector }) =>
      elementIsVisible(document.querySelector(selector))
    );
  }, [open, isMobile]);

  const index = clamp(currentStep, 0, Math.max(steps.length - 1, 0));
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const handleClose = useCallback(() => {
    window.clearTimeout(changeTimerRef.current);
    window.clearTimeout(unlockTimerRef.current);
    setCurrentStep(0);
    setTargetRect(null);
    setContentVisible(true);
    setIsChangingStep(false);
    onClose();
  }, [onClose]);

  // Primeiro atenua o texto; depois atualiza o passo e revela o novo conteúdo.
  // Os botões ficam temporariamente bloqueados para evitar saltos em cliques rápidos.
  const moveStep = useCallback((direction) => {
    if (isChangingStep || steps.length < 2) return;
    const next = clamp(index + direction, 0, steps.length - 1);
    if (next === index) return;

    setIsChangingStep(true);
    setContentVisible(false);
    changeTimerRef.current = window.setTimeout(() => {
      setCurrentStep(next);
      setContentVisible(true);
      unlockTimerRef.current = window.setTimeout(() => setIsChangingStep(false), STEP_LOCK_DURATION);
    }, FADE_OUT_DURATION);
  }, [index, isChangingStep, steps.length]);

  const goToPreviousStep = useCallback(() => moveStep(-1), [moveStep]);
  const goToNextStep = useCallback(() => moveStep(1), [moveStep]);

  useEffect(() => () => {
    window.clearTimeout(changeTimerRef.current);
    window.clearTimeout(unlockTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile) return;
    window.dispatchEvent(
      new CustomEvent("sobral-tutorial-sidebar", { detail: { open: index <= 8 } })
    );
  }, [open, isMobile, index]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      const focusedTag = document.activeElement?.tagName;
      if (event.key === "Escape") handleClose();
      else if (!["INPUT", "TEXTAREA", "SELECT"].includes(focusedTag)) {
        if (event.key === "ArrowRight") goToNextStep();
        if (event.key === "ArrowLeft") goToPreviousStep();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClose, goToNextStep, goToPreviousStep]);

  useLayoutEffect(() => {
    if (!open || !step) return undefined;
    const timers = [];
    let frameId = null;
    let observer = null;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const element = document.querySelector(step.selector);
      const rect = elementIsVisible(element) ? element.getBoundingClientRect() : null;
      const nextRect = rect
        ? { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom,
            width: rect.width, height: rect.height }
        : null;
      setTargetRect((previous) => (sameRect(previous, nextRect) ? previous : nextRect));

      if (cardRef.current) {
        const height = cardRef.current.getBoundingClientRect().height;
        setCardHeight((previous) => (Math.abs(previous - height) > 1 ? height : previous));
      }
    };

    const scheduleMeasure = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };

    const element = document.querySelector(step.selector);
    if (element && step.scrollToTarget) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }

    // Mede novamente durante as transições da sidebar e do menu móvel.
    scheduleMeasure();
    for (const delay of [80, 180, 350, 550]) {
      timers.push(window.setTimeout(scheduleMeasure, delay));
    }
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", scheduleMeasure);

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleMeasure);
      if (element) observer.observe(element);
      if (cardRef.current) observer.observe(cardRef.current);
    }

    return () => {
      cancelled = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", scheduleMeasure);
      observer?.disconnect();
    };
  }, [open, step]);

  // O foco acompanha a caixa do tutorial, sem deslocar o mapa.
  useEffect(() => {
    if (open && step) cardRef.current?.focus({ preventScroll: true });
  }, [open, step]);

  if (!open) return null;

  const highlight = getHighlightRect(targetRect, step?.spotlightPadding ?? 5, viewport);
  const position = getCardPosition(highlight, step?.placement ?? "bottom", { height: cardHeight }, viewport);

  const contentMotionClass = `transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
    contentVisible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
  }`;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const movingStyle = { transition: reducedMotion ? "none" : MOTION_TRANSITION };

  const overlay = (
    <div className="fixed inset-0 z-[99999]" style={{ width: "100vw", height: "100dvh" }}>
      {highlight ? (
        <>
          {/* As quatro faces escurecidas acompanham o destaque com a mesma curva. */}
          <div className="absolute bg-slate-950/75 motion-reduce:transition-none" style={{ ...movingStyle, top: 0, left: 0, right: 0, height: highlight.top }} />
          <div className="absolute bg-slate-950/75 motion-reduce:transition-none" style={{ ...movingStyle, top: highlight.top, left: 0, width: highlight.left, height: highlight.height }} />
          <div className="absolute bg-slate-950/75 motion-reduce:transition-none" style={{ ...movingStyle, top: highlight.top, left: highlight.right, right: 0, height: highlight.height }} />
          <div className="absolute bg-slate-950/75 motion-reduce:transition-none" style={{ ...movingStyle, top: highlight.bottom, left: 0, right: 0, bottom: 0 }} />
          <div
            className="pointer-events-none absolute rounded-2xl border-[3px] border-amber-400 shadow-[0_0_0_2px_rgba(255,255,255,0.45)] motion-reduce:transition-none"
            style={{ ...movingStyle, left: highlight.left, top: highlight.top, width: highlight.width, height: highlight.height }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-950/75" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sobral-tour-title"
        tabIndex={-1}
        className="absolute overflow-y-auto rounded-3xl border border-blue-100 bg-white shadow-2xl outline-none motion-reduce:transition-none"
        style={{
          transition: reducedMotion ? "none" : `top ${MOVE_DURATION}ms ${MOTION_EASING}, left ${MOVE_DURATION}ms ${MOTION_EASING}`,
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: Math.max(140, viewport.height - SCREEN_MARGIN * 2),
        }}
      >
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-950 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <MousePointer2 size={21} aria-hidden="true" />
              </div>
              <div className={`min-w-0 ${contentMotionClass}`}>
                <p className="text-xs font-bold text-blue-100">
                  Passo {steps.length ? index + 1 : 0} de {steps.length}
                </p>
                <h2 id="sobral-tour-title" className="text-lg font-black leading-snug">
                  {step?.title || "Tutorial indisponível"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar tutorial"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className={`text-sm leading-7 text-slate-600 ${contentMotionClass}`}>
            {step?.text || "Não foi possível localizar os controles nesta tela. Feche o tutorial e abra novamente com o mapa visível."}
          </p>
          {steps.length > 0 && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-1" aria-hidden="true">
                {steps.map((item, itemIndex) => (
                  <span
                    key={item.selector}
                    className={`h-2 rounded-full transition-all duration-500 ease-out motion-reduce:transition-none ${
                      itemIndex === index ? "w-7 bg-blue-700" : "w-2 bg-blue-100"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={isFirst || isChangingStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button
                  type="button"
                  onClick={isLast ? handleClose : goToNextStep}
                  disabled={isChangingStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLast ? "Concluir" : "Próximo"}
                  {!isLast && <ArrowRight size={16} />}
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 w-full py-1 text-xs font-bold text-slate-500 transition hover:text-blue-700"
          >
            Pular tutorial
          </button>
        </div>
      </div>
    </div>
  );

  // O portal impede que a sidebar ou outras camadas alterem o posicionamento fixo.
  return createPortal(overlay, document.body);
}
