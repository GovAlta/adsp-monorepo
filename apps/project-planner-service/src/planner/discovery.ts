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
    keywords: [/\b(goal|objective|outcome|need|problem|reduce|improve|replace|manual|paper|delay|backlog)\b/i, /\b(success|measure|target|kpi)\b/i],
  },
  {
    id: 'users',
    label: 'Users and roles',
    question: 'Who will use this (applicants, staff, reviewers, managers) and what can each of them do?',
    keywords: [/\b(applicant|citizen|public|client|customer|staff|reviewer|analyst|officer|manager|admin|approver|operator|municipalit)\w*/i, /\b(role|permission|access|team|ministry|department)\b/i],
  },
  {
    id: 'process',
    label: 'Process and workflow',
    question: 'What are the steps from start to finish, including reviews, approvals and what happens on rejection?',
    keywords: [/\b(review|approve|approval|reject|decision|assign|escalat|renew|submit|intake|triage|investigat|schedule|inspect)\w*/i, /\b(status|step|stage|workflow|process|lifecycle)\b/i],
  },
  {
    id: 'information',
    label: 'Information and documents',
    question: 'What information is collected, which documents or files are involved, and how long must records be kept?',
    keywords: [/\b(form|field|data|record|document|file|upload|attachment|certificate|letter|report|pdf)\w*/i, /\b(retain|retention|history|audit|store)\w*/i],
  },
  {
    id: 'communication',
    label: 'Notifications and visibility',
    question: 'Who needs to be notified of what, and should applicants be able to track progress?',
    keywords: [/\b(notif|email|sms|alert|remind|subscribe|announce)\w*/i, /\b(track|dashboard|portal|visibility|status page)\b/i],
  },
  {
    id: 'constraints',
    label: 'Constraints and integrations',
    question: 'Are there privacy, security, volume, deadline or integration (existing systems) constraints we must respect?',
    keywords: [/\b(privacy|foip|pia|security|confidential|sensitive|personal information|compliance|legislation|policy)\b/i, /\b(integrat|existing system|legacy|api|volume|per year|per month|deadline|budget)\w*/i],
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
export function normalizeFactors(reported: { id: string; score: number; note?: string }[], userText: string): ConfidenceFactor[] {
  const fallback = ruleAssess(userText);
  return fallback.map((base) => {
    const found = reported.find((r) => r.id === base.id);
    return found ? { ...base, score: clamp(found.score), note: found.note || undefined } : base;
  });
}

// What the user has said so far, used as the evidence for rule-based scoring.
export const userEvidence = (problem: string, messages: ConversationMessage[]): string =>
  [problem, ...messages.filter((m) => m.role === 'user').map((m) => m.content)].join('\n');

// Discovery factors (model-assessed) win when present; otherwise score everything the user has written.
export function assessConfidence(state: SolutionState): NonNullable<SolutionState['confidence']> {
  const factors =
    state.discovery?.factors ??
    ruleAssess(userEvidence(state.problemStatement, [...(state.conversation || [])]));
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
