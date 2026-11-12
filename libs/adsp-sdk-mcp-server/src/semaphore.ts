/** Frees the permit. Calling it more than once has no further effect. */
export type Release = () => void;

interface Waiter {
  grant(release: Release): void;
}

export class Semaphore {
  private active = 0;
  private readonly queue: Waiter[] = [];
  private readonly maxWaiters: number;

  constructor(private readonly max: number, options: { maxWaiters?: number } = {}) {
    this.maxWaiters = options.maxWaiters ?? Infinity;
  }

  get inUse(): number {
    return this.active;
  }

  get waiting(): number {
    return this.queue.length;
  }

  /** Resolves to a release function, or to undefined when the wait timed out, the queue was full or `signal` aborted. */
  acquire(waitMs: number, signal?: AbortSignal): Promise<Release | undefined> {
    if (signal?.aborted) {
      return Promise.resolve(undefined);
    }
    if (this.active < this.max) {
      this.active += 1;
      return Promise.resolve(this.createRelease());
    }
    if (waitMs <= 0 || this.queue.length >= this.maxWaiters) {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      const giveUp = () => {
        this.queue.splice(this.queue.indexOf(waiter), 1);
        stopWaiting();
        resolve(undefined);
      };
      const timer = setTimeout(giveUp, waitMs);
      const stopWaiting = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', giveUp);
      };
      const waiter: Waiter = {
        grant: (release) => {
          stopWaiting();
          resolve(release);
        },
      };
      signal?.addEventListener('abort', giveUp, { once: true });
      this.queue.push(waiter);
    });
  }

  private createRelease(): Release {
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      // The permit passes straight to the next waiter, so `active` only drops when nobody is queued.
      const next = this.queue.shift();
      if (next) {
        next.grant(this.createRelease());
      } else {
        this.active -= 1;
      }
    };
  }
}
