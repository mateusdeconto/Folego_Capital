import { describe, it, expect } from 'vitest';
import { escapeHtml, applyBold } from '../lib/htmlUtils.js';

describe('escapeHtml', () => {
  it('escapa < e >', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapa &', () => {
    expect(escapeHtml('R&B')).toBe('R&amp;B');
  });

  it('escapa aspas duplas e simples', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('retorna string vazia para input vazio', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('retorna string vazia para null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('retorna string vazia para undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('não altera texto sem caracteres especiais', () => {
    expect(escapeHtml('texto normal')).toBe('texto normal');
  });

  it('payload XSS completo', () => {
    const result = escapeHtml('<img src=x onerror=alert(1)>');
    expect(result).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
});

describe('applyBold', () => {
  it('envolve **texto** em <strong>', () => {
    expect(applyBold('**negrito**')).toBe('<strong>negrito</strong>');
  });

  it('não executa HTML dentro do bold quando texto já escapado', () => {
    const escaped = applyBold(escapeHtml('**<b>injeção</b>**'));
    expect(escaped).toBe('<strong>&lt;b&gt;injeção&lt;/b&gt;</strong>');
    expect(escaped).not.toContain('<b>');
  });

  it('múltiplos bolds na mesma linha', () => {
    expect(applyBold('**a** e **b**')).toBe('<strong>a</strong> e <strong>b</strong>');
  });

  it('não transforma texto sem **', () => {
    expect(applyBold('texto simples')).toBe('texto simples');
  });

  it('asterisco solitário não dispara bold', () => {
    expect(applyBold('*não bold*')).toBe('*não bold*');
  });
});

describe('escapeHtml + applyBold — ordem importa', () => {
  it('escape antes de bold preserva entidades dentro do strong', () => {
    const result = applyBold(escapeHtml('**receita > custo**'));
    expect(result).toBe('<strong>receita &gt; custo</strong>');
  });

  it('input com & e bold juntos', () => {
    const result = applyBold(escapeHtml('**lucro & crescimento**'));
    expect(result).toBe('<strong>lucro &amp; crescimento</strong>');
  });
});
