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

export const VALIDATION_KEYWORDS = {
  REQUIRED: 'required',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  FORMAT: 'format',
  MINIMUM: 'minimum',
  MAXIMUM: 'maximum',
  TYPE: 'type',
  ERROR_MESSAGE: 'errorMessage',
};

export enum StepStatus {
  NOT_STARTED = 'NotStarted',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
}
export type StepStatusType = StepStatus.COMPLETED | StepStatus.NOT_STARTED | StepStatus.IN_PROGRESS;

export const getAddressLookupFieldLabel = (fieldName: string): string => {
  return ADDRESS_LOOKUP_LABELS[fieldName as keyof typeof ADDRESS_LOOKUP_LABELS] || fieldName;
};
