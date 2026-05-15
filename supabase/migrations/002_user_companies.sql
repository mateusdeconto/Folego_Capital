-- Empresas salvas por usuário
-- Persistência independente de DRE para reaproveitar onboarding

CREATE TABLE IF NOT EXISTS user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  segment text NOT NULL,
  custom_segment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_companies_unique_company
  ON user_companies (
    user_id,
    lower(business_name),
    lower(segment),
    lower(coalesce(custom_segment, ''))
  );

CREATE INDEX IF NOT EXISTS user_companies_user_id_idx
  ON user_companies (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION set_user_companies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_companies_updated_at ON user_companies;

CREATE TRIGGER trg_user_companies_updated_at
  BEFORE UPDATE ON user_companies
  FOR EACH ROW
  EXECUTE FUNCTION set_user_companies_updated_at();

ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_companies_select_own" ON user_companies;
CREATE POLICY "user_companies_select_own"
  ON user_companies FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_companies_insert_own" ON user_companies;
CREATE POLICY "user_companies_insert_own"
  ON user_companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_companies_update_own" ON user_companies;
CREATE POLICY "user_companies_update_own"
  ON user_companies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_companies_delete_own" ON user_companies;
CREATE POLICY "user_companies_delete_own"
  ON user_companies FOR DELETE
  USING (auth.uid() = user_id);
