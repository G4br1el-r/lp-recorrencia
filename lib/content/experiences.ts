import type { LifestyleAssetKey } from "@/lib/assets";

export type Experience = {
  id: string;
  index: string;
  moment: string;
  title: string;
  description: string;
  detail: string;
  image: LifestyleAssetKey;
};

export const experiences: Experience[] = [
  {
    id: "manha",
    index: "01",
    moment: "Manhã",
    title: "Antes de tudo começar",
    description:
      "Cinco minutos com a Palavra do dia, antes do primeiro compromisso.",
    detail:
      "Leitura, Evangelho e uma reflexão curta que cabe entre o café e a porta de casa.",
    image: "morningDevotional",
  },
  {
    id: "familia",
    index: "02",
    moment: "Em família",
    title: "Rezar junto",
    description:
      "A Palavra do dia lida em voz alta, à mesa, com quem você ama.",
    detail:
      "Uma leitura, um instante de silêncio e uma oração em comum antes de seguir o dia.",
    image: "familyReading",
  },
  {
    id: "silencio",
    index: "03",
    moment: "Silêncio",
    title: "Um instante só seu",
    description: "Uma pausa de contemplação no meio do dia.",
    detail:
      "A reflexão diária convida a parar, respirar e ouvir antes de seguir.",
    image: "bookInLight",
  },
  {
    id: "comunidade",
    index: "04",
    moment: "Comunidade",
    title: "Celebrar junto",
    description:
      "A edição Celebração da Palavra reúne o grupo em torno das mesmas leituras.",
    detail:
      "Leituras completas, orações e roteiros para ler em voz alta com a comunidade.",
    image: "coverDetailCelebration",
  },
  {
    id: "noite",
    index: "05",
    moment: "Noite",
    title: "Encerrar o dia em paz",
    description: "Reler o Evangelho do dia antes de dormir.",
    detail:
      "A luz baixa, a página aberta e a certeza de que amanhã haverá uma nova.",
    image: "bedsideTable",
  },
  {
    id: "domingo",
    index: "06",
    moment: "Domingo",
    title: "Chegar preparado",
    description:
      "As leituras da missa já conhecidas antes de entrar na igreja.",
    detail:
      "Ler antes, ouvir melhor, viver a celebração com mais profundidade.",
    image: "readingInChurch",
  },
];
