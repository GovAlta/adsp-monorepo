import { adspId, auditDefinitions, getContextTrace, resolveRetentionClass } from '@abgov/adsp-service-sdk';
import type { AuditService, User } from '@abgov/adsp-service-sdk';
import type { Request, Response } from 'express';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import {
  auditAdminAccess,
  auditCorrelationId,
  createAuditRecorder,
  PlannerAuditActions,
  SolutionAdminAccessedAuditAction,
  toPatternAuditDetails,
  toPatternChangeSet,
  toPlannerAuditActor,
  toSolutionAuditDetails,
  toSpecialistChatAuditDetails,
  toAuditStatus,
} from './audit';
import { InvalidOperationError } from '@core-services/core-common';
import { PlannerServiceRoles } from './roles';
import { BusinessPattern, Solution } from './types';

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  getContextTrace: jest.fn(),
}));

const getContextTraceMock = getContextTrace as jest.Mock;
const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const makeUser = (id: string, roles: string[], name = id): User =>
  ({ id, name, email: `${id}@example.com`, tenantId, roles, isCore: false }) as unknown as User;

const pattern = (overrides: Partial<BusinessPattern> = {}): BusinessPattern => ({
  id: 'case-management',
  name: 'Case management',
  description: 'Cases',
  domainLanguage: ['case'],
  commonFeatures: [],
  strongSignals: [{ description: 'Cases', keywords: ['case'] }],
  weakSignals: [],
  serviceMappings: [{ service: 'form-service', reason: 'Intake' }],
  clarifyingQuestions: [],
  assumptions: [],
  knownUnknowns: [],
  ...overrides,
});

describe('planner audit', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('registers the action catalog with category, severity and the category-derived retention class', () => {
    const catalog = auditDefinitions(PlannerAuditActions);

    expect(
      Object.fromEntries(
        Object.entries(catalog).map(([name, definition]) => [
          name,
          {
            category: definition.category,
            severity: definition.severity,
            retentionClass: resolveRetentionClass(definition),
            resourceType: definition.resourceType,
            captureChangeSet: definition.captureChangeSet,
          },
        ]),
      ),
    ).toEqual({
      'planner.solution.created': {
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'solution',
      },
      'planner.solution.deleted': {
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
        resourceType: 'solution',
      },
      'planner.solution.exported': {
        category: 'data-access',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'solution',
      },
      'planner.solution.admin-accessed': {
        category: 'data-access',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'solution',
      },
      'planner.solution.analyzed': {
        category: 'runtime',
        severity: 'info',
        retentionClass: 'standard',
        resourceType: 'solution',
      },
      'planner.pattern.created': {
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'pattern',
      },
      'planner.pattern.updated': {
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'pattern',
        captureChangeSet: true,
      },
      'planner.pattern.deleted': {
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
        resourceType: 'pattern',
      },
      'planner.specialist-chat.exported': {
        category: 'data-access',
        severity: 'info',
        retentionClass: 'compliance',
      },
      'planner.specialist-chat.deleted': {
        category: 'administrative',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'specialist-chat',
      },
    });
    expect(PlannerAuditActions.every((action) => action.version === 1 && action.description)).toBe(true);
  });

  it('does not set a retention class on any action, so the audit service derives it from the category', () => {
    expect(PlannerAuditActions.filter((action) => 'retentionClass' in action)).toEqual([]);
  });

  it('records the user id, type, name and roles as the actor, without the email', () => {
    expect(toPlannerAuditActor(makeUser('user-1', [PlannerServiceRoles.User], 'Jane'))).toEqual({
      id: 'user-1',
      type: 'user',
      name: 'Jane',
      roles: [PlannerServiceRoles.User],
    });
  });

  it('records service accounts as service actors', () => {
    expect(toPlannerAuditActor(makeUser('sa-1', [], 'service-account-app')).type).toBe('service');
  });

  it('uses the trace ID of the request as the correlation ID', () => {
    getContextTraceMock.mockReturnValue({ toString: () => '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' });

    expect(auditCorrelationId()).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
  });

  it('has no correlation ID when tracing is off', () => {
    getContextTraceMock.mockReturnValue(null);

    expect(auditCorrelationId()).toBeUndefined();
  });

  it('builds solution details with the tenant, resource and metadata only', () => {
    const details = toSolutionAuditDetails(
      makeUser('user-1', []),
      { tenantId, id: 'solution-1', name: 'Intake' },
      { scenario: 'new' },
    );

    expect(details).toEqual({
      tenantId,
      actor: expect.objectContaining({ id: 'user-1' }),
      resource: { type: 'solution', id: 'solution-1', name: 'Intake' },
      correlationId: undefined,
      metadata: { scenario: 'new' },
    });
  });

  it('builds pattern details', () => {
    expect(toPatternAuditDetails(makeUser('admin-1', []), tenantId, pattern(), { source: 'custom' })).toMatchObject({
      tenantId,
      resource: { type: 'pattern', id: 'case-management', name: 'Case management' },
      metadata: { source: 'custom' },
    });
  });

  it('builds chat details without the chat title', () => {
    const details = toSpecialistChatAuditDetails(
      makeUser('user-1', []),
      tenantId,
      { id: 'chat-1' },
      { scope: 'single' },
    );

    expect(details.resource).toEqual({ type: 'specialist-chat', id: 'chat-1' });
  });

  it('builds chat details without a resource when exporting all chats', () => {
    const details = toSpecialistChatAuditDetails(makeUser('user-1', []), tenantId, undefined, { scope: 'all' });

    expect(details.resource).toBeUndefined();
  });

  describe('toPatternChangeSet', () => {
    it('includes only the changed pattern fields, without the source', () => {
      const result = toPatternChangeSet(
        pattern({ source: 'built-in' }),
        pattern({ name: 'Cases', domainLanguage: ['case', 'file'] }),
      );

      expect(result).toEqual({
        changeSet: {
          before: { name: 'Case management', domainLanguage: ['case'] },
          after: { name: 'Cases', domainLanguage: ['case', 'file'] },
        },
      });
    });

    it('includes fields that are only on one side', () => {
      const result = toPatternChangeSet(
        pattern({ unsupportedCapabilities: [{ capability: 'x', reason: 'y' }] as never }),
        pattern(),
      );

      expect(result.changeSet).toEqual({
        before: { unsupportedCapabilities: [{ capability: 'x', reason: 'y' }] },
        after: {},
      });
    });

    it('omits a change set over the 16 KB limit', () => {
      const result = toPatternChangeSet(
        pattern(),
        pattern({ domainLanguage: [...Array(40)].map(() => 'x'.repeat(500)) }),
      );

      expect(result).toEqual({ changeSetOmitted: true });
    });
  });

  describe('toAuditStatus', () => {
    it('is success without an error', () => {
      expect(toAuditStatus()).toBe('success');
    });

    it('is failure for a client error', () => {
      expect(toAuditStatus(new InvalidOperationError('This chat is full; start a new chat.'))).toBe('failure');
    });

    it('is error for a server or unexpected error', () => {
      expect(toAuditStatus(new Error('database unavailable'))).toBe('error');
    });
  });

  describe('createAuditRecorder', () => {
    const auditService = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };
    const logger = { warn: jest.fn() };
    const recorder = () => createAuditRecorder(auditService as unknown as AuditService, logger as unknown as Logger);
    const details = { tenantId, actor: { id: 'user-1', type: 'user' as const } };

    it('sends the record to the audit service', () => {
      auditService.record.mockResolvedValue({ status: 'recorded', eventId: 'e' });

      recorder()(SolutionAdminAccessedAuditAction, details);

      expect(auditService.record).toHaveBeenCalledWith(SolutionAdminAccessedAuditAction, details);
    });

    it('logs a rejected record instead of failing', async () => {
      auditService.record.mockRejectedValue(new Error('audit unavailable'));

      expect(() => recorder()(SolutionAdminAccessedAuditAction, details)).not.toThrow();
      await new Promise((resolve) => setImmediate(resolve));

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('planner.solution.admin-accessed: Error: audit unavailable'),
        expect.anything(),
      );
    });
  });

  describe('auditAdminAccess', () => {
    const recordAudit = jest.fn();
    const admin = makeUser('admin-1', [PlannerServiceRoles.Admin]);
    const solution = { id: 'solution-1', tenantId, name: 'Intake', createdById: 'owner-1' } as Solution;

    const run = (user: User, statusCode = 200) => {
      const req = { user, solution } as unknown as Request;
      const res = Object.assign(new EventEmitter(), { statusCode }) as unknown as Response;
      const next = jest.fn();
      auditAdminAccess(recordAudit, 'read')(req, res, next);
      res.emit('finish');
      return next;
    };

    it('records admin access to a solution owned by another user once the response succeeds', () => {
      const next = run(admin);

      expect(next).toHaveBeenCalledWith();
      expect(recordAudit).toHaveBeenCalledWith(
        SolutionAdminAccessedAuditAction,
        expect.objectContaining({
          tenantId,
          resource: { type: 'solution', id: 'solution-1', name: 'Intake' },
          metadata: { ownerId: 'owner-1', operation: 'read' },
        }),
      );
    });

    it('does not record when the response fails', () => {
      run(admin, 404);

      expect(recordAudit).not.toHaveBeenCalled();
    });

    it('does not record the owner', () => {
      run(makeUser('owner-1', [PlannerServiceRoles.Admin]));

      expect(recordAudit).not.toHaveBeenCalled();
    });

    it('does not record other users', () => {
      run(makeUser('user-2', [PlannerServiceRoles.User]));

      expect(recordAudit).not.toHaveBeenCalled();
    });
  });
});
