"use client";

import {
  AnimatePresence,
  m,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { EASE, MOTION_SPRING, Z_INDEX } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { links, sectionIds } from "@/lib/content/links";

const SCROLLED_AFTER_PX = 80;
const HEADER_HEIGHT_REM = 4.5;
const HEADER_COMPACT_HEIGHT_REM = 3.5;
const HALF = 0.5;
const COMPACT_SHIFT_REM = HEADER_COMPACT_HEIGHT_REM - HEADER_HEIGHT_REM;
const COMPACT = {
  scaleY: HEADER_COMPACT_HEIGHT_REM / HEADER_HEIGHT_REM,
  lineY: `${COMPACT_SHIFT_REM}rem`,
  contentY: `${COMPACT_SHIFT_REM * HALF}rem`,
} as const;
const EXPANDED = { scaleY: 1, lineY: "0rem", contentY: "0rem" } as const;
const MENU_OFFSET_Y_PX = -8;
const INTRO = { fromY: -12, delayS: 0.5, durationS: 1.2 } as const;

const NAV = [
  { href: `#${sectionIds.editions}`, label: "Edições" },
  { href: `#${sectionIds.discovery}`, label: "Momentos" },
  { href: `#${sectionIds.pricing}`, label: "Planos" },
  { href: `#${sectionIds.faq}`, label: "Dúvidas" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuNavRef = useRef<HTMLElement>(null);
  const menuId = useId();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > SCROLLED_AFTER_PX);
  });

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const container = menuContainerRef.current;
      if (
        container &&
        event.target instanceof Node &&
        !container.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    menuNavRef.current?.querySelector("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const layout = scrolled ? COMPACT : EXPANDED;

  return (
    <m.header
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none fixed inset-x-0 top-0"
      initial={{ opacity: 0, y: INTRO.fromY }}
      style={{
        height: `${HEADER_HEIGHT_REM}rem`,
        zIndex: Z_INDEX.header,
      }}
      transition={{
        delay: INTRO.delayS,
        duration: INTRO.durationS,
        ease: EASE.cinematic,
      }}
    >
      <m.div
        animate={{
          backgroundColor: scrolled ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0)",
          scaleY: layout.scaleY,
        }}
        aria-hidden="true"
        className="pointer-events-auto absolute inset-0 origin-top"
        transition={MOTION_SPRING.accordion}
      />
      <m.div
        animate={{
          backgroundColor: scrolled
            ? "rgba(242,235,224,0.1)"
            : "rgba(242,235,224,0)",
          y: layout.lineY,
        }}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px"
        transition={MOTION_SPRING.accordion}
      />
      <m.div
        animate={{ y: layout.contentY }}
        className="relative flex h-full items-center"
        transition={MOTION_SPRING.accordion}
      >
        <div className="pointer-events-auto flex w-full items-center justify-between px-[var(--gutter)]">
          <a
            className="font-display text-lg font-bold text-ink"
            href={`#${sectionIds.hero}`}
          >
            {copy.brand}
          </a>
          <nav
            aria-label={copy.header.navLabel}
            className="hidden items-center gap-8 md:flex"
          >
            {NAV.map((item) => (
              <a
                className="label text-ink-muted transition-colors hover:text-ink"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto mr-4 md:hidden" ref={menuContainerRef}>
            <button
              aria-controls={menuId}
              aria-expanded={menuOpen}
              className="label py-2 text-ink-muted transition-colors hover:text-ink"
              onClick={() => setMenuOpen((open) => !open)}
              ref={menuButtonRef}
              type="button"
            >
              {copy.header.menu}
            </button>
            <AnimatePresence>
              {menuOpen ? (
                <m.nav
                  animate={{ opacity: 1, y: 0 }}
                  aria-label={copy.header.navLabel}
                  className="absolute right-[var(--gutter)] top-full mt-2 rounded-2xl border border-line bg-stage/90 px-6 py-4 backdrop-blur-md"
                  exit={{ opacity: 0, y: MENU_OFFSET_Y_PX }}
                  id={menuId}
                  initial={{ opacity: 0, y: MENU_OFFSET_Y_PX }}
                  ref={menuNavRef}
                  transition={MOTION_SPRING.accordion}
                >
                  <ul className="flex flex-col gap-4">
                    {NAV.map((item) => (
                      <li key={item.href}>
                        <a
                          className="label block py-1 text-ink-muted transition-colors hover:text-ink"
                          href={item.href}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </m.nav>
              ) : null}
            </AnimatePresence>
          </div>
          <ButtonLink
            className="!py-2 !px-5 text-xs"
            href={links.plans}
            variant="ghost"
          >
            Assinar
          </ButtonLink>
        </div>
      </m.div>
    </m.header>
  );
}
