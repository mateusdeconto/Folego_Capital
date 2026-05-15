# Requirements — Fôlego Capital Redesign Visual

## v1 Requirements

### DS — Design System

- [ ] **DS-01**: Design system define tokens de cor navy+gold (CSS custom properties + Tailwind config)
- [ ] **DS-02**: Tipografia Inter carrega via Google Fonts, aplicada globalmente com antialiasing
- [ ] **DS-03**: Botões têm estados hover/active/disabled visualmente distintos com novo visual
- [ ] **DS-04**: Cards usam nova paleta (borda sutil, sombra consistente, sem glass excessivo)
- [ ] **DS-05**: Badges e pills seguem novo sistema de cores semânticas

### LP — Landing Page

- [ ] **LP-01**: Hero exibe fundo animado "luz cortando névoa" (CSS keyframes, slate + raios dourados)
- [x] **LP-02**: Headline "Seu negócio dá lucro de verdade?" aparece com animação staggered ao carregar
- [x] **LP-03**: CTA principal responde ao hover/click com feedback visual satisfatório
- [x] **LP-04**: Navbar fixa com liquid-glass, logo Fôlego Capital, links e CTA
- [x] **LP-05**: Seção de pain points mostra dores do usuário de forma empática (não alarmante)
- [x] **LP-06**: Seção "Como funciona" (3 passos) com entrada animada ao scroll
- [x] **LP-07**: Seção de features (6 cards) com layout limpo e iconografia consistente
- [x] **LP-08**: FAQ com accordion animado
- [x] **LP-09**: Footer com links e info

### FL — Fluxo Questionário

- [ ] **FL-01**: Cada pergunta tem entrada/saída animada (slide horizontal entre perguntas)
- [ ] **FL-02**: Barra de progresso animada mostra avanço
- [ ] **FL-03**: Submit transiciona para loading com animação (sem flash branco)

### DG — Tela Diagnóstico

- [ ] **DG-01**: Valores financeiros animam de 0 ao valor real ao entrar na tela
- [ ] **DG-02**: Seções do diagnóstico revelam progressivamente com stagger
- [ ] **DG-03**: Cards de alerta têm animação de destaque diferenciada

## v2 (Deferred)

- Modo escuro
- Animações com GSAP para maior controle
- Parallax no hero com mouse tracking
- Micro-animações no chat da IA

## Out of Scope

- Mudanças no backend/API
- Novo onboarding de usuário
- Mobile app nativo

## Traceability

| Requirement | Phase |
|-------------|-------|
| DS-01 — DS-05 | Phase 1 |
| LP-01 — LP-09 | Phase 2 |
| FL-01 — FL-03 | Phase 3 |
| DG-01 — DG-03 | Phase 4 |
