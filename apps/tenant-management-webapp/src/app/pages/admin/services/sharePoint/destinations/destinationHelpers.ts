import {
  SharepointDestination,
  SharepointDetailFailure,
  SharepointDetailList,
  SharepointFieldMapping,
} from '@store/sharePoint/actions';

export const ITEM_KEY_COLUMN = 'AdspItemKey';

const isComplete = (mapping: SharepointFieldMapping) => !!mapping.source && !!mapping.target;

function validateDetailLists(destination: SharepointDestination): string | undefined {
  const detailLists = destination.detailLists ?? [];
  if (detailLists.length === 0) {
    return undefined;
  }
  if (!destination.idempotencyFields?.length) {
    return 'Detail lists need "Update existing rows" turned on.';
  }
  for (const list of detailLists) {
    if (!list.listId?.trim() && !list.listName?.trim()) {
      return 'Each detail list needs a list name or a SharePoint list ID.';
    }
    if (!list.dataPath.trim()) {
      return 'Each detail list needs the path of its array in the data.';
    }
    if (!list.parentRefField.trim()) {
      return 'Each detail list needs a parent reference column.';
    }
    const mappings = list.fieldMappings.filter((mapping) => mapping.source || mapping.target);
    if (mappings.length === 0 || !mappings.every(isComplete)) {
      return 'Each detail list needs at least one complete field mapping.';
    }
    if (mappings.some(({ target }) => target === list.parentRefField)) {
      return `${list.parentRefField} is set by ADSP and cannot be mapped.`;
    }
  }
  const paths = detailLists.map(({ dataPath }) => dataPath.trim());
  if (new Set(paths).size !== paths.length) {
    return 'Two detail lists use the same array path.';
  }
  const names = detailLists.map(({ listName }) => listName?.trim().toLowerCase()).filter(Boolean);
  if (new Set(names).size !== names.length) {
    return 'Two detail lists use the same list name.';
  }
  return undefined;
}

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

  const detailError = validateDetailLists(destination);
  if (detailError) {
    errors.detailLists = detailError;
  }
  return errors;
}

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  'credential-not-set': 'The connection has no secret. Set one on the Connections tab.',
  'credential-unreadable':
    "The connection's saved secret can't be read, usually because the service's encryption key changed. Enter the secret again on the Connections tab.",
  'entra:AADSTS7000215': 'The connection secret was rejected. Check the client ID and secret.',
  'entra:AADSTS7000222': 'The connection secret has expired. Ask your M365 administrator for a new one.',
  'entra:AADSTS700016': 'The client ID was not found in the Entra tenant. Check the Entra tenant ID and client ID.',
  'graph:accessDenied': 'The app registration cannot write to this site. Ask the site owner for a write grant.',
  'graph:itemNotFound': 'The site or list was not found. Check the site ID and list ID.',
  'graph:TooManyRequests': 'SharePoint is throttling requests. Try again shortly.',
  network: 'SharePoint could not be reached. Try again shortly.',
  'adsp:unreachable': 'The ADSP SharePoint service could not be reached. Check that it is running.',
  'adsp:http-401':
    'The SharePoint service did not accept your sign-in. Check that you have the sharepoint-admin role, then sign out and back in.',
  'adsp:http-403': 'You need the sharepoint-admin role to test destinations. Ask a tenant admin to assign it.',
  'adsp:http-404': 'The destination or its connection was not found. Save the destination and try again.',
  'row-identity-missing':
    'The test data has no value for a row identity field. Add one, for example "_adsp": { "key": "test-1" }.',
  'destination-not-set-up': 'A detail list is not set up yet. Use Verify setup to create it.',
  'adsp:save-failed': 'The destination could not be saved, so it was not verified. Try saving again.',
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
  return (
    FAILURE_DESCRIPTIONS[errorCode] ?? 'The test failed. Check the connection and destination settings, then try again.'
  );
}

const itemNumbers = (indexes: number[]): string => {
  const numbers = indexes.map((index) => String(index + 1));
  return numbers.length > 1 ? `${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}` : numbers[0];
};

export function describeDetailFailures(
  failures: SharepointDetailFailure[],
  detailLists: SharepointDetailList[] = [],
): string[] {
  return failures.map(({ listId, indexes, oldRowsLeft, newRowsLeft, column }) => {
    const list = detailLists.find((candidate) => candidate.listId === listId);
    const name = list?.listName || list?.dataPath || listId;
    if (oldRowsLeft) {
      return `${name}: the new rows were written, but ${oldRowsLeft} old rows could not be removed. Run the test again.`;
    }
    if (indexes.length === 0) {
      return `${name}: the existing rows could not be read, so nothing was changed. Run the test again.`;
    }
    const items = `${indexes.length > 1 ? 'items' : 'item'} ${itemNumbers(indexes)} ${indexes.length > 1 ? 'were' : 'was'}`;
    const left = newRowsLeft
      ? ` ${newRowsLeft} ${newRowsLeft === 1 ? 'row' : 'rows'} from this attempt could not be removed. Run the test again.`
      : '';
    return `${name}: ${items} not written${column ? ` (column '${column}')` : ''}, so the rows from before are kept.${left}`;
  });
}

type PathSegment = string | number;

const segmentsOf = (path: string): PathSegment[] =>
  (path.match(/[^.[\]]+/g) ?? []).map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));

const isUnsafeSegment = (segment: PathSegment) =>
  segment === '__proto__' || segment === 'constructor' || segment === 'prototype';

const setAtPath = (data: Record<string, unknown>, path: string, value: unknown) => {
  const segments = segmentsOf(path);
  if (segments.length === 0 || segments.some(isUnsafeSegment)) {
    return;
  }
  let current = data as Record<PathSegment, unknown>;
  segments.slice(0, -1).forEach((segment, i) => {
    if (current[segment] === undefined || current[segment] === null) {
      current[segment] = typeof segments[i + 1] === 'number' ? [] : {};
    }
    current = current[segment] as Record<PathSegment, unknown>;
  });
  current[segments[segments.length - 1]] = value;
};

const sampleValue = ({ columnType, choices }: SharepointFieldMapping): unknown => {
  switch (columnType) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'dateTime':
      return '2026-01-01';
    case 'multiChoice':
      return choices?.length ? [choices[0]] : [];
    default:
      return '';
  }
};

const sampleOf = (mappings: SharepointFieldMapping[]): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  mappings
    .filter((mapping) => mapping.source)
    .forEach((mapping) => setAtPath(data, mapping.source, sampleValue(mapping)));
  return data;
};

export function sampleTestData(
  mappings: SharepointFieldMapping[],
  idempotencyFields: string[] = [],
  detailLists: SharepointDetailList[] = [],
): Record<string, unknown> {
  const data = sampleOf(mappings);
  detailLists
    .filter((list) => list.dataPath)
    .forEach((list) => setAtPath(data, list.dataPath, [sampleOf(list.fieldMappings)]));
  idempotencyFields.forEach((path) => setAtPath(data, path, 'test-1'));
  return data;
}
