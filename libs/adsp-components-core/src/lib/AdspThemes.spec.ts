import { AdspThemes } from './AdspThemes';

describe('AdspThemes.standard', () => {
  it('is named standard', () => {
    expect(AdspThemes.standard.name).toBe('standard');
  });

  it('sources its values from GoA design tokens', () => {
    expect(AdspThemes.standard.color.interactive.default).toBe('var(--goa-color-interactive-default)');
    expect(AdspThemes.standard.typography.fontFamily).toBe('var(--goa-font-family-sans)');
    expect(AdspThemes.standard.spacing.m).toBe('var(--goa-space-m)');
    expect(AdspThemes.standard.borderRadius.m).toBe('var(--goa-border-radius-m)');
  });

  it('provides an empty extension point for component-specific theme sections', () => {
    expect(AdspThemes.standard.components).toEqual({});
  });
});
