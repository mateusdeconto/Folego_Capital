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

export async function recordCheckin(planId, note = '') {
  const { error } = await supabase
    .from('weekly_plans')
    .update({
      last_checkin_at: new Date().toISOString(),
      checkin_note: note || null,
    })
    .eq('id', planId);

  if (error) console.error('[recordCheckin]', error.message);
  return !error;
}

export async function loadAllActiveWeeklyPlans(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('weekly_plans')
    .select('id, business_name, segment, custom_segment, source_diagnosis_created_at, created_at, updated_at, last_checkin_at, weekly_plan_actions(status)')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) { console.error('[loadAllActiveWeeklyPlans]', error.message); return []; }
  return data || [];
}

// Calcula estado do plano: 'ativo' | 'precisa_revisao' | 'desatualizado'
export function calcPlanStatus(plan, latestDiagnosisCreatedAt) {
  if (!plan) return null;

  const diagnosisDate = latestDiagnosisCreatedAt ? new Date(latestDiagnosisCreatedAt) : null;
  const planSourceDate = plan.source_diagnosis_created_at ? new Date(plan.source_diagnosis_created_at) : null;

  if (diagnosisDate && planSourceDate && diagnosisDate > planSourceDate) {
    return 'desatualizado';
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const lastActivity = plan.last_checkin_at
    ? new Date(plan.last_checkin_at)
    : new Date(plan.created_at);

  if (lastActivity < sevenDaysAgo) {
    return 'precisa_revisao';
  }

  return 'ativo';
}

export function calcActionStats(plan) {
  const actions = plan?.weekly_plan_actions || [];
  return {
    total: actions.length,
    done: actions.filter(a => a.status === 'done').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    pending: actions.filter(a => a.status === 'pending').length,
  };
}

export function companyPlanKey(company) {
  return `${company.businessName || company.business_name}__${company.segment}__${company.customSegment || company.custom_segment || ''}`;
}
