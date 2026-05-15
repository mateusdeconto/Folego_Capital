import { supabase } from './supabase.js';
import { readJSON, writeJSON } from './storage.js';

const STORAGE_KEY = 'folego_capital_saved_companies_v1';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function companySignature(company) {
  return [
    normalizeText(company.businessName),
    normalizeText(company.segment),
    normalizeText(company.customSegment),
  ].join('::');
}

function normalizeCompany(company) {
  return {
    businessName: String(company.businessName || '').trim(),
    segment: String(company.segment || '').trim(),
    customSegment: company.customSegment ? String(company.customSegment).trim() : null,
  };
}

function rowToCompany(row) {
  return {
    id: row.id,
    businessName: row.business_name,
    segment: row.segment,
    customSegment: row.custom_segment || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function loadLegacyCompanies(userId) {
  const all = readJSON(STORAGE_KEY, {});
  return Array.isArray(all?.[userId]) ? all[userId] : [];
}

function saveLegacyCompanies(userId, companies) {
  const all = readJSON(STORAGE_KEY, {});
  all[userId] = companies;
  writeJSON(STORAGE_KEY, all);
}

export function matchesCompany(record, company) {
  if (!record || !company) return false;

  return companySignature({
    businessName: record.business_name,
    segment: record.segment,
    customSegment: record.financial_data?._customSegment || null,
  }) === companySignature(company);
}

export async function loadSavedCompanies(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_companies')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[loadSavedCompanies]', error.message);
    return loadLegacyCompanies(userId);
  }

  return (data || []).map(rowToCompany);
}

export async function saveCompanyProfile(userId, company) {
  if (!userId) return [];

  const normalized = normalizeCompany(company);
  if (!normalized.businessName || !normalized.segment) return loadSavedCompanies(userId);

  const payload = {
    user_id: userId,
    business_name: normalized.businessName,
    segment: normalized.segment,
    custom_segment: normalized.customSegment,
  };

  const { error } = await supabase
    .from('user_companies')
    .upsert(payload, {
      onConflict: 'user_id,business_name,segment,custom_segment',
    });

  if (error) {
    console.error('[saveCompanyProfile]', error.message);
    const legacy = loadLegacyCompanies(userId);
    const signature = companySignature(normalized);
    const now = new Date().toISOString();
    const next = legacy.filter(item => companySignature(item) !== signature);

    next.unshift({
      ...normalized,
      createdAt: legacy.find(item => companySignature(item) === signature)?.createdAt || now,
      updatedAt: now,
    });

    saveLegacyCompanies(userId, next);
    return next;
  }

  return loadSavedCompanies(userId);
}

export async function syncLegacyCompaniesToSupabase(userId) {
  if (!userId) return [];

  const legacy = loadLegacyCompanies(userId);
  if (!legacy.length) return loadSavedCompanies(userId);

  const payload = legacy
    .map(normalizeCompany)
    .filter(company => company.businessName && company.segment)
    .map(company => ({
      user_id: userId,
      business_name: company.businessName,
      segment: company.segment,
      custom_segment: company.customSegment,
    }));

  if (!payload.length) return loadSavedCompanies(userId);

  const { error } = await supabase
    .from('user_companies')
    .upsert(payload, {
      onConflict: 'user_id,business_name,segment,custom_segment',
    });

  if (error) {
    console.error('[syncLegacyCompaniesToSupabase]', error.message);
    return loadSavedCompanies(userId);
  }

  saveLegacyCompanies(userId, []);
  return loadSavedCompanies(userId);
}

export function mergeCompanies(savedCompanies = [], records = []) {
  const map = new Map();

  savedCompanies.forEach(company => {
    const normalized = normalizeCompany(company);
    if (!normalized.businessName || !normalized.segment) return;

    map.set(companySignature(normalized), {
      ...normalized,
      id: company.id || null,
      createdAt: company.createdAt || null,
      updatedAt: company.updatedAt || null,
    });
  });

  records.forEach(record => {
    const normalized = normalizeCompany({
      businessName: record.business_name,
      segment: record.segment,
      customSegment: record.financial_data?._customSegment || null,
    });
    const signature = companySignature(normalized);
    const previous = map.get(signature);

    map.set(signature, {
      ...normalized,
      id: previous?.id || null,
      createdAt: previous?.createdAt || record.created_at,
      updatedAt: previous?.updatedAt || record.created_at,
    });
  });

  return [...map.values()].sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bDate - aDate;
  });
}

export function recordsForCompany(records = [], company) {
  if (!company) return records;
  return records.filter(record => matchesCompany(record, company));
}
