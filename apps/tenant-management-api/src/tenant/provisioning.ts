/**
 * Keeps track of the tenant realms this process is still provisioning, so shutdown can wait for them instead of
 * leaving their tenants stuck in `provisioning`.
 */
export class ProvisioningTracker {
  private readonly inProgress = new Set<Promise<void>>();

  get count(): number {
    return this.inProgress.size;
  }

  track(work: Promise<void>): Promise<void> {
    const tracked = work.finally(() => this.inProgress.delete(tracked));
    this.inProgress.add(tracked);
    return tracked;
  }

  /** Resolves true once all work in progress has finished, or false when the time limit passes first. */
  async drain(timeoutMs: number): Promise<boolean> {
    if (this.inProgress.size === 0) {
      return true;
    }

    let timer: NodeJS.Timeout;
    const timedOut = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    const finished = Promise.allSettled([...this.inProgress]).then(() => true);
    try {
      return await Promise.race([finished, timedOut]);
    } finally {
      clearTimeout(timer);
    }
  }
}
