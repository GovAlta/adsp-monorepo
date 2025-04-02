import axios from 'axios';
import { Address, Suggestion } from './types';

export const fetchAddressSuggestions = async (
  formUrl: string,
  searchTerm: string,
  isAlbertaAddress?: boolean
): Promise<Suggestion[]> => {
  const params = {
    country: 'CAN',
    languagePreference: 'en',
    lastId: '',
    maxSuggestions: isAlbertaAddress ? '50' : '10',
    searchTerm: searchTerm,
  };

  try {
    const response = await axios.get(formUrl, { params });
    return response.data.Items;
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
};

export const filterAlbertaAddresses = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((suggestion) => suggestion.Description.includes('AB'));
};
export const filterSuggestionsWithoutAddressCount = (suggestions: Suggestion[]): Suggestion[] => {
  return suggestions.filter((suggestion) => {
    return !suggestion.Description.trim().endsWith('Addresses');
  });
};

export const mapSuggestionToAddress = (suggestion: Suggestion): Address => {
  let addressLine1, addressLine2;
  const suiteMatch = suggestion.Text.match(/(Suite|Apt|Unit|#)+/i);
  const textParts = suggestion.Text.split(' ');
  if (suiteMatch) {
    addressLine1 = suggestion.Text.replace(textParts[0], '').trim();
    addressLine2 = textParts[0].trim();
  } else {
    addressLine2 = '';
    addressLine1 = suggestion.Text.trim();
  }

  const descriptionParts = suggestion.Description.split(',');
  const municipality = descriptionParts[0].trim();
  const provinceAndPostalCode = descriptionParts[1].trim().split(' ');
  const subdivisionCode = provinceAndPostalCode[0];
  const postalCode = descriptionParts[2].trim();

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
