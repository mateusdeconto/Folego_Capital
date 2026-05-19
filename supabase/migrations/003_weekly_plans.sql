-- Plano semanal persistente por empresa
-- Arquitetura: 2 tabelas — plano (header + risco) + ações (status individual)

CREATE TABLE IF NOT EXISTS weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  segment text NOT NULL,
  custom_segment text,
  -- Referência ao diagnóstico que originou o plano (para detectar desatualização)
  source_diagnosis_id uuid,
  source_diagnosis_created_at timestamptz,
  main_risk_level text NOT NULL,
  main_risk_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida por empresa
CREATE INDEX IF NOT EXISTS weekly_plans_lookup_idx
  ON weekly_plans (user_id, is_active, updated_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_weekly_plans_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_weekly_plans_updated_at ON weekly_plans;
CREATE TRIGGER trg_weekly_plans_updated_at
  BEFORE UPDATE ON weekly_plans
  FOR EACH ROW EXECUTE FUNCTION set_weekly_plans_updated_at();

-- Ações do plano
CREATE TABLE IF NOT EXISTS weekly_plan_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  priority integer NOT NULL,
  title text NOT NULL,
  reason text NOT NULL,
  expected_impact text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_plan_actions_plan_idx
  ON weekly_plan_actions (plan_id, priority);

-- Trigger updated_at para ações
CREATE OR REPLACE FUNCTION set_weekly_plan_actions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_weekly_plan_actions_updated_at ON weekly_plan_actions;
CREATE TRIGGER trg_weekly_plan_actions_updated_at
  BEFORE UPDATE ON weekly_plan_actions
  FOR EACH ROW EXECUTE FUNCTION set_weekly_plan_actions_updated_at();

-- RLS
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plan_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weekly_plans_select_own" ON weekly_plans;
CREATE POLICY "weekly_plans_select_own"
  ON weekly_plans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_plans_insert_own" ON weekly_plans;
CREATE POLICY "weekly_plans_insert_own"
  ON weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_plans_update_own" ON weekly_plans;
CREATE POLICY "weekly_plans_update_own"
  ON weekly_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_plans_delete_own" ON weekly_plans;
CREATE POLICY "weekly_plans_delete_own"
  ON weekly_plans FOR DELETE USING (auth.uid() = user_id);

-- Ações: acesso via plano do usuário
DROP POLICY IF EXISTS "weekly_plan_actions_select_own" ON weekly_plan_actions;
CREATE POLICY "weekly_plan_actions_select_own"
  ON weekly_plan_actions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "weekly_plan_actions_insert_own" ON weekly_plan_actions;
CREATE POLICY "weekly_plan_actions_insert_own"
  ON weekly_plan_actions FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "weekly_plan_actions_update_own" ON weekly_plan_actions;
CREATE POLICY "weekly_plan_actions_update_own"
  ON weekly_plan_actions FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "weekly_plan_actions_delete_own" ON weekly_plan_actions;
CREATE POLICY "weekly_plan_actions_delete_own"
  ON weekly_plan_actions FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );
