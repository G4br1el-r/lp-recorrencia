const IMAGES_BASE = "/dcdd";
const BACKDROPS = `${IMAGES_BASE}/fundos`;
const MOMENTS = `${IMAGES_BASE}/momentos`;
const COVERS = `${IMAGES_BASE}/capas`;
const SHARING = `${IMAGES_BASE}/compartilhamento`;

export type SiteAsset = {
  src: string;
  alt: string;
  position?: string;
};

export const siteAssets = {
  lifestyle: {
    churchAisle: {
      src: `${BACKDROPS}/hero-basilica.webp`,
      alt: "Interior de uma basílica iluminada, com a cúpula dourada em mosaico e o crucifixo ao fim do corredor central",
    },
    dawnRoom: {
      src: `${BACKDROPS}/janela.webp`,
      alt: "Luz dourada do amanhecer atravessando uma janela alta numa sala ainda escura",
    },
    coverDetailDaily: {
      src: `${BACKDROPS}/detalhe-capa-dia-a-dia.webp`,
      alt: "Detalhe da capa do Deus Conosco dia a dia refletindo a luz",
      position: "50% 30%",
    },
    morningDevotional: {
      src: `${MOMENTS}/manha-cafe.webp`,
      alt: "Mãos segurando o Deus Conosco dia a dia numa mesa ao sol da manhã, ao lado de uma xícara de café",
    },
    familyReading: {
      src: `${MOMENTS}/familia.webp`,
      alt: "Casal lendo junto o Deus Conosco dia a dia à mesa, à luz de um abajur",
      position: "50% 15%",
    },
    bookInLight: {
      src: `${MOMENTS}/livro-feixe-de-luz.webp`,
      alt: "Deus Conosco dia a dia de pé sobre uma pedra, tocado por um feixe de luz",
      position: "56% 50%",
    },
    coverDetailCelebration: {
      src: `${MOMENTS}/detalhe-capa-celebracao.webp`,
      alt: "Detalhe da capa do Deus Conosco Celebração da Palavra",
    },
    bedsideTable: {
      src: `${MOMENTS}/cabeceira.webp`,
      alt: "Deus Conosco dia a dia na mesa de cabeceira, ao lado do abajur aceso, de um copo d'água e de um terço",
    },
    readingInChurch: {
      src: `${MOMENTS}/leitura-na-igreja.webp`,
      alt: "Mãos segurando o Deus Conosco aberto dentro de uma igreja iluminada por velas",
    },
  },
  share: {
    src: `${SHARING}/tres-edicoes-og.jpg`,
    width: 1200,
    height: 675,
    alt: "As três edições do Deus Conosco: Celebração da Palavra, Letras Grandes e Dia a Dia",
  },
  products: {
    traditional: `${COVERS}/convencional.webp`,
    largePrint: `${COVERS}/letras-grandes.webp`,
    celebration: `${COVERS}/celebracao.webp`,
  },
} as const;

export type LifestyleAssetKey = keyof typeof siteAssets.lifestyle;
