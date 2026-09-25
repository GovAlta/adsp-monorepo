import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { BufferedEvent, RedisEventBuffer } from './buffer';
import { BufferTailer } from './tailer';

describe('BufferTailer', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { debug: jest.fn(), warn: jest.fn() } as unknown as Logger;
  const connection = { call: jest.fn(), duplicate: jest.fn(), quit: jest.fn() };

  function createBuffer(batches: BufferedEvent[][]) {
    return {
      getHead: jest.fn().mockResolvedValue('1-0'),
      createConnection: jest.fn(() => connection),
      readBlocking: jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return batches.shift() || [];
      }),
    } as unknown as RedisEventBuffer & { readBlocking: jest.Mock; getHead: jest.Mock };
  }

  const entry = (entryId: string) => ({ entryId, event: { name: 'test' } }) as BufferedEvent;

  beforeEach(() => {
    connection.quit.mockReset();
  });

  it('can deliver entries after head to listeners', async () => {
    const buffer = createBuffer([[entry('2-0'), entry('3-0')]]);
    const tailer = new BufferTailer(logger, buffer, 10);
    const received: string[] = [];

    const remove = await tailer.listen(tenantId, (e) => received.push(e.entryId));
    await new Promise((resolve) => setTimeout(resolve, 30));
    remove();

    expect(received).toEqual(['2-0', '3-0']);
    expect(buffer.readBlocking).toHaveBeenCalledWith(connection, tenantId, '1-0', 10, 100);
    expect(buffer.readBlocking).toHaveBeenCalledWith(connection, tenantId, '3-0', 10, 100);
  });

  it('can share one tail per tenant and stop it with the last listener', async () => {
    const buffer = createBuffer([]);
    const tailer = new BufferTailer(logger, buffer, 10);

    const remove1 = await tailer.listen(tenantId, jest.fn());
    const remove2 = await tailer.listen(tenantId, jest.fn());
    expect(buffer.createConnection).toHaveBeenCalledTimes(1);
    expect(tailer.activeTenants).toEqual([tenantId.toString()]);

    remove1();
    expect(tailer.activeTenants).toHaveLength(1);
    remove2();
    expect(tailer.activeTenants).toHaveLength(0);

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(connection.quit).toHaveBeenCalled();
  });

  it('can isolate listener errors', async () => {
    const buffer = createBuffer([[entry('2-0')]]);
    const tailer = new BufferTailer(logger, buffer, 10);
    const good = jest.fn();

    const remove1 = await tailer.listen(tenantId, () => {
      throw new Error('oops');
    });
    const remove2 = await tailer.listen(tenantId, good);
    await new Promise((resolve) => setTimeout(resolve, 30));
    remove1();
    remove2();

    expect(good).toHaveBeenCalledTimes(1);
  });

  it('can reject listen and clean up when head fails', async () => {
    const buffer = createBuffer([]);
    buffer.getHead.mockRejectedValueOnce(new Error('redis down'));
    const tailer = new BufferTailer(logger, buffer, 10);

    await expect(tailer.listen(tenantId, jest.fn())).rejects.toThrow('redis down');
    expect(tailer.activeTenants).toHaveLength(0);
    expect(connection.quit).toHaveBeenCalled();
  });

  it('can observe entries', async () => {
    const buffer = createBuffer([[entry('2-0')]]);
    const tailer = new BufferTailer(logger, buffer, 10);
    const received: string[] = [];

    const sub = tailer.observe(tenantId).subscribe((e) => received.push(e.entryId));
    await new Promise((resolve) => setTimeout(resolve, 30));
    sub.unsubscribe();

    expect(received).toEqual(['2-0']);
    expect(tailer.activeTenants).toHaveLength(0);
  });
});
