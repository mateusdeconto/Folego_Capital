# Phase 1: Design System & Foundation - Research

**Researched:** 2026-05-14
**Domain:** Tailwind v3 color tokens, Google Fonts loading, CSS @layer components
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Phase 1 covers ONLY new tokens + landing components. App internals (Questionnaire, Diagnosis, Auth) stay untouched.
- D-02: No existing class (.btn-primary, .card, .badge-*, .btn-cta) is altered — additions only.
- D-03: New token `gold` with full scale (50–900) added to tailwind.config.js, mirroring project pattern.
- D-04: gold-500 = #F59E0B (Tailwind amber-500). Scale derived from this base.
- D-05: Navy tokens already exist (800/900/950) — keep and complement if needed, no renames.
- D-06: Inter loaded via Google Fonts in index.html — preconnect + stylesheet link, weights 400/500/600/700.
- D-07: Fraunces (serif) kept in font stack — useful for display headlines in later phases.
- D-08: Global antialiasing already configured in index.css — do not alter.
- D-09: Create 4 new classes inside @layer components in index.css: .btn-gold, .btn-navy-outline, .card-navy, .badge-gold.
- D-10: No new React components in this phase — CSS utility classes only.

### Claude's Discretion
- Exact values for gold scale (50, 100, 200, 300, 400, 600, 700, 800, 900) — derive from gold-500 = #F59E0B following project scale pattern.
- Shadow for .btn-gold — define value consistent with existing shadow-money pattern.
- Exact Google Fonts link — include 4 weights (400/500/600/700) with display=swap.

### Deferred Ideas (OUT OF SCOPE)
- Changing internal components (.btn-primary green → gold) — Phase 3/4
- Dark mode — out of scope per PROJECT.md
- Parallax/GSAP — v2 per REQUIREMENTS.md
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-01 | Design system defines navy+gold color tokens (CSS custom properties + Tailwind config) | Gold scale derivation + Tailwind extend.colors pattern already in use |
| DS-02 | Inter typography loaded via Google Fonts, applied globally with antialiasing | Google Fonts already partially loaded — Inter already in current link tag |
| DS-03 | Buttons have visually distinct hover/active/disabled states with new visual | .btn-gold and .btn-navy-outline patterns with existing transition-all/active:scale pattern |
| DS-04 | Cards use new palette (subtle border, consistent shadow, no excessive glass) | .card-navy with navy-800/900 bg, white/10 border, shadow-gold |
| DS-05 | Badges and pills follow new semantic color system | .badge-gold following existing .badge base class pattern |
</phase_requirements>

---

## Summary

Phase 1 is a pure token + CSS class addition. No React components, no existing class modifications. The project already has Inter in the Google Fonts link (weights 400–800), Fraunces and JetBrains Mono loaded, preconnect tags in place. The only font change needed is verifying Inter includes weights 400/500/600/700 (currently 400–800 — already covered, no change needed).

The gold color scale must be derived from #F59E0B as gold-500. The existing project follows Tailwind's own amber scale structure as its basis — the amber scale is the canonical derivation since gold-500 IS amber-500. All 9 values (50 through 900) are directly mappable from Tailwind's amber palette. The 4 new CSS classes follow the same @apply pattern used throughout index.css. Shadow-gold follows the shadow-money pattern: `0 4px 20px rgba(245,158,11,0.28)`.

The integration points are surgical: one block in tailwind.config.js (colors), one shadow entry (boxShadow), four classes at the end of @layer components in index.css. The index.html requires no changes — Inter is already loaded with sufficient weights.

**Primary recommendation:** Copy Tailwind amber scale exactly for gold, add shadow-gold mirroring shadow-money, add 4 classes after the BADGES section in index.css.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v3 (project) | Token system, utility classes | Already in use |
| PostCSS | project | Processes @apply in @layer | Already configured |

### No new dependencies required for Phase 1.

**Installation:** None needed.

---

## Architecture Patterns

### Recommended File Changes

```
frontend/
├── tailwind.config.js    # Add gold scale + shadow-gold
└── src/
    └── index.css         # Add 4 classes after /* BADGES */ section
```

`frontend/index.html` — NO CHANGES NEEDED. Inter already loaded with weights 400;500;600;700;800 at line 28.

### Pattern 1: Gold Color Scale in tailwind.config.js

Tailwind amber-500 = #F59E0B. Gold scale maps 1:1 to Tailwind amber.

```javascript
// In theme.extend.colors, after `forest:` block:
gold: {
  50:  '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',  // anchor — amber-500
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
},
```

Confidence: HIGH — these are Tailwind's published amber values, gold-500 = amber-500 = #F59E0B exactly.

### Pattern 2: Shadow-gold in tailwind.config.js

Follows shadow-money pattern: `0 4px 20px rgba(R,G,B,0.28)`.

#F59E0B = rgb(245, 158, 11)

```javascript
// In theme.extend.boxShadow, after `money-lg`:
'gold':    '0 4px 20px rgba(245,158,11,0.28)',
'gold-lg': '0 8px 32px rgba(245,158,11,0.36)',
```

Confidence: HIGH — derived directly from shadow-money pattern in existing config.

### Pattern 3: Four CSS Classes in @layer components

Add AFTER the `/* ---------- BADGES ---------- */` section (after line 201 in current index.css).

```css
/* ---------- LANDING COMPONENTS (Phase 1) ---------- */

/* CTA dourado — botão principal da landing */
.btn-gold {
  @apply inline-flex items-center justify-center gap-2.5 py-3.5 px-7 font-bold
         rounded-xl text-navy-900 text-[15px] tracking-tight
         bg-gold-500 hover:bg-gold-400
         active:scale-[0.98] transition-all duration-150
         shadow-gold;
}

/* Contorno navy/gold — botão secundário da landing */
.btn-navy-outline {
  @apply inline-flex items-center justify-center gap-2.5 py-3.5 px-7 font-semibold
         rounded-xl text-white text-[15px] tracking-tight
         bg-transparent border border-white/30
         hover:border-gold-400 hover:text-gold-400
         active:scale-[0.98] transition-all duration-150;
}

/* Card para seções escuras da landing */
.card-navy {
  @apply rounded-2xl bg-navy-800 border border-white/10;
}

/* Badge dourado para labels de destaque */
.badge-gold {
  @apply badge bg-gold-500/15 text-gold-400 border border-gold-500/20;
}
```

Confidence: HIGH — follows exact @apply patterns from existing .btn-cta, .card-dark, and .badge classes.

### Anti-Patterns to Avoid

- **Modifying existing classes:** D-02 is locked — `.btn-primary`, `.card`, `.badge-*` must not change. Add only.
- **Adding Inter to font-family in tailwind.config.js:** Inter is already first in the `sans` array — no change needed.
- **Changing index.html Google Fonts link:** Inter 400/500/600/700 already covered by current `400;500;600;700;800` range. No modification needed.
- **Adding navy variants not needed:** navy 800/900/950 are sufficient for Phase 1 classes. Do not add 700 or below.
- **Using arbitrary values in CSS classes:** Use token names (gold-500, navy-900) not raw hex values inside @apply.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gold color scale | Custom HSL math | Tailwind amber scale (gold-500 = amber-500) | Perfect match, battle-tested, perceptually uniform |
| Shadow formula | Random values | Mirror shadow-money formula with gold RGB | Consistency with existing shadow system |
| Font loading optimization | Custom loader | Google Fonts preconnect + display=swap | Already in place, correct pattern |

---

## Common Pitfalls

### Pitfall 1: Inter Already Loaded — Don't Duplicate

**What goes wrong:** Adding a second Google Fonts link for Inter when it's already in the existing link tag at line 28.
**Why it happens:** The existing link loads `Inter:wght@400;500;600;700;800` — D-06 requires 400/500/600/700, all already present.
**How to avoid:** Read index.html line 28 before touching it. Current link already satisfies D-06 completely. No change needed to index.html.
**Warning signs:** If you see two `fonts.googleapis.com` links for Inter, one is redundant.

### Pitfall 2: navy-900 Text on gold-500 Background — Contrast Check

**What goes wrong:** `.btn-gold` uses `text-navy-900` on `bg-gold-500`. navy-900 = #080E1C on #F59E0B.
**Why it happens:** Gold backgrounds need dark text. White would work but navy-900 is on-brand.
**How to avoid:** #080E1C on #F59E0B = contrast ratio ~10.5:1 — passes WCAG AAA. Safe.
**Warning signs:** If text color is changed to white or ink-50, verify contrast against gold-500 (#F59E0B is a medium-luminance yellow).

### Pitfall 3: badge-gold Needs @apply badge Base First

**What goes wrong:** `.badge-gold` skips the `.badge` base class and redefines padding/border-radius inline.
**Why it happens:** Other badge variants (badge-neutral, badge-brand) all use `@apply badge` first.
**How to avoid:** `.badge-gold` must start with `@apply badge` (which applies `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold`), then add color overrides.

### Pitfall 4: gold-500/15 Opacity Syntax Requires Tailwind JIT

**What goes wrong:** `bg-gold-500/15` (opacity modifier) not working in older Tailwind config.
**Why it happens:** Opacity modifiers (`/15`, `/20`) require Tailwind v3 JIT mode.
**How to avoid:** Project uses Tailwind v3 with content array configured — JIT is on by default in v3. This is safe.
**Warning signs:** If opacity classes don't render, check `content` array in tailwind.config.js covers index.css path.

---

## Code Examples

### Complete tailwind.config.js gold addition

```javascript
// Source: Tailwind CSS official amber scale + project shadow-money pattern
// Add after `forest:` in theme.extend.colors:
gold: {
  50:  '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
},

// Add after `money-lg` in theme.extend.boxShadow:
'gold':    '0 4px 20px rgba(245,158,11,0.28)',
'gold-lg': '0 8px 32px rgba(245,158,11,0.36)',
```

### Complete index.css addition (after BADGES section, line ~201)

```css
/* ---------- LANDING COMPONENTS (Phase 1) ---------- */

.btn-gold {
  @apply inline-flex items-center justify-center gap-2.5 py-3.5 px-7 font-bold
         rounded-xl text-navy-900 text-[15px] tracking-tight
         bg-gold-500 hover:bg-gold-400
         active:scale-[0.98] transition-all duration-150
         shadow-gold;
}

.btn-navy-outline {
  @apply inline-flex items-center justify-center gap-2.5 py-3.5 px-7 font-semibold
         rounded-xl text-white text-[15px] tracking-tight
         bg-transparent border border-white/30
         hover:border-gold-400 hover:text-gold-400
         active:scale-[0.98] transition-all duration-150;
}

.card-navy {
  @apply rounded-2xl bg-navy-800 border border-white/10;
}

.badge-gold {
  @apply badge bg-gold-500/15 text-gold-400 border border-gold-500/20;
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| CSS custom properties for tokens | Tailwind config `theme.extend.colors` | Already project standard — follow it |
| @import for fonts | `<link rel="preconnect">` + stylesheet | Already in index.html — no change |

---

## Open Questions

None. All decisions are locked and the codebase has been fully read. Implementation is deterministic.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 is purely config/CSS changes. No external runtime dependencies beyond the existing Vite + Tailwind build pipeline already operational.

---

## Validation Architecture

### Test Framework

Phase 1 has no automated test suite (CSS/config changes). Validation is visual and build-based.

| Property | Value |
|----------|-------|
| Framework | Manual visual inspection + Vite build |
| Config file | none |
| Quick run command | `cd frontend && npm run dev` |
| Full suite command | `cd frontend && npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| DS-01 | gold tokens render in browser devtools | smoke | `npm run build` (no errors) | Visual inspect in browser |
| DS-02 | Inter loads, no FOUT | smoke | `npm run dev` + Network tab | Already partially done |
| DS-03 | .btn-gold hover state changes color | manual | inspect element in browser | |
| DS-04 | .card-navy renders navy bg + white/10 border | manual | inspect element in browser | |
| DS-05 | .badge-gold renders gold tint | manual | inspect element in browser | |

### Wave 0 Gaps

None — no test files needed. Phase 1 is config + CSS. Build success (`npm run build` exits 0) is the gate.

---

## Sources

### Primary (HIGH confidence)
- Tailwind CSS official amber scale (tailwindcss.com/docs/customizing-colors) — gold scale values
- Existing `frontend/tailwind.config.js` — shadow-money pattern, color scale structure, font-family
- Existing `frontend/src/index.css` — @layer components patterns, .badge base class, .btn-cta pattern
- Existing `frontend/index.html` line 28 — Inter already loaded with weights 400–800

### Secondary (MEDIUM confidence)
- Tailwind v3 JIT opacity modifier syntax (`/15`) — standard since v3.0.0, project is v3

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, existing tools confirmed
- Architecture: HIGH — exact file locations and insertion points confirmed from reading source
- Gold scale: HIGH — amber scale from Tailwind official docs, gold-500 = amber-500 exactly
- Pitfalls: HIGH — derived from reading actual source files
- index.html: HIGH — Inter already loaded, no change needed (confirmed by reading line 28)

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable domain)
