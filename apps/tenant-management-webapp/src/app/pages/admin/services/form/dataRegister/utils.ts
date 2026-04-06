import { RegisterConfigData } from '@abgov/jsonforms-components';
import { ajv } from '@lib/validation/checkInput';

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
