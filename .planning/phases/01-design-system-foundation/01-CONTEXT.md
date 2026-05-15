# Phase 1: Design System & Foundation - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Instalar tokens navy+gold no Tailwind, carregar Inter via Google Fonts, e criar componentes base específicos para a landing (`btn-gold`, `btn-navy-outline`, `card-navy`, `badge-gold`). Componentes internos da app (questionário, diagnóstico) **não são tocados** nesta fase — continuam com o sistema money/ink/parchment existente até as fases 3 e 4.

</domain>

<decisions>
## Implementation Decisions

### Escopo de Mudança
- **D-01:** Phase 1 cobre APENAS tokens novos + componentes da landing. App interna (Questionnaire, Diagnosis, Auth) fica com design atual intacto.
- **D-02:** Nenhuma classe existente (`.btn-primary`, `.card`, `.badge-*`, `.btn-cta`) é alterada — adições apenas.

### Tokens Gold
- **D-03:** Novo token `gold` com escala completa (50–900) adicionado ao `tailwind.config.js`, espelhando padrão do projeto.
- **D-04:** `gold-500 = #F59E0B` (amber puro — Tailwind amber-500). Escala gerada a partir deste valor base.
- **D-05:** Tokens `navy` já existem (800/900/950) — manter e complementar se necessário, não renomear.

### Tipografia
- **D-06:** Inter carregado via Google Fonts no `index.html` — preconnect + stylesheet link, pesos 400/500/600/700.
- **D-07:** Fraunces (serif) mantido no font stack — pode ser útil em headlines display nas fases seguintes.
- **D-08:** Antialiasing global já configurado no `index.css` — não alterar.

### Componentes Base (landing-specific)
- **D-09:** Criar 4 novas classes no `index.css` dentro de `@layer components`:
  - `.btn-gold` — fundo gold-500, hover gold-400, texto navy-900, shadow gold
  - `.btn-navy-outline` — borda gold/white, fundo transparente, hover sutil
  - `.card-navy` — fundo navy-800/900, borda white/10, para seções da landing
  - `.badge-gold` — badge dourado para labels de destaque na landing
- **D-10:** Não criar novos componentes React nesta fase — apenas classes CSS utilitárias.

### Claude's Discretion
- Valores exatos da escala gold (50, 100, 200, 300, 400, 600, 700, 800, 900) — Claude calcula baseado em gold-500 = #F59E0B seguindo o padrão de escala do projeto.
- Sombra do `.btn-gold` — Claude define valor consistente com o padrão `shadow-money` existente.
- Pesos exatos do Google Fonts link — Claude inclui os 4 pesos (400/500/600/700) com `display=swap`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System Existente
- `frontend/tailwind.config.js` — tokens atuais (ink, money, navy, brand, loss, forest), fontFamily, shadows, keyframes
- `frontend/src/index.css` — componentes CSS existentes (.btn-*, .card-*, .badge-*), animações, landing classes
- `frontend/src/components/Landing.jsx` — uso atual de Framer Motion, variants reutilizáveis, estrutura da landing

### Estrutura do Projeto
- `frontend/index.html` — onde adicionar Google Fonts link tags
- `.planning/REQUIREMENTS.md` — requisitos DS-01 a DS-05 que esta fase entrega

No external ADRs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Landing.jsx`: `fadeUp`, `fadeUpSpring`, `staggerContainer`, `InView` component — reutilizar em Phase 2, não recriar
- `index.css`: `.glass`, `.glass-card`, `.noise-overlay`, `.hero-section` — já existem para landing dark, Phase 2 pode extender
- `tailwind.config.js`: padrão de escala completa já estabelecido (ink tem 9 variantes) — seguir mesmo padrão para gold

### Established Patterns
- Cores adicionadas sempre no `tailwind.config.js > theme.extend.colors`
- Componentes CSS em `@layer components` no `index.css`
- Sombras nomeadas semanticamente (`shadow-card`, `shadow-money`) — seguir padrão `shadow-gold`
- Keyframes definidos em `tailwind.config.js > keyframes`, não diretamente no CSS

### Integration Points
- `index.html`: adicionar Google Fonts antes de qualquer outro stylesheet
- `tailwind.config.js`: adicionar `gold` em `theme.extend.colors` após `forest`
- `index.css`: adicionar novas classes após a seção `/* ---------- BADGES ---------- */`

</code_context>

<specifics>
## Specific Ideas

- Background hero "luz cortando névoa" (slate + raios dourados) é escopo da Phase 2, não Phase 1. Phase 1 apenas instala os tokens que Phase 2 vai consumir.
- A paleta navy já tem 800/900/950 — suficiente para Phase 1. Se Phase 2 precisar de variantes adicionais, adiciona lá.

</specifics>

<deferred>
## Deferred Ideas

- Mudança dos componentes internos (`.btn-primary` verde → gold) — Phase 3/4
- Dark mode — fora de escopo conforme PROJECT.md
- Parallax/GSAP — v2 conforme REQUIREMENTS.md

</deferred>

---

*Phase: 01-design-system-foundation*
*Context gathered: 2026-05-14*
