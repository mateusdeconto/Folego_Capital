import { useMemo, useState, useEffect, useRef } from 'react';
import { trackEvent } from '../lib/analytics.js';
import { calcMetrics, generateWeeklyPlan } from '../lib/metrics.js';
import { formatReferenceMonth } from '../lib/export.js';
import {
  loadActiveWeeklyPlan,
  saveWeeklyPlan,
  updateActionStatus,
  deactivateWeeklyPlan,
  recordCheckin,
  calcPlanStatus,
} from '../lib/weeklyPlans.js';

const RISK_TONE = {
  critical: { bg: 'bg-loss-50',  border: 'border-loss-200',  text: 'text-loss-700',  dot: 'bg-loss-500',  pulse: true  },
  warn:     { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', pulse: true  },
  ok:       { bg: 'bg-money-50', border: 'border-money-200', text: 'text-money-700', dot: 'bg-money-500', pulse: false },
};

const STATUS_CONFIG = {
  pending:     { label: 'Pendente',       icon: PendingIcon,    style: 'text-ink-400 bg-ink-50 border-ink-200'   },
  in_progress: { label: 'Em andamento',   icon: InProgressIcon, style: 'text-amber-600 bg-amber-50 border-amber-200' },
  done:        { label: 'Concluída',      icon: DoneIcon,       style: 'text-money-600 bg-money-50 border-money-200' },
};

const STATUS_CYCLE = { pending: 'in_progress', in_progress: 'done', done: 'pending' };

function PendingIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function InProgressIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 A9 9 0 0 1 21 12 L12 12 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DoneIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" className="opacity-20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.5l3 3 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function formatDate(isoString) {
  if (!isoString) return null;
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
}

function ProgressBar({ actions }) {
  const done = actions.filter(a => a.status === 'done').length;
  const inProgress = actions.filter(a => a.status === 'in_progress').length;
  const total = actions.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-money-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-ink-500 font-medium whitespace-nowrap">
        {done}/{total} {inProgress > 0 ? `· ${inProgress} em andamento` : ''}
      </span>
    </div>
  );
}

export default function WeeklyPlan({
  businessData,
  financialData,
  user,
  companyDiagnoses = [],
  onOpenChat,
  onOpenChatWithContext,
  onBack,
}) {
  const [savedPlan, setSavedPlan] = useState(null);
  const [actions, setActions] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'generating' | 'error'
  const [updatingId, setUpdatingId] = useState(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinSaving, setCheckinSaving] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const noteRef = useRef(null);

  const metrics = useMemo(() => calcMetrics(financialData), [financialData]);
  const generatedPlan = useMemo(() => generateWeeklyPlan(metrics, financialData), [metrics, financialData]);

  const latestDiagnosis = companyDiagnoses[0] || null;

  const isStale = useMemo(() => {
    if (!savedPlan?.source_diagnosis_created_at || !latestDiagnosis?.created_at) return false;
    return new Date(latestDiagnosis.created_at) > new Date(savedPlan.source_diagnosis_created_at);
  }, [savedPlan, latestDiagnosis]);

  const planStatus = useMemo(() => {
    if (!savedPlan) return null;
    return calcPlanStatus(savedPlan, latestDiagnosis?.created_at);
  }, [savedPlan, latestDiagnosis]);

  const displayRisk = useMemo(() => {
    if (savedPlan) {
      return { level: savedPlan.main_risk_level, text: savedPlan.main_risk_text };
    }
    return generatedPlan.mainRisk;
  }, [savedPlan, generatedPlan]);

  const tone = RISK_TONE[displayRisk?.level] || RISK_TONE.ok;

  const refMonth = businessData?.referenceMonth
    ? formatReferenceMonth(businessData.referenceMonth)
    : null;

  const loadOrGenerate = async (forceNew = false) => {
    if (!user) {
      // Sem usuário: apenas mostra plano em memória, sem persistir
      const mapped = generatedPlan.actions.map(a => ({
        id: `local-${a.priority}`,
        priority: a.priority,
        title: a.action,
        reason: a.reason,
        expected_impact: a.impact,
        status: 'pending',
      }));
      setActions(mapped);
      setLoadState('ready');
      return;
    }

    setLoadState(forceNew ? 'generating' : 'loading');

    try {
      if (!forceNew) {
        const existing = await loadActiveWeeklyPlan(
          user.id,
          businessData.businessName,
          businessData.segment,
          businessData.customSegment || null
        );

        if (existing) {
          setSavedPlan(existing);
          setActions(existing.weekly_plan_actions || []);
          setLoadState('ready');
          return;
        }
      } else if (savedPlan) {
        await deactivateWeeklyPlan(savedPlan.id);
        setSavedPlan(null);
        trackEvent('weekly_plan_regenerated', {
          company: businessData?.businessName || null,
          prev_plan_id: savedPlan.id,
        });
      }

      // Gera e persiste novo plano
      setLoadState('generating');
      const newPlan = await saveWeeklyPlan(
        user.id,
        businessData,
        generatedPlan.mainRisk,
        generatedPlan.actions,
        latestDiagnosis
      );

      if (newPlan) {
        const mappedActions = generatedPlan.actions.map((a, i) => ({
          id: null, // será preenchido no próximo load
          _tempId: `temp-${i}`,
          priority: a.priority,
          title: a.action,
          reason: a.reason,
          expected_impact: a.impact,
          status: 'pending',
        }));

        // Recarrega do banco para ter os IDs reais das ações
        const fresh = await loadActiveWeeklyPlan(
          user.id,
          businessData.businessName,
          businessData.segment,
          businessData.customSegment || null
        );

        if (fresh) {
          setSavedPlan(fresh);
          setActions(fresh.weekly_plan_actions || []);
        } else {
          setActions(mappedActions);
        }
      } else {
        // Falhou ao salvar — mostra sem persistência
        const fallback = generatedPlan.actions.map(a => ({
          id: `local-${a.priority}`,
          priority: a.priority,
          title: a.action,
          reason: a.reason,
          expected_impact: a.impact,
          status: 'pending',
        }));
        setActions(fallback);
      }

      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  };

  // Ref sempre aponta para a versão mais recente de loadOrGenerate — evita stale closure
  const loadOrGenerateRef = useRef(loadOrGenerate);
  useEffect(() => { loadOrGenerateRef.current = loadOrGenerate; });

  useEffect(() => {
    loadOrGenerateRef.current(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleStatus(action) {
    const nextStatus = STATUS_CYCLE[action.status] || 'pending';

    if (!action.id || String(action.id).startsWith('local-') || String(action.id).startsWith('temp-')) {
      setActions(prev => prev.map(a => a === action ? { ...a, status: nextStatus } : a));
      return;
    }

    setUpdatingId(action.id);
    const ok = await updateActionStatus(action.id, nextStatus);
    if (ok) {
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, status: nextStatus } : a));
      trackEvent('weekly_plan_action_status_changed', {
        action_id: action.id,
        prev_status: action.status,
        next_status: nextStatus,
        company: businessData?.businessName || null,
      });
    }
    setUpdatingId(null);
  }

  function handleOpenChatForAction(action) {
    const msg = `Preciso de ajuda com esta ação do meu plano semanal:\n\n**${action.title}**\n\nMotivo: ${action.reason}\nImpacto esperado: ${action.expected_impact}\n\nPode me orientar como executar isso na prática?`;
    trackEvent('chat_opened_from_weekly_plan', {
      action_id: action.id,
      action_priority: action.priority,
      company: businessData?.businessName || null,
    });
    if (onOpenChatWithContext) {
      onOpenChatWithContext(msg);
    } else if (onOpenChat) {
      onOpenChat();
    }
  }

  async function handleCheckin() {
    if (!savedPlan?.id) return;
    setCheckinSaving(true);
    const ok = await recordCheckin(savedPlan.id, checkinNote.trim());
    if (ok) {
      setSavedPlan(prev => ({
        ...prev,
        last_checkin_at: new Date().toISOString(),
        checkin_note: checkinNote.trim() || null,
      }));
      trackEvent('weekly_plan_checkin_completed', {
        plan_id: savedPlan.id,
        has_note: checkinNote.trim().length > 0,
        company: businessData?.businessName || null,
      });
      setCheckinDone(true);
      setShowCheckin(false);
      setCheckinNote('');
    }
    setCheckinSaving(false);
  }

  if (loadState === 'loading') {
    return (
      <div className="space-y-4">
        <div className="mb-1">
          <p className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-2">Plano da semana</p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-tighter">{businessData?.businessName}</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-3 border-ink-100 border-t-ink-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (loadState === 'generating') {
    return (
      <div className="space-y-4">
        <div className="mb-1">
          <p className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-2">Plano da semana</p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-tighter">{businessData?.businessName}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-brand-100 border-t-brand-600 animate-spin" />
          <p className="text-sm text-ink-500">Gerando plano da semana…</p>
        </div>
      </div>
    );
  }

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
        {savedPlan?.created_at && (
          <p className="text-ink-400 text-xs mt-1">
            Plano gerado em {formatDate(savedPlan.created_at)}
          </p>
        )}
      </div>

      {/* Status do plano + check-in */}
      {savedPlan && !isStale && planStatus && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
          planStatus === 'precisa_revisao'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-money-50 border-money-200'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${planStatus === 'precisa_revisao' ? 'bg-amber-400' : 'bg-money-500'}`} />
            <div className="min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wider ${planStatus === 'precisa_revisao' ? 'text-amber-700' : 'text-money-700'}`}>
                {planStatus === 'precisa_revisao' ? 'Plano precisa de revisão' : 'Plano ativo'}
              </p>
              {planStatus === 'precisa_revisao' && (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Sem atividade há mais de 7 dias — atualize o status das ações.
                </p>
              )}
              {checkinDone && (
                <p className="text-[11px] text-money-600 mt-0.5">Check-in registrado!</p>
              )}
            </div>
          </div>
          <button
            onClick={() => { setShowCheckin(true); setCheckinDone(false); setTimeout(() => noteRef.current?.focus(), 50); }}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              planStatus === 'precisa_revisao'
                ? 'text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'text-money-700 border-money-300 hover:bg-money-100'
            }`}
          >
            Fazer check-in
          </button>
        </div>
      )}

      {/* Modal de check-in */}
      {showCheckin && (
        <div className="card p-5 border-2 border-brand-200 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink-900">Check-in semanal</p>
            <button onClick={() => setShowCheckin(false)} className="text-ink-400 hover:text-ink-600 text-xs">Fechar</button>
          </div>

          {/* Resumo automático das ações */}
          {actions.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Concluídas', count: actions.filter(a => a.status === 'done').length, color: 'text-money-700 bg-money-50' },
                { label: 'Em andamento', count: actions.filter(a => a.status === 'in_progress').length, color: 'text-amber-700 bg-amber-50' },
                { label: 'Pendentes', count: actions.filter(a => a.status === 'pending').length, color: 'text-ink-600 bg-ink-50' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-lg px-2 py-2 ${color}`}>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-600 block mb-1.5">
              O que mudou essa semana? <span className="font-normal text-ink-400">(opcional)</span>
            </label>
            <textarea
              ref={noteRef}
              value={checkinNote}
              onChange={e => setCheckinNote(e.target.value)}
              placeholder="Ex: fechei um contrato novo, cortei fornecedor caro, receita ainda abaixo do esperado…"
              rows={3}
              className="w-full text-sm border border-ink-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-brand-400 text-ink-800 placeholder:text-ink-300"
            />
          </div>

          <button
            onClick={handleCheckin}
            disabled={checkinSaving}
            className="btn-primary w-full"
          >
            {checkinSaving ? 'Salvando…' : 'Confirmar check-in'}
          </button>
        </div>
      )}

      {/* Aviso: plano desatualizado */}
      {isStale && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-amber-50 border-amber-200">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Plano desatualizado</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Novo diagnóstico disponível desde {formatDate(latestDiagnosis?.created_at)}. Regenere para alinhar com os dados mais recentes.
            </p>
          </div>
          <button
            onClick={() => loadOrGenerate(true)}
            className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Regenerar
          </button>
        </div>
      )}

      {/* Principal risco */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${tone.bg} ${tone.border}`}>
        <span className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${tone.dot} ${tone.pulse ? 'animate-pulse' : ''}`} />
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${tone.text}`}>
            Principal risco agora
          </p>
          <p className={`text-sm leading-relaxed font-medium ${tone.text}`}>{displayRisk.text}</p>
        </div>
      </div>

      {/* Progresso */}
      {actions.length > 0 && <ProgressBar actions={actions} />}

      {/* Ações */}
      <div>
        <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">
          Suas 3 ações desta semana
        </p>
        <div className="space-y-3">
          {actions.map((action) => {
            const statusCfg = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const isUpdating = updatingId === action.id;

            return (
              <div
                key={action.id || action._tempId || action.priority}
                className={`card p-5 transition-opacity ${action.status === 'done' ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {action.priority}
                  </span>
                  <p className={`flex-1 text-sm font-bold leading-snug ${action.status === 'done' ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                    {action.title}
                  </p>

                  {/* Status toggle */}
                  <button
                    onClick={() => handleToggleStatus(action)}
                    disabled={isUpdating}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold transition-all flex-shrink-0 ${statusCfg.style} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                    title="Clique para atualizar status"
                  >
                    <StatusIcon />
                    <span className="hidden sm:inline">{statusCfg.label}</span>
                  </button>
                </div>

                <div className="ml-9 space-y-2.5">
                  <div>
                    <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-0.5">Por quê</p>
                    <p className="text-xs text-ink-600 leading-relaxed">{action.reason}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-0.5">Impacto esperado</p>
                    <p className="text-xs text-ink-600 leading-relaxed">{action.expected_impact}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenChatForAction(action)}
                  className="mt-3 ml-9 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                >
                  Pedir ajuda à IA sobre isso <ChevronRight />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-2">
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

        {savedPlan && !isStale && (
          <button
            onClick={() => loadOrGenerate(true)}
            className="w-full text-xs font-medium text-ink-400 hover:text-ink-600 transition-colors py-1"
          >
            Regenerar plano
          </button>
        )}
      </div>

      <button onClick={onBack} className="btn-back">← Voltar</button>

      <p className="text-center text-xs text-ink-400 pb-4">
        Fôlego Capital — decisão semanal para dono de PME
      </p>
    </div>
  );
}
