import { adspId, AuditService, resolveRetentionClass } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { auditCacheInvalidated, CacheAuditActions, CacheInvalidatedAuditAction } from './audit';

describe('cache audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const targetId = adspId`urn:ads:platform:test-service:v1`;
  const logger = { warn: jest.fn() } as unknown as Logger;
  const auditService = { record: jest.fn() };
  const event = { namespace: 'test-service', name: 'test-updated', correlationId: 'c1' };

  beforeEach(() => {
    auditService.record.mockReset();
    (logger.warn as jest.Mock).mockReset();
    auditService.record.mockResolvedValue({ status: 'recorded', eventId: 'e1' });
  });

  it('registers only the cache.invalidated action', () => {
    expect(CacheAuditActions).toEqual([CacheInvalidatedAuditAction]);
    expect(CacheInvalidatedAuditAction).toMatchObject({
      name: 'cache.invalidated',
      category: 'administrative',
      severity: 'info',
    });
    // Explicit override of the administrative default (compliance).
    expect(resolveRetentionClass(CacheInvalidatedAuditAction)).toBe('standard');
  });

  it('records invalidation with correlation id and paths', () => {
    auditCacheInvalidated(auditService as unknown as AuditService, logger, {
      tenantId,
      targetId,
      ttl: 60,
      event,
      paths: ['/cache/a'],
    });

    expect(auditService.record).toHaveBeenCalledWith(
      CacheInvalidatedAuditAction,
      expect.objectContaining({
        tenantId,
        correlationId: 'c1',
        metadata: { targetUrn: targetId.toString(), ttl: 60, event: 'test-service:test-updated', paths: ['/cache/a'] },
      })
    );
  });

  it('skips events without a tenant', () => {
    auditCacheInvalidated(auditService as unknown as AuditService, logger, {
      tenantId: null,
      targetId,
      ttl: 60,
      event,
      paths: [],
    });

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('logs a warning when the event is not recorded', async () => {
    auditService.record.mockResolvedValueOnce({ status: 'failed', eventId: 'e1', reason: 'buffer_full', error: 'x' });
    auditCacheInvalidated(auditService as unknown as AuditService, logger, {
      tenantId,
      targetId,
      ttl: 60,
      event,
      paths: [],
    });
    await new Promise(process.nextTick);

    expect(logger.warn).toHaveBeenCalled();
  });
});
