import Image from "next/image";
import type { CSSProperties } from "react";
import { siteAssets } from "@/lib/assets";
import { copy } from "@/lib/content/copy";
import type { Edition } from "@/lib/content/editions";

const COVER_IMAGE_SIZES = "(min-width: 1024px) 320px, 190px";

type ProductBookProps = {
  edition: Edition;
  className?: string;
  style?: CSSProperties;
};

export function ProductBook({ edition, className, style }: ProductBookProps) {
  const coverImage = siteAssets.products[edition.id];

  return (
    <div
      aria-label={`${edition.name} — ${edition.subtitle}`}
      className={["book", className].filter(Boolean).join(" ")}
      role="img"
      style={style}
    >
      <div className="book-pages" />
      <div
        className="book-spine"
        style={{ backgroundColor: edition.cover.spine }}
      />
      <div
        className="book-cover"
        style={{ background: edition.cover.background }}
      >
        {coverImage ? (
          <Image
            alt=""
            className="object-cover"
            fill
            sizes={COVER_IMAGE_SIZES}
            src={coverImage}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col justify-between p-[9%]"
            style={{ color: edition.cover.ink }}
          >
            <div className="flex items-start justify-between">
              <span
                className="font-mono text-[0.42em] tracking-[0.22em] uppercase"
                style={{ color: edition.cover.accent }}
              >
                {edition.index}
              </span>
              <span className="font-mono text-[0.42em] tracking-[0.22em] uppercase opacity-70">
                {copy.publisher}
              </span>
            </div>
            <div>
              <div
                className="h-px w-[28%]"
                style={{ background: edition.cover.accent, opacity: 0.9 }}
              />
              <p className="mt-[8%] font-sans text-[1.05em] font-extralight leading-[0.95] tracking-[-0.03em]">
                Deus
                <br />
                Conosco
              </p>
              <p className="mt-[6%] font-mono text-[0.4em] tracking-[0.2em] uppercase opacity-80">
                {edition.subtitle}
              </p>
            </div>
            <div className="flex items-end justify-between">
              <span className="font-mono text-[0.4em] tracking-[0.2em] uppercase opacity-60">
                dia a dia
              </span>
              <span
                className="block h-[6%] w-[6%] rounded-full"
                style={{ background: edition.cover.accent }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
