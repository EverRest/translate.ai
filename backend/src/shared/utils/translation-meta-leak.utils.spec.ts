import {
  extractToolCallJson,
  isToolCallJson,
  looksLikeInternalMetaLeak,
} from './translation-meta-leak.utils';

describe('translation-meta-leak.utils', () => {
  it('extracts tool JSON from markdown fence', () => {
    const json = extractToolCallJson(
      '```json\n{"tool":"search_knowledge_base","args":{"query":"hours"}}\n```',
    );
    expect(json).toBe(
      '{"tool":"search_knowledge_base","args":{"query":"hours"}}',
    );
    expect(isToolCallJson(json!)).toBe(true);
  });

  it('extracts embedded tool JSON from surrounding text', () => {
    const json = extractToolCallJson(
      'Sure. {"tool":"check_availability","args":{"datetime":"2026-06-28T10:00:00Z"}}',
    );
    expect(json).toContain('check_availability');
    expect(isToolCallJson(json!)).toBe(true);
  });

  it('detects internal availability check phrase', () => {
    expect(looksLikeInternalMetaLeak('Check AI availability')).toBe(true);
    expect(looksLikeInternalMetaLeak('Let me check availability')).toBe(true);
  });

  it('allows normal translations', () => {
    expect(looksLikeInternalMetaLeak('Zur Kasse')).toBe(false);
    expect(isToolCallJson('Bonjour le monde')).toBe(false);
  });
});
