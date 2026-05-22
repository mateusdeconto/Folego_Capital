import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getAnthropic, MODEL, isOverloadError } from '../lib/anthropic.js';
import { openSSE } from '../lib/sse.js';
import { calcMetrics } from '../lib/metrics.js';
import { requireAuth } from '../middleware/auth.js';
import { getMacroData } from '../lib/macroData.js';
import { CFO_PERSONA } from '../lib/persona.js';
import { formatBRL, sanitizeText } from '../lib/utils.js';

const router = Router();

// 5 diagnósticos por usuário a cada 10 minutos (keyGenerator usa user.id depois do requireAuth).
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitos diagnósticos em sequência. Aguarde alguns minutos.' },
});

// ---------------------------------------------------------------------------
// Helpers para JSON estruturado — emitido como evento SSE ao final do stream.
// ---------------------------------------------------------------------------

/**
 * Divide o markdown em seções nomeadas.
 * Depende dos títulos exatos gerados pelo prompt: Resumo Executivo,
 * Pontos de Atenção, O que está funcionando.
 */
function parseSections(text) {
  const sectionDefs = [
    { key: 'executive_summary', marker: 'Resumo Executivo' },
    { key: 'attention_points',  marker: 'Pontos de Atenção' },
    { key: 'working_well',      marker: 'O que está funcionando' },
  ];

  const result = {};

  for (let i = 0; i < sectionDefs.length; i++) {
    const { key, marker } = sectionDefs[i];
    const startRe = new RegExp(`##[^#\\n]*${marker}[^\\n]*\\n`);
    const startMatch = startRe.exec(text);
    if (!startMatch) continue;

    const contentStart = startMatch.index + startMatch[0].length;
    const nextMarker = sectionDefs[i + 1]?.marker;
    const endRe = nextMarker ? new RegExp(`##[^#\\n]*${nextMarker}`) : null;
    const endMatch = endRe ? endRe.exec(text.slice(contentStart)) : null;
    const contentEnd = endMatch ? contentStart + endMatch.index : text.length;

    result[key] = text.slice(contentStart, contentEnd).trim();
  }

  return result;
}

/**
 * Extrai a classificação de saúde como chave normalizada.
 * Espelha a lógica de extractHealthStatus em frontend/src/lib/export.js.
 */
function extractHealthKey(text) {
  if (!text) return null;
  if (text.includes('Saudável')) return 'healthy';
  if (text.includes('Estável'))  return 'stable';
  if (text.includes('Atenção'))  return 'attention';
  if (text.includes('Crítica'))  return 'critical';
  return null;
}

function buildItemsList(items) {
  if (!items || items.length === 0) return '  (sem detalhamento)';
  return items.map(i => `  • ${i.desc}: ${formatBRL(i.value)}`).join('\n');
}

// Benchmarks setoriais baseados em dados SEBRAE (Perfil dos Pequenos Negócios,
// Sobrevivência das Empresas, pesquisas setoriais) — atualizados manualmente ~1x/ano.
const SECTOR_BENCHMARKS = {
  restaurante: {
    name: 'Restaurante / Alimentação',
    grossMargin:    [55, 70],
    netMargin:      [3, 9],
    cmvPct:         [28, 35],
    fixedCostPct:   [30, 42],
    laborPct:       [28, 38],
    rentPct:        [8, 12],
    breakEvenPct:   [68, 82],
    survivalRate2y: 52,
    tip: 'Recorrência e ticket médio são os indicadores mais importantes.',
  },
  varejo: {
    name: 'Varejo / Comércio',
    grossMargin:    [25, 42],
    netMargin:      [2, 8],
    cmvPct:         [55, 72],
    fixedCostPct:   [18, 28],
    laborPct:       [10, 18],
    rentPct:        [6, 10],
    breakEvenPct:   [72, 88],
    survivalRate2y: 48,
    tip: 'Giro de estoque e inadimplência são críticos para o fluxo de caixa.',
  },
  servicos: {
    name: 'Serviços',
    grossMargin:    [38, 60],
    netMargin:      [8, 18],
    cmvPct:         [25, 45],
    fixedCostPct:   [22, 35],
    laborPct:       [30, 45],
    rentPct:        [3, 8],
    breakEvenPct:   [55, 72],
    survivalRate2y: 56,
    tip: 'Precificação por valor e cartela de clientes recorrentes são o diferencial.',
  },
  saude: {
    name: 'Saúde / Bem-estar',
    grossMargin:    [45, 62],
    netMargin:      [6, 14],
    cmvPct:         [22, 38],
    fixedCostPct:   [28, 40],
    laborPct:       [32, 48],
    rentPct:        [5, 10],
    breakEvenPct:   [58, 75],
    survivalRate2y: 60,
    tip: 'Fidelização e agenda cheia são mais importantes que aquisição de novos clientes.',
  },
  beleza: {
    name: 'Beleza / Estética',
    grossMargin:    [40, 58],
    netMargin:      [7, 14],
    cmvPct:         [18, 32],
    fixedCostPct:   [28, 40],
    laborPct:       [35, 50],
    rentPct:        [6, 10],
    breakEvenPct:   [60, 78],
    survivalRate2y: 54,
    tip: 'Recorrência e ticket médio por atendimento são os drivers de crescimento.',
  },
  tecnologia: {
    name: 'Tecnologia / Digital',
    grossMargin:    [50, 72],
    netMargin:      [5, 18],
    cmvPct:         [12, 32],
    fixedCostPct:   [30, 48],
    laborPct:       [40, 60],
    rentPct:        [2, 5],
    breakEvenPct:   [50, 68],
    survivalRate2y: 62,
    tip: 'MRR (receita recorrente mensal) e custo de aquisição de cliente são métricas-chave.',
  },
  construcao: {
    name: 'Construção / Reforma',
    grossMargin:    [18, 32],
    netMargin:      [4, 12],
    cmvPct:         [62, 78],
    fixedCostPct:   [10, 22],
    laborPct:       [28, 42],
    rentPct:        [1, 4],
    breakEvenPct:   [75, 90],
    survivalRate2y: 44,
    tip: 'Controle de obra e gestão de contratos evitam o principal risco do setor: estouro de custo.',
  },
  educacao: {
    name: 'Educação / Cursos',
    grossMargin:    [45, 62],
    netMargin:      [4, 12],
    cmvPct:         [18, 38],
    fixedCostPct:   [32, 48],
    laborPct:       [35, 50],
    rentPct:        [5, 12],
    breakEvenPct:   [62, 80],
    survivalRate2y: 55,
    tip: 'Taxa de retenção de alunos e NPS são mais importantes que matrículas novas.',
  },
  industria: {
    name: 'Indústria / Fabricação',
    grossMargin:    [22, 40],
    netMargin:      [4, 10],
    cmvPct:         [55, 72],
    fixedCostPct:   [15, 28],
    laborPct:       [20, 35],
    rentPct:        [3, 8],
    breakEvenPct:   [70, 88],
    survivalRate2y: 50,
    tip: 'Eficiência produtiva e negociação com fornecedores definem competitividade.',
  },
  outro: {
    name: 'Outro segmento',
    grossMargin:    [30, 48],
    netMargin:      [5, 12],
    cmvPct:         [38, 62],
    fixedCostPct:   [20, 35],
    laborPct:       [25, 40],
    rentPct:        [3, 8],
    breakEvenPct:   [62, 80],
    survivalRate2y: 52,
    tip: 'Conheça bem seus indicadores principais antes de crescer.',
  },
};

// Exporta para outros módulos que possam precisar (ex: frontend via SSR futuro)
export { SECTOR_BENCHMARKS };

// Texto estático de todos os benchmarks — calculado uma vez no boot, cacheável pela Anthropic.
const BENCHMARKS_SYSTEM_TEXT = Object.entries(SECTOR_BENCHMARKS).map(([key, b]) =>
  `**${b.name}** (segmento: ${key})\n` +
  `- Margem Bruta típica: ${b.grossMargin[0]}–${b.grossMargin[1]}%\n` +
  `- Margem Líquida típica: ${b.netMargin[0]}–${b.netMargin[1]}%\n` +
  `- CMV/Receita típico: ${b.cmvPct[0]}–${b.cmvPct[1]}%\n` +
  `- Despesas Fixas típicas: ${b.fixedCostPct[0]}–${b.fixedCostPct[1]}% da receita\n` +
  `- Custo de pessoal: ${b.laborPct[0]}–${b.laborPct[1]}% da receita\n` +
  `- Aluguel típico: ${b.rentPct[0]}–${b.rentPct[1]}% da receita\n` +
  `- Ponto de equilíbrio típico: ${b.breakEvenPct[0]}–${b.breakEvenPct[1]}% da capacidade\n` +
  `- Taxa de sobrevivência (2 anos): ${b.survivalRate2y}%\n` +
  `- Dica setorial: ${b.tip}`
).join('\n\n');

// System prompt cacheável: CFO_PERSONA + todos os benchmarks (>1024 tokens — atinge mínimo da Anthropic).
// Anthropic armazena por até 5 min; cada cache hit custa 10% do preço normal de input tokens.
const DIAGNOSE_SYSTEM = [
  {
    type: 'text',
    text: `${CFO_PERSONA}\n\nBENCHMARKS SETORIAIS — SEBRAE (PMEs brasileiras, atualizados ~1x/ano):\n\n${BENCHMARKS_SYSTEM_TEXT}`,
    cache_control: { type: 'ephemeral' },
  },
];

function buildMacroBlock(macro) {
  if (!macro) return '';
  const selicMensal = (parseFloat(macro.selic.value) / 12).toFixed(2);
  const fallbackNote = macro.selic.isFallback
    ? '\n(Nota: valores estimados — API BCB temporariamente indisponível)'
    : '';
  return `
CONTEXTO MACROECONÔMICO ATUAL (Banco Central do Brasil):
- Taxa Selic: ${macro.selic.value}% ao ano (≈ ${selicMensal}%/mês) — referência de custo para dívidas e investimentos
- IPCA (inflação): ${macro.ipca.value}% — corrói margem real se preços não acompanharem
- Câmbio USD/BRL: R$ ${macro.usdBrl.value} — relevante para negócios com insumos importados${fallbackNote}
Use esses dados no diagnóstico: se há dívidas, compare o custo mensal com a Selic; se custos estão subindo, mencione o IPCA como fator externo.`;
}

function buildDiagnosisPrompt(input, macroData) {
  const m = calcMetrics(input);
  const { businessName, segment, fixedExpensesItems, debtPaymentItems, mixedAccounts } = input;

  const bench = SECTOR_BENCHMARKS[segment] || SECTOR_BENCHMARKS.outro;
  const actualCmvPct   = m.revenue > 0 ? ((m.cogs / m.revenue) * 100) : 0;
  const actualFixedPct = m.revenue > 0 ? ((m.fixedExpenses / m.revenue) * 100) : 0;

  // Só os valores reais da empresa — os benchmarks completos do setor já estão no system prompt cacheado.
  const benchmarkBlock = `
COMPARAÇÃO VS BENCHMARK — segmento "${segment}" (use os benchmarks do contexto do sistema):
- Margem Bruta real: ${m.grossMargin.toFixed(1)}% ${m.grossMargin >= bench.grossMargin[0] ? '✓ dentro da média' : '⚠ abaixo da média'}
- Margem Líquida real: ${m.netMargin.toFixed(1)}% ${m.netMargin >= bench.netMargin[0] ? '✓ dentro da média' : '⚠ abaixo da média'}
- CMV/Receita real: ${actualCmvPct.toFixed(1)}% ${actualCmvPct <= bench.cmvPct[1] ? '✓ dentro da média' : '⚠ acima da média'}
- Despesas Fixas/Receita real: ${actualFixedPct.toFixed(1)}% ${actualFixedPct <= bench.fixedCostPct[1] ? '✓ dentro da média' : '⚠ acima da média'}
Use os benchmarks completos do segmento (no contexto do sistema) para contextualizar o desempenho da empresa em cada seção.`;

  const macroBlock = buildMacroBlock(macroData);

  return `EMPRESA: ${businessName}
SEGMENTO: ${segment}

DADOS FINANCEIROS DO MÊS:
- Receita Bruta: ${formatBRL(m.revenue)}
- Custo das Vendas (CMV): ${formatBRL(m.cogs)}
- Lucro Bruto: ${formatBRL(m.grossProfit)} (Margem: ${m.grossMargin.toFixed(1)}%)

Despesas Fixas Operacionais: ${formatBRL(m.fixedExpenses)}
${buildItemsList(fixedExpensesItems)}

- EBITDA / Resultado Operacional: ${formatBRL(m.ebitda)}
- Saldo de Caixa: ${formatBRL(m.cashBalance)}

Dívidas / Parcelas Mensais: ${formatBRL(m.debtPayment)}
${buildItemsList(debtPaymentItems)}

- Investimentos na Empresa (capex / reinvestimento — não reduz lucro, reduz caixa): ${formatBRL(m.investments)}
- Contas a Receber: ${formatBRL(m.accountsReceivable)}
- Mistura conta pessoal/PJ: ${mixedAccounts ? 'SIM — risco crítico de gestão' : 'Não (contas separadas)'}

${benchmarkBlock}
${macroBlock}

CÁLCULOS AUTOMATIZADOS (use esses valores nos textos):
- Lucro Líquido (receita − custos − despesas fixas − dívidas): ${formatBRL(m.netProfit)}
- Margem Líquida: ${m.netMargin.toFixed(1)}%
- Índice de Endividamento: ${m.debtRatio.toFixed(1)}%
- Ponto de Equilíbrio: ${formatBRL(m.breakEven)} (precisa faturar ao menos isso para não ter prejuízo)

CLASSIFICAÇÃO DA SAÚDE FINANCEIRA (use apenas uma):
- 🔴 Crítica: Margem Líquida < 0% OU caixa negativo
- 🟡 Atenção: Margem Líquida entre 0-5% OU endividamento > 30%
- 🟢 Estável: Margem Líquida entre 5-10% E endividamento < 30%
- ✅ Saudável: Margem Líquida > 10% E endividamento < 20% E caixa positivo

GERE O DIAGNÓSTICO em português, em exatamente 3 seções com os títulos EXATOS abaixo:

## 🏢 Resumo Executivo
[3 parágrafos curtos. Explique como está o negócio em linguagem de dono. Mencione obrigatoriamente: classificação de saúde financeira (ex: "Saúde Financeira: 🟡 Atenção"), o lucro líquido real (o que vai pro bolso), o ponto de equilíbrio, e como a empresa se compara à média setorial em pelo menos uma métrica. Tom direto e humano.]

## ⚠️ Pontos de Atenção
[Até 3 alertas no formato:
• **Nome do problema**: o que está acontecendo e por que é preocupante — use os números reais.
Se não houver problemas graves, diga isso e elogie.]

## ✅ O que está funcionando
[Até 2 pontos positivos no formato:
• **Ponto forte**: por que esse número é bom e o que significa na prática.
Se quase nada estiver bom, seja honesto mas encorajador.]

REGRAS ABSOLUTAS:
- NUNCA use jargão técnico sem explicar entre parênteses. Ex: "margem bruta (quanto sobra depois de pagar o que você vendeu)"
- Tom: direto, encorajador, humano — como um amigo que entende de finanças
- Use os números reais em reais (R$) nas explicações, não só percentuais
- Cada seção: máximo 200 palavras
- Não repita informações entre seções
- Comece DIRETO com ## 🏢 Resumo Executivo, sem cabeçalho extra antes`;
}

function sanitizeBody(raw) {
  const body = raw || {};
  return {
    ...body,
    businessName: sanitizeText(body.businessName, 100),
    segment: sanitizeText(body.segment, 50),
    customSegment: sanitizeText(body.customSegment, 80),
    fixedExpensesItems: Array.isArray(body.fixedExpensesItems)
      ? body.fixedExpensesItems.slice(0, 30).map(i => ({
          desc: sanitizeText(i?.desc, 100),
          value: Number(i?.value) || 0,
        }))
      : [],
    debtPaymentItems: Array.isArray(body.debtPaymentItems)
      ? body.debtPaymentItems.slice(0, 30).map(i => ({
          desc: sanitizeText(i?.desc, 100),
          value: Number(i?.value) || 0,
        }))
      : [],
  };
}

router.post('/', requireAuth, limiter, async (req, res) => {
  const body = sanitizeBody(req.body);
  const { businessName, segment, revenue } = body;

  if (!businessName || !segment || revenue === undefined) {
    return res.status(400).json({ error: 'Dados insuficientes para gerar o diagnóstico.' });
  }

  req.body = body; // usa versão sanitizada no restante do handler

  // Busca macro em paralelo — max 5s por fetch, nunca bloqueia
  const macroData = await getMacroData();

  const sse = openSSE(res);

  // Primeiro evento SSE: macro data (frontend captura antes do texto)
  sse.sendMeta({ macro_data: macroData });

  const prompt = buildDiagnosisPrompt(req.body, macroData);

  // Cancelamento: se cliente fecha aba, aborta o stream da Anthropic
  const ac = new AbortController();
  req.on('close', () => ac.abort());

  const MAX_RETRIES = 6;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = await getAnthropic().messages.stream({
        model: MODEL,
        max_tokens: 1500,
        system: DIAGNOSE_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }, { signal: ac.signal });

      let fullText = '';
      try {
        for await (const chunk of stream) {
          if (ac.signal.aborted) return;
          if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            const text = chunk.delta.text;
            fullText += text;
            sse.sendText(text);
          }
        }
      } catch (streamErr) {
        if (ac.signal.aborted) return;
        throw streamErr;
      }

      // Emite JSON estruturado antes do [DONE] — frontend pode usar para
      // parsing, gráficos e exportação sem depender de regex sobre markdown.
      if (fullText) {
        const m = calcMetrics(req.body);
        sse.sendMeta({
          json_result: {
            healthStatus: extractHealthKey(fullText),
            sections: parseSections(fullText),
            metrics: {
              revenue:            m.revenue,
              grossProfit:        m.grossProfit,
              grossMargin:        m.grossMargin,
              ebitda:             m.ebitda,
              netProfit:          m.netProfit,
              netMargin:          m.netMargin,
              debtRatio:          m.debtRatio,
              breakEven:          m.breakEven,
              cashBalance:        m.cashBalance,
              accountsReceivable: m.accountsReceivable,
            },
          },
        });
      }

      sse.end();
      return;
    } catch (error) {
      if (ac.signal.aborted) return;
      console.error(`[diagnose] tentativa ${attempt}/${MAX_RETRIES}:`, error.status, error.message);

      if (isOverloadError(error) && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 4000 * attempt));
        continue;
      }

      let msg;
      if (error.status === 401)        msg = 'Chave de API inválida. Contate o suporte.';
      else if (isOverloadError(error)) msg = 'A IA está temporariamente sobrecarregada. Aguarde alguns segundos e tente novamente.';
      else                             msg = 'Erro ao gerar diagnóstico. Tente novamente em instantes.';

      sse.sendError(msg);
      sse.end();
      return;
    }
  }
});

export default router;
