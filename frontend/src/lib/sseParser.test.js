import { describe, it, expect, beforeEach } from 'vitest';
import { SSEParser } from './sseParser.js';

describe('SSEParser', () => {
  let parser;

  beforeEach(() => {
    parser = new SSEParser();
  });

  it('emite payload de chunk único completo', () => {
    const payloads = parser.feed('data: {"text":"oi"}\n');
    expect(payloads).toEqual(['{"text":"oi"}']);
  });

  it('não emite nada para chunk incompleto', () => {
    const payloads = parser.feed('data: {"text":"pa');
    expect(payloads).toEqual([]);
  });

  it('emite payload após dois chunks montarem linha completa', () => {
    parser.feed('data: {"text":"par');
    const payloads = parser.feed('te2"}\n');
    expect(payloads).toEqual(['{"text":"parte2"}']);
  });

  it('emite múltiplos payloads em um único chunk', () => {
    const payloads = parser.feed('data: {"text":"a"}\ndata: {"text":"b"}\n');
    expect(payloads).toEqual(['{"text":"a"}', '{"text":"b"}']);
  });

  it('ignora linhas sem prefixo data:', () => {
    const payloads = parser.feed('event: ping\ndata: {"text":"ok"}\n\n');
    expect(payloads).toEqual(['{"text":"ok"}']);
  });

  it('emite [DONE] corretamente', () => {
    const payloads = parser.feed('data: [DONE]\n');
    expect(payloads).toEqual(['[DONE]']);
  });

  it('[DONE] dividido entre chunks', () => {
    parser.feed('data: [DO');
    const payloads = parser.feed('NE]\n');
    expect(payloads).toEqual(['[DONE]']);
  });

  it('buffer limpo após linha completa — não repete no próximo feed', () => {
    parser.feed('data: {"text":"x"}\n');
    const second = parser.feed('data: {"text":"y"}\n');
    expect(second).toEqual(['{"text":"y"}']);
  });

  it('fragmento de linha longa dividida em 3 chunks', () => {
    parser.feed('data: {"text":"par');
    parser.feed('te do ');
    const result = parser.feed('texto"}\n');
    expect(result).toEqual(['{"text":"parte do texto"}']);
  });

  it('chunk vazio não emite nada e não quebra', () => {
    const payloads = parser.feed('');
    expect(payloads).toEqual([]);
  });
});
