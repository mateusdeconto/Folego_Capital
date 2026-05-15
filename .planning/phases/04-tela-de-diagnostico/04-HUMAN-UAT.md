---
status: partial
phase: 04-tela-de-diagnostico
source: [04-VERIFICATION.md]
started: 2026-05-15T00:00:00Z
updated: 2026-05-15T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Count-up Animation Visual Smoothness
expected: Numbers count smoothly from R$ 0,00 to real values using easeOutCubic over 900–1200ms on Diagnosis mount (Lucro Líquido, Lucro Bruto, EBITDA, Ponto de Equilíbrio, Projeção 30 dias)
result: [pending]

### 2. Stagger Reveal Sequence
expected: Header appears first, then health badge, alert card (if applicable), hero card, remaining sections — each ~100ms delay, fading up from y+16px
result: [pending]

### 3. HealthBadge Alert Differentiation
expected: Submit data triggering "Atenção"/"Crítica" → health badge enters with spring shake (x-axis), colored left border (amber=warn, red=loss), shadow-md, pulsing dot
result: [pending]

### 4. prefers-reduced-motion Behavior
expected: DevTools → Rendering → prefers-reduced-motion: reduce → reload → values appear instantly at final value (no count-up), all cards appear simultaneously (no stagger)
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
