# Phase 2: Landing Page - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesenhar completamente a Landing Page com o novo visual navy/gold — hero animado com fundo "luz cortando névoa", todas as seções (pain, como funciona, features, FAQ, footer) com novo visual, animações Framer Motion ao scroll, e navbar liquid-glass fixa. Fluxo de questionário e tela de diagnóstico NÃO são tocados nesta fase.

</domain>

<decisions>
## Implementation Decisions

### Hero Background
- **D-01:** Técnica: 2 divs absolutos com `radial-gradient` gold, animados por CSS keyframes (scale + opacity). Puro CSS, sem SVG extra.
- **D-02:** 2 focos de luz — um grande centralizado-superior (principal), um menor no canto inferior oposto. Assimetria sutil.
- **D-03:** Velocidade lenta e sutil — ciclo de 8–12s, opacidade entre 0.08–0.15. Cinematic, quase imperceptível em movimento mas dá vida à página.
- **D-04:** Background base: slate-950 (`#0F172A`). Keyframes definidos em `tailwind.config.js > keyframes` (padrão do projeto).

### Headline Animation
- **D-05:** Stagger por linha — cada linha da headline sobe com fade (staggerChildren 0.15s). Limpo, funciona em qualquer tamanho de tela.
- **D-06:** Ordem de entrada dos elementos: Badge → Headline (por linha) → Subtexto → CTA buttons. Delay ~0.15s entre cada elemento.
- **D-07:** Variantes existentes (`fadeUp`, `staggerContainer`) em `Landing.jsx` devem ser reaproveitadas — não recriar.

### Abordagem de Implementação
- **D-08:** Full rewrite do `Landing.jsx` — novo arquivo do zero com paleta navy/gold. Conteúdo (textos das seções, ícones SVG path `d=`, arrays `PAIN_POINTS`, `STEPS_FLOW`, `FEATURES`) deve ser aproveitado do arquivo atual.
- **D-09:** Estrutura de seções mantida: Navbar → Hero → Pain → Como Funciona → Features → FAQ → Footer.

### ReportCard (Mock do Diagnóstico no Hero)
- **D-10:** Manter o ReportCard como elemento visual no hero — atualizar cores de `money/ink` para `gold/navy`.
- **D-11:** ReportCard se revela progressivamente conforme o usuário scrolla o hero. Gatilho: `useScroll` + `useTransform` do Framer Motion. Cada seção do card (header, badge saúde, métricas, recomendação) entra em stagger conforme o scroll progride.
- **D-12:** Pequeno card flutuante (badge "Você está acima da média") mantido com animação de float (y oscillation).

### Claude's Discretion
- Valores exatos de `scrollYProgress` threshold para cada elemento do ReportCard — Claude define baseado em UX natural.
- Layout responsivo das seções (breakpoints, grid columns em mobile) — Claude decide seguindo padrões Tailwind do projeto.
- Copy exato do badge no hero (ex: "Diagnóstico gratuito" ou "Resultado em 3 min") — Claude escolhe consistente com o tom do projeto.
- Espaçamento entre seções — Claude segue padrão visual coerente.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System (Phase 1 — completo)
- `frontend/tailwind.config.js` — tokens gold (50–900), navy (800/900/950), keyframes existentes, shadows nomeados
- `frontend/src/index.css` — `.btn-gold`, `.btn-navy-outline`, `.card-navy`, `.badge-gold` — usar estes nas seções

### Arquivo a ser reescrito
- `frontend/src/components/Landing.jsx` — ler ANTES de escrever o novo. Conteúdo (textos, ícones, arrays de dados) a ser preservado. Variantes Framer Motion (`fadeUp`, `fadeUpSpring`, `staggerContainer`, `InView`) a serem mantidas ou melhoradas.

### Requisitos
- `.planning/REQUIREMENTS.md` — LP-01 a LP-09 — todos devem ser entregues nesta fase

### Projeto
- `.planning/PROJECT.md` — Visual Direction: background hero, paleta, estilo cinematic, headline validada

No external ADRs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fadeUp`, `fadeUpSpring`, `staggerContainer(stagger, delay)`, `InView` component — reutilizar no novo arquivo
- `AnimatedNumber` component — reutilizar para contadores (já tem `useSpring` + `useTransform`)
- `Icon`, `ArrowRight`, `Logo` components — reutilizar (Logo precisa de atualização: `money-500` → `gold-500`)
- Arrays de conteúdo: `PAIN_POINTS` (6 itens), `STEPS_FLOW` (3 passos), `FEATURES` (6 cards com ícones SVG) — preservar tudo
- `ReportCard` component — reutilizar com cores atualizadas (`money-*` → `gold-*`, `ink-*` → contexto correto navy/white)

### Established Patterns
- Keyframes em `tailwind.config.js > keyframes`, não inline no CSS
- Componentes CSS em `@layer components` no `index.css`
- Framer Motion: variants declarados fora do componente para performance
- `useInView` com `{ once: true, margin: '-60px' }` — padrão estabelecido

### Integration Points
- `frontend/src/App.jsx` (ou `main.jsx`) — Landing já roteada, não mudar roteamento
- `frontend/src/index.css` — pode adicionar `.hero-glow` ou variantes de bg se necessário

</code_context>

<specifics>
## Specific Ideas

- **ReportCard scroll-driven:** À medida que o usuário scrolla o hero, o card vai se "montando" — header aparece, depois badge de saúde, depois métricas, depois recomendação. Usa `useScroll({ target: heroRef })` + `useTransform` para mapear scrollYProgress → opacity/y de cada elemento.
- **Fundo hero:** slate-950 como base, 2 radial-gradient gold-500/gold-400 em posições assimétricas, keyframe animando `opacity` e `transform: scale()` lentamente (8–12s). Definir keyframe `glow-pulse` no tailwind.config.js.
- **Navbar liquid-glass:** `backdrop-blur-md bg-navy-950/80 border-b border-white/10` — padrão glass já usado no projeto.

</specifics>

<deferred>
## Deferred Ideas

- Parallax com mouse tracking no hero — v2 conforme REQUIREMENTS.md
- Animações GSAP para maior controle — v2
- Modo escuro — fora de escopo

</deferred>

---

*Phase: 02-landing-page*
*Context gathered: 2026-05-14*
