import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type BookTextures,
  mulberry32,
  optimizedCoverSrc,
  pageTone,
} from "@/components/motion/book3d/bookTextures";
import { editions } from "@/lib/content/editions";

const ANISOTROPY = 4;
const SECOND_ANISOTROPY = 8;
const TEXTURE_KEYS: (keyof BookTextures)[] = [
  "front",
  "spine",
  "foreEdge",
  "headEdge",
  "tailEdge",
];
const DECODE_FAILURE = "falha ao decodificar";
const DECODES_AFTER_ONE_RETRY = 2;

type ImagePropsInput = { src: string };
type ImagePropsOutput = { props: { src: string; srcSet?: string } };

const passThroughImageProps = ({ src }: ImagePropsInput): ImagePropsOutput => ({
  props: { src },
});

const mocks = vi.hoisted(() => ({
  getImageProps: vi.fn<(input: ImagePropsInput) => ImagePropsOutput>(),
}));

vi.mock("next/image", () => ({
  getImageProps: mocks.getImageProps,
}));

const SEED = 293;
const OTHER_SEED = 7;
const SAMPLE_SIZE = 1000;
const LOWEST_RANDOM = 0;
const RANDOM_UPPER_BOUND = 1;
const HIGHEST_RANDOM = RANDOM_UPPER_BOUND - Number.EPSILON;
const HEX_COLOR = /^#[0-9a-f]{6}$/;
const COVER_SRC = "/products/capa.png";
const OPTIMIZED_BASE_URL = "/_next/image?url=%2Fproducts%2Fcapa.png&w=640&q=75";
const OPTIMIZED_RETINA_URL =
  "/_next/image?url=%2Fproducts%2Fcapa.png&w=1080&q=75";
const FALLBACK_SRC = "/_next/image?url=%2Fproducts%2Fcapa.png&w=3840&q=75";
const EMPTY_SRCSET = "";

const decode = vi.fn<() => Promise<void>>();

function fakeContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context: Pick<
    CanvasRenderingContext2D,
    "canvas" | "fillStyle" | "fillRect" | "drawImage"
  > = {
    canvas,
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  };
  return context as CanvasRenderingContext2D;
}

async function loadModule() {
  vi.resetModules();
  return import("@/components/motion/book3d/bookTextures");
}

function sourceOf(textures: BookTextures, key: keyof BookTextures): unknown {
  return textures[key].image;
}

describe("createBookTextures", () => {
  const [edition, otherEdition] = editions;

  beforeEach(() => {
    mocks.getImageProps.mockImplementation(passThroughImageProps);
    decode.mockReset();
    decode.mockResolvedValue(undefined);
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: decode,
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement) {
        return fakeContext(this);
      } as unknown as HTMLCanvasElement["getContext"],
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
  });

  it("decodifica a capa uma vez e reaproveita as fontes entre cenas", async () => {
    const { createBookTextures } = await loadModule();

    const first = await createBookTextures(edition, ANISOTROPY);
    const second = await createBookTextures(edition, SECOND_ANISOTROPY);

    expect(decode).toHaveBeenCalledOnce();
    for (const key of TEXTURE_KEYS) {
      expect(second[key]).not.toBe(first[key]);
      expect(sourceOf(second, key)).toBe(sourceOf(first, key));
    }
    expect(second.front.anisotropy).toBe(SECOND_ANISOTROPY);
  });

  it("chamadas simultâneas compartilham o mesmo carregamento", async () => {
    const { createBookTextures } = await loadModule();

    const [first, second] = await Promise.all([
      createBookTextures(edition, ANISOTROPY),
      createBookTextures(edition, ANISOTROPY),
    ]);

    expect(decode).toHaveBeenCalledOnce();
    expect(sourceOf(second, "front")).toBe(sourceOf(first, "front"));
  });

  it("mantém fontes separadas por edição", async () => {
    const { createBookTextures } = await loadModule();

    const first = await createBookTextures(edition, ANISOTROPY);
    const other = await createBookTextures(otherEdition, ANISOTROPY);

    expect(sourceOf(other, "front")).not.toBe(sourceOf(first, "front"));
  });

  it("descartar as texturas de uma cena não invalida o cache das outras", async () => {
    const { createBookTextures } = await loadModule();

    const first = await createBookTextures(edition, ANISOTROPY);
    for (const texture of Object.values(first)) {
      texture.dispose();
    }
    const second = await createBookTextures(edition, ANISOTROPY);

    expect(decode).toHaveBeenCalledOnce();
    expect(sourceOf(second, "front")).toBe(sourceOf(first, "front"));
    expect(sourceOf(second, "spine")).toBe(sourceOf(first, "spine"));
  });

  it("tenta de novo depois de uma falha de carregamento", async () => {
    const { createBookTextures } = await loadModule();
    decode.mockRejectedValueOnce(new Error(DECODE_FAILURE));

    await expect(createBookTextures(edition, ANISOTROPY)).rejects.toThrow(
      DECODE_FAILURE,
    );
    const textures = await createBookTextures(edition, ANISOTROPY);

    expect(decode).toHaveBeenCalledTimes(DECODES_AFTER_ONE_RETRY);
    expect(textures.front.image).toBeInstanceOf(HTMLImageElement);
  });
});

function draw(random: () => number, count: number): number[] {
  return Array.from({ length: count }, () => random());
}

describe("mulberry32", () => {
  it("gera a mesma sequência para a mesma semente", () => {
    expect(draw(mulberry32(SEED), SAMPLE_SIZE)).toEqual(
      draw(mulberry32(SEED), SAMPLE_SIZE),
    );
  });

  it("gera sequências diferentes para sementes diferentes", () => {
    expect(draw(mulberry32(SEED), SAMPLE_SIZE)).not.toEqual(
      draw(mulberry32(OTHER_SEED), SAMPLE_SIZE),
    );
  });

  it("mantém todos os valores no intervalo [0, 1)", () => {
    for (const value of draw(mulberry32(SEED), SAMPLE_SIZE)) {
      expect(value).toBeGreaterThanOrEqual(LOWEST_RANDOM);
      expect(value).toBeLessThan(RANDOM_UPPER_BOUND);
    }
  });
});

describe("optimizedCoverSrc", () => {
  afterEach(() => {
    mocks.getImageProps.mockReset();
  });

  it("usa a primeira URL do srcSet otimizado", () => {
    mocks.getImageProps.mockReturnValue({
      props: {
        src: FALLBACK_SRC,
        srcSet: `${OPTIMIZED_BASE_URL} 1x, ${OPTIMIZED_RETINA_URL} 2x`,
      },
    });

    expect(optimizedCoverSrc(COVER_SRC)).toBe(OPTIMIZED_BASE_URL);
    expect(mocks.getImageProps).toHaveBeenCalledWith(
      expect.objectContaining({ src: COVER_SRC }),
    );
  });

  it("cai no src quando o srcSet vem vazio", () => {
    mocks.getImageProps.mockReturnValue({
      props: { src: FALLBACK_SRC, srcSet: EMPTY_SRCSET },
    });

    expect(optimizedCoverSrc(COVER_SRC)).toBe(FALLBACK_SRC);
  });

  it("cai no src quando não há srcSet", () => {
    mocks.getImageProps.mockReturnValue({ props: { src: FALLBACK_SRC } });

    expect(optimizedCoverSrc(COVER_SRC)).toBe(FALLBACK_SRC);
  });
});

describe("pageTone", () => {
  it.each([LOWEST_RANDOM, HIGHEST_RANDOM])(
    "devolve um tom válido no extremo %s",
    (value) => {
      expect(pageTone(() => value)).toMatch(HEX_COLOR);
    },
  );

  it("usa tons diferentes nos dois extremos", () => {
    expect(pageTone(() => LOWEST_RANDOM)).not.toBe(
      pageTone(() => HIGHEST_RANDOM),
    );
  });

  it("nunca devolve tom indefinido em uma sequência pseudoaleatória", () => {
    const random = mulberry32(SEED);
    const tones = Array.from({ length: SAMPLE_SIZE }, () => pageTone(random));
    for (const tone of tones) {
      expect(tone).toMatch(HEX_COLOR);
    }
  });
});
