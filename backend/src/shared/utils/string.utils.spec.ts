import { stripWrappingQuotes } from './string.utils';

describe('stripWrappingQuotes', () => {
  it('removes double quotes', () => {
    expect(stripWrappingQuotes('"Llevarme más alto"')).toBe('Llevarme más alto');
  });

  it('removes single quotes', () => {
    expect(stripWrappingQuotes("'Common'")).toBe('Common');
  });

  it('removes curly quotes', () => {
    expect(stripWrappingQuotes('“Hello”')).toBe('Hello');
  });

  it('trims whitespace before stripping', () => {
    expect(stripWrappingQuotes('  "text"  ')).toBe('text');
  });

  it('strips multiple wrapping quote layers', () => {
    expect(stripWrappingQuotes('"\'value\'"')).toBe('value');
  });

  it('does not strip internal quotes', () => {
    expect(stripWrappingQuotes('He said "hello"')).toBe('He said "hello"');
  });

  it('does not strip mismatched quotes', () => {
    expect(stripWrappingQuotes("'mixed\"")).toBe("'mixed\"");
  });
});
