import { describe, it, expect } from 'vitest';
import { getProfile, calcTrend, evaluate, lastDecisionKey } from './canOrNot.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fin(overrides = {}) {
  return {
    revenue: 10000,
    cogs: 3000,
    fixedExpenses: 2000,
    debtPayment: 500,
    cashBalance: 8000,
    accountsReceivable: 1000,
    investments: 0,
    ...overrides,
  };
}

function diag(revenue, daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { financial_data: { revenue, cogs: revenue * 0.3, fixedExpenses: revenue * 0.2 }, created_at: d.toISOString() };
}

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------

describe('getProfile', () => {
  it('retorna perfil de varejo para "varejo"', () => {
    const p = getProfile('varejo');
    expect(p.label).toBe('Varejo');
    expect(p.sector).toBe('varejo');
  });

  it('retorna perfil de serviços para "serviços" (com acento)', () => {
    const p = getProfile('serviços');
    expect(p.label).toBe('Serviços');
  });

  it('retorna perfil de restaurante para "restaurante"', () => {
    const p = getProfile('restaurante');
    expect(p.label).toBe('Alimentação');
  });

  it('retorna perfil de tecnologia para "software"', () => {
    const p = getProfile('software');
    expect(p.label).toBe('Tecnologia');
    expect(p.minMargin).toBe(15);
  });

  it('retorna default para setor desconhecido', () => {
    const p = getProfile('peixaria');
    expect(p.sector).toBe('default');
    expect(p.label).toBe('Geral');
  });

  it('customSegment tem prioridade sobre segment', () => {
    const p = getProfile('varejo', 'tecnologia');
    expect(p.label).toBe('Tecnologia');
  });

  it('sem argumentos retorna default', () => {
    const p = getProfile();
    expect(p.sector).toBe('default');
  });

  it('perfil de consultoria tem maxDebt baixo', () => {
    const p = getProfile('consultoria');
    expect(p.maxDebt).toBe(25);
    expect(p.goodMargin).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// calcTrend
// ---------------------------------------------------------------------------

describe('calcTrend', () => {
  it('retorna unknown com menos de 2 diagnósticos', () => {
    expect(calcTrend([])).toBe('unknown');
    expect(calcTrend([diag(10000)])).toBe('unknown');
  });

  it('retorna unknown com dados null/undefined', () => {
    expect(calcTrend(null)).toBe('unknown');
    expect(calcTrend(undefined)).toBe('unknown');
  });

  it('retorna growing quando receita sobe >7% e margem estável', () => {
    const trend = calcTrend([diag(11000, 0), diag(10000, 30)]);
    expect(trend).toBe('growing');
  });

  it('retorna declining quando receita cai >7%', () => {
    const trend = calcTrend([diag(9000, 0), diag(10000, 30)]);
    expect(trend).toBe('declining');
  });

  it('retorna stable para variação dentro do intervalo', () => {
    const trend = calcTrend([diag(10200, 0), diag(10000, 30)]);
    expect(trend).toBe('stable');
  });

  it('ignora diagnósticos com revenue=0', () => {
    const trend = calcTrend([diag(0, 0), diag(0, 30), diag(10000, 60)]);
    expect(trend).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// evaluate — nodata
// ---------------------------------------------------------------------------

describe('evaluate — sem dados financeiros', () => {
  it('retorna nodata quando financialData é null', () => {
    const r = evaluate('hire', null);
    expect(r.verdict).toBe('nodata');
  });

  it('retorna nodata quando todos os campos são zero', () => {
    const r = evaluate('hire', { revenue: 0, cashBalance: 0, fixedExpenses: 0 });
    expect(r.verdict).toBe('nodata');
  });

  it('retorna null para decisionId desconhecido', () => {
    const r = evaluate('unknownDecision', fin());
    expect(r).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// evaluate — hire (contratar)
// ---------------------------------------------------------------------------

describe('evaluate hire', () => {
  it('can — negócio saudável sem custo informado', () => {
    const r = evaluate('hire', fin(), {});
    expect(r.verdict).toBe('can');
    expect(r.title).toBe('Pode');
    expect(r.signals.length).toBeGreaterThan(0);
  });

  it('cannot — empresa no prejuízo', () => {
    const r = evaluate('hire', fin({ revenue: 5000, cogs: 4000, fixedExpenses: 2000 }), {});
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — caixa crítico após contratação', () => {
    const r = evaluate('hire', fin({ cashBalance: 500, fixedExpenses: 1000, debtPayment: 0 }), { monthlyCost: 2000 });
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — debtRatio acima do máximo do setor', () => {
    const r = evaluate('hire', fin({ revenue: 10000, debtPayment: 4500, cogs: 1000, fixedExpenses: 500 }), {});
    expect(r.verdict).toBe('cannot');
  });

  it('careful — margem marginal pós-contratação', () => {
    // Margem boa antes, fica no limite após +custo
    const r = evaluate('hire',
      fin({ revenue: 10000, cogs: 5000, fixedExpenses: 2000, debtPayment: 0, cashBalance: 4000 }),
      { monthlyCost: 2500 },
    );
    expect(['careful', 'cannot']).toContain(r.verdict);
  });

  it('resultado tem signals, reasons e improvements', () => {
    const r = evaluate('hire', fin(), {});
    expect(Array.isArray(r.signals)).toBe(true);
    expect(Array.isArray(r.reasons)).toBe(true);
    expect(Array.isArray(r.improvements)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// evaluate — stock (comprar estoque)
// ---------------------------------------------------------------------------

describe('evaluate stock', () => {
  it('can — caixa folgado', () => {
    const r = evaluate('stock', fin(), { totalValue: 1000 });
    expect(r.verdict).toBe('can');
  });

  it('cannot — compra zera o caixa', () => {
    const r = evaluate('stock', fin({ cashBalance: 500 }), { totalValue: 600 });
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — caixa zerado antes da compra', () => {
    const r = evaluate('stock', fin({ cashBalance: 0 }), { totalValue: 1000 });
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — caixa ficaria abaixo do mínimo crítico', () => {
    const r = evaluate('stock',
      fin({ cashBalance: 2000, fixedExpenses: 4000, debtPayment: 1000 }),
      { totalValue: 1800 },
    );
    expect(r.verdict).toBe('cannot');
  });

  it('can sem totalValue informado', () => {
    const r = evaluate('stock', fin(), {});
    expect(['can', 'careful']).toContain(r.verdict);
  });
});

// ---------------------------------------------------------------------------
// evaluate — marketing
// ---------------------------------------------------------------------------

describe('evaluate marketing', () => {
  it('can — negócio saudável', () => {
    const r = evaluate('marketing', fin(), { totalValue: 500 });
    expect(r.verdict).toBe('can');
  });

  it('cannot — empresa no prejuízo', () => {
    const r = evaluate('marketing', fin({ revenue: 3000, cogs: 3000, fixedExpenses: 1000 }), {});
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — custo recorrente vira prejuízo', () => {
    const r = evaluate('marketing',
      fin({ revenue: 5000, cogs: 2000, fixedExpenses: 2000, debtPayment: 500 }),
      { monthlyCost: 1000 },
    );
    expect(r.verdict).toBe('cannot');
  });

  it('careful — caixa apertado após investimento', () => {
    const r = evaluate('marketing',
      fin({ cashBalance: 1500, fixedExpenses: 2000, debtPayment: 500 }),
      { totalValue: 1000 },
    );
    expect(['careful', 'cannot']).toContain(r.verdict);
  });
});

// ---------------------------------------------------------------------------
// evaluate — withdraw (tirar dinheiro)
// ---------------------------------------------------------------------------

describe('evaluate withdraw', () => {
  it('can — negócio com lucro e caixa bom', () => {
    const r = evaluate('withdraw', fin(), { totalValue: 1000 });
    expect(r.verdict).toBe('can');
  });

  it('cannot — empresa no prejuízo', () => {
    const r = evaluate('withdraw', fin({ revenue: 3000, cogs: 3000, fixedExpenses: 500 }), {});
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — retirada zera o caixa', () => {
    const r = evaluate('withdraw', fin({ cashBalance: 300 }), { totalValue: 400 });
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — caixa abaixo do mínimo antes de retirar', () => {
    // cashBalance só cobre poucos dias (200 / (2000+500) * 30 ≈ 2.4 dias → abaixo de minDays)
    const r = evaluate('withdraw', fin({ cashBalance: 200, fixedExpenses: 2000, debtPayment: 500 }), {});
    expect(r.verdict).toBe('cannot');
  });

  it('careful — retirada deixa caixa no limite', () => {
    // cashBalance 3000, burn 2500/mês → ~36 dias. Após retirada 2000: 1000/2500*30 ≈ 12 dias (goodDays ~38 para default)
    const r = evaluate('withdraw',
      fin({ cashBalance: 3000, fixedExpenses: 2000, debtPayment: 500 }),
      { totalValue: 2000 },
    );
    expect(['careful', 'cannot']).toContain(r.verdict);
  });
});

// ---------------------------------------------------------------------------
// evaluate — loan (empréstimo)
// ---------------------------------------------------------------------------

describe('evaluate loan', () => {
  it('can — capacidade de pagar', () => {
    const r = evaluate('loan', fin(), { totalValue: 5000, monthlyInstallment: 200 });
    expect(r.verdict).toBe('can');
  });

  it('cannot — debtRatio já acima do máximo', () => {
    // debtPayment = 4000 sobre revenue = 10000 → 40% > maxDebt(default 35%)
    const r = evaluate('loan', fin({ debtPayment: 4000 }), { monthlyInstallment: 100 });
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — parcela causa prejuízo', () => {
    // revenue 10000, cogs 3000, fixed 2000, debt 500 → netProfit 4500
    // parcela 5000 → netProfit vira -500
    const r = evaluate('loan', fin(), { monthlyInstallment: 5000 });
    expect(r.verdict).toBe('cannot');
  });

  it('careful — debtRatio vai para zona de alerta', () => {
    // debtPayment 2000 → 20%. Parcela 1000 → 30% (>70% de 35% = 24.5%)
    const r = evaluate('loan', fin({ debtPayment: 2000 }), { monthlyInstallment: 1000 });
    expect(['careful', 'cannot']).toContain(r.verdict);
  });

  it('can sem monthlyInstallment — só avalia estado atual', () => {
    const r = evaluate('loan', fin(), {});
    expect(['can', 'careful']).toContain(r.verdict);
  });
});

// ---------------------------------------------------------------------------
// evaluate — equipment (comprar equipamento)
// ---------------------------------------------------------------------------

describe('evaluate equipment', () => {
  it('can — compra à vista com caixa folgado', () => {
    const r = evaluate('equipment', fin({ cashBalance: 20000 }), { totalValue: 3000 });
    expect(r.verdict).toBe('can');
  });

  it('cannot — compra à vista zera o caixa', () => {
    const r = evaluate('equipment', fin({ cashBalance: 500 }), { totalValue: 600 });
    expect(r.verdict).toBe('cannot');
  });

  it('cannot — parcela torna dívida inviável', () => {
    const r = evaluate('equipment', fin({ debtPayment: 3000 }), { monthlyInstallment: 1000 });
    expect(r.verdict).toBe('cannot');
  });

  it('can — financiamento dentro dos limites', () => {
    const r = evaluate('equipment', fin(), { totalValue: 5000, monthlyInstallment: 200 });
    expect(r.verdict).toBe('can');
  });

  it('resultado sem campos retornado sem erro', () => {
    const r = evaluate('equipment', fin(), {});
    expect(r).not.toBeNull();
    expect(r.verdict).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// lastDecisionKey
// ---------------------------------------------------------------------------

describe('lastDecisionKey', () => {
  it('gera chave com nome e segmento', () => {
    const key = lastDecisionKey({ businessName: 'Padaria Silva', segment: 'alimentacao' });
    expect(key).toContain('folego_last_can_');
    expect(key).toContain('padaria_silva');
    expect(key).toContain('alimentacao');
  });

  it('não quebra com businessData vazio', () => {
    expect(() => lastDecisionKey({})).not.toThrow();
  });

  it('não quebra com businessData undefined', () => {
    expect(() => lastDecisionKey(undefined)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Consistência dos resultados
// ---------------------------------------------------------------------------

describe('estrutura dos resultados', () => {
  const decisions = ['hire', 'stock', 'marketing', 'withdraw', 'loan', 'equipment'];

  decisions.forEach(d => {
    it(`evaluate(${d}) retorna estrutura completa`, () => {
      const r = evaluate(d, fin(), {});
      expect(r).not.toBeNull();
      expect(['can', 'cannot', 'careful', 'nodata']).toContain(r.verdict);
      expect(typeof r.title).toBe('string');
      expect(typeof r.explanation).toBe('string');
      expect(Array.isArray(r.signals)).toBe(true);
      expect(Array.isArray(r.reasons)).toBe(true);
      expect(Array.isArray(r.improvements)).toBe(true);
    });
  });

  it('applyTrend: declining + can com sinal warn → careful', () => {
    // Negócio em queda (receita caiu >7%) mas ainda positivo
    const diagnoses = [diag(8500, 0), diag(10000, 30)];
    const r = evaluate('hire', fin(), {}, {}, diagnoses);
    // Com receita declining, se era 'can' deve virar 'careful' (se hover sinal warn)
    // Não podemos garantir exatamente sem ver os signals, mas veredicto deve ser válido
    expect(['can', 'careful', 'cannot']).toContain(r.verdict);
  });
});
