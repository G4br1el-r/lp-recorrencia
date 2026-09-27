"use client";

import { m, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { useReducedMotionPreference } from "@/components/motion/useMotionPreferences";
import type { SiteAsset } from "@/lib/assets";
import { BACKDROP_IMAGE_QUALITY } from "@/lib/constants/images";
import { EASE } from "@/lib/constants/motion";

type Shade = "left" | "bottom" | "center";

const SHADE_CLASS: Record<Shade, string> = {
  left: "bg-[linear-gradient(90deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.5)_42%,rgba(0,0,0,0.05)_78%),linear-gradient(0deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0)_50%)]",
  bottom:
    "bg-[linear-gradient(0deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.4)_45%,rgba(0,0,0,0.15)_100%)]",
  center:
    "bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.55)_50%,rgba(0,0,0,0.88)_100%)]",
};

const SCROLL_ZOOM = {
  offset: ["start end", "end start"],
  input: [0, 1],
  scale: [1, 1.14],
} as const;

const INTRO_ZOOM = { fromScale: 1.12, durationS: 2.4 } as const;

type PhotoBackdropProps = {
  asset: SiteAsset;
  shade?: Shade;
  preload?: boolean;
  intro?: boolean;
  controlled?: boolean;
};

type BackdropImageProps = Pick<PhotoBackdropProps, "asset" | "preload">;

function BackdropImage({ asset, preload = false }: BackdropImageProps) {
  return (
    <Image
      alt=""
      className="object-cover"
      fill
      preload={preload}
      quality={BACKDROP_IMAGE_QUALITY}
      sizes="100vw"
      src={asset.src}
      style={{ objectPosition: asset.position }}
    />
  );
}

function ControlledBackdrop({
  asset,
  shade = "left",
  preload = false,
}: PhotoBackdropProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 will-change-transform"
        data-backdrop-media=""
      >
        <BackdropImage asset={asset} preload={preload} />
      </div>
      <div className={`absolute inset-0 ${SHADE_CLASS[shade]}`} />
      <div
        className="absolute inset-0 bg-stage opacity-0"
        data-backdrop-dim=""
      />
    </div>
  );
}

function ScrollZoomBackdrop({
  asset,
  shade = "left",
  preload = false,
  intro = false,
}: PhotoBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPreference();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [...SCROLL_ZOOM.offset],
  });
  const scale = useTransform(
    scrollYProgress,
    [...SCROLL_ZOOM.input],
    [...SCROLL_ZOOM.scale],
  );

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden"
      ref={ref}
    >
      <m.div
        className="absolute inset-0 will-change-transform"
        style={reduce ? undefined : { scale }}
      >
        <m.div
          animate={{ scale: 1 }}
          className="absolute inset-0"
          initial={intro ? { scale: INTRO_ZOOM.fromScale } : false}
          transition={{ duration: INTRO_ZOOM.durationS, ease: EASE.cinematic }}
        >
          <BackdropImage asset={asset} preload={preload} />
        </m.div>
      </m.div>
      <div className={`absolute inset-0 ${SHADE_CLASS[shade]}`} />
    </div>
  );
}

export function PhotoBackdrop({
  controlled = false,
  ...props
}: PhotoBackdropProps) {
  return controlled ? (
    <ControlledBackdrop {...props} />
  ) : (
    <ScrollZoomBackdrop {...props} />
  );
}
