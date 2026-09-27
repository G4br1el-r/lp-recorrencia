import Image from "next/image";
import { type SiteAsset, siteAssets } from "@/lib/assets";
import { EASE, MOTION_SPRING } from "@/lib/constants/motion";
import type { Experience } from "@/lib/content/experiences";
import { cssTransition } from "@/lib/style/transition";

const PANEL = {
  idleDim: 0.55,
  imageActiveScale: 1.05,
  imageIdleScale: 1,
  detailGapPx: 14,
} as const;

const DETAIL_SHIFT = { shown: "0%", hidden: "100%" } as const;
const DETAIL_OPACITY = { shown: 1, hidden: 0 } as const;
const DIM_OPACITY = { active: 0 } as const;

const IMAGE_ZOOM = { duration: 1.4, ease: EASE.soft } as const;
const DIM_FADE = { duration: 0.8, ease: EASE.soft } as const;

const IMAGE_TRANSITION = cssTransition(
  "transform",
  IMAGE_ZOOM.duration,
  IMAGE_ZOOM.ease,
);
const DIM_TRANSITION = cssTransition(
  "opacity",
  DIM_FADE.duration,
  DIM_FADE.ease,
);
const DETAIL_TRANSITION = cssTransition(
  "transform",
  MOTION_SPRING.accordion.duration,
  MOTION_SPRING.accordion.ease,
);
const DETAIL_TEXT_TRANSITION = cssTransition(
  "opacity",
  MOTION_SPRING.accordion.duration,
  MOTION_SPRING.accordion.ease,
);

type ExperiencePanelProps = {
  item: Experience;
  active: boolean;
};

export function ExperiencePanel({ item, active }: ExperiencePanelProps) {
  const asset: SiteAsset = siteAssets.lifestyle[item.image];

  return (
    <li className="relative h-full w-[82vw] shrink-0 overflow-hidden rounded-xl bg-stage-soft will-change-transform md:aspect-[6/5] md:w-auto">
      <div
        className="absolute inset-0"
        data-panel-image=""
        style={{
          transform: `scale(${active ? PANEL.imageActiveScale : PANEL.imageIdleScale})`,
          transition: IMAGE_TRANSITION,
        }}
      >
        <div
          className="absolute -inset-x-[10%] inset-y-0 will-change-transform"
          data-discovery-image=""
        >
          <Image
            alt={asset.alt}
            className="object-cover"
            fill
            sizes="(min-width: 768px) 70vh, 82vw"
            src={asset.src}
            style={{ objectPosition: asset.position }}
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.1)_40%,rgba(0,0,0,0.88)_76%,rgba(0,0,0,0.96)_100%)]" />
      <div
        className="absolute inset-0 bg-stage"
        data-panel-dim=""
        style={{
          opacity: active ? DIM_OPACITY.active : PANEL.idleDim,
          transition: DIM_TRANSITION,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10">
        <div
          className="relative"
          data-panel-detail=""
          style={{
            transform: `translateY(${active ? DETAIL_SHIFT.shown : DETAIL_SHIFT.hidden})`,
            transition: DETAIL_TRANSITION,
          }}
        >
          <div className="absolute inset-x-0 bottom-full">
            <div className="flex items-center gap-3">
              <span className="label text-brand">{item.index}</span>
              <span className="label text-ink">{item.moment}</span>
            </div>
            <h3 className="font-display mt-3 text-[clamp(1.6rem,2.6vw,2.6rem)] font-bold leading-[1.02] text-ink">
              {item.title}
            </h3>
            <p className="mt-3 max-w-md text-sm text-ink-muted md:text-base">
              {item.description}
            </p>
          </div>
          <p
            className="max-w-md text-sm leading-relaxed text-ink md:text-base"
            style={{
              opacity: active ? DETAIL_OPACITY.shown : DETAIL_OPACITY.hidden,
              paddingTop: PANEL.detailGapPx,
              transition: DETAIL_TEXT_TRANSITION,
            }}
          >
            {item.detail}
          </p>
        </div>
      </div>
    </li>
  );
}
