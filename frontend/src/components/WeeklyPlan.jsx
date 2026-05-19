import { useMemo } from 'react';
import { calcMetrics, generateWeeklyPlan } from '../lib/metrics.js';
import { formatReferenceMonth } from '../lib/export.js';

const RISK_TONE = {
  critical: { bg: 'bg-loss-50',  border: 'border-loss-200',  text: 'text-loss-700',  dot: 'bg-loss-500',  pulse: true  },
  warn:     { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', pulse: true  },
  ok:       { bg: 'bg-money-50', border: 'border-money-200', text: 'text-money-700', dot: 'bg-money-500', pulse: false },
};

function ChevronRight() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export default function WeeklyPlan({ businessData, financialData, onOpenChat, onBack }) {
  const metrics = useMemo(() => calcMetrics(financialData), [financialData]);
  const plan    = useMemo(() => generateWeeklyPlan(metrics, financialData), [metrics, financialData]);

  const { mainRisk, actions } = plan;
  const tone = RISK_TONE[mainRisk.level] || RISK_TONE.ok;

  const refMonth = businessData?.referenceMonth
    ? formatReferenceMonth(businessData.referenceMonth)
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-1">
        <p className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-2">Plano da semana</p>
        <h1 className="text-3xl font-bold text-ink-900 tracking-tighter">
          {businessData?.businessName}
        </h1>
        <p className="text-ink-500 text-sm mt-0.5">
          3 ações práticas para agora
          {refMonth && <span className="ml-2 text-ink-400">· {refMonth}</span>}
        </p>
      </div>

      {/* Principal risco */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${tone.bg} ${tone.border}`}>
        <span className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${tone.dot} ${tone.pulse ? 'animate-pulse' : ''}`} />
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${tone.text}`}>
            Principal risco agora
          </p>
          <p className={`text-sm leading-relaxed font-medium ${tone.text}`}>{mainRisk.text}</p>
        </div>
      </div>

      {/* Ações */}
      <div>
        <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">
          Suas 3 ações desta semana
        </p>
        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.priority} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {action.priority}
                </span>
                <p className="text-sm font-bold text-ink-900 leading-snug">{action.action}</p>
              </div>

              <div className="ml-9 space-y-2.5">
                <div>
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-0.5">Por quê</p>
                  <p className="text-xs text-ink-600 leading-relaxed">{action.reason}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-0.5">Impacto esperado</p>
                  <p className="text-xs text-ink-600 leading-relaxed">{action.impact}</p>
                </div>
              </div>

              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="mt-3 ml-9 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                >
                  Perguntar à IA sobre isso <ChevronRight />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      {onOpenChat && (
        <button onClick={onOpenChat} className="btn-secondary w-full">
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Consultar IA sobre o plano
          </span>
        </button>
      )}

      <button onClick={onBack} className="btn-back">← Voltar</button>

      <p className="text-center text-xs text-ink-400 pb-4">
        Fôlego Capital — decisão semanal para dono de PME
      </p>
    </div>
  );
}
