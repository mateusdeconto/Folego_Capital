import posthog from 'posthog-js';
import { supabase } from './supabase.js';

// Module-level user context — set once on login, cleared on logout.
let _userId = null;

export function setAnalyticsUser(userId) {
  _userId = userId ?? null;

  if (userId) {
    posthog.identify(userId);
  } else {
    posthog.reset();
  }
}

/**
 * Fire-and-forget event — salva no Supabase E no PostHog.
 * Never throws — tracking nunca quebra UX.
 *
 * @param {string} eventName  - snake_case event identifier
 * @param {object} properties - arbitrary context
 */
export async function trackEvent(eventName, properties = {}) {
  // PostHog: captura mesmo sem userId (visitantes anônimos)
  posthog.capture(eventName, properties);

  // Supabase: só usuários autenticados
  if (!_userId) return;

  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: _userId,
      properties,
    });
  } catch {
    // silent — tracking never breaks UX
  }
}
