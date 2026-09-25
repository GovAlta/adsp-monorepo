import { SseFrame, SseParser } from './sse';
import type {
  AdspEvent,
  AdspEventClientOptions,
  AdspEventHandler,
  AdspEventStatus,
  CursorStorage,
  EventCriteria,
  HandlerOptions,
} from './types';

const READY_EVENT = 'adsp:ready';
const RESET_EVENT = 'adsp:reset';
const RECONNECT_EVENT = 'adsp:reconnect';

type QueueItem =
  | { type: 'event'; cursor: string; event: AdspEvent }
  | { type: 'cursor'; cursor: string }
  | { type: 'reset'; reason: string };

interface Registration {
  names: string[];
  handler: AdspEventHandler;
  options: HandlerOptions;
}

class StoppedError extends Error {
  constructor() {
    super('Client stopped.');
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new StoppedError());
      return;
    }
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new StoppedError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function isMatch(event: AdspEvent, criteria?: EventCriteria): boolean {
  return (
    !criteria ||
    (!(criteria.correlationId && criteria.correlationId !== event.correlationId) &&
      !Object.entries(criteria.context || {}).some(([key, value]) => value !== event.context?.[key]))
  );
}

function hash(value: string): string {
  let result = 5381;
  for (let i = 0; i < value.length; i++) {
    result = ((result << 5) + result + value.charCodeAt(i)) | 0;
  }
  return (result >>> 0).toString(36);
}

function getTokenSubject(token?: string): string {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).sub || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function getDefaultStorage(): CursorStorage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * Client that reliably consumes a push service stream.
 *
 * It owns the connection, the consumption cursor, replay and acknowledgement: the cursor only advances after every
 * matching handler has completed, and it's sent on reconnect so missed events are replayed. Handlers run one at a
 * time in stream order. Delivery is at least once, so handlers must tolerate duplicates.
 */
export class AdspEventClient {
  private registrations = new Set<Registration>();
  private statusListeners = new Set<(status: AdspEventStatus) => void>();
  private status: AdspEventStatus = 'idle';
  private queue: QueueItem[] = [];
  private draining: Promise<void> | null = null;
  private processed: string[] = [];
  private processedSet = new Set<string>();
  private cursorKey: string;
  private controller: AbortController | null = null;
  private reconnectNow = false;
  private storage: CursorStorage | null;
  private fetch: typeof fetch;
  private logger: Pick<Console, 'debug' | 'warn'>;

  constructor(private options: AdspEventClientOptions) {
    this.storage = options.storage === undefined ? getDefaultStorage() : options.storage;
    this.fetch = options.fetch || ((input, init) => fetch(input, init));
    this.logger = options.logger || console;
  }

  /**
   * Registers a handler for one or more events (`namespace:name`, or `*` for all events in the stream).
   * @returns function that removes the handler.
   */
  on(names: string | string[], handler: AdspEventHandler, options: HandlerOptions = {}): () => void {
    const registration = { names: Array.isArray(names) ? names : [names], handler, options };
    this.registrations.add(registration);
    return () => {
      this.registrations.delete(registration);
    };
  }

  onStatus(listener: (status: AdspEventStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  getStatus(): AdspEventStatus {
    return this.status;
  }

  start(): void {
    if (!this.controller) {
      this.controller = new AbortController();
      this.run(this.controller.signal);
    }
  }

  stop(): void {
    this.controller?.abort();
    this.controller = null;
    this.queue = [];
    this.setStatus('idle');
  }

  private setStatus(status: AdspEventStatus) {
    if (status !== this.status) {
      this.status = status;
      this.statusListeners.forEach((listener) => listener(status));
    }
  }

  private async run(signal: AbortSignal) {
    let failures = 0;
    while (!signal.aborted) {
      try {
        const wasLive = await this.connect(signal);
        failures = wasLive ? 0 : failures + 1;
      } catch (err) {
        failures++;
        if (!signal.aborted) {
          this.logger.warn(`ADSP event stream connection failed: ${err}`);
        }
      }

      if (signal.aborted) {
        break;
      }

      this.setStatus('offline');
      if (this.reconnectNow) {
        this.reconnectNow = false;
      } else {
        const { min, max } = this.options.reconnectDelayMs || { min: 1000, max: 30000 };
        const backoff = Math.min(max, min * 2 ** Math.max(failures - 1, 0));
        try {
          await delay(backoff * (0.5 + Math.random() * 0.5), signal);
        } catch {
          break;
        }
      }
    }
  }

  /**
   * Connects and reads the stream until it ends.
   * @returns true if the connection went live.
   */
  private async connect(signal: AbortSignal): Promise<boolean> {
    const { pushServiceUrl, stream, tenant, criteria, getToken } = this.options;
    this.setStatus('connecting');

    const token = await getToken?.();
    this.cursorKey = [
      'adsp-events',
      tenant || '-',
      stream,
      getTokenSubject(token),
      hash(JSON.stringify(criteria || {})),
    ].join(':');
    const cursor = this.storage?.getItem(this.cursorKey);

    const url = new URL(`/stream/v1/streams/${encodeURIComponent(stream)}`, pushServiceUrl);
    if (tenant) {
      url.searchParams.set('tenant', tenant);
    }
    if (criteria) {
      url.searchParams.set('criteria', JSON.stringify(criteria));
    }

    const connection = new AbortController();
    const abort = () => connection.abort();
    signal.addEventListener('abort', abort, { once: true });

    const idleTimeoutMs = this.options.idleTimeoutMs || 60000;
    let idle: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        this.logger.warn('ADSP event stream idle; reconnecting...');
        connection.abort();
      }, idleTimeoutMs);
    };

    let live = false;
    try {
      resetIdle();
      const response = await this.fetch(url.href, {
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(cursor ? { 'Last-Event-ID': cursor } : {}),
        },
        cache: 'no-store',
        signal: connection.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed with status ${response.status}.`);
      }
      this.setStatus(cursor ? 'replaying' : 'connecting');

      const parser = new SseParser();
      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        resetIdle();
        for (const frame of parser.push(decoder.decode(value, { stream: true }))) {
          live = this.onFrame(frame, connection) || live;
        }
      }
    } catch (err) {
      // Aborts are expected on stop, idle timeout, and server requested reconnect.
      if (!connection.signal.aborted) {
        throw err;
      }
    } finally {
      clearTimeout(idle);
      signal.removeEventListener('abort', abort);
    }
    return live;
  }

  private onFrame(frame: SseFrame, connection: AbortController): boolean {
    switch (frame.event) {
      case 'message': {
        const event = JSON.parse(frame.data) as AdspEvent;
        this.enqueue({ type: 'event', cursor: frame.id, event: { ...event, eventId: event.eventId || frame.id } });
        return false;
      }
      case READY_EVENT:
        this.enqueue({ type: 'cursor', cursor: frame.id });
        this.setStatus('live');
        return true;
      case RESET_EVENT:
        this.enqueue({ type: 'reset', reason: JSON.parse(frame.data).reason });
        return false;
      case RECONNECT_EVENT:
        this.reconnectNow = true;
        connection.abort();
        return false;
      default:
        return false;
    }
  }

  private enqueue(item: QueueItem) {
    this.queue.push(item);
    if (!this.draining) {
      this.draining = this.drain().finally(() => {
        this.draining = null;
      });
    }
  }

  private async drain() {
    const signal = this.controller?.signal;
    while (this.queue.length && signal && !signal.aborted) {
      const item = this.queue.shift();
      try {
        await this.process(item, signal);
      } catch (err) {
        if (err instanceof StoppedError) {
          return;
        }
        this.logger.warn(`ADSP event processing failed: ${err}`);
      }
    }
  }

  private async process(item: QueueItem, signal: AbortSignal) {
    if (item.type === 'reset') {
      this.logger.warn(`ADSP event stream reset (${item.reason}); missed events can't be recovered.`);
      await this.options.onResync?.();
      return;
    }

    if (item.type === 'event' && !this.processedSet.has(item.event.eventId)) {
      const key = `${item.event.namespace}:${item.event.name}`;
      const matched = [...this.registrations].filter(
        ({ names, options }) => (names.includes(key) || names.includes('*')) && isMatch(item.event, options.criteria),
      );
      for (const registration of matched) {
        await this.invoke(registration, item.event, signal);
      }
      this.remember(item.event.eventId);
    }

    // Acknowledge: the cursor only advances once the event has been handled (or given up on).
    if (item.cursor && !signal.aborted) {
      this.storage?.setItem(this.cursorKey, item.cursor);
    }
  }

  private async invoke({ handler, options }: Registration, event: AdspEvent, signal: AbortSignal) {
    const retries = options.retries ?? this.options.retries ?? 4;
    const timeoutMs = options.timeoutMs ?? this.options.timeoutMs ?? 30000;
    const retryDelayMs = this.options.retryDelayMs ?? 1000;

    for (let attempt = 1; ; attempt++) {
      const attemptController = new AbortController();
      const abort = () => attemptController.abort();
      signal.addEventListener('abort', abort, { once: true });
      let timeout: ReturnType<typeof setTimeout>;
      try {
        await Promise.race([
          Promise.resolve().then(() => handler(event, { signal: attemptController.signal, attempt })),
          new Promise((_resolve, reject) => {
            timeout = setTimeout(() => {
              attemptController.abort();
              reject(new Error(`Handler timed out after ${timeoutMs} ms.`));
            }, timeoutMs);
          }),
        ]);
        return;
      } catch (err) {
        if (signal.aborted) {
          throw new StoppedError();
        }
        if (attempt > retries) {
          this.logger.warn(`Handler for ${event.namespace}:${event.name} failed after ${attempt} attempts: ${err}`);
          this.options.onError?.(event, err);
          return;
        }
        this.logger.debug(`Handler for ${event.namespace}:${event.name} failed on attempt ${attempt}: ${err}`);
        await delay(retryDelayMs * 2 ** (attempt - 1), signal);
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
      }
    }
  }

  private remember(eventId: string) {
    this.processed.push(eventId);
    this.processedSet.add(eventId);
    if (this.processed.length > (this.options.dedupeSize || 500)) {
      this.processedSet.delete(this.processed.shift());
    }
  }
}

export function createAdspEventClient(options: AdspEventClientOptions): AdspEventClient {
  return new AdspEventClient(options);
}
