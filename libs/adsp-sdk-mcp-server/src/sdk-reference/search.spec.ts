import { searchSdkReference } from './search';

describe('searchSdkReference', () => {
  it('ranks an exact symbol name match first', () => {
    const results = searchSdkReference('initializePlatform');

    expect(results[0].name).toBe('initializePlatform');
  });

  it.each(['AuditCategories', 'AuditCategory', 'AuditSeverities', 'AuditSeverity', 'BuiltInRetentionClasses'])(
    'finds the public audit symbol %s',
    (name) => {
      const results = searchSdkReference(name);

      expect(results[0]).toMatchObject({ name, module: 'audit' });
    },
  );

  it('is case-insensitive on symbol name', () => {
    const results = searchSdkReference('ADSPID');

    expect(results.map((r) => r.name)).toContain('AdspId');
  });

  it('matches on module and summary text, not just symbol name', () => {
    const results = searchSdkReference('send domain events');

    expect(results.map((r) => r.name)).toContain('EventService');
  });

  it('returns an empty array for an empty query', () => {
    expect(searchSdkReference('   ')).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchSdkReference('xyznonexistentterm')).toEqual([]);
  });

  it('respects the limit parameter', () => {
    const results = searchSdkReference('service', 2);

    expect(results.length).toBeLessThanOrEqual(2);
  });
});
