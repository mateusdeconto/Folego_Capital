# Roadmap: FinCheck Redesign Visual

## Milestones

- 🚧 **v2.0 Redesign Visual Completo** — Phases 1–4 (in progress)

## Phases

### Phase 1: Design System & Foundation
**Goal**: Tokens navy+gold instalados, Inter carregando, Tailwind config atualizado, componentes base (botões, cards, badges) com novo visual — app inteiro reflete nova paleta
**Depends on**: —
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05
**UI hint**: yes
**Plans:** 2/2 plans complete ✅
**Success Criteria**:
  1. Tailwind config tem cores navy, gold, slate como tokens nomeados
  2. Inter carrega via Google Fonts sem fallback visível
  3. Botões primários exibem navy+gold com hover/active corretos
  4. Cards sem glass excessivo, bordas sutis coerentes

Plans:
- [x] 01-01-PLAN.md — Add gold color scale (50–900) and shadow-gold to tailwind.config.js; verify Inter (DS-01, DS-02)
- [x] 01-02-PLAN.md — Add .btn-gold, .btn-navy-outline, .card-navy, .badge-gold to index.css (DS-03, DS-04, DS-05)

### Phase 2: Landing Page
**Goal**: Landing page completamente redesenhada — hero com fundo animado "luz cortando névoa", todas as seções com novo visual e animações Framer Motion que transmitem confiança e convidam ao diagnóstico
**Depends on**: Phase 1
**Requirements**: LP-01, LP-02, LP-03, LP-04, LP-05, LP-06, LP-07, LP-08, LP-09
**UI hint**: yes
**Plans:** 3/3 plans complete ✅ (checkpoint:human-verify pending)
**Success Criteria**:
  1. Hero exibe fundo animado (slate + raios dourados) sem piscar ao carregar
  2. Headline aparece com animação staggered character-by-character ou por linha
  3. Navbar é fixa, liquid-glass, não some no scroll
  4. Todas as seções têm entrada animada ao scroll (não carregam tudo de uma vez)
  5. CTA principal tem feedback visual de hover/click satisfatório

Plans:
- [x] 02-01-PLAN.md — Add glow-pulse keyframe to tailwind.config.js (LP-01)
- [x] 02-02-PLAN.md — Rewrite Landing.jsx: shared utilities + Navbar + Hero (LP-02, LP-03, LP-04)
- [x] 02-03-PLAN.md — Complete Landing.jsx: Pain + Como Funciona + Features + FAQ + Footer (LP-05—LP-09)

### Phase 3: Fluxo Questionário
**Goal**: Telas do questionário redesenhadas com o novo visual — transições suaves entre perguntas, progresso visível, sem flash branco entre telas
**Depends on**: Phase 2
**Requirements**: FL-01, FL-02, FL-03
**UI hint**: yes
**Plans:** 2/2 plans complete (checkpoint pending)
**Success Criteria**:
  1. Avançar entre perguntas anima com slide horizontal (sem troca abrupta)
  2. Barra de progresso anima ao avançar
  3. Submit → loading não causa flash branco

Plans:
- [x] 03-01-PLAN.md — Questionnaire slide + navy redesign + App.jsx dark wrapper (FL-01, FL-02, FL-03 prep)
- [x] 03-02-PLAN.md — Loading.jsx navy redesign + AnimatePresence message fade (FL-03 complete)

### Phase 4: Tela de Diagnóstico
**Goal**: Tela de resultados redesenhada — números animam ao entrar, seções revelam progressivamente, alertas têm destaque visual
**Depends on**: Phase 3
**Requirements**: DG-01, DG-02, DG-03
**UI hint**: yes
**Success Criteria**:
  1. Valores numéricos contam de 0 até o valor ao entrar na tela
  2. Seções revelam com stagger (uma após a outra)
  3. Cards de alerta têm animação diferenciada dos cards normais

---

## Progress

**Execution Order:** 1 → 2 → 3 → 4

| Phase | Plans Complete | Status |
|-------|----------------|--------|
| 1. Design System | 2/2 | Complete |
| 2. Landing Page | 3/3 | Checkpoint pending |
| 3. Questionário | 2/2 | Checkpoint pending |
| 4. Diagnóstico | 0/TBD | Not started |
