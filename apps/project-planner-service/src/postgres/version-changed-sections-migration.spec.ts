import { changedSections, contentHash, versionContent } from '../planner/versioning';
import { Solution, SpecialistChat } from '../planner/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const migration = require('../../migrations/20261102000000_add_version_changed_sections');

const solution = {
  id: 'solution-1',
  tenant: 'urn:ads:platform:tenant-service:v2:/tenants/test',
  name: 'Permit intake',
  description: null,
  scenario: 'new',
  status: 'analyzed',
  updatedOn: new Date('2026-03-02T00:00:00.000Z'),
  state: {
    problemStatement: 'Applicants submit permits.',
    concepts: [],
    decisions: [],
    questions: [],
    patternMatches: [],
    hypotheses: [],
    specialists: [],
    nextSteps: [],
  },
};

describe('add version changed sections migration', () => {
  it('hashes content identically to the service implementation', () => {
    const content = versionContent(solution as unknown as Solution, []);

    expect(migration.contentHash(content)).toBe(contentHash(content));
  });

  it('ignores analyzedOn when hashing, same as the service implementation', () => {
    const base = versionContent(solution as unknown as Solution, []);
    const withAnalysis = {
      ...base,
      state: { ...base.state, analysis: { mode: 'rules', analyzedOn: '2026-01-01T00:00:00.000Z' } },
    };
    const rerun = {
      ...base,
      state: { ...base.state, analysis: { mode: 'rules', analyzedOn: '2026-01-02T00:00:00.000Z' } },
    };

    expect(migration.contentHash(withAnalysis)).toBe(migration.contentHash(rerun));
  });

  it('diffs sections identically to the service implementation', () => {
    const previous = versionContent(solution as unknown as Solution, []);
    const current = versionContent(
      { ...solution, name: 'Updated name' } as unknown as Solution,
      [] as SpecialistChat[],
    );

    expect(migration.changedSections(previous, current)).toEqual(changedSections(previous, current));
  });
});
