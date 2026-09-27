"use client";

import { LazyMotion, m } from "motion/react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { PricingCard } from "@/components/ui/PricingCard";
import { MOTION_SPRING } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { editions } from "@/lib/content/editions";
import { links, sectionIds } from "@/lib/content/links";
import { plans } from "@/lib/content/plans";
import { formatBRL } from "@/lib/format/currency";
import { useSelection } from "@/lib/selection/SelectionContext";

const loadMaxFeatures = () =>
  import("@/components/motion/motionMaxFeatures").then(
    (features) => features.default,
  );

export function PricingSection() {
  const { edition, editionId, plan, price, selectEdition, selectPlan } =
    useSelection();

  return (
    <section
      aria-label={copy.pricing.title}
      className="section-y relative bg-stage px-[var(--gutter)]"
      id={sectionIds.pricing}
    >
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <span className="label">{copy.pricing.label}</span>
          <h2 className="font-display mt-4 text-[clamp(2.2rem,4vw,4rem)] text-ink">
            {copy.pricing.title}
          </h2>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="min-w-0 max-w-xl text-base text-ink-muted">
              {copy.pricing.subtitle}
            </p>
            <LazyMotion features={loadMaxFeatures} strict>
              <fieldset className="no-scrollbar flex min-w-0 max-w-full shrink-0 gap-1 self-start overflow-x-auto rounded-full border border-line p-1 lg:mb-1 lg:self-auto">
                <legend className="sr-only">
                  {copy.pricing.editionLegend}
                </legend>
                {editions.map((item) => {
                  const checked = item.id === editionId;
                  return (
                    <label
                      className={[
                        "relative cursor-pointer whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand",
                        checked
                          ? "text-stage"
                          : "text-ink-muted hover:text-ink",
                      ].join(" ")}
                      key={item.id}
                    >
                      <input
                        checked={checked}
                        className="sr-only"
                        name="edicao"
                        onChange={() => selectEdition(item.id)}
                        type="radio"
                        value={item.id}
                      />
                      {checked ? (
                        <m.span
                          className="absolute inset-0 rounded-full bg-ink"
                          layoutId="edition-pill"
                          transition={MOTION_SPRING.hover}
                        />
                      ) : null}
                      <span className="relative">{item.subtitle}</span>
                    </label>
                  );
                })}
              </fieldset>
            </LazyMotion>
          </div>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-6 lg:mt-14 lg:grid-cols-3 lg:items-center lg:gap-8">
          {plans.map((item) => (
            <RevealItem
              className={
                item.featured ? "lg:-translate-y-4" : "lg:scale-[0.97]"
              }
              key={item.id}
            >
              <PricingCard
                edition={edition}
                onSelect={(chosen) => selectPlan(chosen.id)}
                plan={item}
                selected={plan.id === item.id}
              />
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="sticky bottom-4 z-20 mt-12 flex justify-center lg:static lg:mt-10">
          <div className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-line-strong bg-stage/85 py-2 pl-6 pr-2 backdrop-blur-md">
            <p className="truncate text-sm text-ink">
              <span className="hidden text-ink-muted sm:inline">
                {edition.subtitle}
              </span>
              <span
                aria-hidden="true"
                className="mx-2 hidden text-ink-dim sm:inline"
              >
                ·
              </span>
              <span>{plan.name}</span>
              <span aria-hidden="true" className="mx-2 text-ink-dim">
                ·
              </span>
              <span className="text-brand">{formatBRL(price)}</span>
              <span className="hidden text-ink-muted sm:inline">
                {" "}
                {plan.period}
              </span>
            </p>
            <MagneticButton className="shrink-0">
              <ButtonLink
                className="!py-2 shrink-0"
                href={links.finalCta}
                variant="brand"
              >
                {copy.pricing.summaryCta}
              </ButtonLink>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
