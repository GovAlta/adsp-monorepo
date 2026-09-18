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

  // The --goa-typography-* tokens are `font` shorthands, so a font-size declaration built from one
  // is invalid and gets dropped by the browser. Every type style must use the font size scale.
  it('sizes type from the GoA font size scale rather than the typography shorthand tokens', () => {
    const typeStyles = [
      ...Object.values(AdspThemes.standard.typography.heading),
      ...Object.values(AdspThemes.standard.typography.body),
    ];

    expect(typeStyles).not.toHaveLength(0);
    typeStyles.forEach(({ fontSize, lineHeight }) => {
      expect(fontSize).toMatch(/^var\(--goa-font-size-[a-z0-9]+\)$/);
      expect(lineHeight).toMatch(/^var\(--goa-line-height-[a-z0-9]+\)$/);
    });
  });

  it('provides an empty extension point for component-specific theme sections', () => {
    expect(AdspThemes.standard.components).toEqual({});
  });
});
