import { getImageProps } from "next/image";
import { SRGBColorSpace, Texture } from "three";
import { siteAssets } from "@/lib/assets";
import { BOOK_HEIGHT_PER_WIDTH } from "@/lib/constants/motion";
import type { Edition, EditionId } from "@/lib/content/editions";

export const BOOK_PROPORTION = {
  width: 1,
  height: BOOK_HEIGHT_PER_WIDTH,
  depth: 0.1,
} as const;

const TEXTURE_HEIGHT_PX = 1536;
const TEXTURE_WIDTH_PX = Math.round(
  (TEXTURE_HEIGHT_PX * BOOK_PROPORTION.width) / BOOK_PROPORTION.height,
);
const THICKNESS_PX = Math.round(
  (TEXTURE_HEIGHT_PX * BOOK_PROPORTION.depth) / BOOK_PROPORTION.height,
);

const COVER_BOARD_PX = Math.max(2, Math.round(THICKNESS_PX * 0.05));
const COVER_EDGE_SAMPLE_PX = 3;

const COVER_SOURCE_WIDTH_PX = 640;
const COVER_SOURCE_HEIGHT_PX = Math.round(
  (COVER_SOURCE_WIDTH_PX * BOOK_PROPORTION.height) / BOOK_PROPORTION.width,
);
const SRCSET_CANDIDATE_SEPARATOR = ", ";
const SRCSET_DESCRIPTOR_SEPARATOR = " ";

const PAGES = {
  tones: ["#f4efe6", "#eee7da", "#e4dbc9", "#d2c7b2"],
  lightBias: 3,
  seed: 293,
} as const;

export type BookTextures = {
  front: Texture;
  spine: Texture;
  foreEdge: Texture;
  headEdge: Texture;
  tailEdge: Texture;
};

type BookTextureSources = Record<
  keyof BookTextures,
  HTMLCanvasElement | HTMLImageElement
>;

type Random = () => number;

const sourcesByEdition = new Map<EditionId, Promise<BookTextureSources>>();

export function mulberry32(seed: number): Random {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function optimizedCoverSrc(src: string): string {
  const { props } = getImageProps({
    alt: "",
    height: COVER_SOURCE_HEIGHT_PX,
    src,
    width: COVER_SOURCE_WIDTH_PX,
  });
  const [baseCandidate] = props.srcSet?.split(SRCSET_CANDIDATE_SEPARATOR) ?? [];
  const [baseUrl] = baseCandidate?.split(SRCSET_DESCRIPTOR_SEPARATOR) ?? [];
  return baseUrl || props.src;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
}

function createCanvas(
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D indisponível");
  }
  return [canvas, context];
}

function toTexture(
  source: HTMLCanvasElement | HTMLImageElement,
  anisotropy: number,
): Texture {
  const texture = new Texture(source);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function pageTone(random: Random): string {
  const index = Math.floor(random() ** PAGES.lightBias * PAGES.tones.length);
  return PAGES.tones[index];
}

function drawPageLines(
  context: CanvasRenderingContext2D,
  stack: "columns" | "rows",
  random: Random,
): void {
  const { width, height } = context.canvas;
  const lines = stack === "columns" ? width : height;
  for (let line = 0; line < lines; line += 1) {
    context.fillStyle = pageTone(random);
    if (stack === "columns") {
      context.fillRect(line, 0, 1, height);
    } else {
      context.fillRect(0, line, width, 1);
    }
  }
}

function drawSpine(edition: Edition): HTMLCanvasElement {
  const [canvas, context] = createCanvas(THICKNESS_PX, TEXTURE_HEIGHT_PX);
  context.fillStyle = edition.cover.spine;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawForeEdge(
  edition: Edition,
  cover: HTMLImageElement,
  random: Random,
): HTMLCanvasElement {
  const [canvas, context] = createCanvas(THICKNESS_PX, TEXTURE_HEIGHT_PX);
  drawPageLines(context, "columns", random);
  context.drawImage(
    cover,
    cover.naturalWidth - COVER_EDGE_SAMPLE_PX,
    0,
    COVER_EDGE_SAMPLE_PX,
    cover.naturalHeight,
    0,
    0,
    COVER_BOARD_PX,
    canvas.height,
  );
  context.fillStyle = edition.cover.spine;
  context.fillRect(
    canvas.width - COVER_BOARD_PX,
    0,
    COVER_BOARD_PX,
    canvas.height,
  );
  return canvas;
}

function drawEndEdge(
  edition: Edition,
  cover: HTMLImageElement,
  random: Random,
  end: "head" | "tail",
): HTMLCanvasElement {
  const [canvas, context] = createCanvas(TEXTURE_WIDTH_PX, THICKNESS_PX);
  drawPageLines(context, "rows", random);
  const coverRowY = end === "head" ? canvas.height - COVER_BOARD_PX : 0;
  const sourceY =
    end === "head" ? 0 : cover.naturalHeight - COVER_EDGE_SAMPLE_PX;
  context.drawImage(
    cover,
    0,
    sourceY,
    cover.naturalWidth,
    COVER_EDGE_SAMPLE_PX,
    0,
    coverRowY,
    canvas.width,
    COVER_BOARD_PX,
  );
  context.fillStyle = edition.cover.spine;
  const backRowY = end === "head" ? 0 : canvas.height - COVER_BOARD_PX;
  context.fillRect(0, backRowY, canvas.width, COVER_BOARD_PX);
  context.fillRect(0, 0, COVER_BOARD_PX, canvas.height);
  return canvas;
}

async function drawBookSources(edition: Edition): Promise<BookTextureSources> {
  const cover = await loadImage(
    optimizedCoverSrc(siteAssets.products[edition.id]),
  );
  const random = mulberry32(PAGES.seed);
  return {
    front: cover,
    spine: drawSpine(edition),
    foreEdge: drawForeEdge(edition, cover, random),
    headEdge: drawEndEdge(edition, cover, random, "head"),
    tailEdge: drawEndEdge(edition, cover, random, "tail"),
  };
}

function loadBookSources(edition: Edition): Promise<BookTextureSources> {
  const cached = sourcesByEdition.get(edition.id);
  if (cached) {
    return cached;
  }
  const pending = drawBookSources(edition).catch((error: unknown) => {
    sourcesByEdition.delete(edition.id);
    throw error;
  });
  sourcesByEdition.set(edition.id, pending);
  return pending;
}

export async function createBookTextures(
  edition: Edition,
  anisotropy: number,
): Promise<BookTextures> {
  const sources = await loadBookSources(edition);
  return {
    front: toTexture(sources.front, anisotropy),
    spine: toTexture(sources.spine, anisotropy),
    foreEdge: toTexture(sources.foreEdge, anisotropy),
    headEdge: toTexture(sources.headEdge, anisotropy),
    tailEdge: toTexture(sources.tailEdge, anisotropy),
  };
}
