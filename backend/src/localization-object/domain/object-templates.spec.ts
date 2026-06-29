import { getObjectTemplate } from './object-templates';

describe('object-templates', () => {
  it('returns registration form template', () => {
    const template = getObjectTemplate('registration_form');
    expect(template?.name).toBe('Registration Form');
    expect(template?.nodes.some((node) => node.slug === 'fields')).toBe(true);
  });

  it('returns undefined for unknown template', () => {
    expect(getObjectTemplate('unknown')).toBeUndefined();
  });
});
