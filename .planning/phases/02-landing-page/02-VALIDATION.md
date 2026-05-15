---
phase: 2
slug: landing-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> UI-only phase — no test framework detected. Automated gate: `npm run build`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — UI/visual phase, no automated tests |
| **Config file** | `frontend/vite.config.js` (build tool) |
| **Quick run command** | `cd frontend && npm run build` |
| **Full suite command** | `cd frontend && npm run build` |
| **Estimated runtime** | ~15–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npm run build`
- **After every plan wave:** Run `cd frontend && npm run build`
- **Before `/gsd:verify-work`:** Full build must pass + human checkpoint (Plan 02-03/T3)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-T1 | 01 | 1 | LP-01 | build | `cd frontend && npm run build` | ⬜ pending |
| 02-02-T1 | 02 | 2 | LP-02, LP-03, LP-04 | build + grep | `cd frontend && npm run build` | ⬜ pending |
| 02-02-T2 | 02 | 2 | LP-02, LP-03, LP-04 | build | `cd frontend && npm run build` | ⬜ pending |
| 02-03-T1 | 03 | 3 | LP-05, LP-06, LP-07 | build | `cd frontend && npm run build` | ⬜ pending |
| 02-03-T2 | 03 | 3 | LP-08, LP-09 | build | `cd frontend && npm run build` | ⬜ pending |

---

## Wave 0 Requirements

None — no test framework required for this UI phase. Build gate is sufficient.

*Existing infrastructure covers all phase requirements via build verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero animated background (luz cortando névoa) | LP-01 | Visual animation — not checkable via build | Open browser, verify gold glow keyframes animate smoothly on slate-950 |
| Headline stagger animation | LP-02 | Visual animation timing | Reload page, verify badge → headline lines → subtext → CTAs enter in sequence |
| Navbar liquid-glass | LP-04 | Visual style — backdrop-blur requires browser render | Scroll page, verify navbar stays fixed with glass effect |
| Seções com entrada animada ao scroll | LP-05–LP-08 | Scroll-triggered animations | Scroll through each section, verify InView triggers fade-up on first view |
| ReportCard scroll-driven reveal | LP-11 (D-11) | Scroll-transform — only testable in browser | Slowly scroll hero, verify card sections reveal progressively |
| Overall visual coherence | all LP | Subjective UI quality | Compare against UI-SPEC.md wireframes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (`npm run build`) — no task left without build gate
- [ ] Wave 0 not required — no test framework to install
- [ ] No watch-mode flags in verify commands
- [ ] Feedback latency < 30s
- [ ] Human checkpoint in Plan 02-03/T3 covers manual verifications
- [ ] `nyquist_compliant: true` set in frontmatter (set when all above checked)

**Approval:** pending
