import { ProvisioningTracker } from './provisioning';

describe('ProvisioningTracker', () => {
  const deferred = () => {
    let resolve: () => void;
    let reject: (err: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('can count work in progress and forget it once it finishes or fails', async () => {
    const tracker = new ProvisioningTracker();
    const done = deferred();
    const failed = deferred();

    tracker.track(done.promise);
    const tracked = tracker.track(failed.promise);
    expect(tracker.count).toBe(2);

    done.resolve();
    failed.reject(new Error('oh noes!'));
    await expect(tracked).rejects.toThrow('oh noes!');
    await done.promise;

    expect(tracker.count).toBe(0);
  });

  it('can drain at once when nothing is in progress', async () => {
    await expect(new ProvisioningTracker().drain(1000)).resolves.toBe(true);
  });

  it('can wait for work in progress to finish', async () => {
    const tracker = new ProvisioningTracker();
    const work = deferred();
    tracker.track(work.promise);

    const drained = tracker.drain(1000);
    work.resolve();

    await expect(drained).resolves.toBe(true);
  });

  it('can count failed work as finished when draining', async () => {
    const tracker = new ProvisioningTracker();
    const work = deferred();
    tracker.track(work.promise).catch(() => undefined);

    const drained = tracker.drain(1000);
    work.reject(new Error('oh noes!'));

    await expect(drained).resolves.toBe(true);
  });

  it('can stop waiting when the time limit passes', async () => {
    jest.useFakeTimers();
    const tracker = new ProvisioningTracker();
    tracker.track(deferred().promise);

    const drained = tracker.drain(1000);
    jest.advanceTimersByTime(1000);

    await expect(drained).resolves.toBe(false);
    expect(tracker.count).toBe(1);
  });
});
