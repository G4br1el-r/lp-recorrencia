import type { PlanId } from "@/lib/content/plans";

export type EditionId = "traditional" | "largePrint" | "celebration";

export type EditionPrice = Record<PlanId, number> & {
  installments?: { count: number; value: number };
};

export type Edition = {
  id: EditionId;
  index: string;
  name: string;
  subtitle: string;
  tagline: string;
  hook: readonly [string, string];
  audience: string;
  highlights: string[];
  format: string;
  price: EditionPrice;
  cover: {
    background: string;
    ink: string;
    accent: string;
    spine: string;
  };
};

const TRADITIONAL_ANNUAL_PRICE_BRL = 101.9;
const TRADITIONAL_SEMIANNUAL_PRICE_BRL = 50.95;
const TRADITIONAL_BIMONTHLY_PRICE_BRL = 16.98;
const TRADITIONAL_INSTALLMENT_COUNT = 3;
const TRADITIONAL_INSTALLMENT_VALUE_BRL = 33.97;

const LARGE_PRINT_ANNUAL_PRICE_BRL = 135.9;
const LARGE_PRINT_SEMIANNUAL_PRICE_BRL = 67.95;
const LARGE_PRINT_BIMONTHLY_PRICE_BRL = 22.65;
const LARGE_PRINT_INSTALLMENT_COUNT = 4;
const LARGE_PRINT_INSTALLMENT_VALUE_BRL = 33.98;

const CELEBRATION_ANNUAL_PRICE_BRL = 43.3;
const CELEBRATION_SEMIANNUAL_PRICE_BRL = 21.65;
const CELEBRATION_BIMONTHLY_PRICE_BRL = 7.22;

export const editions: Edition[] = [
  {
    id: "traditional",
    index: "01",
    name: "Deus Conosco dia a dia",
    subtitle: "Tradicional",
    tagline: "A Palavra de cada dia, no formato que cabe na rotina.",
    hook: ["A Palavra do dia,", "do jeito de sempre."],
    audience: "Para quem quer rezar com a liturgia todos os dias.",
    highlights: [
      "Leituras e Evangelho de cada dia",
      "Reflexão breve para começar o dia",
      "O formato clássico do Deus Conosco",
    ],
    format: "Formato clássico",
    price: {
      anual: TRADITIONAL_ANNUAL_PRICE_BRL,
      semestral: TRADITIONAL_SEMIANNUAL_PRICE_BRL,
      bimestral: TRADITIONAL_BIMONTHLY_PRICE_BRL,
      installments: {
        count: TRADITIONAL_INSTALLMENT_COUNT,
        value: TRADITIONAL_INSTALLMENT_VALUE_BRL,
      },
    },
    cover: {
      background:
        "linear-gradient(160deg, #5a1e24 0%, #3a1116 55%, #2a0b0f 100%)",
      ink: "#f2e6d6",
      accent: "#d8b26a",
      spine: "#e60d0a",
    },
  },
  {
    id: "largePrint",
    index: "02",
    name: "Deus Conosco dia a dia",
    subtitle: "Letras Grandes",
    tagline: "O mesmo conteúdo, com conforto para os olhos.",
    hook: ["Letra grande.", "Leitura leve."],
    audience: "Para quem prefere ler sem esforço, com tipografia ampliada.",
    highlights: [
      "Mesmo conteúdo da edição Tradicional",
      "Tipografia ampliada e espaçada",
      "Leitura confortável em qualquer luz",
    ],
    format: "Formato 30% maior",
    price: {
      anual: LARGE_PRINT_ANNUAL_PRICE_BRL,
      semestral: LARGE_PRINT_SEMIANNUAL_PRICE_BRL,
      bimestral: LARGE_PRINT_BIMONTHLY_PRICE_BRL,
      installments: {
        count: LARGE_PRINT_INSTALLMENT_COUNT,
        value: LARGE_PRINT_INSTALLMENT_VALUE_BRL,
      },
    },
    cover: {
      background:
        "linear-gradient(160deg, #3b3324 0%, #26211a 55%, #191510 100%)",
      ink: "#f2e6d6",
      accent: "#e0c07a",
      spine: "#e22913",
    },
  },
  {
    id: "celebration",
    index: "03",
    name: "Deus Conosco",
    subtitle: "Celebração da Palavra",
    tagline: "Feita para a comunidade que se reúne.",
    hook: ["Uma Palavra.", "Muitas vozes."],
    audience: "Para grupos, ministros e comunidades que celebram juntos.",
    highlights: [
      "Leituras completas para as celebrações",
      "Orações e roteiros para a comunidade",
      "Pensada para ser lida em voz alta",
    ],
    format: "Formato ampliado",
    price: {
      anual: CELEBRATION_ANNUAL_PRICE_BRL,
      semestral: CELEBRATION_SEMIANNUAL_PRICE_BRL,
      bimestral: CELEBRATION_BIMONTHLY_PRICE_BRL,
    },
    cover: {
      background:
        "linear-gradient(160deg, #e9dfcc 0%, #d9cdb6 55%, #c9bca2 100%)",
      ink: "#2a1d14",
      accent: "#8a5a2b",
      spine: "#023e77",
    },
  },
];

export const DEFAULT_EDITION_ID: EditionId = "traditional";

export function getEdition(id: EditionId): Edition {
  const found = editions.find((edition) => edition.id === id);
  if (!found) {
    throw new Error(`Edição desconhecida: ${id}`);
  }
  return found;
}
