import { AdspTheme, AdspThemeComponents } from './adsp-theme';
import { AdspComponentThemeOverrides } from './create-adsp-theme';

export type AdspCssVariables = Readonly<Record<`--adsp-${string}`, string>>;

const cache = new WeakMap<AdspTheme, AdspCssVariables>();

// Exposes a theme as --adsp-* custom properties, e.g. color.surface.card -> --adsp-color-surface-card.
export function toCssVariables(theme: AdspTheme): AdspCssVariables {
  const cached = cache.get(theme);
  if (cached) {
    return cached;
  }

  const { name: _name, ...values } = theme;
  const variables = Object.freeze(collectVariables(values, '--adsp')) as AdspCssVariables;
  cache.set(theme, variables);
  return variables;
}

// Names match toCssVariables: ('button', { borderRadius }) -> --adsp-components-button-border-radius.
export function toComponentCssVariables<K extends keyof AdspThemeComponents>(
  component: K,
  overrides: AdspComponentThemeOverrides<K>,
): AdspCssVariables {
  const prefix = `--adsp-components-${toKebabCase(component)}`;
  return Object.freeze(collectVariables(overrides, prefix)) as AdspCssVariables;
}

function collectVariables(node: object, prefix: string, variables: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(node)) {
    const name = `${prefix}-${toKebabCase(key)}`;
    if (typeof value === 'string') {
      variables[name] = value;
    } else if (value !== null && typeof value === 'object') {
      collectVariables(value, name, variables);
    }
  }
  return variables;
}

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
