-- FinCheck — RLS policies obrigatórias
-- Executar no Supabase SQL Editor ou via supabase db push

-- ============================================================
-- diagnoses
-- ============================================================
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas seus próprios diagnósticos
CREATE POLICY "diagnoses_select_own"
  ON diagnoses FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário insere apenas com user_id = seu próprio UID
-- (impede injeção de user_id arbitrário vindo do body)
CREATE POLICY "diagnoses_insert_own"
  ON diagnoses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar apenas seus registros (ex: futuras edições)
CREATE POLICY "diagnoses_update_own"
  ON diagnoses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete permitido pelo próprio usuário
CREATE POLICY "diagnoses_delete_own"
  ON diagnoses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- user_plans
-- ============================================================
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Leitura: usuário vê apenas seu próprio plano
CREATE POLICY "user_plans_select_own"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Sem policy de INSERT/UPDATE/DELETE para o role anon/authenticated.
-- Escrita de planos é exclusiva do service_role (backend admin ou webhook de pagamento).
-- Se precisar criar o registro inicial, use service_role no backend.
