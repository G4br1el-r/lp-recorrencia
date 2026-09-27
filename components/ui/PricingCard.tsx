"use client";

import { m } from "motion/react";
import type { PointerEvent } from "react";
import { useRef } from "react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { CoverPair } from "@/components/ui/CoverPair";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { MOTION_GESTURE, MOTION_SPRING } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import type { Edition } from "@/lib/content/editions";
import type { Plan } from "@/lib/content/plans";
import {
  formatBRL,
  formatInstallments,
  priceParts,
} from "@/lib/format/currency";

const HOVER_SCALE = { featured: 1.03, base: 1.02 } as const;
const WIDE_BUTTON_MAGNET_STRENGTH = 0.12;
const PERCENT = 100;
const SELECTED_CHECK_STROKE_WIDTH = 1.5;

function PriceTag({ value }: { value: number }) {
  const { currency, whole, fraction } = priceParts(value);
  return (
    <p className="flex items-start text-ink">
      <span className="sr-only">{formatBRL(value)}</span>
      <span
        aria-hidden="true"
        className="mr-1.5 mt-[0.4em] text-lg font-semibold text-ink-muted"
      >
        {currency}
      </span>
      <span
        aria-hidden="true"
        className="font-display text-[clamp(3.2rem,5vw,4.6rem)] font-bold leading-[0.85] tracking-[-0.04em]"
      >
        {whole}
      </span>
      <span
        aria-hidden="true"
        className="font-display mt-[0.1em] text-[clamp(1.4rem,2vw,1.9rem)] font-bold leading-none"
      >
        {fraction}
      </span>
    </p>
  );
}

type PricingCardProps = {
  plan: Plan;
  edition: Edition;
  selected: boolean;
  onSelect: (plan: Plan) => void;
};

export function PricingCard({
  plan,
  edition,
  selected,
  onSelect,
}: PricingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const featured = Boolean(plan.featured);
  const installments =
    plan.id === "anual" ? edition.price.installments : undefined;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!featured || !ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty(
      "--spot-x",
      `${((event.clientX - rect.left) / rect.width) * PERCENT}%`,
    );
    ref.current.style.setProperty(
      "--spot-y",
      `${((event.clientY - rect.top) / rect.height) * PERCENT}%`,
    );
  };

  return (
    <m.div
      className={[
        "pricing-card relative flex h-full flex-col rounded-2xl border p-7 transition-colors duration-500 lg:px-9 lg:py-7",
        featured ? "pricing-card-featured" : "",
        selected
          ? "border-brand"
          : featured
            ? "border-brand/50"
            : "border-line",
      ].join(" ")}
      onPointerMove={onPointerMove}
      ref={ref}
      transition={MOTION_SPRING.hover}
      whileHover={{ scale: featured ? HOVER_SCALE.featured : HOVER_SCALE.base }}
    >
      {plan.tag ? (
        <span className="label absolute -top-3 left-7 rounded-full bg-brand px-3 py-1.5 text-[0.62rem] text-ink lg:left-9">
          {plan.tag}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[clamp(1.7rem,2.3vw,2.2rem)] font-bold leading-none text-ink">
            {plan.name}
          </h3>
          <p className="mt-2 text-sm text-ink-muted">{edition.subtitle}</p>
        </div>
        <CoverPair editionId={edition.id} />
      </div>

      <div className="mt-6">
        <PriceTag value={edition.price[plan.id]} />
        <p className="mt-3 text-sm text-ink-muted">{plan.period}</p>
        {installments ? (
          <p className="label mt-2 text-ink">
            {formatInstallments(installments.count, installments.value)}
          </p>
        ) : (
          <span aria-hidden="true" className="label mt-2 block">
            &nbsp;
          </span>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
        {[edition.format, ...copy.pricing.benefits].map((benefit) => (
          <li
            className="flex items-start gap-3 text-base text-ink-muted"
            key={benefit}
          >
            <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-brand" />
            {benefit}
          </li>
        ))}
      </ul>

      <MagneticButton
        block
        className="mt-6"
        strength={WIDE_BUTTON_MAGNET_STRENGTH}
      >
        <m.button
          aria-pressed={selected}
          className={[
            "flex w-full items-center justify-center gap-3 rounded-full py-3.5 text-base font-semibold transition-colors duration-300",
            selected
              ? "bg-brand-deep text-ink"
              : featured
                ? "bg-ink text-stage hover:bg-white"
                : "border border-line-strong text-ink hover:border-ink",
          ].join(" ")}
          onClick={() => onSelect(plan)}
          transition={MOTION_SPRING.tap}
          type="button"
          whileTap={MOTION_GESTURE.tap}
        >
          {selected ? (
            <>
              <CheckIcon
                className="h-3.5 w-3.5"
                strokeWidth={SELECTED_CHECK_STROKE_WIDTH}
              />
              {copy.pricing.chosen}
            </>
          ) : (
            `${copy.pricing.cta} ${plan.name.toLowerCase()}`
          )}
        </m.button>
      </MagneticButton>
    </m.div>
  );
}
