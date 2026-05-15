import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase.js';
import { SSEParser } from '../lib/sseParser.js';

const LOADING_MESSAGES = [
  'Lendo seus números…',
  'Calculando margens e indicadores…',
  'Comparando com benchmarks do setor…',
  'Identificando pontos de atenção…',
  'Preparando recomendações práticas…',
  'Quase pronto — finalizando o relatório…',
];

const MAX_AUTO_RETRIES = 4;

function isOverloadedMsg(msg) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes('sobrecarregad') || lower.includes('overload');
}

export default function Loading({ businessData, financialData, accessToken, onComplete, onError }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError]               = useState(null);
  const [countdown, setCountdown]       = useState(null);
  const autoRetryCount                  = useRef(0);
  const fetchedRef                      = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        for (const payload of parser.feed(chunk)) {
          if (payload === '[DONE]') {
            clearTimeout(timeout);
            if (fullText) onComplete(fullText, capturedMacro);
            else throw new Error('Resposta vazia da IA. Tente novamente.');
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.macro_data) { capturedMacro = parsed.macro_data; continue; }
            if (parsed.text) fullText += parsed.text;
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.toLowerCase().includes('json')) throw parseErr;
          }
        }
      }

      clearTimeout(timeout);
      if (fullText) onComplete(fullText, capturedMacro);
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
      className="rounded-2xl p-10 text-center border border-white/10"
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

      <p className="text-white/40 text-sm mb-8">
        Analisando seus números — leva alguns segundos.
      </p>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
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
    </motion.div>
  );
}
