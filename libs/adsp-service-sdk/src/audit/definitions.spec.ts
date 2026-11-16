import { AuditCategories, resolveRetentionClass } from './definitions';

describe('resolveRetentionClass', () => {
  it.each([
    [AuditCategories.Administrative, 'compliance'],
    [AuditCategories.DataAccess, 'compliance'],
    [AuditCategories.Security, 'security'],
    [AuditCategories.Runtime, 'standard'],
    [AuditCategories.Diagnostic, 'standard'],
  ])('derives the class from the %s category', (category, expected) => {
    expect(resolveRetentionClass({ category })).toBe(expected);
  });

  it('uses the class set on the action over the category default', () => {
    expect(resolveRetentionClass({ category: AuditCategories.Administrative, retentionClass: 'custom-class' })).toBe(
      'custom-class',
    );
  });
});
