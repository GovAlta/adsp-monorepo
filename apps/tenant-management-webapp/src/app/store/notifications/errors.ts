import { AxiosError, isAxiosError } from 'axios';

/**
 * Facts about a failure that help the ADSP team find it in logs. Shown to the user under
 * "Details for support" and copied into the support email; never in the headline.
 */
export interface SupportDetails {
  service?: string;
  request?: string;
  result?: string;
  error?: string;
  page?: string;
  tenant?: string;
  time?: string;
}

export interface DescribedError {
  message: string;
  details?: SupportDetails;
}

/** Platform service name to base URL, as listed in the directory. */
export type ServiceDirectory = Record<string, string>;

interface Explanation {
  text?: string;
  details?: SupportDetails;
}

const GENERAL_MESSAGE = 'Something went wrong.';
const TRY_AGAIN_LATER =
  'Try again in a minute. If it keeps happening, contact support and include the details below.';
const APP_PROBLEM =
  'Something went wrong in the admin app. Refresh the page and try again. If it keeps happening, contact support and include the details below.';
const TIMEOUT_CODES = ['ECONNABORTED', 'ETIMEDOUT'];
const GATEWAY_STATUSES = [502, 503, 504];
const NOT_PERMITTED_PATTERN = /not permitted to (.+?)\.?$/;
const HTML_PATTERN = /<[a-z!/]/i;

const SUPPORT_LABELS: [keyof SupportDetails, string][] = [
  ['service', 'Service'],
  ['request', 'Request'],
  ['result', 'Result'],
  ['error', 'Error'],
  ['page', 'Page'],
  ['tenant', 'Tenant'],
  ['time', 'Time'],
];

/**
 * Turns what a caller passed to ErrorNotification into a message the user can act on,
 * plus details the user can hand to support.
 *
 * @param message the caller's description of what failed, e.g. "Failed to save calendar".
 * Some callers pass the error itself here, so a non-string message is treated as the error.
 */
export function describeError(message: unknown, error: unknown, services: ServiceDirectory): DescribedError {
  const callerMessage = typeof message === 'string' ? toSentence(message) : '';
  const cause = error ?? (typeof message === 'string' ? undefined : message);
  const { text, details } = explain(cause, services);

  return {
    message: [callerMessage, text].filter(Boolean).join(' ') || GENERAL_MESSAGE,
    details,
  };
}

export function formatSupportDetails(details: SupportDetails): string {
  return SUPPORT_LABELS.filter(([key]) => details[key])
    .map(([key, label]) => `${label}: ${details[key]}`)
    .join('\n');
}

function explain(cause: unknown, services: ServiceDirectory): Explanation {
  if (cause === undefined || cause === null || cause === '') {
    return {};
  }
  if (typeof cause === 'string') {
    return { text: toSentence(cause) };
  }
  if (isRequestError(cause)) {
    return explainRequestError(cause, services);
  }
  if (cause instanceof Error) {
    // Plain Errors are raised on purpose by the app with text meant for the user;
    // TypeError and the like are bugs, so their text is only for support.
    return cause.name === 'Error' && cause.message
      ? { text: toSentence(cause.message) }
      : { text: APP_PROBLEM, details: { error: `${cause.name}: ${cause.message}` } };
  }
  return { text: APP_PROBLEM, details: { error: stringify(cause) } };
}

function isRequestError(cause: unknown): cause is AxiosError {
  return isAxiosError(cause) || (typeof cause === 'object' && !!(cause as AxiosError).response);
}

function explainRequestError(error: AxiosError, services: ServiceDirectory): Explanation {
  const { config, response, code, message } = error;
  const url = toDisplayUrl(config?.url, config?.baseURL);
  const service = findServiceName(url, services);
  const request = [config?.method?.toUpperCase(), url].filter(Boolean).join(' ');

  return {
    text: explainStatus(response?.status, readServerMessage(response?.data), code, service),
    details: {
      service,
      request: request || undefined,
      result: response
        ? `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
        : `No response: ${message} (${code})`,
    },
  };
}

function explainStatus(status: number | undefined, serverMessage: string | undefined, code: string, service?: string): string {
  const serviceName = service ? `the ${service}` : 'the service';

  if (!status) {
    if (TIMEOUT_CODES.includes(code)) {
      return `${capitalize(serviceName)} took too long to respond. ${TRY_AGAIN_LATER}`;
    }
    if (window.navigator.onLine === false) {
      return 'You appear to be offline. Check your connection and try again.';
    }
    return `We couldn't reach ${serviceName}. ${TRY_AGAIN_LATER}`;
  }
  if (status === 401) {
    return 'Your session has expired. Sign in again to continue.';
  }
  if (status === 403) {
    const operation = serverMessage?.match(NOT_PERMITTED_PATTERN)?.[1];
    return `You don't have permission to ${operation ?? 'do this'}. Ask your tenant administrator for access.`;
  }
  if (status === 404) {
    return serverMessage
      ? `${toSentence(serverMessage)} Refresh the page and try again.`
      : "We couldn't find what you asked for. It may have been deleted. Refresh the page and try again.";
  }
  if (status === 429) {
    return 'Too many requests. Wait a moment, then try again.';
  }
  if (status < 500) {
    return serverMessage
      ? toSentence(serverMessage)
      : 'The request was rejected. If it keeps happening, contact support and include the details below.';
  }
  if (GATEWAY_STATUSES.includes(status)) {
    return `${capitalize(serviceName)} is temporarily unavailable. ${TRY_AGAIN_LATER}`;
  }
  // Server errors can carry internal detail, so their body is never shown.
  return `Something went wrong in ${serviceName}. ${TRY_AGAIN_LATER}`;
}

function readServerMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data && !HTML_PATTERN.test(data) ? data : undefined;
  }
  if (data && typeof data === 'object') {
    const { errorMessage, error } = data as Record<string, unknown>;
    const text = errorMessage ?? error;
    return typeof text === 'string' && text ? text : undefined;
  }
  return undefined;
}

/** Origin and path only: query strings can carry user data and aren't needed to find the request. */
function toDisplayUrl(url?: string, baseURL?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url, baseURL || window.location.origin);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

function findServiceName(url: string | undefined, services: ServiceDirectory): string | undefined {
  if (!url) {
    return undefined;
  }
  let match: string | undefined;
  let matchLength = 0;
  for (const [name, serviceUrl] of Object.entries(services)) {
    const base = serviceUrl?.replace(/\/$/, '');
    if (base && base.length > matchLength && (url === base || url.startsWith(`${base}/`))) {
      match = name;
      matchLength = base.length;
    }
  }
  return match ?? toHostName(url);
}

function toHostName(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function toSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const capitalized = capitalize(trimmed);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
