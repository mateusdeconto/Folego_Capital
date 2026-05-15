---
plan: 03-01
status: complete
phase: 03-fluxo-questionario
subsystem: frontend/questionnaire
tags: [animation, framer-motion, redesign, navy, gold]
dependency_graph:
  requires: []
  provides: [questionnaire-slide-animation, questionnaire-navy-redesign, app-dark-wrapper]
  affects: [frontend/src/components/Questionnaire.jsx, frontend/src/App.jsx]
tech_stack:
  added: [framer-motion (AnimatePresence, motion.div)]
  patterns: [direction-aware slide transition, spring-animated progress bar, navy+gold dark card palette]
key_files:
  created: []
  modified:
    - frontend/src/components/Questionnaire.jsx
    - frontend/src/App.jsx
decisions:
  - Used dirRef (useRef) instead of state for direction to avoid re-render on direction change
  - btn-gold class used for primary CTA with w-full override since class is inline-flex by default
  - background #1e3050 applied via inline style (not Tailwind) to avoid purge issues with dynamic values
metrics:
  duration: ~15min
  completed: 2026-05-14
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 01: Questionnaire Slide Animation + Navy Redesign Summary

One-liner: Direction-aware AnimatePresence slide transitions and navy/gold dark redesign applied to Questionnaire.jsx, with #1e3050 dark wrapper in App.jsx for questionnaire and loading steps.

## What Was Done

- Added `framer-motion` import (`motion`, `AnimatePresence`) to Questionnaire.jsx
- Added `slideVariants` module-level constant with spring-based center state and direction-aware enter/exit
- Added `dirRef = useRef(1)` inside component for direction tracking without re-renders
- Updated `handleNext` and `handleBack` to set `dirRef.current` before index change
- Replaced static progress bar with `motion.div` animated via spring (stiffness 200, damping 30) using `bg-gold-500`
- Wrapped question card in `AnimatePresence mode="wait"` + `motion.div` keyed to `currentIndex`
- Replaced `className="card p-6 sm:p-7"` with `rounded-2xl border border-white/10` + `style={{ background: '#253d63' }}`
- Applied full navy/gold color palette across: h2, subtitle, progress chapter, top bar, helpers, inputs, choice options, ItemizedInput rows, and footer text
- Redesigned LiveDRE panel: card changed to `#253d63`, all `text-ink-*` replaced with `text-white/*` variants, live dot changed to `bg-gold-400`
- Removed `animate-slide-up` from outer wrapper (AnimatePresence handles entry animation)
- Updated App.jsx wrapper: QUESTIONNAIRE + LOADING steps get `background: '#1e3050'` via inline style; all other non-landing steps retain `bg-ink-50`

## Files Modified

- `frontend/src/components/Questionnaire.jsx`
- `frontend/src/App.jsx`

## Requirements Addressed

- FL-01: Slide horizontal animation (direction-aware: forward=slide left, backward=slide right)
- FL-02: Spring-animated progress bar with gold color
- FL-03 partial: App.jsx dark wrapper prep (#1e3050 for questionnaire + loading steps)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Added w-full to btn-gold button**
- Found during: Task 1
- Issue: btn-gold is defined as `inline-flex` (not `w-full`) so the primary CTA would not be full-width
- Fix: Added `w-full` class directly to the button element
- Files modified: frontend/src/components/Questionnaire.jsx

None others — plan executed as specified.

## Self-Check: PASSED

- frontend/src/components/Questionnaire.jsx: modified and contains AnimatePresence, slideVariants, motion.div, bg-gold-500
- frontend/src/App.jsx: modified and contains #1e3050 + STEPS.QUESTIONNAIRE/LOADING includes check
- Build: npm run build exited 0
