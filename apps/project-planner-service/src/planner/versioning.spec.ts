import { changedSections, classifyBump, nextVersion, sectionHashes } from './versioning';
import { SolutionState, SpecialistNote } from './types';

const emptyState: SolutionState = {
  problemStatement: '',
  concepts: [],
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [],
  specialists: [],
  artifacts: [],
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

    it('records a hash for confidence', () => {
      const hashes = sectionHashes(
        solution({ ...emptyState, confidence: { score: 33, threshold: 70, factors: [] } }),
      );

      expect(Object.keys(hashes)).toEqual(['Confidence']);
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
          discovery: { messages: [], confidence: 0, threshold: 50, factors: [], ready: false, mode: 'rules', updatedOn: 'x' },
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
