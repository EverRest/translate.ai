import { chunkText, estimateTokens } from './text-chunker.utils';

describe('text-chunker.utils', () => {
  it('returns empty array for blank input', () => {
    expect(chunkText('   ')).toEqual([]);
  });

  it('keeps short text as a single chunk', () => {
    const chunks = chunkText('Hello world', { chunkSize: 250, overlap: 50 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe('Hello world');
    expect(chunks[0]?.charStart).toBe(0);
    expect(chunks[0]?.charEnd).toBe(11);
  });

  it('splits long text into chunks within size bounds', () => {
    const paragraph = 'Word '.repeat(80).trim();
    const text = `${paragraph}\n\n${paragraph}`;
    const chunks = chunkText(text, { chunkSize: 250, overlap: 50 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(260);
      expect(chunk.tokenEstimate).toBe(estimateTokens(chunk.content));
    }
  });

  it('creates overlapping chunks with metadata', () => {
    const text = Array.from({ length: 8 }, (_, index) =>
      `Paragraph ${index + 1} ${'content '.repeat(20)}`.trim(),
    ).join('\n\n');

    const chunks = chunkText(text, { chunkSize: 220, overlap: 40 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[1]?.metadata.overlapPrev).toBe(40);
    expect(chunks[0]?.metadata.overlapNext).toBeDefined();
  });

  it('captures markdown heading metadata', () => {
    const text =
      '## Brand voice\n\nAlways use friendly tone.\n\nKeep product names unchanged.';
    const chunks = chunkText(text, { chunkSize: 250, overlap: 50 });

    expect(chunks[0]?.metadata.heading).toBe('Brand voice');
  });
});
