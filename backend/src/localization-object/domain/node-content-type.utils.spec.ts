import { resolveNodeContentType } from './node-content-type.utils';

describe('resolveNodeContentType', () => {
  it('uses explicit contentType when set', () => {
    expect(
      resolveNodeContentType({
        nodeType: 'button',
        contentType: 'marketing',
      }),
    ).toBe('marketing');
  });

  it('maps node types to default content types', () => {
    expect(resolveNodeContentType({ nodeType: 'button' })).toBe('ui');
    expect(resolveNodeContentType({ nodeType: 'placeholder' })).toBe(
      'placeholder',
    );
    expect(resolveNodeContentType({ nodeType: 'error' })).toBe('ui');
    expect(resolveNodeContentType({ nodeType: 'email_body' })).toBe('email');
    expect(resolveNodeContentType({ nodeType: 'email_subject' })).toBe('email');
  });

  it('falls back to ui for labels and text', () => {
    expect(resolveNodeContentType({ nodeType: 'label' })).toBe('ui');
    expect(resolveNodeContentType({ nodeType: 'text' })).toBe('ui');
  });
});
