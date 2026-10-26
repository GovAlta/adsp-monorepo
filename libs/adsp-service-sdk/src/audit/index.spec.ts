import { AuditAction, AuditCategories, AuditSeverities, BuiltInRetentionClasses, auditDefinitions } from './index';

describe('audit classification constants', () => {
  it('preserves the public category values', () => {
    expect(AuditCategories).toEqual({
      Administrative: 'administrative',
      Runtime: 'runtime',
      Security: 'security',
      DataAccess: 'data-access',
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
