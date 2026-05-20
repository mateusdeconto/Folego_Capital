import React, { useState, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import UpgradeModal from './UpgradeModal.jsx';

/* ── Spring configs ───────────────────────────────────────── */
const spring = { type: 'spring', stiffness: 300, damping: 30 };
const springGentle = { type: 'spring', stiffness: 200, damping: 28 };
const ease = [0.25, 0.1, 0.25, 1];

/* ── Variants reutilizáveis (D-07 locked) ────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const fadeUpSpring = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
};
const staggerContainer = (stagger = 0.07, delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* ── InView wrapper ───────────────────────────────────────── */
function InView({ children, delay = 0, className = '', once = true }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </motion.div>
  );
}

/* ── Ícone inline ─────────────────────────────────────────── */
function Icon({ d, size = 18, className = '', strokeWidth = 1.7 }) {
  return (
    <svg
      width={size} height={size} fill="none"
      viewBox="0 0 24 24" stroke="currentColor"
      strokeWidth={strokeWidth} className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function ArrowRight({ size = 15 }) {
  return <Icon d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" size={size} strokeWidth={2.2} />;
}

/* ── Logo ─────────────────────────────────────────────────── */
function Logo() {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[20px] font-extrabold text-white tracking-tight">Fôlego</span>
      <span className="text-[18px] font-semibold text-gold-400 tracking-tight">Capital</span>
    </div>
  );
}

/* ── Número animado (counter) ────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring$ = useSpring(motionVal, { damping: 30, stiffness: 100 });
  const display = useTransform(spring$, v => `${prefix}${Math.round(v).toLocaleString('pt-BR')}${suffix}`);

  React.useEffect(() => {
    if (isInView) motionVal.set(value);
  }, [isInView, value, motionVal]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ── Mock do relatório (D-10, D-11, D-12) ───────────────── */
function ReportCard({ cardStyle = {}, badgeStyle = {}, metricsStyle = {}, recoStyle = {} }) {
  return (
    <div className="relative">
      {/* Outer card wrapper */}
      <motion.div
        className="relative bg-navy-800 rounded-2xl shadow-gold border border-white/10 overflow-hidden"
        style={cardStyle}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...springGentle, delay: 0.55 }}
      >
        {/* Header do card */}
        <div className="bg-navy-950 px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="ml-2 text-[11px] text-white/30 font-mono">folegocapital.com.br/diagnóstico</span>
          </div>
          <p className="text-[11px] text-white/50 font-medium uppercase tracking-widest mb-1">
            Diagnóstico financeiro
          </p>
          <p className="text-lg font-bold text-white leading-tight">Padaria do João</p>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          {/* Badge saúde */}
          <motion.div
            className="flex items-center gap-2 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20"
            style={badgeStyle}
          >
            <div className="w-7 h-7 rounded-lg bg-gold-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-gold-400 font-bold uppercase tracking-wider">
                Saúde financeira
              </p>
              <p className="text-sm font-bold text-white">Saudável ↑</p>
            </div>
          </motion.div>

          {/* Métricas */}
          <motion.div className="grid grid-cols-2 gap-2.5" style={metricsStyle}>
            <div className="bg-navy-900 rounded-xl p-3 border border-white/8">
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide mb-1">
                Lucro líquido
              </p>
              <p className="text-[17px] font-bold text-gold-400 font-mono">R$ 8.420</p>
              <p className="text-[10px] text-white/40 mt-0.5">margem 14,2%</p>
            </div>
            <div className="bg-navy-900 rounded-xl p-3 border border-white/8">
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide mb-1">
                Margem bruta
              </p>
              <p className="text-[17px] font-bold text-white font-mono">69,3%</p>
              <p className="text-[10px] text-white/40 mt-0.5">acima da média ✓</p>
            </div>
          </motion.div>

          {/* Recomendação */}
          <motion.div className="border-l-2 border-gold-400 pl-3" style={recoStyle}>
            <p className="text-[11px] text-gold-400 font-bold uppercase tracking-wide mb-1">
              Ação esta semana
            </p>
            <p className="text-[12px] text-white/60 leading-relaxed">
              Margem bruta acima da média do setor. Reinvista parte do lucro em equipamento — você tem fôlego.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Card flutuante menor (D-12) */}
      <motion.div
        className="absolute -right-6 -bottom-6 bg-navy-800 rounded-xl shadow-lg border border-white/10 px-3.5 py-3"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-[10px] text-white/40 font-medium mb-0.5">Vs. setor (Alimentação)</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold-500" />
          <p className="text-xs font-bold text-white">Você está acima da média</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Mock do relatório — versão ERRO (Padaria do João sem Fôlego Capital) ── */
function ReportCardError() {
  return (
    <div className="relative">
      <motion.div
        className="relative bg-navy-800 rounded-2xl shadow-lg border border-red-500/25 overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springGentle, delay: 0.6 }}
      >
        {/* Header */}
        <div className="bg-navy-950 px-6 py-5">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <span className="w-3 h-3 rounded-full bg-white/10" />
            <span className="ml-3 text-xs text-white/30 font-mono">folegocapital.com.br/diagnóstico</span>
          </div>
          <p className="text-xs text-white/50 font-medium uppercase tracking-widest mb-1">
            Diagnóstico financeiro
          </p>
          <p className="text-xl font-bold text-white leading-tight">Padaria do João</p>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5">
          {/* Badge saúde — alerta */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25">
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Saúde financeira</p>
              <p className="text-base font-bold text-white">Em risco crítico ↓</p>
            </div>
          </div>

          {/* Métricas — negativas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-900 rounded-xl p-4 border border-red-500/20">
              <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wide mb-1.5">Lucro líquido</p>
              <p className="text-[26px] font-bold text-red-400 font-mono leading-none">-R$ 2.840</p>
              <p className="text-[11px] text-red-400/60 mt-1.5">prejuízo no mês ↓</p>
            </div>
            <div className="bg-navy-900 rounded-xl p-4 border border-red-500/20">
              <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wide mb-1.5">Margem bruta</p>
              <p className="text-[26px] font-bold text-red-400 font-mono leading-none">18,4%</p>
              <p className="text-[11px] text-red-400/60 mt-1.5">abaixo da média ✗</p>
            </div>
          </div>

          {/* Alerta */}
          <div className="border-l-2 border-red-400 pl-4">
            <p className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1">⚠ Alerta crítico</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Custo operacional engolindo o faturamento. João está perdido e não sabe.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Badge flutuante — vermelho */}
      <motion.div
        className="absolute -right-5 -bottom-5 bg-navy-800 rounded-xl shadow-lg border border-red-500/25 px-4 py-3"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-[11px] text-white/40 font-medium mb-0.5">Vs. setor (Alimentação)</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <p className="text-sm font-bold text-white">Você está abaixo da média</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Mock do relatório — versão SUCESSO (Padaria do João com Fôlego Capital) ── */
function ReportCardSuccess() {
  return (
    <div className="relative">
      <motion.div
        className="relative bg-navy-800 rounded-2xl shadow-gold border border-gold-500/20 overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ ...springGentle, delay: 0.3 }}
      >
        {/* Header */}
        <div className="bg-navy-950 px-6 py-5">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-3 h-3 rounded-full bg-white/15" />
            <span className="w-3 h-3 rounded-full bg-white/15" />
            <span className="w-3 h-3 rounded-full bg-white/15" />
            <span className="ml-3 text-xs text-white/30 font-mono">folegocapital.com.br/diagnóstico</span>
          </div>
          <p className="text-xs text-white/50 font-medium uppercase tracking-widest mb-1">
            Diagnóstico financeiro
          </p>
          <p className="text-xl font-bold text-white leading-tight">
            Padaria do João <span className="text-gold-400 text-base font-semibold">com Fôlego Capital ✓</span>
          </p>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5">
          {/* Badge saúde — ok */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-500/10 border border-gold-500/20">
            <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gold-400 font-bold uppercase tracking-wider">Saúde financeira</p>
              <p className="text-base font-bold text-white">Saudável ↑</p>
            </div>
          </div>

          {/* Métricas — positivas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-900 rounded-xl p-4 border border-white/8">
              <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wide mb-1.5">Lucro líquido</p>
              <p className="text-[26px] font-bold text-gold-400 font-mono leading-none">R$ 8.420</p>
              <p className="text-[11px] text-white/40 mt-1.5">margem 14,2% ↑</p>
            </div>
            <div className="bg-navy-900 rounded-xl p-4 border border-white/8">
              <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wide mb-1.5">Margem bruta</p>
              <p className="text-[26px] font-bold text-white font-mono leading-none">69,3%</p>
              <p className="text-[11px] text-white/40 mt-1.5">acima da média ✓</p>
            </div>
          </div>

          {/* Recomendação */}
          <div className="border-l-2 border-gold-400 pl-4">
            <p className="text-xs text-gold-400 font-bold uppercase tracking-wide mb-1">Ação esta semana</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Margem acima do setor. Reinvista parte do lucro em equipamento — você tem fôlego.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Badge flutuante — dourado */}
      <motion.div
        className="absolute -right-5 -bottom-5 bg-navy-800 rounded-xl shadow-lg border border-gold-500/20 px-4 py-3"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-[11px] text-white/40 font-medium mb-0.5">Vs. setor (Alimentação)</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />
          <p className="text-sm font-bold text-white">Você está acima da média</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Dados de conteúdo ────────────────────────────────────── */

const PAIN_POINTS = [
  'Termina o mês sem saber se sobrou ou faltou de verdade',
  'Tira do bolso pra cobrir o caixa e perde a conta',
  'Vende muito mas não sente o lucro chegando',
  'Decide preço, contratação e investimento "no feeling"',
  'Não sabe se sua margem é boa ou ruim pro seu setor',
  'Vê dívida acumulando e não tem clareza se ainda tá no controle',
];

const STEPS_FLOW = [
  {
    n: '01',
    title: 'Você responde 7 perguntas',
    desc: 'Faturamento, custos, gastos fixos, dívidas. Em linguagem de dono — sem precisar saber contabilidade.',
  },
  {
    n: '02',
    title: 'A IA cruza com benchmarks do setor',
    desc: 'Calculamos margens, ponto de equilíbrio, saúde do caixa e comparamos com PMEs do mesmo segmento.',
  },
  {
    n: '03',
    title: 'Você recebe o relatório completo',
    desc: 'Diagnóstico, DRE em Excel pro contador, alertas de risco e ações práticas pra essa semana.',
  },
];

const FEATURES = [
  {
    title: 'Diagnóstico em linguagem de dono',
    desc: 'O que tá indo bem, o que tá sangrando, o que fazer essa semana. Sem jargão.',
    d: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
    accent: 'bg-gold-50 text-gold-600',
  },
  {
    title: 'Benchmark do seu setor',
    desc: 'Suas margens versus PMEs do mesmo segmento. Você sabe exatamente onde está.',
    d: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    accent: 'bg-brand-50 text-brand-600',
  },
  {
    title: 'DRE pronta pro contador',
    desc: 'Demonstração de Resultado em Excel, com totais e categorias. Manda sem refazer nada.',
    d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Chat com IA que conhece seus números',
    desc: 'Pergunta sobre margem, dívida, qualquer coisa. A IA já tem contexto do seu diagnóstico.',
    d: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Alertas antes do problema virar crise',
    desc: 'Margem baixa, caixa apertado, dívidas demais, mistura PJ/PF — identificamos automaticamente.',
    d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    accent: 'bg-loss-50 text-loss-600',
  },
  {
    title: 'Evolução mês a mês',
    desc: 'Refaça o diagnóstico todo mês. Guardamos o histórico e mostramos se você tá melhorando.',
    d: 'M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941',
    accent: 'bg-gold-50 text-gold-600',
  },
];

const FAQS = [
  {
    q: 'Os meus números ficam salvos?',
    a: 'Sim. Seus diagnósticos ficam salvos na sua conta com segurança na nuvem. Você pode acessar de qualquer dispositivo. Os dados são usados pela IA apenas para gerar o diagnóstico e nunca são compartilhados com terceiros.',
  },
  {
    q: 'Tem versão gratuita e paga?',
    a: 'Sim. O plano gratuito inclui o diagnóstico completo e exportação de relatório. O plano Pro desbloqueia o consultor IA, histórico de análises, acompanhamento mensal e DRE comparativa. Você começa grátis e decide se quer mais.',
  },
  {
    q: 'Quanto tempo leva?',
    a: 'Cerca de 5 minutos. Tenha em mãos: faturamento do mês, custo da operação, gastos fixos, saldo da conta e parcelas de dívidas. Valores aproximados servem.',
  },
  {
    q: 'Substitui meu contador?',
    a: 'Não. Seu contador continua essencial pra impostos e estratégia de longo prazo. O Fôlego Capital é gestão do dia a dia — pra você tomar decisões rápidas sem marcar reunião.',
  },
  {
    q: 'Pra que tipo de empresa serve?',
    a: 'PMEs brasileiras de qualquer setor — restaurante, varejo, serviços, clínica, salão, oficina, escola, indústria. Os benchmarks são adaptados pro seu segmento.',
  },
];

/* ── FAQ item com accordion ───────────────────────────────── */
function FaqItem({ q, a, i }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`rounded-2xl border overflow-hidden transition-all duration-200
        ${open ? 'border-gold-400/40 shadow-sm' : 'border-white/10'}`}
      style={{ background: '#253d63' }}
      whileHover={{ borderColor: 'rgba(251,191,36,0.25)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-white">{q}</span>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
          ${open ? 'bg-gold-500/15 text-gold-400' : 'bg-white/8 text-white/40'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.5}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-sm text-white/60 leading-relaxed border-t border-white/10 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export default function Landing({ onEnter, user, plan, onHistory }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const heroRef = useRef(null);

  function handleHistoricoClick() {
    if (plan === 'pro' && onHistory) {
      onHistory();
    } else {
      setShowUpgrade(true);
    }
  }

  // Scroll-driven ReportCard transforms (D-11)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const cardOpacity    = useTransform(scrollYProgress, [0,    0.15], [0, 1]);
  const cardY          = useTransform(scrollYProgress, [0,    0.15], [20, 0]);
  const badgeOpacity   = useTransform(scrollYProgress, [0.15, 0.30], [0, 1]);
  const badgeX         = useTransform(scrollYProgress, [0.15, 0.30], [-8, 0]);
  const metricsOpacity = useTransform(scrollYProgress, [0.25, 0.40], [0, 1]);
  const recoOpacity    = useTransform(scrollYProgress, [0.35, 0.50], [0, 1]);

  return (
    <div className="landing-root">

      {/* ── NAVBAR (LP-04) ──────────────────────────────── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-md border-b border-white/10"
        style={{ backgroundColor: 'rgba(3,8,16,0.80)' }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div className="landing-container flex items-center justify-between h-full">
          <Logo dark />
          <nav className="flex items-center gap-1">
            <a href="#como-funciona"
              className="hidden sm:block px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors">
              Como funciona
            </a>
            <button
              onClick={handleHistoricoClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Histórico
            </button>
            <motion.button
              onClick={onEnter}
              className="ml-2 btn-gold text-sm py-2 px-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}>
              {user ? 'Minha conta' : 'Começar grátis'}
            </motion.button>
          </nav>
        </div>
      </motion.header>

      {/* ── HERO (LP-01, LP-02, LP-03) ─────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden min-h-screen bg-slate-950 pt-16">
        {/* Glow orb 1 — centered top, large */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full z-0 animate-[glow-pulse_10s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 70%)' }}
        />
        {/* Glow orb 2 — lower right, offset */}
        <div
          className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full z-0 animate-[glow-pulse_12s_ease-in-out_2s_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)' }}
        />

        <div className="landing-container relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Hero text — centralizado, largura total */}
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.15, 0.1)}
          >
            {/* Badge */}
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2.5 mb-8 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-xs font-bold text-red-400 tracking-widest uppercase">
                Saúde da empresa em risco
              </span>
            </motion.div>

            {/* Headline — stagger per line, grande */}
            <motion.h1
              className="font-black text-white text-[3.2rem] sm:text-6xl md:text-[5rem] lg:text-[5.5rem] leading-[1.02] tracking-tighter mb-8"
              variants={staggerContainer(0.18, 0)}
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={fadeUp} className="block">Seu negócio dá lucro</motion.span>
              <motion.span
                variants={fadeUp}
                className="block text-gold-400"
                animate={{ textShadow: ['0 0 40px rgba(245,158,11,0)', '0 0 60px rgba(245,158,11,0.3)', '0 0 40px rgba(245,158,11,0)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                de verdade?
              </motion.span>
            </motion.h1>

            {/* Subtext */}
            <motion.p variants={fadeUp}
              className="text-xl text-white/60 leading-relaxed mb-10 max-w-2xl mx-auto">
              Descubra em 3 minutos o que seus números realmente dizem — e o que fazer agora.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap mb-12">
              {/* Botão com anel pulsante */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gold-500/30"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.button
                  onClick={onEnter}
                  className="relative btn-gold inline-flex items-center gap-2 text-base px-6 py-3"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  Fazer meu diagnóstico
                  <ArrowRight size={16} />
                </motion.button>
              </div>
              <a href="#como-funciona"
                className="text-sm font-semibold text-white/50 hover:text-white/80 transition-colors py-2">
                Ver como funciona →
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="flex items-center justify-center gap-10 sm:gap-16 pt-8 border-t border-white/10 max-w-xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={staggerContainer(0.1, 0.7)}
            >
              {[
                { n: '3 min', label: 'para o diagnóstico' },
                { n: '100%', label: 'gratuito para começar' },
                { n: 'IA', label: 'com dados do seu setor' },
              ].map(s => (
                <motion.div key={s.n} variants={fadeUpSpring} className="text-center">
                  <p className="text-2xl font-bold text-white font-mono">{s.n}</p>
                  <p className="text-[11px] text-white/40 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ReportCard de erro — Padaria do João perdido */}
          <motion.div
            className="mt-20 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springGentle, delay: 1.0 }}
          >
            <motion.p
              className="text-center text-sm text-white/50 uppercase tracking-widest font-bold mb-6 flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <span className="w-8 h-px bg-white/20" />
              É assim que João estava antes
              <span className="w-8 h-px bg-white/20" />
            </motion.p>
            <ReportCardError />
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS (LP-05) — fundo escuro ───────────── */}
      <section style={{ background: '#0F172A' }} className="py-24 sm:py-32">
        <div className="landing-container">
          <div className="max-w-3xl mx-auto">
            <InView className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-px bg-gold-500/60" />
                <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
                  POR QUE DONO DE NEGÓCIO NÃO DORME
                </span>
              </div>
              <h2 className="text-3xl sm:text-[2.6rem] font-bold text-white tracking-tighter leading-tight">
                Tocar um negócio sem ler<br className="hidden sm:block" /> os números é dirigir de olhos fechados.
              </h2>
            </InView>

            <motion.div
              className="space-y-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={staggerContainer(0.06)}
            >
              {PAIN_POINTS.map(p => (
                <motion.div
                  key={p}
                  variants={fadeUp}
                  className="group flex items-start gap-4 p-4 glass-card rounded-2xl cursor-default"
                  whileHover={{ x: 5, backgroundColor: 'rgba(245,158,11,0.04)', borderColor: 'rgba(251,191,36,0.25)' }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.18 }}
                >
                  <motion.div
                    className="w-6 h-6 rounded-full bg-gold-500/10 border border-gold-500/20
                                flex items-center justify-center flex-shrink-0 mt-0.5"
                    whileHover={{ scale: 1.2, backgroundColor: 'rgba(245,158,11,0.2)' }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-gold-400" />
                  </motion.div>
                  <p className="text-[15px] text-white/75 leading-relaxed group-hover:text-white/90 transition-colors">{p}</p>
                </motion.div>
              ))}
            </motion.div>

            <InView delay={100}>
              <div className="mt-10 p-5 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white/80">
                  Se marcou pelo menos um, é exatamente pra isso que o Fôlego Capital existe.
                </p>
              </div>
            </InView>
          </div>
        </div>
      </section>

      {/* ── TRANSFORMAÇÃO — paleta clareia progressivamente ── */}
      <section
        className="relative overflow-hidden py-28 sm:py-36"
        style={{ background: 'linear-gradient(to bottom, #0F172A 0%, #111827 25%, #152033 55%, #1a2842 80%, #1e3050 100%)' }}
      >
        {/* Glow ambiente suave — como amanhecer */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full z-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 65%)' }}
        />
        {/* Raios de luz discretos — saindo do escuro */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.04]"
            viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none">
            {[...Array(10)].map((_, i) => {
              const a = -50 + i * 11;
              const r = (a * Math.PI) / 180;
              return <line key={i} x1="600" y1="0" x2={600 + Math.sin(r) * 1800} y2={Math.cos(r) * 1800}
                stroke="#F59E0B" strokeWidth={i % 3 === 1 ? '3' : '1.5'} opacity={i % 2 ? '0.7' : '0.4'} />;
            })}
          </svg>
        </div>

        <div className="landing-container relative z-10 max-w-3xl mx-auto text-center">
          {/* Grande frase de impacto */}
          <InView>
            <motion.p
              className="text-[3rem] sm:text-[4rem] md:text-[5rem] font-black text-white tracking-tighter leading-none"
              whileInView={{ scale: [0.92, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              O Fôlego Capital vai
            </motion.p>
            <motion.p
              className="text-[3rem] sm:text-[4rem] md:text-[5rem] font-black text-gold-400 tracking-tighter leading-none mt-1"
              whileInView={{ scale: [0.92, 1] }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              animate={{
                textShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 60px rgba(245,158,11,0.35)', '0 0 0px rgba(245,158,11,0)'],
              }}
            >
              salvar você.
            </motion.p>
            <motion.p
              className="text-white/50 text-lg mt-6 max-w-md mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              O João não sabia que estava no vermelho. Com o Fôlego Capital, ele descobriu — e virou o jogo.
            </motion.p>
          </InView>

          {/* Card de sucesso: Padaria do João com Fôlego Capital */}
          <InView delay={200} className="mt-14">
            <div className="relative max-w-lg mx-auto">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <span className="bg-gold-500 text-navy-950 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  DRE · Padaria do João — Dessa vez com Fôlego Capital
                </span>
              </div>
              <div className="pt-6">
                <ReportCardSuccess />
              </div>
            </div>
          </InView>
        </div>
      </section>

      {/* ── COMO FUNCIONA (LP-06) ────────────────────────── */}
      <section id="como-funciona" className="py-24 sm:py-32" style={{ background: '#1e3050' }}>
        <div className="landing-container">
          <InView className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-gold-500/60" />
              <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
                COMO FUNCIONA
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tighter mb-3">
              Três passos. Três minutos.
            </h2>
            <p className="text-white/55 text-base leading-relaxed max-w-lg">
              Sem planilha pra preencher. Sem consultor pra contratar. Sem precisar saber contabilidade.
            </p>
          </InView>

          <div className="relative">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={staggerContainer(0.12)}
            >
              {STEPS_FLOW.map(s => (
                <motion.div
                  key={s.n}
                  variants={fadeUpSpring}
                  className="rounded-2xl p-7"
                  style={{ background: '#253d63', border: '1px solid rgba(255,255,255,0.10)' }}
                  whileHover={{ y: -6, scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', borderColor: 'rgba(251,191,36,0.30)' }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
                      <span className="text-gold-400 font-bold text-sm font-mono tracking-tight">{s.n}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2.5 leading-snug">{s.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (LP-07) ─────────────────────────────── */}
      <section className="py-24 sm:py-32" style={{ background: '#1a2c4a' }}>
        <div className="landing-container">
          <InView className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-gold-500/60" />
              <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
                O QUE VOCÊ DESCOBRE
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tighter mb-3">
              Um relatório que seu contador respeitaria.
            </h2>
            <p className="text-white/55 text-base leading-relaxed">
              Mas escrito pra você ler num café, sem precisar de tradução.
            </p>
          </InView>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer(0.06)}
          >
            {FEATURES.map(f => (
              <motion.div
                key={f.title}
                variants={fadeUpSpring}
                className="group p-6 rounded-2xl cursor-default"
                style={{ background: '#253d63', border: '1px solid rgba(255,255,255,0.10)' }}
                whileHover={{ y: -2, borderColor: 'rgba(251,191,36,0.28)', backgroundColor: '#2d4872' }}
                transition={{ duration: 0.18 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.accent}`}>
                  <Icon d={f.d} size={18} />
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 leading-snug">{f.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ (LP-08) ──────────────────────────────────── */}
      <section className="border-t border-white/8 py-24 sm:py-32" style={{ background: '#1e3050' }}>
        <div className="landing-container-narrow">
          <InView className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-8 h-px bg-gold-500/60" />
              <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
                PERGUNTAS FREQUENTES
              </span>
              <span className="w-8 h-px bg-gold-500/60" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">
              O que você quer saber antes de começar
            </h2>
          </InView>

          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <FaqItem key={item.q} q={item.q} a={item.a} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL (LP-03 reinforcement) ─────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: '#162540' }}>
        {/* Reuse a centered glow orb for visual interest */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-0 animate-[glow-pulse_12s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
        />
        <div className="landing-container-narrow relative z-10 text-center">
          <InView>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-8 h-px bg-gold-500/40" />
              <span className="text-xs font-bold text-gold-400/70 uppercase tracking-widest">
                Comece agora
              </span>
              <span className="w-8 h-px bg-gold-500/40" />
            </div>
            <h2 className="text-3xl sm:text-[2.8rem] font-bold text-white tracking-tighter mb-5 leading-tight">
              Cinco minutos agora vão colocar luz
              <br />
              <span className="text-gold-400">nos seus meses escuros.</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-10">
              Crie sua conta, responda 7 perguntas e receba seu diagnóstico completo.
              Grátis para começar.
            </p>
            <motion.button
              onClick={onEnter}
              className="btn-gold inline-flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              Começar diagnóstico — grátis
              <ArrowRight size={15} />
            </motion.button>
            <p className="text-xs text-white/25 mt-6">
              Diagnóstico grátis. Plano Pro para quem quer mais.
            </p>
          </InView>
        </div>
      </section>

      {/* ── FOOTER (LP-09) ───────────────────────────────── */}
      <footer className="border-t border-white/8 py-12" style={{ background: '#111f35' }}>
        <div className="landing-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-white/8">
            {/* Logo + tagline */}
            <div>
              <Logo dark />
              <p className="text-sm text-white/40 mt-3 leading-relaxed">
                Clareza financeira para quem toca o negócio.
              </p>
            </div>
            {/* Links */}
            <div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Produto</p>
              <nav className="space-y-2">
                <a href="#como-funciona" className="block text-sm text-white/50 hover:text-white/80 transition-colors">Como funciona</a>
                <button onClick={onEnter} className="block text-sm text-white/50 hover:text-white/80 transition-colors text-left">Fazer diagnóstico</button>
              </nav>
            </div>
            {/* Legal */}
            <div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Contato</p>
              <a href="mailto:folegocapital@gmail.com"
                className="text-sm text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors">
                folegocapital@gmail.com
              </a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/25">Feito pra empresas brasileiras · Dados salvos com segurança</p>
            <p className="text-xs text-white/20">© {new Date().getFullYear()} Fôlego Capital</p>
          </div>
        </div>
      </footer>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
