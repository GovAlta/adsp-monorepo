import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { AdspThemes } from './adsp-themes';
import { toCssVariables } from './css-variables';

const GOA_TOKEN_REFERENCE = /^var\((--goa-[a-z0-9-]+)\)$/;
const ADSP_VARIABLE_REFERENCE = /var\((--adsp-[a-z0-9-]+)\)/g;
const COMPONENT_TOKEN_PREFIX = '--adsp-components-';
// Resolved via package.json because the Nx Jest resolver maps .css paths to identity-obj-proxy.
const goaTokensCssPath = join(dirname(require.resolve('@abgov/design-tokens/package.json')), 'dist/tokens.css');
const goaTokensCss = readFileSync(goaTokensCssPath, 'utf8');
const standardVariables = toCssVariables(AdspThemes.standard);
const baseThemeValues = Object.entries(standardVariables).filter(([name]) => !name.startsWith(COMPONENT_TOKEN_PREFIX));
const componentTokenValues = Object.entries(standardVariables).filter(([name]) =>
  name.startsWith(COMPONENT_TOKEN_PREFIX),
);
const referencedGoaTokens = baseThemeValues.map(([, value]) => value.replace(GOA_TOKEN_REFERENCE, '$1'));
const aliasedAdspVariables = componentTokenValues.flatMap(([, value]) =>
  [...value.matchAll(ADSP_VARIABLE_REFERENCE)].map(([, variable]) => variable),
);

describe('AdspThemes.standard', () => {
  test('is named "standard"', () => {
    // Act
    const { name } = AdspThemes.standard;

    // Assert
    expect(name).toBe('standard');
  });

  test.each(baseThemeValues)('sets base property %s to a GoA design token reference', (_variable, value) => {
    // Assert
    expect(value).toMatch(GOA_TOKEN_REFERENCE);
  });

  test.each(referencedGoaTokens)('references %s, which @abgov/design-tokens defines', (token) => {
    // Assert
    expect(goaTokensCss).toContain(`${token}:`);
  });

  test.each(componentTokenValues)(
    'keeps component token %s on the base theme instead of GoA tokens',
    (_variable, value) => {
      // Assert
      expect(value).not.toContain('--goa-');
    },
  );

  test.each(aliasedAdspVariables)('aliases %s, which the standard theme defines', (variable) => {
    // Assert
    expect(standardVariables).toHaveProperty([variable]);
  });

  test('defines a token section for each component', () => {
    // Act
    const componentNames = Object.keys(AdspThemes.standard.components);

    // Assert
    expect(componentNames).toEqual(['badge', 'button', 'card']);
  });

  test('rejects modification by a consuming application', () => {
    // Arrange
    const textColors = AdspThemes.standard.color.text;

    // Act
    const modify = () => {
      textColors.default = '#ff0000';
    };

    // Assert
    expect(modify).toThrow(TypeError);
  });
});
