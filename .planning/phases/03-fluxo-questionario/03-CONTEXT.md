---
phase: 03-fluxo-questionario
type: context
requirements: [FL-01, FL-02, FL-03]
---

# Phase 3 Context — Fluxo Questionário

## Goal

Redesenhar as telas do questionário com o novo visual navy+gold, adicionar transições suaves entre
perguntas e eliminar o flash branco na transição para o loading.

## Requirements

- **FL-01**: Avançar entre perguntas anima com slide horizontal (sem troca abrupta)
- **FL-02**: Barra de progresso anima ao avançar
- **FL-03**: Submit → loading não causa flash branco

## Files Touched

| File | Purpose |
|------|---------|
| `frontend/src/components/Questionnaire.jsx` | FL-01 slide anim + FL-02 progress + navy redesign |
| `frontend/src/components/Loading.jsx` | FL-03 navy redesign + no-flash |
| `frontend/src/App.jsx` | FL-03 AnimatePresence step transitions + wrapper bg |

## Current State (as-is)

### Questionnaire.jsx
- `currentIndex` state changes question instantly — no animation
- `window.scrollTo({ top: 0, behavior: 'smooth' })` on advance
- No Framer Motion imports
- Progress bar: `.progress-fill` with CSS `transition: width 0.4s` — functional but no number animation
- Cards: `.card` class (white bg, old theme)
- App wrapper: `bg-ink-50` (light parchment)

### Loading.jsx
- Spinner: CSS border-t animation (white card `.card`)
- Messages cycle every 3s — no animated transition between messages
- No Framer Motion
- On step change QUESTIONNAIRE→LOADING: React unmounts/mounts, causing white flash since App wrapper is `bg-ink-50`

### App.jsx
- No AnimatePresence between steps
- Wrapper: `min-h-screen flex items-start sm:items-center justify-center p-4 py-8 bg-ink-50`
- Questionnaire uses `w-full max-w-5xl`

## Target State (to-be)

### Questionnaire redesign (FL-01, FL-02)
- Slide horizontal: AnimatePresence with direction-aware x offset (next=+60→0, prev=-60→0, exit inverse)
- Direction tracked via `dir` state ref (1=forward, -1=backward)
- Progress bar: `motion.div` width with spring, percentage number animates via `useSpring`/`useTransform`
- Visual: dark card `bg-navy-900 border border-white/10` on dark wrapper `bg-slate-950`
- Chapter label: gold accent
- Buttons: btn-gold for primary, outline for back
- LiveDRE panel: dark card style consistent

### Loading redesign (FL-03)
- Dark bg matching questionnaire: wrapper `bg-slate-950`
- Gold spinner replacing green
- Message transitions: AnimatePresence with fade between messages
- Countdown card: dark navy style

### App.jsx (FL-03)
- Add `bg-slate-950` to wrapper when step is QUESTIONNAIRE or LOADING (eliminates flash since both are dark)
- OR: AnimatePresence wrapping the inner content with a fade transition between steps

## Design Tokens Available

From index.css + tailwind.config.js:
- `bg-navy-900` (#080E1C), `bg-navy-950` (#030810), `bg-navy-800` (#0C1528)
- `text-gold-400`, `bg-gold-500`, `border-gold-500/20`
- `btn-gold` — gold CTA button
- Framer Motion already installed

## Constraints

- DO NOT change any backend/API logic in Loading.jsx — only visual layer
- DO NOT change Questionnaire logic (canProceed, handleNext, handleBack, etc.) — only wrapping with motion
- DO NOT change App.jsx routing/state logic — only add bg class and optional AnimatePresence
- Keep `LiveDRE` functional — just restyle cards
- Keep `ItemizedInput` functional — just restyle row/add-item button
