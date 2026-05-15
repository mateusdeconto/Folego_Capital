# Fôlego Capital — Redesign Visual Completo

## What This Is

Redesign completo da interface do Fôlego Capital — diagnóstico financeiro para PMEs brasileiras. O produto existe e funciona (MVP em produção no Railway), mas o design atual parece genérico/IA, afastando clientes. O objetivo é criar uma identidade visual premium e única.

## Core Value

O usuário dono de PME abre o site, **sente confiança imediata** e **enxerga possibilidade** — não medo. Entende em segundos que o Fôlego Capital vai clarear o que ele não enxerga nos próprios números. Clica no CTA sem hesitar.

## Context

- **Stack**: React 18 + Vite + Tailwind CSS + Framer Motion + Supabase
- **Deploy**: Railway (backend) + Vercel/Railway (frontend)
- **Usuário-alvo**: Dono de PME brasileira, qualquer setor, 25–55 anos
- **Problema atual**: Design mistura 3 linguagens visuais (dark hero + light content + glass cards), parece template genérico de fintech dark
- **Feedback de clientes**: "parece IA", "feio", "não transmite confiança"

## Visual Direction

- **Background hero**: Luz cortando névoa — slate profundo (#0F172A), raios de luz dourados se expandindo devagar, efeito de amanhecer/clareza emergindo
- **Paleta**: Navy + Ouro premium — deep navy como base, âmbar/gold (#F59E0B) como acento
- **Estilo**: Cinematic, premium, confiança sem intimidar
- **Animação**: Framer Motion — hero animado, entradas staggered, micro-interações nos CTAs
- **Headline hero**: "Seu negócio dá lucro de verdade?" (pergunta direta, já validada)
- **Tipografia**: Inter — limpa, moderna, autoridade

## Requirements

### Active

- [ ] Design system: paleta navy+gold, tokens de cor, tipografia Inter, componentes base (botões, cards, badges)
- [ ] Landing page completa: hero animado + pain section + como funciona + features + FAQ + footer
- [ ] Fluxo questionário: telas de perguntas com novo visual, barra de progresso, transições
- [ ] Tela de diagnóstico: resultado com métricas animadas, alertas visuais, hierarquia clara

### Out of Scope

- Backend/API changes — apenas frontend visual
- Dark mode — foco em light/dark premium único
- Mobile app — web responsivo suficiente por ora

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Framer Motion (não GSAP) | Já instalado, React-native, menos bundle | Confirmed |
| CSS animation para background | Sem URL de vídeo disponível, mais único que template | Confirmed |
| Navy + Gold | Transmite premium/confiança sem ser frio (verde atual era genérico) | Confirmed |
| Pergunta direta no headline | Testada pelo usuário, cria identificação imediata | Confirmed |

---
*Last updated: 2026-05-14 após initialization*

## Evolution

Este documento evolui a cada transição de fase e milestone.
