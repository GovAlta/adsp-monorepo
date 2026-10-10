import { buildHypotheses, buildNextSteps, consultSpecialist, extractConcepts, matchPatterns } from './analysis';
import { BUILT_IN_PATTERNS } from './patterns';
import { SolutionState } from './types';

const emptyState = (): SolutionState => ({
  problemStatement: '',
  concepts: [],
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [],
  specialists: [],
  artifacts: [],
  nextSteps: [],
});

describe('patterns', () => {
  it('includes the 19 appendix application types', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(19);
    expect(new Set(BUILT_IN_PATTERNS.map((p) => p.id)).size).toBe(19);
  });
});

describe('matchPatterns', () => {
  const text =
    'Staff review each application, assign cases, add notes and attachments, and escalate. Status moves through stages with audit history.';

  it('ranks case management first with high confidence', () => {
    const [top] = matchPatterns(text, BUILT_IN_PATTERNS);
    expect(top.patternId).toBe('case-management');
    expect(top.level).toBe('high');
    expect(top.matchedLanguage).toEqual(expect.arrayContaining(['review', 'application']));
  });

  it('does not match on weak signals alone', () => {
    const matches = matchPatterns('Users submit a form and get an email', [BUILT_IN_PATTERNS[0]]);
    expect(matches).toHaveLength(0);
  });

  it('returns nothing for empty text', () => {
    expect(matchPatterns('', BUILT_IN_PATTERNS)).toEqual([]);
  });

  it('reports low confidence for sparse matches', () => {
    const [match] = matchPatterns('We handle a complaint', BUILT_IN_PATTERNS);
    expect(match.patternId).toBe('complaint-intake');
    expect(match.level).toBe('low');
  });
});

describe('extractConcepts', () => {
  it('extracts actors and documents and skips existing', () => {
    const existing = [{ id: '1', type: 'actor' as const, name: 'staff', source: 'user' as const }];
    const result = extractConcepts('Staff and applicants complete a form', existing);
    expect(result.map((c) => `${c.type}:${c.name}`)).toEqual(['actor:applicants', 'document:form']);
    expect(result.every((c) => c.source === 'extracted')).toBe(true);
  });
});

describe('buildHypotheses', () => {
  it('orders recommendations by implementation order and explains', () => {
    const matches = matchPatterns('case review approval assign escalate audit notes', BUILT_IN_PATTERNS);
    const [hypothesis] = buildHypotheses(matches, BUILT_IN_PATTERNS);
    expect(hypothesis.recommendations.length).toBeGreaterThan(0);
    const orders = hypothesis.recommendations.map((r) => r.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(hypothesis.rationale).toContain('Case Management');
  });

  it('limits hypotheses', () => {
    const matches = matchPatterns('case review form permit licence complaint register', BUILT_IN_PATTERNS);
    expect(buildHypotheses(matches, BUILT_IN_PATTERNS, 2).length).toBeLessThanOrEqual(2);
  });
});

describe('buildNextSteps and consultSpecialist', () => {
  it('suggests analysis when nothing is known', () => {
    expect(buildNextSteps(emptyState())[0].title).toMatch(/Analyze/);
  });

  it('suggests consulting unstarted services', () => {
    const state = emptyState();
    state.hypotheses = buildHypotheses(
      matchPatterns('case review approval assign escalate audit notes', BUILT_IN_PATTERNS),
      BUILT_IN_PATTERNS,
    );
    const steps = buildNextSteps(state);
    expect(steps.some((s) => s.service)).toBe(true);
  });

  it('consults a specialist with dependency status', () => {
    const state = emptyState();
    state.hypotheses = buildHypotheses(
      matchPatterns('case review approval assign escalate audit notes', BUILT_IN_PATTERNS),
      BUILT_IN_PATTERNS,
    );
    const result = consultSpecialist(state, 'form');
    expect(result.service).toBe('form-service');
    expect(result.fit).toBe('recommended');
    expect(result.dependencies).toEqual([{ service: 'file-service', satisfied: true }]);
  });

  it('returns undefined for unknown service', () => {
    expect(consultSpecialist(emptyState(), 'nope')).toBeUndefined();
  });
});
