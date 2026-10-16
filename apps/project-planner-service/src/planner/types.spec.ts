import { CONCEPT_TYPES } from './types';

describe('planner types', () => {
  it('lists the supported business concept types', () => {
    expect(CONCEPT_TYPES).toEqual([
      'actor',
      'goal',
      'activity',
      'decision',
      'evidence',
      'business-rule',
      'constraint',
      'evaluation-criterion',
      'workflow',
      'outcome',
      'document',
      'event',
      'external-system',
      'assumption',
      'unknown',
    ]);
  });

  it('contains no duplicate concept types', () => {
    expect(new Set(CONCEPT_TYPES).size).toBe(CONCEPT_TYPES.length);
  });

  it.each(['actor', 'assumption', 'unknown'])('includes the %s concept type', (type) => {
    expect(CONCEPT_TYPES).toContain(type);
  });
});
