import { CapabilityCatalog, CatalogService, KnownGap } from './catalog';

export type Fit = 'strong' | 'partial' | 'weak';

export interface ServiceMatch {
  service: CatalogService;
  fit: Fit;
  score: number;
  /** The catalog sentence that best explains the match. */
  reason: string;
}

export interface NeedResult {
  need: string;
  matches: ServiceMatch[];
  /** True when no service is a strong fit, or more than one is: the agent should ask the user instead of choosing. */
  ask: boolean;
  /** What to ask the user when `ask` is true. */
  fitQuestions: string[];
  /** Set when no service fits the need. */
  noMatch?: { reason: string; knownGap?: Omit<KnownGap, 'keywords'> };
}

// prettier-ignore
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'how', 'do', 'does', 'i', 'what',
  'with', 'from', 'this', 'that', 'it', 'be', 'by', 'as', 'at', 'their', 'they', 'them', 'when', 'who', 'which',
  'can', 'may', 'should', 'any', 'each', 'its', 'into', 'before', 'after', 'than', 'not', 'out', 'up', 'so', 'has',
  'have', 'will', 'was', 'were', 'such', 'our', 'your', 'we', 'us', 'need', 'needs', 'want', 'let', 'lets',
]);

const SUFFIXES = ['ations', 'ation', 'ings', 'ing', 'ies', 'ers', 'er', 'ed', 'es', 's'];

/**
 * A crude stem, so "attach", "attached" and "attaching" meet. A final "e" is dropped too, so "certificate",
 * "certificates" and "updated" meet "certificat" and "updat". Short words are left alone.
 */
export function stem(word: string): string {
  const suffix = SUFFIXES.find((candidate) => word.length > candidate.length + 3 && word.endsWith(candidate));
  const base = suffix ? word.slice(0, -suffix.length) + (suffix === 'ies' ? 'y' : '') : word;
  return base.length > 4 && base.endsWith('e') ? base.slice(0, -1) : base;
}

export function terms(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => !STOP_WORDS.has(word)).map(stem);
}

// How much a query term found in each part of a service's entry counts. The index line and the specialist's purpose
// say what the service is for; pattern reasons say what it is used for in a kind of product; questions and risks are
// weaker evidence. The pattern boost credits services a matching pattern maps, for needs worded in the pattern's
// domain language rather than the service's.
const FIELD_WEIGHTS = { use: 3, purpose: 3, reasons: 1.5, fitQuestions: 1, risks: 0.5 } as const;
const PATTERN_BOOST = 0.5;

// Fit is relative to the best match for the same need, so it does not depend on how long the need is. A strong fit
// must also account for enough of the need's own words: matching on one shared word, such as "model" or "time", is
// not enough evidence to choose without asking. A best match below MIN_SCORE is no match at all.
const STRONG_RATIO = 0.75;
const PARTIAL_RATIO = 0.4;
const STRONG_COVERAGE = 0.3;
const MIN_SCORE = 4;
const MAX_MATCHES = 5;

type Field = keyof typeof FIELD_WEIGHTS;

interface IndexedService {
  service: CatalogService;
  fields: Record<Field, Map<string, number>>;
  /** Every term in the service's own entry, for coverage. */
  vocabulary: Set<string>;
  /** Sentences that can explain a match, in preference order. */
  explanations: string[];
}

interface IndexedPattern {
  vocabulary: Set<string>;
  reasons: { service: string; terms: Set<string> }[];
}

function counts(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) map.set(token, (map.get(token) ?? 0) + 1);
  return map;
}

/** Ranks ADSP services for product needs over the capability catalog. Deterministic, and makes no calls. */
export class ServiceFinder {
  private readonly services: IndexedService[];
  private readonly patterns: IndexedPattern[];
  private readonly knownGaps: KnownGap[];
  private readonly idf = new Map<string, number>();
  /** A term no service mentions still counts as rare, so it scores in patterns. */
  private readonly maxIdf: number;

  constructor(catalog: CapabilityCatalog) {
    this.services = catalog.services.map((service) => {
      const fields = {
        use: counts(terms(service.use)),
        purpose: counts(terms(service.purpose ?? '')),
        reasons: counts(terms(service.patterns.map(({ reason }) => reason).join(' '))),
        fitQuestions: counts(terms(service.fitQuestions.join(' '))),
        risks: counts(terms(service.risks.join(' '))),
      };
      return {
        service,
        fields,
        vocabulary: new Set(Object.values(fields).flatMap((field) => [...field.keys()])),
        explanations: [service.use, ...(service.purpose ? [service.purpose] : []), ...service.patterns.map(({ reason }) => reason)],
      };
    });

    const documentFrequency = new Map<string, number>();
    for (const { vocabulary } of this.services) {
      for (const term of vocabulary) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
    const total = this.services.length;
    for (const [term, frequency] of documentFrequency) this.idf.set(term, Math.log(1 + total / frequency));
    this.maxIdf = Math.log(1 + total);

    this.patterns = catalog.patterns.map((pattern) => ({
      vocabulary: new Set(
        terms([pattern.name, ...pattern.domainLanguage, ...pattern.signals, ...pattern.commonFeatures].join(' ')),
      ),
      reasons: catalog.services.flatMap(({ id, patterns }) =>
        patterns.filter((mapping) => mapping.pattern === pattern.id).map(({ reason }) => ({ service: id, terms: new Set(terms(reason)) })),
      ),
    }));

    const gaps = new Map<string, KnownGap>();
    for (const gap of catalog.patterns.flatMap(({ unsupported }) => unsupported)) gaps.set(gap.requirement, gap);
    this.knownGaps = [...gaps.values()];
  }

  private weight(term: string): number {
    return this.idf.get(term) ?? this.maxIdf;
  }

  private patternBoost(query: Set<string>): Map<string, number> {
    const boost = new Map<string, number>();
    for (const { vocabulary, reasons } of this.patterns) {
      const patternScore = [...query].filter((term) => vocabulary.has(term)).reduce((sum, term) => sum + this.weight(term), 0);
      if (patternScore === 0) continue;
      for (const { service, terms: reasonTerms } of reasons) {
        const overlap = [...query].filter((term) => reasonTerms.has(term)).length;
        if (overlap > 0) boost.set(service, (boost.get(service) ?? 0) + patternScore * overlap);
      }
    }
    return boost;
  }

  private explain({ explanations }: IndexedService, query: Set<string>): string {
    let best = explanations[0];
    let bestOverlap = 0;
    for (const sentence of explanations) {
      const overlap = new Set(terms(sentence).filter((term) => query.has(term))).size;
      if (overlap > bestOverlap) {
        best = sentence;
        bestOverlap = overlap;
      }
    }
    return best;
  }

  private knownGap(need: string): KnownGap | undefined {
    const text = need.toLowerCase();
    return this.knownGaps.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword.toLowerCase())));
  }

  find(need: string): NeedResult {
    const query = new Set(terms(need));
    const boost = this.patternBoost(query);

    const scored = this.services
      .map((indexed) => {
        let score = PATTERN_BOOST * (boost.get(indexed.service.id) ?? 0);
        for (const field of Object.keys(FIELD_WEIGHTS) as Field[]) {
          for (const term of query) {
            const count = indexed.fields[field].get(term);
            if (count) score += FIELD_WEIGHTS[field] * this.weight(term) * (1 + Math.log(count));
          }
        }
        return { indexed, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.indexed.service.id.localeCompare(b.indexed.service.id));

    const best = scored[0]?.score ?? 0;
    const gap = this.knownGap(need);
    if (best < MIN_SCORE) {
      return {
        need,
        matches: [],
        ask: false,
        fitQuestions: [],
        noMatch: {
          reason: gap?.reason ?? 'No ADSP service in the catalog covers this need.',
          ...(gap && { knownGap: { requirement: gap.requirement, reason: gap.reason, suggestedApproach: gap.suggestedApproach } }),
        },
      };
    }

    const matches: ServiceMatch[] = scored.slice(0, MAX_MATCHES).map(({ indexed, score }) => {
      const coverage = [...query].filter((term) => indexed.vocabulary.has(term)).length / query.size;
      const fit: Fit =
        score >= STRONG_RATIO * best && coverage >= STRONG_COVERAGE ? 'strong' : score >= PARTIAL_RATIO * best ? 'partial' : 'weak';
      return { service: indexed.service, score: Math.round(score * 10) / 10, fit, reason: this.explain(indexed, query) };
    });
    const strong = matches.filter(({ fit }) => fit === 'strong');
    const ask = strong.length !== 1;
    return {
      need,
      matches,
      ask,
      fitQuestions: ask ? fitQuestions(matches.filter(({ fit }) => fit !== 'weak')) : [],
      ...(gap && {
        noMatch: {
          reason: `Part of this need is a known gap: ${gap.reason}`,
          knownGap: { requirement: gap.requirement, reason: gap.reason, suggestedApproach: gap.suggestedApproach },
        },
      }),
    };
  }
}

/** The questions that tell the candidates apart: each candidate's own fit questions, or what it is used for. */
function fitQuestions(candidates: ServiceMatch[]): string[] {
  const questions = candidates.flatMap(({ service }) =>
    service.fitQuestions.length > 0 ? service.fitQuestions : [`Is this a need to ${lowerFirst(service.use.replace(/\.$/, ''))} (${service.id})?`],
  );
  return [...new Set(questions)];
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
