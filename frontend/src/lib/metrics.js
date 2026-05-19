/**
 * Cálculo unificado de métricas — ESPELHO do backend/lib/metrics.js.
 * Manter os dois sincronizados. Mudou um, muda o outro.
 */

export function calcMetrics(f = {}) {
  const revenue            = Number(f.revenue)            || 0;
  const cogs               = Number(f.cogs)               || 0;
  const fixedExpenses      = Number(f.fixedExpenses)      || 0;
  const debtPayment        = Number(f.debtPayment)        || 0;
  const investments        = Number(f.investments)        || 0;
  const cashBalance        = Number(f.cashBalance)        || 0;
  const accountsReceivable = Number(f.accountsReceivable) || 0;

  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const ebitda      = grossProfit - fixedExpenses;
  const netProfit   = ebitda - debtPayment - investments;
  const netMargin   = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const debtRatio   = revenue > 0 ? (debtPayment / revenue) * 100 : 0;
  const breakEven   = grossMargin > 0 ? fixedExpenses / (grossMargin / 100) : 0;

  return {
    revenue, cogs, fixedExpenses, debtPayment, investments, cashBalance, accountsReceivable,
    grossProfit, grossMargin, ebitda, netProfit, netMargin, debtRatio, breakEven,
  };
}

export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function generateWeeklyPlan(metrics, financialData = {}) {
  const {
    netProfit, netMargin, debtRatio, cashBalance, breakEven,
    grossMargin, accountsReceivable, revenue, fixedExpenses, debtPayment,
  } = metrics;

  const mixedAccounts  = financialData.mixedAccounts || false;
  const fixedPct       = revenue > 0 ? (fixedExpenses / revenue) * 100 : 0;
  const receivablePct  = revenue > 0 ? (accountsReceivable / revenue) * 100 : 0;
  const safeBreakEven  = breakEven > 0 ? breakEven : null;

  const candidates = [];

  if (netProfit < 0) {
    candidates.push({
      score: 100,
      action: 'Identifique e elimine a maior despesa não essencial esta semana',
      reason: `Resultado líquido negativo em ${formatBRL(netProfit)} — o negócio gasta mais do que fatura.`,
      impact: 'Cada real cortado em fixos vira lucro direto, sem precisar vender mais.',
    });
  }

  if (revenue > 0 && safeBreakEven && revenue < safeBreakEven) {
    candidates.push({
      score: 95,
      action: `Foque em fechar ${formatBRL(safeBreakEven - revenue)} em novas vendas esta semana`,
      reason: `Receita (${formatBRL(revenue)}) está ${formatBRL(safeBreakEven - revenue)} abaixo do ponto de equilíbrio (${formatBRL(safeBreakEven)}).`,
      impact: 'Cruzar o ponto de equilíbrio elimina o risco de fechar o mês no vermelho.',
    });
  }

  if (debtRatio > 30) {
    candidates.push({
      score: 85,
      action: 'Ligue para o banco esta semana e solicite renegociação das parcelas',
      reason: `Parcelas de dívidas consomem ${debtRatio.toFixed(0)}% do faturamento — acima dos 30% recomendados.`,
      impact: 'Reduzir a parcela mensal libera caixa imediato sem precisar vender mais.',
    });
  }

  if (safeBreakEven && cashBalance < safeBreakEven * 0.3) {
    candidates.push({
      score: 80,
      action: `Defina uma reserva mínima de ${formatBRL(safeBreakEven * 0.5)} e não toque nela`,
      reason: `Saldo atual (${formatBRL(cashBalance)}) cobre menos de 10 dias de operação — qualquer imprevisto vira crise.`,
      impact: 'Com 15 dias de custos em reserva você negocia com fornecedores sem pressão.',
    });
  }

  if (receivablePct > 40) {
    candidates.push({
      score: 75,
      action: 'Acione cobrança: ligue hoje para os 3 maiores clientes em atraso',
      reason: `${formatBRL(accountsReceivable)} parados em contas a receber — mais de 40% do faturamento travado.`,
      impact: 'Receber metade disso esta semana pode resolver o problema de caixa sem nova venda.',
    });
  }

  if (revenue > 0 && grossMargin < 20) {
    candidates.push({
      score: 70,
      action: 'Revise o preço dos 3 produtos ou serviços mais vendidos',
      reason: `Margem bruta de ${grossMargin.toFixed(1)}% é muito baixa — quase não sobra após cobrir o custo do que você vende.`,
      impact: 'Aumentar 5% no preço pode dobrar a margem bruta se os custos não mudarem.',
    });
  }

  if (mixedAccounts) {
    candidates.push({
      score: 65,
      action: 'Abra uma conta PJ separada (Nubank PJ, Inter ou Stone — gratuitas)',
      reason: 'Mistura de conta pessoal e empresarial impede saber se o negócio dá lucro de verdade.',
      impact: 'Com contas separadas você enxerga o resultado real do negócio — base para toda decisão.',
    });
  }

  if (fixedPct > 40 && !candidates.find(c => c.score === 100)) {
    candidates.push({
      score: 60,
      action: 'Liste todas as despesas fixas e elimine pelo menos uma',
      reason: `Despesas fixas consomem ${fixedPct.toFixed(0)}% da receita — acima do ideal de 35%.`,
      impact: 'Cortar R$ 500/mês em fixos equivale a vender mais R$ 500 — sem esforço de vendas.',
    });
  }

  // Fallbacks para negócios saudáveis
  if (candidates.length < 3) {
    candidates.push({
      score: 40,
      action: 'Identifique seus 3 clientes que mais compram e ligue para eles',
      reason: 'Clientes fiéis custam menos para manter do que novos clientes para adquirir.',
      impact: 'Aumentar frequência de compra dos melhores clientes é a forma mais rápida de crescer receita.',
    });
  }
  if (candidates.length < 3) {
    candidates.push({
      score: 35,
      action: 'Documente de onde veio cada real de receita este mês',
      reason: 'Saber o que funciona permite replicar e crescer com segurança.',
      impact: 'Negócios que medem suas fontes de receita crescem 2x mais rápido que os que não medem.',
    });
  }
  if (candidates.length < 3) {
    candidates.push({
      score: 30,
      action: 'Defina uma meta de faturamento para o próximo mês e escreva em algum lugar visível',
      reason: 'Metas escritas têm 3x mais chance de serem atingidas do que metas apenas pensadas.',
      impact: 'Uma meta clara orienta decisões semanais — o que aceitar, o que recusar, o que priorizar.',
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const actions = candidates.slice(0, 3).map((c, i) => ({ ...c, priority: i + 1 }));

  let mainRisk;
  if (netProfit < 0) {
    mainRisk = { level: 'critical', text: `Resultado negativo de ${formatBRL(Math.abs(netProfit))} — o negócio está consumindo caixa todo mês.` };
  } else if (revenue > 0 && safeBreakEven && revenue < safeBreakEven) {
    mainRisk = { level: 'critical', text: `Faturamento ${formatBRL(safeBreakEven - revenue)} abaixo do ponto de equilíbrio — risco de fechar o mês no vermelho.` };
  } else if (debtRatio > 30) {
    mainRisk = { level: 'warn', text: `Dívidas comprometendo ${debtRatio.toFixed(0)}% do faturamento — acima do limite saudável de 30%.` };
  } else if (safeBreakEven && cashBalance < safeBreakEven * 0.3) {
    mainRisk = { level: 'warn', text: `Caixa baixo: ${formatBRL(cashBalance)} cobre menos de 10 dias de operação.` };
  } else if (receivablePct > 40) {
    mainRisk = { level: 'warn', text: `${formatBRL(accountsReceivable)} em contas a receber — dinheiro que é seu mas ainda não está no caixa.` };
  } else {
    mainRisk = { level: 'ok', text: 'Nenhum risco crítico identificado. Foco em crescer com consistência.' };
  }

  return { mainRisk, actions };
}

export function formatBRLCompact(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `R$ ${(n / 1_000).toFixed(1)}k`;
  return formatBRL(n);
}
