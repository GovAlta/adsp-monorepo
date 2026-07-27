import { RegisterConfigData } from '@abgov/jsonforms-components';
import { ajv } from '@lib/validation/checkInput';

export type RegisterDataSeparator = 'comma' | 'newline' | 'semicolon' | 'json';

export const SEPARATOR_MAPPER: Record<Exclude<RegisterDataSeparator, 'json'>, string> = {
  comma: ',',
  newline: '\n',
  semicolon: ';',
};

const SEPARATOR_LABEL: Record<RegisterDataSeparator, string> = {
  comma: 'comma',
  newline: 'new line',
  semicolon: 'semicolon',
  json: 'JSON',
};

export const REGISTER_DATA_SCHEMA: Record<string, unknown> = {
  type: 'array',
  items: {
    anyOf: [{ type: 'string' }, { type: 'object' }],
  },
};

const validateRegisterData = ajv.compile(REGISTER_DATA_SCHEMA);

export const parseUrn = (urn: string): { namespace: string; name: string } => {
  const parts = urn.split('/');
  return {
    namespace: parts[parts.length - 2] ?? '',
    name: parts[parts.length - 1] ?? '',
  };
};

export const urnCompare = (a: RegisterConfigData, b: RegisterConfigData): number => {
  const aName = parseUrn(a.urn ?? '').name;
  const bName = parseUrn(b.urn ?? '').name;
  return aName.localeCompare(bName);
};

export const validateRegisterJson = (value: string): string => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return 'Please provide valid JSON';
  }

  const isValid = validateRegisterData(parsed);
  if (!isValid) {
    return validateRegisterData.errors?.[0]?.message ?? 'Data must be an array of strings or objects';
  }

  return '';
};

export const getSeparatorHelpText = (separator: RegisterDataSeparator): string => {
  switch (separator) {
    case 'comma':
      return 'Enter values separated by commas, e.g. Monday, Tuesday, Wednesday.';
    case 'newline':
      return 'Enter one value per line, e.g. Monday, Tuesday and Wednesday each on their own line.';
    case 'semicolon':
      return 'Enter values separated by semicolons, e.g. Monday; Tuesday; Wednesday.';
    case 'json':
      return 'Enter a valid JSON array of strings or objects, e.g. [{"label":"Alberta","value":"AB"}].';
  }
};

export const validateSeparatorMatch = (value: string, separator: RegisterDataSeparator): string => {
  const trimmed = value.trim();
  if (!trimmed || separator === 'json') {
    return '';
  }

  const hasSelectedSeparator =
    separator === 'newline' ? trimmed.includes('\n') : trimmed.includes(SEPARATOR_MAPPER[separator]);

  if (hasSelectedSeparator) {
    return '';
  }

  const otherSeparators = (Object.keys(SEPARATOR_MAPPER) as Exclude<RegisterDataSeparator, 'json'>[]).filter(
    (candidate) => candidate !== separator,
  );
  const hasOtherSeparatorChar = otherSeparators.some((candidate) => trimmed.includes(SEPARATOR_MAPPER[candidate]));
  const hasMultipleLines = separator !== 'newline' && trimmed.includes('\n');

  if (hasOtherSeparatorChar || hasMultipleLines) {
    return `Data does not appear to use the selected "${SEPARATOR_LABEL[separator]}" separator. Check your data or choose a different separator.`;
  }

  return '';
};
