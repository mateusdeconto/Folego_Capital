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
function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gold-500 flex items-center justify-center shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 5 V19 M7 5 H17" stroke="white" strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 12 H15" stroke="white" strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        </svg>
      </div>
      <span className={`font-bold text-[15px] tracking-tight ${dark ? 'text-white' : 'text-white'}`}>
        FinCheck
      </span>
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
            <span className="ml-2 text-[11px] text-white/30 font-mono">fincheck.ai/diagnóstico</span>
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
    a: 'Não. Seu contador continua essencial pra impostos e estratégia de longo prazo. O FinCheck é gestão do dia a dia — pra você tomar decisões rápidas sem marcar reunião.',
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
      className={`bg-navy-800 rounded-2xl border overflow-hidden transition-all duration-200
        ${open ? 'border-gold-400/40 shadow-sm' : 'border-white/10'}`}
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

// Task 2: Navbar + Hero + export default appended below
