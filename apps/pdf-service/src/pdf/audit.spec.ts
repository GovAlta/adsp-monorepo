import { adspId, auditDefinitions, resolveRetentionClass } from '@abgov/adsp-service-sdk';
import {
  changedTemplateFields,
  PdfAuditActions,
  toAuditError,
  toPdfJobAuditDetails,
  toPdfTemplateAuditDetails,
  toRequesterAuditActor,
} from './audit';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const actor = { id: 'tester', type: 'user' as const, name: 'Tester' };

  it('defines the PDF service action catalog', () => {
    expect(auditDefinitions(PdfAuditActions)).toEqual({
      'job.created': expect.objectContaining({ category: 'runtime', severity: 'info', resourceType: 'pdf-job' }),
      'job.generated': expect.objectContaining({ category: 'runtime', severity: 'info', resourceType: 'pdf-job' }),
      'template.created': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        resourceType: 'pdf-template',
      }),
      'template.updated': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'pdf-template',
      }),
      'template.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'pdf-template',
      }),
    });
  });

  it('derives retention classes from the categories', () => {
    PdfAuditActions.forEach((action) => expect(action.retentionClass).toBeUndefined());
    expect(Object.fromEntries(PdfAuditActions.map((action) => [action.name, resolveRetentionClass(action)]))).toEqual({
      'job.created': 'standard',
      'job.generated': 'standard',
      'template.created': 'compliance',
      'template.updated': 'compliance',
      'template.deleted': 'compliance',
    });
  });

  describe('toRequesterAuditActor', () => {
    it('maps a user requester', () => {
      expect(toRequesterAuditActor({ id: 'tester', name: 'Tester' })).toEqual({
        id: 'tester',
        type: 'user',
        name: 'Tester',
      });
    });

    it('maps a service account requester', () => {
      expect(toRequesterAuditActor({ id: 'svc', name: 'service-account-urn:ads:platform:form-service' })).toEqual({
        id: 'svc',
        type: 'service',
        name: 'service-account-urn:ads:platform:form-service',
      });
    });

    it('omits an empty name', () => {
      expect(toRequesterAuditActor({ id: 'tester', name: '' })).toEqual({ id: 'tester', type: 'user' });
    });
  });

  it('builds job details correlated by the record ID', () => {
    expect(
      toPdfJobAuditDetails(
        actor,
        {
          tenantId,
          jobId: 'job-1',
          templateId: 'letter',
          filename: 'a.pdf',
          fileType: 'generated-pdf',
          recordId: 'r1',
        },
        { fileId: 'file-1' },
      ),
    ).toEqual({
      tenantId,
      actor,
      resource: { type: 'pdf-job', id: 'job-1', name: 'a.pdf' },
      correlationId: 'r1',
      metadata: {
        templateId: 'letter',
        filename: 'a.pdf',
        fileType: 'generated-pdf',
        recordId: 'r1',
        fileId: 'file-1',
      },
    });
  });

  it('builds template details', () => {
    expect(toPdfTemplateAuditDetails(actor, tenantId, { id: 'letter', name: 'Letter' }, { changedFields: [] })).toEqual(
      {
        tenantId,
        actor,
        resource: { type: 'pdf-template', id: 'letter', name: 'Letter' },
        metadata: { templateId: 'letter', name: 'Letter', changedFields: [] },
      },
    );
  });

  it('lists changed template fields', () => {
    expect(
      changedTemplateFields(
        { id: 'a', name: 'A', description: '', template: '<p>1</p>', header: 'h' },
        { id: 'a', name: 'A', description: '', template: '<p>2</p>', header: 'h', variables: '{}' },
      ),
    ).toEqual(['template', 'variables']);
  });

  it('truncates long errors', () => {
    expect(toAuditError(new Error('x'.repeat(2000)))).toHaveLength(1000);
    expect(toAuditError(new Error('boom'))).toBe('Error: boom');
  });
});
