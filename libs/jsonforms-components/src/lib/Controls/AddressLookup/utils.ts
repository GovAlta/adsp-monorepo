import { Address, Suggestion } from './types';

import axios from 'axios';

export async function fetchAddressSuggestions(
  formUrl: string,
  query: string,
  isAlberta: boolean,
  opts?: { signal?: AbortSignal }
): Promise<Suggestion[]> {
  const url = new URL(formUrl);
  url.searchParams.set('searchTerm', query);
  url.searchParams.set('languagePreference', 'en');
  url.searchParams.set('lastId', '');
  url.searchParams.set('maxSuggestions', isAlberta ? '50' : '10');
  url.searchParams.set('country', 'CAN');

  try {
    const res = await axios.get(url.toString(), { signal: opts?.signal });
    const json = res.data;

    if (!json) return [];
    if (Array.isArray(json)) return json as Suggestion[];

    if (typeof json === 'object') {
      const obj = json as Record<string, unknown>;
      for (const key of ['suggestions', 'items', 'Items']) {
        if (Array.isArray(obj[key])) return obj[key] as Suggestion[];
      }
    }
    return [];
    // eslint-disable-next-line
  } catch (err: any) {
    // axios throws on abort too; treat as “no results”
    if (err?.code === 'ERR_CANCELED') return [];
    throw err;
  }
}

export const filterAlbertaAddresses = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((suggestion) => suggestion.Description.includes('AB')).slice(0, 10);
};
export const filterSuggestionsWithoutAddressCount = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((suggestion) => {
    return !suggestion.Description.trim().endsWith('Addresses');
  });
};

export const mapSuggestionToAddress = (suggestion: Suggestion): Address => {
  const text = suggestion?.Text?.trim() ?? '';
  const textParts = text.split(' ');
  const hasSuite = /(Suite|Apt|Unit|#)+/i.test(text) && textParts.length > 1;

  const addressLine1 = hasSuite ? text.replace(textParts[0], '').trim() : text;
  const addressLine2 = hasSuite ? textParts[0].trim() : '';

  // Descriptions usually read "municipality, province, postalCode", but the lookup also returns
  // "municipality, province postalCode" and, for partial matches, drops the postal code entirely.
  // Reading the parts positionally used to throw on anything but the three part form.
  const descriptionParts = (suggestion?.Description ?? '').split(',').map((part) => part.trim());
  const [municipality = '', provinceAndPostalCode = '', trailingPostalCode = ''] = descriptionParts;

  const [subdivisionCode = '', ...postalCodeParts] = provinceAndPostalCode.split(' ').filter(Boolean);
  const postalCode = postalCodeParts.length > 0 ? postalCodeParts.join(' ') : trailingPostalCode;

  return {
    addressLine1,
    addressLine2,
    municipality,
    subdivisionCode,
    postalCode,
    country: 'CA',
  };
};

export const validatePostalCode = (values: string): boolean => {
  const postalCodeRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
  return postalCodeRegex.test(values);
};

export const handlePostalCodeValidation = (
  validatePc: boolean,
  message: string,
  value: string,
  errors: Record<string, string>
) => {
  const newErrors = { ...errors };

  if (!validatePc && value.length >= 4) {
    newErrors['postalCode'] = message;
  } else if (value.length === 0) {
    newErrors['postalCode'] = 'Postal Code is required.';
  } else {
    delete newErrors['postalCode'];
  }

  return newErrors;
};

export const formatPostalCode = (value: string) => {
  if (value.length >= 4 && value.indexOf(' ') === -1) {
    return value.slice(0, 3) + ' ' + value.slice(3);
  }
  return value;
};

export function detectPostalCodeType(input: string): 'full' | 'partial' | 'none' {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const fullPostal = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  const partialPostal = /^[A-Z]\d[A-Z]?\d?[A-Z]?\d?$/;

  if (fullPostal.test(cleaned)) return 'full';
  if (partialPostal.test(cleaned)) return 'partial';
  return 'none';
}

export function formatPostalCodeIfNeeded(input: string): string {
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const type = detectPostalCodeType(cleaned);

  if (type === 'none') return input;

  const before = cleaned.slice(0, 3);
  const after = cleaned.slice(3);
  return `${before} ${after}`;
}
export function handleAddressKeyDown(
  key: string,
  value: string,
  activeIndex: number,
  suggestions: Suggestion[],
  onInputChange: (value: string) => void,
  onSelect: (suggestion: Suggestion) => void
): number {
  if (key === 'ArrowDown') {
    const newIndex = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
    onInputChange(value);
    return newIndex;
  } else if (key === 'ArrowUp') {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
    onInputChange(value);
    return newIndex;
  } else if (key === 'Enter' && suggestions[activeIndex]) {
    onInputChange(value);
    onSelect(suggestions[activeIndex]);
  }

  return activeIndex;
}
