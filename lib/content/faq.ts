import { editions } from "@/lib/content/editions";
import { formatBRL, formatInstallments } from "@/lib/format/currency";

const ANNUAL_PRICES = editions
  .map(({ subtitle, price }) => {
    const installments = price.installments
      ? ` (${formatInstallments(price.installments.count, price.installments.value)})`
      : "";
    return `${subtitle}, ${formatBRL(price.anual)}${installments}`;
  })
  .join("; ");

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const faq: FaqItem[] = [
  {
    id: "o-que-e",
    question: "O que é o Deus Conosco?",
    answer:
      "É a publicação da Editora Santuário com as leituras, o Evangelho e uma reflexão para cada dia. A assinatura entrega cada nova edição na sua casa, sem que você precise lembrar de comprar.",
  },
  {
    id: "frequencia",
    question: "Com que frequência recebo as edições?",
    answer:
      "Todo mês chega um pacote com 2 edições, sempre adiantadas, para que cheguem com tempo de sobra. Assim a Palavra do dia nunca falta.",
  },
  {
    id: "valores",
    question: "Quanto custa a assinatura?",
    answer: `No plano anual: ${ANNUAL_PRICES}. Também há os planos semestral e bimestral, e o frete é grátis.`,
  },
  {
    id: "edicoes",
    question: "Qual a diferença entre as edições?",
    answer:
      "A Tradicional é o formato clássico do Deus Conosco dia a dia. A Letras Grandes tem o mesmo conteúdo com tipografia ampliada. A Celebração da Palavra é pensada para comunidades e celebrações, com leituras completas e orações.",
  },
  {
    id: "trocar",
    question: "Posso trocar de edição depois de assinar?",
    answer:
      "Sim. Você pode alterar a edição da sua assinatura a qualquer momento, e a mudança vale a partir da próxima edição enviada.",
  },
  {
    id: "cancelar",
    question: "A assinatura renova sozinha? Como cancelo?",
    answer:
      "Sim, é uma assinatura recorrente: renova automaticamente ao fim de cada período e continua ativa até você pedir o cancelamento. Para cancelar, é só ligar para a central de atendimento da Editora Santuário.",
  },
  {
    id: "presente",
    question: "Posso assinar para presentear alguém?",
    answer:
      "Sim. Basta informar o endereço de entrega da pessoa presenteada ao finalizar a assinatura.",
  },
];
