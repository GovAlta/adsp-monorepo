import { Release, Semaphore } from './semaphore';

const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));

describe('Semaphore', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('grants up to max permits immediately', async () => {
    const semaphore = new Semaphore(2);

    const first = await semaphore.acquire(0);
    const second = await semaphore.acquire(0);

    expect(first).toEqual(expect.any(Function));
    expect(second).toEqual(expect.any(Function));
    expect(semaphore.inUse).toBe(2);
  });

  it('returns undefined at once when no permit is free and waitMs is 0', async () => {
    const semaphore = new Semaphore(1);
    await semaphore.acquire(0);

    await expect(semaphore.acquire(0)).resolves.toBeUndefined();
    expect(semaphore.waiting).toBe(0);
  });

  it('queues and grants in FIFO order on release', async () => {
    const semaphore = new Semaphore(1);
    const release = (await semaphore.acquire(0)) as Release;
    const order: string[] = [];
    const a = semaphore.acquire(1000).then((r) => (order.push('a'), r));
    const b = semaphore.acquire(1000).then((r) => (order.push('b'), r));
    expect(semaphore.waiting).toBe(2);

    release();
    const releaseA = (await a) as Release;
    releaseA();
    await b;

    expect(order).toEqual(['a', 'b']);
    expect(semaphore.inUse).toBe(1);
    expect(semaphore.waiting).toBe(0);
  });

  it('returns undefined after waitMs when no permit frees', async () => {
    jest.useFakeTimers();
    const semaphore = new Semaphore(1);
    await semaphore.acquire(0);
    const waiting = semaphore.acquire(500);

    jest.advanceTimersByTime(499);
    await flush();
    expect(semaphore.waiting).toBe(1);
    jest.advanceTimersByTime(1);

    await expect(waiting).resolves.toBeUndefined();
    expect(semaphore.waiting).toBe(0);
    expect(semaphore.inUse).toBe(1);
  });

  it('returns undefined at once when the queue is full', async () => {
    const semaphore = new Semaphore(1, { maxWaiters: 1 });
    await semaphore.acquire(0);
    const queued = semaphore.acquire(1000);

    await expect(semaphore.acquire(1000)).resolves.toBeUndefined();
    expect(semaphore.waiting).toBe(1);
    void queued;
  });

  it('removes an aborted waiter and never grants it', async () => {
    const semaphore = new Semaphore(1);
    const release = (await semaphore.acquire(0)) as Release;
    const abort = new AbortController();
    const aborted = semaphore.acquire(1000, abort.signal);

    abort.abort();
    await expect(aborted).resolves.toBeUndefined();
    expect(semaphore.waiting).toBe(0);

    release();
    expect(semaphore.inUse).toBe(0);
  });

  it('returns undefined for an already-aborted signal without taking a permit', async () => {
    const semaphore = new Semaphore(1);
    const abort = new AbortController();
    abort.abort();

    await expect(semaphore.acquire(1000, abort.signal)).resolves.toBeUndefined();
    expect(semaphore.inUse).toBe(0);
  });

  it('release is idempotent', async () => {
    const semaphore = new Semaphore(1);
    const release = (await semaphore.acquire(0)) as Release;

    release();
    release();

    expect(semaphore.inUse).toBe(0);
    await semaphore.acquire(0);
    expect(semaphore.inUse).toBe(1);
  });

  it('never exceeds max under interleaved acquire, release and timeout', async () => {
    jest.useFakeTimers();
    const max = 3;
    const semaphore = new Semaphore(max, { maxWaiters: 5 });
    const held: Release[] = [];
    let seed = 42;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };

    for (let op = 0; op < 500; op++) {
      const roll = random();
      if (roll < 0.5) {
        void semaphore.acquire(Math.floor(random() * 50)).then((release) => release && held.push(release));
      } else if (roll < 0.85 && held.length > 0) {
        held.splice(Math.floor(random() * held.length), 1)[0]();
      } else {
        jest.advanceTimersByTime(Math.floor(random() * 30));
      }
      await flush();
      expect(semaphore.inUse).toBeLessThanOrEqual(max);
      expect(semaphore.inUse).toBe(held.length);
    }

    jest.advanceTimersByTime(1000);
    await flush();
    while (held.length > 0) {
      held.pop()?.();
      await flush();
    }
    jest.advanceTimersByTime(1000);
    await flush();
    expect(semaphore.inUse).toBe(0);
    expect(semaphore.waiting).toBe(0);
  });
});
