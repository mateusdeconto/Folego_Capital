# Phase 2: Landing Page - Research

**Researched:** 2026-05-14
**Domain:** React / Framer Motion / Tailwind CSS — Landing Page Redesign
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hero Background**
- D-01: Technique: 2 absolute divs with `radial-gradient` gold, animated by CSS keyframes (scale + opacity). Pure CSS, no extra SVG.
- D-02: 2 light foci — one large centered-top (main), one smaller at the opposite lower corner. Subtle asymmetry.
- D-03: Slow, subtle speed — 8–12s cycle, opacity between 0.08–0.15. Cinematic, barely perceptible movement.
- D-04: Base background: slate-950 (`#0F172A`). Keyframes defined in `tailwind.config.js > keyframes` (project standard).

**Headline Animation**
- D-05: Stagger by line — each headline line rises with fade (staggerChildren 0.15s). Clean, works on any screen size.
- D-06: Element entry order: Badge → Headline (by line) → Subtext → CTA buttons. ~0.15s delay between each.
- D-07: Existing variants (`fadeUp`, `staggerContainer`) in `Landing.jsx` MUST be reused — do not recreate.

**Implementation Approach**
- D-08: Full rewrite of `Landing.jsx` — new file from scratch with navy/gold palette. Content (section texts, SVG icon paths, `PAIN_POINTS`, `STEPS_FLOW`, `FEATURES` arrays) must be preserved from current file.
- D-09: Section structure maintained: Navbar → Hero → Pain → Como Funciona → Features → FAQ → Footer.

**ReportCard (Mock Diagnostic in Hero)**
- D-10: Keep ReportCard as visual element in hero — update colors from `money/ink` to `gold/navy`.
- D-11: ReportCard reveals progressively as user scrolls the hero. Trigger: `useScroll` + `useTransform` from Framer Motion. Each card section (header, health badge, metrics, recommendation) enters in stagger as scroll progresses.
- D-12: Small floating card (badge "Você está acima da média") kept with float animation (y oscillation).

### Claude's Discretion
- Exact `scrollYProgress` threshold values for each ReportCard element — Claude defines based on natural UX.
- Responsive layout for sections (breakpoints, grid columns on mobile) — Claude decides following project Tailwind patterns.
- Exact copy for the hero badge (e.g., "Diagnóstico gratuito" or "Resultado em 3 min") — Claude chooses consistent with project tone.
- Spacing between sections — Claude follows coherent visual standard.

### Deferred Ideas (OUT OF SCOPE)
- Parallax with mouse tracking on hero — v2 per REQUIREMENTS.md
- GSAP animations for greater control — v2
- Dark mode — out of scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LP-01 | Hero displays animated "luz cortando névoa" background (CSS keyframes, slate + gold rays) | D-01 to D-04 locked; `glow-pulse` keyframe to add in tailwind.config.js |
| LP-02 | Headline "Seu negócio dá lucro de verdade?" appears with staggered animation on load | D-05/D-06 locked; `staggerContainer` + `fadeUp` variants already in Landing.jsx |
| LP-03 | Primary CTA responds to hover/click with satisfying visual feedback | `btn-gold` class already in index.css; add `whileHover` + `whileTap` Framer Motion props |
| LP-04 | Fixed navbar with liquid-glass, Fôlego Capital logo, links and CTA | Pattern: `backdrop-blur-md bg-navy-950/80 border-b border-white/10 sticky top-0 z-50` |
| LP-05 | Pain points section shows user pains empathetically (not alarmingly) | `PAIN_POINTS` array preserved; update hover to gold tones |
| LP-06 | "Como funciona" section (3 steps) with scroll-triggered entry animation | `STEPS_FLOW` preserved; `staggerContainer` + `whileInView` + `viewport={{ once: true }}` |
| LP-07 | Features section (6 cards) with clean layout and consistent iconography | `FEATURES` array preserved; update `accent` classes from `money-*` to `gold-*` |
| LP-08 | FAQ with animated accordion | `FaqItem` + `AnimatePresence` pattern already in Landing.jsx — reuse with navy/gold colors |
| LP-09 | Footer with links and info | Simple footer; update from current to navy-950 bg with gold accents |
</phase_requirements>

---

## Summary

Phase 2 is a full visual rewrite of `Landing.jsx` — same structure and content, completely new palette (navy-950 base, gold accents) and enhanced animations. The project already has everything needed: Framer Motion 12.38.0 installed, gold/navy tokens in tailwind.config.js, CSS utility classes in index.css (`.btn-gold`, `.card-navy`, `.badge-gold`), and battle-tested animation variants (`fadeUp`, `staggerContainer`, `InView`) in the current Landing.jsx.

The only new technical element is the scroll-driven ReportCard reveal (D-11), which uses `useScroll({ target: heroRef })` + `useTransform` to map `scrollYProgress` to opacity/y for each card section. This API is stable in Framer Motion 12 and well-documented. The hero background animation (D-01 to D-04) requires adding a `glow-pulse` keyframe to tailwind.config.js — the only config file change needed.

**Primary recommendation:** Rewrite Landing.jsx in a single plan, in section order (Navbar → Hero → Pain → Como Funciona → Features → FAQ → Footer), reusing all existing content arrays and animation variants. Add `glow-pulse` keyframe to tailwind.config.js as Wave 0.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.38.0 (installed) | All animations — variants, scroll, spring, AnimatePresence | Already installed; team already using all APIs needed |
| tailwindcss | 3.4.14 (installed) | Utility classes + design tokens | Project standard; gold/navy tokens already defined |
| react | 18.3.1 (installed) | Component framework | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | All dependencies already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS keyframes for bg animation | GSAP ScrollTrigger | GSAP = v2 (deferred). CSS keyframes simpler, no extra dep |
| Framer `useScroll` + `useTransform` | Intersection Observer manual | FM API cleaner, already imported, consistent with rest of file |

**Installation:** No new packages needed.

**Version verification:** framer-motion 12.38.0 confirmed from `node_modules/framer-motion/package.json`.

---

## Architecture Patterns

### Recommended File Structure

```
frontend/src/components/
└── Landing.jsx          ← full rewrite (single file, all sub-components inline)

frontend/tailwind.config.js  ← add glow-pulse keyframe only
frontend/src/index.css       ← add .hero-glow-orb if needed (optional)
```

No new files. No new directories. One component file rewritten.

### Pattern 1: Hero Background — CSS Keyframe Glow Orbs

**What:** Two absolutely-positioned divs with `radial-gradient` gold, animated by a `glow-pulse` CSS keyframe defined in tailwind.config.js.

**When to use:** Base layer, always visible, no JS required.

```jsx
// tailwind.config.js addition (keyframes section):
'glow-pulse': {
  '0%, 100%': { opacity: '0.10', transform: 'scale(1)' },
  '50%':      { opacity: '0.15', transform: 'scale(1.08)' },
}
// animation:
'glow-pulse': 'glow-pulse 10s ease-in-out infinite',

// In Landing.jsx Hero section:
<section ref={heroRef} className="relative overflow-hidden bg-navy-950 ...">
  {/* Orb 1 — centered top, large */}
  <div
    className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2
               w-[700px] h-[700px] rounded-full animate-[glow-pulse_10s_ease-in-out_infinite]"
    style={{
      background: 'radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 70%)',
    }}
  />
  {/* Orb 2 — lower right, smaller, offset phase */}
  <div
    className="pointer-events-none absolute bottom-0 right-0
               w-[400px] h-[400px] rounded-full animate-[glow-pulse_12s_ease-in-out_2s_infinite]"
    style={{
      background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)',
    }}
  />
  {/* content */}
</section>
```

**Confidence:** HIGH — pure CSS technique, no runtime dependency.

### Pattern 2: Hero Headline Stagger (D-05/D-06)

**What:** Reuse existing `staggerContainer` + `fadeUp` variants. Each line of the headline is a separate `motion.span` child of a `motion.h1` container.

```jsx
// Reuse exact variants already in Landing.jsx — do NOT redefine
const headlineContainer = staggerContainer(0.15, 0.1)

<motion.div initial="hidden" animate="visible" variants={staggerContainer(0.15, 0.1)}>
  <motion.div variants={fadeUp}> {/* Badge */} </motion.div>
  <motion.h1>
    <motion.span variants={fadeUp} className="block">Seu negócio</motion.span>
    <motion.span variants={fadeUp} className="block">
      <span className="text-gold-500">dá lucro</span>
    </motion.span>
    <motion.span variants={fadeUp} className="block">de verdade?</motion.span>
  </motion.h1>
  <motion.p variants={fadeUp}> {/* subtitle */} </motion.p>
  <motion.div variants={fadeUp}> {/* CTAs */} </motion.div>
</motion.div>
```

### Pattern 3: ReportCard Scroll-Driven Reveal (D-11)

**What:** `useScroll({ target: heroRef })` tracks hero section scroll progress. `useTransform` maps `scrollYProgress` ranges to opacity/y for each card sub-section.

**Key insight:** `scrollYProgress` goes 0→1 as the target element scrolls through the viewport. With `offset: ["start start", "end start"]`, progress goes 0 when hero top hits viewport top, and 1 when hero bottom hits viewport top (user has scrolled past the hero).

**Recommended thresholds (Claude's Discretion):**
- Card container visible: `[0, 0.15]` → opacity `[0, 1]`, y `[20, 0]`
- Header: `[0.05, 0.20]` → opacity `[0, 1]`
- Health badge: `[0.15, 0.30]` → opacity `[0, 1]`, x `[-8, 0]`
- Metrics grid: `[0.25, 0.40]` → opacity `[0, 1]`
- Recommendation: `[0.35, 0.50]` → opacity `[0, 1]`

```jsx
// Source: https://motion.dev/docs/react-use-scroll
const heroRef = useRef(null)
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ['start start', 'end start'],
})

const cardOpacity    = useTransform(scrollYProgress, [0,    0.15], [0, 1])
const cardY          = useTransform(scrollYProgress, [0,    0.15], [20, 0])
const badgeOpacity   = useTransform(scrollYProgress, [0.15, 0.30], [0, 1])
const badgeX         = useTransform(scrollYProgress, [0.15, 0.30], [-8, 0])
const metricsOpacity = useTransform(scrollYProgress, [0.25, 0.40], [0, 1])
const recoOpacity    = useTransform(scrollYProgress, [0.35, 0.50], [0, 1])

// Apply via style prop on motion.div wrappers inside ReportCard
```

**Fallback for users who don't scroll:** On desktop, set initial opacity of card to 1 after 1s if scrollYProgress hasn't moved past 0.05. Simplest: keep D-11 progressive but also set card container to fade in with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` as fallback base (Framer Motion merges style + animate correctly).

### Pattern 4: Navbar Liquid-Glass

**What:** Fixed/sticky navbar using backdrop-blur + semi-transparent navy background.

```jsx
<motion.header
  className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10"
  style={{ backgroundColor: 'rgba(3,8,16,0.80)' }} // navy-950 at 80%
  initial={{ opacity: 0, y: -12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
>
```

**Note:** `bg-navy-950/80` Tailwind class works if tailwind.config.js defines `navy.950`. Currently defined as `#030810`. Use directly.

### Pattern 5: Scroll-Triggered Section Entry (LP-05, LP-06, LP-07)

**What:** Reuse existing `InView` component + `whileInView` with `viewport={{ once: true, margin: '-60px' }}`.

```jsx
// Reuse InView wrapper (already in Landing.jsx) for section headers
// Use whileInView directly on motion.div for grid items
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
  variants={staggerContainer(0.08)}
>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeUpSpring}>
      ...
    </motion.div>
  ))}
</motion.div>
```

### Pattern 6: FAQ Accordion

**What:** Reuse existing `FaqItem` + `AnimatePresence` with height animation. Update colors from `money-*` to `gold-*`.

```jsx
// Color migration: money-300 → gold-400, money-100 → gold-100, money-700 → gold-700
// border highlight: border-money-300 → border-gold-400
// chevron bg: bg-money-100 text-money-700 → bg-gold-100 text-gold-700
```

### Anti-Patterns to Avoid

- **Redefining variants:** D-07 is locked — never redeclare `fadeUp`, `staggerContainer`, `InView` in the new file. Import or reuse exact same implementations.
- **Keyframes inline in JSX:** D-04 locked — all keyframes go in `tailwind.config.js > keyframes`, not in `style={{ animation: '...' }}` inline strings (hard to maintain).
- **Opacity flash on load:** Never use `display: none` + CSS animation start. Framer Motion `initial` prop handles initial state correctly — always use it.
- **useScroll without target ref:** Calling `useScroll()` with no options tracks the window scroll, not the hero section. Must pass `target: heroRef` for D-11 to work correctly.
- **Stacking context issues with glow orbs:** Glow orbs must have `pointer-events-none` and `z-index` lower than content. Use `z-0` for orbs, `relative z-10` on content container.
- **money-* classes in new Landing:** After rewrite, `money-*` should not appear in Landing.jsx. All accent colors become `gold-*`. The `money-*` palette remains in the app flow (untouched by this phase).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated accordion height | CSS `max-height` hack | Framer Motion `AnimatePresence` + `height: 'auto'` | `max-height` flickers; FM handles dynamic height cleanly |
| Scroll progress tracking | `window.addEventListener('scroll', ...)` | `useScroll({ target: ref })` | FM uses ScrollTimeline API where available (hardware-accelerated), auto-cleans listeners |
| Spring counter animation | `setInterval` counting | `useSpring` + `useTransform` | Already in `AnimatedNumber` component — reuse |
| Float animation | CSS `@keyframes` for floating badge | Framer Motion `animate={{ y: [0, -6, 0] }}` with `repeat: Infinity` | D-12 already defined this way in current code — keep it |
| stagger on viewport entry | manual IntersectionObserver | `whileInView` + `staggerChildren` | FM handles intersection, cleanup, reduced-motion automatically |

**Key insight:** Everything needed for this phase is already in the codebase. The job is color migration + animation enhancement, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: ReportCard Not Visible Without Scrolling on Desktop

**What goes wrong:** D-11 makes the card scroll-driven. A user who lands on the page and doesn't scroll sees nothing in the hero right panel.

**Why it happens:** `scrollYProgress` starts at 0, so all `useTransform` opacities start at 0.

**How to avoid:** Keep the `animate` prop on the outer `ReportCard` container as a time-based fallback: `animate={{ opacity: 1 }}` after a delay triggers if scrollYProgress never moves. Alternatively: set card opacity threshold to start at `[0, 0]` initially and only scroll-animate the *inner* sub-sections (header, badge, metrics, reco), while the card container itself does a timed entrance animation.

**Recommended approach:** Card container = timed entrance (existing `springGentle` at 0.55s delay, as in current code). Card sub-sections = scroll-driven (D-11). This gives both behaviors cleanly.

**Warning signs:** ReportCard invisible in Lighthouse screenshot capture (no scroll simulation).

### Pitfall 2: backdrop-blur Performance on Safari

**What goes wrong:** `backdrop-filter: blur()` causes jank on older Safari, especially on scroll.

**Why it happens:** Safari has historically had issues with backdrop-filter repaints.

**How to avoid:** Apply `will-change: transform` on the header. Already covered by `sticky` behavior. The existing `glass` class in index.css uses `-webkit-backdrop-filter` alongside `backdrop-filter` — use this pattern in the navbar.

**Warning signs:** Visible lag on navbar on iOS devices.

### Pitfall 3: `money-*` Color References Left in New Landing

**What goes wrong:** New Landing.jsx accidentally keeps `money-500`, `money-50`, etc. from old file, creating visual inconsistency.

**Why it happens:** D-08 requires preserving content arrays — easy to also accidentally keep the accent classes.

**How to avoid:** After rewrite, run a simple search for `money-` in the new Landing.jsx. Legitimate uses: none. All accents should be `gold-*`.

**Exception:** `FEATURES` array has `accent: 'bg-money-50 text-money-600'` strings — these must be updated during content preservation.

**Warning signs:** Green accent cards visible instead of gold during review.

### Pitfall 4: Tailwind `bg-navy-950/80` Not Working

**What goes wrong:** `bg-navy-950/80` (opacity modifier) fails silently and shows solid color.

**Why it happens:** Tailwind opacity modifiers on custom colors require the color to be defined as an RGB value or use CSS variables — not a hex string by default in Tailwind v3 JIT.

**How to avoid:** Use `style={{ backgroundColor: 'rgba(3,8,16,0.80)' }}` directly, or define the color using RGB channel notation in tailwind.config.js. The safest approach for navy-950/80 is inline style as shown in Pattern 4 above.

**Verification:** Test in browser and check computed style. If `rgba()` shows in devtools, it works.

### Pitfall 5: Animation Performance — `transform` vs `top/left`

**What goes wrong:** Animating `top`, `left`, `width`, or `height` triggers layout reflow — causes dropped frames on the glow orbs.

**Why it happens:** These properties are not GPU-composited.

**How to avoid:** Only animate `transform` (translate, scale) and `opacity` on the glow orbs. The `glow-pulse` keyframe must only use `transform: scale()` + `opacity`, never `width` or positioning properties.

---

## Code Examples

Verified patterns from official sources and current codebase:

### useScroll with target ref

```jsx
// Source: https://motion.dev/docs/react-use-scroll
import { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'

function HeroSection() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.15], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.15], [20, 0])

  return (
    <section ref={heroRef}>
      <motion.div style={{ opacity, y }}>...</motion.div>
    </section>
  )
}
```

### tailwind.config.js keyframe addition

```js
// Add to existing keyframes object:
keyframes: {
  // ... existing keyframes ...
  'glow-pulse': {
    '0%, 100%': { opacity: '0.10', transform: 'scale(1)' },
    '50%':      { opacity: '0.15', transform: 'scale(1.08)' },
  },
},
animation: {
  // ... existing animations ...
  'glow-pulse': 'glow-pulse 10s ease-in-out infinite',
},
```

### AnimatePresence accordion (reuse from current code)

```jsx
// Source: current Landing.jsx FaqItem component — exact same pattern
<AnimatePresence initial={false}>
  {open && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

### Gold accent color replacements

```
money-50  → gold-50  (#FFFBEB)
money-100 → gold-100 (#FEF3C7)
money-200 → gold-200 (#FDE68A)
money-400 → gold-400 (#FBBF24)
money-500 → gold-500 (#F59E0B)
money-600 → gold-600 (#D97706)
money-700 → gold-700 (#B45309)
money-800 → gold-800 (#92400E)
ink-*     → white/* or navy-* depending on context (dark background)
forest-600 → gold-500 (for CTAs)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | Renamed to `motion` (package: `motion`) | 2025 | **No impact** — `framer-motion` still works and is installed. Do NOT change imports. |
| `useAnimation` hook | `animate` prop + variants | FM v10+ | Don't use `useAnimation` for entrance animations — variants + `whileInView` are simpler and more performant |
| `window.scrollY` tracking | `useScroll` with ScrollTimeline | FM v12 | Hardware-accelerated where browser supports it; automatic fallback |

**Deprecated/outdated:**
- `motion.custom()`: removed — use `motion.create()` if needed (not needed for this phase)
- `AnimateSharedLayout`: removed — use `layout` prop (not needed for this phase)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| framer-motion | All animations | ✓ | 12.38.0 | — |
| tailwindcss | Styling + tokens | ✓ | 3.4.14 | — |
| react | Component runtime | ✓ | 18.3.1 | — |
| vite | Dev server + build | ✓ | 5.4.10 | — |
| backdrop-filter CSS | Navbar glass | ✓ (modern browsers) | — | Fallback: solid navy-950 bg |

No missing dependencies. No blocking items.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — visual/UI phase |
| Config file | none |
| Quick run command | `cd frontend && npm run dev` (manual visual check) |
| Full suite command | `cd frontend && npm run build` (compilation check) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LP-01 | Hero glow orbs animate without flash | manual-visual | `npm run dev` → check hero | ❌ Wave 0 |
| LP-02 | Headline stagger on load | manual-visual | `npm run dev` → hard refresh | ❌ Wave 0 |
| LP-03 | CTA hover/click feedback | manual-visual | `npm run dev` → interact | ❌ Wave 0 |
| LP-04 | Navbar fixed, liquid-glass | manual-visual | `npm run dev` → scroll | ❌ Wave 0 |
| LP-05 | Pain section scroll entry | manual-visual | `npm run dev` → scroll | ❌ Wave 0 |
| LP-06 | Como Funciona scroll entry | manual-visual | `npm run dev` → scroll | ❌ Wave 0 |
| LP-07 | Features grid cards | manual-visual | `npm run dev` → scroll | ❌ Wave 0 |
| LP-08 | FAQ accordion open/close | manual-visual | `npm run dev` → click FAQ | ❌ Wave 0 |
| LP-09 | Footer renders | manual-visual | `npm run dev` → scroll to bottom | ❌ Wave 0 |
| ALL | No build errors | automated | `npm run build` | ✅ |

**Note:** This is a UI-only phase. All requirements are visual behaviors that require manual browser verification. The automated gate is `npm run build` succeeding without TypeScript/ESLint errors.

### Sampling Rate
- **Per task commit:** `npm run build` (confirm no compile errors)
- **Per wave merge:** `npm run dev` + manual visual checklist
- **Phase gate:** All 9 LP requirements verified visually in browser before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add `glow-pulse` keyframe to `tailwind.config.js` — enables LP-01 animation class
- [ ] Confirm `backdrop-filter` works in target browser (Chrome/Safari test) — LP-04

---

## Sources

### Primary (HIGH confidence)
- Framer Motion 12.38.0 installed source (`node_modules/framer-motion/package.json`) — version confirmed
- `frontend/src/components/Landing.jsx` — all reusable variants, components, and content arrays
- `frontend/tailwind.config.js` — all tokens, keyframes, shadows confirmed
- `frontend/src/index.css` — all utility classes confirmed (`.btn-gold`, `.card-navy`, `.badge-gold`, `.glass`)
- `.planning/phases/02-landing-page/02-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- [motion.dev — useScroll docs](https://motion.dev/docs/react-use-scroll) — `target`, `offset`, `scrollYProgress` API confirmed
- [motion.dev — scroll animations](https://motion.dev/docs/react-scroll-animations) — `useTransform` + `scrollYProgress` patterns confirmed

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed and verified from node_modules
- Architecture patterns: HIGH — `useScroll`/`useTransform` API verified from official docs; CSS keyframe technique is pure CSS standard
- Pitfalls: HIGH — `money-*` color migration risk evident from direct code review; Tailwind opacity modifier limitation is documented behavior; scroll-driven card visibility fallback is a real UX edge case

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (Framer Motion API stable; tailwind v3 stable)
