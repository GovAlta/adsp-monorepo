export const sinTitle = 'Social insurance number';
export const invalidSin = 'Social insurance number is invalid';
export const DEFAULT_MAX_ITEMS = 50;
export const REQUIRED_PROPERTY_ERROR = 'is a required property';
export const ADDRESS_LOOKUP_LABELS = {
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  municipality: 'City',
  postalCode: 'Postal code',
  subdivisionCode: 'Province',
  country: 'Country',
} as const;

export const getAddressLookupFieldLabel = (fieldName: string): string => {
  return ADDRESS_LOOKUP_LABELS[fieldName as keyof typeof ADDRESS_LOOKUP_LABELS] || fieldName;
};
