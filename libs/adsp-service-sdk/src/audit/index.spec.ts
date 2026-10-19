import { AuditAction, auditDefinitions } from './index';

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

  it.each(['', 'case update', '__proto__', undefined, null])('rejects invalid action name %s', (name) => {
    expect(() => auditDefinitions({ UPDATE_CASE: { ...action, name } })).toThrow('Invalid');
  });
});
