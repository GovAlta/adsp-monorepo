import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { RedisEventBuffer } from './buffer';

describe('RedisEventBuffer', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const streamKey = `push:events:{${tenantId}}`;
  const watermarkKey = `push:trimmed:{${tenantId}}`;
  const logger = { debug: jest.fn(), warn: jest.fn() } as unknown as Logger;
  const redis = { call: jest.fn(), duplicate: jest.fn(), quit: jest.fn() };
  const options = { retentionMs: 60000, maxLength: 1000 };

  const event = {
    id: 'event-1',
    namespace: 'test-service',
    name: 'test-started',
    tenantId,
    timestamp: new Date('2026-01-01T00:00:00Z'),
    traceparent: 'trace',
    payload: { value: 1 },
  };

  beforeEach(() => {
    redis.call.mockReset();
  });

  it('can append event with dedupe key', async () => {
    redis.call.mockResolvedValueOnce('1-0');
    const buffer = new RedisEventBuffer(logger, redis, options);
    const result = await buffer.append(event);

    expect(result).toBe('1-0');
    const [command, _script, keyCount, ...args] = redis.call.mock.calls[0];
    expect(command).toBe('EVAL');
    expect(keyCount).toBe(4);
    expect(args.slice(0, 4)).toEqual([
      streamKey,
      watermarkKey,
      `push:epoch:{${tenantId}}`,
      `push:evt:{${tenantId}}:event-1`,
    ]);
    const serialized = JSON.parse(args[7]);
    expect(serialized).toEqual(
      expect.objectContaining({ id: 'event-1', tenantId: tenantId.toString(), timestamp: '2026-01-01T00:00:00.000Z' }),
    );
    expect(serialized.traceparent).toBeUndefined();
  });

  it('can append event without id and skip dedupe', async () => {
    redis.call.mockResolvedValueOnce('1-0');
    const buffer = new RedisEventBuffer(logger, redis, options);
    await buffer.append({ ...event, id: undefined });
    expect(redis.call.mock.calls[0][2]).toBe(3);
  });

  it('can return null for duplicate', async () => {
    redis.call.mockResolvedValueOnce(null);
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.append(event)).toBeNull();
  });

  it('can get epoch', async () => {
    redis.call.mockResolvedValueOnce('OK').mockResolvedValueOnce('epoch-1');
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.getEpoch(tenantId)).toBe('epoch-1');
    expect(redis.call).toHaveBeenCalledWith('SET', `push:epoch:{${tenantId}}`, expect.any(String), 'NX');
  });

  it('can get head', async () => {
    redis.call.mockResolvedValueOnce([['5-0', ['e', '{}']]]);
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.getHead(tenantId)).toBe('5-0');
  });

  it('can get head of trimmed empty stream from watermark', async () => {
    redis.call.mockResolvedValueOnce([]).mockResolvedValueOnce('4-0');
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.getHead(tenantId)).toBe('4-0');
  });

  it('can get head of empty stream', async () => {
    redis.call.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.getHead(tenantId)).toBe('0-0');
  });

  it.each([
    [null, '1-0', false],
    ['1-0', '1-0', false],
    ['1-0', '2-0', false],
    ['3-0', '2-0', true],
  ])('can determine trimmed with watermark %p and cursor %p', async (watermark, entryId, expected) => {
    redis.call.mockResolvedValueOnce(watermark);
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.isTrimmedAfter(tenantId, entryId)).toBe(expected);
  });

  it('can trim before date', async () => {
    redis.call.mockResolvedValueOnce(3);
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.trimBefore(tenantId, new Date(1000))).toBe(3);
    expect(redis.call).toHaveBeenCalledWith('EVAL', expect.any(String), 2, streamKey, watermarkKey, '1000-0');
  });

  it('can read after entry', async () => {
    redis.call.mockResolvedValueOnce([
      ['2-0', ['e', JSON.stringify({ ...event, tenantId: tenantId.toString() })]],
    ]);
    const buffer = new RedisEventBuffer(logger, redis, options);
    const [result] = await buffer.readAfter(tenantId, '1-0', 10);

    expect(redis.call).toHaveBeenCalledWith('XRANGE', streamKey, '(1-0', '+', 'COUNT', 10);
    expect(result.entryId).toBe('2-0');
    expect(result.event.tenantId.toString()).toBe(tenantId.toString());
    expect(result.event.timestamp).toEqual(event.timestamp);
  });

  it('can read blocking', async () => {
    const connection = { call: jest.fn(), duplicate: jest.fn(), quit: jest.fn() };
    connection.call.mockResolvedValueOnce([
      [streamKey, [['2-0', ['e', JSON.stringify({ ...event, tenantId: tenantId.toString() })]]]],
    ]);
    const buffer = new RedisEventBuffer(logger, redis, options);
    const result = await buffer.readBlocking(connection, tenantId, '1-0', 100, 10);

    expect(connection.call).toHaveBeenCalledWith('XREAD', 'COUNT', 10, 'BLOCK', 100, 'STREAMS', streamKey, '1-0');
    expect(result).toHaveLength(1);
  });

  it('can read blocking timeout', async () => {
    const connection = { call: jest.fn().mockResolvedValueOnce(null), duplicate: jest.fn(), quit: jest.fn() };
    const buffer = new RedisEventBuffer(logger, redis, options);
    expect(await buffer.readBlocking(connection, tenantId, '1-0', 100, 10)).toEqual([]);
  });
});
