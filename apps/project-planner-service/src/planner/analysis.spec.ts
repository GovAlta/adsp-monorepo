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

describe('matchPatterns edge cases', () => {
  it('returns nothing for undefined text', () => {
    expect(matchPatterns(undefined, BUILT_IN_PATTERNS)).toEqual([]);
  });

  it('reports medium confidence for a score between 4 and 7', () => {
    const pattern = { ...BUILT_IN_PATTERNS[0], domainLanguage: ['case', 'review', 'approval', 'claim'], strongSignals: [] };

    const [match] = matchPatterns('case review approval claim', [pattern]);

    expect(match.level).toBe('medium');
  });

  it('matches terms with plural and verb suffixes', () => {
    const [match] = matchPatterns('Staff are reviewing claims', BUILT_IN_PATTERNS);

    expect(match.matchedLanguage).toEqual(expect.arrayContaining(['review', 'claim']));
  });

  it('matches terms containing regex special characters literally', () => {
    const pattern = { ...BUILT_IN_PATTERNS[0], domainLanguage: ['c++'], strongSignals: [] };

    expect(matchPatterns('We maintain a c++ library', [pattern])[0].matchedLanguage).toEqual(['c++']);
  });

  it('describes the matched domain terms and signals in the explanation', () => {
    const [match] = matchPatterns('We handle a complaint', BUILT_IN_PATTERNS);

    expect(match.explanation).toBe('Matched 1 domain term(s) and 1 strong signal(s); low confidence.');
  });

  it('sorts matches by descending score', () => {
    const scores = matchPatterns('case review form permit licence complaint register', BUILT_IN_PATTERNS).map(
      (m) => m.score,
    );

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe('extractConcepts', () => {
  it('returns no concepts for empty text', () => {
    expect(extractConcepts('')).toEqual([]);
  });

  it('returns no concepts for undefined text', () => {
    expect(extractConcepts(undefined)).toEqual([]);
  });

  it('does not repeat a concept mentioned twice', () => {
    expect(extractConcepts('The form and the form again').filter((c) => c.name === 'form')).toHaveLength(1);
  });

  it.each([
    ['actor', 'Inspectors visit sites', 'inspectors'],
    ['document', 'A certificate is issued', 'certificate'],
    ['event', 'The claim is approved', 'approved'],
    ['external-system', 'Data comes from SAP', 'sap'],
    ['constraint', 'Privacy rules apply', 'privacy'],
    ['workflow', 'The lifecycle has stages', 'lifecycle'],
  ])('extracts %s concepts', (type, text, name) => {
    expect(extractConcepts(text)).toContainEqual(expect.objectContaining({ type, name }));
  });
});

describe('buildHypotheses edge cases', () => {
  const match = {
    patternId: 'missing',
    patternName: 'Missing',
    score: 1,
    level: 'low' as const,
    matchedLanguage: [],
    matchedSignals: [],
    explanation: 'Matched.',
  };

  it('returns no hypotheses when there are no matches', () => {
    expect(buildHypotheses([], BUILT_IN_PATTERNS)).toEqual([]);
  });

  it('builds a hypothesis without recommendations for an unknown pattern', () => {
    const [hypothesis] = buildHypotheses([match], BUILT_IN_PATTERNS);

    expect(hypothesis.recommendations).toEqual([]);
  });

  it('states that no terms matched when the match has no terms', () => {
    const [hypothesis] = buildHypotheses([match], BUILT_IN_PATTERNS);

    expect(hypothesis.rationale).toContain('Matched terms: none.');
  });

  it('orders recommendations for unknown services after known specialists', () => {
    const pattern = {
      ...BUILT_IN_PATTERNS[0],
      id: 'custom',
      serviceMappings: [
        { service: 'payment-service', reason: 'Collect fees.' },
        { service: 'form-service', reason: 'Intake.' },
      ],
    };

    const [hypothesis] = buildHypotheses([{ ...match, patternId: 'custom' }], [pattern]);

    expect(hypothesis.recommendations.map((r) => r.service)).toEqual(['form-service', 'payment-service']);
  });

  it('copies assumptions and unknowns from the pattern', () => {
    const matches = matchPatterns('case review approval assign escalate audit notes', BUILT_IN_PATTERNS);

    const [hypothesis] = buildHypotheses(matches, BUILT_IN_PATTERNS);

    expect(hypothesis.assumptions).toEqual(BUILT_IN_PATTERNS.find((p) => p.id === hypothesis.patternId).assumptions);
  });
});

describe('buildNextSteps edge cases', () => {
  const hypothesisFor = () =>
    buildHypotheses(matchPatterns('case review approval assign escalate audit notes', BUILT_IN_PATTERNS), BUILT_IN_PATTERNS);

  it('prompts to answer open questions', () => {
    const state = emptyState();
    state.questions = [{ id: 'q-1', question: 'Is review required?', raisedBy: 'planner', status: 'open' }];

    expect(buildNextSteps(state)[0].title).toBe('Answer 1 open question(s)');
  });

  it('ignores answered questions', () => {
    const state = emptyState();
    state.questions = [{ id: 'q-1', question: 'Is review required?', raisedBy: 'planner', status: 'answered' }];

    expect(buildNextSteps(state).some((s) => /Answer/.test(s.title))).toBe(false);
  });

  it('does not suggest analysis when open questions exist', () => {
    const state = emptyState();
    state.questions = [{ id: 'q-1', question: 'Is review required?', raisedBy: 'planner', status: 'open' }];

    expect(buildNextSteps(state).some((s) => /Analyze/.test(s.title))).toBe(false);
  });

  it('suggests at most three specialists to consult', () => {
    const state = emptyState();
    state.hypotheses = hypothesisFor();

    expect(buildNextSteps(state).filter((s) => s.service)).toHaveLength(3);
  });

  it('skips specialists that have already been consulted', () => {
    const state = emptyState();
    state.hypotheses = hypothesisFor();
    const first = state.hypotheses[0].recommendations[0].service;
    state.specialists = [{ service: first, status: 'consulted', updatedOn: '2026-01-01' }];

    expect(buildNextSteps(state).map((s) => s.service)).not.toContain(first);
  });

  it('still suggests specialists whose status is not-started', () => {
    const state = emptyState();
    state.hypotheses = hypothesisFor();
    const first = state.hypotheses[0].recommendations[0].service;
    state.specialists = [{ service: first, status: 'not-started', updatedOn: '2026-01-01' }];

    expect(buildNextSteps(state).map((s) => s.service)).toContain(first);
  });

  it('returns no steps when hypotheses exist and every recommendation is in progress', () => {
    const state = emptyState();
    state.hypotheses = hypothesisFor();
    state.specialists = state.hypotheses[0].recommendations.map((r) => ({
      service: r.service,
      status: 'completed' as const,
      updatedOn: '2026-01-01',
    }));

    expect(buildNextSteps(state)).toEqual([]);
  });
});

describe('consultSpecialist edge cases', () => {
  const analyzed = () => {
    const state = emptyState();
    state.hypotheses = buildHypotheses(
      matchPatterns('case review approval assign escalate audit notes', BUILT_IN_PATTERNS),
      BUILT_IN_PATTERNS,
    );
    return state;
  };

  it('reports optional fit when no hypotheses exist', () => {
    expect(consultSpecialist(emptyState(), 'calendar-service').fit).toBe('optional');
  });

  it('uses the specialist purpose as the reason when no recommendation exists', () => {
    expect(consultSpecialist(emptyState(), 'calendar-service').reason).toBe('Calendars and scheduled events.');
  });

  it('reports not-indicated fit for a service no hypothesis recommends', () => {
    expect(consultSpecialist(analyzed(), 'push-service').fit).toBe('not-indicated');
  });

  it('uses the recommendation reason when the service is recommended', () => {
    expect(consultSpecialist(analyzed(), 'comment-service').reason).toBe(
      'Staff notes, discussions, and case history.',
    );
  });

  it('marks a dependency as unsatisfied when it is not recommended', () => {
    expect(consultSpecialist(emptyState(), 'form-service').dependencies).toEqual([
      { service: 'file-service', satisfied: false },
    ]);
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
