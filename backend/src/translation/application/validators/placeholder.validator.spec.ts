import { validatePlaceholders } from './placeholder.validator';

describe('validatePlaceholders', () => {
  it('passes when placeholders are preserved with translated text', () => {
    const result = validatePlaceholders(
      'Hello {{name}}, welcome back',
      'Hola {{name}}, bienvenido de nuevo',
    );
    expect(result.valid).toBe(true);
  });

  it('fails when a placeholder is missing from output', () => {
    const result = validatePlaceholders('Hello {{name}}', 'Hola amigo');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('PlaceholderValidator');
    expect(result.reason).toContain('{{name}}');
  });

  it('fails when placeholder inner text is translated', () => {
    const result = validatePlaceholders(
      'You have {{count}} items',
      'Tienes {{nombre}} artículos',
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('missing placeholder {{count}}');
  });

  it('validates %%token%% placeholders', () => {
    const missing = validatePlaceholders('Price: %%amount%%', 'Precio');
    expect(missing.valid).toBe(false);
    expect(missing.reason).toContain('%%amount%%');

    const preserved = validatePlaceholders(
      'Price: %%amount%%',
      'Precio: %%amount%%',
    );
    expect(preserved.valid).toBe(true);
  });

  it('passes plain text without placeholders', () => {
    const result = validatePlaceholders('Checkout', 'Kasse');
    expect(result.valid).toBe(true);
  });

  it('fails when output introduces unexpected placeholders', () => {
    const result = validatePlaceholders('Checkout', 'Checkout {{extra}}');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unexpected placeholder {{extra}}');
  });
});
