"use client";

import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal, RevealLines } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoBackdrop } from "@/components/ui/SceneBackdrop";
import { siteAssets } from "@/lib/assets";
import { copy } from "@/lib/content/copy";
import { links, sectionIds } from "@/lib/content/links";
import { formatBRL } from "@/lib/format/currency";
import { useSelection } from "@/lib/selection/SelectionContext";

const DELAY_S = { brand: 0.25, cta: 0.45 } as const;

export function FinalCTASection() {
  const { edition, plan, price } = useSelection();
  const summary = `${edition.subtitle} · ${plan.name} · ${formatBRL(price)} ${plan.period}`;

  return (
    <section
      aria-label="Assinar"
      className="relative flex min-h-svh flex-col overflow-hidden bg-stage"
      id={sectionIds.final}
    >
      <PhotoBackdrop asset={siteAssets.lifestyle.coverDetailDaily} />

      <div className="relative z-30 mt-auto px-[var(--gutter)] pt-[40vh] pb-[clamp(4rem,12vh,8rem)]">
        <div className="max-w-3xl">
          <RevealLines
            as="h2"
            className="font-display text-[clamp(2.6rem,6.4vw,6rem)] font-bold leading-[0.95] text-ink"
            lines={copy.final.lines}
          />
          <RevealLines
            className="font-display mt-4 text-[clamp(1.6rem,3vw,2.6rem)] font-bold text-brand"
            delay={DELAY_S.brand}
            lines={[copy.final.brand]}
          />
          <Reveal
            className="mt-10 flex flex-col items-start gap-4"
            delay={DELAY_S.cta}
          >
            <MagneticButton>
              <ButtonLink
                className="px-8 py-4 text-base"
                href={links.checkout}
                variant="brand"
              >
                {copy.final.cta}
              </ButtonLink>
            </MagneticButton>
            <span className="label text-ink">{summary}</span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
