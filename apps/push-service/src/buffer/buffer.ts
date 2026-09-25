import { AdspId } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { randomBytes } from 'crypto';
import type { Logger } from 'winston';
import { compareEntryIds } from './cursor';
import type { RedisCommands } from './redis';

export interface BufferedEvent {
  entryId: string;
  event: DomainEvent;
}

export interface EventBufferOptions {
  /** How long events are kept for replay. */
  retentionMs: number;
  /** Safety cap on the number of entries per tenant stream. */
  maxLength: number;
}

export const EMPTY_ENTRY_ID = '0-0';

// Trimming is exact (not `~`) and records the highest trimmed entry id as a watermark. Redis doesn't track trimmed
// entries (max-deleted-entry-id only reflects XDEL), and the watermark is what detects a cursor older than retention.
// KEYS[1] stream, KEYS[2] watermark; ARGV[1] min id
const TRIM_SCRIPT = `
local old = redis.call('XREVRANGE', KEYS[1], '(' .. ARGV[1], '-', 'COUNT', 1)
if #old > 0 then
  redis.call('SET', KEYS[2], old[1][1])
  return redis.call('XTRIM', KEYS[1], 'MINID', ARGV[1])
end
return 0
`;

// Keys use a {tenant} hash tag so the script's keys land in the same slot on a Redis cluster.
// KEYS[1] stream, KEYS[2] watermark, KEYS[3] epoch, KEYS[4] (optional) dedupe key
// ARGV[1] min id, ARGV[2] epoch candidate, ARGV[3] max length, ARGV[4] serialized event, ARGV[5] dedupe ttl seconds
const APPEND_SCRIPT = `
redis.call('SET', KEYS[3], ARGV[2], 'NX')
if #KEYS > 3 and not redis.call('SET', KEYS[4], '1', 'NX', 'EX', ARGV[5]) then
  return false
end
local id = redis.call('XADD', KEYS[1], '*', 'e', ARGV[4])
local old = redis.call('XREVRANGE', KEYS[1], '(' .. ARGV[1], '-', 'COUNT', 1)
if #old > 0 then
  redis.call('SET', KEYS[2], old[1][1])
  redis.call('XTRIM', KEYS[1], 'MINID', ARGV[1])
end
local excess = redis.call('XLEN', KEYS[1]) - tonumber(ARGV[3])
if excess > 0 then
  local dropped = redis.call('XRANGE', KEYS[1], '-', '+', 'COUNT', excess)
  redis.call('SET', KEYS[2], dropped[#dropped][1])
  redis.call('XTRIM', KEYS[1], 'MAXLEN', ARGV[3])
end
return id
`;

type StreamEntryReply = [string, string[]];

function serialize({ traceparent: _traceparent, ...event }: DomainEvent): string {
  return JSON.stringify({
    ...event,
    tenantId: event.tenantId?.toString(),
    timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
  });
}

function deserialize(value: string): DomainEvent {
  const event = JSON.parse(value);
  return {
    ...event,
    tenantId: event.tenantId ? AdspId.parse(event.tenantId) : undefined,
    timestamp: new Date(event.timestamp),
  };
}

function toBufferedEvents(entries: StreamEntryReply[]): BufferedEvent[] {
  return (entries || []).map(([entryId, fields]) => ({
    entryId,
    event: deserialize(fields[fields.indexOf('e') + 1]),
  }));
}

/**
 * Short retention, per tenant replay buffer of domain events in Redis Streams.
 *
 * This is a delivery buffer and not a system of record; the event log in value service remains the audit trail.
 */
export class RedisEventBuffer {
  constructor(
    private logger: Logger,
    private redis: RedisCommands,
    private options: EventBufferOptions,
  ) {}

  private streamKey(tenantId: AdspId | string) {
    return `push:events:{${tenantId}}`;
  }

  private epochKey(tenantId: AdspId | string) {
    return `push:epoch:{${tenantId}}`;
  }

  private watermarkKey(tenantId: AdspId | string) {
    return `push:trimmed:{${tenantId}}`;
  }

  private dedupeKey(tenantId: AdspId | string, eventId: string) {
    return `push:evt:{${tenantId}}:${eventId}`;
  }

  /**
   * Appends an event to its tenant stream.
   * @returns the stream entry id, or null if the event was already buffered (duplicate delivery).
   */
  async append(event: DomainEvent): Promise<string | null> {
    const tenantId = event.tenantId;
    const keys = [this.streamKey(tenantId), this.watermarkKey(tenantId), this.epochKey(tenantId)];
    if (event.id) {
      keys.push(this.dedupeKey(tenantId, event.id));
    }

    const result = (await this.redis.call(
      'EVAL',
      APPEND_SCRIPT,
      keys.length,
      ...keys,
      `${Date.now() - this.options.retentionMs}-0`,
      randomBytes(4).toString('hex'),
      this.options.maxLength,
      serialize(event),
      Math.ceil(this.options.retentionMs / 1000),
    )) as string | null;

    if (!result) {
      this.logger.debug(`Skipped duplicate event ${event.namespace}:${event.name} (ID: ${event.id}).`, LOG_CONTEXT);
    }
    return result || null;
  }

  /**
   * Gets the epoch of the tenant stream, creating it if necessary.
   */
  async getEpoch(tenantId: AdspId): Promise<string> {
    const key = this.epochKey(tenantId);
    await this.redis.call('SET', key, randomBytes(4).toString('hex'), 'NX');
    return (await this.redis.call('GET', key)) as string;
  }

  /**
   * Gets the id of the latest entry in the tenant stream.
   */
  async getHead(tenantId: AdspId): Promise<string> {
    const [latest] = ((await this.redis.call('XREVRANGE', this.streamKey(tenantId), '+', '-', 'COUNT', 1)) ||
      []) as StreamEntryReply[];
    // An empty stream may have been trimmed; the head is then the last trimmed entry, so it's not 'before' retention.
    return latest?.[0] || ((await this.redis.call('GET', this.watermarkKey(tenantId))) as string) || EMPTY_ENTRY_ID;
  }

  /**
   * Determines if entries after the specified entry have been trimmed (i.e. the cursor is older than retention).
   */
  async isTrimmedAfter(tenantId: AdspId, entryId: string): Promise<boolean> {
    const watermark = (await this.redis.call('GET', this.watermarkKey(tenantId))) as string;
    return !!watermark && compareEntryIds(watermark, entryId) > 0;
  }

  /**
   * Trims entries before the specified time; this also happens on append based on retention.
   * @returns number of entries trimmed.
   */
  async trimBefore(tenantId: AdspId, before: Date): Promise<number> {
    return (await this.redis.call(
      'EVAL',
      TRIM_SCRIPT,
      2,
      this.streamKey(tenantId),
      this.watermarkKey(tenantId),
      `${before.getTime()}-0`,
    )) as number;
  }

  /**
   * Reads entries after (exclusive) the specified entry.
   */
  async readAfter(tenantId: AdspId, entryId: string, count: number): Promise<BufferedEvent[]> {
    const entries = (await this.redis.call(
      'XRANGE',
      this.streamKey(tenantId),
      `(${entryId}`,
      '+',
      'COUNT',
      count,
    )) as StreamEntryReply[];
    return toBufferedEvents(entries);
  }

  /**
   * Waits for entries after the specified entry; the connection must be dedicated since XREAD BLOCK holds it.
   */
  async readBlocking(
    connection: RedisCommands,
    tenantId: AdspId,
    entryId: string,
    blockMs: number,
    count: number,
  ): Promise<BufferedEvent[]> {
    const result = (await connection.call(
      'XREAD',
      'COUNT',
      count,
      'BLOCK',
      blockMs,
      'STREAMS',
      this.streamKey(tenantId),
      entryId,
    )) as [string, StreamEntryReply[]][] | null;
    return toBufferedEvents(result?.[0]?.[1]);
  }

  createConnection(): RedisCommands {
    return this.redis.duplicate();
  }
}

const LOG_CONTEXT = { context: 'RedisEventBuffer' };
