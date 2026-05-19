import { supabase } from './supabase.js';

const DIGITS_RE = /\D/g;

export function digitsOnly(value) {
  return String(value || '').replace(DIGITS_RE, '');
}

export function formatDocument(value) {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function validateCPFDigits(d) {
  if (/^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== +d[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === +d[10];
}

function validateCNPJDigits(d) {
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (digits, weights) =>
    digits.reduce((s, n, i) => s + n * weights[i], 0) % 11;
  const n = d.split('').map(Number);
  const r1 = calc(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const r2 = calc(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return (r1 < 2 ? 0 : 11 - r1) === n[12] && (r2 < 2 ? 0 : 11 - r2) === n[13];
}

export function validateDocument(value) {
  const d = digitsOnly(value);
  if (d.length === 11) return validateCPFDigits(d);
  if (d.length === 14) return validateCNPJDigits(d);
  return false;
}

export function normalizeDocument(value) {
  return digitsOnly(value);
}

export async function checkDocumentExists(doc) {
  const { data, error } = await supabase.rpc('document_exists', { doc });
  if (error) throw error;
  return !!data;
}

export async function saveUserDocument(userId, doc) {
  const normalized = normalizeDocument(doc);
  const { error } = await supabase.from('user_documents').insert({
    user_id: userId,
    document: normalized,
    document_type: normalized.length === 11 ? 'cpf' : 'cnpj',
  });
  return error;
}

export async function syncDocumentFromMetadata(user) {
  if (!user?.user_metadata?.document) return;

  const { data } = await supabase
    .from('user_documents')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (data) return;

  await supabase.from('user_documents').insert({
    user_id: user.id,
    document: user.user_metadata.document,
    document_type: user.user_metadata.document_type || (user.user_metadata.document.length === 11 ? 'cpf' : 'cnpj'),
  });
}
