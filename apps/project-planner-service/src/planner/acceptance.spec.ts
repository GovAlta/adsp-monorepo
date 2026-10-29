import { acceptanceReferences, checkedAcceptanceCriteria, ruleAcceptanceCriteria } from './acceptance';
import { DecisionRecord, OpenQuestion, SolutionBlueprint } from './types';

const blueprint = (overrides: Partial<SolutionBlueprint> = {}): SolutionBlueprint => ({
  generatedOn: '2026-10-28T00:00:00.000Z',
  mode: 'rules',
  overview: {
    title: 'Grants',
    summary: 'Grant intake and review.',
    objectives: [],
    scope: ['Online applications'],
    outOfScope: [],
    stakeholders: [],
    successMeasures: [],
    risks: [],
    roles: [],
  },
  architecture: { summary: '', layers: [], integrations: [], security: [], diagram: '' },
  serviceMapping: [],
  specialistNotes: [],
  components: [],
  workflows: [
    { name: 'Apply', actors: ['Applicant'], steps: ['Fill in the form.', 'Submit it'] },
    { name: 'Review', actors: ['Grant officer', 'Director'], steps: ['Open the application'] },
  ],
  dataGovernance: {
    dataEntities: ['Application'],
    accessControl: ['Only officers see applications'],
    retention: ['Keep applications 7 years'],
    privacy: [],
    audit: ['Log every decision'],
    compliance: [],
  },
  delivery: { phases: [], nonFunctional: ['Pages load in 2 seconds'], openQuestions: ['Who funds it?'] },
  ...overrides,
});

const decision = (id: string, title: string, text: string): DecisionRecord => ({
  id,
  title,
  decision: text,
  reason: 'Agreed',
  decidedOn: '2026-10-01',
});

const decisions = [decision('d-1', 'Draft saving', 'Applicants can save a draft and return later')];

const questions: OpenQuestion[] = [
  { id: 'q-1', question: 'Is there a limit?', raisedBy: 'planner', status: 'answered', answer: '$50,000' },
  { id: 'q-2', question: 'Who approves?', raisedBy: 'planner', status: 'open' },
];

describe('ruleAcceptanceCriteria', () => {
  it('writes one criterion per workflow restating its numbered steps', () => {
    const [apply] = ruleAcceptanceCriteria(blueprint(), []);
    expect(apply).toEqual({
      id: 'AC-1',
      group: 'Apply',
      actor: 'Applicant',
      given: 'the "Apply" workflow',
      when: 'Applicant completes it',
      then: '(1) Fill in the form; (2) Submit it',
      source: 'Workflow "Apply"',
    });
  });

  it('names every actor of a workflow', () => {
    const review = ruleAcceptanceCriteria(blueprint(), [])[1];
    expect(review.actor).toBe('Grant officer, Director');
    expect(review.when).toBe('Grant officer and Director complete it');
  });

  it('says the user completes a workflow that names no actor', () => {
    const [criterion] = ruleAcceptanceCriteria(
      blueprint({ workflows: [{ name: 'Pay', actors: [], steps: ['Pay the fee'] }] }),
      [],
    );
    expect(criterion.actor).toBeUndefined();
    expect(criterion.when).toBe('the user completes it');
  });

  it('skips a workflow with no steps', () => {
    const criteria = ruleAcceptanceCriteria(blueprint({ workflows: [{ name: 'Pay', actors: [], steps: [] }] }), []);
    expect(criteria).toEqual([]);
  });

  it('writes one rule per recorded decision with no given or when', () => {
    const criteria = ruleAcceptanceCriteria(blueprint(), decisions);
    expect(criteria[2]).toEqual({
      id: 'AC-3',
      group: 'Rules',
      then: 'Applicants can save a draft and return later',
      source: 'Decision "Draft saving"',
    });
  });

  it('returns nothing when the plan has no workflows or decisions', () => {
    expect(ruleAcceptanceCriteria(blueprint({ workflows: [] }), [])).toEqual([]);
  });
});

describe('acceptanceReferences', () => {
  it('lists every plan item a criterion may restate, keyed for the model', () => {
    const references = acceptanceReferences(blueprint(), { decisions, questions });
    expect(references.map((r) => [r.key, r.label])).toEqual([
      ['workflow:1', 'Workflow "Apply"'],
      ['workflow:2', 'Workflow "Review"'],
      ['decision:d-1', 'Decision "Draft saving"'],
      ['question:q-1', 'Answered question "Is there a limit?"'],
      ['scope:1', 'Scope "Online applications"'],
      ['access:1', 'Access control "Only officers see applications"'],
      ['retention:1', 'Retention "Keep applications 7 years"'],
      ['audit:1', 'Audit "Log every decision"'],
      ['nfr:1', 'Non-functional requirement "Pages load in 2 seconds"'],
    ]);
  });

  it('gives the model the full text of each item', () => {
    const references = acceptanceReferences(blueprint(), { decisions, questions });
    expect(references.find((r) => r.key === 'workflow:1').text).toBe(
      'Actors: Applicant. Steps: (1) Fill in the form; (2) Submit it',
    );
    expect(references.find((r) => r.key === 'question:q-1').text).toBe('Is there a limit? Answer: $50,000');
  });
});

describe('checkedAcceptanceCriteria', () => {
  const references = acceptanceReferences(blueprint(), { decisions, questions });
  const draft = {
    group: 'Apply',
    actor: 'Applicant',
    given: 'a saved draft',
    when: 'they return',
    then: 'the draft opens',
  };

  it('replaces the source key with its plan reference', () => {
    const [criterion] = checkedAcceptanceCriteria([{ ...draft, source: 'decision:d-1' }], blueprint(), references);
    expect(criterion).toEqual({ id: 'AC-1', ...draft, source: 'Decision "Draft saving"' });
  });

  it('drops criteria whose source is not in the plan', () => {
    const criteria = checkedAcceptanceCriteria(
      [
        { ...draft, source: 'decision:d-9' },
        { ...draft, source: 'question:q-2' },
        { ...draft, source: 'workflow:1' },
      ],
      blueprint(),
      references,
    );
    expect(criteria.map((c) => c.source)).toEqual(['Workflow "Apply"']);
  });

  it('drops criteria with nothing to check', () => {
    expect(checkedAcceptanceCriteria([{ ...draft, then: ' ', source: 'workflow:1' }], blueprint(), references)).toEqual(
      [],
    );
  });

  it('numbers criteria in workflow order, then rules', () => {
    const criteria = checkedAcceptanceCriteria(
      [
        { group: 'Rules', then: 'every decision is logged', source: 'audit:1' },
        { ...draft, group: 'Review', source: 'workflow:2' },
        { ...draft, source: 'workflow:1' },
      ],
      blueprint(),
      references,
    );
    expect(criteria.map((c) => [c.id, c.group])).toEqual([
      ['AC-1', 'Apply'],
      ['AC-2', 'Review'],
      ['AC-3', 'Rules'],
    ]);
  });

  it('files criteria under an unknown group as rules', () => {
    const [criterion] = checkedAcceptanceCriteria(
      [{ ...draft, group: 'Payments', source: 'nfr:1' }],
      blueprint(),
      references,
    );
    expect(criterion.group).toBe('Rules');
  });
});
