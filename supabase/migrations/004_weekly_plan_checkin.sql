-- Check-in semanal: adiciona campos ao plano existente (sem tabela nova)
-- last_checkin_at: quando foi o último check-in do usuário
-- checkin_note: nota opcional do usuário no check-in

ALTER TABLE weekly_plans
  ADD COLUMN IF NOT EXISTS last_checkin_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_note text;
