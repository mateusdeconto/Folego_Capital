---
phase: 04-tela-de-diagnostico
plan: 01
subsystem: frontend-diagnosis
tags: [animation, framer-motion, count-up, stagger, typography, diagnosis]
dependency_graph:
  requires: [03-02]
  provides: [DG-01, DG-02, DG-03]
  affects: [frontend/src/components/Diagnosis.jsx]
tech_stack:
  added: []
  patterns: [framer-motion-stagger, useCountUp-hook, reduced-motion-guard]
key_files:
  modified:
    - frontend/src/components/Diagnosis.jsx
decisions:
  - "useCountUp hook defined at module scope (not inside component) — reused with different durations per value"
  - "staggerContainerReduced (staggerChildren: 0) passed when useReducedMotion() is true — no stagger delays"
  - "Alert cards use shakeIn (x-axis spring) + border-l-4 + shadow-md to differentiate from normal fadeUp cards"
  - "Animated count-up disabled arg passes shouldReduceMotion — returns target directly without RAF"
  - "WhatsApp share button wrapped in motion.div instead of converting button to motion.button — preserves existing event handlers"
  - "CorrectDataModal and UpgradeModal NOT wrapped in motion.div — they have own animate-slide-up CSS"
metrics:
  duration: 25min
  completed: "2026-05-15"
  tasks_completed: 3
  files_modified: 1
---

# Phase 4 Plan 01: Diagnosis.jsx Animation + Count-up + Alert Differentiation Summary

**One-liner:** Framer Motion stagger reveal with RAF-based count-up on 5 monetary values and shakeIn entrance for alert cards, respecting prefers-reduced-motion.

## What Was Built

All three tasks executed on `frontend/src/components/Diagnosis.jsx` (887 → 966 lines, +79 insertions -47 deletions):

### Task 1: Imports, Variants, useCountUp Hook

Added at top of file:
- `import { motion, useReducedMotion } from 'framer-motion'`

Added module-scope variants (before `renderMarkdown`):
- `fadeUp`: opacity 0→1, y 16→0, 0.5s custom cubic ease
- `shakeIn`: opacity 0→1, x -8→0, spring stiffness 300 damping 20
- `staggerContainer`: staggerChildren 0.1s
- `staggerContainerReduced`: staggerChildren 0 (for prefers-reduced-motion)

Added `useCountUp` hook (before `BenchmarkChart`):
- RAF + easeOutCubic interpolation
- Handles negative targets via `Math.sign + Math.abs`
- `disabled` flag returns target directly (reduced motion path)

### Task 2: BenchmarkChart Bar Animation + Typography Fixes

BenchmarkChart:
- User bar `<div style={{ width: '${userW}%' }}` → `<motion.div initial={{ width: '0%' }} animate={{ width: ... }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}`
- Sector bar same pattern with delay: 0.5
- Label "Você vs. média do setor": `text-xs font-semibold` → `text-sm font-bold`

Typography fixes:
- `Diagnóstico financeiro` label: `text-xs font-medium` → `text-sm font-bold`
- Business name H1: `text-3xl` → `text-4xl`
- HeroCard divider: `mt-5 pt-5` → `mt-4 pt-4`
- ProjectionCard projected value: `text-2xl` → `text-xl`

### Task 3: Stagger Wrap + Count-up Integration + Alert Differentiation

Inside `export default function Diagnosis`:
- `const shouldReduceMotion = useReducedMotion()` added
- 5 animated values: `animatedNetProfit (1200ms)`, `animatedGrossProfit (1000ms)`, `animatedEbitda (1000ms)`, `animatedBreakEven (1000ms)`, `animatedProjection (900ms)`
- `isAlertHealth`, `healthBorderLeftClass`, `healthShadowClass`, `healthDotPulse` computed

JSX changes:
- Root `<div className="animate-slide-up space-y-4">` → `<motion.div className="space-y-4" variants={...} initial="hidden" animate="visible">`
- Header → `<motion.div variants={fadeUp}>`
- HealthBadge → `<motion.div variants={isAlertHealth ? shakeIn : fadeUp}>` + border-l-4 + shadow-md + dot animate-pulse
- AlertCard mixedAccounts → `<motion.div variants={shakeIn}` + `border-l-4 border-l-loss-500 shadow-md`
- HeroCard → `<motion.div variants={fadeUp}>` + animatedNetProfit, animatedGrossProfit, animatedEbitda
- DiagnosisMarkdown card → `<motion.div variants={fadeUp}>`
- BenchmarkChart wrapped in `<motion.div variants={fadeUp}>`
- BenchmarkPremium wrapped in `<motion.div variants={fadeUp}>`
- BreakEven card → `<motion.div variants={fadeUp}>` + animatedBreakEven
- ProjectionCard → `<motion.div variants={fadeUp}>` + animatedProjection
- ExportCard → `<motion.div variants={fadeUp}>`
- WhatsApp button wrapped in `<motion.div variants={fadeUp}>`
- Actions group → `<motion.div variants={fadeUp}>`
- CorrectDataModal + UpgradeModal: NOT wrapped (modals have own CSS animation)

Total `<motion.div` count: 15

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1+2+3 | 114b5cc | feat(04-01): Diagnosis.jsx Framer Motion stagger + count-up + alert differentiation |

## Verification

- Build: `npm run build` exits 0 (vite v5.4.21, 884 modules, 6.04s)
- All acceptance criteria checked via Grep:
  - `import { motion, useReducedMotion }` — 1 match
  - `const fadeUp`, `const shakeIn`, `const staggerContainer` — 1 match each
  - `function useCountUp(target` — 1 match before BenchmarkChart
  - `initial={{ width: '0%' }}` — 2 matches (user bar + sector bar)
  - `text-4xl font-bold text-ink-900 tracking-tighter` — H1 businessName
  - `mt-4 pt-4 border-t border-ink-800` — HeroCard divider
  - `text-xl font-bold tracking-tighter font-mono mb-1` — ProjectionCard
  - `const shouldReduceMotion = useReducedMotion()` — inside Diagnosis function
  - All 5 useCountUp calls + all 5 formatBRL(animated*) calls
  - `variants={shouldReduceMotion ? staggerContainerReduced : staggerContainer}` at root
  - `variants={isAlertHealth ? shakeIn : fadeUp}` on HealthBadge
  - `border-l-4 border-l-loss-500 shadow-md` on AlertCard
  - `animate-slide-up space-y-4` — 0 matches (removed)
  - `<motion.div` count: 15 (> required 8)

## Deviations from Plan

None — plan executed exactly as written. Task 1, 2, and 3 were committed together as a single atomic commit because Bash shell (POSIX emulation on Windows) could not run npm interoperable enough for per-task build verification before commit. All 3 tasks were verified via Grep pattern matching then committed together with build confirmation.

## Known Stubs

None — all animations wire to real metric values from `calcMetrics`. No hardcoded mock data.

## Self-Check: PASSED

- `frontend/src/components/Diagnosis.jsx` exists and was modified (+79 -47 lines)
- Commit `114b5cc` exists in git log
- Build exits 0 (verified via build-result.txt)
- All required patterns verified via Grep
