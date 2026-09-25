export type AdspEventStatus = 'idle' | 'connecting' | 'replaying' | 'live' | 'offline';

/**
 * Event delivered to handlers; this is the push service stream item with the event id.
 */
export interface AdspEvent {
  eventId: string;
  namespace: string;
  name: string;
  timestamp?: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EventCriteria {
  correlationId?: string;
  context?: Record<string, unknown>;
}

export interface HandlerContext {
  /** Aborted when the handler times out or the client is stopped. */
  signal: AbortSignal;
  /** Attempt number starting at 1. */
  attempt: number;
}

export type AdspEventHandler = (event: AdspEvent, context: HandlerContext) => unknown;

export interface HandlerOptions {
  /** Only handle events matching the criteria (in addition to the stream criteria). */
  criteria?: EventCriteria;
  /** Handler timeout; a timeout counts as a failure. */
  timeoutMs?: number;
  /** Retries after the first failed attempt before the event is given up on. */
  retries?: number;
}

export interface CursorStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface AdspEventClientOptions {
  /** Push service root URL, e.g. https://push-service.adsp.alberta.ca */
  pushServiceUrl: string;
  /** Push service stream ID. */
  stream: string;
  /** Tenant name; required for anonymous access to a public stream, otherwise the tenant comes from the token. */
  tenant?: string;
  /** Criteria applied by push service to the whole connection. */
  criteria?: EventCriteria;
  /** Provides a current access token for each (re)connection. */
  getToken?: () => Promise<string | undefined> | string | undefined;
  /** Called when missed events can't be recovered; the app should reload its state. */
  onResync?: () => unknown;
  /** Called when a handler fails after all retries; the event is then skipped. */
  onError?: (event: AdspEvent, error: unknown) => void;
  /** Where the consumption cursor is kept; defaults to sessionStorage (i.e. per tab). */
  storage?: CursorStorage | null;
  /** Default handler retries. */
  retries?: number;
  /** Delay before the first retry; doubles on each retry. */
  retryDelayMs?: number;
  /** Default handler timeout. */
  timeoutMs?: number;
  /** Reconnect backoff range. */
  reconnectDelayMs?: { min: number; max: number };
  /** Reconnect if nothing (including keepalives) is received for this long. */
  idleTimeoutMs?: number;
  /** Number of recently processed event ids kept for de-duplication. */
  dedupeSize?: number;
  fetch?: typeof fetch;
  logger?: Pick<Console, 'debug' | 'warn'>;
}
