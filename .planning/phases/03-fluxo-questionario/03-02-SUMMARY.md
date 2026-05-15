---
plan: 03-02
phase: 03-fluxo-questionario
status: complete
subsystem: frontend/loading
tags: [visual, framer-motion, navy-gold, loading-states]
dependency_graph:
  requires: [03-01]
  provides: [FL-03]
  affects: [frontend/src/components/Loading.jsx]
tech_stack:
  added: []
  patterns: [AnimatePresence fade, motion.div animated indicators]
key_files:
  modified:
    - frontend/src/components/Loading.jsx
decisions:
  - "#253d63 card bg on #1e3050 App wrapper — no white flash"
  - "AnimatePresence mode=wait for clean message transitions"
  - "Dot indicators use motion.div animated width/color (replaces static CSS classes)"
metrics:
  duration: 10min
  completed_date: "2026-05-14"
requirements: [FL-03]
---

# Phase 3 Plan 2: Loading.jsx Navy+Gold Redesign Summary

## One-liner

Loading.jsx redesigned with #253d63 navy card, gold spinner (border-t-gold-400), AnimatePresence fade between messages, and animated dot indicators — eliminates white flash on questionnaire → loading transition (FL-03).

## What was done

- Added `framer-motion` import (`motion`, `AnimatePresence`) to Loading.jsx
- Replaced `.card` white bg with `motion.div` using `background: #253d63` on all three render paths (main loading, countdown, error)
- Replaced green spinner (`border-t-money-500`) with gold spinner (`border-t-gold-400`) and gold inner dot
- Added `AnimatePresence mode="wait"` wrapper around `motion.h2` so loading messages fade out/in with y-offset instead of snapping
- Replaced static CSS dot indicators with `motion.div` animated width (6px → 20px) and background color (#F59E0B active, rgba(255,255,255,0.15) inactive)
- Countdown state: amber icon with rgba border/bg, white text, white/15 border on countdown circle
- Error state: red icon with rgba border/bg, white text, overloaded/generic message switching preserved
- All fetch/retry/streaming logic, state hooks, refs, and useEffects left completely untouched
- `npm run build` passes exit 0

## Files modified

- `frontend/src/components/Loading.jsx`

## Requirements addressed

- FL-03 — Submit → loading does not cause white flash. App.jsx (from 03-01) uses `bg-[#1e3050]` wrapper; Loading uses `#253d63` card on same dark bg. No white background in any render path.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `frontend/src/components/Loading.jsx` — modified and committed
- Commit: feat(03-02) in COMMIT_EDITMSG confirmed
- Build: npm run build exit 0 confirmed
