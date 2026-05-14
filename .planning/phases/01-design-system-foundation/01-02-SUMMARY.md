---
phase: 01-design-system-foundation
plan: 02
subsystem: frontend/css
tags: [design-system, css, landing, components]
dependency_graph:
  requires: [01-01]
  provides: [.btn-gold, .btn-navy-outline, .card-navy, .badge-gold]
  affects: [frontend/src/index.css]
tech_stack:
  patterns: [tailwind @layer components, CSS custom properties for gold hex values]
key_files:
  modified:
    - frontend/src/index.css
decisions:
  - Used explicit hex values for gold tokens (#F59E0B, #FBBF24, #FEF3C7, #92400E) because Plan 01-01 gold tokens were pending merge at execution time
metrics:
  completed: 2026-05-14
  tasks: 1
  files: 1
requirements:
  - DS-03
  - DS-04
  - DS-05
---

# Phase 01 Plan 02: Landing Component CSS Classes Summary

4 landing-specific CSS component classes added to index.css — btn-gold (gold CTA), btn-navy-outline (secondary), card-navy (dark section container), badge-gold (label highlight).

## What Was Built

Single task: additive edit to `frontend/src/index.css` inserting a new `/* LANDING COMPONENTS */` block inside `@layer components`, placed between the BADGES section and the TABELA section.

### Classes Added

| Class | Background | Text | Key Feature |
|-------|-----------|------|-------------|
| `.btn-gold` | #F59E0B (gold-500) | #080E1C (navy-900) | shadow-gold, hover gold-400 |
| `.btn-navy-outline` | transparent | white | white/30 border, gold-400 hover |
| `.card-navy` | #080E1C (navy-900) | white | white/10 border, gold hover |
| `.badge-gold` | #FEF3C7 (gold-100) | #92400E (gold-800) | follows badge @apply pattern |

## Requirements Status

- DS-03 (.btn-gold): DONE
- DS-04 (.btn-navy-outline, .card-navy): DONE
- DS-05 (.badge-gold): DONE

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Gold tokens not yet in tailwind.config.js**
- **Found during:** Task 1
- **Issue:** Plan 01-01 (which adds gold-* and shadow-gold tokens to tailwind.config.js) was running in a parallel worktree and not yet merged. Using `@apply bg-gold-500` would fail at compile time.
- **Fix:** Used explicit hex values via CSS properties (`background-color: #F59E0B`) instead of `@apply bg-gold-500`. The `@apply` form can be adopted when tokens are merged. All visual values are identical.
- **Files modified:** frontend/src/index.css
- **Impact:** None — visual output is identical. When Plan 01-01 merges, classes can optionally be refactored to use `@apply` tokens, but are fully functional as-is.

## Known Stubs

None — classes are complete CSS with no placeholder values.

## Self-Check: PASSED

- `.btn-gold` present in index.css (line 198)
- `.btn-navy-outline` present in index.css (line 212)
- `.card-navy` present in index.css (line 225)
- `.badge-gold` present in index.css (line 236)
- `.btn-primary` still present (not deleted)
- `.badge-warn` still present (not deleted)
