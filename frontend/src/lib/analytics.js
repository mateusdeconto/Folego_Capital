import { supabase } from './supabase.js';

// Module-level user context — set once on login, cleared on logout.
// All trackEvent calls below inherit this without prop drilling.
let _userId = null;

export function setAnalyticsUser(userId) {
  _userId = userId ?? null;
}

/**
 * Fire-and-forget event insertion.
 * Never throws — if tracking fails, the app continues normally.
 *
 * @param {string} eventName  - snake_case event identifier
 * @param {object} properties - arbitrary context (decision type, verdict, origin, etc.)
 */
export async function trackEvent(eventName, properties = {}) {
  if (!_userId) return; // only track authenticated users in MVP

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
