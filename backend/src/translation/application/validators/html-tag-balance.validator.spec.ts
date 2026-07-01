import { validateHtmlTagBalance } from './html-tag-balance.validator';

describe('validateHtmlTagBalance', () => {
  it('passes balanced tags', () => {
    const result = validateHtmlTagBalance(
      'Save <strong>now</strong>',
      'Guardar <strong>ahora</strong>',
    );
    expect(result.valid).toBe(true);
  });

  it('fails on unclosed tags', () => {
    const result = validateHtmlTagBalance(
      'Save <strong>now</strong>',
      'Guardar <strong>ahora',
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('HtmlTagBalanceValidator');
    expect(result.reason).toContain('unclosed tag <strong>');
  });

  it('fails on mismatched closing tags', () => {
    const result = validateHtmlTagBalance(
      'Save <strong>now</strong>',
      'Guardar <strong>ahora</em>',
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expected </strong>');
  });

  it('allows self-closing tags', () => {
    const result = validateHtmlTagBalance(
      'Line one<br/>Line two',
      'Línea uno<br/>Línea dos',
    );
    expect(result.valid).toBe(true);
  });

  it('allows void tags like img', () => {
    const result = validateHtmlTagBalance(
      'Photo <img src="x" alt="y" />',
      'Foto <img src="x" alt="y" />',
    );
    expect(result.valid).toBe(true);
  });

  it('skips validation when source has no HTML tags', () => {
    const result = validateHtmlTagBalance('5 < 10', '5 < 10');
    expect(result.valid).toBe(true);
  });
});
