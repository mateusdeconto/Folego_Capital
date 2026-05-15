# Phase 4: Tela de Diagnóstico - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar animações à `Diagnosis.jsx` — count-up nos valores financeiros ao montar, stagger reveal progressivo nas seções, e destaque visual diferenciado para alert cards. Nenhuma mudança em lógica de negócio, dados, backend ou outros componentes (exceto App.jsx se necessário). Inclui fixes de tipografia/espaçamento listados na UI-SPEC como parte do entregável visual completo.

</domain>

<decisions>
## Implementation Decisions

### Escopo de mudanças
- **D-01:** Arquivo principal a modificar: `frontend/src/components/Diagnosis.jsx` — mudanças cirúrgicas, sem rewrite completo. Preservar toda lógica existente (calcMetrics, formatBRL, TONE_CLASSES, export handlers, modal, etc.)
- **D-02:** App.jsx entry fade — **SKIP.** Spec marca como "opcional, baixa prioridade." Stagger interno de Diagnosis.jsx já provê reveal progressivo. Sem mudanças em App.jsx nesta fase.
- **D-03:** Plano único — todas as mudanças animação + fixes tipografia em um único plano. Diagnosis.jsx é arquivo único, mudanças são aditivas.

### Animations (DG-01, DG-02, DG-03)
- **D-04:** Framer Motion — adicionar import `{ motion, useReducedMotion }` ao topo de Diagnosis.jsx. Já instalado no projeto.
- **D-05:** Variantes declaradas no módulo scope (antes do primeiro componente), não dentro de componentes — padrão estabelecido nas Fases 2 e 3.
  ```js
  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };
  const shakeIn = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } } };
  const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0 } } };
  ```
- **D-06:** Wrapper raiz do componente: trocar `<div className="animate-slide-up space-y-4">` por `<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">` — remove CSS animate-slide-up, substitui por Framer stagger.
- **D-07:** Cada card/seção vira `<motion.div variants={fadeUp}>` (ou `shakeIn` para alert cards). Não usar delay prop individual — deixar staggerChildren controlar o timing.
- **D-08:** Alert cards diferenciados com `shakeIn` variant + `border-l-4` + `shadow-md`:
  - HealthBadge com tone `warn` ou `loss`: adicionar `border-l-4 border-l-amber-400` (warn) ou `border-l-4 border-l-loss-500` (loss) + `shadow-md`. Pulsing dot: adicionar `animate-pulse` no span do dot.
  - AlertCard (mistura de contas `financialData.mixedAccounts`): adicionar `border-l-4 border-l-loss-500` + usar `shakeIn` variant.

### Count-up (DG-01)
- **D-09:** Definir `useCountUp(target, duration = 1200)` hook no módulo scope, antes de `BenchmarkChart`. Implementação com `requestAnimationFrame` + `easeOutCubic`.
  ```js
  function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [target, duration]);
    return value;
  }
  ```
- **D-10:** Valores com count-up: Lucro Líquido (1200ms), Lucro Bruto e EBITDA (1000ms), Ponto de Equilíbrio (1000ms), Projeção 30 dias (900ms).
- **D-11:** Valores sem count-up: percentuais (netMargin, grossMargin, CMV%) — exibição estática. Apenas valores monetários em BRL animam.
- **D-12:** Valores negativos: `useCountUp` recebe o target absoluto (`Math.abs(target)`), formatar com `formatBRL` sobre `value * Math.sign(target)`. Isso faz o número "contar" do 0 para o valor negativo naturalmente.
- **D-13:** `prefers-reduced-motion`: adicionar `const shouldReduceMotion = useReducedMotion()` no componente. Passar ao useCountUp como flag: se `shouldReduceMotion`, retornar `target` diretamente (sem animação). Também passar `{ staggerChildren: shouldReduceMotion ? 0 : 0.1 }` ao staggerContainer.

### BenchmarkChart bars (DG-02)
- **D-14:** Bar `<div style={{ width: '${userW}%' }}` → trocar por `<motion.div initial={{ width: '0%' }} animate={{ width: '${userW}%' }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }} ...>`. Remover `style`, usar animate prop do Framer Motion.

### Typography/spacing fixes (UI-SPEC Implementation Notes)
- **D-15:** Linha 597 — `text-3xl` no título businessName → `text-4xl` (36px Display per spec).
- **D-16:** Linha 595 — `text-xs font-medium` no label "Diagnóstico financeiro" → `text-sm font-bold uppercase tracking-wider` (Label 14px per spec).
- **D-17:** Linha 724 — `text-2xl` no valor projetado → `text-xl` (20px Heading per spec).
- **D-18:** Linha 658 — `mt-5 pt-5` na grid do HeroCard → `mt-4 pt-4` (16px per spec).
- **D-19:** `text-xs` em outros micro-labels dentro do componente → `text-sm` + adicionar `uppercase tracking-wider` onde aplicável (labels de seção).

### Claude's Discretion
- Handling de edge cases no useCountUp (target === 0, target = NaN) — Claude trata com guard.
- Estrutura de import — Claude organiza imports existentes + motion/useReducedMotion.
- Qualquer micro-label adicional que precise do fix text-xs → text-sm além dos listados.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Arquivo a modificar
- `frontend/src/components/Diagnosis.jsx` — arquivo principal. Ler inteiro antes de planejar. 887 linhas. TONE_CLASSES (linha 191), BenchmarkChart (linha 134), componente principal (linha 495).

### Design System
- `frontend/src/index.css` — classes existentes (.card, .card-dark, .btn-*, .diagnosis-content, .data-row, animate-slide-up, animate-pulse)
- `frontend/tailwind.config.js` — tokens de cor (money, loss, warn, brand, gold, navy, ink), fontFamily.mono (JetBrains Mono)

### UI Design Contract (OBRIGATÓRIO — contém todos os specs visuais)
- `.planning/phases/04-tela-de-diagnostico/04-UI-SPEC.md` — Animation Contract completo, Component Inventory, Typography, Color, Spacing, Interaction States, Implementation Notes

### Fase 3 (patterns estabelecidos)
- `frontend/src/components/Loading.jsx` — useCountUp não existe aqui, mas AnimatePresence + Framer Motion pattern a seguir
- `frontend/src/components/Questionnaire.jsx` — Framer Motion variants + AnimatePresence pattern

### Requisitos
- `.planning/REQUIREMENTS.md` — DG-01, DG-02, DG-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TONE_CLASSES` object (Diagnosis.jsx linha 191): `{ money, brand, warn, loss }` — estender inline com border-l-4 logic, não reestruturar
- `formatBRL` (importado de lib/metrics.js) — usar para formatar output do useCountUp
- `calcMetrics`, `calcProjection` — já calculam os valores; useCountUp recebe seus outputs
- `animate-slide-up` CSS class no wrapper root — remover e substituir por Framer Motion stagger

### Established Patterns
- Framer Motion variants fora do componente (Landing.jsx, Questionnaire.jsx) — seguir
- `useReducedMotion` disponível no framer-motion — não adicionar nova dependência
- `motion.div` com `variants={fadeUp}` + `initial="hidden" animate="visible"` — padrão Fase 3
- Keyframes CSS (`animate-pulse`) já definidos no tailwind — manter para pulsing dot

### Integration Points
- Diagnosis.jsx é autossuficiente — não precisa de mudanças em App.jsx
- Framer Motion já no package.json (usado em Questionnaire, Loading, Landing)
- `useEffect`, `useState` já importados no topo de Diagnosis.jsx — adicionar Framer imports ao lado

</code_context>

<specifics>
## Specific Ideas

- O wrapper root `<div className="animate-slide-up space-y-4">` vira o `staggerContainer` — remove `animate-slide-up`, adiciona `variants={staggerContainer} initial="hidden" animate="visible"`.
- `useCountUp` deve ser definido uma vez como função standalone antes de `BenchmarkChart` — reutilizar com diferentes `duration` em cada ponto de uso.
- Para bars do BenchmarkChart: substituir `<div className={`h-full rounded-full ${userColor}`} style={{ width: `${userW}%` }} />` por `<motion.div ... initial={{ width: '0%' }} animate={{ width: `${userW}%` }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }} />`.

</specifics>

<deferred>
## Deferred Ideas

- App.jsx entry fade (motion.div wrapper externo) — removido do escopo, spec diz "opcional, baixa prioridade"
- Animações no Chat (IA) — v2 per REQUIREMENTS.md
- Micro-animações no CorrectDataModal — spec diz "no animation changes needed"
- GSAP para maior controle — v2 per REQUIREMENTS.md

</deferred>

---

*Phase: 04-tela-de-diagnostico*
*Context gathered: 2026-05-15*
