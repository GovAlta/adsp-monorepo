import axios from 'axios';
import { createLogger, transports } from 'winston';
import { adspId } from '../utils';
import {
  AuditAction,
  AuditCategories,
  AuditSeverities,
  BuiltInRetentionClasses,
  auditDefinitions,
  createAuditService,
} from './index';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('createAuditService', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const directory = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(async (id) => new URL(`https://audit.example.test/audit/v1${id.resource}`)),
  };
  const tokenProvider = { getAccessToken: jest.fn(async () => 'event-service-token') };
  const action: AuditAction = {
    name: 'user.deleted',
    version: 1,
    category: 'security',
    severity: 'critical',
    retentionClass: 'security',
  };

  it('lets a Core service record into the namespace of the service it bridges', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { accepted: 1, duplicates: 0, rejected: [] } });
    const auditService = createAuditService({
      isCore: true,
      logger,
      directory,
      tokenProvider,
      serviceId: adspId`urn:ads:platform:access-service`,
    });

    await auditService.record(action, { tenantId, actor: { id: 'tenant-admin', type: 'user' } });

    expect(axiosMock.post).toHaveBeenCalledWith(
      'https://audit.example.test/audit/v1/access-service/events',
      expect.anything(),
      expect.objectContaining({ params: { tenantId: tenantId.toString() } }),
    );
  });
});

describe('audit classification constants', () => {
  it('preserves the public category values', () => {
    expect(AuditCategories).toEqual({
      Administrative: 'administrative',
      Runtime: 'runtime',
      Security: 'security',
      DataAccess: 'data-access',
      Diagnostic: 'diagnostic',
    });
  });

  it('preserves the public severity values', () => {
    expect(AuditSeverities).toEqual({ Info: 'info', Warning: 'warning', Critical: 'critical' });
  });

  it('provides names for built-in retention classes without defining their periods', () => {
    expect(BuiltInRetentionClasses).toEqual({
      Standard: 'standard',
      Security: 'security',
      Compliance: 'compliance',
    });
  });
});

describe('auditDefinitions', () => {
  const action: AuditAction = {
    name: 'case.update',
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'case-history',
  };

  it('uses action names rather than constant names as keys', () => {
    const { name, ...definition } = action;

    expect(auditDefinitions({ UPDATE_CASE: action })).toEqual({ [name]: definition });
  });

  it('rejects duplicate action names at startup', () => {
    expect(() => auditDefinitions({ UPDATE_CASE: action, UPDATE_AGAIN: action })).toThrow('Duplicate');
  });

  it('preserves nested metadata schemas', () => {
    const metadataSchema = { type: 'object', properties: { caseId: { type: 'string' } } };

    expect(auditDefinitions({ UPDATE_CASE: { ...action, metadataSchema } })['case.update'].metadataSchema).toEqual(
      metadataSchema,
    );
  });

  it('accepts no metadata schema', () => {
    expect(auditDefinitions({ UPDATE_CASE: action })['case.update'].metadataSchema).toBeUndefined();
  });

  it('supports deregistering all actions', () => {
    expect(auditDefinitions({})).toEqual({});
  });

  it('accepts an array of actions', () => {
    const { name, ...definition } = action;

    expect(auditDefinitions([action])).toEqual({ [name]: definition });
    expect(() => auditDefinitions([action, action])).toThrow('Duplicate');
  });

  it('accepts shared constants without changing the catalog payload', () => {
    const definition: AuditAction = {
      ...action,
      category: AuditCategories.Administrative,
      severity: AuditSeverities.Info,
      retentionClass: BuiltInRetentionClasses.Compliance,
    };

    expect(auditDefinitions({ UPDATE_CASE: definition })['case.update']).toMatchObject({
      category: 'administrative',
      severity: 'info',
      retentionClass: 'compliance',
    });
  });

  it('continues to accept custom retention class names', () => {
    expect(auditDefinitions({ UPDATE_CASE: action })['case.update'].retentionClass).toBe('case-history');
  });

  it.each(['', 'case update', '__proto__', undefined, null])('rejects invalid action name %s', (name) => {
    expect(() => auditDefinitions({ UPDATE_CASE: { ...action, name } })).toThrow('Invalid');
  });
});
