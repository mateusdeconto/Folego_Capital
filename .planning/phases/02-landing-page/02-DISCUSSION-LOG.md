# Phase 2: Landing Page - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 02-landing-page
**Areas discussed:** Hero background, Headline animation, Rebuild vs patch

---

## Hero Background

| Option | Description | Selected |
|--------|-------------|----------|
| Gradientes radiais layered | 3–4 divs com radial-gradient gold animados por keyframes | ✓ |
| SVG rays + CSS animation | SVG com linhas diagonais animadas com stroke-dashoffset | |
| CSS conic-gradient | conic-gradient rotacionando com mix-blend-mode | |

**User's choice:** "o mais bonito deles, mas nada que pareça extraordinário, quero que seja animado" → gradientes radiais

| Focos | Description | Selected |
|-------|-------------|----------|
| 2 focos (assimétrico) | Grande centralizado-superior + menor no canto inferior oposto | ✓ |
| 3 focos | Superior-centro, inferior-esquerdo, direita-média | |
| 1 foco central | Minimalista, só um radial no centro-topo | |

| Velocidade | Description | Selected |
|------------|-------------|----------|
| Lenta e sutil | 8–12s, opacidade 0.08–0.15 | ✓ |
| Média | 4–6s, opacidade 0.15–0.25 | |
| Pulsar | scale + opacity em pulso 3s | |

---

## Headline Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Por linha | Cada linha sobe com fade, stagger 0.15s | ✓ |
| Por palavra | Cada palavra anima individualmente | |
| Character-by-character | Letra por letra, typewriter | |

| Ordem de entrada | Description | Selected |
|------------------|-------------|----------|
| Badge → Headline → Sub → CTA | Contexto primeiro, depois headline, subtexto, botões | ✓ |
| Headline → Sub → CTA | Sem badge de entrada | |
| Tudo junto | Stagger mínimo 0.05s | |

---

## Rebuild vs Patch

| Option | Description | Selected |
|--------|-------------|----------|
| Full rewrite | Novo arquivo do zero, conteúdo reaproveitado | ✓ |
| Patch seção a seção | Trocar classes progressivamente | |
| Hybrid | Reescrever Hero + Navbar, patch no resto | |

| ReportCard | Description | Selected |
|------------|-------------|----------|
| Manter com scroll-reveal | Atualizar cores, revelar progressivamente com scroll | ✓ |
| Substituir por screenshot | Print real do produto | |
| Remover do hero | Hero só texto + CTA | |

**User's note:** "mantenha esse formato, mas quero que ele vá se construindo com o cliente mexendo na página" → scroll-driven progressive reveal

| Gatilho do ReportCard | Description | Selected |
|-----------------------|-------------|----------|
| Scroll do hero | useScroll + useTransform do Framer Motion | ✓ |
| Auto-play após 1s | Inicia 1s depois do carregamento | |
| Hover no card | Mouse sobre o card revela | |

---

## Claude's Discretion

- Valores exatos de scrollYProgress threshold para cada elemento do ReportCard
- Layout responsivo (breakpoints, grid columns mobile)
- Copy do badge no hero
- Espaçamento entre seções

## Deferred Ideas

- Parallax com mouse tracking — v2
- GSAP — v2
- Modo escuro — out of scope
