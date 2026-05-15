# Phase 1: Design System & Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 01-design-system-foundation
**Areas discussed:** Escopo de mudança, Tokens gold, Inter loading, Componentes base

---

## Escopo de Mudança

| Option | Description | Selected |
|--------|-------------|----------|
| Só tokens + landing | Adiciona tokens, Inter, mas componentes internos ficam com verde até fases 3/4 | ✓ |
| Tudo de uma vez | Componentes globais (.btn-primary, .card) já viram navy+gold | |

**User's choice:** Só tokens + landing
**Notes:** App interna não é tocada nesta fase.

---

## Tokens Gold

| Option | Description | Selected |
|--------|-------------|----------|
| gold com escala completa | Token 'gold' 50–900, base #F59E0B | ✓ |
| gold só 500+600+700 | Apenas valores usados | |
| Reutilizar amber do Tailwind | Sem token custom | |

**User's choice:** Escala completa

| Option | Description | Selected |
|--------|-------------|----------|
| #F59E0B — amber puro | Tailwind amber-500 | ✓ |
| #D97706 — amber mais escuro | amber-600 | |
| #FBBF24 — amber mais claro | amber-400 | |

**User's choice:** #F59E0B

---

## Inter Loading

| Option | Description | Selected |
|--------|-------------|----------|
| Google Fonts no index.html | Preconnect + stylesheet, pesos 400/500/600/700 | ✓ |
| Manter como está | System fallback, sem request extra | |

**User's choice:** "coloque o melhor" → Google Fonts

| Option | Description | Selected |
|--------|-------------|----------|
| Remove Fraunces | 100% Inter, menos bundle | |
| Mantém Fraunces | Útil para headlines display futuras | ✓ |

**User's choice:** Mantém

---

## Componentes Base

| Option | Description | Selected |
|--------|-------------|----------|
| Novas classes landing-specific | .btn-gold, .btn-navy-outline etc sem tocar internos | ✓ |
| Só tokens, sem novas classes | Landing usa Tailwind diretamente | |

**User's choice:** Novas classes landing-specific

| Component | Selected |
|-----------|----------|
| .btn-gold | ✓ |
| .btn-navy-outline | ✓ |
| .card-navy | ✓ |
| .badge-gold | ✓ |

---

## Claude's Discretion

- Escala completa gold (valores 50–900 além do 500 base)
- Shadow value para .btn-gold
- Pesos exatos e atributos do Google Fonts link

## Deferred Ideas

- Componentes internos navy+gold — fases 3/4
