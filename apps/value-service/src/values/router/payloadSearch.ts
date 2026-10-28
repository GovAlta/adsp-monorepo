import { ValueCriteria } from '../types';

const PAYLOAD_PATH_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*(\.[A-Za-z_][A-Za-z0-9_-]*)*$/;
const MAX_PAYLOAD_PATH_LENGTH = 500;

type Query = Record<string, unknown>;

const hasParameter = (query: Query, parameter: string): boolean =>
  Object.prototype.hasOwnProperty.call(query, parameter);

const parseJson = (value: string, parameter: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${parameter} must be valid JSON.`);
  }
};

const parsePayloadValue = (value: string): ValueCriteria['payloadValue'] => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || ['string', 'number', 'boolean'].includes(typeof parsed)) {
      return parsed as ValueCriteria['payloadValue'];
    }
  } catch {
    return value;
  }

  throw new Error('payloadValue must be a JSON scalar value.');
};

export const validatePayloadSearchQuery = (query: Query): true => {
  const hasPath = hasParameter(query, 'payloadPath');
  const hasValue = hasParameter(query, 'payloadValue');
  const hasPayload = hasParameter(query, 'payload');
  const hasPayloadSearch = hasPath || hasValue || hasPayload;

  if (hasPath !== hasValue) {
    throw new Error('payloadPath and payloadValue must be provided together.');
  }

  if (hasPayload && (hasPath || hasValue)) {
    throw new Error('Path/value and JSON payload searches cannot be combined.');
  }

  if (hasPayloadSearch && (!query.timestampMin || !query.timestampMax)) {
    throw new Error('timestampMin and timestampMax are required for payload searches.');
  }

  if (hasPath) {
    if (
      typeof query.payloadPath !== 'string' ||
      query.payloadPath.length > MAX_PAYLOAD_PATH_LENGTH ||
      !PAYLOAD_PATH_PATTERN.test(query.payloadPath)
    ) {
      throw new Error('payloadPath must be a valid dot-separated property path.');
    }

    if (typeof query.payloadValue !== 'string') {
      throw new Error('payloadValue must be a single JSON scalar value.');
    }

    parsePayloadValue(query.payloadValue);
  }

  if (hasPayload) {
    if (typeof query.payload !== 'string') {
      throw new Error('payload must be a single JSON object.');
    }

    const payload = parseJson(query.payload, 'payload');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('payload must be a JSON object.');
    }
  }

  return true;
};

export const parsePayloadSearchQuery = (query: Query): Partial<ValueCriteria> => {
  if (hasParameter(query, 'payloadPath')) {
    return {
      payloadPath: query.payloadPath as string,
      payloadValue: parsePayloadValue(query.payloadValue as string),
    };
  }

  if (hasParameter(query, 'payload')) {
    return { payload: parseJson(query.payload as string, 'payload') as Record<string, unknown> };
  }

  return {};
};
