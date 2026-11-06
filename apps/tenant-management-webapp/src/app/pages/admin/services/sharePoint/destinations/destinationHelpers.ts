import { SharepointDestination, SharepointFieldMapping } from '@store/sharePoint/actions';

export const ITEM_KEY_COLUMN = 'AdspItemKey';

export function validateDestination(
  destination: SharepointDestination,
  existingIds: string[],
  isNew: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!destination.name.trim()) {
    errors.name = 'Enter a name.';
  } else if (isNew && existingIds.includes(destination.id)) {
    errors.name = 'A destination with this ID already exists.';
  }
  if (!destination.connectionId) {
    errors.connectionId = 'Choose a connection.';
  }
  if (!destination.listId.trim()) {
    errors.listId = 'Enter the SharePoint list ID.';
  }

  const mappings = destination.fieldMappings.filter((mapping) => mapping.source || mapping.target);
  if (mappings.length === 0) {
    errors.fieldMappings = 'Add at least one field mapping.';
  } else if (mappings.some((mapping) => !mapping.source || !mapping.target)) {
    errors.fieldMappings = 'Each mapping needs a form data path and a column name.';
  } else if (mappings.some((mapping) => mapping.target === ITEM_KEY_COLUMN)) {
    errors.fieldMappings = `${ITEM_KEY_COLUMN} is set by ADSP and cannot be mapped.`;
  }

  const idempotencyFields = destination.idempotencyFields ?? [];
  if (new Set(idempotencyFields).size !== idempotencyFields.length) {
    errors.idempotencyFields = 'List each row identity field once.';
  }
  return errors;
}

export const parseIdempotencyFields = (text: string): string[] =>
  text
    .split(',')
    .map((path) => path.trim())
    .filter(Boolean);

export const formatIdempotencyFields = (fields: string[] | undefined): string => (fields ?? []).join(', ');

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  'credential-not-set': 'The connection has no secret. Set one on the Connections tab.',
  'entra:AADSTS7000215': 'The connection secret was rejected. Check the client ID and secret.',
  'entra:AADSTS7000222': 'The connection secret has expired. Ask your M365 administrator for a new one.',
  'entra:AADSTS700016': 'The client ID was not found in the Entra tenant. Check the Entra tenant ID and client ID.',
  'graph:accessDenied': 'The app registration cannot write to this site. Ask the site owner for a write grant.',
  'graph:itemNotFound': 'The site or list was not found. Check the site ID and list ID.',
  'graph:TooManyRequests': 'SharePoint is throttling requests. Try again shortly.',
  network: 'SharePoint could not be reached. Try again shortly.',
  'adsp:unreachable': 'The ADSP SharePoint service could not be reached. Check that it is running.',
  'adsp:http-401': 'Your sign-in was not accepted by the SharePoint service. Sign out and back in.',
  'adsp:http-403': 'You need the test-sharepoint-admin role to test destinations. Ask a tenant admin to assign it.',
  'adsp:http-404': 'The destination or its connection was not found. Save the destination and try again.',
  'row-identity-missing':
    'The test data has no value for a row identity field. Add one, for example "_adsp": { "key": "test-1" }.',
};

export function describeTestFailure(errorCode: string, column?: string): string {
  if (errorCode === 'graph:invalidRequest' && column === ITEM_KEY_COLUMN) {
    return `Add an indexed single-line text column named ${ITEM_KEY_COLUMN}, or clear row identity on this destination.`;
  }
  if (errorCode === 'graph:invalidRequest') {
    return column
      ? `SharePoint rejected the value for column '${column}'. Check that the column exists and the value has the right type.`
      : `SharePoint rejected the request. Check the list columns, including an indexed ${ITEM_KEY_COLUMN} column.`;
  }
  return FAILURE_DESCRIPTIONS[errorCode] ?? `The test failed with ${errorCode}.`;
}

const setAtPath = (data: Record<string, unknown>, path: string, value: unknown) => {
  const segments = path.split('.');
  let current = data;
  segments.slice(0, -1).forEach((segment) => {
    current[segment] = (current[segment] as Record<string, unknown>) ?? {};
    current = current[segment] as Record<string, unknown>;
  });
  current[segments[segments.length - 1]] = value;
};

export function sampleTestData(
  mappings: SharepointFieldMapping[],
  idempotencyFields: string[] = [],
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  mappings.filter((mapping) => mapping.source).forEach(({ source }) => setAtPath(data, source, ''));
  idempotencyFields.forEach((path) => setAtPath(data, path, 'test-1'));
  return data;
}
