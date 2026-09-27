# Deus Conosco — Landing de assinatura (versão convencional)

Landing page da assinatura do **Deus Conosco** (Editora Santuário), com rolagem nativa e animações de entrada leves.
É a versão convencional do projeto `lp-recorrencia`: mesmo layout, mesmas seções e o mesmo conteúdo, sem o
scrollytelling com seções pinadas.

Este projeto usa exclusivamente **pnpm**.

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
```

## Stack

- Next.js 16 (App Router, React Compiler) + React 19 + Tailwind 4 + Biome
- **Motion** (`motion/react`): entradas ao entrar na tela, microinterações e os poucos efeitos ligados ao scroll
- **GSAP + ScrollTrigger**: só nas cinco cenas pinadas (Hero, Edições, O ano inteiro, Escolha sua edição, Momentos), iguais às do projeto original
- **three.js**: livros 3D das cenas pinadas (carregado sob demanda, com fallback em CSS)
- Vitest + Testing Library

- **Lenis**: inércia do scroll, encaixe nos pontos de repouso e trava de scroll forte (ver abaixo)

## Cenas pinadas

Hero, Edições, O ano inteiro, Escolha sua edição e Momentos foram portadas do `lp-recorrencia` com a mesma timeline. Cada uma tem o próprio palco
(`StageProvider` + `StageLayer` em `components/motion/ProductStage.tsx`) dentro da seção, então os livros 3D saem junto
com a seção ao fim do pin. Os links de âncora para seções pinadas pousam no primeiro ponto de repouso da cena; para as
demais, descontam a altura do header.

### Encaixe e scroll forte (desktop)

- **Encaixe** (`snap.ts`): ao parar dentro de uma cena pinada, o scroll avança para o próximo ponto de repouso se andou
  12% do caminho, senão volta. Fora das cenas pinadas não há encaixe. Entrando numa cena, pousa no primeiro ponto; a
  saída da cena é livre.
- **Trava por gesto** (`wheelGate.ts`): um gesto de roda/trackpad anda no máximo até o próximo ponto de repouso ou
  borda de cena pinada; o resto do gesto (inclusive a inércia do trackpad) é ignorado até uma pausa de 220 ms ou até
  a força da roda voltar a subir (novo swipe durante a inércia), passados 350 ms da trava.
- Quando o delta da roda é zerado (pela trava ou pelo `limitWheelLead`), o evento é cancelado aqui mesmo: o Lenis não
  chama `preventDefault()` para delta zero, e o scroll nativo vazaria por cima das cenas.

## Arquitetura

```text
app/                   layout (fontes), page (ordem das seções), globals.css (tokens e utilitários)
components/motion/     Reveal, ScrollProgress, MagneticButton, MotionProvider, SmoothScrollProvider, snap, wheelGate, wheelLead, ProductStage, useScene, stage, SplitText
components/motion/book3d/ renderizador WebGL dos livros
components/sections/   Hero, Daily, Editions, SubscriptionTimeline, Time, EditionSelector, Discovery, Pricing, FinalCTA, FAQ
components/ui/         Header, Footer, Button, ProductBook, CoverPair, PricingCard, ExperiencePanel, FaqAccordion, SceneBackdrop
lib/assets.ts          assets centralizados
lib/content/           dados mockados: edições, planos, FAQ, momentos, copy, links
lib/carousel/          card mais próximo no carrossel de momentos
lib/date/              dia da semana atual (sem divergência de hidratação)
lib/selection/         estado de escolha (edição + plano)
```

## Movimento

- **Entrada**: cada bloco entra uma vez ao aparecer na tela (`whileInView` com `once`). Títulos sobem linha a linha
  (`RevealLines`); listas entram em sequência (`RevealGroup` + `RevealItem`).
- **Scroll**: as três cenas pinadas; fora delas, só a barra de progresso e o zoom suave das fotos de fundo.
- **Interação**: abas do seletor de edição com livros em coverflow, dias da semana clicáveis (abre no dia de hoje),
  hover nos livros das Edições, escolha de edição e plano nos preços.

Com `prefers-reduced-motion: reduce` nenhuma timeline de scroll é montada, as cenas pinadas mostram o estado estático
(`.reduced-only` / `.motion-only`), o `MotionConfig` desliga os transforms e as animações em CSS param.

## Dados

Preços, benefícios, frequência e textos são mock (`lib/content`). Quando a API/CMS existir, esses módulos são o ponto
único de troca.
