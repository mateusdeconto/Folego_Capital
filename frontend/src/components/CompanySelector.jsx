import { useState } from 'react';
import UpgradeModal from './UpgradeModal.jsx';

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

export default function CompanySelector({
  companies,
  plan,
  totalAnalysesCount = 0,
  getSummary,
  onUseCompany,
  onViewLatest,
  onViewHistory,
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
