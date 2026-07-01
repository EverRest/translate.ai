import {
  buildKeyContext,
  extractHintsFromContext,
  extractScopeFromContext,
} from './hint-parser';

describe('hint-parser', () => {
  describe('buildKeyContext', () => {
    it('returns null when scope and hints are empty', () => {
      expect(buildKeyContext(undefined, undefined)).toBeNull();
      expect(buildKeyContext('', '')).toBeNull();
    });

    it('encodes scope and hints lines', () => {
      expect(buildKeyContext('BMA/Login', 'Shown on header')).toBe(
        'scope: BMA/Login\nhints: Shown on header',
      );
    });

    it('adds strictPlaceholders when hints contain %% tokens', () => {
      const context = buildKeyContext(
        'BMA/Login',
        'Keep %%userName%% unchanged',
      );
      expect(context).toContain('strictPlaceholders: true');
      expect(context).toContain('hints: Keep %%userName%% unchanged');
    });
  });

  describe('extractHintsFromContext', () => {
    it('extracts hints line from context', () => {
      const context =
        'scope: BMA/Login\nhints: Keep %%x%%\nstrictPlaceholders: true';
      expect(extractHintsFromContext(context)).toBe('Keep %%x%%');
    });

    it('returns null when no hints', () => {
      expect(extractHintsFromContext('scope: BMA/Login')).toBeNull();
      expect(extractHintsFromContext(null)).toBeNull();
    });
  });

  describe('extractScopeFromContext', () => {
    it('extracts scope line from context', () => {
      expect(extractScopeFromContext('scope: BMA/Login\nhints: note')).toBe(
        'BMA/Login',
      );
    });
  });
});
