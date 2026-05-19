import { useState, useMemo, useEffect } from 'react';
import { trackEvent } from '../lib/analytics.js';
import { DECISIONS, evaluate, getProfile, calcTrend, saveLastDecision } from '../lib/canOrNot.js';
import { formatBRL } from '../lib/metrics.js';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function Icon({ d, size = 20, className = '' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const DECISION_ICONS = {
  hire:      'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z',
  stock:     'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  marketing: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
  withdraw:  'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
  loan:      'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
  equipment: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z',
};

// ---------------------------------------------------------------------------
// Sugestões para weekly plan por decisão/veredito
// ---------------------------------------------------------------------------

const WEEKLY_PLAN_SUGGESTIONS = {
  hire: {
    cannot: 'Antes de contratar, coloque no plano: aumentar receita e estabilizar caixa.',
    careful: 'Monitore caixa e margem nas próximas semanas antes de fechar contratação.',
  },
  marketing: {
    cannot: 'Coloque no plano: melhorar conversão e margem antes de investir em aquisição.',
    careful: 'Comece pequeno e meça retorno antes de escalar. Inclua no plano semanal.',
  },
  withdraw: {
    cannot: 'Estabeleça pró-labore fixo no plano. Reveja estrutura de caixa primeiro.',
    careful: 'Retire valor menor e acompanhe caixa semanalmente no plano.',
  },
  loan: {
    cannot: 'Reestruture custos antes de buscar crédito. Foco: gerar caixa internamente.',
    careful: 'Se pegar empréstimo, defina destino e meta de retorno — coloque no plano.',
  },
  stock: {
    cannot: 'Negocie prazo com fornecedor. Inclua meta de caixa no plano semanal.',
    careful: 'Compre volume menor para testar giro. Monitore no plano.',
  },
  equipment: {
    cannot: 'Avalie leasing ou financiamento para não comprometer caixa. Inclua no plano.',
    careful: 'Calcule impacto da parcela na margem antes de assinar. Coloque no plano.',
  },
};

// ---------------------------------------------------------------------------
// Verdict config
// ---------------------------------------------------------------------------

const VERDICT_CONFIG = {
  can: {
    bg: 'bg-money-50', border: 'border-money-200', text: 'text-money-700',
    badge: 'bg-money-100 text-money-700', dot: 'bg-money-500',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  careful: {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400',
    icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  },
  cannot: {
    bg: 'bg-loss-50', border: 'border-loss-200', text: 'text-loss-700',
    badge: 'bg-loss-100 text-loss-700', dot: 'bg-loss-500',
    icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  nodata: {
    bg: 'bg-ink-50', border: 'border-ink-200', text: 'text-ink-500',
    badge: 'bg-ink-100 text-ink-500', dot: 'bg-ink-300',
    icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  },
};

const SIGNAL_DOT = {
  good: 'bg-money-400',
  warn: 'bg-amber-400',
  bad:  'bg-loss-500',
};

const SIGNAL_ARROW_COLOR = {
  good: 'text-money-600',
  warn: 'text-amber-600',
  bad:  'text-loss-600',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBRL(raw) {
  if (!raw) return 0;
  return parseFloat(String(raw).replace(/\./g, '').replace(',', '.')) || 0;
}

function buildChatMessage(decisionLabel, result, fields, decisionDef) {
  const verdictLabel =
    result.verdict === 'can'     ? 'Pode' :
    result.verdict === 'careful' ? 'Pode com cautela' : 'Não pode agora';

  const fieldLines = (decisionDef?.fields || [])
    .filter(f => fields[f.id] > 0)
    .map(f => `- ${f.label}: ${formatBRL(fields[f.id])}`)
    .join('\n');

  const signalLines = result.signals
    .map(s => {
      const proj = s.projected && s.projected !== s.value ? ` → ${s.projected}` : '';
      return `- ${s.label}: ${s.value}${proj}`;
    })
    .join('\n');

  const reasonLines = result.reasons?.length > 0
    ? `\nPrincipais fatores:\n${result.reasons.map(r => `- ${r}`).join('\n')}`
    : '';

  const improvLines = result.improvements?.length > 0
    ? `\nO que melhorar:\n${result.improvements.map(r => `- ${r}`).join('\n')}`
    : '';

  return [
    `Acabei de usar o "Pode ou Não Pode?" para avaliar: **${decisionLabel}**.`,
    fieldLines ? `\nParâmetros informados:\n${fieldLines}` : '',
    `\nResultado: **${verdictLabel}** — ${result.explanation}`,
    reasonLines,
    `\nSinais considerados:\n${signalLines}`,
    improvLines,
    result.trendNote ? `\nTendência: ${result.trendNote}` : '',
    '\nQuero aprofundar essa análise. O que você recomenda?',
  ].filter(Boolean).join('');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DecisionCard({ decision, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left w-full transition-all
        ${selected
          ? 'bg-brand-50 border-brand-300 shadow-sm'
          : 'bg-white border-ink-200 hover:border-ink-300 hover:bg-ink-50'}
      `}
    >
      <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors
        ${selected ? 'bg-brand-100 text-brand-600' : 'bg-ink-100 text-ink-500'}`}>
        <Icon d={DECISION_ICONS[decision.icon]} size={18} />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-brand-700' : 'text-ink-800'}`}>
          {decision.label}
        </p>
        <p className={`text-xs truncate ${selected ? 'text-brand-500' : 'text-ink-400'}`}>
          {decision.description}
        </p>
      </div>
      {selected && (
        <span className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      )}
    </button>
  );
}

function FieldInput({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-600 mb-1.5">
        {field.label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink-400 flex-shrink-0">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="flex-1 px-3 py-2.5 text-sm font-semibold bg-ink-50 border border-ink-200 rounded-xl outline-none focus:border-brand-400 focus:bg-white transition-colors"
        />
      </div>
      {field.hint && (
        <p className="text-[11px] text-ink-400 mt-1">{field.hint}</p>
      )}
    </div>
  );
}

function SignalRow({ signal }) {
  const mainDot   = SIGNAL_DOT[signal.status] || SIGNAL_DOT.good;
  const projColor = signal.projStatus ? SIGNAL_ARROW_COLOR[signal.projStatus] : null;
  const hasProj   = signal.projected && signal.projected !== signal.value;

  return (
    <div className="flex items-start gap-2.5 py-1">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${mainDot}`} />
      <span className="text-xs text-ink-700 leading-relaxed">
        <span className="font-semibold">{signal.label}:</span>{' '}
        <span>{signal.value}</span>
        {hasProj && (
          <>
            <span className="mx-1.5 text-ink-300 font-bold">→</span>
            <span className={`font-semibold ${projColor || 'text-ink-700'}`}>
              {signal.projected}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

function TrendBadge({ trendNote }) {
  if (!trendNote) return null;
  const isPositive = trendNote.includes('crescendo');
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium mt-3
      ${isPositive
        ? 'bg-money-50 border-money-200 text-money-700'
        : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
      <Icon
        d={isPositive
          ? 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941'
          : 'M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181'}
        size={14}
        className="flex-shrink-0"
      />
      <span>{trendNote}</span>
    </div>
  );
}

function VerdictCard({ result, decisionDef, fields, onOpenChat, onOpenWeeklyPlan }) {
  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.nodata;
  const showExtra = result.verdict === 'cannot' || result.verdict === 'careful';
  const weeklyPlanSuggestion = showExtra && decisionDef
    ? (WEEKLY_PLAN_SUGGESTIONS[decisionDef.id]?.[result.verdict] || null)
    : null;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 animate-fade-in`}>
      {/* badge + título */}
      <div className="flex items-start gap-3 mb-4">
        <span className={`mt-0.5 flex-shrink-0 ${cfg.text}`}>
          <Icon d={cfg.icon} size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${cfg.badge} mb-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {result.title}
          </span>
          <p className={`text-sm font-medium leading-relaxed ${cfg.text}`}>
            {result.explanation}
          </p>
        </div>
      </div>

      {/* sinais */}
      {result.signals.length > 0 && (
        <div className="border-t border-current border-opacity-10 pt-3 mt-3">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text} opacity-60 mb-1`}>
            Sinais considerados
            {result.signals.some(s => s.projected) && (
              <span className="ml-1.5 normal-case font-normal opacity-80">
                (atual → após decisão)
              </span>
            )}
          </p>
          <div className="divide-y divide-current divide-opacity-5">
            {result.signals.map((s, i) => (
              <SignalRow key={i} signal={s} />
            ))}
          </div>
        </div>
      )}

      {/* motivos principais */}
      {showExtra && result.reasons?.length > 0 && (
        <div className="border-t border-current border-opacity-10 pt-3 mt-3">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text} opacity-60 mb-2`}>
            O que mais pesou
          </p>
          <ul className="space-y-1.5">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-700 leading-relaxed">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* o que melhorar */}
      {showExtra && result.improvements?.length > 0 && (
        <div className="border-t border-current border-opacity-10 pt-3 mt-3">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text} opacity-60 mb-2`}>
            O que melhorar
          </p>
          <ul className="space-y-1.5">
            {result.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-700 leading-relaxed">
                <span className="text-money-500 font-bold flex-shrink-0 leading-none mt-0.5">→</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* conexão com plano semanal */}
      {weeklyPlanSuggestion && onOpenWeeklyPlan && (
        <div className="border-t border-current border-opacity-10 pt-3 mt-3">
          <p className="text-xs text-ink-500 leading-relaxed mb-2">{weeklyPlanSuggestion}</p>
          <button
            onClick={onOpenWeeklyPlan}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-money-50 border border-money-200 text-sm font-semibold text-money-700 hover:bg-money-100 transition-colors"
          >
            <Icon d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" size={16} />
            Ver plano da semana
          </button>
        </div>
      )}

      {/* tendência */}
      <TrendBadge trendNote={result.trendNote} />

      {/* footer */}
      <div className="mt-4 pt-3 border-t border-current border-opacity-10">
        <p className="text-[11px] text-ink-400 leading-relaxed mb-3">
          Análise baseada nos dados financeiros informados. Não substitui seu contador ou planejador financeiro.
        </p>
        {result.verdict !== 'nodata' && onOpenChat && (
          <button
            onClick={() => onOpenChat(buildChatMessage(decisionDef?.label || '', result, fields, decisionDef))}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-ink-200 text-sm font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
          >
            <Icon d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" size={16} />
            Perguntar à IA sobre isso
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function CanOrNot({ businessData, financialData, allDiagnoses, onOpenChat, onOpenWeeklyPlan, onBack }) {
  const [selectedId, setSelectedId]   = useState(null);
  const [fieldsRaw, setFieldsRaw]     = useState({});

  const selectedDecision = DECISIONS.find(d => d.id === selectedId);

  // Parse numeric values from raw input strings
  const fields = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(fieldsRaw)) {
      out[k] = parseBRL(v);
    }
    return out;
  }, [fieldsRaw]);

  const result = useMemo(() => {
    if (!selectedId) return null;
    return evaluate(selectedId, financialData, fields, businessData, allDiagnoses || []);
  }, [selectedId, financialData, fields, businessData, allDiagnoses]);

  // Persiste última decisão no localStorage sempre que um resultado válido aparecer
  useEffect(() => {
    if (!result || result.verdict === 'nodata' || !selectedId || !businessData?.businessName) return;
    const value = fields.totalValue || fields.monthlyCost || fields.monthlyInstallment || 0;
    saveLastDecision(businessData, {
      decisionId:    selectedId,
      decisionLabel: selectedDecision?.label || '',
      verdict:       result.verdict,
      verdictTitle:  result.title,
      value,
      date:          new Date().toISOString(),
      explanation:   result.explanation,
    });
    trackEvent('can_or_not_simulation_completed', {
      decision_type: selectedId,
      verdict: result.verdict,
      has_value: value > 0,
      company: businessData.businessName,
    });
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const profile = useMemo(() =>
    getProfile(businessData?.segment, businessData?.customSegment),
  [businessData]);

  const trend = useMemo(() =>
    calcTrend(allDiagnoses || []),
  [allDiagnoses]);

  function handleSelectDecision(id) {
    setSelectedId(id);
    setFieldsRaw({});
    trackEvent('can_or_not_decision_selected', { decision_type: id });
  }

  function handleFieldChange(fieldId, raw) {
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) {
      setFieldsRaw(prev => ({ ...prev, [fieldId]: '' }));
      return;
    }
    const formatted = parseInt(digits, 10).toLocaleString('pt-BR');
    setFieldsRaw(prev => ({ ...prev, [fieldId]: formatted }));
  }

  const hasHistory = allDiagnoses && allDiagnoses.length >= 2;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex-shrink-0 w-9 h-9 rounded-xl border border-ink-200 bg-white flex items-center justify-center hover:bg-ink-50 transition-colors"
        >
          <Icon d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" size={16} className="text-ink-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink-900 tracking-tight leading-tight">
            Pode ou Não Pode?
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {businessData?.businessName && (
              <p className="text-xs text-ink-400">{businessData.businessName}</p>
            )}
            {profile.label !== 'Geral' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-300 bg-ink-100 px-1.5 py-0.5 rounded-md">
                {profile.label}
              </span>
            )}
            {hasHistory && trend === 'declining' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                Receita em queda
              </span>
            )}
            {hasHistory && trend === 'growing' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-money-600 bg-money-50 border border-money-200 px-1.5 py-0.5 rounded-md">
                Receita crescendo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* seletor */}
      <div className="card p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">
          Qual decisão você quer avaliar?
        </p>
        <div className="space-y-2">
          {DECISIONS.map(d => (
            <DecisionCard
              key={d.id}
              decision={d}
              selected={selectedId === d.id}
              onClick={() => handleSelectDecision(d.id)}
            />
          ))}
        </div>
      </div>

      {/* campos da decisão */}
      {selectedDecision && selectedDecision.fields.length > 0 && (
        <div className="card p-5 mb-4 animate-fade-in space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
            Detalhes (opcional — quanto mais informar, mais precisa a análise)
          </p>
          {selectedDecision.fields.map(field => (
            <FieldInput
              key={field.id}
              field={field}
              value={fieldsRaw[field.id] || ''}
              onChange={raw => handleFieldChange(field.id, raw)}
            />
          ))}
        </div>
      )}

      {/* resultado */}
      {result && (
        <VerdictCard
          result={result}
          decisionDef={selectedDecision}
          fields={fields}
          onOpenChat={(msg) => {
            trackEvent('can_or_not_chat_opened', {
              decision_type: selectedId,
              verdict: result.verdict,
            });
            onOpenChat(msg);
          }}
          onOpenWeeklyPlan={() => {
            trackEvent('can_or_not_weekly_plan_cta_clicked', {
              decision_type: selectedId,
              verdict: result.verdict,
            });
            onOpenWeeklyPlan();
          }}
        />
      )}
    </div>
  );
}
