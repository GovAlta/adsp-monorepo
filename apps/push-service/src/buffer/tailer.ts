import type { AdspId } from '@abgov/adsp-service-sdk';
import { Observable } from 'rxjs';
import type { Logger } from 'winston';
import type { BufferedEvent, RedisEventBuffer } from './buffer';
import type { RedisCommands } from './redis';

type Listener = (entry: BufferedEvent) => void;

const READ_COUNT = 100;
const ERROR_BACKOFF_MS = 1000;

class TenantTail {
  readonly listeners = new Set<Listener>();
  readonly ready: Promise<void>;
  private active = true;
  private lastId: string;
  private connection: RedisCommands;

  constructor(
    private logger: Logger,
    private buffer: RedisEventBuffer,
    private tenantId: AdspId,
    private blockMs: number,
  ) {
    this.connection = buffer.createConnection();
    this.ready = buffer.getHead(tenantId).then(
      (head) => {
        this.lastId = head;
        this.run();
      },
      async (err) => {
        await this.connection.quit();
        throw err;
      },
    );
  }

  private async run() {
    while (this.active) {
      try {
        const entries = await this.buffer.readBlocking(
          this.connection,
          this.tenantId,
          this.lastId,
          this.blockMs,
          READ_COUNT,
        );
        for (const entry of entries) {
          this.lastId = entry.entryId;
          this.emit(entry);
        }
      } catch (err) {
        this.logger.warn(`Error reading buffer for tenant ${this.tenantId}: ${err}`, LOG_CONTEXT);
        await new Promise((resolve) => setTimeout(resolve, ERROR_BACKOFF_MS));
      }
    }
    await this.connection.quit();
  }

  private emit(entry: BufferedEvent) {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        this.logger.warn(`Error in buffer listener for tenant ${this.tenantId}: ${err}`, LOG_CONTEXT);
      }
    }
  }

  stop() {
    // The loop exits once the current blocking read returns (at most blockMs).
    this.active = false;
  }
}

/**
 * Tails per tenant buffer streams and fans entries out to in-process listeners.
 *
 * One tail (and one blocking Redis connection) runs per tenant with at least one connected client on this instance.
 */
export class BufferTailer {
  private tails = new Map<string, TenantTail>();

  constructor(
    private logger: Logger,
    private buffer: RedisEventBuffer,
    private blockMs = 5000,
  ) {}

  /**
   * Adds a listener for new entries in the tenant stream.
   *
   * Resolves once the tail position is established; any entry appended after that point is delivered to the listener.
   * @returns function that removes the listener.
   */
  async listen(tenantId: AdspId, listener: Listener): Promise<() => void> {
    const key = tenantId.toString();
    let tail = this.tails.get(key);
    if (!tail) {
      tail = new TenantTail(this.logger, this.buffer, tenantId, this.blockMs);
      this.tails.set(key, tail);
      this.logger.debug(`Started buffer tail for tenant ${key}.`, LOG_CONTEXT);
    }

    tail.listeners.add(listener);
    const remove = () => {
      tail.listeners.delete(listener);
      if (tail.listeners.size === 0 && this.tails.get(key) === tail) {
        tail.stop();
        this.tails.delete(key);
        this.logger.debug(`Stopped buffer tail for tenant ${key}.`, LOG_CONTEXT);
      }
    };

    try {
      await tail.ready;
    } catch (err) {
      remove();
      throw err;
    }
    return remove;
  }

  observe(tenantId: AdspId): Observable<BufferedEvent> {
    return new Observable<BufferedEvent>((subscriber) => {
      let remove: () => void;
      let closed = false;
      this.listen(tenantId, (entry) => subscriber.next(entry)).then(
        (result) => (closed ? result() : (remove = result)),
        (err) => subscriber.error(err),
      );
      return () => {
        closed = true;
        remove?.();
      };
    });
  }

  get activeTenants(): string[] {
    return [...this.tails.keys()];
  }
}

const LOG_CONTEXT = { context: 'BufferTailer' };
