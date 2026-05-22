import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase.js';
import { SSEParser } from '../lib/sseParser.js';
import { SECTOR_BENCHMARKS } from './Onboarding.jsx';

const LOADING_MESSAGES = [
  'Lendo seus números…',
  'Calculando margens e indicadores…',
  'Comparando com benchmarks do setor…',
  'Identificando pontos de atenção…',
  'Preparando recomendações práticas…',
  'Quase pronto — finalizando o relatório…',
];

const MAX_AUTO_RETRIES = 4;

function fmtBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function buildInsights(fd, segment) {
  const bench = SECTOR_BENCHMARKS[segment] || SECTOR_BENCHMARKS.outro;
  const rev   = fd.revenue || 0;
  const cogs  = fd.cogs || 0;
  const fixed = fd.fixedExpenses || 0;
  const debt  = fd.debtPayment || 0;
  const cash  = fd.cashBalance || 0;
  const out = [];

  if (rev > 0 && cogs > 0) {
    const gm = ((rev - cogs) / rev) * 100;
    const [lo, hi] = bench.grossMargin;
    const ok = gm >= lo;
    out.push({
      status: ok ? 'ok' : 'warn',
      label: 'Margem bruta',
      value: `${gm.toFixed(1)}%`,
      detail: ok
        ? `Dentro da média do setor (${lo}–${hi}%)`
        : `Abaixo da média do setor (${lo}–${hi}%)`,
    });
  }

  if (rev > 0 && fixed > 0) {
    const pct = (fixed / rev) * 100;
    const [lo, hi] = bench.fixedCostPct || [20, 35];
    const ok = pct <= hi;
    out.push({
      status: ok ? 'ok' : 'warn',
      label: 'Gastos fixos',
      value: `${pct.toFixed(0)}% da receita`,
      detail: ok
        ? `Dentro da média setorial (${lo}–${hi}%)`
        : `Acima da média setorial (${lo}–${hi}%)`,
    });
  }

  if (cash !== 0) {
    out.push({
      status: cash >= 0 ? 'ok' : 'loss',
      label: 'Caixa atual',
      value: fmtBRL(cash),
      detail: cash >= 0 ? 'Positivo — você tem reserva' : 'Negativo — atenção ao fluxo de caixa',
    });
  }

  if (rev > 0 && debt > 0) {
    const pct = (debt / rev) * 100;
    const status = pct < 20 ? 'ok' : pct < 30 ? 'warn' : 'loss';
    out.push({
      status,
      label: 'Parcelas de dívidas',
      value: `${pct.toFixed(0)}% da receita`,
      detail: status === 'ok'
        ? 'Endividamento controlado'
        : status === 'warn'
          ? 'Patamar de atenção — monitore'
          : 'Comprometimento alto',
    });
  }

  return out;
}

function InsightCard({ insight }) {
  const colors = {
    ok:   { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80' },
    warn: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
    loss: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171' },
  };
  const icons = {
    ok:   <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />,
    warn: <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />,
    loss: <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />,
  };
  const c = colors[insight.status];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 rounded-xl p-3 border border-white/8"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
        <svg className="w-4 h-4" style={{ color: c.text }} fill="currentColor" viewBox="0 0 24 24">
          {icons[insight.status]}
        </svg>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">{insight.label}</p>
        <p className="text-sm font-bold text-white leading-tight">{insight.value}</p>
        <p className="text-[11px] text-white/45 leading-snug">{insight.detail}</p>
      </div>
    </motion.div>
  );
}

function isOverloadedMsg(msg) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes('sobrecarregad') || lower.includes('overload');
}

export default function Loading({ businessData, financialData, accessToken, onComplete, onError }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError]               = useState(null);
  const [countdown, setCountdown]       = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const autoRetryCount                  = useRef(0);
  const fetchedRef                      = useRef(false);
  const visibleTimerRef                 = useRef(null);

  const insights = useMemo(
    () => buildInsights(financialData, businessData.segment),
    [financialData, businessData.segment],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (insights.length === 0) return;
    let count = 0;
    visibleTimerRef.current = setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count >= insights.length) clearInterval(visibleTimerRef.current);
    }, 2500);
    return () => clearInterval(visibleTimerRef.current);
  }, [insights.length]);

  const fetchDiagnosis = useCallback(async () => {
    setError(null);
    setCountdown(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      // Sempre busca o token mais recente para evitar expiração
      const { data: sessionData } = await supabase.auth.getSession();
      const freshToken = sessionData?.session?.access_token || accessToken;

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
        },
        body: JSON.stringify({ ...businessData, ...financialData }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Você gerou muitos diagnósticos seguidos. Aguarde alguns minutos e tente novamente.');
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = new SSEParser();
      let fullText = '';
      let capturedMacro = null;
      let capturedResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        for (const payload of parser.feed(chunk)) {
          if (payload === '[DONE]') {
            clearTimeout(timeout);
            if (fullText) onComplete(fullText, capturedMacro, capturedResult);
            else throw new Error('Resposta vazia da IA. Tente novamente.');
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.macro_data)  { capturedMacro  = parsed.macro_data;  continue; }
            if (parsed.json_result) { capturedResult = parsed.json_result; continue; }
            if (parsed.text) fullText += parsed.text;
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.toLowerCase().includes('json')) throw parseErr;
          }
        }
      }

      clearTimeout(timeout);
      if (fullText) onComplete(fullText, capturedMacro, capturedResult);
      else throw new Error('Conexão interrompida antes do fim. Tente novamente.');
    } catch (err) {
      clearTimeout(timeout);
      console.error('Erro no diagnóstico:', err);
      const msg = err.name === 'AbortError'
        ? 'Tempo esgotado. Verifique sua conexão e tente novamente.'
        : err.message || 'Erro desconhecido';

      if (isOverloadedMsg(msg) && autoRetryCount.current < MAX_AUTO_RETRIES) {
        autoRetryCount.current += 1;
        let secs = 15;
        setCountdown(secs);
        const tick = setInterval(() => {
          secs -= 1;
          if (secs <= 0) {
            clearInterval(tick);
            setCountdown(null);
            fetchDiagnosis();
          } else {
            setCountdown(secs);
          }
        }, 1000);
      } else {
        setError(msg);
      }
    }
  }, [businessData, financialData, onComplete]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchDiagnosis();
  }, [fetchDiagnosis]);

  if (countdown !== null) {
    return (
      <motion.div
        className="rounded-2xl p-8 text-center border border-white/10"
        style={{ background: '#253d63' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-5 border" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <svg className="w-5 h-5 text-amber-400 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">A IA está sobrecarregada</h2>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Muita gente usando agora. Tentando novamente em…
        </p>
        <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center mx-auto mb-6" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <span className="text-xl font-bold text-white font-mono">{countdown}</span>
        </div>
        <button onClick={() => { setCountdown(null); fetchDiagnosis(); }} className="btn-back">
          Tentar agora
        </button>
      </motion.div>
    );
  }

  if (error) {
    const overloaded = isOverloadedMsg(error);
    return (
      <motion.div
        className="rounded-2xl p-8 text-center border border-white/10"
        style={{ background: '#253d63' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-5 border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          {overloaded ? 'IA temporariamente indisponível' : 'Algo deu errado'}
        </h2>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          {overloaded ? 'A IA está com alta demanda agora. Aguarde alguns segundos.' : error}
        </p>
        <button onClick={() => { autoRetryCount.current = 0; fetchDiagnosis(); }} className="btn-primary">
          Tentar novamente
        </button>
        <button onClick={onError} className="btn-back mt-2.5">
          Voltar ao formulário
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl p-6 sm:p-10 text-center border border-white/10"
      style={{ background: '#253d63' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Gold spinner */}
      <div className="flex justify-center mb-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-gold-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Business name */}
      <p className="text-[11px] font-bold text-gold-400 uppercase tracking-widest mb-3">
        {businessData.businessName}
      </p>

      {/* Animated message — AnimatePresence fade */}
      <div className="relative min-h-[56px] flex items-center justify-center mb-3">
        <AnimatePresence mode="wait">
          <motion.h2
            key={messageIndex}
            className="text-xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {LOADING_MESSAGES[messageIndex]}
          </motion.h2>
        </AnimatePresence>
      </div>

      <p className="text-white/40 text-sm mb-6">
        Analisando seus números — leva alguns segundos.
      </p>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mb-6">
        {LOADING_MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === messageIndex ? 20 : 6,
              backgroundColor: i === messageIndex ? '#F59E0B' : 'rgba(255,255,255,0.15)',
            }}
            transition={{ duration: 0.3 }}
            className="h-1 rounded-full"
          />
        ))}
      </div>

      {/* Progressive insights */}
      {visibleCount > 0 && (
        <div className="space-y-2 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3 text-center">
            Calculando agora
          </p>
          <AnimatePresence>
            {insights.slice(0, visibleCount).map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
