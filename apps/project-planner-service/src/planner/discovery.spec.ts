import {
  assessConfidence,
  computeConfidence,
  DISCOVERY_FACTORS,
  DISCOVERY_THRESHOLD,
  normalizeFactors,
  ruleAssess,
  ruleDiscoveryReply,
  userEvidence,
} from './discovery';
import { ConfidenceFactor, ConversationMessage, SolutionState } from './types';

const factor = (id: string, score: number): ConfidenceFactor => ({ id, label: id, score });

const richText =
  'Our goal is to reduce the backlog of grant applications. Applicants submit a form with documents, ' +
  'staff review and approve each one, applicants get an email and can track status, and privacy legislation applies.';

const makeState = (overrides: Partial<SolutionState> = {}): SolutionState => ({
  problemStatement: richText,
  concepts: [],
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [],
  specialists: [],
  nextSteps: [],
  ...overrides,
});

describe('DISCOVERY_FACTORS', () => {
  it('defines six factors', () => {
    expect(DISCOVERY_FACTORS).toHaveLength(6);
  });

  it('uses a threshold of 50 percent', () => {
    expect(DISCOVERY_THRESHOLD).toBe(50);
  });
});

describe('computeConfidence', () => {
  it('returns zero when there are no factors', () => {
    expect(computeConfidence([])).toBe(0);
  });

  it('returns the rounded average of factor scores', () => {
    expect(computeConfidence([factor('problem', 50), factor('users', 25)])).toBe(38);
  });

  it('clamps scores above 100', () => {
    expect(computeConfidence([factor('problem', 250)])).toBe(100);
  });

  it('clamps negative scores to zero', () => {
    expect(computeConfidence([factor('problem', -40)])).toBe(0);
  });

  it('treats non-finite averages as zero', () => {
    expect(computeConfidence([factor('problem', NaN)])).toBe(0);
  });
});

describe('ruleAssess', () => {
  it('returns one factor per discovery factor', () => {
    expect(ruleAssess(richText).map((f) => f.id)).toEqual(DISCOVERY_FACTORS.map((f) => f.id));
  });

  it('scores every factor at zero for empty text', () => {
    expect(ruleAssess('').map((f) => f.score)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('notes that a factor is not described when no keywords match', () => {
    expect(ruleAssess('').every((f) => f.note === 'Not described yet.')).toBe(true);
  });

  it('leaves the note undefined when a factor has keyword matches', () => {
    const users = ruleAssess('Staff manage it').find((f) => f.id === 'users');

    expect(users?.note).toBeUndefined();
  });

  it('adds a length bonus to the problem factor for longer text', () => {
    const problem = ruleAssess('goal '.repeat(40)).find((f) => f.id === 'problem');

    expect(problem?.score).toBe(80);
  });

  it('scores a factor at 40 when one of its two keyword groups matches', () => {
    const communication = ruleAssess('We send an email').find((f) => f.id === 'communication');

    expect(communication?.score).toBe(40);
  });

  it('scores a factor at 80 when both keyword groups match', () => {
    const communication = ruleAssess('We send an email and a dashboard').find((f) => f.id === 'communication');

    expect(communication?.score).toBe(80);
  });

  it('reaches the discovery threshold for a detailed description', () => {
    expect(computeConfidence(ruleAssess(richText))).toBeGreaterThanOrEqual(DISCOVERY_THRESHOLD);
  });
});

describe('normalizeFactors', () => {
  it('uses the reported score for a factor the model assessed', () => {
    const result = normalizeFactors([{ id: 'users', score: 90, note: 'Roles are clear' }], '');

    expect(result.find((f) => f.id === 'users')).toMatchObject({ score: 90, note: 'Roles are clear' });
  });

  it('keeps the factor label from the rule assessment', () => {
    const result = normalizeFactors([{ id: 'users', score: 90 }], '');

    expect(result.find((f) => f.id === 'users')?.label).toBe('Users and roles');
  });

  it('clears the note when the model reports an empty note', () => {
    const result = normalizeFactors([{ id: 'users', score: 90, note: '' }], '');

    expect(result.find((f) => f.id === 'users')?.note).toBeUndefined();
  });

  it('clamps reported scores to the 0-100 range', () => {
    const result = normalizeFactors([{ id: 'users', score: 400 }], '');

    expect(result.find((f) => f.id === 'users')?.score).toBe(100);
  });

  it('falls back to the rule score for factors the model skipped', () => {
    const result = normalizeFactors([{ id: 'users', score: 90 }], 'We send an email');

    expect(result.find((f) => f.id === 'communication')?.score).toBe(40);
  });

  it('ignores reported factors that are not discovery factors', () => {
    const result = normalizeFactors([{ id: 'budget', score: 90 }], '');

    expect(result).toHaveLength(DISCOVERY_FACTORS.length);
  });
});

describe('userEvidence', () => {
  const messages: ConversationMessage[] = [
    { role: 'user', content: 'Officers approve within 10 days.', at: '2026-03-01T10:00:00.000Z' },
    { role: 'assistant', content: 'Who approves above the limit?', at: '2026-03-01T10:00:01.000Z' },
    { role: 'user', content: 'The director.', at: '2026-03-01T10:01:00.000Z' },
  ];

  it('joins the problem and the user messages with newlines', () => {
    expect(userEvidence('Grant intake', messages)).toBe('Grant intake\nOfficers approve within 10 days.\nThe director.');
  });

  it('excludes assistant messages', () => {
    expect(userEvidence('Grant intake', messages)).not.toContain('Who approves');
  });

  it('returns only the problem when there are no messages', () => {
    expect(userEvidence('Grant intake', [])).toBe('Grant intake');
  });
});

describe('assessConfidence', () => {
  it('uses the discovery factors when present', () => {
    const factors = [factor('problem', 80), factor('users', 60)];
    const state = makeState({
      discovery: {
        messages: [],
        confidence: 70,
        threshold: 50,
        factors,
        ready: true,
        mode: 'ai',
        updatedOn: '2026-03-01T10:00:00.000Z',
      },
    });

    expect(assessConfidence(state)).toEqual({ score: 70, threshold: DISCOVERY_THRESHOLD, factors });
  });

  it('scores the problem statement with rules when there is no discovery', () => {
    const result = assessConfidence(makeState());

    expect(result.factors).toEqual(ruleAssess(richText));
  });

  it('includes user conversation messages in the rule evidence', () => {
    const state = makeState({
      problemStatement: 'Grant intake',
      conversation: [{ role: 'user', content: 'We send an email', at: '2026-03-01T10:00:00.000Z' }],
    });

    const communication = assessConfidence(state).factors.find((f) => f.id === 'communication');

    expect(communication?.score).toBe(40);
  });

  it('scores an empty problem without a conversation at zero', () => {
    expect(assessConfidence(makeState({ problemStatement: '' })).score).toBe(0);
  });

  it('reports the discovery threshold', () => {
    expect(assessConfidence(makeState()).threshold).toBe(DISCOVERY_THRESHOLD);
  });
});

describe('ruleDiscoveryReply', () => {
  it('announces the proposed solution when ready', () => {
    const reply = ruleDiscoveryReply([], 62, true);

    expect(reply).toContain('I now have enough to propose a solution (confidence 62%)');
  });

  it('states the current and required confidence when not ready', () => {
    const reply = ruleDiscoveryReply([factor('users', 10)], 20, false);

    expect(reply).toContain("I'm 20% confident so far (I need 50% to propose a solution)");
  });

  it('asks the question for the weakest factor first', () => {
    const reply = ruleDiscoveryReply([factor('problem', 30), factor('users', 5)], 18, false);

    expect(reply).toContain(`1. ${DISCOVERY_FACTORS.find((f) => f.id === 'users')?.question}`);
  });

  it('omits questions for factors at or above the threshold', () => {
    const reply = ruleDiscoveryReply([factor('problem', 50), factor('users', 5)], 28, false);

    expect(reply).not.toContain(DISCOVERY_FACTORS.find((f) => f.id === 'problem')?.question);
  });

  it('asks at most four questions', () => {
    const factors = DISCOVERY_FACTORS.map((f) => factor(f.id, 0));

    const reply = ruleDiscoveryReply(factors, 0, false);

    expect(reply).not.toContain('5. ');
  });

  it('skips factors that are not discovery factors', () => {
    const reply = ruleDiscoveryReply([factor('budget', 0)], 0, false);

    expect(reply.endsWith('please tell me:\n')).toBe(true);
  });
});
