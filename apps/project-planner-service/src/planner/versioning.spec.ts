import { changedSections, classifyBump, nextVersion, sectionHashes } from './versioning';
import { ComponentReview, SolutionState, SpecialistNote } from './types';

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

const solution = (state: SolutionState, name = '') => ({ name, state });

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

describe('versioning', () => {
  describe('sectionHashes', () => {
    it('records no hashes for an empty solution', () => {
      expect(sectionHashes(solution(emptyState))).toEqual({});
    });

    it('records a hash for a filled-in plan section', () => {
      const hashes = sectionHashes(solution({ ...emptyState, problemStatement: 'Applicants submit permits.' }));

      expect(Object.keys(hashes)).toEqual(['Problem statement']);
    });

    it('records a hash for the solution title', () => {
      const hashes = sectionHashes(solution(emptyState, 'Permit intake'));

      expect(Object.keys(hashes)).toEqual(['Title']);
    });

    it('hashes only the chosen hypothesis, since the export shows no other', () => {
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
      const withRunnerUp = (title: string) =>
        sectionHashes(solution({ ...emptyState, hypotheses: [hypothesis('Chosen'), hypothesis(title)] })).Hypotheses;

      expect(withRunnerUp('Runner-up')).toBe(withRunnerUp('Another runner-up'));
    });

    it('records a hash for a filled-in blueprint section', () => {
      const hashes = sectionHashes(
        solution({
          ...emptyState,
          blueprint: {
            generatedOn: 'x',
            mode: 'rules',
            overview: {
              title: 'T',
              summary: 'S',
              objectives: [],
              scope: [],
              outOfScope: [],
              stakeholders: [],
              successMeasures: [],
              risks: [],
            },
          } as SolutionState['blueprint'],
        }),
      );

      expect(Object.keys(hashes)).toEqual(['Overview']);
    });

    it('does not hash conversation or discovery', () => {
      const hashes = sectionHashes(
        solution({
          ...emptyState,
          conversation: [{ role: 'user', content: 'Hi', at: 'x' }],
          discovery: {
            messages: [],
            confidence: 0,
            threshold: 50,
            factors: [],
            ready: false,
            mode: 'rules',
            updatedOn: 'x',
          },
        }),
      );

      expect(hashes).toEqual({});
    });

    it('ignores consultedOn so a regenerate with identical advice does not change the hash', () => {
      const withNotes = (consultedOn: string) =>
        sectionHashes(
          solution({
            ...emptyState,
            blueprint: {
              generatedOn: 'x',
              mode: 'rules',
              specialistNotes: [specialistNote({ consultedOn })],
            } as SolutionState['blueprint'],
          }),
        )['Specialist notes'];

      expect(withNotes('2026-01-01T00:00:00.000Z')).toBe(withNotes('2026-02-01T00:00:00.000Z'));
    });

    it('changes the hash when specialist note content actually changes', () => {
      const withSummary = (summary: string) =>
        sectionHashes(
          solution({
            ...emptyState,
            blueprint: {
              generatedOn: 'x',
              mode: 'rules',
              specialistNotes: [specialistNote({ summary })],
            } as SolutionState['blueprint'],
          }),
        )['Specialist notes'];

      expect(withSummary('Fits the case.')).not.toBe(withSummary('Does not fit.'));
    });

    it('trims whitespace before hashing so a stray newline does not change the hash', () => {
      const trimmed = sectionHashes(solution({ ...emptyState, problemStatement: 'Applicants submit permits.' }));
      const padded = sectionHashes(solution({ ...emptyState, problemStatement: 'Applicants submit permits.\n\n' }));

      expect(padded['Problem statement']).toBe(trimmed['Problem statement']);
    });

    it('does not hash notCoveredByAdsp when it is undefined, so a blueprint that predates the feature does not bump', () => {
      const hashes = sectionHashes(
        solution({ ...emptyState, blueprint: { generatedOn: 'x', mode: 'rules' } as SolutionState['blueprint'] }),
      );

      expect(hashes['Not covered by ADSP']).toBeUndefined();
    });

    it('hashes an empty notCoveredByAdsp array so a regenerate with everything covered is still recorded', () => {
      const hashes = sectionHashes(
        solution({
          ...emptyState,
          blueprint: { generatedOn: 'x', mode: 'rules', notCoveredByAdsp: [] } as SolutionState['blueprint'],
        }),
      );

      expect(hashes['Not covered by ADSP']).toBeDefined();
    });

    it('changes the hash when notCoveredByAdsp content changes', () => {
      const withItems = (items: SolutionState['blueprint']['notCoveredByAdsp']) =>
        sectionHashes(
          solution({
            ...emptyState,
            blueprint: { generatedOn: 'x', mode: 'rules', notCoveredByAdsp: items } as SolutionState['blueprint'],
          }),
        )['Not covered by ADSP'];

      expect(withItems([{ requirement: 'Fee', reason: 'x', suggestedApproach: 'y' }])).not.toBe(withItems([]));
    });

    it('records a hash for the components to set up', () => {
      const hashes = sectionHashes(
        solution({
          ...emptyState,
          blueprint: {
            generatedOn: 'x',
            mode: 'rules',
            components: [{ order: 1, service: 'form-service', type: 'Form definition', name: 'Application' }],
          } as SolutionState['blueprint'],
        }),
      );

      expect(Object.keys(hashes)).toEqual(['Components to set up']);
    });

    describe('component review', () => {
      const withReview = (review?: ComponentReview) =>
        sectionHashes(
          solution({
            ...emptyState,
            blueprint: {
              generatedOn: 'x',
              mode: 'rules',
              components: [{ order: 1, service: 'form-service', type: 'Form definition', name: 'Application', review }],
            } as SolutionState['blueprint'],
          }),
        );

      it('does not change the components hash when only the review changes', () => {
        expect(withReview('approved')['Components to set up']).toBe(withReview()['Components to set up']);
      });

      it('records a component review hash once a component is approved or rejected', () => {
        expect(withReview('approved')['Component review']).toBeDefined();
        expect(withReview('approved')['Component review']).not.toBe(withReview('rejected')['Component review']);
      });

      it.each([
        ['missing', undefined],
        ['not reviewed', 'not-reviewed' as const],
      ])('does not hash the component review while every review is %s', (_name, review) => {
        expect(withReview(review)['Component review']).toBeUndefined();
      });
    });
  });

  describe('changedSections', () => {
    it('reports nothing changed when hashes match', () => {
      const hashes = { 'Problem statement': 'abc' };

      expect(changedSections(hashes, hashes)).toEqual([]);
    });

    it('reports a section as changed when its hash differs', () => {
      expect(changedSections({ 'Problem statement': 'abc' }, { 'Problem statement': 'def' })).toEqual([
        'Problem statement',
      ]);
    });

    it('reports a newly-filled section as changed', () => {
      expect(changedSections({}, { 'Problem statement': 'abc' })).toEqual(['Problem statement']);
    });

    it('lists changed sections in plan order, whatever order the stored hashes come back in', () => {
      const previous = { Delivery: 'a', 'Components to set up': 'b', 'Service mapping': 'c' };
      const current = { Delivery: 'x', 'Components to set up': 'y', 'Service mapping': 'z' };

      expect(changedSections(previous, current)).toEqual(['Service mapping', 'Components to set up', 'Delivery']);
    });

    it('ignores a section no longer in the plan, so an upgrade does not report it as changed', () => {
      expect(changedSections({ 'Old section': 'a', Delivery: 'b' }, { Delivery: 'c' })).toEqual(['Delivery']);
    });
  });

  describe('classifyBump', () => {
    it('is none when nothing changed', () => {
      expect(classifyBump([])).toBe('none');
    });

    it('is minor when only plan sections changed', () => {
      expect(classifyBump(['Problem statement', 'Next steps'])).toBe('minor');
    });

    it('is minor when the title changed', () => {
      expect(classifyBump(['Title'])).toBe('minor');
    });

    it('is major when any blueprint section changed', () => {
      expect(classifyBump(['Problem statement', 'Service mapping'])).toBe('major');
    });

    it('is major when the components to set up changed', () => {
      expect(classifyBump(['Components to set up'])).toBe('major');
    });

    it('is minor when only the component review changed', () => {
      expect(classifyBump(['Component review'])).toBe('minor');
    });
  });

  describe('nextVersion', () => {
    it('bumps the minor number', () => {
      expect(nextVersion('1.0', 'minor')).toBe('1.1');
    });

    it('bumps the major number and resets minor to 0', () => {
      expect(nextVersion('1.3', 'major')).toBe('2.0');
    });
  });
});
