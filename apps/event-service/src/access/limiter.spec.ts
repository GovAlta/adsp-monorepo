import { adspId } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import { LoginFailureLimiter } from './limiter';

describe('LoginFailureLimiter', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/6f0d3c1a2b4e5f6a7b8c9d0e`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/0e9d8c7b6a5f4e3d2c1b0a9f`;
  const logger = { warn: jest.fn() } as unknown as Logger;

  const allowRepeatedly = (limiter: LoginFailureLimiter, times: number, tenant = tenantId) =>
    Array.from({ length: times }, () => limiter.allow(tenant));

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-04T16:00:00.000Z'));
    (logger.warn as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows login failures up to the limit within a minute', () => {
    const limiter = new LoginFailureLimiter(logger, 3);

    const allowed = allowRepeatedly(limiter, 3);

    expect(allowed).toEqual([true, true, true]);
  });

  it('drops login failures over the limit within a minute', () => {
    const limiter = new LoginFailureLimiter(logger, 3);
    allowRepeatedly(limiter, 3);

    const allowed = allowRepeatedly(limiter, 2);

    expect(allowed).toEqual([false, false]);
  });

  it('allows login failures again in the next minute', () => {
    const limiter = new LoginFailureLimiter(logger, 3);
    allowRepeatedly(limiter, 5);

    jest.advanceTimersByTime(60 * 1000);
    const allowed = limiter.allow(tenantId);

    expect(allowed).toBe(true);
  });

  it('limits each tenant separately', () => {
    const limiter = new LoginFailureLimiter(logger, 3);
    allowRepeatedly(limiter, 5);

    const allowed = limiter.allow(otherTenantId);

    expect(allowed).toBe(true);
  });

  it('warns once per tenant at the end of the minute with the dropped count', () => {
    const limiter = new LoginFailureLimiter(logger, 3);
    allowRepeatedly(limiter, 7);

    jest.advanceTimersByTime(60 * 1000);

    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('includes the dropped count and tenant in the warning', () => {
    const limiter = new LoginFailureLimiter(logger, 3);
    allowRepeatedly(limiter, 7);

    jest.advanceTimersByTime(60 * 1000);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped 4 login failure'),
      expect.objectContaining({ tenantId: tenantId.toString() }),
    );
  });

  it('does not warn when no login failure is dropped', () => {
    const limiter = new LoginFailureLimiter(logger, 3);
    allowRepeatedly(limiter, 3);

    jest.advanceTimersByTime(60 * 1000);

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
