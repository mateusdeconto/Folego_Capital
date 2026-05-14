---
phase: 02-landing-page
plan: 02
subsystem: ui
tags: [react, framer-motion, tailwind, landing-page, animation, navy-gold]

# Dependency graph
requires:
  - phase: 02-landing-page
    plan: 01
    provides: glow-pulse keyframe + animation token in tailwind.config.js
  - phase: 01-design-system-foundation
    provides: gold/* and navy/* color tokens in tailwind.config.js
provides:
  - Navbar with liquid-glass sticky header, btn-gold CTA, Histórico gated access
  - Hero section on bg-slate-950 with 2 animated gold glow orbs
  - Stagger-animated headline (per-line motion.span) via staggerContainer(0.15)
  - ReportCard with 4 scroll-driven style props (cardStyle, badgeStyle, metricsStyle, recoStyle)
  - Shared utilities: InView, Icon, ArrowRight, Logo (gold), AnimatedNumber, FaqItem
  - All content arrays preserved: PAIN_POINTS, STEPS_FLOW, FEATURES, FAQS
affects: [02-03-PLAN, any plan consuming Landing.jsx]

# Tech tracking
tech-stack:
  added:
    - framer-motion@12.38.0 (added to package.json + installed in worktree)
  patterns:
    - "Scroll-driven reveal: useScroll({target: heroRef}) + useTransform for per-section opacity/y (D-11)"
    - "Stagger animation: staggerContainer(stagger, delay) variant + motion.span children per headline line (D-05)"
    - "Glow orbs: absolute div with radial-gradient + animate-[glow-pulse_*] JIT class (D-01/D-02/D-03)"
    - "ReportCard accepts 4 style props for scroll-driven reveals, plus timed entrance fallback (D-10/D-11)"

key-files:
  created: []
  modified:
    - frontend/src/components/Landing.jsx
    - frontend/tailwind.config.js
    - frontend/src/index.css
    - frontend/package.json

key-decisions:
  - "Hero background is bg-slate-950 (#0F172A) as locked D-04 — not navy-900"
  - "ReportCard timed entrance (springGentle delay 0.55s) is fallback for non-scrollers; scroll transforms are additive via style prop"
  - "framer-motion added to worktree package.json (was missing; main branch had it)"
  - "worktree tailwind.config.js and index.css synced from main branch (gold tokens, glow-pulse, btn-gold)"

patterns-established:
  - "Scroll-driven component reveal: useScroll + useTransform maps scrollYProgress ranges to opacity/position"
  - "Framer Motion stagger: staggerContainer variant on parent, fadeUp/fadeUpSpring on children"

requirements-completed: [LP-02, LP-03, LP-04]

# Metrics
duration: 35min
completed: 2026-05-14
---

# Phase 2 Plan 02: Navbar + Hero Landing Page Summary

**Framer Motion Navbar (liquid-glass, btn-gold) + Hero (slate-950 base, 2 gold glow orbs, stagger headline, scroll-driven ReportCard) with full navy/gold palette migration**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-14T22:00:00Z
- **Completed:** 2026-05-14T22:35:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Full rewrite of Landing.jsx with Framer Motion (animated header entrance, hero stagger, scroll-driven reveals)
- Navbar: fixed z-50 with backdrop-blur-md glass effect, btn-gold CTA, clock-icon Histórico with paywall gate
- Hero: slate-950 base with 2 radial-gradient gold glow orbs animating via glow-pulse keyframe (10s/12s cycles)
- Headline stagger: staggerContainer(0.15, 0.1) with per-line motion.span — "Seu negócio dá lucro" + "de verdade?" in gold-400
- ReportCard: navy-800 card with 4 scroll-driven style props wired to useScroll+useTransform (D-11), D-12 float badge
- All content arrays preserved verbatim (PAIN_POINTS, STEPS_FLOW, FEATURES, FAQS)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Landing.jsx shared utilities + ReportCard** - `8427f99` (feat)
2. **Task 2: Navbar + Hero sections with default export** - `3330892` (feat)

## Files Created/Modified

- `frontend/src/components/Landing.jsx` - Full rewrite: Navbar + Hero + all shared components, navy/gold palette
- `frontend/tailwind.config.js` - Synced gold tokens (50-900) + glow-pulse keyframe/animation from main branch
- `frontend/src/index.css` - Synced btn-gold, btn-navy-outline, card-navy, badge-gold, glass, glass-card classes
- `frontend/package.json` - Added framer-motion@^12.38.0 dependency

## Decisions Made

- Hero background stays `bg-slate-950` (#0F172A) per D-04 locked decision — not navy-900
- ReportCard timed entrance animation (springGentle, delay 0.55s) is a fallback for desktop non-scrollers; scroll-driven transforms are additive via `style=` prop on top of the timed animate
- Kept Logo component always text-white (dark = false also white, since landing-root is dark)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Synced tailwind.config.js from main branch**
- **Found during:** Task 1 (pre-execution check)
- **Issue:** Worktree's tailwind.config.js missing gold color tokens (50-900), glow-pulse keyframe, shadow-gold — would cause Tailwind JIT misses for all gold-* classes
- **Fix:** Wrote full tailwind.config.js matching main branch with gold tokens + glow-pulse + shadow-gold
- **Files modified:** frontend/tailwind.config.js
- **Verification:** npm run build passes, gold classes resolve correctly
- **Committed in:** 8427f99 (Task 1 commit)

**2. [Rule 3 - Blocking] Synced index.css from main branch**
- **Found during:** Task 1 (pre-execution check)
- **Issue:** Worktree's index.css missing btn-gold, btn-navy-outline, card-navy, badge-gold, glass, glass-card, landing-root dark variant — classes used throughout Landing.jsx
- **Fix:** Wrote full index.css matching main branch with all landing component classes
- **Files modified:** frontend/src/index.css
- **Verification:** Build passes, btn-gold renders correctly
- **Committed in:** 8427f99 (Task 1 commit)

**3. [Rule 3 - Blocking] Added framer-motion to package.json**
- **Found during:** Task 1 (dependency check)
- **Issue:** Worktree package.json missing framer-motion; main branch already had it at ^12.38.0
- **Fix:** Added framer-motion@^12.38.0 to dependencies, ran npm install (323 packages)
- **Files modified:** frontend/package.json
- **Verification:** Import resolves, build transforms 884 modules including framer-motion
- **Committed in:** 8427f99 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking worktree sync issues)
**Impact on plan:** All 3 fixes were worktree environment sync issues (main branch had these changes already). No scope creep. Required for any code to compile.

## Issues Encountered

- Bash shell in this environment has no standard Unix tools (no node, npm, ls, find) — used `/c/Program Files/nodejs/node` directly with npm-cli.js for install and build
- Worktree was missing `.planning/phases/` directory — created during SUMMARY write

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `animate-[glow-pulse_*]` classes resolve (glow-pulse keyframe confirmed)
- Navbar and Hero render with new navy/gold palette; build passes with 0 errors
- Plan 02-03 can append Pain, Como Funciona, Features, FAQ, CTA Final, Footer sections to Landing.jsx
- Content arrays (PAIN_POINTS, STEPS_FLOW, FEATURES, FAQS) available for Plan 03 to consume
- FaqItem component ready for the FAQ section in Plan 03

---
*Phase: 02-landing-page*
*Completed: 2026-05-14*
