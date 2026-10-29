import { changedSections, contentHash, VersionContent, versionContent } from './versioning';
import { ComponentReview, Solution, SolutionState, SpecialistChat, SpecialistNote } from './types';

const emptyState: SolutionState = {
  problemStatement: '',
  concepts: [],
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [],
  specialists: [],
  nextSteps: [],
};

const content = (overrides: Partial<VersionContent> = {}): VersionContent => ({
  name: 'Permit intake',
  scenario: 'new',
  status: 'draft',
  state: emptyState,
  specialistChats: [],
  ...overrides,
});

const withState = (state: Partial<SolutionState>) => content({ state: { ...emptyState, ...state } });

const withBlueprint = (blueprint: Partial<SolutionState['blueprint']>) =>
  withState({ blueprint: { generatedOn: 'x', mode: 'rules', ...blueprint } as SolutionState['blueprint'] });

const specialistNote = (overrides: Partial<SpecialistNote> = {}): SpecialistNote => ({
  service: 'form-service',
  displayName: 'Form',
  fit: 'recommended',
  source: 'rules',
  summary: 'Fits the case.',
  supports: [],
  constraints: [],
  questions: [],
  risks: [],
  chatHighlights: [],
  consultedOn: 'x',
  ...overrides,
});

const chat = (overrides: Partial<SpecialistChat> = {}): SpecialistChat => ({
  id: 'chat-1',
  tenantId: undefined,
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

const solution = {
  name: 'Permit intake',
  description: 'Permits',
  scenario: 'new',
  status: 'draft',
  state: emptyState,
} as Solution;

describe('versioning', () => {
  describe('versionContent', () => {
    it('snapshots the solution details and state', () => {
      expect(versionContent(solution, [])).toEqual({
        name: 'Permit intake',
        description: 'Permits',
        scenario: 'new',
        status: 'draft',
        state: emptyState,
        specialistChats: [],
      });
    });

    it('copies linked chats without owner ids, with ISO timestamps, oldest first', () => {
      const later = chat({ id: 'chat-2', createdOn: new Date('2026-03-02T00:00:00.000Z') });

      const { specialistChats } = versionContent(solution, [later, chat()]);

      expect(specialistChats.map((c) => c.id)).toEqual(['chat-1', 'chat-2']);
      expect(specialistChats[0]).toEqual({
        id: 'chat-1',
        service: 'form-service',
        title: 'Intake form',
        createdByName: 'Owner',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:05:00.000Z',
        messages: chat().messages,
      });
    });
  });

  describe('contentHash', () => {
    it('ignores key order, since jsonb does not keep it', () => {
      const reordered = { specialistChats: [], state: emptyState, status: 'draft', scenario: 'new', name: 'Permit intake' };

      expect(contentHash(reordered as VersionContent)).toBe(contentHash(content()));
    });

    it('treats a null description the same as a missing one', () => {
      expect(contentHash(content({ description: null }))).toBe(contentHash(content()));
    });

    it('changes when only a chat timestamp changes', () => {
      const at = (updatedOn: string) =>
        contentHash(versionContent(solution, [chat({ updatedOn: new Date(updatedOn) })]));

      expect(at('2026-03-01T10:05:00.000Z')).not.toBe(at('2026-03-01T10:06:00.000Z'));
    });

    it('changes when only whitespace changes', () => {
      expect(contentHash(withState({ problemStatement: 'Permits.\n' }))).not.toBe(
        contentHash(withState({ problemStatement: 'Permits.' })),
      );
    });
  });

  describe('changedSections', () => {
    it('reports nothing when the content is identical', () => {
      expect(changedSections(content(), content())).toEqual([]);
    });

    it.each([
      ['Title', content({ name: 'Renamed' })],
      ['Description', content({ description: 'New description' })],
      ['Scenario', content({ scenario: 'prototype' })],
      ['Status', content({ status: 'analyzed' })],
      ['Problem statement', withState({ problemStatement: 'Applicants submit permits.' })],
      ['Analysis', withState({ analysis: { mode: 'rules', analyzedOn: 'x' } as SolutionState['analysis'] })],
      ['Analysis', withState({ confidence: { score: 40, threshold: 70, factors: [] } })],
      ['Discovery conversation', withState({ discovery: { messages: [], confidence: 0 } as SolutionState['discovery'] })],
      ['Planner conversation', withState({ conversation: [{ role: 'user', content: 'Hi', at: 'x' }] })],
      ['Specialist consultations', content({ specialistChats: versionContent(solution, [chat()]).specialistChats })],
      ['Overview', withBlueprint({ overview: { title: 'T', summary: 'S' } as SolutionState['blueprint']['overview'] })],
    ])('reports %s when it changes', (section, current) => {
      expect(changedSections(content(), current)).toEqual([section]);
    });

    it('reports Other details when only something outside the named sections changes', () => {
      expect(changedSections(withState({ problemStatement: 'Permits.' }), withState({ problemStatement: 'Permits.\n' }))).toEqual([
        'Other details',
      ]);
    });

    it('reports a section whose stored copy came back from jsonb with reordered keys and nulls as unchanged', () => {
      const stored = JSON.parse(JSON.stringify({ ...content(), description: null }));

      expect(changedSections(stored, content())).toEqual([]);
    });

    it('lists changed sections in plan order', () => {
      const previous = withBlueprint({ delivery: { phases: [] }, serviceMapping: [] } as Partial<SolutionState['blueprint']>);
      const current = { ...withBlueprint({ delivery: { phases: [{ name: 'P', items: [] }] }, serviceMapping: [{ service: 's' }] } as Partial<SolutionState['blueprint']>), name: 'Renamed' };

      expect(changedSections(previous, current)).toEqual(['Title', 'Service mapping', 'Delivery']);
    });

    it('reports only the chosen hypothesis, since the export shows no other', () => {
      const hypothesis = (title: string): SolutionState['hypotheses'][number] => ({
        id: title,
        title,
        patternId: 'p',
        confidence: 'high',
        rationale: '',
        recommendations: [],
        assumptions: [],
        unknowns: [],
      });
      const withRunnerUp = (title: string) => withState({ hypotheses: [hypothesis('Chosen'), hypothesis(title)] });

      expect(changedSections(withRunnerUp('Runner-up'), withRunnerUp('Another'))).toEqual(['Other details']);
    });

    it('does not report specialist notes when only consultedOn changes', () => {
      const withNotes = (consultedOn: string) => withBlueprint({ specialistNotes: [specialistNote({ consultedOn })] });

      expect(changedSections(withNotes('2026-01-01'), withNotes('2026-02-01'))).toEqual(['Other details']);
    });

    it('reports Not covered by ADSP when a regenerate finds everything covered', () => {
      expect(changedSections(withBlueprint({}), withBlueprint({ notCoveredByAdsp: [] }))).toEqual(['Not covered by ADSP']);
    });

    describe('component review', () => {
      const withReview = (review?: ComponentReview) =>
        withBlueprint({
          components: [{ order: 1, service: 'form-service', type: 'Form definition', name: 'Application', review }],
        } as Partial<SolutionState['blueprint']>);

      it('reports Component review, not the components, when only a review changes', () => {
        expect(changedSections(withReview(), withReview('approved'))).toEqual(['Component review']);
      });

      it('reports Components to set up when a component itself changes', () => {
        expect(changedSections(withBlueprint({}), withReview())).toEqual(['Components to set up']);
      });
    });
  });
});
