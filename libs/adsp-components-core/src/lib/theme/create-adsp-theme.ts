import { AdspTheme, AdspThemeComponents } from './adsp-theme';
import { deepFreeze } from './deep-freeze';

export type AdspDeepPartial<T> = { [K in keyof T]?: T[K] extends object ? AdspDeepPartial<T[K]> : T[K] };

export type AdspThemeOverrides = AdspDeepPartial<AdspTheme>;

export type AdspComponentThemeOverrides<K extends keyof AdspThemeComponents> = AdspDeepPartial<AdspThemeComponents[K]>;

// Returns a new frozen theme with `overrides` merged over `base`; values not overridden are kept from `base`.
export function createAdspTheme(base: AdspTheme, overrides: AdspThemeOverrides): AdspTheme {
  return deepFreeze(mergeDeep(base, overrides) as AdspTheme);
}

function mergeDeep(base: object, overrides: object): object {
  const merged: Record<string, unknown> = { ...base };
  Object.entries(overrides)
    .filter(([, override]) => override !== undefined)
    .forEach(([key, override]) => {
      const current = merged[key];
      merged[key] = isObject(current) && isObject(override) ? mergeDeep(current, override) : override;
    });
  return merged;
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}
