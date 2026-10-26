import { ConfidenceFactor, ConversationMessage, SolutionState } from './types';

// The solution is presented once overall confidence reaches this percentage.
export const DISCOVERY_THRESHOLD = 50;

interface FactorDefinition {
  id: string;
  label: string;
  question: string;
  keywords: RegExp[];
}

export const DISCOVERY_FACTORS: FactorDefinition[] = [
  {
    id: 'problem',
    label: 'Problem and goals',
    question: 'What is the main problem or goal, and what does success look like?',
    keywords: [
      /\b(goal|objective|outcome|need|problem|reduce|improve|replace|manual|paper|delay|backlog)\b/i,
      /\b(success|measure|target|kpi)\b/i,
    ],
  },
  {
    id: 'users',
    label: 'Users and roles',
    question: 'Who will use this (applicants, staff, reviewers, managers) and what can each of them do?',
    keywords: [
      /\b(applicant|citizen|public|client|customer|staff|reviewer|analyst|officer|manager|admin|approver|operator|municipalit)\w*/i,
      /\b(role|permission|access|team|ministry|department)\b/i,
    ],
  },
  {
    id: 'process',
    label: 'Process and workflow',
    question: 'What are the steps from start to finish, including reviews, approvals and what happens on rejection?',
    keywords: [
      /\b(review|approve|approval|reject|decision|assign|escalat|renew|submit|intake|triage|investigat|schedule|inspect)\w*/i,
      /\b(status|step|stage|workflow|process|lifecycle|expir|revoke|cancel|suspend|deadline|annual|month|waitlist|on hold)\w*/i,
    ],
  },
  {
    id: 'information',
    label: 'Information and documents',
    question:
      'What information is collected, which documents or files are involved, and how long must records be kept?',
    keywords: [
      /\b(form|field|data|record|document|file|upload|attachment|certificate|letter|report|pdf)\w*/i,
      /\b(retain|retention|history|audit|store)\w*/i,
    ],
  },
  {
    id: 'communication',
    label: 'Notifications and visibility',
    question: 'Who needs to be notified of what, and should applicants be able to track progress?',
    keywords: [
      /\b(notif|email|sms|alert|remind|subscribe|announce)\w*/i,
      /\b(track|dashboard|portal|visibility|status page)\b/i,
    ],
  },
  {
    id: 'constraints',
    label: 'Constraints and integrations',
    question:
      'Are there privacy, security, volume, deadline or integration (existing systems) constraints we must respect?',
    keywords: [
      /\b(privacy|foip|pia|security|confidential|sensitive|personal information|compliance|legislation|policy)\b/i,
      /\b(integrat|existing system|legacy|api|volume|per year|per month|deadline|budget|inventory|spreadsheet|excel|asset|import|export|migrat)\w*/i,
    ],
  },
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));

export const computeConfidence = (factors: ConfidenceFactor[]): number =>
  factors.length ? clamp(factors.reduce((sum, f) => sum + f.score, 0) / factors.length) : 0;

// Rule-based assessment: each factor scores by how many of its keyword groups appear in what the user has said.
export function ruleAssess(userText: string): ConfidenceFactor[] {
  const words = userText.trim().split(/\s+/).filter(Boolean).length;
  return DISCOVERY_FACTORS.map((f) => {
    const hits = f.keywords.filter((k) => k.test(userText)).length;
    const lengthBonus = f.id === 'problem' ? Math.min(40, words) : 0;
    return {
      id: f.id,
      label: f.label,
      score: clamp((hits / f.keywords.length) * 80 + lengthBonus),
      note: hits ? undefined : 'Not described yet.',
    };
  });
}

// Merges model-reported scores with the factor list; anything the model skipped falls back to the rule score.
export function normalizeFactors(
  reported: { id: string; score: number; note?: string }[],
  userText: string,
): ConfidenceFactor[] {
  const fallback = ruleAssess(userText);
  return fallback.map((base) => {
    const found = reported.find((r) => r.id === base.id);
    return found ? { ...base, score: clamp(found.score), note: found.note || undefined } : base;
  });
}

export const OPEN_QUESTIONS_CAP = 90;

export const capFactors = (factors: ConfidenceFactor[], hasOpenQuestions: boolean): ConfidenceFactor[] =>
  hasOpenQuestions ? factors.map((f) => ({ ...f, score: Math.min(f.score, OPEN_QUESTIONS_CAP) })) : factors;

const relevantFactorIds = (text: string): Set<string> =>
  new Set(DISCOVERY_FACTORS.filter((f) => f.keywords.some((k) => k.test(text))).map((f) => f.id));

const ANSWER_BUMP = 5;

export function applyAnswerToFactors(
  factors: ConfidenceFactor[],
  question: string,
  answer: string,
  evidence: string,
): ConfidenceFactor[] {
  const relevant = new Set([...relevantFactorIds(question), ...relevantFactorIds(answer)]);
  if (relevant.size === 0) {
    return factors;
  }
  const fresh = ruleAssess(evidence);
  return factors.map((f) => {
    if (!relevant.has(f.id)) {
      return f;
    }
    const freshScore = fresh.find((r) => r.id === f.id)?.score ?? f.score;
    return { ...f, score: clamp(Math.max(f.score + ANSWER_BUMP, freshScore)) };
  });
}

// What the user has said so far, used as the evidence for rule-based scoring.
export const userEvidence = (problem: string, messages: ConversationMessage[]): string =>
  [problem, ...messages.filter((m) => m.role === 'user').map((m) => m.content)].join('\n');

export const allUserEvidence = (state: SolutionState): string =>
  [
    userEvidence(state.problemStatement, [...(state.discovery?.messages || []), ...(state.conversation || [])]),
    ...state.questions
      .filter((q) => q.status === 'answered')
      .flatMap((q) => [q.question, q.answer].filter(Boolean) as string[]),
  ].join('\n');

// Discovery factors (model-assessed) win when present; otherwise score everything the user has written.
export function assessConfidence(state: SolutionState): NonNullable<SolutionState['confidence']> {
  const factors =
    state.discovery?.factors ?? ruleAssess(userEvidence(state.problemStatement, [...(state.conversation || [])]));
  return { score: computeConfidence(factors), threshold: DISCOVERY_THRESHOLD, factors };
}

// One message with the most valuable remaining questions, weakest factors first.
export function ruleDiscoveryReply(factors: ConfidenceFactor[], confidence: number, ready: boolean): string {
  if (ready) {
    return `Thanks — I now have enough to propose a solution (confidence ${confidence}%). It is shown alongside; keep refining it in the conversation, or consult a specialist.`;
  }
  const weakest = [...factors]
    .sort((a, b) => a.score - b.score)
    .filter((f) => f.score < DISCOVERY_THRESHOLD)
    .slice(0, 4)
    .map((f) => DISCOVERY_FACTORS.find((d) => d.id === f.id)?.question)
    .filter(Boolean);
  return `I'm ${confidence}% confident so far (I need ${DISCOVERY_THRESHOLD}% to propose a solution). To get there, please tell me:\n${weakest.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
}

const STOPWORDS = new Set([
  'about',
  'after',
  'also',
  'before',
  'been',
  'could',
  'does',
  'each',
  'from',
  'have',
  'into',
  'need',
  'needs',
  'only',
  'should',
  'that',
  'their',
  'there',
  'they',
  'this',
  'what',
  'when',
  'which',
  'will',
  'with',
  'would',
  'your',
]);

const significantWords = (text: string): string[] =>
  (text.toLowerCase().match(/[a-z]{4,}/g) || []).filter((word) => !STOPWORDS.has(word));

const stem = (word: string): string => word.slice(0, 5);

export function isQuestionCovered(question: string, evidence: string): boolean {
  const words = significantWords(question);
  if (words.length < 2) {
    return false;
  }
  const evidenceStems = new Set(significantWords(evidence).map(stem));
  const covered = words.filter((word) => evidenceStems.has(stem(word))).length;
  return covered / words.length >= 0.75;
}

export function areSimilarQuestions(a: string, b: string): boolean {
  const wordsA = new Set(significantWords(a).map(stem));
  const wordsB = new Set(significantWords(b).map(stem));
  if (wordsA.size < 2 || wordsB.size < 2) {
    return false;
  }
  const shared = [...wordsA].filter((word) => wordsB.has(word)).length;
  return shared / Math.min(wordsA.size, wordsB.size) >= 0.5;
}

export function dedupeOpenQuestions<T extends { question: string; status: string }>(questions: T[]): T[] {
  const canonicalTexts = questions.filter((q) => q.status !== 'open').map((q) => q.question);
  return questions.filter((q) => {
    if (q.status !== 'open') {
      return true;
    }
    if (canonicalTexts.some((kept) => areSimilarQuestions(q.question, kept))) {
      return false;
    }
    canonicalTexts.push(q.question);
    return true;
  });
}
