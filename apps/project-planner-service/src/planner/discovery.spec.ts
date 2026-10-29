import {
  allUserEvidence,
  applyAnswerToFactors,
  areSimilarQuestions,
  assessConfidence,
  capFactors,
  computeConfidence,
  dedupeOpenQuestions,
  DISCOVERY_FACTOR_FLOOR,
  DISCOVERY_FACTORS,
  DISCOVERY_THRESHOLD,
  isDiscoveryReady,
  isQuestionCovered,
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

  it('uses a threshold of 75 percent', () => {
    expect(DISCOVERY_THRESHOLD).toBe(75);
  });
});

describe('isDiscoveryReady', () => {
  it('is not ready when the average is below the threshold, even with no weak factors', () => {
    const factors = [factor('problem', 70), factor('users', 70)];

    expect(isDiscoveryReady(factors, 70)).toBe(false);
  });

  it('is not ready when the average clears the threshold but a factor is below the floor', () => {
    const factors = [factor('problem', 100), factor('users', 100), factor('constraints', 0)];

    expect(isDiscoveryReady(factors, computeConfidence(factors))).toBe(false);
  });

  it('is ready when the average clears the threshold and every factor is at least the floor', () => {
    const factors = [factor('problem', 90), factor('users', 80), factor('constraints', DISCOVERY_FACTOR_FLOOR)];

    expect(isDiscoveryReady(factors, computeConfidence(factors))).toBe(true);
  });

  it('is ready when forced, regardless of average or weak factors', () => {
    const factors = [factor('constraints', 0)];

    expect(isDiscoveryReady(factors, 0, true)).toBe(true);
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

  it('recognizes an existing system to migrate from as a constraints and integrations signal', () => {
    const constraints = ruleAssess(
      'There is an Excel asset inventory with asset tags that needs a one-time import.',
    ).find((f) => f.id === 'constraints');

    expect(constraints?.note).toBeUndefined();
  });

  it.each(['The data is Protected B', 'POPA applies'])('scores the constraints factor from "%s"', (text) => {
    expect(ruleAssess(text).find((f) => f.id === 'constraints')?.score).toBe(40);
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

describe('capFactors', () => {
  it('leaves factors unchanged when there are no open questions', () => {
    const factors = [factor('problem', 95), factor('users', 100)];

    expect(capFactors(factors, false)).toEqual(factors);
  });

  it('caps every factor at 90 while questions remain open', () => {
    const factors = [factor('problem', 95), factor('users', 100), factor('process', 40)];

    expect(capFactors(factors, true)).toEqual([factor('problem', 90), factor('users', 90), factor('process', 40)]);
  });
});

describe('applyAnswerToFactors', () => {
  const factors = DISCOVERY_FACTORS.map((f) => ({ id: f.id, label: f.label, score: f.id === 'process' ? 20 : 95 }));

  it('raises only the factor the question and answer are relevant to', () => {
    const text = 'Someone must review and approve each renewal before it moves to the next stage.';

    const result = applyAnswerToFactors(factors, text, text, text);

    expect(result.find((f) => f.id === 'process')?.score).toBe(80);
    result.filter((f) => f.id !== 'process').forEach((f) => expect(f.score).toBe(95));
  });

  it('always raises a relevant factor at least by the bump amount, even with thin keyword overlap', () => {
    const midFactors = DISCOVERY_FACTORS.map((f) => ({
      id: f.id,
      label: f.label,
      score: f.id === 'process' ? 70 : 95,
    }));

    const result = applyAnswerToFactors(
      midFactors,
      'Is there a process for this?',
      'Staff review it.',
      'Staff review it.',
    );

    expect(result.find((f) => f.id === 'process')?.score).toBe(75);
  });

  it('moves process and workflow when an answer covers expiry, renewal, and revocation (regression)', () => {
    const baseline = DISCOVERY_FACTORS.map((f) => ({ id: f.id, label: f.label, score: f.id === 'process' ? 80 : 90 }));
    const question = 'Do permits expire, and if so, is there a renewal process?';
    const answer =
      "Permits expire at the end of each month and staff must renew. The clerk can revoke a permit if it's misused.";

    const result = applyAnswerToFactors(baseline, question, answer, answer);

    expect(result.find((f) => f.id === 'process')?.score).toBeGreaterThan(80);
  });

  it('never lowers a factor, and clamps at 100', () => {
    const highFactors = DISCOVERY_FACTORS.map((f) => ({ id: f.id, label: f.label, score: 98 }));

    const result = applyAnswerToFactors(
      highFactors,
      'Review?',
      'Staff review each renewal.',
      'Staff review each renewal.',
    );

    expect(result.find((f) => f.id === 'process')?.score).toBe(100);
  });

  it('leaves every factor untouched when neither the question nor the answer matches any keywords', () => {
    const result = applyAnswerToFactors(factors, '42', '42', '42');

    expect(result).toEqual(factors);
  });
});

describe('userEvidence', () => {
  const messages: ConversationMessage[] = [
    { role: 'user', content: 'Officers approve within 10 days.', at: '2026-03-01T10:00:00.000Z' },
    { role: 'assistant', content: 'Who approves above the limit?', at: '2026-03-01T10:00:01.000Z' },
    { role: 'user', content: 'The director.', at: '2026-03-01T10:01:00.000Z' },
  ];

  it('joins the problem and the user messages with newlines', () => {
    expect(userEvidence('Grant intake', messages)).toBe(
      'Grant intake\nOfficers approve within 10 days.\nThe director.',
    );
  });

  it('excludes assistant messages', () => {
    expect(userEvidence('Grant intake', messages)).not.toContain('Who approves');
  });

  it('returns only the problem when there are no messages', () => {
    expect(userEvidence('Grant intake', [])).toBe('Grant intake');
  });
});

describe('allUserEvidence', () => {
  it('combines the problem, discovery messages, conversation, and answered questions', () => {
    const state = makeState({
      problemStatement: 'Grant intake',
      discovery: {
        messages: [{ role: 'user', content: 'Officers review each case.', at: '2026-03-01T10:00:00.000Z' }],
        confidence: 0,
        threshold: DISCOVERY_THRESHOLD,
        factors: [],
        ready: false,
        mode: 'ai',
        updatedOn: '2026-03-01T10:00:00.000Z',
      },
      conversation: [{ role: 'user', content: 'There is also a committee vote.', at: '2026-03-01T10:01:00.000Z' }],
      questions: [
        { id: 'q-1', question: 'What formats are required?', raisedBy: 'ai', status: 'answered', answer: 'PDF only.' },
        { id: 'q-2', question: 'Still open?', raisedBy: 'ai', status: 'open' },
      ],
    });

    const evidence = allUserEvidence(state);

    expect(evidence).toContain('Grant intake');
    expect(evidence).toContain('Officers review each case.');
    expect(evidence).toContain('There is also a committee vote.');
    expect(evidence).toContain('PDF only.');
    expect(evidence).toContain('What formats are required?');
  });

  it('excludes unanswered questions and assistant messages', () => {
    const state = makeState({
      conversation: [{ role: 'assistant', content: 'Who approves above the limit?', at: '2026-03-01T10:00:00.000Z' }],
      questions: [{ id: 'q-1', question: 'Still open?', raisedBy: 'ai', status: 'open' }],
    });

    const evidence = allUserEvidence(state);

    expect(evidence).not.toContain('Who approves above the limit?');
    expect(evidence).not.toContain('Still open?');
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

    expect(reply).toContain("I'm 20% confident so far (I need 75% to propose a solution)");
  });

  it('asks the question for the weakest factor first', () => {
    const reply = ruleDiscoveryReply([factor('problem', 30), factor('users', 5)], 18, false);

    expect(reply).toContain(`1. ${DISCOVERY_FACTORS.find((f) => f.id === 'users')?.question}`);
  });

  it('omits questions for factors at or above the threshold', () => {
    const reply = ruleDiscoveryReply([factor('problem', 80), factor('users', 5)], 28, false);

    expect(reply).not.toContain(DISCOVERY_FACTORS.find((f) => f.id === 'problem')?.question);
  });

  it('asks at most four questions', () => {
    const factors = DISCOVERY_FACTORS.map((f) => factor(f.id, 0));

    const reply = ruleDiscoveryReply(factors, 0, false);

    expect(reply).not.toContain('5. ');
  });

  it('asks for the data classification level', () => {
    expect(ruleDiscoveryReply([factor('constraints', 0)], 0, false)).toContain(
      'Public, Protected A, Protected B or Protected C',
    );
  });

  it('skips factors that are not discovery factors', () => {
    const reply = ruleDiscoveryReply([factor('budget', 0)], 0, false);

    expect(reply.endsWith('please tell me:\n')).toBe(true);
  });
});

describe('isQuestionCovered', () => {
  it('is covered when most of its distinctive words already appear in the evidence', () => {
    const question = 'Who approves grants above the delegated limit?';
    const evidence = 'The director approves grants above the delegated limit for large requests.';

    expect(isQuestionCovered(question, evidence)).toBe(true);
  });

  it('is not covered when the evidence is unrelated', () => {
    const question = 'Who approves grants above the delegated limit?';
    const evidence = 'Applicants upload a photo for identification.';

    expect(isQuestionCovered(question, evidence)).toBe(false);
  });

  it('is not covered when only a weak minority of words match', () => {
    const question = 'Are reminders needed, and through which channels?';
    const evidence = 'Staff review each application and approve it.';

    expect(isQuestionCovered(question, evidence)).toBe(false);
  });

  it('is never covered when the question has fewer than two distinctive words', () => {
    expect(isQuestionCovered('Is it urgent?', 'This is extremely urgent and time sensitive.')).toBe(false);
  });
});

describe('areSimilarQuestions', () => {
  it('matches two differently-worded questions about the same topic (regression)', () => {
    const q1 = 'Do permits expire, and if so, is there a renewal process?';
    const q5 = 'Do these permits expire after a certain period, or do they need to be renewed annually?';

    expect(areSimilarQuestions(q1, q5)).toBe(true);
  });

  it('is not similar when the questions cover different topics', () => {
    const a = 'Do permits expire, and if so, is there a renewal process?';
    const b = 'Who needs to be notified when an application is approved?';

    expect(areSimilarQuestions(a, b)).toBe(false);
  });

  it('is never similar when either question has fewer than two distinctive words', () => {
    expect(areSimilarQuestions('Is it urgent?', 'Is it urgent and time sensitive right now?')).toBe(false);
  });
});

describe('dedupeOpenQuestions', () => {
  const grantA = {
    id: 'q-1',
    question: 'Is the grant payment triggered automatically by the system or does it require manual approval?',
    status: 'open',
  };
  const grantB = {
    id: 'q-2',
    question: 'Who is responsible for triggering the grant payment in the financial system—automatic or manual?',
    status: 'open',
  };
  const unrelated = {
    id: 'q-3',
    question: 'Who needs to be notified when an application is approved?',
    status: 'open',
  };

  it('drops a later open question that duplicates an earlier open one, keeping the earlier phrasing', () => {
    const result = dedupeOpenQuestions([grantA, grantB, unrelated]);

    expect(result).toEqual([grantA, unrelated]);
  });

  it('drops an open question that duplicates an already-answered question', () => {
    const answered = { ...grantA, status: 'answered', answer: 'Automatic.' };

    const result = dedupeOpenQuestions([answered, grantB, unrelated]);

    expect(result).toEqual([answered, unrelated]);
  });

  it('keeps unrelated open questions untouched', () => {
    const result = dedupeOpenQuestions([grantA, unrelated]);

    expect(result).toEqual([grantA, unrelated]);
  });

  it('never drops non-open questions', () => {
    const inferred = { ...unrelated, status: 'inferred' };

    const result = dedupeOpenQuestions([inferred, inferred]);

    expect(result).toEqual([inferred, inferred]);
  });
});
