import type { AdspId } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';

const WINDOW_MS = 60 * 1000;

interface TenantWindow {
  endsAt: number;
  allowed: number;
  dropped: number;
}

/**
 * Fixed one-minute window limit of login failure audit records per tenant. Failed logins are high volume
 * under attack, and each record is a write to the audit service.
 */
export class LoginFailureLimiter {
  private readonly windows = new Map<string, TenantWindow>();

  constructor(
    private readonly logger: Logger,
    private readonly perMinute: number,
  ) {}

  allow(tenantId: AdspId): boolean {
    const tenant = tenantId.toString();
    const now = Date.now();
    let window = this.windows.get(tenant);
    if (!window || now >= window.endsAt) {
      window = { endsAt: now + WINDOW_MS, allowed: 0, dropped: 0 };
      this.windows.set(tenant, window);
    }

    if (window.allowed < this.perMinute) {
      window.allowed++;
      return true;
    }

    if (window.dropped++ === 0) {
      this.reportDropped(tenant, window, window.endsAt - now);
    }
    return false;
  }

  private reportDropped(tenant: string, window: TenantWindow, delay: number) {
    setTimeout(() => {
      this.logger.warn(
        `Dropped ${window.dropped} login failure audit record(s) over the limit of ${this.perMinute} per minute.`,
        { context: 'AccessAudit', tenantId: tenant },
      );
    }, delay).unref();
  }
}
