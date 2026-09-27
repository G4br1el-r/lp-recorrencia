"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  BookScene,
  StageViewport,
} from "@/components/motion/book3d/createBookScene";
import { currentRenderQuality } from "@/components/motion/book3d/renderQuality";
import { gsap } from "@/components/motion/gsap";
import {
  whenInteracted,
  whenNearViewport,
} from "@/components/motion/nearViewport";
import {
  type BookState,
  createStageState,
  type HoverState,
  type StageState,
} from "@/components/motion/stage";
import { ProductBook } from "@/components/ui/ProductBook";
import { MEDIA, STAGE_PERSPECTIVE_PX, Z_INDEX } from "@/lib/constants/motion";
import { type EditionId, editions } from "@/lib/content/editions";

type BookRenderer = "pending" | "webgl" | "css";

type StageStyle = {
  transform: string;
  opacity: string;
  filter: string;
  zIndex: string;
};

const StageContext = createContext<StageState | null>(null);

const STAGE_BOOK_FONT_SIZE = "calc(var(--book-width) * 0.13)";
const MAX_PIXEL_RATIO = 2;
const CSS_RENDERER_PARAM = { name: "livro", value: "css" } as const;
const STAGE_PRELOAD_MARGIN = "100% 0px";
const NO_FILTER = "none";
const ELEMENT_STYLE_KEYS = ["transform", "opacity", "filter"] as const;

function forcesCssRenderer(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get(CSS_RENDERER_PARAM.name) === CSS_RENDERER_PARAM.value;
}

function readViewport(host: HTMLElement, probe: HTMLElement): StageViewport {
  return {
    width: host.clientWidth,
    height: host.clientHeight,
    vw: window.innerWidth,
    vh: probe.offsetHeight,
    bookWidth: probe.offsetWidth,
    pixelRatio: Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
  };
}

function bookStyle(book: BookState, hover: HoverState): StageStyle {
  const rotationY = book.rotationY * (1 - hover.face) + hover.tiltY;
  return {
    transform: `translate3d(${book.xVw}vw, ${book.yVh - hover.liftVh}vh, ${book.zPx}px) rotateX(${hover.tiltX}deg) rotateY(${rotationY}deg) scale(${book.scale * (1 + hover.grow)})`,
    opacity: String(book.opacity * (1 - hover.dim)),
    filter: book.blurPx > 0 ? `blur(${book.blurPx}px)` : NO_FILTER,
    zIndex: String(Math.round(book.zPx)),
  };
}

export function styleWriter(element: HTMLElement): (style: StageStyle) => void {
  const applied: StageStyle = {
    transform: "",
    opacity: "",
    filter: "",
    zIndex: "",
  };
  return (style) => {
    for (const key of ELEMENT_STYLE_KEYS) {
      if (applied[key] !== style[key]) {
        applied[key] = style[key];
        element.style[key] = style[key];
      }
    }
    if (applied.zIndex !== style.zIndex && element.parentElement) {
      applied.zIndex = style.zIndex;
      element.parentElement.style.zIndex = style.zIndex;
    }
  };
}

export function StageProvider({ children }: { children: ReactNode }) {
  const [stage] = useState(createStageState);
  return (
    <StageContext.Provider value={stage}>{children}</StageContext.Provider>
  );
}

export function StageLayer() {
  const stage = useStage();
  const [renderer, setRenderer] = useState<BookRenderer>("pending");
  const hostRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const cssBookRefs = useRef<Partial<Record<EditionId, HTMLDivElement>>>({});

  useEffect(() => {
    const host = hostRef.current;
    const probe = probeRef.current;
    if (!host || !probe || window.matchMedia(MEDIA.reduceMotion).matches) {
      return;
    }
    if (forcesCssRenderer() || currentRenderQuality() === "low") {
      setRenderer("css");
      return;
    }

    let cancelled = false;
    let scene: BookScene | null = null;
    const measure = () => readViewport(host, probe);
    const render = () => scene?.render(stage);
    const observer = new ResizeObserver(() => scene?.resize(measure()));

    const start = () => {
      import("@/components/motion/book3d/createBookScene")
        .then(({ createBookScene }) => createBookScene(host, measure()))
        .then((created) => {
          if (cancelled) {
            created.dispose();
            return;
          }
          scene = created;
          observer.observe(host);
          gsap.ticker.add(render);
          setRenderer("webgl");
        })
        .catch(() => {
          if (!cancelled) {
            setRenderer("css");
          }
        });
    };
    let stopWatching: () => void = () => undefined;
    const stopWaiting = whenInteracted(() => {
      stopWatching = whenNearViewport(host, STAGE_PRELOAD_MARGIN, start);
    });

    return () => {
      cancelled = true;
      stopWaiting();
      stopWatching();
      gsap.ticker.remove(render);
      observer.disconnect();
      scene?.dispose();
    };
  }, [stage]);

  useEffect(() => {
    if (renderer !== "css") {
      return;
    }
    const writers = editions.flatMap((edition) => {
      const element = cssBookRefs.current[edition.id];
      return element ? [{ id: edition.id, write: styleWriter(element) }] : [];
    });
    const apply = () => {
      for (const { id, write } of writers) {
        write(bookStyle(stage.books[id], stage.hover[id]));
      }
    };
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
    };
  }, [renderer, stage]);

  return (
    <div
      aria-hidden="true"
      className="motion-only pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_INDEX.stage }}
    >
      <div className="absolute inset-0" ref={hostRef} />
      <div
        className="invisible absolute left-0 top-0"
        ref={probeRef}
        style={{ width: "var(--book-width)", height: "100vh" }}
      />
      {renderer === "css"
        ? editions.map((edition) => (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              key={edition.id}
              style={{ perspective: STAGE_PERSPECTIVE_PX }}
            >
              <div
                className="will-change-transform"
                ref={(element) => {
                  if (element) {
                    cssBookRefs.current[edition.id] = element;
                  }
                }}
                style={{ opacity: 0, fontSize: STAGE_BOOK_FONT_SIZE }}
              >
                <ProductBook edition={edition} />
              </div>
            </div>
          ))
        : null}
    </div>
  );
}

export function useStage(): StageState {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error("useStage precisa estar dentro de StageProvider");
  }
  return context;
}
