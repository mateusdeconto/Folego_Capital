-- Analytics events table for product usage tracking
-- Fire-and-forget inserts from frontend; reads via service_role only

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name  TEXT        NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id  UUID        REFERENCES user_companies(id) ON DELETE SET NULL,
  properties  JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query patterns: by event name, by user, by time range, by company
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id    ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_company_id ON analytics_events(company_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events only
CREATE POLICY "users_insert_own_events" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No SELECT policy for users — query via service_role (Supabase dashboard / future admin panel)
