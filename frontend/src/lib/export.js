import { calcMetrics, formatBRL } from './metrics.js';
import XLSXStyle from 'xlsx-js-style';

export function formatReferenceMonth(referenceMonth) {
  if (!referenceMonth) return new Date().toLocaleDateString('pt-BR');
  const [year, month] = referenceMonth.split('-');
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function applyInlineMarkdown(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function stripLeadingEmoji(text) {
  return text.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*/u, '');
}

function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${escapeHtml(stripLeadingEmoji(trimmed.slice(3)))}</h2>`;
      continue;
    }
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${applyInlineMarkdown(trimmed.slice(2))}</li>`;
      continue;
    }
    if (!trimmed) { if (inList) { html += '</ul>'; inList = false; } continue; }
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${applyInlineMarkdown(trimmed)}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

function extractHealthStatus(text) {
  if (!text) return null;
  if (text.includes('Saudável')) return { label: 'Saudável' };
  if (text.includes('Estável'))  return { label: 'Estável' };
  if (text.includes('Atenção'))  return { label: 'Atenção' };
  if (text.includes('Crítica'))  return { label: 'Crítica' };
  return null;
}

// ─── DRE em Excel ─────────────────────────────────────────────────────────
const BRL_FMT = '"R$"#,##0.00';

const S = {
  title:      { font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: '1F2433' } }, alignment: { horizontal: 'left', indent: 1, vertical: 'center' } },
  section:    { font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '2C5DEB' } }, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } } },
  total:      { font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '13172A' } }, border: { top: { style: 'thin', color: { rgb: '7A8294' } } } },
  totalMoney: { font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '13172A' } }, numFmt: BRL_FMT, border: { top: { style: 'thin', color: { rgb: '7A8294' } } } },
  totalPct:   { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: '535B6E' } }, border: { top: { style: 'thin', color: { rgb: '7A8294' } } } },
  label:      { font: { name: 'Calibri', sz: 11, color: { rgb: '363C4D' } } },
  money:      { font: { name: 'Calibri', sz: 11, color: { rgb: '13172A' } }, numFmt: BRL_FMT },
  pct:        { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: '535B6E' } } },
  meta:       { font: { name: 'Calibri', sz: 11, color: { rgb: '535B6E' } } },
  footer:     { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: '9CA3AF' } } },
  varHeader:  { font: { name: 'Calibri', sz: 10, bold: true, italic: true, color: { rgb: '535B6E' } } },
  varPos:     { font: { name: 'Calibri', sz: 10, color: { rgb: '059669' } } },
  varNeg:     { font: { name: 'Calibri', sz: 10, color: { rgb: 'DC2626' } } },
  varNeut:    { font: { name: 'Calibri', sz: 10, color: { rgb: '9CA3AF' } } },
  varPosBold: { font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '059669' } } },
  varNegBold: { font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'DC2626' } } },
  varNeutBold:{ font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '9CA3AF' } } },
};

function c(v, s, t) {
  return { v, s, t: t || (typeof v === 'number' ? 'n' : 's') };
}

function fmtDelta(v) {
  const sign = v > 0 ? '+' : '';
  return sign + formatBRL(v);
}

// higherBetter=true → verde quando delta>0; false → verde quando delta<0
function deltaCell(delta, higherBetter = true, bold = false) {
  if (delta === null || delta === undefined) return c('', {});
  const neutral = delta === 0;
  const good    = higherBetter ? delta > 0 : delta < 0;
  const posKey  = bold ? 'varPosBold' : 'varPos';
  const negKey  = bold ? 'varNegBold' : 'varNeg';
  const neuKey  = bold ? 'varNeutBold': 'varNeut';
  const style   = neutral ? S[neuKey] : good ? S[posKey] : S[negKey];
  return c(fmtDelta(delta), style);
}

// ─── Glossário ────────────────────────────────────────────────────────────
const GLOSSARY = [
  ['Termo', 'O que significa (em palavras simples)', 'Por que isso importa para o seu negócio'],
  ['DRE', 'Demonstração do Resultado do Exercício. É o relatório que organiza todas as receitas e despesas de um período e mostra se houve lucro ou prejuízo.', 'É o "boletim de notas" da empresa — resume se o negócio gerou ou consumiu dinheiro no mês.'],
  ['Receita Bruta', 'Tudo que a empresa faturou com vendas ou serviços antes de qualquer desconto ou custo.', 'É o ponto de partida da DRE. Sem receita, o negócio não existe.'],
  ['CMV', 'Custo das Mercadorias Vendidas. O que foi gasto diretamente para entregar o que foi vendido: ingredientes, estoque, matéria-prima, embalagens.', 'CMV alto em relação à receita significa que sobra pouco para pagar despesas e gerar lucro.'],
  ['Custo Direto', 'Outro nome para CMV. São os gastos que só existem porque uma venda aconteceu — se não vende, não gasta.', 'Diferente das despesas fixas (que existem todo mês), o custo direto sobe e desce com as vendas.'],
  ['Lucro Bruto', 'Receita Bruta menos o CMV. Mostra quanto sobrou depois de pagar o custo de produzir ou comprar o que foi vendido.', 'Se o lucro bruto for negativo, a empresa está vendendo abaixo do custo — situação crítica.'],
  ['Margem Bruta', 'Percentual do Lucro Bruto sobre a Receita. Margem de 40% significa que R$0,40 de cada R$1,00 vendido sobrou após os custos diretos.', 'Permite comparar eficiência entre meses e com concorrentes do mesmo setor.'],
  ['Despesas Fixas', 'Gastos que ocorrem todo mês independentemente do volume de vendas: aluguel, salários, internet, contador, serviços de assinatura.', 'São o "peso morto" do negócio. Quanto menores, mais fácil sobreviver em meses fracos.'],
  ['EBITDA', 'Lucro antes de juros, impostos, depreciação e amortização. Para pequenas empresas, equivale ao Lucro Bruto menos as Despesas Fixas.', 'Mede a capacidade de gerar caixa pelas operações. EBITDA negativo significa que a operação queima dinheiro só para funcionar.'],
  ['Margem EBITDA', 'EBITDA dividido pela Receita em percentual. Mostra quanto da receita vira geração de caixa operacional.', 'Referência geral: abaixo de 10% é apertado; acima de 20% é saudável para a maioria dos pequenos negócios.'],
  ['Dívidas / Financiamentos', 'Parcelas mensais de empréstimos, financiamentos bancários ou cartão de crédito empresarial que saem do caixa todo mês.', 'Dívida alta pode tornar o negócio lucrativo no papel mas insolvente na prática — o caixa seca antes do fim do mês.'],
  ['Investimentos', 'Dinheiro aplicado de volta no negócio: compra de equipamento, reforma, estoque extra para crescimento.', 'Investir é bom, mas precisa caber no fluxo de caixa. Investimento sem planejamento pode comprometer o pagamento de despesas fixas.'],
  ['Lucro Líquido', 'O que sobra depois de pagar absolutamente tudo: custos, despesas fixas, dívidas e investimentos. É o resultado final real do mês.', 'O número mais importante: é o que pode ser retirado pelo dono sem prejudicar o negócio, ou reinvestido para crescer.'],
  ['Margem Líquida', 'Percentual do Lucro Líquido sobre a Receita. Margem de 8% significa que R$0,08 de cada R$1,00 vendido virou lucro de verdade.', 'Abaixo de 5% é sinal de alerta. Negócios saudáveis costumam ter margem líquida entre 8% e 20%.'],
  ['Ponto de Equilíbrio', 'O faturamento mínimo que a empresa precisa atingir para não ter prejuízo — o ponto onde receitas igualam custos mais despesas.', 'Se a receita do mês ficou abaixo desse número, houve prejuízo operacional independentemente do que foi retirado.'],
  ['Saldo de Caixa', 'Dinheiro disponível na conta da empresa no fechamento do mês (conta corrente + caixa físico).', 'Um negócio pode ser lucrativo no papel mas sem caixa não paga fornecedores. Monitorar o saldo evita sustos.'],
  ['Contas a Receber', 'Vendas já realizadas mas ainda não pagas: fiado, boleto a vencer, carnê, prazo para receber cartão.', 'Alta inadimplência reduz o caixa disponível mesmo que as vendas estejam boas no papel.'],
  ['Inadimplência', 'Percentual ou valor de vendas que não foram pagas pelos clientes no prazo combinado.', 'Inadimplência alta pode transformar lucro contábil em prejuízo real — o dinheiro está nas planilhas, não no banco.'],
  ['Capital de Giro', 'Dinheiro necessário para manter o ciclo do negócio: pagar fornecedores antes de receber dos clientes.', 'Falta de capital de giro é a principal causa de fechamento de pequenas empresas mesmo quando são lucrativas.'],
  ['Fluxo de Caixa', 'Registro de todas as entradas e saídas de dinheiro ao longo do tempo, mostrando quando o dinheiro realmente entra e sai.', 'Diferente do lucro: uma empresa pode ter lucro em outubro mas fluxo negativo se os recebimentos chegam em novembro.'],
  ['Depreciação', 'Perda de valor de equipamentos e ativos ao longo do tempo. Uma máquina de R$10.000 que dura 5 anos deprecia R$2.000 por ano.', 'Não é saída de caixa no mês, mas representa um custo real de uso dos ativos. Ignorar pode levar a não planejar a substituição.'],
  ['ROI', 'Retorno sobre o Investimento. Quanto o negócio retornou em relação ao capital investido, em percentual.', 'ROI positivo significa que o investimento valeu a pena. Serve para decidir se comprar um novo equipamento faz sentido financeiro.'],
  ['Markup', 'Percentual adicionado ao custo de um produto para definir o preço de venda. Produto que custa R$10 vendido a R$15 tem markup de 50%.', 'Markup baixo demais é a causa mais comum de empresas que vendem bastante mas não acumulam dinheiro.'],
  ['Ticket Médio', 'Valor médio de cada venda ou pedido. Total de vendas dividido pelo número de clientes ou pedidos no período.', 'Aumentar o ticket médio é frequentemente mais barato do que conquistar novos clientes.'],
];

function addGlossarySheet(wb) {
  const rows = [];
  const merges = [];
  let r = 0;

  const S_GT = { font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: '1F2433' } }, alignment: { horizontal: 'left', indent: 1, vertical: 'center' } };
  const S_GH = { font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: '2C5DEB' } }, alignment: { wrapText: true, vertical: 'top' } };
  const S_GT2= { font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1F2433' } }, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } }, alignment: { wrapText: true, vertical: 'top' } };
  const S_GD = { font: { name: 'Calibri', sz: 10, color: { rgb: '363C4D' } }, alignment: { wrapText: true, vertical: 'top' } };
  const S_GI = { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: '535B6E' } }, alignment: { wrapText: true, vertical: 'top' } };
  const S_GF = { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: '9CA3AF' } } };

  // Título
  merges.push({ s: { r, c: 0 }, e: { r, c: 2 } });
  rows.push([{ v: 'Glossário Financeiro — FinCheck', s: S_GT }, { v: '', s: S_GT }, { v: '', s: S_GT }]);
  r++;

  merges.push({ s: { r, c: 0 }, e: { r, c: 2 } });
  rows.push([{ v: 'Termos usados no diagnóstico e na DRE — explicados em linguagem simples', s: { font: { name: 'Calibri', sz: 11, italic: true, color: { rgb: '9CA3AF' } }, fill: { patternType: 'solid', fgColor: { rgb: '1F2433' } }, alignment: { indent: 1 } } }, { v: '', s: {} }, { v: '', s: {} }]);
  r++;

  rows.push([{ v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }]);
  r++;

  // Cabeçalho da tabela
  rows.push([
    { v: GLOSSARY[0][0], s: S_GH },
    { v: GLOSSARY[0][1], s: S_GH },
    { v: GLOSSARY[0][2], s: S_GH },
  ]);
  r++;

  // Termos
  for (let i = 1; i < GLOSSARY.length; i++) {
    rows.push([
      { v: GLOSSARY[i][0], s: S_GT2 },
      { v: GLOSSARY[i][1], s: S_GD },
      { v: GLOSSARY[i][2], s: S_GI },
    ]);
    r++;
  }

  rows.push([{ v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }]);
  rows.push([{ v: 'Gerado pelo FinCheck', s: S_GF }, { v: '', s: {} }, { v: '', s: {} }]);

  const ws = XLSXStyle.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 52 }, { wch: 52 }];
  ws['!merges'] = merges;
  ws['!rows'] = [{ hpt: 28 }, { hpt: 20 }, {}, { hpt: 20 }, ...GLOSSARY.slice(1).map(() => ({ hpt: 48 }))];
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Glossário');
}

// ─── DRE principal ────────────────────────────────────────────────────────
export async function downloadDRE(entries, filename) {
  const wb = XLSXStyle.utils.book_new();
  const usedNames = new Set();

  // Ordena por referenceMonth descendente (mais recente primeiro)
  const sorted = [...entries].sort((a, b) => {
    const da = a.fData?.referenceMonth || '';
    const db = b.fData?.referenceMonth || '';
    return db.localeCompare(da);
  });

  for (let idx = 0; idx < sorted.length; idx++) {
    const entry    = sorted[idx];
    const prevEntry = sorted[idx + 1] || null;   // mês anterior na série
    const m  = calcMetrics(entry.fData);
    const mp = prevEntry ? calcMetrics(prevEntry.fData) : null;
    const hasComp = !!mp;

    let sheetName = entry.sheetLabel.slice(0, 31);
    if (usedNames.has(sheetName)) {
      let i = 2;
      while (usedNames.has(`${sheetName.slice(0, 28)} (${i})`)) i++;
      sheetName = `${sheetName.slice(0, 28)} (${i})`;
    }
    usedNames.add(sheetName);

    const rows = [];
    const merges = [];
    let r = 0;
    const LAST_COL = hasComp ? 3 : 2;

    const addTitle = (text) => {
      merges.push({ s: { r, c: 0 }, e: { r, c: LAST_COL } });
      const row = [c(text, S.title), c('', S.title), c('', S.title)];
      if (hasComp) row.push(c('', S.title));
      rows.push(row); r++;
    };

    const addMeta = (a, b = '') => {
      const row = [c(a, S.meta), c(b, S.meta), c('', {})];
      if (hasComp) row.push(c('vs. mês anterior', S.varHeader));
      rows.push(row); r++;
    };

    const addBlank = () => {
      const row = [c('', {}), c('', {}), c('', {})];
      if (hasComp) row.push(c('', {}));
      rows.push(row); r++;
    };

    const addSection = (text) => {
      merges.push({ s: { r, c: 0 }, e: { r, c: LAST_COL } });
      const row = [c(text, S.section), c('', S.section), c('', S.section)];
      if (hasComp) row.push(c('', S.section));
      rows.push(row); r++;
    };

    // higherBetter: true = verde quando sobe, false = verde quando cai
    const addRow = (label, value, pctText = '', delta = null, higherBetter = true) => {
      const row = [c(label, S.label), c(value, S.money), c(pctText, S.pct)];
      if (hasComp) row.push(delta !== null ? deltaCell(delta, higherBetter) : c('', {}));
      rows.push(row); r++;
    };

    const addTotal = (label, value, pctText = '', delta = null, higherBetter = true) => {
      const row = [c(label, S.total), c(value, S.totalMoney), c(pctText, S.totalPct)];
      if (hasComp) row.push(delta !== null ? deltaCell(delta, higherBetter, true) : c('', {}));
      rows.push(row); r++;
    };

    // ── Constrói a DRE ──
    addTitle(`DRE — ${entry.businessName}`);
    addMeta(`${entry.segment}`, entry.sheetLabel);
    addBlank();

    addSection('RECEITAS');
    addRow('(+) Receita Bruta', m.revenue, '', mp ? m.revenue - mp.revenue : null, true);
    addBlank();

    addSection('CUSTOS DIRETOS');
    addRow('(−) CMV — Custo das Vendas', m.cogs, '', mp ? m.cogs - mp.cogs : null, false);
    addBlank();
    addTotal('= LUCRO BRUTO', m.grossProfit, `Margem: ${m.grossMargin.toFixed(1)}%`, mp ? m.grossProfit - mp.grossProfit : null, true);
    addBlank();

    addSection('DESPESAS FIXAS OPERACIONAIS');
    if (entry.fData.fixedExpensesItems?.length) {
      entry.fData.fixedExpensesItems.forEach(i => addRow(`    • ${i.desc}`, i.value, '', null));
    } else {
      addRow('    (sem detalhamento)', m.fixedExpenses, '', null);
    }
    addRow('  Subtotal', m.fixedExpenses, '', mp ? m.fixedExpenses - mp.fixedExpenses : null, false);
    addBlank();
    const ebitdaPct = m.revenue > 0 ? (m.ebitda / m.revenue) * 100 : 0;
    addTotal('= EBITDA', m.ebitda, `Margem: ${ebitdaPct.toFixed(1)}%`, mp ? m.ebitda - mp.ebitda : null, true);
    addBlank();

    if (m.debtPayment > 0 || (mp && mp.debtPayment > 0)) {
      addSection('DÍVIDAS / FINANCIAMENTOS');
      if (entry.fData.debtPaymentItems?.length) {
        entry.fData.debtPaymentItems.forEach(i => addRow(`    • ${i.desc}`, i.value, '', null));
      } else {
        addRow('    (sem detalhamento)', m.debtPayment, '', null);
      }
      addRow('  Subtotal', m.debtPayment, '', mp ? m.debtPayment - mp.debtPayment : null, false);
      addBlank();
    }

    if (m.investments > 0 || (mp && mp.investments > 0)) {
      addRow('(−) Investimentos na Empresa', m.investments, '', mp ? m.investments - mp.investments : null, false);
      addBlank();
    }

    addTotal('= LUCRO LÍQUIDO', m.netProfit, `Margem: ${m.netMargin.toFixed(1)}%`, mp ? m.netProfit - mp.netProfit : null, true);
    addBlank();

    addSection('OUTROS INDICADORES');
    addRow('Saldo de Caixa', m.cashBalance, '', mp ? m.cashBalance - mp.cashBalance : null, true);
    addRow('Contas a Receber', m.accountsReceivable, '', mp ? m.accountsReceivable - mp.accountsReceivable : null, true);
    addRow('Ponto de Equilíbrio', m.breakEven, 'Faturamento mínimo', mp ? m.breakEven - mp.breakEven : null, false);
    addBlank();
    const footerRow = [c('Gerado pelo FinCheck', S.footer), c('', {}), c('', {})];
    if (hasComp) footerRow.push(c('', {}));
    rows.push(footerRow);

    const ws = XLSXStyle.utils.aoa_to_sheet(rows);
    ws['!cols'] = hasComp
      ? [{ wch: 46 }, { wch: 20 }, { wch: 22 }, { wch: 22 }]
      : [{ wch: 46 }, { wch: 20 }, { wch: 22 }];
    ws['!merges'] = merges;
    ws['!rows'] = [{ hpt: 28 }];

    XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);
  }

  addGlossarySheet(wb);

  const buf = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Converte um record do Supabase num entry para downloadDRE
export function recordToEntry(record) {
  const refMonth = record.financial_data?.referenceMonth;
  const label = refMonth
    ? formatReferenceMonth(refMonth)
    : new Date(record.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return {
    sheetLabel: label,
    businessName: record.business_name,
    segment: record.segment,
    fData: record.financial_data,
  };
}

// Converte businessData + financialData atuais num entry para downloadDRE
export function currentToEntry(businessData, financialData) {
  const refMonth = businessData.referenceMonth || financialData?.referenceMonth;
  const label = refMonth ? formatReferenceMonth(refMonth) : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return {
    sheetLabel: label,
    businessName: businessData.businessName,
    segment: businessData.segment,
    fData: financialData,
  };
}

// ─── PDF ──────────────────────────────────────────────────────────────────
export async function downloadPDF(businessData, diagnosisText, financialData) {
  const html2pdf = (await import('html2pdf.js')).default;
  const m = calcMetrics(financialData);
  const healthStatus = extractHealthStatus(diagnosisText);
  const renderedHtml = renderMarkdown(diagnosisText);
  const refMonth = businessData.referenceMonth || financialData?.referenceMonth;
  const dateLabel = refMonth ? formatReferenceMonth(refMonth) : new Date().toLocaleDateString('pt-BR');

  const badgeHtml = healthStatus
    ? `<div class="badge">Saúde Financeira: ${healthStatus.label}</div>`
    : '';

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;';
  container.innerHTML = `
    <style>
      .fc-pdf { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 48px; color: #13172a; background: white; }
      .fc-pdf * { box-sizing: border-box; }
      .fc-pdf .header { border-bottom: 2px solid #1f2433; padding-bottom: 18px; margin-bottom: 22px; }
      .fc-pdf .logo { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2c5deb; margin-bottom: 6px; }
      .fc-pdf h1 { font-size: 28px; font-weight: 800; color: #13172a; margin: 0 0 4px; letter-spacing: -0.022em; }
      .fc-pdf .meta { font-size: 13px; color: #535b6e; }
      .fc-pdf .badge { display: inline-block; margin-top: 10px; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; background: #eef2ff; color: #1a3aa6; border: 1px solid #dbe5ff; }
      .fc-pdf .summary { display: flex; gap: 12px; margin: 18px 0 24px; }
      .fc-pdf .summary-card { flex: 1; background: #f7f8fa; border: 1px solid #dde0e6; border-radius: 8px; padding: 14px; }
      .fc-pdf .summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a8294; font-weight: 600; }
      .fc-pdf .summary-card .value { font-size: 20px; font-weight: 800; color: #13172a; margin-top: 4px; font-family: ui-monospace, monospace; }
      .fc-pdf h2 { font-size: 15px; font-weight: 700; color: #13172a; margin: 22px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #dde0e6; }
      .fc-pdf p { font-size: 13px; line-height: 1.65; color: #363c4d; margin: 0 0 9px; }
      .fc-pdf ul { margin: 0 0 12px; padding: 0; list-style: none; }
      .fc-pdf li { font-size: 13px; line-height: 1.65; color: #363c4d; padding: 3px 0 3px 14px; position: relative; }
      .fc-pdf li::before { content: ''; position: absolute; left: 0; top: 11px; width: 4px; height: 4px; background: #2c5deb; border-radius: 50%; }
      .fc-pdf strong { font-weight: 700; color: #13172a; }
      .fc-pdf .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #dde0e6; font-size: 11px; color: #7a8294; text-align: center; }
    </style>
    <div class="fc-pdf">
      <div class="header">
        <div class="logo">FinCheck — Diagnóstico Financeiro</div>
        <h1>${escapeHtml(businessData.businessName)}</h1>
        <div class="meta">${escapeHtml(businessData.segment)} &nbsp;·&nbsp; ${escapeHtml(dateLabel)}</div>
        ${badgeHtml}
      </div>
      <div class="summary">
        <div class="summary-card"><div class="label">Lucro Líquido</div><div class="value">${formatBRL(m.netProfit)}</div></div>
        <div class="summary-card"><div class="label">Margem Líquida</div><div class="value">${m.netMargin.toFixed(1)}%</div></div>
        <div class="summary-card"><div class="label">Caixa</div><div class="value">${formatBRL(m.cashBalance)}</div></div>
      </div>
      <div class="content">${renderedHtml}</div>
      <div class="footer">Gerado pelo FinCheck — diagnóstico financeiro para pequenas empresas brasileiras</div>
    </div>
  `;
  document.body.appendChild(container);

  const safeName = businessData.businessName.replace(/\s+/g, '_');
  const safeDate = dateLabel.replace(/\s+/g, '_');
  const fileName = `Diagnostico_${safeName}_${safeDate}.pdf`;

  try {
    await html2pdf()
      .set({
        margin:      [10, 10, 10, 10],
        filename:    fileName,
        image:       { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(container.querySelector('.fc-pdf'))
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
