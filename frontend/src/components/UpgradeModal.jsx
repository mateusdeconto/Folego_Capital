const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 49/mês',
    tag: null,
    features: [
      '1 empresa',
      '3 diagnósticos mensais',
      'Relatório completo + benchmarks SEBRAE',
      'DRE Excel e PDF',
      'Plano semanal (4x/mês)',
      'Pode ou Não Pode',
      'Histórico de análises',
      'Chat IA (limitado)',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    price: 'R$ 129/mês',
    tag: 'Mais popular',
    features: [
      'Até 5 empresas',
      'Diagnósticos ilimitados',
      'Tudo do plano Pago',
      'Plano semanal (8x/mês)',
      'Chat IA com mais créditos',
      'Histórico ilimitado',
      'Todas as atualizações futuras',
    ],
  },
];

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-money-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function UpgradeModal({ onClose, currentPlan = 'free' }) {
  const visiblePlans = currentPlan === 'pro' ? PLANS.filter(p => p.id === 'max') : PLANS;

  return (
    <div
      className="fixed inset-0 bg-ink-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ink-900 px-6 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-1">Fôlego Capital</p>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {currentPlan === 'pro' ? 'Evolua para o Max' : 'Desbloqueie mais poder'}
          </h2>
          <p className="text-sm text-ink-300 mt-1">Escolha o plano ideal para o seu negócio</p>
        </div>

        {/* Plans */}
        <div className={`px-5 py-5 ${visiblePlans.length > 1 ? 'grid grid-cols-2 gap-4' : ''}`}>
          {visiblePlans.map(p => (
            <div
              key={p.id}
              className={`rounded-xl border-2 p-4 relative ${
                p.id === 'max'
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-ink-200 bg-white'
              }`}
            >
              {p.tag && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {p.tag}
                </span>
              )}
              <p className="font-bold text-ink-900 text-base">{p.name}</p>
              <p className={`text-lg font-bold mt-0.5 mb-3 ${p.id === 'max' ? 'text-brand-700' : 'text-ink-700'}`}>
                {p.price}
              </p>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-xs text-ink-600 leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 space-y-2">
          <div className="w-full py-3 bg-ink-100 text-ink-400 text-sm font-semibold rounded-xl text-center cursor-default select-none">
            💳 Pagamento online em breve
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-ink-400 hover:text-ink-600 transition-colors"
          >
            Continuar no plano atual
          </button>
        </div>
      </div>
    </div>
  );
}
