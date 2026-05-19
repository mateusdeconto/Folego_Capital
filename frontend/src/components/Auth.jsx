import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  formatDocument,
  validateDocument,
  normalizeDocument,
  checkDocumentExists,
  saveUserDocument,
} from '../lib/documents.js';

function Logo() {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[22px] font-extrabold text-ink-900 tracking-tight">Fôlego</span>
      <span className="text-[20px] font-semibold text-gold-600 tracking-tight">Capital</span>
    </div>
  );
}

function EyeIcon({ open }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {open
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      }
    </svg>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-loss-50 border border-loss-100 rounded-xl">
      <svg className="w-4 h-4 text-loss-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p className="text-sm text-loss-700">{message}</p>
    </div>
  );
}

function SuccessBox({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-money-50 border border-money-200 rounded-xl">
      <svg className="w-4 h-4 text-money-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-money-800">{message}</p>
    </div>
  );
}

function inputCls(extra = '') {
  return `w-full px-4 py-3 border border-ink-200 rounded-xl text-sm text-ink-900 placeholder:text-ink-300 bg-ink-50 focus:outline-none focus:ring-2 focus:ring-money-300 focus:border-money-400 focus:bg-white transition-all duration-150 ${extra}`.trim();
}

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 bg-money-500 hover:bg-money-600 text-white text-sm font-bold rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-money flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
}

export default function Auth({ onComplete, recoveryMode = false, onRecoveryComplete }) {
  const [tab, setTab] = useState('register');
  const [mode, setMode] = useState('form'); // 'form' | 'forgot' | 'forgotSent'

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDocument, setRegDocument] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');

  // Recovery (reset password)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function clear() { setError(''); setSuccess(''); }

  function handleDocumentChange(e) {
    setRegDocument(formatDocument(e.target.value));
    clear();
  }

  async function handleRegister(e) {
    e.preventDefault();
    clear();

    if (!validateDocument(regDocument)) {
      setError('CPF ou CNPJ inválido. Verifique o número digitado.');
      return;
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Uso para criar uma conta.');
      return;
    }

    setLoading(true);
    try {
      const normalizedDoc = normalizeDocument(regDocument);
      const docType = normalizedDoc.length === 11 ? 'cpf' : 'cnpj';

      const exists = await checkDocumentExists(normalizedDoc);
      if (exists) {
        throw new Error('CPF/CNPJ já vinculado a outra conta. Faça login ou recupere seu acesso.');
      }

      const { data, error: err } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            document: normalizedDoc,
            document_type: docType,
            email_marketing_opt_in: acceptMarketing,
            terms_accepted_at: new Date().toISOString(),
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (err) throw err;

      if (data.session) {
        const docError = await saveUserDocument(data.session.user.id, normalizedDoc);
        if (docError?.code === '23505') {
          await supabase.auth.signOut();
          throw new Error('CPF/CNPJ já vinculado a outra conta. Faça login ou recupere seu acesso.');
        }
        onComplete(data.session);
      } else {
        setSuccess('Conta criada! Verifique seu e-mail para confirmar e depois entre.');
      }
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    clear();
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (err) throw err;
      onComplete(data.session);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    clear();
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin,
      });
      if (err) throw err;
      setMode('forgotSent');
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    clear();
    if (newPassword.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      const { data: { session } } = await supabase.auth.getSession();
      onRecoveryComplete?.(session);
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  // Recovery mode: set new password
  if (recoveryMode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8"><Logo /></div>
        <div className="bg-white rounded-2xl border border-ink-200 shadow-card overflow-hidden">
          <div className="p-7">
            <h1 className="text-xl font-bold text-ink-900 mb-1">Criar nova senha</h1>
            <p className="text-sm text-ink-400 mb-6">Escolha uma senha segura para sua conta.</p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required minLength={6}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); clear(); }}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className={inputCls('pr-11')}
                  />
                  <button type="button" onClick={() => setShowNewPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                    aria-label={showNewPwd ? 'Ocultar senha' : 'Mostrar senha'}>
                    <EyeIcon open={showNewPwd} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  required minLength={6}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clear(); }}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  className={inputCls()}
                />
              </div>
              <ErrorBox message={error} />
              <SubmitButton loading={loading} label="Salvar nova senha →" loadingLabel="Salvando…" />
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password: success screen
  if (mode === 'forgotSent') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8"><Logo /></div>
        <div className="bg-white rounded-2xl border border-ink-200 shadow-card overflow-hidden">
          <div className="p-7 text-center">
            <div className="w-12 h-12 bg-money-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-money-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-ink-900 mb-2">E-mail enviado!</h2>
            <p className="text-sm text-ink-500 mb-6 leading-relaxed">
              Enviamos um link para <strong className="text-ink-700">{forgotEmail}</strong>.
              Verifique sua caixa de entrada (e o spam).
            </p>
            <button
              onClick={() => { setMode('form'); clear(); }}
              className="text-sm font-semibold text-money-600 hover:text-money-700 transition-colors"
            >
              ← Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password: email form
  if (mode === 'forgot') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8"><Logo /></div>
        <div className="bg-white rounded-2xl border border-ink-200 shadow-card overflow-hidden">
          <div className="p-7">
            <button
              type="button"
              onClick={() => { setMode('form'); clear(); }}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Voltar
            </button>
            <h1 className="text-xl font-bold text-ink-900 mb-1">Recuperar acesso</h1>
            <p className="text-sm text-ink-400 mb-6">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">E-mail</label>
                <input
                  type="email" required
                  value={forgotEmail}
                  onChange={e => { setForgotEmail(e.target.value); clear(); }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={inputCls()}
                />
              </div>
              <ErrorBox message={error} />
              <SubmitButton loading={loading} label="Enviar link de recuperação →" loadingLabel="Enviando…" />
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main: register / login tabs
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8"><Logo /></div>
      <div className="bg-white rounded-2xl border border-ink-200 shadow-card overflow-hidden">

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-ink-200">
          {[
            { id: 'register', label: 'Criar conta' },
            { id: 'login', label: 'Entrar' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); clear(); }}
              className={`py-4 text-sm font-semibold transition-all duration-150 relative ${
                tab === t.id
                  ? 'text-ink-900 bg-white'
                  : 'text-ink-400 bg-ink-50 hover:text-ink-700 hover:bg-ink-100'
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-money-500" />}
            </button>
          ))}
        </div>

        <div className="p-7">

          {/* Register */}
          {tab === 'register' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-ink-900 mb-1">Crie sua conta grátis</h1>
                <p className="text-sm text-ink-400">Diagnóstico financeiro completo em 5 minutos.</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">E-mail</label>
                  <input
                    type="email" required
                    value={regEmail}
                    onChange={e => { setRegEmail(e.target.value); clear(); }}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      required minLength={6}
                      value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); clear(); }}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      className={inputCls('pr-11')}
                    />
                    <button type="button" onClick={() => setShowRegPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                      aria-label={showRegPwd ? 'Ocultar senha' : 'Mostrar senha'}>
                      <EyeIcon open={showRegPwd} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                    CPF ou CNPJ
                    <span className="text-ink-400 font-normal ml-1 text-xs">(do responsável)</span>
                  </label>
                  <input
                    type="text" required
                    value={regDocument}
                    onChange={handleDocumentChange}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    inputMode="numeric"
                    className={inputCls()}
                  />
                  <p className="text-xs text-ink-400 mt-1.5">Garante uma conta gratuita por pessoa.</p>
                </div>
                {/* Consentimentos LGPD */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      checked={acceptTerms}
                      onChange={e => { setAcceptTerms(e.target.checked); clear(); }}
                      className="mt-0.5 w-4 h-4 rounded border-ink-300 text-money-500 focus:ring-money-300 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-ink-600 leading-relaxed">
                      Concordo com os{' '}
                      <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-money-600 underline hover:text-money-700">
                        Termos de Uso
                      </a>{' '}
                      e com o tratamento dos meus dados conforme a LGPD.{' '}
                      <span className="text-loss-500 font-semibold">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptMarketing}
                      onChange={e => { setAcceptMarketing(e.target.checked); clear(); }}
                      className="mt-0.5 w-4 h-4 rounded border-ink-300 text-money-500 focus:ring-money-300 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-ink-600 leading-relaxed">
                      Quero receber lembretes mensais por e-mail para não esquecer de registrar os números do meu negócio.
                    </span>
                  </label>
                </div>

                <ErrorBox message={error} />
                <SuccessBox message={success} />
                <SubmitButton
                  loading={loading}
                  label="Criar conta grátis →"
                  loadingLabel="Criando conta…"
                />
              </form>
            </>
          )}

          {/* Login */}
          {tab === 'login' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-ink-900 mb-1">Bem-vindo de volta</h1>
                <p className="text-sm text-ink-400">Continue de onde parou.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">E-mail</label>
                  <input
                    type="email" required
                    value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); clear(); }}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); clear(); }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={inputCls('pr-11')}
                    />
                    <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                      aria-label={showLoginPwd ? 'Ocultar senha' : 'Mostrar senha'}>
                      <EyeIcon open={showLoginPwd} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(loginEmail); setMode('forgot'); clear(); }}
                    className="text-xs font-semibold text-money-600 hover:text-money-700 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <ErrorBox message={error} />
                <SubmitButton loading={loading} label="Entrar na minha conta →" loadingLabel="Entrando…" />
              </form>
            </>
          )}

          <p className="text-xs text-ink-400 text-center mt-5 leading-relaxed">
            Seus dados financeiros nunca são compartilhados com terceiros.
          </p>
        </div>
      </div>
    </div>
  );
}

function translateError(msg) {
  if (!msg) return 'Erro desconhecido. Tente novamente.';
  const m = msg.toLowerCase();
  // Pass through custom errors already in Portuguese
  if (m.includes('cpf') || m.includes('cnpj') || m.includes('vinculado') || m.includes('coincidem')) return msg;
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Este e-mail já tem uma conta. Use a aba "Entrar".';
  if (m.includes('password should be at least'))
    return 'A senha precisa ter pelo menos 6 caracteres.';
  if (m.includes('rate limit'))
    return 'Muitas tentativas. Aguarde alguns minutos.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet.';
  return msg;
}
