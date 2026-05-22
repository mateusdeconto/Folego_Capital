import { describe, it, expect } from 'vitest';
import { calcMetrics, formatBRL, formatBRLCompact, generateWeeklyPlan } from './metrics.js';

// ---------------------------------------------------------------------------
// calcMetrics
// ---------------------------------------------------------------------------

describe('calcMetrics', () => {
  it('calcula métricas básicas corretamente', () => {
    const m = calcMetrics({
      revenue: 10000,
      cogs: 4000,
      fixedExpenses: 3000,
      debtPayment: 500,
      investments: 200,
      cashBalance: 5000,
      accountsReceivable: 2000,
    });

    expect(m.grossProfit).toBe(6000);
    expect(m.grossMargin).toBeCloseTo(60, 5);
    expect(m.ebitda).toBe(3000);
    expect(m.netProfit).toBe(2500);
    expect(m.netMargin).toBeCloseTo(25, 5);
    expect(m.debtRatio).toBeCloseTo(5, 5);
    expect(m.breakEven).toBeCloseTo(5000, 0);
  });

  it('retorna zeros quando todos os campos são omitidos', () => {
    const m = calcMetrics({});
    expect(m.revenue).toBe(0);
    expect(m.grossProfit).toBe(0);
    expect(m.grossMargin).toBe(0);
    expect(m.netProfit).toBe(0);
    expect(m.breakEven).toBe(0);
  });

  it('grossMargin é zero quando revenue é zero', () => {
    const m = calcMetrics({ revenue: 0, cogs: 1000 });
    expect(m.grossMargin).toBe(0);
    expect(m.netMargin).toBe(0);
    expect(m.debtRatio).toBe(0);
    expect(m.breakEven).toBe(0);
  });

  it('netProfit negativo quando custos superam receita', () => {
    const m = calcMetrics({ revenue: 5000, cogs: 4000, fixedExpenses: 2000, debtPayment: 0 });
    expect(m.netProfit).toBe(-1000);
    expect(m.netMargin).toBeCloseTo(-20, 5);
  });

  it('breakEven zero quando grossMargin é zero', () => {
    const m = calcMetrics({ revenue: 1000, cogs: 1000, fixedExpenses: 500 });
    expect(m.grossMargin).toBe(0);
    expect(m.breakEven).toBe(0);
  });

  it('converte strings numéricas corretamente', () => {
    const m = calcMetrics({ revenue: '8000', cogs: '2000', fixedExpenses: '1000' });
    expect(m.grossProfit).toBe(6000);
    expect(m.netProfit).toBe(5000);
  });

  it('cashBalance negativo é preservado', () => {
    const m = calcMetrics({ cashBalance: -500 });
    expect(m.cashBalance).toBe(-500);
  });

  it('investments não reduz netProfit — só reduz caixa', () => {
    const m1 = calcMetrics({ revenue: 10000, cogs: 4000, fixedExpenses: 2000, debtPayment: 0, investments: 0 });
    const m2 = calcMetrics({ revenue: 10000, cogs: 4000, fixedExpenses: 2000, debtPayment: 0, investments: 5000 });
    expect(m1.netProfit).toBe(m2.netProfit);
  });

  it('debtRatio correto com debtPayment alto', () => {
    const m = calcMetrics({ revenue: 10000, debtPayment: 3000 });
    expect(m.debtRatio).toBeCloseTo(30, 5);
  });
});

// ---------------------------------------------------------------------------
// formatBRL
// ---------------------------------------------------------------------------

describe('formatBRL', () => {
  it('formata valor positivo em BRL', () => {
    expect(formatBRL(1000)).toContain('1.000');
  });

  it('formata zero', () => {
    expect(formatBRL(0)).toContain('0');
  });

  it('formata valor negativo', () => {
    expect(formatBRL(-500)).toContain('500');
  });

  it('undefined não quebra', () => {
    expect(() => formatBRL(undefined)).not.toThrow();
    expect(formatBRL(undefined)).toContain('0');
  });
});

// ---------------------------------------------------------------------------
// formatBRLCompact
// ---------------------------------------------------------------------------

describe('formatBRLCompact', () => {
  it('formata milhões com sufixo M', () => {
    expect(formatBRLCompact(2_500_000)).toBe('R$ 2.5M');
  });

  it('formata milhares com sufixo k', () => {
    expect(formatBRLCompact(15_000)).toBe('R$ 15.0k');
  });

  it('formata valor abaixo de 1000 com BRL completo', () => {
    const result = formatBRLCompact(500);
    expect(result).toContain('500');
  });

  it('valor negativo em milhares', () => {
    expect(formatBRLCompact(-5_000)).toBe('R$ -5.0k');
  });

  it('zero não quebra', () => {
    expect(() => formatBRLCompact(0)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// generateWeeklyPlan
// ---------------------------------------------------------------------------

const healthyMetrics = calcMetrics({
  revenue: 20000,
  cogs: 8000,
  fixedExpenses: 4000,
  debtPayment: 500,
  cashBalance: 15000,
  accountsReceivable: 2000,
});

describe('generateWeeklyPlan — mainRisk', () => {
  it('critical quando netProfit < 0', () => {
    const m = calcMetrics({ revenue: 5000, cogs: 4000, fixedExpenses: 2000 });
    const { mainRisk } = generateWeeklyPlan(m);
    expect(mainRisk.level).toBe('critical');
  });

  it('critical quando receita abaixo do ponto de equilíbrio', () => {
    // revenue = 3000, breakEven ≈ 5000 → abaixo do BE
    const m = calcMetrics({ revenue: 3000, cogs: 1200, fixedExpenses: 5000, debtPayment: 0 });
    const { mainRisk } = generateWeeklyPlan(m);
    expect(mainRisk.level).toBe('critical');
  });

  it('warn quando debtRatio > 30', () => {
    const m = calcMetrics({ revenue: 10000, cogs: 2000, fixedExpenses: 1000, debtPayment: 3500 });
    const { mainRisk } = generateWeeklyPlan(m);
    expect(mainRisk.level).toBe('warn');
  });

  it('warn quando cashBalance baixo vs breakEven', () => {
    const m = calcMetrics({ revenue: 10000, cogs: 2000, fixedExpenses: 4000, debtPayment: 0, cashBalance: 100 });
    const { mainRisk } = generateWeeklyPlan(m);
    expect(mainRisk.level).toBe('warn');
  });

  it('ok para negócio saudável', () => {
    const { mainRisk } = generateWeeklyPlan(healthyMetrics);
    expect(mainRisk.level).toBe('ok');
  });
});

describe('generateWeeklyPlan — actions', () => {
  it('retorna exatamente 3 ações', () => {
    const { actions } = generateWeeklyPlan(healthyMetrics);
    expect(actions).toHaveLength(3);
  });

  it('ações ordenadas por prioridade (1, 2, 3)', () => {
    const { actions } = generateWeeklyPlan(healthyMetrics);
    expect(actions.map(a => a.priority)).toEqual([1, 2, 3]);
  });

  it('ação de corte de custo aparece quando netProfit < 0', () => {
    const m = calcMetrics({ revenue: 5000, cogs: 4000, fixedExpenses: 2000 });
    const { actions } = generateWeeklyPlan(m);
    const topAction = actions[0];
    expect(topAction.score).toBe(100);
    expect(topAction.action).toMatch(/despesa/i);
  });

  it('ação de vendas aparece quando receita < breakEven', () => {
    const m = calcMetrics({ revenue: 3000, cogs: 600, fixedExpenses: 4000, debtPayment: 0 });
    const { actions } = generateWeeklyPlan(m);
    expect(actions.some(a => a.score === 95)).toBe(true);
  });

  it('ação de renegociação quando debtRatio > 30', () => {
    const m = calcMetrics({ revenue: 10000, cogs: 2000, fixedExpenses: 1000, debtPayment: 3500 });
    const { actions } = generateWeeklyPlan(m);
    expect(actions.some(a => a.score === 85)).toBe(true);
  });

  it('ação de conta PJ separada quando mixedAccounts=true', () => {
    const { actions } = generateWeeklyPlan(healthyMetrics, { mixedAccounts: true });
    expect(actions.some(a => a.score === 65)).toBe(true);
  });

  it('cada ação tem action, reason e impact', () => {
    const { actions } = generateWeeklyPlan(healthyMetrics);
    actions.forEach(a => {
      expect(a.action).toBeTruthy();
      expect(a.reason).toBeTruthy();
      expect(a.impact).toBeTruthy();
    });
  });
});
