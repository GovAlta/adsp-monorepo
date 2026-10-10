import { randomUUID as uuidv4 } from 'crypto';
import {
  BusinessConcept,
  BusinessPattern,
  ConceptType,
  ConfidenceLevel,
  Hypothesis,
  NextStep,
  PatternMatch,
  SolutionState,
} from './types';
import { getSpecialist, SPECIALISTS } from './specialists';

const STRONG_WEIGHT = 2;
const HIGH_THRESHOLD = 8;
const MEDIUM_THRESHOLD = 4;

const normalize = (text: string) => text.toLowerCase();

const containsTerm = (text: string, term: string) => {
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(s|es|ed|ing)?([^a-z0-9]|$)`).test(text);
};

const levelFor = (score: number): ConfidenceLevel =>
  score >= HIGH_THRESHOLD ? 'high' : score >= MEDIUM_THRESHOLD ? 'medium' : 'low';

/**
 * Scores a problem description against patterns. Domain language counts 1, strong signals count 2.
 * Weak signals never add to the score; they are only reported by callers as insufficient evidence.
 */
export function matchPatterns(text: string, patterns: BusinessPattern[]): PatternMatch[] {
  const normalized = normalize(text || '');
  return patterns
    .map((pattern): PatternMatch => {
      const matchedLanguage = pattern.domainLanguage.filter((term) => containsTerm(normalized, term));
      const matchedSignals = pattern.strongSignals
        .filter((signal) => signal.keywords.some((k) => containsTerm(normalized, k)))
        .map((signal) => signal.description);
      const score = matchedLanguage.length + matchedSignals.length * STRONG_WEIGHT;
      const level = levelFor(score);
      return {
        patternId: pattern.id,
        patternName: pattern.name,
        score,
        level,
        matchedLanguage,
        matchedSignals,
        explanation:
          score === 0
            ? 'No domain language or signals matched.'
            : `Matched ${matchedLanguage.length} domain term(s) and ${matchedSignals.length} strong signal(s); ${level} confidence.`,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

const CONCEPT_CUES: { type: ConceptType; cues: RegExp }[] = [
  { type: 'actor', cues: /\b(applicants?|staff|reviewers?|analysts?|citizens?|public|managers?|inspectors?|administrators?)\b/gi },
  { type: 'document', cues: /\b(forms?|documents?|certificates?|letters?|reports?|attachments?|licen[cs]es?)\b/gi },
  { type: 'event', cues: /\b(submitted|approved|rejected|escalated|assigned|expired|renewed)\b/gi },
  { type: 'external-system', cues: /\b(sap|peoplesoft|salesforce|legacy system|external system|api)\b/gi },
  { type: 'constraint', cues: /\b(deadline|must|privacy|retention|statutory|within \d+ days)\b/gi },
  { type: 'workflow', cues: /\b(workflow|process|lifecycle|status(?:es)?|stages?)\b/gi },
];

/** Heuristic extraction of business concepts from free text; users refine the result. */
export function extractConcepts(text: string, existing: BusinessConcept[] = []): BusinessConcept[] {
  const known = new Set(existing.map((c) => `${c.type}:${c.name.toLowerCase()}`));
  const extracted: BusinessConcept[] = [];
  for (const { type, cues } of CONCEPT_CUES) {
    for (const match of (text || '').match(cues) || []) {
      const name = match.toLowerCase();
      const key = `${type}:${name}`;
      if (!known.has(key)) {
        known.add(key);
        extracted.push({ id: uuidv4(), type, name, source: 'extracted', confidence: 0.5 });
      }
    }
  }
  return extracted;
}

export function buildHypotheses(matches: PatternMatch[], patterns: BusinessPattern[], limit = 3): Hypothesis[] {
  return matches.slice(0, limit).map((match) => {
    const pattern = patterns.find((p) => p.id === match.patternId);
    const recommendations = (pattern?.serviceMappings || [])
      .map((mapping) => ({
        service: mapping.service,
        reason: mapping.reason,
        order: getSpecialist(mapping.service)?.order ?? SPECIALISTS.length + 1,
      }))
      .sort((a, b) => a.order - b.order);
    return {
      id: uuidv4(),
      title: `${match.patternName} solution`,
      patternId: match.patternId,
      confidence: match.level,
      rationale:
        `This looks like a ${match.patternName} problem. ${match.explanation} ` +
        `Matched terms: ${[...match.matchedLanguage, ...match.matchedSignals].join(', ') || 'none'}.`,
      recommendations,
      assumptions: pattern?.assumptions || [],
      unknowns: pattern?.knownUnknowns || [],
    };
  });
}

export function buildNextSteps(state: SolutionState): NextStep[] {
  const steps: NextStep[] = [];
  const open = state.questions.filter((q) => q.status === 'open');
  if (open.length > 0) {
    steps.push({ title: `Answer ${open.length} open question(s)`, reason: 'Open questions limit confidence.' });
  }
  const hypothesis = state.hypotheses[0];
  if (hypothesis) {
    const pending = hypothesis.recommendations.filter((r) => {
      const progress = state.specialists.find((s) => s.service === r.service);
      return !progress || progress.status === 'not-started';
    });
    for (const rec of pending.slice(0, 3)) {
      steps.push({ title: `Consult ${rec.service}`, service: rec.service, reason: rec.reason });
    }
  }
  if (steps.length === 0 && state.hypotheses.length === 0) {
    steps.push({ title: 'Analyze the problem statement', reason: 'No hypotheses yet.' });
  }
  return steps;
}

export interface ConsultResult {
  service: string;
  fit: 'recommended' | 'optional' | 'not-indicated';
  reason: string;
  questions: string[];
  dependencies: { service: string; satisfied: boolean }[];
  risks: string[];
}

export function consultSpecialist(state: SolutionState, service: string): ConsultResult | undefined {
  const specialist = getSpecialist(service);
  if (!specialist) {
    return undefined;
  }
  const recommendation = state.hypotheses.flatMap((h) => h.recommendations).find((r) => r.service === specialist.service);
  const recommended = new Set(state.hypotheses.flatMap((h) => h.recommendations.map((r) => r.service)));
  return {
    service: specialist.service,
    fit: recommendation ? 'recommended' : state.hypotheses.length > 0 ? 'not-indicated' : 'optional',
    reason: recommendation?.reason || specialist.purpose,
    questions: specialist.questions,
    dependencies: specialist.dependsOn.map((dependency) => ({ service: dependency, satisfied: recommended.has(dependency) })),
    risks: specialist.risks,
  };
}
