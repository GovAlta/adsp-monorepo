import { adspId, auditDefinitions, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  AnonymousApplicantAuditActor,
  createAuditThrottle,
  FormAuditActions,
  FormCreatedAuditAction,
  FormServiceJobAuditActor,
  recordFormAudit,
  toDataRegisterAuditDetails,
  toFormAuditDetails,
  toFormOperationAuditDetails,
  toSubmissionDeletedAuditDetails,
} from './audit';
import { FormEntity } from './model';
import { FormServiceRoles } from './roles';
import { FormStatus } from './types';

describe('form audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const form = {
    tenantId,
    id: 'form-1',
    status: FormStatus.Draft,
    anonymousApplicant: true,
    dryRun: false,
    definition: { id: 'my-form' },
  } as unknown as FormEntity;

  const intakeApp = {
    tenantId,
    id: 'intake-sa',
    name: 'service-account-intake-app',
    roles: [FormServiceRoles.IntakeApp],
    isCore: false,
  } as User;

  const admin = { tenantId, id: 'admin', name: 'Admin', roles: [FormServiceRoles.Admin], isCore: false } as User;

  const logger = { warn: jest.fn() } as unknown as Logger;
  const auditService = {
    record: jest.fn().mockResolvedValue({ status: 'recorded', eventId: 'event' }),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the expected catalog', () => {
    expect(auditDefinitions(FormAuditActions)).toEqual({
      'form.created': expect.objectContaining({
        version: 1,
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'form',
      }),
      'form.data-updated': expect.objectContaining({
        category: 'data-access',
        severity: 'info',
        retentionClass: 'standard',
      }),
      'form.submitted': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
      }),
      'form.locked': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
      }),
      'form.unlocked': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
      }),
      'form.set-to-draft': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
      }),
      'form.archived': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
      }),
      'form.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
      }),
      'form.access-code-sent': expect.objectContaining({
        category: 'security',
        severity: 'info',
        retentionClass: 'security',
      }),
      'form.accessed-with-code': expect.objectContaining({
        category: 'security',
        severity: 'info',
        retentionClass: 'security',
      }),
      'submission.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
        resourceType: 'submission',
      }),
      'data-register.created': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'standard',
        resourceType: 'data-register',
      }),
      'data-register.updated': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'standard',
      }),
      'data-register.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'standard',
      }),
      'registration.submitted': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'standard',
        resourceType: 'registration',
      }),
      'registration.reviewed': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'registration',
      }),
    });
  });

  it('uses valid actor types for the anonymous applicant and job actors', () => {
    expect(AnonymousApplicantAuditActor).toEqual({
      id: 'anonymous-applicant',
      type: 'user',
      name: 'Anonymous applicant',
    });
    expect(FormServiceJobAuditActor).toEqual({ id: 'form-service-job', type: 'system', name: 'Form service job' });
  });

  describe('toFormAuditDetails', () => {
    it('builds details about the form', () => {
      expect(toFormAuditDetails(FormServiceJobAuditActor, form, { reason: 'inactivity' })).toEqual({
        tenantId,
        actor: FormServiceJobAuditActor,
        resource: { type: 'form', id: 'form-1' },
        correlationId: 'form-1',
        metadata: {
          definitionId: 'my-form',
          status: FormStatus.Draft,
          anonymousApplicant: true,
          dryRun: false,
          reason: 'inactivity',
        },
      });
    });

    it('does not include form data', () => {
      const withData = {
        ...form,
        data: { name: 'Jane Doe' },
        applicant: { addressAs: 'Jane' },
      } as unknown as FormEntity;
      const details = toFormAuditDetails(FormServiceJobAuditActor, withData);
      expect(JSON.stringify(details)).not.toContain('Jane');
    });
  });

  describe('toFormOperationAuditDetails', () => {
    it('attributes intake application calls for an anonymous applicant to the anonymous applicant', () => {
      const details = toFormOperationAuditDetails(intakeApp, form);
      expect(details.actor).toBe(AnonymousApplicantAuditActor);
      expect(details.metadata).toMatchObject({ callerId: 'intake-sa' });
    });

    it('attributes other users to themselves', () => {
      const details = toFormOperationAuditDetails(admin, form);
      expect(details.actor).toMatchObject({ id: 'admin', type: 'user', name: 'Admin' });
      expect(details.metadata).not.toHaveProperty('callerId');
    });

    it('attributes intake application calls for a form without an anonymous applicant to the service account', () => {
      const details = toFormOperationAuditDetails(intakeApp, { ...form, anonymousApplicant: false } as FormEntity);
      expect(details.actor).toMatchObject({ id: 'intake-sa', type: 'service' });
    });
  });

  it('builds submission deleted details', () => {
    expect(
      toSubmissionDeletedAuditDetails(admin, {
        tenantId,
        id: 'submission-1',
        formId: 'form-1',
        formDefinitionId: 'my-form',
        dryRun: false,
      }),
    ).toEqual({
      tenantId,
      actor: expect.objectContaining({ id: 'admin', type: 'user' }),
      resource: { type: 'submission', id: 'submission-1' },
      correlationId: 'form-1',
      metadata: { formId: 'form-1', definitionId: 'my-form', dryRun: false },
    });
  });

  it('builds data register details', () => {
    expect(toDataRegisterAuditDetails(admin, tenantId, 'weekdays', { entryCount: 2 })).toEqual({
      tenantId,
      actor: expect.objectContaining({ id: 'admin' }),
      resource: { type: 'data-register', id: 'weekdays', name: 'weekdays' },
      correlationId: 'weekdays',
      metadata: { name: 'weekdays', entryCount: 2 },
    });
  });

  describe('recordFormAudit', () => {
    it('records the event', () => {
      recordFormAudit(auditService, logger, FormCreatedAuditAction, () =>
        toFormAuditDetails(FormServiceJobAuditActor, form),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        FormCreatedAuditAction,
        expect.objectContaining({ resource: { type: 'form', id: 'form-1' } }),
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('logs a rejected record instead of leaving it unhandled', async () => {
      auditService.record.mockRejectedValueOnce(new Error('oh noes!'));

      recordFormAudit(auditService, logger, FormCreatedAuditAction, () =>
        toFormAuditDetails(FormServiceJobAuditActor, form),
      );
      await new Promise(process.nextTick);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('oh noes!'), expect.any(Object));
    });

    it('logs instead of throwing when details cannot be built', () => {
      expect(() =>
        recordFormAudit(auditService, logger, FormCreatedAuditAction, () => toFormOperationAuditDetails(null, form)),
      ).not.toThrow();
      expect(auditService.record).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('form.created'), expect.any(Object));
    });
  });

  describe('createAuditThrottle', () => {
    it('allows a key once per window', () => {
      let now = 0;
      const shouldRecord = createAuditThrottle(1000, () => now);

      expect(shouldRecord('a')).toBe(true);
      now = 999;
      expect(shouldRecord('a')).toBe(false);
      expect(shouldRecord('b')).toBe(true);
      now = 1000;
      expect(shouldRecord('a')).toBe(true);
      now = 1500;
      expect(shouldRecord('a')).toBe(false);
    });

    it('evicts the oldest keys when over the maximum entries', () => {
      const shouldRecord = createAuditThrottle(1000, () => 0, 2);

      expect(shouldRecord('a')).toBe(true);
      expect(shouldRecord('b')).toBe(true);
      expect(shouldRecord('c')).toBe(true);
      // 'a' was evicted to stay within 2 entries, so it is allowed again.
      expect(shouldRecord('a')).toBe(true);
      expect(shouldRecord('c')).toBe(false);
    });
  });
});
