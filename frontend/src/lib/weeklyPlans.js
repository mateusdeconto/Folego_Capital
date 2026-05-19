import { supabase } from './supabase.js';

export async function loadActiveWeeklyPlan(userId, businessName, segment, customSegment) {
  if (!userId) return null;

  let query = supabase
    .from('weekly_plans')
    .select('*, weekly_plan_actions(*)')
    .eq('user_id', userId)
    .eq('business_name', businessName)
    .eq('segment', segment)
    .eq('is_active', true);

  if (customSegment) {
    query = query.eq('custom_segment', customSegment);
  } else {
    query = query.is('custom_segment', null);
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) { console.error('[loadActiveWeeklyPlan]', error.message); return null; }
  if (!data?.length) return null;

  const plan = data[0];
  plan.weekly_plan_actions = (plan.weekly_plan_actions || []).sort((a, b) => a.priority - b.priority);
  return plan;
}

export async function saveWeeklyPlan(userId, businessData, mainRisk, actions, sourceDiagnosis) {
  if (!userId) return null;

  // Desativa plano anterior da mesma empresa
  let deactivateQuery = supabase
    .from('weekly_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('business_name', businessData.businessName)
    .eq('segment', businessData.segment)
    .eq('is_active', true);

  if (businessData.customSegment) {
    deactivateQuery = deactivateQuery.eq('custom_segment', businessData.customSegment);
  } else {
    deactivateQuery = deactivateQuery.is('custom_segment', null);
  }

  await deactivateQuery;

  const { data: plan, error: planError } = await supabase
    .from('weekly_plans')
    .insert({
      user_id: userId,
      business_name: businessData.businessName,
      segment: businessData.segment,
      custom_segment: businessData.customSegment || null,
      source_diagnosis_id: sourceDiagnosis?.id || null,
      source_diagnosis_created_at: sourceDiagnosis?.created_at || null,
      main_risk_level: mainRisk.level,
      main_risk_text: mainRisk.text,
    })
    .select()
    .single();

  if (planError) { console.error('[saveWeeklyPlan]', planError.message); return null; }

  const { error: actionsError } = await supabase
    .from('weekly_plan_actions')
    .insert(
      actions.map(a => ({
        plan_id: plan.id,
        priority: a.priority,
        title: a.action,
        reason: a.reason,
        expected_impact: a.impact,
        status: 'pending',
      }))
    );

  if (actionsError) console.error('[saveWeeklyPlan actions]', actionsError.message);

  return plan;
}

export async function updateActionStatus(actionId, status) {
  const { error } = await supabase
    .from('weekly_plan_actions')
    .update({ status })
    .eq('id', actionId);

  if (error) console.error('[updateActionStatus]', error.message);
  return !error;
}

export async function deactivateWeeklyPlan(planId) {
  const { error } = await supabase
    .from('weekly_plans')
    .update({ is_active: false })
    .eq('id', planId);

  if (error) console.error('[deactivateWeeklyPlan]', error.message);
}
