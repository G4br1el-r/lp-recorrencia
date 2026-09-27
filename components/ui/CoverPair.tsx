import Image from "next/image";
import { siteAssets } from "@/lib/assets";
import type { EditionId } from "@/lib/content/editions";

const COVER_SIZE = { width: 64, height: 96 } as const;
const COVER_SHADOW = "shadow-[0_10px_20px_-8px_rgba(0,0,0,0.9)]";

type CoverPairProps = {
  editionId: EditionId;
  className?: string;
};

export function CoverPair({ editionId, className = "w-12" }: CoverPairProps) {
  const src = siteAssets.products[editionId];
  return (
    <div aria-hidden="true" className={`relative shrink-0 ${className}`}>
      <Image
        alt=""
        className={`absolute left-0 top-0 h-auto w-full translate-x-[30%] rotate-[8deg] rounded-xs brightness-75 ${COVER_SHADOW}`}
        height={COVER_SIZE.height}
        src={src}
        width={COVER_SIZE.width}
      />
      <Image
        alt=""
        className={`relative h-auto w-full translate-x-[-10%] rounded-xs ${COVER_SHADOW}`}
        height={COVER_SIZE.height}
        src={src}
        width={COVER_SIZE.width}
      />
    </div>
  );
}
