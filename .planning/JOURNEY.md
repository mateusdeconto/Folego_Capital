# Fôlego Capital — User Journey Map

> Atualizado: 2026-05-21  
> Produto: diagnóstico financeiro para donos de PMEs brasileiras  
> Persona Gabriel: CFO virtual que responde em linguagem de dono, não de contador

---

## Visão Geral do Funil

```
Discovery → Landing → Cadastro → Onboarding → Questionário → Loading → Diagnóstico → Chat → Retorno
```

Cada linha abaixo é um `STEP` do state machine em `App.jsx`.

---

## 1. Discovery (pré-produto)

**Trigger:** busca orgânica, indicação, anúncio  
**Usuário pensa:** "Minha empresa está sobrando ou perdendo dinheiro? Não sei ao certo."

### Pontos de atrito
- Produto não tem SEO ativo ainda (sem blog, sem meta tags otimizadas)
- Zero social proof real (sem depoimentos de clientes reais)
- Domínio `folegocapital.com.br` ainda não registrado

### KPIs
- Visitantes únicos / semana
- Taxa bounce na landing

### Arquivos relevantes
- `frontend/src/components/Landing.jsx` — hero, FAQ, CTAs

---

## 2. Landing (`STEPS.LANDING`)

**Trigger:** usuário chega ao site  
**Usuário pensa:** "O que é isso? Vale meu tempo preencher?"

### O que acontece
- Hero com proposta de valor ("diagnóstico em 5 minutos")
- Seção de features, FAQ, footer
- CTA principal → `STEPS.AUTH` (novo) ou `STEPS.PREVIOUS` (retorno)

### Pontos de atrito
- Landing.jsx (60kb) não está lazy-loaded → impacto no LCP
- Se usuário já autenticado e com empresas → pula direto para PREVIOUS (bom)
- Domínio mock `folegocapital.com.br/diagnóstico` no texto não é clicável

### KPIs
- CTR no CTA principal (meta: >15%)
- Scroll depth até FAQ
- Tempo na página

### O que pode dar errado
- Landing carrega lento → usuário abandona antes de ver o CTA

---

## 3. Cadastro (`STEPS.AUTH`)

**Trigger:** clique no CTA da landing  
**Usuário pensa:** "Vou ter que preencher um formulário enorme?"

### O que acontece
- Tabs: "Criar conta" / "Entrar"
- Registro: e-mail + senha + aceite de termos + opt-in marketing
- Login: e-mail + senha
- Recuperação de senha via e-mail

### Pontos de atrito resolvidos (2026-05-21)
- ~~CPF/CNPJ obrigatório~~ → **removido** (era a maior fricção no cadastro)

### Pontos de atrito restantes
- Usuário precisa confirmar e-mail antes de entrar (Supabase padrão)
  - Muitos usuários não confirmam e acham que o cadastro "não funcionou"
  - Mitigação: mensagem de sucesso clara ("Verifique seu e-mail")
- Template de e-mail de confirmação está em `supabase/email_template_confirmation.html`

### KPIs
- Taxa de conclusão do cadastro (meta: >60%)
- Taxa de confirmação de e-mail (meta: >50%)
- Drop no formulário de registro

### O que pode dar errado
- E-mail de confirmação cai no spam
- Usuário esquece a senha e não encontra o "Esqueci minha senha"

---

## 4. Onboarding (`STEPS.ONBOARDING`)

**Trigger:** primeiro acesso após login, ou "Nova empresa" no CompanySelector  
**Usuário pensa:** "O que preciso informar? Vai ser complicado?"

### O que acontece
- Nome da empresa (businessName)
- Segmento (10 opções + "Outro" com campo livre)
- Mês de referência opcional
- Se empresa já existe → pré-preenche com dados anteriores

### Pontos de atrito
- Usuário não sabe qual segmento escolher quando o negócio é misto
- "Outro" obriga digitar — poderia ter sugestões
- Sem indicação de progresso (quanto falta para o diagnóstico?)

### KPIs
- Taxa de conclusão do onboarding → QUESTIONNAIRE
- Segmentos mais escolhidos (para priorizar benchmarks)

### Arquivos relevantes
- `frontend/src/components/Onboarding.jsx`

---

## 5. Questionário (`STEPS.QUESTIONNAIRE`)

**Trigger:** conclusão do onboarding  
**Usuário pensa:** "Tenho esses números na cabeça? Vou ter que abrir o extrato?"

### O que acontece
- 7 perguntas em sequência:
  1. Receita Bruta (revenue)
  2. Custo das Vendas — CMV (cogs)
  3. Despesas Fixas Operacionais (fixedExpenses) — itemizável
  4. Saldo de Caixa (cashBalance) — pode ser negativo
  5. Dívidas/Parcelas Mensais (debtPayment) — itemizável
  6. Contas a Receber (accountsReceivable)
  7. Investimentos no mês (investments)

### Pontos de atrito
- Usuário não sabe a diferença entre CMV e despesas fixas
  - Tooltip/exemplo seria muito útil aqui
- Campos itemizáveis (fixedExpenses, debtPayment) podem ser confusos
- Sem defaults/sugestões baseadas no setor (Sprint 2.1 pendente)
- Usuário precisa ter os números em mãos — sem integração bancária (Pluggy/Open Finance pendente)

### KPIs
- Taxa de conclusão questionário → LOADING (meta: >80%)
- Campos mais pulados / zerados
- Tempo médio de preenchimento

### O que pode dar errado
- Usuário coloca números errados (por desconhecimento do conceito)
  - Diagnóstico vai refletir dados ruins → "garbage in, garbage out"
- Usuário fecha o browser no meio → sessão salva em localStorage (ok)

### Arquivos relevantes
- `frontend/src/components/Questionnaire.jsx`
- `frontend/src/lib/metrics.js` — cálculos financeiros

---

## 6. Loading (`STEPS.LOADING`)

**Trigger:** conclusão do questionário  
**Usuário pensa:** "Quanto tempo vai demorar? Está funcionando?"

### O que acontece
- POST /api/diagnose → SSE streaming com Anthropic API (Gabriel)
- Timeout de ~30-90s dependendo da carga
- Sistema de retry (6 tentativas com backoff exponencial)
- Macro data (Selic, IPCA, câmbio) buscada em paralelo

### Pontos de atrito
- Loading genérico — não mostra progresso real (Sprint 2.2 pendente)
- Se API Anthropic sobrecarregada → retry silencioso, usuário acha que travou
- Sem indicação de "estamos calculando sua margem bruta..."

### KPIs
- Taxa de sucesso do diagnóstico (meta: >95%)
- Latência P50 / P95 da chamada Anthropic
- Taxa de retries

### O que pode dar errado
- Timeout do Anthropic em horários de pico → usuário vê erro genérico
- Usuário fecha aba → AbortController cancela o stream (ok, não gasta tokens)

### Arquivos relevantes
- `frontend/src/components/Loading.jsx`
- `backend/routes/diagnose.js` — streaming + retry + prompt caching (ativo desde Sprint 1.2)

---

## 7. Diagnóstico (`STEPS.DIAGNOSIS`)

**Trigger:** stream do Anthropic completo  
**Usuário pensa:** "Minha empresa está bem ou mal? O que faço agora?"

### O que acontece
- 3 seções renderizadas em markdown:
  - 🏢 Resumo Executivo (saúde financeira + lucro líquido + ponto de equilíbrio)
  - ⚠️ Pontos de Atenção (até 3 alertas com números reais)
  - ✅ O que está funcionando (até 2 pontos positivos)
- Card de Lucro Líquido (destaque visual)
- Ações: Chat com Gabriel, Plano Semanal, Rastreamento Mensal, Corrigir Dados
- Download: PDF do diagnóstico + DRE em Excel (.xlsx)
- Diagnóstico salvo automaticamente no Supabase

### Pontos de atrito
- Linguagem do Gabriel pode ainda conter jargão em casos edge
- Usuário free não tem acesso ao chat → frustração se quiser aprofundar
- PDF exportado está atrelado ao html2pdf.js (qualidade variável)

### KPIs
- Taxa de abertura do chat após diagnóstico (meta: >30%)
- Downloads de PDF/DRE
- Diagnósticos salvos vs. sessões iniciadas
- NPS implícito: usuário volta no mês seguinte?

### O que pode dar errado
- Gabriel gera diagnóstico com número calculado errado (raro, mas possível)
  - Mitigação: "Corrigir Dados" disponível na tela
- Diagnóstico salvo com dados financeiros incorretos → histórico errado

### Arquivos relevantes
- `frontend/src/components/Diagnosis.jsx`
- `backend/routes/diagnose.js`
- `frontend/src/lib/metrics.js`

---

## 8. Chat com Gabriel (`STEPS.CHAT`)

**Trigger:** botão "Conversar com Gabriel" no diagnóstico (planos Pro/Max)  
**Usuário pensa:** "Tenho dúvidas específicas. Posso perguntar?"

### O que acontece
- Chat SSE streaming com contexto financeiro completo no system prompt
- Gabriel tem acesso a: dados financeiros, diagnóstico, histórico de meses anteriores
- Limite: 30 mensagens por 10 minutos (rate limiting)
- Histórico de conversa limitado às últimas 10 mensagens (contexto)

### Pontos de atrito
- Feature bloqueada para plano free → usuário que acaba de ver o diagnóstico não pode perguntar nada
  - Pode ser o maior bloqueio de conversão free → Pro
- Sem persistência da conversa entre sessões (chat recomeça do zero)

### KPIs
- Mensagens por sessão de chat (usuários engajados)
- Taxa de upgrade free → Pro após bloqueio do chat
- Perguntas mais frequentes (para melhorar o diagnóstico base)

### Arquivos relevantes
- `frontend/src/components/Chat.jsx`
- `backend/routes/chat.js` — prompt caching ativo

---

## 9. Retorno (`STEPS.PREVIOUS` / Features avançadas)

**Trigger:** login em meses subsequentes  
**Usuário pensa:** "Vou comparar com o mês passado. Estou melhorando?"

### O que acontece
- CompanySelector mostra empresas com último diagnóstico
- Opções por empresa: Ver último diagnóstico, Novo diagnóstico, Histórico, Plano Semanal, Pode ou Não Pode
- History: todos os diagnósticos da empresa em ordem cronológica
- Comparison: comparação visual entre 2 períodos
- MonthlyTracking: acompanhamento de métricas ao longo do tempo
- WeeklyPlan: plano de ação semanal gerado por IA
- CanOrNot: decisão financeira assistida ("Posso contratar? Posso expandir?")

### Pontos de atrito
- Usuário precisa lembrar de voltar todo mês (sem notificação automática ativa)
  - Cron mensal via Brevo está implementado mas depende de `BREVO_API_KEY`
- Sem dashboard de evolução na tela inicial (usuário vê empresa, não tendência)

### KPIs
- Taxa de retorno mês a mês (meta: >40%)
- Diagnósticos por empresa (média ideal: 3+)
- Uso de features avançadas (Comparison, Tracking, WeeklyPlan)
- Churn implícito: usuários que não voltam após 45 dias

### Arquivos relevantes
- `frontend/src/components/CompanySelector.jsx`
- `frontend/src/components/History.jsx`
- `frontend/src/components/Comparison.jsx`
- `frontend/src/components/MonthlyTracking.jsx`
- `frontend/src/components/WeeklyPlan.jsx`
- `frontend/src/components/CanOrNot.jsx`

---

## Resumo de Maiores Fricções (por impacto)

| # | Fricção | Impacto | Sprint |
|---|---------|---------|--------|
| 1 | Loading genérico sem progresso visível | Alto (abandono) | Sprint 2.2 |
| 2 | Chat bloqueado para free → maior barreira de conversão | Alto (receita) | Sprint 2.3 |
| 3 | Confirmação de e-mail cai no spam | Médio (ativação) | — |
| 4 | Usuário não sabe diferença CMV vs. despesas fixas | Médio (qualidade dados) | Sprint 2.1 |
| 5 | Sem notificação de retorno mensal automática | Médio (retenção) | Config Brevo |
| 6 | Landing não lazy-loaded → LCP alto | Baixo/Médio | Sprint 3.2 |

---

## Métricas de Saúde do Produto (North Stars)

| Métrica | Definição | Meta MVP |
|---------|-----------|----------|
| Activation | % usuários que completam 1 diagnóstico | >70% |
| Retention D30 | % usuários que fazem 2º diagnóstico em 30 dias | >30% |
| Retention D90 | % usuários com 3+ diagnósticos | >20% |
| Chat conversion | % usuários free que fazem upgrade após ver chat bloqueado | >5% |
| Diagnosis quality | % diagnósticos sem erro reportado ("Corrigir Dados") | >90% |
