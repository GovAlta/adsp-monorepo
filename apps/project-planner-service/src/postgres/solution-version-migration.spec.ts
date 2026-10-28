import { contentHash, versionContent } from '../planner/versioning';
import { Solution, SpecialistChat } from '../planner/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const migration = require('../../migrations/20261028000000_add_solution_versions');

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
    concepts: [{ id: 'c1', name: 'Applicant', source: 'user', note: null }],
    decisions: [],
    questions: [],
    patternMatches: [],
    hypotheses: [],
    specialists: [],
    nextSteps: [],
  },
};

const chat = (overrides: Record<string, unknown> = {}) => ({
  id: 'chat-1',
  tenant: solution.tenant,
  service: 'form-service',
  solutionId: 'solution-1',
  title: 'Intake form',
  createdById: 'owner-1',
  createdByName: 'Owner',
  createdOn: new Date('2026-03-01T10:00:00.000Z'),
  updatedOn: new Date('2026-03-01T10:05:00.000Z'),
  messages: [{ role: 'user', content: 'Which form?', at: '2026-03-01T10:00:00.000Z' }],
  ...overrides,
});

describe('add solution versions migration', () => {
  it('hashes a backfilled version exactly as the service does, so it does not show as unsaved', () => {
    const chats = [chat({ id: 'chat-2', createdOn: new Date('2026-03-01T11:00:00.000Z') }), chat()];

    expect(migration.contentHash(migration.versionContent(solution, chats))).toBe(
      contentHash(versionContent(solution as unknown as Solution, chats as unknown as SpecialistChat[])),
    );
  });

  it('backfills Version 1 from the solution and only its own chats', () => {
    const other = chat({ id: 'chat-other', solutionId: 'solution-2' });
    const otherTenant = chat({ id: 'chat-tenant', tenant: 'urn:other' });

    const [row] = migration.versionRows([solution], [chat(), other, otherTenant]);

    expect(row).toEqual({
      tenant: solution.tenant,
      solutionId: 'solution-1',
      number: 1,
      name: 'Version 1',
      createdOn: solution.updatedOn,
      contentHash: contentHash(versionContent(solution as unknown as Solution, [chat()] as unknown as SpecialistChat[])),
      content: migration.versionContent(solution, [chat()]),
    });
    expect(row.content.specialistChats.map((c) => c.id)).toEqual(['chat-1']);
  });
});
