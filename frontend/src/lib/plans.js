import { supabase } from './supabase.js';

export const PLAN_LIMITS = {
  free: {
    maxCompanies: 1,
    maxDiagnoses: 1,
    weeklyPlansPerMonth: 0,
    chatEnabled: false,
    hasBenchmarks: false,
    hasExcelExport: false,
    hasHistory: false,
    hasTracking: false,
    hasCanOrNot: false,
  },
  paid: {
    maxCompanies: 1,
    maxDiagnoses: 3,
    weeklyPlansPerMonth: 4,
    chatEnabled: true,
    hasBenchmarks: true,
    hasExcelExport: true,
    hasHistory: true,
    hasTracking: true,
    hasCanOrNot: false,
  },
  pro: {
    maxCompanies: 5,
    maxDiagnoses: Infinity,
    weeklyPlansPerMonth: 8,
    chatEnabled: true,
    hasBenchmarks: true,
    hasExcelExport: true,
    hasHistory: true,
    hasTracking: true,
    hasCanOrNot: true,
  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export async function loadUserPlan(userId) {
  const { data } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', userId)
    .single();
  return data?.plan || 'free';
}
