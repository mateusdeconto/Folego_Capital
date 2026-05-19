import { calcMetrics, formatBRL } from './metrics.js';

// ---------------------------------------------------------------------------
// Perfis por setor — thresholds ajustados à realidade de cada segmento
// ---------------------------------------------------------------------------

const SECTOR_PROFILES = {
  varejo:      { minMargin: 4,  goodMargin: 10, critDays: 10, minDays: 15, goodDays: 25, maxDebt: 42, label: 'Varejo'       },
  comercio:    { minMargin: 4,  goodMargin: 10, critDays: 10, minDays: 15, goodDays: 25, maxDebt: 42, label: 'Comércio'     },
  alimentacao: { minMargin: 4,  goodMargin: 12, critDays: 7,  minDays: 12, goodDays: 22, maxDebt: 40, label: 'Alimentação'  },
  restaurante: { minMargin: 4,  goodMargin: 12, critDays: 7,  minDays: 12, goodDays: 22, maxDebt: 40, label: 'Alimentação'  },
  lanchonete:  { minMargin: 4,  goodMargin: 12, critDays: 7,  minDays: 12, goodDays: 22, maxDebt: 40, label: 'Alimentação'  },
  bar:         { minMargin: 4,  goodMargin: 12, critDays: 7,  minDays: 12, goodDays: 22, maxDebt: 40, label: 'Alimentação'  },
  mercado:     { minMargin: 3,  goodMargin: 8,  critDays: 10, minDays: 15, goodDays: 25, maxDebt: 42, label: 'Varejo'       },
  supermercado:{ minMargin: 3,  goodMargin: 8,  critDays: 10, minDays: 15, goodDays: 25, maxDebt: 42, label: 'Varejo'       },
  servico:     { minMargin: 12, goodMargin: 22, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Serviços'     },
  servicos:    { minMargin: 12, goodMargin: 22, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Serviços'     },
  consultoria: { minMargin: 18, goodMargin: 30, critDays: 20, minDays: 25, goodDays: 50, maxDebt: 25, label: 'Consultoria'  },
  agencia:     { minMargin: 12, goodMargin: 25, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 28, label: 'Agência'      },
  marketing:   { minMargin: 12, goodMargin: 25, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 28, label: 'Agência'      },
  industria:   { minMargin: 6,  goodMargin: 14, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 38, label: 'Indústria'    },
  fabricacao:  { minMargin: 6,  goodMargin: 14, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 38, label: 'Indústria'    },
  manufatura:  { minMargin: 6,  goodMargin: 14, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 38, label: 'Indústria'    },
  tecnologia:  { minMargin: 15, goodMargin: 30, critDays: 20, minDays: 25, goodDays: 60, maxDebt: 25, label: 'Tecnologia'   },
  software:    { minMargin: 15, goodMargin: 30, critDays: 20, minDays: 25, goodDays: 60, maxDebt: 25, label: 'Tecnologia'   },
  saude:       { minMargin: 10, goodMargin: 20, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Saúde'        },
  clinica:     { minMargin: 10, goodMargin: 20, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Saúde'        },
  clinica:     { minMargin: 10, goodMargin: 20, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Saúde'        },
  construcao:  { minMargin: 6,  goodMargin: 14, critDays: 18, minDays: 22, goodDays: 45, maxDebt: 38, label: 'Construção'   },
  educacao:    { minMargin: 10, goodMargin: 20, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Educação'     },
  escola:      { minMargin: 10, goodMargin: 20, critDays: 15, minDays: 20, goodDays: 40, maxDebt: 30, label: 'Educação'     },
  estetica:    { minMargin: 12, goodMargin: 22, critDays: 10, minDays: 15, goodDays: 30, maxDebt: 32, label: 'Estética'     },
  beleza:      { minMargin: 12, goodMargin: 22, critDays: 10, minDays: 15, goodDays: 30, maxDebt: 32, label: 'Beleza'       },
  salao:       { minMargin: 12, goodMargin: 22, critDays: 10, minDays: 15, goodDays: 30, maxDebt: 32, label: 'Beleza'       },
  logistica:   { minMargin: 6,  goodMargin: 14, critDays: 18, minDays: 22, goodDays: 45, maxDebt: 38, label: 'Logística'    },
  transporte:  { minMargin: 6,  goodMargin: 14, critDays: 18, minDays: 22, goodDays: 45, maxDebt: 38, label: 'Logística'    },
  default:     { minMargin: 8,  goodMargin: 15, critDays: 15, minDays: 18, goodDays: 38, maxDebt: 35, label: 'Geral'        },
};

export function getProfile(segment = '', customSegment = '') {
  const s = (customSegment || segment || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  for (const [key, profile] of Object.entries(SECTOR_PROFILES)) {
    if (key !== 'default' && s.includes(key)) return { ...profile, sector: key };
  }
  return { ...SECTOR_PROFILES.default, sector: 'default' };
}

// ---------------------------------------------------------------------------
// Tendência histórica
// ---------------------------------------------------------------------------

export function calcTrend(allDiagnoses) {
  if (!allDiagnoses || allDiagnoses.length < 2) return 'unknown';

  const valid = [...allDiagnoses]
    .filter(d => Number(d.financial_data?.revenue) > 0)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  if (valid.length < 2) return 'unknown';

  const latest = calcMetrics(valid[0].financial_data);
  const prev   = calcMetrics(valid[1].financial_data);

  const revChange    = prev.revenue > 0 ? (latest.revenue - prev.revenue) / prev.revenue : 0;
  const marginDelta  = latest.netMargin - prev.netMargin;
  const profitChange = prev.netProfit !== 0
    ? (latest.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
    : 0;

  if (revChange > 0.07 && marginDelta >= -2)  return 'growing';
  if (revChange < -0.07 || marginDelta < -5 || profitChange < -0.3) return 'declining';
  return 'stable';
}

export const TREND_LABELS = {
  growing:  'Receita crescendo nos últimos meses — tendência positiva.',
  declining:'Receita em queda nos últimos meses — atenção redobrada.',
  stable:   null,
  unknown:  null,
};

// ---------------------------------------------------------------------------
// Decisões disponíveis
// ---------------------------------------------------------------------------

export const DECISIONS = [
  {
    id: 'hire',
    label: 'Contratar alguém',
    description: 'Funcionário, freelancer ou prestador',
    icon: 'hire',
    fields: [
      {
        id: 'monthlyCost',
        label: 'Custo mensal total (salário + encargos)',
        hint: 'CLT: salário × 1,7. Inclua vale-transporte, alimentação etc.',
        placeholder: '0',
      },
    ],
  },
  {
    id: 'stock',
    label: 'Comprar estoque',
    description: 'Mercadoria, matéria-prima ou insumos',
    icon: 'stock',
    fields: [
      {
        id: 'totalValue',
        label: 'Valor da compra',
        placeholder: '0',
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Investir em marketing',
    description: 'Anúncios, agência ou materiais',
    icon: 'marketing',
    fields: [
      {
        id: 'totalValue',
        label: 'Valor do investimento (ou primeiro mês)',
        placeholder: '0',
      },
      {
        id: 'monthlyCost',
        label: 'Custo mensal recorrente (se for contrato/agência)',
        hint: 'Preencha se for gasto fixo mensal. Deixe em branco se for pontual.',
        placeholder: '0',
      },
    ],
  },
  {
    id: 'withdraw',
    label: 'Tirar dinheiro da empresa',
    description: 'Pró-labore extra ou distribuição de lucro',
    icon: 'withdraw',
    fields: [
      {
        id: 'totalValue',
        label: 'Quanto quer retirar',
        placeholder: '0',
      },
    ],
  },
  {
    id: 'loan',
    label: 'Pegar empréstimo',
    description: 'Capital de giro, antecipação ou financiamento',
    icon: 'loan',
    fields: [
      {
        id: 'totalValue',
        label: 'Valor do empréstimo',
        placeholder: '0',
      },
      {
        id: 'monthlyInstallment',
        label: 'Parcela mensal estimada',
        hint: 'Peça uma simulação ao banco antes de decidir.',
        placeholder: '0',
      },
    ],
  },
  {
    id: 'equipment',
    label: 'Comprar equipamento',
    description: 'Máquina, veículo, computador ou ferramentas',
    icon: 'equipment',
    fields: [
      {
        id: 'totalValue',
        label: 'Valor total do equipamento',
        placeholder: '0',
      },
      {
        id: 'monthlyInstallment',
        label: 'Parcela mensal (se for financiar)',
        hint: 'Preencha para análise de financiamento. Em branco = análise à vista.',
        placeholder: '0',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Engine principal
// ---------------------------------------------------------------------------

function sig(label, value, status, projected = null, projStatus = null) {
  return { label, value, status, projected, projStatus };
}

function cashDaysLabel(days) {
  if (!isFinite(days) || days >= 99) return 'Sem custos fixos registrados';
  if (days <= 0)  return '0 dias (caixa insuficiente)';
  return `${Math.round(days)} dias de operação`;
}

function marginStatus(margin, profile) {
  if (margin < 0)                    return 'bad';
  if (margin < profile.minMargin)    return 'bad';
  if (margin < profile.goodMargin)   return 'warn';
  return 'good';
}

function daysStatus(days, profile) {
  if (days <= 0)                   return 'bad';
  if (days < profile.critDays)     return 'bad';
  if (days < profile.goodDays)     return 'warn';
  return 'good';
}

function debtStatus(ratio, profile) {
  if (ratio > profile.maxDebt)              return 'bad';
  if (ratio > profile.maxDebt * 0.7)        return 'warn';
  return 'good';
}

function applyTrend(verdict, trend, signals) {
  if (trend !== 'declining') return verdict;
  if (verdict === 'can') {
    const anyWarn = signals.some(s => s.status === 'warn' || s.projStatus === 'warn');
    if (anyWarn) return 'careful';
  }
  return verdict;
}

// ---------------------------------------------------------------------------
// Motivos e melhorias — derivados dos signals
// ---------------------------------------------------------------------------

function buildReasons(verdict, signals) {
  if (verdict === 'can') return [];

  const effectiveStatus = s => s.projStatus || s.status;
  const effectiveValue  = s => (s.projected && s.projected !== s.value) ? s.projected : s.value;

  return [...signals]
    .filter(s => effectiveStatus(s) === 'bad' || effectiveStatus(s) === 'warn')
    .sort((a, b) => {
      const order = { bad: 0, warn: 1 };
      return (order[effectiveStatus(a)] ?? 2) - (order[effectiveStatus(b)] ?? 2);
    })
    .slice(0, 3)
    .map(s => {
      const val = effectiveValue(s);
      return s.projected && s.projected !== s.value
        ? `${s.label} ficaria em ${val}`
        : `${s.label}: ${val}`;
    });
}

function buildImprovements(decisionId, verdict, signals, profile) {
  if (verdict === 'can') return [];

  const effectiveStatus = s => s.projStatus || s.status;
  const hasIssue = (labelFrag) =>
    signals.some(s =>
      s.label.toLowerCase().includes(labelFrag) &&
      (effectiveStatus(s) === 'bad' || effectiveStatus(s) === 'warn')
    );

  const improvements = [];
  const hasLoss      = signals.some(s => s.label === 'Resultado líquido' && s.status === 'bad');
  const hasLowMargin = hasIssue('margem');
  const hasLowCash   = hasIssue('caixa');
  const hasHighDebt  = hasIssue('dívida') || hasIssue('divida');

  if (hasLoss)                    improvements.push('Reduzir custos ou aumentar receita para sair do prejuízo');
  if (hasLowMargin && !hasLoss)   improvements.push(`Melhorar margem líquida — meta: acima de ${profile.goodMargin}%`);
  if (hasLowCash)                 improvements.push(`Reforçar caixa até ${profile.goodDays} dias de cobertura operacional`);
  if (hasHighDebt)                improvements.push(`Reduzir dívidas para abaixo de ${Math.round(profile.maxDebt * 0.7)}% do faturamento`);

  if (improvements.length === 0) {
    const fallbacks = {
      hire:      'Aumentar receita antes de expandir equipe — novo custo precisa de retorno claro',
      marketing: 'Primeiro melhore conversão ou margem — marketing com caixa apertado amplifica risco',
      withdraw:  'Estabeleça pró-labore fixo dentro do lucro em vez de retiradas esporádicas',
      loan:      'Defina destino claro para o crédito — só faça empréstimo com retorno previsto',
      stock:     'Negocie prazo com fornecedor para preservar caixa operacional',
      equipment: 'Avalie financiamento em vez de compra à vista para não comprometer capital de giro',
    };
    if (fallbacks[decisionId]) improvements.push(fallbacks[decisionId]);
  }

  return improvements.slice(0, 3);
}

function buildResult(verdict, title, explanation, signals, trendNote, decisionId, profile) {
  const reasons      = buildReasons(verdict, signals);
  const improvements = buildImprovements(decisionId, verdict, signals, profile || SECTOR_PROFILES.default);
  return { verdict, title, explanation, signals, trendNote, reasons, improvements };
}

// ---------------------------------------------------------------------------
// Persistência da última decisão (localStorage por empresa)
// ---------------------------------------------------------------------------

export function lastDecisionKey(businessData) {
  const name = (businessData?.businessName || '').toLowerCase().trim().replace(/\s+/g, '_');
  const seg  = (businessData?.segment || '').toLowerCase().trim();
  return `folego_last_can_${name}__${seg}`;
}

export function saveLastDecision(businessData, data) {
  try { localStorage.setItem(lastDecisionKey(businessData), JSON.stringify(data)); } catch {}
}

export function loadLastDecision(businessData) {
  try {
    const raw = localStorage.getItem(lastDecisionKey(businessData));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function evaluate(decisionId, financialData, fields = {}, businessData = {}, allDiagnoses = []) {
  const hasData =
    financialData &&
    (Number(financialData.revenue) > 0 ||
      Number(financialData.cashBalance) !== 0 ||
      Number(financialData.fixedExpenses) > 0);

  if (!hasData) {
    return {
      verdict: 'nodata',
      title: 'Dados insuficientes',
      explanation: 'Faça um diagnóstico financeiro para usar esta análise. Os dados do negócio são necessários.',
      signals: [],
      trendNote: null,
    };
  }

  const m       = calcMetrics(financialData);
  const profile = getProfile(businessData.segment, businessData.customSegment);
  const trend   = calcTrend(allDiagnoses);
  const note    = TREND_LABELS[trend] || null;

  const ctx = { m, profile, trend, note, fields };

  switch (decisionId) {
    case 'hire':      return evalHire(ctx);
    case 'stock':     return evalStock(ctx);
    case 'marketing': return evalMarketing(ctx);
    case 'withdraw':  return evalWithdraw(ctx);
    case 'loan':      return evalLoan(ctx);
    case 'equipment': return evalEquipment(ctx);
    default:          return null;
  }
}

// ---------------------------------------------------------------------------
// Contratar
// ---------------------------------------------------------------------------

function evalHire({ m, profile, trend, note, fields }) {
  const { netProfit, netMargin, debtRatio, cashBalance, breakEven, revenue,
          fixedExpenses, debtPayment, cogs, investments } = m;

  const monthlyCost = Number(fields.monthlyCost) || 0;
  const monthlyBurn = fixedExpenses + debtPayment;
  const cashDays    = monthlyBurn > 0 ? cashBalance / monthlyBurn * 30 : 99;
  const belowBE     = breakEven > 0 && revenue < breakEven;

  // Projeção pós-contratação
  let pMargin = null, pDays = null, pProfit = null;
  if (monthlyCost > 0) {
    const newFixed  = fixedExpenses + monthlyCost;
    pProfit         = revenue - cogs - newFixed - debtPayment - investments;
    pMargin         = revenue > 0 ? pProfit / revenue * 100 : 0;
    pDays           = (newFixed + debtPayment) > 0 ? cashBalance / (newFixed + debtPayment) * 30 : 99;
  }

  const evalProfit = pProfit !== null ? pProfit : netProfit;
  const evalMargin = pMargin !== null ? pMargin : netMargin;
  const evalDays   = pDays   !== null ? pDays   : cashDays;

  const signals = [
    sig('Resultado líquido',
      netProfit >= 0 ? `Lucro ${formatBRL(netProfit)}` : `Prejuízo ${formatBRL(Math.abs(netProfit))}`,
      netProfit < 0 ? 'bad' : 'good',
      pProfit !== null ? (pProfit >= 0 ? `Lucro ${formatBRL(pProfit)}` : `Prejuízo ${formatBRL(Math.abs(pProfit))}`) : null,
      pProfit !== null ? (pProfit < 0 ? 'bad' : pProfit < netProfit * 0.5 ? 'warn' : 'good') : null,
    ),
    sig('Margem líquida',
      `${netMargin.toFixed(1)}%`,
      marginStatus(netMargin, profile),
      pMargin !== null ? `${pMargin.toFixed(1)}%` : null,
      pMargin !== null ? marginStatus(pMargin, profile) : null,
    ),
    sig('Cobertura de caixa',
      cashDaysLabel(cashDays),
      daysStatus(cashDays, profile),
      pDays !== null ? cashDaysLabel(pDays) : null,
      pDays !== null ? daysStatus(pDays, profile) : null,
    ),
    sig('Ponto de equilíbrio',
      belowBE
        ? `${formatBRL(breakEven - revenue)} abaixo`
        : breakEven > 0 ? `${formatBRL(revenue - breakEven)} acima` : 'Não calculado',
      belowBE ? 'bad' : 'good',
    ),
    sig('Peso das dívidas',
      `${debtRatio.toFixed(1)}% do faturamento`,
      debtStatus(debtRatio, profile),
    ),
  ];

  let verdict, explanation;

  if (evalProfit < 0) {
    verdict = 'cannot';
    explanation = monthlyCost > 0
      ? `Com esse custo, resultado líquido ficaria em ${formatBRL(pProfit)} — prejuízo. O negócio não suporta essa obrigação agora.`
      : 'Empresa no prejuízo. Contratar aumentaria custo fixo sem receita para cobrir.';
  } else if (evalDays < profile.critDays) {
    verdict = 'cannot';
    explanation = monthlyCost > 0
      ? `Após contratar, caixa cobriria apenas ${Math.round(pDays)} dias — risco operacional crítico para ${profile.label}.`
      : `Caixa cobre apenas ${Math.round(cashDays)} dias. Nível crítico para ${profile.label}.`;
  } else if (debtRatio > profile.maxDebt) {
    verdict = 'cannot';
    explanation = `Dívidas consomem ${debtRatio.toFixed(1)}% do faturamento — acima do limite para ${profile.label} (${profile.maxDebt}%).`;
  } else if (evalMargin < profile.minMargin || evalDays < profile.goodDays || belowBE || debtRatio > profile.maxDebt * 0.7) {
    verdict = 'careful';
    explanation = monthlyCost > 0
      ? `Contratação possível. Margem passa para ${pMargin.toFixed(1)}% e caixa para ${Math.round(pDays)} dias — aceitável, mas no limite para ${profile.label}.`
      : `Contratação possível, mas há sinais de fragilidade. Se o cenário piorar, o custo pode virar problema.`;
  } else {
    verdict = 'can';
    explanation = monthlyCost > 0
      ? `Após contratar, negócio mantém margem de ${pMargin.toFixed(1)}% e ${Math.round(pDays)} dias de caixa — saudável para ${profile.label}.`
      : `Negócio com margem e caixa compatíveis com a contratação.`;
  }

  const finalVerdict = applyTrend(verdict, trend, signals);
  const title = finalVerdict === 'can' ? 'Pode' : finalVerdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';
  const fullExpl = finalVerdict !== verdict
    ? explanation + ' Mas a receita está em queda — cautela extra.'
    : explanation;

  return buildResult(finalVerdict, title, fullExpl, signals, note, 'hire', profile);
}

// ---------------------------------------------------------------------------
// Comprar estoque
// ---------------------------------------------------------------------------

function evalStock({ m, profile, trend, note, fields }) {
  const { netProfit, debtRatio, cashBalance, fixedExpenses, debtPayment } = m;

  const totalValue  = Number(fields.totalValue) || 0;
  const monthlyBurn = fixedExpenses + debtPayment;
  const cashDays    = monthlyBurn > 0 ? cashBalance / monthlyBurn * 30 : 99;
  const afterCash   = totalValue > 0 ? cashBalance - totalValue : cashBalance;
  const afterDays   = totalValue > 0 && monthlyBurn > 0 ? afterCash / monthlyBurn * 30 : cashDays;

  const signals = [
    sig('Caixa disponível',
      formatBRL(cashBalance),
      cashBalance <= 0 ? 'bad' : daysStatus(cashDays, profile),
      totalValue > 0 ? formatBRL(afterCash) : null,
      totalValue > 0 ? (afterCash < 0 ? 'bad' : daysStatus(afterDays, profile)) : null,
    ),
    sig('Cobertura de caixa',
      cashDaysLabel(cashDays),
      daysStatus(cashDays, profile),
      totalValue > 0 ? cashDaysLabel(afterDays) : null,
      totalValue > 0 ? daysStatus(afterDays, profile) : null,
    ),
    sig('Resultado líquido',
      netProfit >= 0 ? `Lucro ${formatBRL(netProfit)}` : `Prejuízo ${formatBRL(Math.abs(netProfit))}`,
      netProfit < 0 ? 'bad' : 'good',
    ),
    sig('Peso das dívidas',
      `${debtRatio.toFixed(1)}% do faturamento`,
      debtStatus(debtRatio, profile),
    ),
  ];

  let verdict, explanation;

  if (cashBalance <= 0) {
    verdict = 'cannot';
    explanation = 'Caixa zerado ou negativo. Não há recurso disponível.';
  } else if (totalValue > 0 && afterCash < 0) {
    verdict = 'cannot';
    explanation = `Compra de ${formatBRL(totalValue)} zeraria o caixa. Negocie prazo com o fornecedor ou reduza o volume.`;
  } else if (totalValue > 0 && afterDays < profile.critDays) {
    verdict = 'cannot';
    explanation = `Após a compra, caixa cobriria apenas ${Math.round(afterDays)} dias — risco crítico para ${profile.label}.`;
  } else if (netProfit < 0 || daysStatus(totalValue > 0 ? afterDays : cashDays, profile) === 'warn' || debtRatio > profile.maxDebt * 0.7) {
    verdict = 'careful';
    explanation = totalValue > 0
      ? `Compra possível, mas caixa ficará em ${Math.round(afterDays)} dias — restrito. Garanta que o estoque girará rápido.`
      : `Compra possível, mas caixa está no limite. Negocie prazo com o fornecedor se puder.`;
  } else {
    verdict = 'can';
    explanation = totalValue > 0
      ? `Caixa suporta a compra de ${formatBRL(totalValue)} com ${Math.round(afterDays)} dias de reserva após a operação.`
      : 'Caixa com fôlego suficiente para reposição de estoque.';
  }

  const finalVerdict = applyTrend(verdict, trend, signals);
  const title = finalVerdict === 'can' ? 'Pode' : finalVerdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';
  return buildResult(finalVerdict, title, explanation, signals, note);
}

// ---------------------------------------------------------------------------
// Investir em marketing
// ---------------------------------------------------------------------------

function evalMarketing({ m, profile, trend, note, fields }) {
  const { netProfit, netMargin, cashBalance, fixedExpenses, debtPayment, cogs, revenue, investments } = m;

  const totalValue  = Number(fields.totalValue) || 0;
  const monthlyCost = Number(fields.monthlyCost) || 0;
  const monthlyBurn = fixedExpenses + debtPayment;
  const cashDays    = monthlyBurn > 0 ? cashBalance / monthlyBurn * 30 : 99;
  const belowBE     = m.breakEven > 0 && revenue < m.breakEven;

  // Se tiver custo mensal recorrente, projeta impacto contínuo
  let pMargin = null, pDays = null, pProfit = null;
  if (monthlyCost > 0) {
    const newFixed = fixedExpenses + monthlyCost;
    pProfit        = revenue - cogs - newFixed - debtPayment - investments;
    pMargin        = revenue > 0 ? pProfit / revenue * 100 : 0;
    pDays          = (newFixed + debtPayment) > 0 ? cashBalance / (newFixed + debtPayment) * 30 : 99;
  }

  // Impacto do investimento único no caixa
  const afterCash = totalValue > 0 ? cashBalance - totalValue : cashBalance;
  const afterDays = totalValue > 0 && monthlyBurn > 0 ? afterCash / monthlyBurn * 30 : cashDays;

  const evalDays   = monthlyCost > 0 ? (pDays ?? cashDays) : afterDays;
  const evalMargin = pMargin !== null ? pMargin : netMargin;
  const evalProfit = pProfit !== null ? pProfit : netProfit;

  const signals = [
    sig('Resultado líquido',
      netProfit >= 0 ? `Lucro ${formatBRL(netProfit)}` : `Prejuízo ${formatBRL(Math.abs(netProfit))}`,
      netProfit < 0 ? 'bad' : 'good',
      pProfit !== null ? (pProfit >= 0 ? `Lucro ${formatBRL(pProfit)}` : `Prejuízo ${formatBRL(Math.abs(pProfit))}`) : null,
      pProfit !== null ? (pProfit < 0 ? 'bad' : pProfit < netProfit * 0.5 ? 'warn' : 'good') : null,
    ),
    sig('Margem líquida',
      `${netMargin.toFixed(1)}%`,
      marginStatus(netMargin, profile),
      pMargin !== null ? `${pMargin.toFixed(1)}%` : null,
      pMargin !== null ? marginStatus(pMargin, profile) : null,
    ),
    sig('Cobertura de caixa',
      cashDaysLabel(cashDays),
      daysStatus(cashDays, profile),
      totalValue > 0 || monthlyCost > 0 ? cashDaysLabel(evalDays) : null,
      totalValue > 0 || monthlyCost > 0 ? daysStatus(evalDays, profile) : null,
    ),
    sig('Situação vs. ponto de equilíbrio',
      belowBE ? `Faturamento abaixo do equilíbrio` : 'Acima do ponto de equilíbrio',
      belowBE ? 'warn' : 'good',
    ),
  ];

  let verdict, explanation;

  if (evalProfit < 0) {
    verdict = 'cannot';
    explanation = monthlyCost > 0
      ? `Com o custo mensal do marketing, resultado ficaria em ${formatBRL(pProfit)} — prejuízo. Não é viável como gasto recorrente agora.`
      : 'Empresa no prejuízo. Marketing pode trazer clientes, mas sem margem o problema cresce.';
  } else if (evalDays < profile.critDays) {
    verdict = 'cannot';
    explanation = `Caixa ficaria em nível crítico (${Math.round(evalDays)} dias) após o investimento. Risco alto demais para ${profile.label}.`;
  } else if (belowBE && evalDays < profile.minDays) {
    verdict = 'cannot';
    explanation = 'Abaixo do ponto de equilíbrio com caixa baixo. Marketing sem margem é queimar o que não tem.';
  } else if (evalMargin < profile.minMargin || evalDays < profile.goodDays || belowBE) {
    verdict = 'careful';
    const parts = [];
    if (monthlyCost > 0) parts.push(`margem cairia para ${pMargin.toFixed(1)}%`);
    if (totalValue > 0 && afterDays < profile.goodDays) parts.push(`${Math.round(afterDays)} dias de caixa após`);
    if (belowBE) parts.push('empresa abaixo do ponto de equilíbrio');
    explanation = parts.length > 0
      ? `Possível, mas: ${parts.join(', ')}. Monitore o retorno de perto.`
      : 'Possível, mas margem ou caixa limitados. Comece pequeno e meça o retorno antes de escalar.';
  } else {
    verdict = 'can';
    explanation = monthlyCost > 0
      ? `Com o marketing recorrente, margem mantém em ${pMargin.toFixed(1)}% — compatível com crescimento.`
      : totalValue > 0
        ? `Investimento de ${formatBRL(totalValue)} viável. Caixa ainda em ${Math.round(afterDays)} dias após a operação.`
        : 'Empresa com margem e caixa adequados para investir em crescimento.';
  }

  const finalVerdict = applyTrend(verdict, trend, signals);
  const title = finalVerdict === 'can' ? 'Pode' : finalVerdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';
  return buildResult(finalVerdict, title, explanation, signals, note);
}

// ---------------------------------------------------------------------------
// Tirar dinheiro
// ---------------------------------------------------------------------------

function evalWithdraw({ m, profile, trend, note, fields }) {
  const { netProfit, netMargin, debtRatio, cashBalance, fixedExpenses, debtPayment } = m;

  const totalValue  = Number(fields.totalValue) || 0;
  const monthlyBurn = fixedExpenses + debtPayment;
  const cashDays    = monthlyBurn > 0 ? cashBalance / monthlyBurn * 30 : 99;
  const afterCash   = totalValue > 0 ? cashBalance - totalValue : cashBalance;
  const afterDays   = totalValue > 0 && monthlyBurn > 0 ? afterCash / monthlyBurn * 30 : cashDays;

  const signals = [
    sig('Resultado líquido',
      netProfit >= 0 ? `Lucro ${formatBRL(netProfit)}` : `Prejuízo ${formatBRL(Math.abs(netProfit))}`,
      netProfit < 0 ? 'bad' : 'good',
    ),
    sig('Margem líquida',
      `${netMargin.toFixed(1)}%`,
      marginStatus(netMargin, profile),
    ),
    sig('Caixa disponível',
      formatBRL(cashBalance),
      daysStatus(cashDays, profile),
      totalValue > 0 ? formatBRL(afterCash) : null,
      totalValue > 0 ? (afterCash < 0 ? 'bad' : daysStatus(afterDays, profile)) : null,
    ),
    sig('Cobertura de caixa',
      cashDaysLabel(cashDays),
      daysStatus(cashDays, profile),
      totalValue > 0 ? cashDaysLabel(afterDays) : null,
      totalValue > 0 ? daysStatus(afterDays, profile) : null,
    ),
    sig('Peso das dívidas',
      `${debtRatio.toFixed(1)}% do faturamento`,
      debtStatus(debtRatio, profile),
    ),
  ];

  let verdict, explanation;

  if (netProfit < 0) {
    verdict = 'cannot';
    explanation = 'Empresa no prejuízo. Retirar agora seria tirar do capital operacional — aprofundando o problema.';
  } else if (totalValue > 0 && afterCash < 0) {
    verdict = 'cannot';
    explanation = `Retirada de ${formatBRL(totalValue)} zeraria o caixa. Não há esse valor disponível com segurança.`;
  } else if (totalValue > 0 && afterDays < profile.critDays) {
    verdict = 'cannot';
    explanation = `Após a retirada, caixa ficaria em ${Math.round(afterDays)} dias — nível crítico para ${profile.label}.`;
  } else if (cashDays < profile.minDays) {
    verdict = 'cannot';
    explanation = `Caixa cobre apenas ${Math.round(cashDays)} dias — abaixo do mínimo para ${profile.label}. Retirada agora é risco desnecessário.`;
  } else if (
    netMargin < profile.minMargin ||
    (totalValue > 0 && afterDays < profile.goodDays) ||
    daysStatus(cashDays, profile) === 'warn' ||
    debtRatio > profile.maxDebt * 0.7
  ) {
    verdict = 'careful';
    explanation = totalValue > 0
      ? `Retirada de ${formatBRL(totalValue)} possível. Caixa vai para ${Math.round(afterDays)} dias — limite para ${profile.label}. Considere fracionar.`
      : `Retirada possível, mas margem ou caixa ainda estão no limite. Mantenha o valor conservador.`;
  } else {
    verdict = 'can';
    explanation = totalValue > 0
      ? `Retirada de ${formatBRL(totalValue)} dentro do lucro e caixa compatível para ${profile.label}.`
      : 'Empresa com margem e fôlego adequados para distribuição de resultado.';
  }

  const finalVerdict = applyTrend(verdict, trend, signals);
  const title = finalVerdict === 'can' ? 'Pode' : finalVerdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';
  return buildResult(finalVerdict, title, explanation, signals, note);
}

// ---------------------------------------------------------------------------
// Pegar empréstimo
// ---------------------------------------------------------------------------

function evalLoan({ m, profile, trend, note, fields }) {
  const { netProfit, netMargin, debtRatio, cashBalance, fixedExpenses, debtPayment, cogs, revenue, investments } = m;

  const totalValue         = Number(fields.totalValue) || 0;
  const monthlyInstallment = Number(fields.monthlyInstallment) || 0;
  const monthlyBurn        = fixedExpenses + debtPayment;
  const cashDays           = monthlyBurn > 0 ? cashBalance / monthlyBurn * 30 : 99;

  // Após empréstimo: caixa sobe (recebe o valor), mas dívida mensal sobe
  const afterCash  = totalValue > 0 ? cashBalance + totalValue : cashBalance;
  let pDebtRatio   = null, pNetMargin = null, pNetProfit = null, pDays = null;

  if (monthlyInstallment > 0) {
    const newDebt = debtPayment + monthlyInstallment;
    pDebtRatio    = revenue > 0 ? newDebt / revenue * 100 : 0;
    pNetProfit    = revenue - cogs - fixedExpenses - newDebt - investments;
    pNetMargin    = revenue > 0 ? pNetProfit / revenue * 100 : 0;
    pDays         = (fixedExpenses + newDebt) > 0 ? afterCash / (fixedExpenses + newDebt) * 30 : 99;
  }

  const evalDebtRatio = pDebtRatio  !== null ? pDebtRatio  : debtRatio;
  const evalNetProfit = pNetProfit  !== null ? pNetProfit  : netProfit;
  const evalNetMargin = pNetMargin  !== null ? pNetMargin  : netMargin;

  const signals = [
    sig('Peso atual das dívidas',
      `${debtRatio.toFixed(1)}% do faturamento`,
      debtStatus(debtRatio, profile),
      pDebtRatio !== null ? `${pDebtRatio.toFixed(1)}% do faturamento` : null,
      pDebtRatio !== null ? debtStatus(pDebtRatio, profile) : null,
    ),
    sig('Resultado líquido',
      netProfit >= 0 ? `Lucro ${formatBRL(netProfit)}` : `Prejuízo ${formatBRL(Math.abs(netProfit))}`,
      netProfit < 0 ? 'bad' : 'good',
      pNetProfit !== null ? (pNetProfit >= 0 ? `Lucro ${formatBRL(pNetProfit)}` : `Prejuízo ${formatBRL(Math.abs(pNetProfit))}`) : null,
      pNetProfit !== null ? (pNetProfit < 0 ? 'bad' : 'good') : null,
    ),
    sig('Margem líquida',
      `${netMargin.toFixed(1)}%`,
      marginStatus(netMargin, profile),
      pNetMargin !== null ? `${pNetMargin.toFixed(1)}%` : null,
      pNetMargin !== null ? marginStatus(pNetMargin, profile) : null,
    ),
    sig('Cobertura de caixa',
      cashDaysLabel(cashDays),
      daysStatus(cashDays, profile),
      pDays !== null ? cashDaysLabel(pDays) : totalValue > 0 ? cashDaysLabel(monthlyBurn > 0 ? afterCash / monthlyBurn * 30 : 99) : null,
      pDays !== null ? daysStatus(pDays, profile) : totalValue > 0 ? daysStatus(monthlyBurn > 0 ? afterCash / monthlyBurn * 30 : 99, profile) : null,
    ),
  ];

  let verdict, explanation;

  if (evalDebtRatio > profile.maxDebt) {
    verdict = 'cannot';
    explanation = monthlyInstallment > 0
      ? `Com a parcela, dívidas chegariam a ${pDebtRatio.toFixed(1)}% do faturamento — acima do limite para ${profile.label} (${profile.maxDebt}%).`
      : `Dívidas já em ${debtRatio.toFixed(1)}% — acima do limite para ${profile.label} (${profile.maxDebt}%). Mais crédito agrava a situação.`;
  } else if (evalNetProfit < 0) {
    verdict = 'cannot';
    explanation = monthlyInstallment > 0
      ? `Com a parcela mensal, resultado ficaria em ${formatBRL(pNetProfit)} — prejuízo. Não há margem para cobrir o empréstimo.`
      : 'Empresa no prejuízo. Empréstimo para cobrir despesas correntes é uma armadilha — o problema volta maior.';
  } else if (evalDebtRatio > profile.maxDebt * 0.7 || evalNetMargin < profile.minMargin) {
    verdict = 'careful';
    explanation = monthlyInstallment > 0
      ? `Empréstimo possível. Dívidas iriam para ${pDebtRatio.toFixed(1)}% e margem para ${pNetMargin.toFixed(1)}% — viável mas no limite. Só faça se o destino tiver retorno claro.`
      : 'Crédito possível, mas a situação atual limita a capacidade de pagar. Defina bem o destino antes de contratar.';
  } else {
    verdict = 'can';
    explanation = monthlyInstallment > 0
      ? `Com a parcela, dívidas vão para ${pDebtRatio.toFixed(1)}% e margem para ${pNetMargin.toFixed(1)}% — dentro dos parâmetros para ${profile.label}.`
      : `Dívidas controladas e resultado positivo. Negócio tem capacidade de assumir crédito se o destino for estratégico.`;
  }

  const finalVerdict = applyTrend(verdict, trend, signals);
  const title = finalVerdict === 'can' ? 'Pode' : finalVerdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';
  return buildResult(finalVerdict, title, explanation, signals, note);
}

// ---------------------------------------------------------------------------
// Comprar equipamento
// ---------------------------------------------------------------------------

function evalEquipment({ m, profile, trend, note, fields }) {
  const { netMargin, debtRatio, cashBalance, fixedExpenses, debtPayment, cogs, revenue, investments } = m;

  const totalValue         = Number(fields.totalValue) || 0;
  const monthlyInstallment = Number(fields.monthlyInstallment) || 0;
  const monthlyBurn        = fixedExpenses + debtPayment;
  const cashDays           = monthlyBurn > 0 ? cashBalance / monthlyBurn * 30 : 99;

  const isFinancing = monthlyInstallment > 0;
  const isCash      = totalValue > 0 && !isFinancing;

  // Compra à vista: desconta do caixa
  const afterCash  = isCash ? cashBalance - totalValue : cashBalance;
  const afterDays  = isCash && monthlyBurn > 0 ? afterCash / monthlyBurn * 30 : cashDays;

  // Financiamento: novo compromisso mensal (caixa não é impactado de imediato)
  let pDebtRatio = null, pNetMargin = null, pNetProfit = null, pDays = null;
  if (isFinancing) {
    const newDebt  = debtPayment + monthlyInstallment;
    pDebtRatio     = revenue > 0 ? newDebt / revenue * 100 : 0;
    pNetProfit     = revenue - (revenue - (m.grossProfit)) - fixedExpenses - newDebt - investments;
    // simpler: use existing cogs
    const pNP      = revenue - m.cogs - fixedExpenses - newDebt - investments;
    pNetMargin     = revenue > 0 ? pNP / revenue * 100 : 0;
    pNetProfit     = pNP;
    pDays          = (fixedExpenses + newDebt) > 0 ? cashBalance / (fixedExpenses + newDebt) * 30 : 99;
  }

  const evalDays      = isFinancing ? (pDays ?? cashDays) : afterDays;
  const evalDebtRatio = pDebtRatio  !== null ? pDebtRatio : debtRatio;
  const evalMargin    = pNetMargin  !== null ? pNetMargin : netMargin;

  const signals = [
    sig('Caixa disponível',
      formatBRL(cashBalance),
      daysStatus(cashDays, profile),
      isCash && totalValue > 0 ? formatBRL(afterCash) : null,
      isCash && totalValue > 0 ? (afterCash < 0 ? 'bad' : daysStatus(afterDays, profile)) : null,
    ),
    sig('Cobertura de caixa',
      cashDaysLabel(cashDays),
      daysStatus(cashDays, profile),
      (isCash && totalValue > 0) || isFinancing ? cashDaysLabel(evalDays) : null,
      (isCash && totalValue > 0) || isFinancing ? daysStatus(evalDays, profile) : null,
    ),
    sig('Margem líquida',
      `${netMargin.toFixed(1)}%`,
      marginStatus(netMargin, profile),
      pNetMargin !== null ? `${pNetMargin.toFixed(1)}%` : null,
      pNetMargin !== null ? marginStatus(pNetMargin, profile) : null,
    ),
    sig('Peso das dívidas',
      `${debtRatio.toFixed(1)}% do faturamento`,
      debtStatus(debtRatio, profile),
      pDebtRatio !== null ? `${pDebtRatio.toFixed(1)}% do faturamento` : null,
      pDebtRatio !== null ? debtStatus(pDebtRatio, profile) : null,
    ),
  ];

  let verdict, explanation;

  if (isCash && afterCash < 0) {
    verdict = 'cannot';
    explanation = `Compra à vista de ${formatBRL(totalValue)} zeraria o caixa. Considere financiar para preservar o capital de giro.`;
  } else if (evalDays < profile.critDays) {
    verdict = 'cannot';
    explanation = isFinancing
      ? `Com a parcela mensal, caixa cobriria apenas ${Math.round(pDays)} dias — nível crítico para ${profile.label}.`
      : `Após a compra, caixa cobriria apenas ${Math.round(afterDays)} dias — risco crítico para ${profile.label}.`;
  } else if (evalDebtRatio > profile.maxDebt) {
    verdict = 'cannot';
    explanation = `Dívidas chegariam a ${pDebtRatio.toFixed(1)}% — acima do limite para ${profile.label}. Financiamento não é viável agora.`;
  } else if (evalMargin < profile.minMargin || evalDays < profile.goodDays || evalDebtRatio > profile.maxDebt * 0.7) {
    verdict = 'careful';
    explanation = isFinancing
      ? `Compra viável via financiamento. Parcela levaria dívidas a ${pDebtRatio.toFixed(1)}% e margem a ${pNetMargin.toFixed(1)}% — no limite para ${profile.label}.`
      : isCash && totalValue > 0
        ? `Compra à vista possível. Caixa ficará em ${Math.round(afterDays)} dias — restrito. Avalie se o retorno virá no curto prazo.`
        : `Compra possível, mas margem ou caixa estão no limite para ${profile.label}.`;
  } else {
    verdict = 'can';
    explanation = isFinancing
      ? `Financiamento viável. Com a parcela, dívidas vão para ${pDebtRatio.toFixed(1)}% e margem para ${pNetMargin.toFixed(1)}% — dentro do saudável para ${profile.label}.`
      : isCash && totalValue > 0
        ? `Compra à vista de ${formatBRL(totalValue)} compatível com o caixa. Reserva de ${Math.round(afterDays)} dias após a operação.`
        : `Caixa e margem adequados para a aquisição.`;
  }

  const finalVerdict = applyTrend(verdict, trend, signals);
  const title = finalVerdict === 'can' ? 'Pode' : finalVerdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';
  return buildResult(finalVerdict, title, explanation, signals, note);
}
