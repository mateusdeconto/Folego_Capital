import { useState } from 'react';
import UpgradeModal from './UpgradeModal.jsx';
import { calcPlanStatus, calcActionStats } from '../lib/weeklyPlans.js';

function Icon({ d, size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.9}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function formatLastSeen(date) {
  if (!date) return 'Sem análise ainda';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const PLAN_STATUS_CONFIG = {
  ativo: {
    label: 'Ativo',
    dot: 'bg-money-500',
    text: 'text-money-700',
    bg: 'bg-money-50',
    border: 'border-money-200',
  },
  precisa_revisao: {
    label: 'Precisa revisão',
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  desatualizado: {
    label: 'Desatualizado',
    dot: 'bg-loss-500',
    text: 'text-loss-700',
    bg: 'bg-loss-50',
    border: 'border-loss-200',
  },
};

function WeeklyPlanBadge({ weeklyPlan, latestDiagnosisCreatedAt, onOpen }) {
  if (!weeklyPlan) {
    if (!onOpen) return null;
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-ink-200 bg-ink-50 mt-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-ink-300" />
          <span className="text-xs font-semibold text-ink-500">Plano semanal</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 ml-1">Sem plano</span>
        </div>
        <button
          onClick={onOpen}
          className="text-xs font-semibold flex-shrink-0 text-money-600 hover:opacity-70 transition-opacity"
        >
          Criar plano →
        </button>
      </div>
    );
  }

  const status = calcPlanStatus(weeklyPlan, latestDiagnosisCreatedAt);
  const cfg = PLAN_STATUS_CONFIG[status];
  const stats = calcActionStats(weeklyPlan);

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border} mt-3`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className={`text-xs font-semibold ${cfg.text}`}>Plano semanal</span>
        {stats.total > 0 && (
          <span className="text-xs text-ink-500">
            · {stats.done}/{stats.total} concluídas
          </span>
        )}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text} ml-1`}>
          {cfg.label}
        </span>
      </div>
      {onOpen && (
        <button
          onClick={onOpen}
          className={`text-xs font-semibold flex-shrink-0 ${cfg.text} hover:opacity-70 transition-opacity`}
        >
          Ver plano →
        </button>
      )}
    </div>
  );
}

export default function CompanySelector({
  companies,
  plan,
  totalAnalysesCount = 0,
  getSummary,
  getWeeklyPlanSummary,
  onUseCompany,
  onViewLatest,
  onViewHistory,
  onOpenWeeklyPlan,
  onOpenCanOrNot,
  onCreateAnother,
  onLogout,
}) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isFreePlan = plan !== 'paid';
  const canAnalyze = !isFreePlan || totalAnalysesCount < 1;
  const canAddCompany = !isFreePlan || companies.length < 1;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Escolha empresa</h1>
          <p className="text-sm text-ink-400 mt-1">
            Reaproveite cadastro salvo ou crie nova empresa para nova DRE.
          </p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-semibold text-ink-500 bg-white border border-ink-200 rounded-xl hover:bg-ink-50 transition-colors"
          >
            Sair
          </button>
        )}
      </div>

      <div className="space-y-4">
        {companies.map(company => {
          const summary = getSummary(company);
          const weeklyPlan = getWeeklyPlanSummary ? getWeeklyPlanSummary(company) : null;

          return (
            <div key={`${company.businessName}-${company.segment}-${company.customSegment || ''}`} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-ink-900 truncate">{company.businessName}</p>
                  <p className="text-sm text-ink-500 capitalize">
                    {company.customSegment || company.segment}
                  </p>
                </div>
                <div className="badge-neutral whitespace-nowrap">
                  {summary.recordsCount} {summary.recordsCount === 1 ? 'DRE' : 'DREs'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="rounded-xl bg-ink-50 border border-ink-200 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-400 mb-1">Última atividade</p>
                  <p className="text-sm font-semibold text-ink-700">{formatLastSeen(summary.lastCreatedAt)}</p>
                </div>
                <div className="rounded-xl bg-ink-50 border border-ink-200 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-400 mb-1">Último mês</p>
                  <p className="text-sm font-semibold text-ink-700">{summary.lastReferenceMonth || 'Não informado'}</p>
                </div>
                <div className="rounded-xl bg-ink-50 border border-ink-200 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-400 mb-1">Status</p>
                  <p className="text-sm font-semibold text-ink-700">
                    {summary.recordsCount > 0 ? 'Pronta para reutilizar' : 'Cadastro salvo'}
                  </p>
                </div>
              </div>

              <WeeklyPlanBadge
                weeklyPlan={weeklyPlan}
                latestDiagnosisCreatedAt={summary.lastCreatedAt}
                onOpen={onOpenWeeklyPlan && summary.recordsCount > 0 ? () => onOpenWeeklyPlan(company) : null}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                <button
                  onClick={() => canAnalyze ? onUseCompany(company) : setShowUpgrade(true)}
                  className={`btn-primary !py-2.5${!canAnalyze ? ' relative' : ''}`}
                >
                  {!canAnalyze && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">🔒</span>
                  )}
                  Nova DRE
                </button>

                {summary.latestRecord ? (
                  <button
                    onClick={() => onViewLatest(company)}
                    className="btn-secondary !py-2.5"
                  >
                    Ver última DRE
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary !py-2.5 opacity-50 cursor-not-allowed"
                  >
                    Sem DRE ainda
                  </button>
                )}

                {summary.recordsCount > 0 && plan === 'paid' ? (
                  <button
                    onClick={() => onViewHistory(company)}
                    className="btn-secondary !py-2.5"
                  >
                    Ver histórico
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary !py-2.5 opacity-50 cursor-not-allowed"
                  >
                    Histórico indisponível
                  </button>
                )}
              </div>

              {summary.latestRecord && onOpenCanOrNot && (
                <button
                  onClick={() => onOpenCanOrNot(company)}
                  className="w-full mt-2.5 flex items-center justify-between px-4 py-2.5 rounded-xl border border-gold-200 bg-gold-50 hover:bg-gold-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-gold-100 group-hover:bg-gold-200 flex items-center justify-center transition-colors flex-shrink-0">
                      <Icon
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                        size={14}
                        className="text-gold-600"
                      />
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gold-800">Pode ou Não Pode?</p>
                      <p className="text-[10px] text-gold-600">Avalie uma decisão do negócio</p>
                    </div>
                  </div>
                  <span className="text-gold-500 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => canAddCompany ? onCreateAnother() : setShowUpgrade(true)}
        className="w-full mt-5 py-3 border border-dashed border-ink-300 text-ink-700 hover:bg-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <Icon d={canAddCompany ? 'M12 4.5v15m7.5-7.5h-15' : 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'} size={16} />
        {canAddCompany ? 'Cadastrar nova empresa' : 'Múltiplas empresas — Plano Pro'}
      </button>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
